/**
 * 코스 수정(GBC020 `PATCH /tour-course/{courseId}`) 요청 페이로드 조립기.
 *
 * 편집 결과의 정본은 UI 코스(`plannerStore.course.days` = poiId 배열)지만, 이 축약형에는
 * 서버가 요구하는 날짜·방문시각·PlaceType·체류시간·썸네일·운영시간이 없다.
 * 그래서 세 출처를 합쳐 원본 스키마를 복원한다:
 *   1. `baseSchedule` — 서버가 준 원본 일정(있으면 그 장소의 값이 최우선 근거)
 *   2. `resolve(poiId)` — 코스 장소 + 큐레이션 카탈로그 병합 Poi (새로 담은 장소의 이름·분류·사진)
 *   3. `overrides` — 사용자가 고친 예산(총액) → 1인 기준 `cost` 로 환산
 *
 * 순수 함수라 스토어·React 에 의존하지 않는다(호출부는 `hooks/useCourseUpdate`).
 */

import type { CoursePlace, CourseScheduleDay } from '@/api/tourCourse.ts';
import { placeholderPlaceName } from '@/stores/plannerStore.ts';
import type { Course, Poi, PoiCat } from '@/types/planner.ts';

/**
 * UI `PoiCat`(4종) → 백엔드 `PlaceType`. 원본 일정에 없던 장소(결과 목록에서 새로 담은 것)의
 * 타입을 정할 때만 쓴다. 원본에 있던 장소는 응답의 `type` 을 그대로 돌려보내므로
 * LEPORTS·SHOPPING·EVENT 같은 세부 타입이 손실되지 않는다.
 */
const PLACE_TYPE_BY_CAT: Record<PoiCat, string> = {
  sight: 'ATTRACTION',
  culture: 'CULTURE',
  stay: 'ACCOMMODATION',
  food: 'FOOD',
};

/** 체류시간(분) 기본값 — 원본에 `durationMinutes` 가 없을 때만 쓴다. */
const DEFAULT_DURATION: Record<string, number> = {
  ACCOMMODATION: 0,
  FOOD: 60,
};
const FALLBACK_DURATION = 90;

/** 시간 슬롯이 모자랄 때(장소를 새로 담았을 때) 다음 시각까지 두는 이동·여유 시간(분). */
const TRAVEL_BUFFER = 60;
/** 그 날의 첫 시각을 모를 때 쓰는 기본 출발 시각. */
const DEFAULT_START_MINUTES = 9 * 60;
/** 하루를 넘기지 않도록 자정 직전으로 자른다. */
const MAX_MINUTES = 23 * 60 + 59;

