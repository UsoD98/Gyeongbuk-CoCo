import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Calendar, Compass, MapPin, Share2, Users } from 'lucide-react';

import BudgetDashboard from '@/components/planner/BudgetDashboard.tsx';
import CoursePanel from '@/components/planner/CoursePanel.tsx';
import LoginGateModal from '@/components/planner/LoginGateModal.tsx';
import PlannerDndProvider from '@/components/planner/PlannerDndProvider.tsx';
import PoiDrawer from '@/components/planner/PoiDrawer.tsx';
import ResultsPanel from '@/components/planner/ResultsPanel.tsx';
import { nightsFromRange } from '@/mocks/planner.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { useSigunguStore } from '@/stores/sigunguStore.ts';
import { toast } from '@/stores/toastStore.ts';
import { cn } from '@/utils/cn.ts';

type MobileTab = 'results' | 'course' | 'budget';

const PANEL_CARD = 'card flex flex-col overflow-hidden rounded-2xl bg-base-100 shadow-lg';

export default function Planner() {
  const course = usePlannerStore((s) => s.course);
  const search = usePlannerStore((s) => s.search);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const getSigunguLabel = useSigunguStore((s) => s.getSigunguLabel);

  const [tab, setTab] = useState<MobileTab>('results');
  const [gate, setGate] = useState<{ open: boolean; label: string | null }>({
    open: false,
    label: null,
  });

  const courseCount = course.days.reduce((a, d) => a + d.items.length, 0);
  const nights = nightsFromRange(search.start, search.end);
  // search.dests 는 시군구 코드(예 '130'). 목 REGIONS 슬러그와 코드 체계가 다르므로
  // sigunguStore 라벨로 해석한다(미선택/미해석 시 '경상북도').
  const regionName = search.dests.length
    ? (getSigunguLabel(search.dests[0]) ?? '경상북도')
    : '경상북도';

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

  const requireAuth = (label: string, run: () => void) => {
    if (isAuthenticated) run();
    else setGate({ open: true, label });
  };
  const onSave = () =>
    requireAuth('저장', () => toast.success('컬렉션에 저장했어요'));
  const onShare = () =>
    requireAuth('공유', () => toast.success('공유 링크가 생성됐어요'));

  const summary = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-base-100 p-4 shadow-lg sm:p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="truncate text-lg font-extrabold sm:text-xl">
          {course.title}
        </h1>
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
        >
          <Bookmark size={16} />저장
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary gap-1"
          onClick={onShare}
        >
          <Share2 size={16} />공유
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
          <div className="grid grid-cols-[360px_1fr] items-start gap-5">
            <div className={cn(PANEL_CARD, 'h-[560px]')}>
              <CoursePanel />
            </div>
            <div className={cn(PANEL_CARD, 'h-[560px]')}>
              <ResultsPanel />
            </div>
          </div>
        </PlannerDndProvider>
        <div className={cn(PANEL_CARD, 'p-5')}>
          <BudgetDashboard onSave={onSave} onShare={onShare} />
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
      <LoginGateModal
        open={gate.open}
        label={gate.label}
        onClose={() => setGate({ open: false, label: null })}
      />
    </>
  );
}
