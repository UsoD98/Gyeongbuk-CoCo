import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, Calendar, Compass, MapPin, Share2, Users } from 'lucide-react';

import { getApiErrorMessage } from '@/api/types.ts';
import ErrorState from '@/components/common/ErrorState.tsx';
import Loading from '@/components/common/Loading.tsx';
import BudgetDashboard from '@/components/planner/BudgetDashboard.tsx';
import CoursePanel from '@/components/planner/CoursePanel.tsx';
import EditableCourseTitle from '@/components/planner/EditableCourseTitle.tsx';
import LoginGateModal from '@/components/planner/LoginGateModal.tsx';
import PlannerDndProvider from '@/components/planner/PlannerDndProvider.tsx';
import PoiDrawer from '@/components/planner/PoiDrawer.tsx';
import ResultsPanel from '@/components/planner/ResultsPanel.tsx';
import { useCourseDetail } from '@/hooks/useCourseDetail.ts';
import { useCourseSave } from '@/hooks/useCourseSave.ts';
import { useCourseShare } from '@/hooks/useCourseShare.ts';
import { useCourseUpdate } from '@/hooks/useCourseUpdate.ts';
import { nightsFromRange } from '@/mocks/planner.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { useLoginGateStore } from '@/stores/loginGateStore.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { useSigunguStore } from '@/stores/sigunguStore.ts';
import { cn } from '@/utils/cn.ts';

type MobileTab = 'results' | 'course' | 'budget';

const PANEL_CARD = 'card flex flex-col overflow-hidden rounded-2xl bg-base-100 shadow-lg';
// 데스크톱 패널 높이: 뷰포트에 맞춰 늘리되(헤더·요약·여백 ≈ 15rem 차감) 하한 500px·상한 780px로
// clamp — 작은 화면에선 답답하지 않게, 큰 모니터에선 아래 여백이 과하지 않게 한다.
const PANEL_H = 'h-[clamp(500px,calc(100vh_-_15rem),780px)]';
// 코스 패널(좌) 너비: 320~400px 사이에서 컨테이너 비례(26%)로 유연하게 —
// 중간 폭(1024~1280)에선 360px 고정보다 좁아져 결과 패널에 여유를 준다.
const PANEL_GRID = 'grid grid-cols-[clamp(320px,26%,400px)_1fr] items-start gap-5';

