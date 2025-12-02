import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import i18n from '../../i18n';
import { isApp } from '@/utils';

export type Language = 'en' | 'zh-CN';

export interface I18nState {
  lang: Language;
}

const loadLangFromStorage = (): I18nState['lang'] => {
  // 1. 优先检查URL参数
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang === 'en' || urlLang === 'zh-CN') {
    return urlLang;
  }
  // 2. APP内的语言设置
  if (isApp) {
    return window.navigator.userAgent.indexOf('en-US') == -1 ? 'zh-CN' : 'en';
  }

  // 3. 检查localStorage中的语言设置
  const savedLang = localStorage.getItem('i18n_lang');
  if (savedLang === 'en' || savedLang === 'zh-CN') {
    return savedLang;
  }
  // 4. 默认使用中文
  return 'zh-CN';
};

const initialState: I18nState = {
  lang: loadLangFromStorage()
};

export const i18nSlice = createSlice({
  name: 'i18n',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.lang = action.payload;
      localStorage.setItem('i18n_lang', action.payload);
      i18n.changeLanguage(action.payload);
    }
  }
});

export const { setLanguage } = i18nSlice.actions;

export const selectLanguage = (state: RootState) => state.i18n.lang;

export default i18nSlice.reducer; 