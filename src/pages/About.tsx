import { Link } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Share2,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/utils/cn.ts';

/** 핵심 기능(F1~F3, PRD.md §4). 인원 큐레이션 · 예산 시뮬레이션 · 통합 공유. */
const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Users,
    title: '인원 맞춤 큐레이션',
    desc: '혼행·2인·소그룹까지 인원수에 맞춘 숙소·식당·관광지를 추천해요.',
  },
  {
    icon: Wallet,
    title: '실시간 예산 시뮬레이션',
    desc: '숙박·식비·입장료·교통비를 코스 변경 즉시 합산해 1인당 부담액까지 보여줘요.',
  },
  {
    icon: Share2,
    title: '코스 · 비용 통합 공유',
    desc: '완성한 코스와 비용 분담 내역을 카카오톡·링크로 한 번에 전달해요.',
  },
];

/** 이용 방법 4단계(검색 → 생성 → 예산 → 저장/공유). */
const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: MapPin, title: '여행 조건 입력', desc: '목적지·일정·인원·테마를 고르세요.' },
  {
    icon: Sparkles,
    title: 'AI 코스 생성',
    desc: '조건에 맞는 경북 코스를 자동으로 짜드려요.',
  },
  {
    icon: Wallet,
    title: '예산 확인 · 조정',
    desc: '항목별 금액을 확인하고 직접 수정할 수 있어요.',
  },
  {
    icon: Share2,
    title: '저장 · 공유',
    desc: '마음에 든 코스를 저장하고 친구에게 공유하세요.',
  },
];

const CARD = 'rounded-2xl bg-base-100 p-5 shadow-sm';

export default function About() {
  return (
    <div className="flex flex-col gap-12 py-6">
      {/* Hero */}
      <section className="flex flex-col items-center gap-4 rounded-3xl bg-base-200 px-6 py-12 text-center">
        <span className="badge badge-lg gap-1.5 border-none bg-primary-50 text-primary">
          <Sparkles size={15} />
          경상북도 여행 플래너
        </span>
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
          여행 계획, <span className="text-primary">경북 CoCo</span>와 함께
          <br className="hidden sm:block" /> 5분이면 충분해요
        </h1>
        <p className="max-w-xl text-base-content/70">
          인원과 일정만 고르면 AI가 경북 코스를 짜고, 예산까지 한눈에. 친구와 비용
          분담 내역도 링크 하나로 공유하세요.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link to="/" className="btn btn-primary gap-1">
            <Compass size={18} />
            코스 만들기
          </Link>
          <Link to="/collection/" className="btn btn-outline">
            내 컬렉션
          </Link>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-2xl font-extrabold">이래서 경북 CoCo예요</h2>
          <p className="text-base-content/60">
            작은 여행일수록 계획과 예산이 중요하니까요.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className={cn(CARD, 'flex flex-col gap-3')}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                <Icon size={22} />
              </span>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-base-content/70">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 이용 방법 */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-2xl font-extrabold">이렇게 사용해요</h2>
          <p className="text-base-content/60">검색부터 공유까지 네 단계면 끝.</p>
        </div>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <li key={title} className={cn(CARD, 'flex flex-col gap-3')}>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-50">
                  {i + 1}
                </span>
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-base-content/70">
                {desc}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-4 rounded-3xl bg-primary px-6 py-10 text-center text-primary-50">
        <h2 className="text-2xl font-extrabold">지금 경북 여행을 계획해보세요</h2>
        <p className="max-w-md text-primary-100">
          로그인 없이도 코스를 짜볼 수 있어요. 마음에 들면 그때 저장하세요.
        </p>
        <Link to="/" className="btn gap-1 border-none bg-base-100 text-primary">
          <Compass size={18} />
          코스 만들러 가기
        </Link>
      </section>
    </div>
  );
}
