import { useCallback, useState } from 'react';

import { usePlannerStore } from '@/stores/plannerStore.ts';
import { toast } from '@/stores/toastStore.ts';
import { copyToClipboard, shareViaKakao } from '@/utils/kakaoShare.ts';

/**
 * 코스 공유(GBC014) 흐름을 캡슐화한 도메인 훅.
 *
 * 공유 대상은 공개뷰 경로 `/share/:courseId`다(수신자는 비로그인으로 열람 가능).
 * 동작: 카카오 공유 SDK 시도 → 실패 시(키 없음·도메인 미등록·SDK 로드 실패 등) 링크를
 * 클립보드에 복사하는 폴백. 둘 다 실패하면 에러 toast. 어느 경우든 "링크 생성"은 보장된다.
 *
 * ⚠️ 로그인 불필요: 게스트가 만든 코스도 서버에 courseId가 있고 공개뷰는 인증이 없으므로
 *    바로 공유할 수 있다(수신자만 비로그인 열람). courseId가 없으면(코스 미생성) no-op.
 */
export interface CourseShare {
  /** 공유 처리 진행 중(SDK 로드/복사 대기) */
  sharing: boolean;
  /** 공유 시도. courseId가 null이면 안내 toast 후 종료. */
  share: () => Promise<void>;
}

/** 공유 링크 절대 URL을 만든다. `${origin}/share/${courseId}`. */
export function buildShareUrl(courseId: number): string {
  return `${window.location.origin}/share/${courseId}`;
}

export function useCourseShare(): CourseShare {
  const [sharing, setSharing] = useState(false);

  const share = useCallback(async () => {
    // 최신 스토어 값을 직접 읽어 공유 카드 문구를 만든다(구독 없이 액션 시점 스냅샷).
    const { courseId, course, search } = usePlannerStore.getState();
    if (courseId == null) {
      toast.error('공유할 코스가 없어요');
      return;
    }
    const url = buildShareUrl(courseId);
    const title = course.title?.trim() || 'AI 추천 코스';
    const description = `경북 CoCo · ${search.pax}명 여행 코스를 확인해보세요`;

    setSharing(true);
    try {
      const shared = await shareViaKakao({ url, title, description });
      if (shared) return; // 카카오 공유 시트가 떴다.
      const copied = await copyToClipboard(url);
      if (copied) toast.success('공유 링크를 복사했어요');
      else toast.error('공유 링크를 만들지 못했어요');
    } finally {
      setSharing(false);
    }
  }, []);

  return { sharing, share };
}
