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
        index: true,
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
