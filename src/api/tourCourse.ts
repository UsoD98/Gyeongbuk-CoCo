/**
 * 여행 코스 API 응답/요청 타입 (openapi.yaml GBC010~016, 020 기준).
 *
 * 백엔드 `ApiResponse<T>` 봉투의 `data` 부분(=봉투를 벗긴 형태)을 1:1로 정의한다.
 * 봉투 부착·해제는 각 API 함수(Step 1~7에서 추가)가 담당하므로 여기선 타입만 둔다.
 *
 * ⚠️ 계약: `transport` enum 은 스펙 가정(미확정). `sigunguCodes` 는 실측 확정
 *    (백엔드 `findByLDongSignguCdIn` — 법정동 시군구 3자리 bare, 접두 '47' 없음, 복수).
 *    상세는 docs/FE_계약_추적표.md 참조. 400 발생 시 그 표부터 확인한다.
 */

import axios from 'axios';

import { apiClient, API_BASE_URL } from '@/api/client.ts';
import type { ApiResponse } from '@/api/types.ts';

/**
 * 이동수단 enum.
 * 스펙 가정: 대문자 3종(0-A 계약 미확정). docs/FE_계약_추적표.md #transport
 */
export type Transport = 'CAR' | 'PUBLIC_TRANSPORT' | 'WALK';

/**
 * 코스 일정의 개별 장소 (schedule[].places[]).
 * 백엔드 `TourCourseGenerateResponseDto.PlaceInfo`(생성)·`TourCourseShareResponseDto.PlaceInfo`
 * (상세/공개뷰) 실측. 장소명 필드만 두 응답이 다르고 나머지는 동일하다.
 */
export interface CoursePlace {
  seq: number;
  time: string; // 'HH:mm:ss' — 일정상 방문 시각
  // 백엔드 PlaceType 이름(실측): ATTRACTION|CULTURE|EVENT|LEPORTS|ACCOMMODATION|SHOPPING|FOOD
  type: string;
  contentId: number;
  /** 상세(GBC012)·공개뷰(GBC014)의 장소명. **빈 문자열일 수 있다**(실측). */
  placeName?: string;
  /** 생성(GBC010)의 장소명. 백엔드 추가 예정 — 도착 전까지는 undefined 라 placeholder 로 폴백한다. */
  contentName?: string;
  /** 체류 예정 시간(분). 현재 백엔드가 null 로 내려준다(실측). */
  durationMinutes?: number | null;
  /** 대표 이미지 URL(TourAPI firstimage). 없으면 null. `http://` 로 올 수 있다. */
  thumbnailImg?: string | null;
  /** 운영시간 원문(예: '상시 개방', '- 10:00~21:00- 브레이크타임 15:00~15:40'). 없으면 null. */
  operatingHours?: string | null;
  /** 1인 예상 비용(원). 백엔드가 실데이터 없으면 타입별 기본값을 넣고, 숙박은 null. */
  cost?: number | null;
}

/**
 * 코스의 하루치 일정.
 * ⚠️ 이름 주의: 목업/UI용 `CourseDay`(@/types/planner.ts, {label, items})와 다른 타입이다.
 *    이쪽은 서버 스키마({date, places})이므로 충돌·혼동을 피해 `CourseScheduleDay`로 둔다.
 */
export interface CourseScheduleDay {
  date: string; // 'yyyy-MM-dd'
  places: CoursePlace[];
}

/** 내 코스 목록 항목 (GBC011 GET /tour-course) */
export interface CourseSummary {
  courseId: number;
  title: string;
  peopleCount: number;
  startDate: string; // 'yyyy-MM-dd'
  endDate: string; // 'yyyy-MM-dd'
  transport: Transport;
  theme: string[];
  createdAt: string; // ISO datetime, 예: '2026-06-27T10:00:00'
}

/**
 * 코스 상세 (GBC012 GET /tour-course/{courseId})
 * 공개뷰(GBC014 GET /tour-course/{courseId}/view)도 동일 형태를 반환한다.
 * 목록 항목에서 `createdAt`이 빠지고 `schedule`이 더해진 형태.
 */
