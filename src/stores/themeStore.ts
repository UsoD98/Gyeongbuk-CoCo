import { create } from 'zustand';

export const themes = [
  'light',
  'dark',
  /*'cupcake',
  'bumblebee',
  'emerald',
  'corporate',*/
];

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  nextTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  // 초기 테마 설정 (시스템 테마나 로컬 스토리지 사용 가능)
  theme: localStorage.getItem('theme') || themes[0],

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  nextTheme: () => {
    const { theme, setTheme } = useThemeStore.getState();
    const currentIndex = themes.indexOf(theme);
    // 다음 인덱스 계산 (마지막이면 다시 0으로)
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    });
  },
}));

// 초기 실행 시 스토어 테마 적용
const savedTheme = localStorage.getItem('theme') || themes[0];
document.documentElement.setAttribute('data-theme', savedTheme);