/** 'HH:mm[:ss]' → 분. 형식이 아니면 null. */
function toMinutes(time: string | undefined | null): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** 분 → 'HH:mm:ss'(서버 포맷). */
function toTimeString(minutes: number): string {
  const clamped = Math.max(0, Math.min(MAX_MINUTES, Math.round(minutes)));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}:00`;
}

/** 'yyyy-MM-dd' + n일. 로컬 자정 기준이라 타임존 밀림이 없다. */
function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * 예산 override(화면에 보이는 **총액**)를 API `cost`(**1인 기준**)로 되돌린다.
 * `utils/budget.defaultCost` 의 역함수 — 숙박은 1박 객실 총액이라 그대로, 나머지는 인원으로 나눈다.
 */
function toPerPersonCost(poi: Poi, override: number, pax: number): number {
  if (poi.cat === 'stay') return override;
  return pax > 0 ? Math.round(override / pax) : override;
}

/** 빈 문자열은 "정보 없음"이므로 null 로 보낸다(서버 스키마가 nullable). */
function orNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export interface BuildScheduleArgs {
  /** 편집 결과(정본) */
  course: Course;
  /** 서버 원본 일정(`plannerStore.baseSchedule`). 비어 있어도 동작한다. */
  baseSchedule: CourseScheduleDay[];
  /** poiId → Poi 해석기(`plannerStore.resolvePoi`) */
  resolve: (poiId: string) => Poi | undefined;
  /** poiId → 사용자가 수정한 금액(총액) */
  overrides: Record<string, number>;
  /** 여행 시작일 'yyyy-MM-dd'. 원본에 날짜가 없는 Day 의 날짜를 만들 때 쓴다. */
  startDate: string;
  pax: number;
}

export interface BuiltSchedule {
  schedule: CourseScheduleDay[];
  /** `contentId` 로 변환할 수 없어 제외한 장소 수(실 contentId 가 없는 목 슬러그 id 등). */
  skipped: number;
}

/**
 * 편집된 코스 → GBC020 `schedule` 페이로드.
 *
 * 방문 시각 규칙: 그 날 **원본이 갖고 있던 시각들을 오름차순으로 모아 순번대로 배분**한다.
 * 재정렬해도 시각이 뒤죽박죽되지 않고(1번 장소가 늘 가장 이른 시각), 아무것도 안 바꿨다면
 * 원본과 동일한 시각이 그대로 돌아간다. 장소를 더 담아 슬롯이 모자라면
 * 직전 장소의 `시각 + 체류시간 + 이동여유`로 이어 붙인다.
 */
export function buildSchedulePayload({
  course,
  baseSchedule,
  resolve,
  overrides,
  startDate,
  pax,
}: BuildScheduleArgs): BuiltSchedule {
  // 원본 장소 메타를 contentId 로 조회(다른 Day 로 옮겨도 타입·체류시간이 따라간다).
  const metaById = new Map<string, CoursePlace>();
  baseSchedule.forEach((day) =>
    day.places.forEach((place) => {
      metaById.set(String(place.contentId), place);
    }),
  );

  let skipped = 0;

  const schedule = course.days.map((day, dayIdx) => {
    const base = baseSchedule[dayIdx];
    const date = base?.date ?? addDays(startDate, dayIdx);
    // 그 날 원본이 쓰던 시각 슬롯(오름차순).
    const slots = (base?.places ?? [])
      .map((p) => toMinutes(p.time))
      .filter((m): m is number => m != null)
      .sort((a, b) => a - b);

    const places: CoursePlace[] = [];
    // 직전 장소의 종료 시각(분) — 슬롯이 모자랄 때 다음 시각을 만드는 기준.
    let prevEnd: number | null = null;

    day.items.forEach((poiId) => {
      const contentId = Number(poiId);
      if (!Number.isInteger(contentId) || contentId <= 0) {
        skipped += 1;
        return;
      }
      const meta = metaById.get(poiId);
      const poi = resolve(poiId);
      const type =
        meta?.type ?? (poi ? PLACE_TYPE_BY_CAT[poi.cat] : 'ATTRACTION');
      const durationMinutes =
        meta?.durationMinutes ?? DEFAULT_DURATION[type] ?? FALLBACK_DURATION;

      const slot = slots[places.length];
      const startMinutes =
        slot ??
        (prevEnd != null ? prevEnd + TRAVEL_BUFFER : DEFAULT_START_MINUTES);
      prevEnd = startMinutes + durationMinutes;

      // 이름: 실명이 있으면 쓰고, placeholder(`장소 #id`)면 원본 이름으로 폴백.
      const resolvedName =
        poi && poi.name !== placeholderPlaceName(poiId) ? poi.name : undefined;
      const contentName =
        orNull(resolvedName) ??
        orNull(meta?.contentName) ??
        orNull(meta?.placeName);

      const override = overrides[poiId];
      const cost =
        override != null && poi
          ? toPerPersonCost(poi, override, pax)
          : (meta?.cost ?? (poi?.price ? poi.price : null));

      places.push({
        seq: places.length + 1,
        time: toTimeString(startMinutes),
        type,
        contentId,
        contentName: contentName ?? undefined,
        durationMinutes,
        thumbnailImg: meta?.thumbnailImg ?? poi?.imageUrl ?? null,
        operatingHours: meta?.operatingHours ?? orNull(poi?.hours),
        cost,
      });
    });

    return { date, places };
  });

  return { schedule, skipped };
}
