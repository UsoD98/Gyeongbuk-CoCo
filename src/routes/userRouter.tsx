/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';

import Loading from '@/components/common/Loading.tsx';

const LoadingComponent = <Loading />;
const MyPage = lazy(() => import('@/pages/User/MyPage'));

const userRouter: RouteObject[] = [
  {
    path: 'mypage/',
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={LoadingComponent}>
            <MyPage />
          </Suspense>
        ),
      },
    ],
  },
];

export default userRouter;