export interface CourseDetail extends Omit<CourseSummary, 'createdAt'> {
  schedule: CourseScheduleDay[];
}

/** AI 코스 생성 요청 (GBC010 POST /tour-course) */
export interface CreateCourseRequest {
  peopleCount: number;
  startDate: string; // 'yyyy-MM-dd' (오늘 이후)
  endDate: string; // 'yyyy-MM-dd' (시작 이후)
  transport: Transport;
  theme: string[]; // 최소 1개 이상
  /**
   * 법정동 시군구 코드 목록(백엔드 `lDongSignguCd`, 3자리 bare — 예 '130'=경주).
   * 실측 확정: 접두 '47' 없이 sigunguStore value 그대로, 복수 허용.
   * 생략/빈 배열이면 백엔드가 경북 전역에서 선정. docs/FE_계약_추적표.md #sigunguCode
   */
  sigunguCodes?: string[];
}

/** AI 코스 생성 응답 (GBC010) — 생성 직후엔 title/헤더 없이 courseId + 일정만 온다. */
export interface CreateCourseResponse {
  courseId: number;
  schedule: CourseScheduleDay[];
}

/** 코스 제목 수정 요청 (GBC015 PATCH /tour-course/{courseId}/title) */
export interface UpdateCourseTitleRequest {
  title: string;
}

/**
 * 코스 수정 요청 (GBC020 PATCH /tour-course/{courseId}).
 *
 * 백엔드 상세 명세 실측: 바디는 **수정한 코스 객체(schedule) 전체 교체**다(diff 아님).
 * 장소 필드는 조회 응답(`CoursePlace`)과 같은 모양이되 장소명은 `contentName` 을 쓴다
 * (`placeName` 은 보내지 않는다). 페이로드 조립은 `utils/coursePayload` 가 담당한다.
 */
export interface UpdateCourseRequest {
  schedule: CourseScheduleDay[];
}
// ⚠️ 코스 헤더(`transport`·`peopleCount`·기간)는 이 바디로 바꿀 수 없다 — 백엔드에 수정 경로가
//    없고(`transport` 는 생성 시 1회 저장), 교통비도 서버가 산정·저장하지 않는다(0.5.9 에서
//    BU3 취소 — 이동 비용은 FE 전담). 그래서 F2 의 이동수단·교통비 변경은 세션 내 계산·표시
//    전용이다. 계약 추적표 #6.

// ── API 함수 ───────────────────────────────────────────────

/**
 * POST /tour-course — AI 코스 생성 (비로그인 허용).
 * 응답엔 courseId + schedule(장소는 seq/time/type/contentId)만 담긴다.
 * 장소명/가격/좌표는 없으므로 UI는 POI 상세(GBC018) 연동 전까지 placeholder로 표시한다.
 */
export async function createCourse(
  req: CreateCourseRequest,
): Promise<CreateCourseResponse> {
  const { data } = await apiClient.post<ApiResponse<CreateCourseResponse>>(
    '/tour-course',
    req,
  );
  return data.data;
}

/**
 * GET /tour-course — 로그인 사용자의 저장 코스 목록 (GBC011). 인증 필수(Bearer).
 * 응답 data 는 `CourseSummary[]`(각 항목은 헤더 정보만, 일정 상세는 없음).
 */
export async function getMyCourses(): Promise<CourseSummary[]> {
  const { data } = await apiClient.get<ApiResponse<CourseSummary[]>>(
    '/tour-course',
  );
  return data.data;
}

/**
 * GET /tour-course/{courseId} — 코스 상세 조회 (GBC012). 소유자 인증 필수(Bearer).
 * 응답 data 는 `CourseDetail`(헤더 + `schedule[].places[]`, 장소마다 `placeName` 포함).
 * 목록·생성 응답과 달리 실제 장소명이 담기므로 placeholder 없이 렌더할 수 있다.
 * ⚠️ 소유자가 아니면 백엔드가 401/403 을 반환한다(401 은 client 인터셉터가 처리).
 */
export async function getCourse(courseId: number): Promise<CourseDetail> {
  const { data } = await apiClient.get<ApiResponse<CourseDetail>>(
    `/tour-course/${courseId}`,
  );
  return data.data;
}

