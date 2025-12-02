// 全局类型声明

// 全局React声明
interface Window {
  React: typeof import('react');
}

// 其他全局类型声明
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    VITE_API_URL: string;
    // 其他环境变量
  }
}

// 图片模块声明
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg' {
  import React from 'react';
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

// Markdown模块声明
declare module '*.md' {
  const content: string;
  export default content;
}

// SCSS模块声明
declare module '*.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// 声明chainpal-utils模块
declare module './utils/chainpal-utils-0.0.4.js' {
  const utils: any;
  export default utils;
}

// 声明 intersection-observer 模块
declare module 'intersection-observer'; 

// 声明微信接口
interface Window {
  wx?: any;
}

// Chainmeet Plugin Types
export interface ChainpalUserInfoType {
  userId: string
  mobile: string & number
  nickName: string
  portraitUrl: string | null
  telCode?: string
  type: string
  vipLevel?: number
  [key: string]: any
}

export interface PluginListItemType {
  certificate: string
  createDate: string
  description: string
  descriptionEn?: string
  developerId: string
  id: string
  logo: string
  logoUrl: string
  name: string
  nameEn?: string
  pluginSecret: string
  pluginId: string
  reviewTime: string
  status: number
  submitTime: number
  type: string
  updateDate: string
  url: string
  subscriptionPage?: string
  introductionPage?: string
  isSystemPlugin?: boolean
  developerPluginDataList?: Array<any>
  developerPluginDataList0?: Array<any>
  lightAppIconUrl?: string
  lightAppMobileUrl?: string
  lightAppName?: string
  lightAppNameEn?: string
  [key: string]: any
}

export interface PluginDetailType {
  coverImageUrlEn?: string
  coverImageUrlZh?: string
  createDate: string
  description: string
  descriptionEn?: string
  developerId: string | number
  type: string
  id: number
  logoUrl: string
  name: string
  nameEn?: string
  pluginId: string
  pluginSecret: string | null
  reviewTime: string | null
  status: number
  submitTime: number
  updateDate: string
  url: string
  [key: string]: any
} 