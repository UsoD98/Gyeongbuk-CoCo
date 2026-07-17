/**
 * 여행 코스 API 응답/요청 타입 (openapi.yaml GBC010~016, 020 기준).
 *
 * 백엔드 `ApiResponse<T>` 봉투의 `data` 부분(=봉투를 벗긴 형태)을 1:1로 정의한다.
 * 봉투 부착·해제는 각 API 함수(Step 1~7에서 추가)가 담당하므로 여기선 타입만 둔다.
 *
 * ⚠️ 계약 가정: `transport` enum / `sigunguCode` 단일 string 은 백엔드 확정 전 스펙 가정이다.
 *    상세는 docs/FE_계약_추적표.md 참조. 400 발생 시 그 표부터 확인한다.
 */

import { apiClient } from '@/api/client.ts';
import type { ApiResponse } from '@/api/types.ts';

/**
 * 이동수단 enum.
 * 스펙 가정: 대문자 3종(0-A 계약 미확정). docs/FE_계약_추적표.md #transport
 */
export type Transport = 'CAR' | 'PUBLIC_TRANSPORT' | 'WALK';

/** 코스 일정의 개별 장소 (schedule[].places[]) */
export interface CoursePlace {
  seq: number;
  time: string; // 'HH:mm:ss'
  // 백엔드 PlaceType 이름(실측): ATTRACTION|CULTURE|EVENT|LEPORTS|ACCOMMODATION|SHOPPING|FOOD
  type: string;
  contentId: number;
  /** 상세(GBC012)·공개뷰(GBC014) 응답에만 포함. 목록·생성 응답엔 없음. */
  placeName?: string;
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
  /** 스펙 가정: 단일 string(예 '35130'). 0-A 계약 미확정. docs/FE_계약_추적표.md #sigunguCode */
  sigunguCode?: string;
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
