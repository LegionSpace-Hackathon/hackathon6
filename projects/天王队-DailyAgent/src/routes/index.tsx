import { RouteObject } from 'react-router-dom';
import publicRoutes from './publicRoutes';
import protectedRoutes from './authRoutes';

// 合并所有路由配置
export const routes: RouteObject[] = [
  ...publicRoutes,
  ...protectedRoutes,
];

export default routes; 