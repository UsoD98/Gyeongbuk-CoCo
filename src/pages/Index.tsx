import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  Minus,
  Plus,
  TableProperties,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useSigunguStore } from '@/stores/sigunguStore.ts';
import { useTravelThemeStore } from '@/stores/travelThemeStore.ts';
import { cn } from '@/utils/cn.ts';
import 'react-datepicker/dist/react-datepicker.css';

const formatDate = (date: Date | null): string | null => {
  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Index() {
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    [],
  );
  const [number, setNumber] = useState(1);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] =
    useState(false);
  const destinationDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const [startDate, endDate] = dateRange;
  const sigunguList = useSigunguStore((state) => state.sigunguList);
  const getSigunguLabel = useSigunguStore((state) => state.getSigunguLabel);
  const themeList = useTravelThemeStore((state) => state.themeList);
  const getThemeLabel = useTravelThemeStore((state) => state.getThemeLabel);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(target)
      ) {
        setIsThemeDropdownOpen(false);
      }

      if (
        destinationDropdownRef.current &&
        !destinationDropdownRef.current.contains(target)
      ) {
        setIsDestinationDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsThemeDropdownOpen(false);
        setIsDestinationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const selectedThemeLabels = useMemo(
    () =>
      selectedThemes
        .map((value) => getThemeLabel(value))
        .filter((label): label is string => Boolean(label)),
    [selectedThemes, getThemeLabel],
  );

  const themeSummary =
    selectedThemeLabels.length > 0
      ? selectedThemeLabels.join(', ')
      : '테마 선택';

  const toggleTheme = (value: string) => {
    setSelectedThemes((current) =>
      current.includes(value)
        ? current.filter((theme) => theme !== value)
        : [...current, value],
    );
  };

  const hasSelectedThemes = selectedThemeLabels.length > 0;

  const selectedDestinationLabels = useMemo(
    () =>
      selectedDestinations
        .map((value) => getSigunguLabel(value))
        .filter((label): label is string => Boolean(label)),
    [selectedDestinations, getSigunguLabel],
  );

  const destinationSummary =
    selectedDestinationLabels.length > 0
      ? selectedDestinationLabels.join(', ')
      : '어디로 떠나시나요?';

  const toggleDestination = (value: string) => {
    setSelectedDestinations((current) =>
      current.includes(value)
        ? current.filter((destination) => destination !== value)
        : [...current, value],
    );
  };

  const hasSelectedDestinations = selectedDestinationLabels.length > 0;

  const handleSearch = () => {
    const searchParams = {
      peopleCount: number,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      transport: 'walk', // TODO: 이동수단 선택 UI 추가 시 상태값으로 교체
      theme: selectedThemes,
      sigunguCode: selectedDestinations,
    };

    // TODO: 검색 API 연동 시 교체 (임시 확인용)
    console.log('search', searchParams);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center px-4 py-6 lg:p-6">
        <div className="flex w-full justify-center">
          <div className="mb-6 w-full max-w-3xl text-center">
            <h1 className="text-xl font-extrabold sm:text-2xl md:text-3xl lg:text-4xl">
              완벽한 경북 여행의 시작
            </h1>
            <p className="mt-2 text-xs text-base-content/70 sm:text-sm md:text-base">
              스마트한 일정 관리와 정밀한 예산 계획으로 더 가볍고 체계적인
              여행을 떠나보세요.
              <br />
              당신만의 여행 코스를 만들어보세요.
            </p>
          </div>
        </div>
        <div className="flex w-full max-w-6xl flex-col gap-3 rounded-2xl bg-base-100 p-3 shadow-lg lg:flex-row lg:items-center lg:gap-4 lg:rounded-full lg:p-4">
          {/* 목적지 */}
          <div className="flex flex-1 items-center gap-2 px-3 lg:px-4">
            <MapPin size={20} className="shrink-0 text-base-content/40" />
            <div ref={destinationDropdownRef} className="w-full min-w-0">
              <div className="text-xs font-semibold text-base-content/60">
                목적지
              </div>
              <div className="relative flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsThemeDropdownOpen(false);
                    setIsDestinationDropdownOpen((current) => !current);
                  }}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-base-100 bg-base-100 text-left text-xs font-medium transition hover:border-base-300 sm:text-sm"
                >
                  <span
                    className={cn(
                      'block min-w-0 flex-1 truncate',
                      hasSelectedDestinations
                        ? 'text-base-content'
                        : 'text-base-content/50',
                    )}
                  >
                    {destinationSummary}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'shrink-0 text-base-content/40 transition-transform',
                      isDestinationDropdownOpen && 'rotate-180',
                    )}
                  />
                </button>

                {isDestinationDropdownOpen ? (
                  <div className="absolute top-full left-0 z-10 mt-2 w-full rounded-xl border border-base-300 bg-base-100 p-2 shadow-lg">
                    <div className="max-h-56 space-y-1 overflow-y-auto">
                      {sigunguList.map((option) => (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-base-content/70 transition hover:bg-base-200 sm:text-sm"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={selectedDestinations.includes(option.value)}
                            onChange={() => toggleDestination(option.value)}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 border-t border-base-200 pt-2 text-xs text-base-content/50">
                      복수 선택 가능
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-base-content/20 lg:block"></div>

          {/* 일정 */}
          <div className="flex flex-1 items-center gap-2 px-3 lg:px-4">
            <Calendar size={20} className="shrink-0 text-base-content/40" />
            <div className="w-full">
              <div className="text-xs font-semibold text-base-content/60">
                일정
              </div>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(dates) => {
                  const [start, end] = Array.isArray(dates)
                    ? dates
                    : [dates, null];
                  setDateRange([start, end]);
                }}
                placeholderText="일정을 선택해주세요"
                dateFormat="yyyy/MM/dd"
                className="w-full cursor-pointer rounded border-0 bg-transparent text-left text-xs font-medium text-base-content outline-none sm:text-sm"
                calendarClassName="custom-datepicker-calendar"
              />
            </div>
          </div>

          <div className="hidden h-12 w-px bg-base-content/20 lg:block"></div>

          {/* 인원 */}
          <div className="flex flex-1 items-center gap-2 px-3 lg:px-4">
            <Users size={20} className="shrink-0 text-base-content/40" />
            <div className="w-full">
              <div className="text-xs font-semibold text-base-content/60">
                인원
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNumber(Math.max(1, number - 1))}
                  className="rounded p-1 transition hover:bg-base-200"
                  aria-label="인원 감소"
                >
                  <Minus size={16} className="text-base-content/40" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={number}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, '');
                    if (!onlyDigits) {
                      setNumber(1);
                      return;
                    }

                    setNumber(Math.max(1, Number(onlyDigits)));
                  }}
                  className="w-10 rounded border border-base-100 bg-transparent px-2 py-1 text-center text-sm font-medium text-base-content transition outline-none focus:border-primary"
                  aria-label="인원 수"
                />
                <button
                  type="button"
                  onClick={() => setNumber(number + 1)}
                  className="rounded p-1 transition hover:bg-base-200"
                  aria-label="인원 증가"
                >
                  <Plus size={16} className="text-base-content/40" />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-base-content/20 lg:block"></div>

          {/* 테마 선택 */}
          <div className="relative flex flex-1 items-center gap-2 px-3 lg:px-4">
            <TableProperties size={20} className="shrink-0 text-base-content/40" />
            <div ref={themeDropdownRef} className="w-full min-w-0">
              <div className="text-xs font-semibold text-base-content/60">
                테마
              </div>
              <div className="relative flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsThemeDropdownOpen((current) => !current)}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-base-100 bg-base-100 text-left text-xs font-medium transition hover:border-base-300 sm:text-sm"
                >
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate',
                      hasSelectedThemes
                        ? 'text-base-content'
                        : 'text-base-content/50',
                    )}
                  >
                    {themeSummary}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'shrink-0 text-base-content/40 transition-transform',
                      isThemeDropdownOpen && 'rotate-180',
                    )}
                  />
                </button>

                {isThemeDropdownOpen ? (
                  <div className="absolute top-full left-0 z-10 mt-2 w-full rounded-xl border border-base-300 bg-base-100 p-2 shadow-lg">
                    <div className="max-h-56 space-y-1 overflow-y-auto">
                      {themeList.map((theme) => (
                        <label
                          key={theme.value}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-base-content/70 transition hover:bg-base-200 sm:text-sm"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={selectedThemes.includes(theme.value)}
                            onChange={() => toggleTheme(theme.value)}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {theme.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 border-t border-base-200 pt-2 text-xs text-base-content/50">
                      복수 선택 가능
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* 검색 버튼 */}
          <button
            type="button"
            aria-label="검색"
            onClick={handleSearch}
            className="btn h-12 w-full flex-none items-center justify-center rounded-full border-none bg-primary p-0 text-white shadow-md transition hover:bg-primary-600 lg:h-12 lg:w-12"
          >
            <Search size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
