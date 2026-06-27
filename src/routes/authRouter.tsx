/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

import GuestOnly from '@/components/auth/GuestOnly.tsx';
import Loading from '@/components/common/Loading.tsx';

const LoadingComponent = <Loading />;
const Login = lazy(() => import('@/pages/Auth/Login'));
const Register = lazy(() => import('@/pages/Auth/Register'));

const authRouter: RouteObject[] = [
  {
    path: 'auth',
    element: <GuestOnly />,
    children: [
      {
        index: true,
        element: <Navigate to="login" replace />,
      },
      {
        path: 'login',
        element: (
          <Suspense fallback={LoadingComponent}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={LoadingComponent}>
            <Register />
          </Suspense>
        ),
      },
    ],
  },
];

export default authRouter;
