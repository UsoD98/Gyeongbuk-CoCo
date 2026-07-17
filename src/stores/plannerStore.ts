import { create } from 'zustand';

import type { CoursePlace, CreateCourseResponse } from '@/api/tourCourse.ts';
import { CATEGORIES, poiById } from '@/mocks/planner.ts';
import { toast } from '@/stores/toastStore.ts';
import type { Course, CourseDay, Poi, PoiCat } from '@/types/planner.ts';

/**
 * 플래너 단일 도메인 스토어.
 * 결과·코스·예산 패널이 모두 이 스토어를 구독한다 → 한 곳을 바꾸면 전 패널이 즉시 갱신.
 * 예산은 저장하지 않고 course+pax+overrides 에서 파생 계산한다(@/utils/budget).
 *
 * 코스 데이터 출처: 홈 검색 → createCourse(GBC010) → loadFromApi 주입.
 * 부팅 시 목업 코스를 싣던 로직은 S1에서 제거했다(코스는 생성 흐름으로만 채워진다).
 *
 * 표시 전용 상태(리스트/지도 토글, 카테고리 필터, 모바일 탭, 인라인 편집 여부)는
 * 각 컴포넌트 로컬 state 로 두고 여기에는 두지 않는다.
 */

interface Search {
  dests: string[];
  start: string;
  end: string;
  pax: number;
  themes: string[];
}

interface Drawer {
  open: boolean;
  poiId: string | null;
}

/**
 * loadFromApi 가 함께 받는 검색 컨텍스트.
 * 생성 응답(courseId + schedule)엔 제목·지역·인원 같은 헤더가 없으므로,
 * 검색 폼 입력값을 넘겨 요약/예산 표시에 사용한다.
 */
export interface LoadFromApiContext {
  title: string;
  dests: string[];
  start: string;
  end: string;
  pax: number;
  themes: string[];
}

interface PlannerState {
  /** 서버 코스 id. 게스트 생성 후 저장(GBC016)·상세(GBC012)에서 사용. 미생성 시 null. */
  courseId: number | null;
  search: Search;
  course: Course;
  /**
   * API 생성 코스의 장소를 UI Poi 로 임시 표현한 레지스트리(key = String(contentId)).
   * 생성 응답엔 이름/가격/좌표가 없어 placeholder 로 채운다 — POI 상세(GBC018) 연동 시 실데이터로 대체.
   */
  apiPois: Record<string, Poi>;
  activeDay: number;
  /** poiId → 사용자가 수정한 금액 */
  overrides: Record<string, number>;
  drawer: Drawer;

  /** poiId → Poi. API 레지스트리 우선, 없으면 목 데이터. 모든 소비처가 이걸로 해석한다. */
  resolvePoi: (id: string) => Poi | undefined;
  /** GBC010 생성 응답을 스토어에 주입(부팅 목업 대체). */
  loadFromApi: (res: CreateCourseResponse, ctx: LoadFromApiContext) => void;

  setSearch: (patch: Partial<Search>) => void;
  setActiveDay: (i: number) => void;
  /** index 가 주어지면 그 위치에 삽입, 없으면 맨 뒤에 추가 */
  addPoi: (poiId: string, index?: number) => void;
  removePoi: (dayIdx: number, poiId: string) => void;
  /** 같은 day 내에서 from → to 로 순서 이동 */
  reorder: (dayIdx: number, from: number, to: number) => void;
  editCost: (poiId: string, val: number) => void;
  resetCost: (poiId: string) => void;
  openDrawer: (poiId: string) => void;
  closeDrawer: () => void;
}

/** 백엔드 PlaceType(실측 7종) → UI PoiCat(4종) 매핑. */
const PLACE_TYPE_TO_CAT: Record<string, PoiCat> = {
  ATTRACTION: 'sight',
  LEPORTS: 'sight',
  SHOPPING: 'sight',
  CULTURE: 'culture',
  EVENT: 'culture',
  ACCOMMODATION: 'stay',
  FOOD: 'food',
};

/**
 * 생성 응답의 장소(seq/time/type/contentId)를 UI Poi placeholder 로 변환.
 * 이름/가격/좌표/평점은 생성 응답에 없어 임시값 — POI 상세(GBC018) 연동 시 실데이터로 대체된다.
 */
