import { create } from 'zustand';

import { DEFAULT_COURSE, poiById } from '@/mocks/planner.ts';
import { toast } from '@/stores/toastStore.ts';
import type { Course } from '@/types/planner.ts';

/**
 * 플래너 단일 도메인 스토어.
 * 결과·코스·예산 패널이 모두 이 스토어를 구독한다 → 한 곳을 바꾸면 전 패널이 즉시 갱신.
 * 예산은 저장하지 않고 course+pax+overrides 에서 파생 계산한다(@/utils/budget).
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

interface PlannerState {
  search: Search;
  course: Course;
  activeDay: number;
  /** poiId → 사용자가 수정한 금액 */
  overrides: Record<string, number>;
  drawer: Drawer;

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

/** 초기값이 참조로 변형되지 않도록 깊은 복사 */
function cloneCourse(c: Course): Course {
  return {
    title: c.title,
    days: c.days.map((d) => ({ label: d.label, items: [...d.items] })),
  };
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  // 프로토타입 기본값 부팅 (검색화면 부재 → 경주 2박3일·2인 + 채워진 코스)
  search: {
    dests: ['gyeongju'],
    start: '2026-06-12',
    end: '2026-06-14',
    pax: 2,
    themes: ['history', 'food'],
  },
  course: cloneCourse(DEFAULT_COURSE.gyeongju),
  activeDay: 0,
  overrides: {},
  drawer: { open: false, poiId: null },

  setSearch: (patch) =>
    set((s) => ({ search: { ...s.search, ...patch } })),

  setActiveDay: (i) => set({ activeDay: i }),

  addPoi: (poiId, index) => {
    const s = get();
    const day = s.course.days[s.activeDay];
    if (!day) return;
    const poi = poiById(poiId);
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
