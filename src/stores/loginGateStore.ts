import { create } from 'zustand';

/**
 * 로그인 게이트(전역).
 * 저장·공유·좋아요처럼 로그인이 필요한 액션이 깊은 컴포넌트 트리에서도 게이트를 열 수 있도록
 * 전역 스토어로 둔다(프롭 드릴 회피). 모달 자체(`LoginGateModal`)는 Planner 가 한 번만 렌더하고
 * 이 스토어의 `open`/`label` 을 구독한다 → 화면당 게이트는 항상 하나.
 *
 * `label` 은 게이트 헤드라인에 들어가는 액션명(예: '저장', '찜'). `${label}하려면 로그인` 형태.
 */
interface LoginGateState {
  open: boolean;
  label: string | null;
  openGate: (label: string) => void;
  closeGate: () => void;
}

export const useLoginGateStore = create<LoginGateState>((set) => ({
  open: false,
  label: null,
  openGate: (label) => set({ open: true, label }),
  closeGate: () => set({ open: false, label: null }),
}));
