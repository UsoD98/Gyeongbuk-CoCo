import { create } from 'zustand';

export interface ThemeOption {
  value: string;
  label: string;
}

// value = 테마 코드, label = 테마명.
const TRAVEL_THEMES: ThemeOption[] = [
  { value: '001', label: '어드벤처' },
  { value: '002', label: '휴식' },
  { value: '003', label: '문화' },
  { value: '004', label: '음식' },
];

interface TravelThemeState {
  themeList: ThemeOption[];
  getThemeLabel: (value: string) => string | undefined;
}

export const useTravelThemeStore = create<TravelThemeState>((_set, get) => ({
  themeList: TRAVEL_THEMES,
  getThemeLabel: (value) =>
    get().themeList.find((item) => item.value === value)?.label,
}));
