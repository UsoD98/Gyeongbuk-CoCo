/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import Loading from '@/components/common/Loading.tsx';

const LoadingComponent = <Loading />;
const Share = lazy(() => import('@/pages/Share/Share'));

/**
 * 공개 코스 뷰(GBC014) 라우트. **가드 밖**에 둔다 —
 * 카카오 공유 링크 수신자는 비로그인이므로 RequireAuth 하위에 두면 안 된다.
 * `router.tsx`에서 Layout 하위(RequireAuth 형제)로 spread 한다.
 */
const shareRouter: RouteObject[] = [
  {
    path: 'share/:courseId',
    element: (
      <Suspense fallback={LoadingComponent}>
        <Share />
      </Suspense>
    ),
  },
];

export default shareRouter;