function synthesizePoi(place: CoursePlace, region: string): Poi {
  const cat = PLACE_TYPE_TO_CAT[place.type] ?? 'sight';
  const time = place.time?.slice(0, 5) ?? ''; // 'HH:mm:ss' → 'HH:mm'
  return {
    id: String(place.contentId),
    region,
    name: `장소 #${place.contentId}`,
    cat,
    themes: [],
    buckets: [1, 2, '3-4'],
    price: 0,
    priceNote: '정보 준비 중',
    hours: time || '시간 미정',
    rating: 0,
    reviews: 0,
    x: 50,
    y: 50,
    tags: [],
    img: CATEGORIES[cat].label,
    desc: '상세 정보는 준비 중이에요. (POI 연동 예정)',
  };
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  courseId: null,
  search: { dests: [], start: '', end: '', pax: 1, themes: [] },
  course: { title: '', days: [] },
  apiPois: {},
  activeDay: 0,
  overrides: {},
  drawer: { open: false, poiId: null },

  resolvePoi: (id) => get().apiPois[id] ?? poiById(id),

  loadFromApi: (res, ctx) => {
    const apiPois: Record<string, Poi> = {};
    const days: CourseDay[] = res.schedule.map((day, i) => {
      const places = [...day.places].sort((a, b) => a.seq - b.seq);
      const items: string[] = [];
      places.forEach((place) => {
        const key = String(place.contentId);
        apiPois[key] = synthesizePoi(place, ctx.dests[0] ?? '');
        // 하루 내 동일 contentId 중복 방지: items 는 React key·DnD sortable id 로 쓰여
        // 중복되면 key 충돌·재정렬 오작동이 난다(addPoi 의 includes 가드와 동일한 불변식).
        if (!items.includes(key)) items.push(key);
      });
      return { label: `Day ${i + 1}`, items };
    });
    set({
      courseId: res.courseId,
      apiPois,
      course: { title: ctx.title, days },
      search: {
        dests: ctx.dests,
        start: ctx.start,
        end: ctx.end,
        pax: ctx.pax,
        themes: ctx.themes,
      },
      activeDay: 0,
      overrides: {},
      drawer: { open: false, poiId: null },
    });
  },

  setSearch: (patch) => set((s) => ({ search: { ...s.search, ...patch } })),

  setActiveDay: (i) => set({ activeDay: i }),

  addPoi: (poiId, index) => {
    const s = get();
    const day = s.course.days[s.activeDay];
    if (!day) return;
    const poi = s.resolvePoi(poiId);
    if (day.items.includes(poiId)) {
      if (poi) toast.info(`'${poi.name}'은(는) 이미 코스에 있어요`);
      return;
    }
    const items = [...day.items];
    const at =
      index == null ? items.length : Math.max(0, Math.min(index, items.length));
    items.splice(at, 0, poiId);
    set({
      course: {
        ...s.course,
        days: s.course.days.map((d, i) =>
          i === s.activeDay ? { ...d, items } : d,
        ),
      },
    });
    if (poi) toast.success(`'${poi.name}' ${day.label}에 추가`);
  },

  removePoi: (dayIdx, poiId) =>
    set((s) => ({
      course: {
        ...s.course,
        days: s.course.days.map((d, i) =>
          i === dayIdx ? { ...d, items: d.items.filter((x) => x !== poiId) } : d,
        ),
      },
    })),

  reorder: (dayIdx, from, to) =>
    set((s) => ({
      course: {
        ...s.course,
        days: s.course.days.map((d, i) => {
          if (i !== dayIdx) return d;
          if (
            from < 0 ||
            to < 0 ||
            from >= d.items.length ||
            to >= d.items.length ||
            from === to
          )
            return d;
          const items = [...d.items];
          const [moved] = items.splice(from, 1);
          items.splice(to, 0, moved);
          return { ...d, items };
        }),
      },
    })),

  editCost: (poiId, val) =>
    set((s) => ({ overrides: { ...s.overrides, [poiId]: Math.max(0, val) } })),

  resetCost: (poiId) =>
    set((s) => {
      const next = { ...s.overrides };
      delete next[poiId];
      return { overrides: next };
    }),

  openDrawer: (poiId) => set({ drawer: { open: true, poiId } }),
  closeDrawer: () => set((s) => ({ drawer: { ...s.drawer, open: false } })),
}));
