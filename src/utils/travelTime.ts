/**
 * 코스 장소 사이의 이동시간 추정(F3).
 *
 * ⚠️ **직선거리 기반 추정치다.** 실 경로 API(카카오 길찾기·내비)는 키·쿼터·유료 이슈로 범위
 * 밖이라, 두 좌표의 대권거리(haversine)에 우회 보정을 곱하고 수단별 평균 속도로 환산한다.
 * 그래서 이 값을 쓰는 UI 는 "추정"임을 반드시 화면에 밝힌다(`CoursePanel` 안내 한 줄).
 *
 * 좌표를 모르는 구간은 `null` 을 돌려준다 — 0분으로 표시해 "바로 옆"이라고 오해하게 두지 않는다.
 */

import type { Transport } from '@/api/tourCourse.ts';
import type { LatLng } from '@/types/planner.ts';

/**
 * 수단별 평균 이동 속도(km/h). 정속 주행 속도가 아니라 **문 앞에서 문 앞까지**의 실효 속도다
 * (도보 보행 속도, 대중교통은 대기·환승 포함, 자차는 시내 저속과 국도·고속 혼합).
 */
const SPEED_KMH: Record<Transport, number> = {
  WALK: 4,
  PUBLIC_TRANSPORT: 20,
  CAR: 40,
};

/** 직선거리 → 실제 통행거리 보정 계수(도로 우회·신호). */
const DETOUR_FACTOR = 1.3;
/** 표시 하한(분). 아주 가까운 두 곳도 이동·주차에 이만큼은 든다고 본다. */
const MIN_MINUTES = 5;
/** 표시 단위(분). 추정치라 1분 단위로 보여 주면 근거 없는 정밀함이 된다. */
const STEP_MINUTES = 5;
const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** 두 좌표의 대권거리(km). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Poi 등에서 좌표를 뽑는다. 위·경도 둘 다 있어야 좌표로 인정한다. */
export function coordsOf(
  place: { lat?: number; lng?: number } | undefined,
): LatLng | undefined {
  if (place?.lat == null || place.lng == null) return undefined;
  return { lat: place.lat, lng: place.lng };
}

/**
 * 두 좌표 사이 이동시간(분, 5분 단위·하한 5분). 좌표를 모르면 `null`.
 * 미지의 수단은 자차 기준으로 폴백한다(`utils/budget.estimateTransportCost` 와 같은 규약).
 */
export function travelMinutes(
  from: LatLng | undefined,
  to: LatLng | undefined,
  transport: Transport,
): number | null {
  if (!from || !to) return null;
  const speed = SPEED_KMH[transport] ?? SPEED_KMH.CAR;
  const minutes = (haversineKm(from, to) * DETOUR_FACTOR * 60) / speed;
  if (!Number.isFinite(minutes)) return null;
  return Math.max(
    MIN_MINUTES,
    Math.round(minutes / STEP_MINUTES) * STEP_MINUTES,
  );
}

/** 분 → '25분' / '1시간' / '2시간 30분'. */
export function formatTravelMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}
