import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { withSuspense } from './routeUtils';

// 懒加载组件
const AgentPage = lazy(() => import('../pages/Agent'));

// 受保护的路由配置 - 只保留 Agent 相关路由
export const protectedRoutes: RouteObject[] = [
  // Agent作为独立路由
  {
    path: 'agent',
    element: withSuspense(AgentPage),
  },
  {
    path: 'agent-orchestration/:id',
    element: withSuspense(AgentPage),
  },
];

export default protectedRoutes;
