import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { setThemeMode, getThemeMode, getEffectiveTheme } from '../../theme/utils';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeState {
  mode: ThemeMode;
}

const initialState: ThemeState = {
  mode: getThemeMode()
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      setThemeMode(action.payload);
    },
    toggleThemeMode: (state) => {
      // 循环切换：auto -> light -> dark -> auto
      if (state.mode === 'auto') {
        state.mode = 'light';
      } else if (state.mode === 'light') {
        state.mode = 'dark';
      } else {
        state.mode = 'auto';
      }
      setThemeMode(state.mode);
    },
    toggleLightDark: (state) => {
      // 只在 light 和 dark 之间切换（忽略 auto）
      const effectiveTheme = getEffectiveTheme(state.mode);
      state.mode = effectiveTheme === 'light' ? 'dark' : 'light';
      setThemeMode(state.mode);
    }
  }
});

export const { setThemeMode: setThemeModeAction, toggleThemeMode, toggleLightDark } = themeSlice.actions;

export default themeSlice.reducer; 