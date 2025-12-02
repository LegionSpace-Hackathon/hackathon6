import apiClient from '../../lib/apiClient';
import { ApiResponse } from '../../types/api';
import SHA256 from 'crypto-js/sha256';
import { MD5 } from 'crypto-js';
import {
  ValidTokenType,
  ListParamsType,
  PluginIdType,
  PluginStatisticsRequestType,
  PluginStatisticsResponseType,
  PluginStatisticsEchartRequestType,
  CommentInfoType,
  UserIdType,
  DeveloperSubmit,
  PluginSubmitType,
  ReviewPluginSubmitType,
  ReviewDeveloperSubmitType,
  createDevelopGroupRequestType,
  modifyDevelopGroupRequestType,
  removeMemberRequestType,
  forAuthorizePluginRequestType,
  DeveloperInfo,
  Industry,
  PluginInfo,
  PluginAddInfo,
  SavePluginAddRequest,
} from '../../types/api';
import { PluginDetailType, PluginListItemType, ChainpalUserInfoType } from '../../types/globals';

// 密钥配置
export const secretKey = 'f6819cb0e0c8c1ed86e5f5acc8bfe084c0f12235';
export const secretId = 'At5ipFo4';

// API基础URL - 使用代理路径
export const CHAINMEET_API_BASE = '';

// 排序数据转字符串
export function sortDataToString(obj: any): string {
  if (!obj) return '';

  const keysArr = Object.keys(obj).sort();
  const sortObj: Record<string, any> = {};

  for (const i in keysArr) {
    sortObj[keysArr[i]] = obj[keysArr[i]];
  }

  const str = Object.keys(sortObj)
    .map((key) => {
      return `${key}=${sortObj[key] instanceof Array || sortObj[key] instanceof Object ? JSON.stringify(sortObj[key]) : sortObj[key]}`;
    })
    .join('&');

  return str;
}

// 生成签名
export function generateSignature(data: any): { signature: string; timestamp: number } {
  const timestamp = +new Date();
  const stringSign =
    (sortDataToString(data) ? `${sortDataToString(data)}&` : '') +
    `secretKey=${secretKey}&timestamp=${timestamp}`;
  const hash = SHA256(stringSign);

  return {
    signature: hash.toString(),
    timestamp,
  };
}

// 请求配置
interface RequestOptions {
  language?: string;
}

// Chainmeet响应格式
interface ChainmeetResponse<T> {
  code: any;
  data: any;
  message: string;
}

// 反馈表单参数
export interface FeedbackParams {
  company: string;
  name: string;
  mobile: string;
  code: string;
  content: string;
  countryCode: string;
}

