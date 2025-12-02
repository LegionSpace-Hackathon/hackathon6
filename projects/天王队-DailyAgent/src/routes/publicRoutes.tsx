import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense } from './routeUtils';

// 懒加载组件 - 只保留必要的页面
const NotFound = lazy(() => import('../pages/NotFound'));
const Login = lazy(() => import('../pages/Login'));
const Home = lazy(() => import('../pages/Home'));

// 公共路由配置 - 只保留必要的路由
const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: withSuspense(Home)
  },
  {
    path: '/login',
    element: withSuspense(Login)
  },
  {
    path: '*',
    element: withSuspense(NotFound)
  },
];

export default publicRoutes;
