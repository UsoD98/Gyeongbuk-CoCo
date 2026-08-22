import { create } from 'zustand';

import type {
  CourseDetail,
  CoursePlace,
  CourseScheduleDay,
  CreateCourseResponse,
  Transport,
} from '@/api/tourCourse.ts';
import { CATEGORIES } from '@/mocks/planner.ts';
import { toast } from '@/stores/toastStore.ts';
import { isValidTourCoord } from '@/utils/coords.ts';
import { httpsUrl } from '@/utils/format.ts';
import type {
  Course,
  CourseDay,
  LatLng,
  PlaceTimeEdit,
  Poi,
  PoiCat,
} from '@/types/planner.ts';

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
  /** 홈에서 고른 이동수단(생성 요청에 실어 보낸 값과 같은 것). 예산 교통비 추정 기준(F2). */
  transport: Transport;
}

interface PlannerState {
  /** 서버 코스 id. 게스트 생성 후 저장(GBC016)·상세(GBC012)에서 사용. 미생성 시 null. */
  courseId: number | null;
  search: Search;
  /**
   * 코스의 이동수단(F2). 생성(홈 검색 값)·상세 응답에서 주입하고 예산 탭에서 바꿀 수 있다.
   * ⚠️ **서버에 되돌려 보낼 자리가 없다** — GBC020 바디는 `{schedule}` 뿐이고 백엔드에
   * `transport` 수정 경로가 없다(백엔드 소스 실측). 그래서 이 값은 세션 내 계산·표시 전용이고
   * 코스를 다시 불러오면 서버 값으로 되돌아간다. 계약 추적표 #6.
   */
  transport: Transport;
  /**
   * 사용자가 직접 입력한 교통비(총액, F2). null 이면 이동수단 기반 추정치를 쓴다.
   * `overrides`(장소별 금액)와 달리 저장 대상이 아니다 — 백엔드가 교통비를 산정·저장하지
   * 않기로 했고(0.5.9 BU3 취소, 이동 비용은 FE 전담) 실을 필드도 없다.
   */
  transportOverride: number | null;
  course: Course;
  /**
   * API 생성 코스의 장소를 UI Poi 로 임시 표현한 레지스트리(key = String(contentId)).
   * 생성 응답엔 이름/가격/좌표가 없어 placeholder 로 채운다 — POI 상세(GBC018) 연동 시 실데이터로 대체.
   */
  apiPois: Record<string, Poi>;
  /**
   * 큐레이션 목록(GBC017)으로 조회한 POI 카탈로그(key = String(contentId)).
   * `apiPois`와 분리해 둔다 — 코스 로드(`loadFromApi`/`loadDetail`)가 `apiPois`를 통째로
   * 교체하므로, 같은 곳에 두면 브라우즈한 POI가 코스 재로드 때 날아가고
   * 결과 목록에서 담은 장소가 코스·예산 패널에서 해석 불가가 된다.
   */
  poiCatalog: Record<string, Poi>;
  /**
   * 서버에서 받은 **원본 일정**(생성 GBC010 / 상세 GBC012·014 응답의 `schedule` 그대로).
   * UI 코스(`course.days`)는 표시에 필요한 것만 남긴 축약형이라, 코스 수정(GBC020)으로
   * 돌려보낼 때 필요한 원본 필드(날짜·시각·PlaceType·체류시간·썸네일·운영시간)를 잃는다.
   * 그 복원 근거로 응답을 그대로 보관한다(페이로드 조립은 `utils/coursePayload`).
   * ⚠️ 편집해도 갱신하지 않는다 — 편집 결과의 정본은 언제나 `course.days`다.
   */
  baseSchedule: CourseScheduleDay[];
  activeDay: number;
  /** poiId → 사용자가 수정한 금액 */
  overrides: Record<string, number>;
  /**
   * poiId → 사용자가 지정한 방문 시각·체류시간 (F1). 지정하지 않은 장소는 키가 없고,
   * 그 경우 서버 원본(`baseSchedule`)의 시각·체류시간과 타입 기본값을 그대로 쓴다.
   * ⚠️ key 가 poiId 라 같은 장소를 여러 Day 에 담으면 시간도 공유된다(`overrides` 와 같은 규약).
   */
  placeTimes: Record<string, PlaceTimeEdit>;
  /**
   * poiId → 장소명으로 찾은 좌표 (F5). **폴백 전용**이다 — 코스 상세·공개뷰(GBC012·014)가
   * 좌표를 주게 된 뒤(백엔드 0.6.3, 추적표 #8) 남은 공백은 백엔드 POI 캐시 미스로
   * `mapx`/`mapy` 가 null 인 장소뿐이라, 그 장소만 장소명 검색으로 메운다.
   * ⚠️ **코스를 다시 불러도 비우지 않는다** — contentId 별 좌표는 변하지 않는 사실이라 캐시로 둔다.
   */
  placeCoords: Record<string, LatLng>;
  drawer: Drawer;
  /**
   * 서버에 아직 반영하지 않은 편집(추가·제거·재정렬·비용)이 있는지 (GBC020).
   * 코스 로드 시 false 로 시작해 편집 액션에서 true 가 되고, 수정 저장 성공 시
   * `markPristine()` 으로 되돌린다. "변경 저장" 버튼 활성화 조건.
   */
  dirty: boolean;

