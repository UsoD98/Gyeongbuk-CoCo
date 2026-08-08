/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import Loading from '@/components/common/Loading.tsx';

const LoadingComponent = <Loading />;
const Planner = lazy(() => import('@/pages/Planner/Planner'));

const plannerRouter: RouteObject[] = [
  {
    path: 'planner/',
    children: [
      {
        // index: 게스트가 방금 만든 코스(스토어 인메모리)를 그린다.
        index: true,
        element: (
          <Suspense fallback={LoadingComponent}>
            <Planner />
          </Suspense>
        ),
      },
      {
        // 상세(GBC012): 목록 카드 클릭·URL 재진입. Planner 가 :courseId 를 읽어 스토어에 적재.
        path: ':courseId',
        element: (
          <Suspense fallback={LoadingComponent}>
            <Planner />
          </Suspense>
        ),
      },
    ],
  },
];

export default plannerRouter;