// 发送反馈内容
export const sendFeedback = async (params: FeedbackParams, options: RequestOptions = {}) => {
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<null>>(
    `${CHAINMEET_API_BASE}/feedback/official/submit`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        language: options.language || 'zh-CN',
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// 发送验证码参数
export interface SendCodeParams {
  mobile: string;
  countryCode: string;
}

// 发送短信验证码
export const sendDirectLoginCode = async (params: SendCodeParams, options: RequestOptions = {}) => {
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<null>>(
    `${CHAINMEET_API_BASE}/sendDirectLoginCode`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        language: options.language || 'zh-CN',
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// 国家码列表响应
export interface CountryItem {
  code: string;
  name: string;
}

// 获取国家码
export const countryList = async (params = {}, options: RequestOptions = {}) => {
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<CountryItem[]>>(
    `${CHAINMEET_API_BASE}/common/country/list`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        language: options.language || 'zh-CN',
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// 官方发送验证码
export const officialSendCode = async (params: SendCodeParams, options: RequestOptions = {}) => {
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<null>>(
    `${CHAINMEET_API_BASE}/official/send_code`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        language: options.language || 'zh-CN',
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// 获取下载地址参数
export interface DownloadUrlParams {
  fileKey: string;
}

// 获取下载链接
export const getSignedDownloadUrl = async (
  params: DownloadUrlParams,
  options: RequestOptions = {}
) => {
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<string>>(
    `${CHAINMEET_API_BASE}/official/getSignedDownloadUrl`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        language: options.language || 'zh-CN',
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

/**
 * 通过token 获取链上会用户信息
 */
export async function postValidToken(
  data: ValidTokenType,
  signature: string
): Promise<ChainpalUserInfoType> {
  const response = await apiClient.post<ApiResponse<ChainpalUserInfoType>>(
    `${CHAINMEET_API_BASE}/lightApp/validToken`,
    data,
    {
      headers: {
        signature: MD5(signature).toString(),
      },
    }
  );
  return response.data as any as ChainpalUserInfoType;
}

/**
 *  plugin list
 */
export async function postPluginList(data: ListParamsType): Promise<PluginListItemType[]> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<PluginListItemType[]>>(
      `${CHAINMEET_API_BASE}/plugin/list`,
      data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as PluginListItemType[];
}

/**
 * 智能体数据统计
 */
export async function postPluginStatistics(
  data: PluginStatisticsRequestType
): Promise<PluginStatisticsResponseType[]> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<PluginStatisticsResponseType[]>>(
    `${CHAINMEET_API_BASE}/plugin/data`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as PluginStatisticsResponseType[];
}

/**
 * 智能体数据统计chart 图表统计
 */
export async function postPluginEchartStatistics(
  data: PluginStatisticsEchartRequestType
): Promise<any[]> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any[]>>(
    `${CHAINMEET_API_BASE}/plugin/data/chart`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as any[];
}

/**
 * 智能体数据统计chart 筛选名称
 */
export async function postPluginStatisticsName(data: PluginIdType): Promise<string[]> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<string[]>>(
    `${CHAINMEET_API_BASE}/plugin/data/names`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as string[];
}

/**
 * 获取智能体详情
 */
export async function postPluginDetail(data: { pluginId: string }): Promise<PluginDetailType> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<PluginDetailType>>(
    `${CHAINMEET_API_BASE}/plugin/info`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as PluginDetailType;
}

/**
 * 获取评论列表
 */
export async function postPluginCommentList(data: { pluginId: string }): Promise<CommentInfoType> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<CommentInfoType>>(
    `${CHAINMEET_API_BASE}/developer/plugin/comment/list`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as CommentInfoType;
}

/**
 * 添加评论
 */
export async function postAddComment(data: {
  pluginId: string;
  comment: string;
  score: number;
  userId: string;
}): Promise<any> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/developer/plugin/comment/add`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * 行业信息列表
 */
export const getIndustryList = async (params: { userId: string }): Promise<Industry[]> => {
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<Industry[]>>(
    `${CHAINMEET_API_BASE}/developer/industry`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
      },
    }
  );
  return response.data as any as Industry[];
};

/**
 * 平台: 开发者列表
 */
export async function postDeveloperList(data: ListParamsType | UserIdType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any[]>>(
    `${CHAINMEET_API_BASE}/developer/list`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
}

/**
 * 平台: 开发者审核
 */
export async function postDeveloperReview(data: any) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<any>(
    `${CHAINMEET_API_BASE}/developer/review`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
}

/**
 * 平台: 拒绝开发者申请
 */
export async function postDeveloperRefuse(data: { developerId: string }) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.get<any>(
    `${CHAINMEET_API_BASE}/developer/refuse?developerId=${data.developerId}`,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
}

/**
 * 平台: 智能体审核
 */
export async function postPluginReview(data: ReviewPluginSubmitType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/review`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
}


/**
 * 智能体上传图片
 */
export async function postPluginUpload(data: FormData) {
  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/upload`,
    data,
    {
      headers: {
        'Content-Type': 'application/form-data',
      },
    }
  );
  return response.data;
}

/**
 * 创建开发者群组
 */
export async function postCreateDeveloperGroup(data: createDevelopGroupRequestType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any[]>>(
    `${CHAINMEET_API_BASE}/createDeveloperGroup`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * 添加开发者到群组
 */
export async function postAddDeveloperToGroup(data: createDevelopGroupRequestType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any[]>>(
    `${CHAINMEET_API_BASE}/addDeveloperToGroup`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * 获取开发者群组成员列表
 */
export async function postGroupMemberList(data: createDevelopGroupRequestType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any[]>>(
    `${CHAINMEET_API_BASE}/groupMember`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * 编辑成员的开发组权限
 */
export async function postModifyDeveloperAuth(data: modifyDevelopGroupRequestType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/modifyDeveloperGroupMemberPrivilege`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * 获取好友中的开发者信息
 */
export async function postDeveloperListFormFriends(data: UserIdType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any[]>>(
    `${CHAINMEET_API_BASE}/developerList`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * 删除开发组里面人员
 */
export async function postRemoveDeveloperGroup(data: removeMemberRequestType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any[]>>(
    `${CHAINMEET_API_BASE}/removeDeveloperFromGroup`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
}

/**
 * 授权智能体列表
 */
export async function postPluginListForAuthorize(data: forAuthorizePluginRequestType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any[]>>(
    `${CHAINMEET_API_BASE}/plugin/list/forPriviledge`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * 新增用户列表
 */
export async function postPluginNewUsers(data: PluginStatisticsRequestType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<{
    list: any[];
    total: number;
  }>>(
    `${CHAINMEET_API_BASE}/plugin/new/user/list`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
}

/**
 * 活跃用户列表
 */
export async function postPluginActiveUsers(data: PluginStatisticsRequestType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<{
    list: any[];
    total: number;
  }>>(
    `${CHAINMEET_API_BASE}/plugin/active/user/list`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
}

/**
 * 订单列表
 */
export async function postPluginOrder(data: PluginStatisticsRequestType) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<{
    list: any[];
    total: number;
  }>>(
    `${CHAINMEET_API_BASE}/plugin/order/list`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
}

/**
 * 订单详情
 */
export async function postOrderDetail(data: { id: string; userId: string }) {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/order/detail`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

// 获取开发者信息
export const getDeveloperInfo = async (params: { userId: string }): Promise<any> => {
  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/developer/info`,
    params
  );
  return response;
};

// 提交开发者申请
export interface DeveloperSubmitParams {
  userId: string;
  developerName: string;
  company: string;
  industry: string;
  email?: string;
  mobile?: string;
  submitTime: number;
}

// 获取开发者智能体列表
export const postDeveloperPluginList = async (params: {
  userId: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}): Promise<{
  list: PluginInfo[];
  total: number;
}> => {
  const response = await apiClient.post<
    ChainmeetResponse<{
      list: PluginInfo[];
      total: number;
    }>
  >(`${CHAINMEET_API_BASE}/developer/plugin/list`, params);
  return response.data as any as { list: PluginInfo[]; total: number };
};

// 获取开发者智能体详情
export const postDeveloperPluginDetail = async (params: {
  userId: string;
  pluginId: string;
}): Promise<PluginInfo> => {
  const response = await apiClient.post<ChainmeetResponse<PluginInfo>>(
    `${CHAINMEET_API_BASE}/developer/plugin/detail`,
    params
  );
  return response.data as any as PluginInfo;
};

// 申请智能体
export interface PluginSubmitParams {
  userId: string;
  name: string;
  description: string;
  icon?: string;
  version: string;
  submitTime: number;
}

export const submitPluginApplication = async (
  params: PluginSubmitParams
): Promise<{ success: boolean }> => {
  const response = await apiClient.post<ChainmeetResponse<{ success: boolean }>>(
    `${CHAINMEET_API_BASE}/plugin/submit`,
    params
  );
  return response.data as any as { success: boolean };
};

/**
 * 获取AI代理列表
 */
export async function postAiAgentList(data: { type: string }): Promise<PluginListItemType[]> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.get<ChainmeetResponse<PluginListItemType[]>>(
    `${CHAINMEET_API_BASE}/plugin/ai/list?type=${data.type}`,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as PluginListItemType[];
}

/**
 * 获取智能体列表
 */
export async function postAgentList(data: { type: string }): Promise<PluginListItemType[]> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<PluginListItemType[]>>(
    `${CHAINMEET_API_BASE}/plugin/toolList`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as PluginListItemType[];
}

/**
 * 模板复制
 */
export async function postCopyPlugin(data: { pluginId: string }): Promise<PluginListItemType[]> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<PluginListItemType[]>>(
    `${CHAINMEET_API_BASE}/plugin/copyPlugin`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
}

/**
 * 获取智能体附加信息（提示词、开场白等）
 * @param data.pluginId - 智能体ID
 * @param data.versionId - 可选的版本ID，用于预览历史版本
 */
export async function getPluginAddInfo(data: { pluginId: string; versionId?: string, type?: string }): Promise<PluginAddInfo> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<PluginAddInfo>>(
    `${CHAINMEET_API_BASE}/plugin/getPluginAdd`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as PluginAddInfo;
}

/**
 * 删除智能体
 */
export async function postDelPlugin(data: { pluginId: string }): Promise<any> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/delPlugin`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
}

/**
 * 下架智能体
 */
export async function postDelistPlugin(data: { pluginId: string }): Promise<any> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/delistPlugin`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
}

/**
 * 绑定知识库到智能体
 */
export async function postBindKnowledge(data: { 
  pluginId: string; 
  knowledgeId: string; 
}): Promise<any> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/bindKnowledge`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * 解绑知识库
 */
export async function postUnbindKnowledge(data: { 
  pluginId: string; 
  knowledgeId: string; 
}): Promise<any> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/unbindKnowledge`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * 下架智能体
 */
export async function postTakeDownPlugin(data: { pluginId: string }): Promise<any> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.get<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/takeDown?pluginId=${data.pluginId}`,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

/**
 * 更新智能体信息
 */
export async function postUpdatePlugin(data: {
  pluginId: string;
  pluginName?: string;
  pluginNameEn?: string;
  description?: string;
  descriptionEn?: string;
  logoUrl?: string;
  platformType?: number; // 1本平台  2 跳转三方平台  3 配置Dify api key/url
  platformUrl?: string; // platformType=2时 必填三方平台url
  apiUrl?: string; // platformType=3时 必填dify api url
  apiKey?: string; // platformType=3时 必填dify api key
  agentLabel?: string; // platformType=2或3时 必填智能体分类
}): Promise<any> {
  const { signature, timestamp } = generateSignature(data);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/updatePlugin`,
    data,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
}

/**
 * 智能体logo上传
 */
export async function postPluginUploadLogo(data: FormData) {
  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/uploadLogo`,
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

// 获取分类智能体列表
export const getAgentListByLabel = async (label: string): Promise<PluginListItemType[]> => {
  const { signature, timestamp } = generateSignature({ label });

  const response = await apiClient.post<ChainmeetResponse<{
    labelNameEn: string;
    labelName: string;
    labelCode: number;
    agents: PluginListItemType[];
  }>>(
    `${CHAINMEET_API_BASE}/plugin/listAgentByLabel`,
    { label },
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return (response.data as any).agents || [];
};

// 保存智能体附加信息
export const savePluginAdd = async (params: SavePluginAddRequest): Promise<ApiResponse<any>> => {
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ApiResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/savePluginAdd`,
    {
      ...params,
      signature,
      timestamp,
    },
    {
      headers: {
        "X-Header-App-ID": secretId,
        "X-Header-Signature": signature,
        "X-Header-Timestamp": timestamp,
        os: "platform",
        "Content-Type": "application/json",
      },
    }
  );
  return response as any;
}

// 智能体分类接口
export interface AgentLabel {
  name: string;
  code: string;
  nameEn?: string;
}

// 获取智能体分类列表
export const getAgentLabels = async (): Promise<AgentLabel[]> => {
  const { signature, timestamp } = generateSignature({});

  const response = await apiClient.get<ChainmeetResponse<AgentLabel[]>>(
    `${CHAINMEET_API_BASE}/plugin/getAgentLabels`,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as AgentLabel[];
};

// 发布智能体接口
export interface PublishPluginParams {
  pluginId: string;
  agentLabel: string;
}

// 发布智能体
export const publishPluginAdd = async (params: PublishPluginParams): Promise<ApiResponse<any>> => {
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/publishPlugin`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
};

// ==================== 发布平台相关接口 ====================

// 机器人平台配置接口类型（根据接口文档）
export interface BotPlatform {
  id: string;
  createTime: string;
  updateTime: string;
  agentId: string;
  botName: string;
  botDesc: string;
  botIcon: string;
  botUuid: string | null;
  pipelineUuid: string | null;
  adapter: string;
  adapterToken: string | null;
  status: boolean; // 是否启用
  isConfig: boolean; // 是否配置
  stream: boolean; // 是否启用流式回复模式
  isPublished?: boolean; // 是否已发布
  userId: string;
  clientId?: string; // Discord 平台客户端ID
}

// Telegram配置接口类型
export interface TelegramConfig {
  token: string;
  streamMode: boolean;
}

// 获取机器人平台列表
export const getBotPlatforms = async (pluginId: string): Promise<BotPlatform[]> => {
  const params = { pluginId };
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<BotPlatform[]>>(
    `${CHAINMEET_API_BASE}/plugin/listBot`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as BotPlatform[];
};

// 获取Telegram配置
export const getTelegramConfig = async (pluginId: string): Promise<TelegramConfig | null> => {
  const params = { pluginId };
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<TelegramConfig>>(
    `${CHAINMEET_API_BASE}/plugin/platform/telegram/config`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data as any as TelegramConfig;
};

// 保存Telegram配置
export const saveTelegramConfig = async (
  pluginId: string,
  config: TelegramConfig
): Promise<ApiResponse<any>> => {
  const params = { pluginId, ...config };
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/platform/telegram/save`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
};

// 更新平台启用状态
export const updatePlatformStatus = async (
  pluginId: string,
  platformId: string,
  enabled: boolean
): Promise<ApiResponse<any>> => {
  const params = { pluginId, platformId, enabled };
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/platform/updateStatus`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
};

// 配置机器人
export const configBot = async (
  botId: string,
  adapterToken: string,
  stream: boolean = false,
  clientId?: string // Discord 平台需要的客户端ID
): Promise<ApiResponse<any>> => {
  const params: any = { botId, adapterToken, stream };
  
  // 如果提供了clientId，添加到参数中
  if (clientId) {
    params.clientId = clientId;
  }
  
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/configBot`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
};

// 发布机器人到平台
export const publishBotToPlatform = async (
  pluginId: string,
  platformIds: string[]
): Promise<ApiResponse<any>> => {
  const params = { pluginId, platformIds };
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/publishBot`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
};

// 更新机器人状态
export const updateBotStatus = async (
  botId: string,
  status: boolean
): Promise<ApiResponse<any>> => {
  const params = { botId, status };
  const { signature, timestamp } = generateSignature(params);

  const response = await apiClient.post<ChainmeetResponse<any>>(
    `${CHAINMEET_API_BASE}/plugin/updateBotStatus`,
    params,
    {
      headers: {
        'X-Header-App-ID': secretId,
        'X-Header-Signature': signature,
        'X-Header-Timestamp': timestamp,
        os: 'platform',
        'Content-Type': 'application/json',
      },
    }
  );
  return response as any;
};

// ==================== 版本管理相关接口 ====================

