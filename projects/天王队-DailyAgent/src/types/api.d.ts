interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  msg?: string;
  code: number | string | any;
}

interface LoginResponse {
  user: {
    id: string;
    username: string;
    email?: string;
    avatar?: string;
    role: string;
  };
  token: string;
}

export type { ApiResponse, LoginResponse };

// Chainmeet Plugin API Types
export interface ValidTokenType {
  token: string
  appId: string
  timestamp: number
}

export interface UserIdType {
  userId: string;
}

export interface ListParamsType {
  userId?: string
  status?: number
  type?: string
  pluginType?: string
}

export interface PluginIdType {
  pluginId: string
}

export interface DeveloperSubmit {
  userId: string;
  developerName: string;
  mobile?: string;
  email?: string;
  company: string;
  industry: string | number | null;
  submitTime: Number;
}

export interface PluginSubmitType {
  userId: string;
  developerId: string | number;
  pluginName: string;
  pluginNameEn: string;
  pluginUrl: string;
  logoUrl: string;
  certificateUrl?: string;
  coverImageUrlEn?: string;
  coverImageUrlZh?: string;
  description: string;
  descriptionEn: string;
}

export interface ReviewPluginSubmitType {
  pluginId: string | number;
  status: number;
  reviewComment: string;
}

export interface ReviewDeveloperSubmitType {
  developerId: string | number;
  status: number;
  reviewComment: string;
}

export interface PluginStatisticsRequestType {
  pluginId: string | number
  startDate?: string
  endDate?: string
  type?: string
  dateType?: string
  pageNo?: number
  pageSize?: number
}

export interface PluginStatisticsResponseType {
  name: string
  value: string | number
  dateValue?: string
  startDate?: string
  endDate?: string
}

export interface PluginStatisticsEchartRequestType {
  pluginId: string | number
  dataName: string
  startDate: string
  endDate: string
  type?: string
}

export interface createDevelopGroupRequestType {
  userId: string;
  groupOwnerDeveloperId: string | number;
  developerIdList?: Array<string | number>;
}

export interface modifyDevelopGroupRequestType {
  userId: string;
  groupOwnerDeveloperId: string | number;
  developerId: string | number;
  pluginIds: Array<string | number>;
}

export interface removeMemberRequestType {
  groupOwnerDeveloperId: string | number;
  developerId: string | number;
}

export interface forAuthorizePluginRequestType {
  userId: string;
  status: number;
  developerId: string | number | '';
}

export interface CommentListItemType {
  id: string
  comment: string
  date: string
  portrait: string
  displayName: string
  score: number
}

export interface CommentInfoType {
  pluginId: string
  commentList: Array<CommentListItemType>
  score: number
  scores: {
    [key: string]: number
  }
}

// 开发者相关接口类型定义
export interface DeveloperInfo {
  id?: string;
  userId: string;
  developerName: string;
  company: string;
  developerId: string;
  industry: string;
  email?: string;
  mobile?: string;
  status: number; // 0(待审核), 1(审核通过), -1(审核拒绝)
  reviewComment?: string;
  createTime?: number;
  updateTime?: number;
  submitTime: number;
  // 新增企业四要素字段
  idCard?: string;
  legalPersonName?: string;
  creditCode?: string;
  // 套餐和资源点信息
  specName?: string;
  specNameEn?: string;
  point?: {
    remainPoint: number;
    totalPoint: number;
    expired?: boolean;
  };
  portrait?: string;
}

export interface Industry {
  id: string;
  name: string;
  nameEn: string;
}

// 智能体相关接口类型定义
export interface PluginInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  developerId: string;
  developerName: string;
  status: number; // 0-草稿, 1-审核中, 2-已上架, 3-已下架, 4-审核失败
  reviewComment?: string;
  createTime: number;
  updateTime: number;
}

// 智能体附加信息类型定义
export interface PluginAddInfo {
  id: string;
  createTime: string;
  updateTime: string;
  pluginId: string;
  tipWord: string; // 提示词（中文）
  tipWordEn?: string; // 提示词（英文）
  openRemark: string; // 开场白（中文）
  openRemarkEn?: string; // 开场白（英文）
  presetQuestion: string; // 预设问题（中文）
  presetQuestionEn?: string; // 预设问题（英文）
  knowledgeId?: string; // 绑定的知识库ID
  knowledgeName?: string; // 绑定的知识库名称
  agentLabel?: string; // 智能体分类ID
  parentPluginId?: string; // 父插件ID，如果有值则表示是子插件，不可编辑提示词和开场白
  latestVersion?: boolean; // 是否最新版本
  agentVersionId?: string; // 非最新版时返回的版本ID
  agentTools?: any[]; // 工具列表
}

// 保存智能体附加信息请求类型
export interface SavePluginAddRequest {
  pluginId: string;
  tipWord: string;
  tipWordEn: string;
  openRemark: string;
  openRemarkEn: string;
  presentQuestion: string;
  presentQuestionEn: string;
  knowledgeId: string;
} 