  /**
   * poiId → Poi. 코스 장소(apiPois) + 카탈로그를 병합해 해석한다.
   * ⚠️ **React 컴포넌트는 이걸 직접 구독하지 말 것** — 함수 참조가 고정이라
   *    `apiPois`/`poiCatalog` 가 갱신돼도 리렌더가 일어나지 않는다(이름이 stale 하게 남는다).
   *    컴포넌트는 `hooks/usePoiResolver` 를 쓴다. 이 필드는 스토어 액션 등 비React 호출부용.
   */
  resolvePoi: (id: string) => Poi | undefined;
  /** 큐레이션 목록 결과를 카탈로그에 병합(GBC017). 같은 contentId 는 최신 값으로 덮어쓴다. */
  registerPois: (pois: Poi[]) => void;
  /** GBC010 생성 응답을 스토어에 주입(부팅 목업 대체). */
  loadFromApi: (res: CreateCourseResponse, ctx: LoadFromApiContext) => void;
  /** GBC012 코스 상세 응답을 스토어에 주입(목록 카드 클릭·URL 재진입). */
  loadDetail: (detail: CourseDetail) => void;

  setSearch: (patch: Partial<Search>) => void;
  /** 코스 제목 변경(GBC015 낙관적 업데이트·롤백용). 서버 반영은 useCourseTitle 이 담당. */
  setTitle: (title: string) => void;
  setActiveDay: (i: number) => void;
  /** index 가 주어지면 그 위치에 삽입, 없으면 맨 뒤에 추가 */
  addPoi: (poiId: string, index?: number) => void;
  removePoi: (dayIdx: number, poiId: string) => void;
  /** 같은 day 내에서 from → to 로 순서 이동 */
  reorder: (dayIdx: number, from: number, to: number) => void;
  editCost: (poiId: string, val: number) => void;
  resetCost: (poiId: string) => void;
  /** 이동수단 변경(F2). 교통비·(F3)이동시간 추정이 즉시 따라온다. */
  setTransport: (transport: Transport) => void;
  /** 교통비를 직접 입력(총액). 음수는 0으로 잘라 넣는다. */
  setTransportOverride: (val: number) => void;
  /** 교통비 직접 입력을 해제하고 추정치로 되돌린다. */
  resetTransportOverride: () => void;
  /** 방문 시각 지정 'HH:mm'(빈 값·형식 불일치는 지정 해제). 순서와 어긋나면 toast 로 알린다. */
  setPlaceTime: (poiId: string, time: string) => void;
  /** 체류시간(분) 지정. 숫자가 아니면 지정 해제. */
  setPlaceDuration: (poiId: string, minutes: number) => void;
  /** 시각·체류시간 지정 해제(서버 원본 값으로 되돌림). */
  resetPlaceTime: (poiId: string) => void;
  /** 장소명으로 찾은 좌표를 등록(F5). 이미 아는 좌표는 덮어쓰지 않는다. */
  setPlaceCoords: (poiId: string, coords: LatLng) => void;
  /** 편집 내용을 서버에 반영 완료로 표시(GBC020 성공 시 `useCourseUpdate` 가 호출). */
  markPristine: () => void;
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

/** 체류시간 상한(분). 하루를 넘기는 입력은 잘라 낸다. */
const MAX_DURATION_MINUTES = 24 * 60;

/** 'HH:mm' 만 통과시킨다. 빈 값·형식 불일치는 "지정 해제"(undefined)로 본다. */
const normalizeTime = (value: string): string | undefined =>
  /^\d{2}:\d{2}$/.test(value) ? value : undefined;

/**
 * 시간 지정 맵에 한 장소의 편집분을 병합한다(F1).
 * 시각·체류시간이 모두 미지정으로 돌아가면 **키를 지운다** — "지정된 장소만 담는다"는
 * 불변식을 지켜 `placeTimes` 가 빈 껍데기 항목으로 불어나지 않게 한다.
 */
function withTimeEdit(
  placeTimes: Record<string, PlaceTimeEdit>,
  poiId: string,
  patch: PlaceTimeEdit,
): Record<string, PlaceTimeEdit> {
  const next = { ...placeTimes };
  const merged: PlaceTimeEdit = { ...next[poiId], ...patch };
  if (merged.time == null && merged.durationMinutes == null) delete next[poiId];
  else next[poiId] = merged;
  return next;
}

/** poiId 의 실효 방문 시각('HH:mm') — 사용자 지정값 우선, 없으면 서버 원본. 없으면 빈 문자열. */
const effectiveTime = (state: PlannerState, poiId: string): string =>
  state.placeTimes[poiId]?.time ?? state.resolvePoi(poiId)?.visitTime ?? '';

/**
 * 방문 시각이 코스 순서와 어긋났으면 알린다(F1).
 * **자동 정렬은 하지 않는다** — 사용자가 의도한 코스 순서를 시각 때문에 덮어쓰지 않기 위해서다.
 * 시각을 모르는 장소는 저장 시 슬롯이 배분되므로 비교에서 제외한다.
 */
function warnIfTimesOutOfOrder(state: PlannerState, poiId: string) {
  const day = state.course.days.find((d) => d.items.includes(poiId));
  if (!day) return;
  const times = day.items
    .map((id) => effectiveTime(state, id))
    .filter((t) => t !== '');
  const outOfOrder = times.some((t, i) => i > 0 && t < times[i - 1]);
  if (outOfOrder) {
    toast.info(
      `${day.label} 방문 시각 순서가 어긋났어요 — 코스 순서는 그대로 저장돼요`,
    );
  }
}

/** 장소명이 없을 때 쓰는 표시명. 병합 시 "이름 미확보"를 정확히 판정하려고 상수화한다. */
export const placeholderPlaceName = (contentId: number | string) =>
  `장소 #${contentId}`;

/**
 * 코스 장소(GBC010 생성 / GBC012·014 상세)를 UI `Poi` 로 변환.
 *
 * 응답이 주는 실데이터(장소명·썸네일·운영시간·1인 비용)를 그대로 싣는다.
 * 좌표(x/y)·평점은 코스 응답에 없어 임시값 — 큐레이션 카탈로그(GBC017)나 POI 상세(P3)가 채운다.
 *
 * 장소명: 상세/공개뷰는 `placeName`, 생성은 `contentName`(백엔드 추가 예정).
 * 둘 다 없으면 `장소 #id` placeholder 를 쓰고, 카탈로그가 있으면 `mergePoi` 가 실명으로 바꾼다.
 */
function synthesizePoi(place: CoursePlace, region: string): Poi {
  const cat = PLACE_TYPE_TO_CAT[place.type] ?? 'sight';
  const visitTime = place.time?.slice(0, 5) ?? ''; // 'HH:mm:ss' → 'HH:mm'
  const name =
    place.placeName?.trim() ||
    place.contentName?.trim() ||
    placeholderPlaceName(place.contentId);
  const cost = place.cost ?? 0;
  // 좌표(백엔드 0.6.3 부터 상세·공개뷰 응답에 온다). 캐시 미스면 null 이라 좌표 없음으로 둔다
  // → `useCourseCoords` 의 장소명 폴백이 그 장소만 메운다. 추적표 #8.
  const hasCoord = isValidTourCoord(place.mapx, place.mapy);
  return {
    id: String(place.contentId),
    region,
    name,
    cat,
    themes: [],
    buckets: [1, 2, '3-4'],
    price: cost,
    priceNote: cost > 0 ? '예상 비용' : '가격 미정',
    hours: place.operatingHours?.trim() ?? '',
    visitTime,
    rating: 0,
    reviews: 0,
    x: 50,
    y: 50,
    lat: hasCoord ? (place.mapy as number) : undefined,
    lng: hasCoord ? (place.mapx as number) : undefined,
    tags: [],
    img: CATEGORIES[cat].label,
    imageUrl: httpsUrl(place.thumbnailImg),
    desc: '',
  };
}

/**
 * 코스 장소(생성/상세 응답)와 큐레이션 카탈로그(GBC017)를 한 Poi 로 합친다.
 *
 * 두 출처가 채우는 칸이 다르다:
 * - 카탈로그(GBC017): 폴백 지도 % 좌표(x/y)·분류(contentTypeId 직결)·장소명
 * - 코스 응답(GBC010/012): 방문 시각·운영시간·1인 비용, 그리고 백엔드가 `contentName` 을
 *   넣어주면 장소명까지
 * - 실경위도(lat/lng): **양쪽 다** 준다(코스는 상세·공개뷰만, 백엔드 0.6.3). 값의 출처가
 *   같은 TourAPI 라 동일하지만, 어느 한쪽이 캐시 미스로 비어 있을 수 있어 있는 쪽을 쓴다.
 *
 * 기본은 카탈로그를 깔고 코스 쪽 값이 **있을 때만** 덮어쓴다(빈 문자열·0 = 정보 없음).
 * 분류(cat)는 카탈로그 기준 — 코스의 `PlaceType`을 섞으면 배지(cat)와 이미지 라벨(img)이 어긋난다.
 *
 * `coords`(F5): 두 출처 모두 좌표가 없을 때만 얹는 장소명 기반 좌표. API 좌표를
 * 덮어쓰지 않는다 — 검색 결과보다 API 좌표가 언제나 정확하다.
 */
export function mergePoi(
  fromCourse: Poi | undefined,
  fromCatalog: Poi | undefined,
  coords?: LatLng,
): Poi | undefined {
  return withCoords(mergeSources(fromCourse, fromCatalog), coords);
}

/** 좌표가 비어 있을 때만 채운다. */
function withCoords(poi: Poi | undefined, coords?: LatLng): Poi | undefined {
  if (!poi || !coords || poi.lat != null) return poi;
  return { ...poi, lat: coords.lat, lng: coords.lng };
}

function mergeSources(
  fromCourse: Poi | undefined,
  fromCatalog: Poi | undefined,
): Poi | undefined {
  if (!fromCourse) return fromCatalog;
  if (!fromCatalog) return fromCourse;
  const courseHasName =
    fromCourse.name !== placeholderPlaceName(fromCourse.id);
  // 좌표는 **쌍으로** 고른다 — lat 은 한쪽, lng 은 다른 쪽에서 집으면 엉뚱한 지점이 된다.
  const coordSource = fromCatalog.lat != null ? fromCatalog : fromCourse;
  return {
    ...fromCatalog,
    lat: coordSource.lat,
    lng: coordSource.lng,
    name: courseHasName ? fromCourse.name : fromCatalog.name,
    price: fromCourse.price || fromCatalog.price,
    priceNote: fromCourse.price ? fromCourse.priceNote : fromCatalog.priceNote,
    hours: fromCourse.hours || fromCatalog.hours,
    imageUrl: fromCourse.imageUrl ?? fromCatalog.imageUrl,
    visitTime: fromCourse.visitTime,
  };
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  courseId: null,
  search: { dests: [], start: '', end: '', pax: 1, themes: [] },
  transport: 'CAR',
  transportOverride: null,
  course: { title: '', days: [] },
  apiPois: {},
  poiCatalog: {},
  baseSchedule: [],
  activeDay: 0,
  overrides: {},
  placeTimes: {},
  placeCoords: {},
  drawer: { open: false, poiId: null },
  dirty: false,

  resolvePoi: (id) => {
    const { apiPois, poiCatalog, placeCoords } = get();
    return mergePoi(apiPois[id], poiCatalog[id], placeCoords[id]);
  },

  registerPois: (pois) =>
    set((s) => {
      const next = { ...s.poiCatalog };
      pois.forEach((p) => {
        next[p.id] = p;
      });
      return { poiCatalog: next };
    }),

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
      baseSchedule: res.schedule,
      transport: ctx.transport,
      transportOverride: null,
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
      placeTimes: {},
      drawer: { open: false, poiId: null },
      dirty: false,
    });
  },

  loadDetail: (detail) => {
    const apiPois: Record<string, Poi> = {};
    const days: CourseDay[] = detail.schedule.map((day, i) => {
      const places = [...day.places].sort((a, b) => a.seq - b.seq);
      const items: string[] = [];
      places.forEach((place) => {
        const key = String(place.contentId);
        // 상세 응답엔 지역 필드가 없어 region 은 빈 문자열(요약 지역명은 '경상북도' 폴백).
        apiPois[key] = synthesizePoi(place, '');
        // 하루 내 동일 contentId 중복 방지(loadFromApi 와 동일 불변식).
        if (!items.includes(key)) items.push(key);
      });
      return { label: `Day ${i + 1}`, items };
    });
    set({
      courseId: detail.courseId,
      apiPois,
      baseSchedule: detail.schedule,
      transport: detail.transport,
      transportOverride: null,
      course: { title: detail.title, days },
      search: {
        // 상세 응답엔 sigunguCode/지역이 없다 → dests 비움(Planner 는 '경상북도'로 폴백).
        dests: [],
        start: detail.startDate,
        end: detail.endDate,
        pax: detail.peopleCount,
        themes: detail.theme,
      },
      activeDay: 0,
      overrides: {},
      placeTimes: {},
      drawer: { open: false, poiId: null },
      dirty: false,
    });
  },

  setSearch: (patch) => set((s) => ({ search: { ...s.search, ...patch } })),

  setTitle: (title) => set((s) => ({ course: { ...s.course, title } })),

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
      dirty: true,
    });
    if (poi) toast.success(`'${poi.name}' ${day.label}에 추가`);
  },

  removePoi: (dayIdx, poiId) =>
    set((s) => {
      const day = s.course.days[dayIdx];
      // 없는 장소를 지우려 한 경우(중복 발사 등)는 dirty 를 세우지 않는다.
      if (!day?.items.includes(poiId)) return {};
      return {
        course: {
          ...s.course,
          days: s.course.days.map((d, i) =>
            i === dayIdx
              ? { ...d, items: d.items.filter((x) => x !== poiId) }
              : d,
          ),
        },
        dirty: true,
      };
    }),

  reorder: (dayIdx, from, to) =>
    set((s) => {
      const day = s.course.days[dayIdx];
      // 제자리 드롭(from === to)·범위 밖은 no-op — dirty 도 세우지 않는다.
      if (
        !day ||
        from < 0 ||
        to < 0 ||
        from >= day.items.length ||
        to >= day.items.length ||
        from === to
      )
        return {};
      const items = [...day.items];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return {
        course: {
          ...s.course,
          days: s.course.days.map((d, i) => (i === dayIdx ? { ...d, items } : d)),
        },
        dirty: true,
      };
    }),

  editCost: (poiId, val) =>
    set((s) => {
      const next = Math.max(0, val);
      if (s.overrides[poiId] === next) return {};
      return { overrides: { ...s.overrides, [poiId]: next }, dirty: true };
    }),

  resetCost: (poiId) =>
    set((s) => {
      if (s.overrides[poiId] == null) return {};
      const next = { ...s.overrides };
      delete next[poiId];
      return { overrides: next, dirty: true };
    }),

  // 이동수단·교통비는 **dirty 를 세우지 않는다** — 서버에 보낼 자리가 없어서(계약 추적표 #6)
  // '변경 저장'을 활성화하면 저장 후 '저장됨'으로 바뀌는데 정작 수단은 서버에 남지 않아
  // 사용자를 속이게 된다. 저장 경로가 생기면 여기에 `dirty: true` 를 더하면 된다.
  setTransport: (transport) =>
    set((s) => (s.transport === transport ? {} : { transport })),

  setTransportOverride: (val) =>
    set((s) => {
      const next = Number.isFinite(val) ? Math.max(0, Math.round(val)) : 0;
      return s.transportOverride === next ? {} : { transportOverride: next };
    }),

  resetTransportOverride: () =>
    set((s) => (s.transportOverride == null ? {} : { transportOverride: null })),

  setPlaceTime: (poiId, time) => {
    const s = get();
    const next = normalizeTime(time);
    const cur = s.placeTimes[poiId];
    // 같은 값 재입력은 no-op — 편집하지 않은 코스를 dirty 로 만들지 않는다(editCost 와 같은 규약).
    if ((cur?.time ?? undefined) === next) return;
    set({ placeTimes: withTimeEdit(s.placeTimes, poiId, { time: next }), dirty: true });
    if (next) warnIfTimesOutOfOrder(get(), poiId);
  },

  setPlaceDuration: (poiId, minutes) =>
    set((s) => {
      const next = Number.isFinite(minutes)
        ? Math.max(0, Math.min(MAX_DURATION_MINUTES, Math.round(minutes)))
        : undefined;
      if ((s.placeTimes[poiId]?.durationMinutes ?? undefined) === next) return {};
      return {
        placeTimes: withTimeEdit(s.placeTimes, poiId, {
          durationMinutes: next,
        }),
        dirty: true,
      };
    }),

  setPlaceCoords: (poiId, coords) =>
    set((s) =>
      s.placeCoords[poiId]
        ? {}
        : { placeCoords: { ...s.placeCoords, [poiId]: coords } },
    ),

  resetPlaceTime: (poiId) =>
    set((s) => {
      if (s.placeTimes[poiId] == null) return {};
      const placeTimes = { ...s.placeTimes };
      delete placeTimes[poiId];
      return { placeTimes, dirty: true };
    }),

  markPristine: () => set({ dirty: false }),

  openDrawer: (poiId) => set({ drawer: { open: true, poiId } }),
  closeDrawer: () => set((s) => ({ drawer: { ...s.drawer, open: false } })),
}));