export default function Planner() {
  // /planner/:courseId 진입(목록 카드 클릭·URL 재진입) 시 상세를 불러와 스토어에 적재.
  // index 라우트(게스트 생성 직후)면 param 이 없어 훅은 fetch 없이 idle 로 끝난다.
  const { courseId: courseIdParam } = useParams();
  const { error: detailError, reload: reloadDetail } =
    useCourseDetail(courseIdParam);

  const course = usePlannerStore((s) => s.course);
  const search = usePlannerStore((s) => s.search);
  const storeCourseId = usePlannerStore((s) => s.courseId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const getSigunguLabel = useSigunguStore((s) => s.getSigunguLabel);

  // 코스 편집 영속화(GBC020) — dnd·비용 편집 결과를 명시적 저장 시점에 한 번 flush.
  const { saving: updating, dirty, save: saveEdits } = useCourseUpdate();
  // 게스트가 편집까지 해 둔 코스라면 소유권 이전(assign) 직후 편집분도 이어서 저장한다.
  // (`saveEdits` 는 참조 고정 + 변경 없으면 no-op 이라 매번 걸어도 안전하다.)
  const onAssigned = useCallback(() => {
    void saveEdits();
  }, [saveEdits]);
  const { saving, saved, save } = useCourseSave({ onAssigned });
  const { sharing, share } = useCourseShare();

  const [tab, setTab] = useState<MobileTab>('results');
  // 로그인 게이트는 전역 스토어(loginGateStore)로 승격 — 저장/공유뿐 아니라 결과 카드·드로어의
  // 찜 버튼(GBC019)도 깊은 트리에서 게이트를 열 수 있게 한다. 모달은 여기서 한 번만 렌더.
  const gateOpen = useLoginGateStore((s) => s.open);
  const gateLabel = useLoginGateStore((s) => s.label);
  const openGate = useLoginGateStore((s) => s.openGate);
  const closeGate = useLoginGateStore((s) => s.closeGate);

  const courseCount = course.days.reduce((a, d) => a + d.items.length, 0);
  const nights = nightsFromRange(search.start, search.end);
  // search.dests 는 시군구 코드(예 '130'). 목 REGIONS 슬러그와 코드 체계가 다르므로
  // sigunguStore 라벨로 해석한다(미선택/미해석 시 '경상북도').
  const regionName = search.dests.length
    ? (getSigunguLabel(search.dests[0]) ?? '경상북도')
    : '경상북도';

  // /planner/:courseId 인데 그 코스가 아직 스토어에 없으면 로딩/에러를 먼저 처리한다.
  // 판정 기준은 로딩 플래그가 아니라 "스토어가 이 코스를 들고 있는가"다 —
  // 그래야 다른 코스로 URL 이 바뀌는 순간 이전 코스가 새 URL 아래 스치듯 렌더되지 않는다.
  // (스토어에 이미 있으면 — 게스트 생성 직후 등 — 즉시 렌더하고 상세는 백그라운드로 갱신.)
  const paramId = courseIdParam ? Number(courseIdParam) : null;
  const hasParamCourse = paramId != null && storeCourseId === paramId;
  if (courseIdParam && !hasParamCourse) {
    if (detailError) {
      return (
        <ErrorState
          description={getApiErrorMessage(detailError, '코스를 불러오지 못했어요')}
          onRetry={reloadDetail}
        />
      );
    }
    return <Loading />;
  }

  // 코스 미생성(직접 진입·새로고침으로 인메모리 상태 소실). 유령 요약/예산 대신 안내.
  if (course.days.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Compass size={40} className="text-base-content/30" />
        <div className="flex flex-col gap-1">
          <p className="text-lg font-bold">아직 만든 코스가 없어요</p>
          <p className="text-sm text-base-content/60">
            홈에서 여행 조건을 입력해 AI 코스를 만들어보세요.
          </p>
        </div>
        <Link to="/" className="btn btn-primary btn-sm">
          홈으로 가기
        </Link>
      </div>
    );
  }

  // 소유 코스 판정 = 로그인 + courseId 존재 + (이 세션에서 저장했거나 `/planner/:courseId` 진입).
  // 제목 인라인 편집(GBC015)의 노출 조건과 같은 기준이다.
  const owned =
    isAuthenticated && storeCourseId != null && (saved || Boolean(courseIdParam));

  // 저장 버튼 하나가 코스 상태에 따라 두 역할을 겸한다:
  //  - 미소유(게스트·미저장): 소유권 이전(GBC016). 비로그인이면 로그인 게이트를 열고 복귀 후 자동 저장.
  //  - 소유: 편집 내용 영속화(GBC020). 바뀐 게 없으면 '저장됨'으로 비활성.
  const onSave = owned
    ? () => void saveEdits()
    : () => save(() => openGate('저장'));
  const savePending = owned ? updating : saving;
  const saveDone = owned ? !dirty : saved;
  const saveLabel = saveDone ? '저장됨' : owned ? '변경 저장' : '저장';
  // 공유(GBC014) = 공개뷰 링크 생성. 로그인 불필요(수신자만 비로그인 열람) → 게이트 없이 즉시.
  const onShare = () => void share();

  const summary = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-base-100 p-4 shadow-lg sm:p-5">
      <div className="flex min-w-0 flex-col gap-1">
        {/* 소유 코스(로그인 + 저장된 courseId)면 제목을 인라인 편집(GBC015). */}
        <EditableCourseTitle
          title={course.title}
          editable={isAuthenticated && storeCourseId != null}
          courseId={storeCourseId}
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/60">
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-primary" />
            {regionName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} className="text-primary" />
            {nights}박 {nights + 1}일
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} className="text-primary" />
            {search.pax}명
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline gap-1"
          onClick={onSave}
          disabled={savePending || saveDone}
        >
          {savePending ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Bookmark size={16} />
          )}
          {saveLabel}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary gap-1"
          onClick={onShare}
          disabled={sharing}
        >
          {sharing ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Share2 size={16} />
          )}
          공유
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 데스크톱: 코스(좌, 360px) · 결과(우, 1fr) 그리드 + 예산 섹션 */}
      <div className="hidden flex-col gap-5 lg:flex">
        {summary}
        <PlannerDndProvider>
          <div className={PANEL_GRID}>
            <div className={cn(PANEL_CARD, PANEL_H)}>
              <CoursePanel />
            </div>
            <div className={cn(PANEL_CARD, PANEL_H)}>
              <ResultsPanel />
            </div>
          </div>
        </PlannerDndProvider>
        <div className={cn(PANEL_CARD, 'p-5')}>
          <BudgetDashboard
            onSave={onSave}
            onShare={onShare}
            saving={savePending}
            saved={saveDone}
            saveLabel={saveLabel}
          />
        </div>
      </div>

      {/* 모바일: 세그먼트 탭 (결과 · 코스 N · 예산) */}
      <div className="flex flex-col gap-4 lg:hidden">
        {summary}
        <div role="tablist" className="tabs tabs-box grid grid-cols-3">
          {(
            [
              ['results', '결과'],
              ['course', `코스 ${courseCount}`],
              ['budget', '예산'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="tab"
              className={cn('tab', tab === k && 'tab-active')}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className={cn(PANEL_CARD, 'h-[70vh]')}>
          {tab === 'results' && <ResultsPanel mobile />}
          {tab === 'course' && (
            <PlannerDndProvider mobile>
              <CoursePanel mobile />
            </PlannerDndProvider>
          )}
          {tab === 'budget' && (
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <BudgetDashboard compact onSave={onSave} onShare={onShare} />
            </div>
          )}
        </div>
      </div>

      <PoiDrawer />
      <LoginGateModal open={gateOpen} label={gateLabel} onClose={closeGate} />
    </>
  );
}