/**
 * GET /tour-course/{courseId}/view — 공개 코스 뷰 (GBC014). **인증 불필요**.
 * 카카오 공유 링크 수신자(비로그인)가 코스를 조회하는 유일한 경로다. 응답은 상세와 동일한
 * `CourseDetail` 형태(헤더 + `schedule[].places[]`, `placeName` 포함).
 *
 * ⚠️ `apiClient`(Bearer 첨부·401 재발급 인터셉터)를 쓰지 않고 **순수 axios**로 호출한다.
 *    공개뷰는 토큰이 없어도 200 이어야 하는데, 만약 인터셉터를 타면 비로그인 수신자에게
 *    재발급 실패 → 강제 로그인 리다이렉트가 걸릴 수 있어(공유 UX 파괴) 이를 원천 차단한다.
 *    (쿠키 불필요 → withCredentials 생략.)
 */
export async function getPublicCourse(courseId: number): Promise<CourseDetail> {
  const { data } = await axios.get<ApiResponse<CourseDetail>>(
    `${API_BASE_URL}/tour-course/${courseId}/view`,
  );
  return data.data;
}

/**
 * PATCH /tour-course/{courseId}/assign — 코스 소유권 이전(= "저장").
 * 비로그인으로 생성된 코스(userId=null)를 현재 로그인 사용자에게 귀속시킨다. 인증 필수(Bearer).
 * 응답 data 는 null.
 * ⚠️ 이미 소유자가 있는 코스면 백엔드가 403("이미 소유자가 있는 코스입니다")을 반환한다 →
 *    호출부에서 중복 저장을 막을 것(useCourseSave 의 saved 가드).
 */
export async function assignCourse(courseId: number): Promise<void> {
  await apiClient.patch<ApiResponse<null>>(`/tour-course/${courseId}/assign`);
}

/**
 * DELETE /tour-course/{courseId} — 코스 전체 삭제 (GBC013). 소유자 인증 필수(Bearer).
 * 응답 data 는 null. 성공 시 호출부에서 목록을 재조회한다.
 * ⚠️ 코스 **전체** 삭제다. 플래너의 POI 단위 제거(`removePoi`)와 혼동 금지.
 * ⚠️ 소유자가 아니면 백엔드가 401/403 을 반환한다(401 은 client 인터셉터가 처리).
 */
export async function deleteCourse(courseId: number): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(`/tour-course/${courseId}`);
}

/**
 * PATCH /tour-course/{courseId}/title — 코스 제목 수정 (GBC015). 소유자 인증 필수(Bearer).
 * 응답 data 는 null. 성공 시 호출부에서 낙관적 업데이트를 확정(실패 시 롤백)한다.
 * ⚠️ title 은 255자 이하(스펙). 소유자가 아니면 백엔드가 401/403 을 반환한다(401 은 client 인터셉터가 처리).
 */
export async function updateCourseTitle(
  courseId: number,
  title: string,
): Promise<void> {
  const body: UpdateCourseTitleRequest = { title };
  await apiClient.patch<ApiResponse<null>>(
    `/tour-course/${courseId}/title`,
    body,
  );
}

/**
 * PATCH /tour-course/{courseId} — 코스 수정 (GBC020). 소유자 인증 필수(Bearer).
 * 편집한 **일정 전체**(`schedule`)를 통째로 보내 서버 코스를 교체한다.
 *
 * 응답 `data` 는 명세상 "완료 데이터"로만 적혀 있어 형태가 확정되지 않았다 → 값을 쓰지 않고
 * 성공 여부만 본다(스토어는 이미 편집 결과를 들고 있으므로 재조회 없이 그대로 확정한다).
 * ⚠️ 소유자가 아니면 백엔드가 401/403 을 반환한다(401 은 client 인터셉터가 처리).
 */
export async function updateCourse(
  courseId: number,
  schedule: CourseScheduleDay[],
): Promise<void> {
  const body: UpdateCourseRequest = { schedule };
  await apiClient.patch<ApiResponse<unknown>>(`/tour-course/${courseId}`, body);
}
