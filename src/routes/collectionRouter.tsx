/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import Loading from '@/components/common/Loading.tsx';

const LoadingComponent = <Loading />;
const Collection = lazy(() => import('@/pages/Collection/Collection'));

const collectionRouter: RouteObject[] = [
  {
    path: 'collection/',
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={LoadingComponent}>
            <Collection />
          </Suspense>
        ),
      },
    ],
  },
];

export default collectionRouter;
