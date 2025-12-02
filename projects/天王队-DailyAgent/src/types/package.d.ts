// 套餐相关类型定义

// 套餐特性接口
export interface PackageFeature {
  id?: number;
  feature: string;
}

// 套餐信息接口
export interface PackageInfo {
  id: number;
  specNo: string;
  specName: string;
  specNameEn: string;
  subtitle: string;
  subtitleEn: string;
  priceUnitEn: string;
  featuresEn: string[];
  developerRights: string[];
  developerRightsEn: string[];
  terminalRights: string[];
  terminalRightsEn: string[];
  amount: number;
  count: number;
  period: number;
  status: boolean;
  sort: number;
  createTime: string;
  updateTime: string;
  features: string[];
}

// API响应接口
export interface PackageListResponse {
  code: number;
  msg: string;
  data: PackageInfo[];
}

// 组件使用的套餐接口
export interface PricingPlan {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  priceUnit: string;
  features: string[];
  isPopular?: boolean;
  buttonText?: string;
}
