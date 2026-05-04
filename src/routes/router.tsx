import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout.tsx';
import Loading from '@/components/common/Loading.tsx';
import NotFound from '@/components/layout/NotFoundLayout.tsx';
import RootLayout from '@/components/layout/RootLayout.tsx';

const LoadingComponent = <Loading />;
const Index = lazy(() => import('@/pages/Index'));
const Home = lazy(() => import('@/pages/Home'));
const About = lazy(() => import('@/pages/About'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        element: <RootLayout />,
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
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
