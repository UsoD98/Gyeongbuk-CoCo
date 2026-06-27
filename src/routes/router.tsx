import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout.tsx';
import RequireAuth from '@/components/auth/RequireAuth.tsx';
import Loading from '@/components/common/Loading.tsx';
import NotFound from '@/components/layout/NotFoundLayout.tsx';
import plannerRouter from '@/routes/plannerRouter.tsx';
import collectionRouter from '@/routes/collectionRouter.tsx';
import authRouter from '@/routes/authRouter.tsx';

const LoadingComponent = <Loading />;
const Index = lazy(() => import('@/pages/Index'));
const Home = lazy(() => import('@/pages/Home'));
const About = lazy(() => import('@/pages/About'));

const router = createBrowserRouter([
  ...authRouter,
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={LoadingComponent}>
            <Index />
          </Suspense>
        ),
      },
      {
        path: 'home',
        element: (
          <Suspense fallback={LoadingComponent}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: 'about',
        element: (
          <Suspense fallback={LoadingComponent}>
            <About />
          </Suspense>
        ),
      },
      {
        // 로그인 필수 영역. pathless 라우트로 Layout 안에서 가드만 추가한다.
        element: <RequireAuth />,
        children: [...plannerRouter, ...collectionRouter],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}