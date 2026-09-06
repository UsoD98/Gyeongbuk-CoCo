import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/HeaderLayout.tsx';
import { Footer } from '@/components/layout/FooterLayout.tsx';
import Toaster from '@/components/common/Toaster.tsx';
import { cn } from '@/utils/cn.ts';

export default function Layout() {
  return (
    <div className={cn('min-h-screen', 'flex', 'flex-col')}>
      <Header />

      {/*
        main 태그에 반응형 너비 설정
        - px-4: 모바일 양옆 여백
        - lg:px-10: 데스크톱 양옆 여백
        - lg:max-w-[1440px]: 피그마 기준 최대 너비 고정
        - mx-auto: 중앙 정렬
      */}
      <main
        className={cn(
          'flex-1' /*남은 공간을 모두 차지하여 메인 콘텐츠가 화면을 유연하게 채움*/,
          'w-full' /*기본적으로 가로 전체 너비 사용*/,
          'max-w-full' /*기본 최대 너비 제한 없음*/,
          'lg:max-w-360' /*데스크톱에서는 최대 너비 1440px로 제한*/,
          /*
            min-w-90(=360px)을 걸지 않는다. 걸면 320px 기기(iPhone SE 1세대·폴드 접힘)에서
            레이아웃이 깨지는 대신 페이지 전체가 가로로 밀린다 — 넘침은 각 요소에서
            min-w-0·truncate·flex-wrap 으로 흘려보낸다(R4).
          */
          'mx-auto' /*좌우 중앙 정렬*/,
          'px-4' /*모바일 환경에서 좌우 여백 16px*/,
          'lg:px-10' /*데스크톱 환경에서 좌우 여백 40px*/,
          'py-6' /*상하 여백 24px*/,
          'bg-base-200' /*페이지 배경: 테마 가변(라이트=연회색·다크=어두운 중립). 카드는 bg-base-100으로 위에 뜬다*/,
        )}
      >
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
