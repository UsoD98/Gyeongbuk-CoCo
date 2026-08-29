import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  Minus,
  Plus,
  TableProperties,
  Car,
  Check,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { createCourse } from '@/api/tourCourse.ts';
import type { Transport } from '@/api/tourCourse.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { useSigunguStore } from '@/stores/sigunguStore.ts';
import { toast } from '@/stores/toastStore.ts';
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

/**
 * 이동수단 선택지. 백엔드 TransportType enum 은 WALK 도 갖지만 코스 단위 이동수단으로는
 * 현실적이지 않아 선택지에서 뺐다(값 자체는 과거 코스 표시를 위해 타입·라벨에 남아 있다).
 */
const TRANSPORT_OPTIONS: { value: Transport; label: string }[] = [
  { value: 'CAR', label: '자동차' },
  { value: 'PUBLIC_TRANSPORT', label: '대중교통' },
];

/**
 * 일정 DatePicker 의 커스텀 입력(트리거).
 * react-datepicker 가 `dateFormat="MM/dd"` 로 만든 값이 range 면 "MM/dd - MM/dd" 인데,
 * 구분자만 "~" 로 바꿔 "MM/dd ~ MM/dd" 로 짧게 표시한다 — 연도를 빼 좁은 검색바 칸에서도
 * 날짜가 잘리지 않게 하는 것이 목적. 값이 없으면 placeholder 를 흐리게 렌더.
 */
const DateTrigger = forwardRef<
  HTMLButtonElement,
  { value?: string; onClick?: () => void }
>(({ value, onClick }, ref) => {
  const display = value ? value.replace(' - ', ' ~ ') : '일정을 선택해주세요';
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="flex w-full min-w-0 cursor-pointer items-center rounded-lg border border-base-100 bg-base-100 text-left text-xs font-medium transition hover:border-base-300 sm:text-sm"
    >
      <span
        className={cn(
          'block min-w-0 flex-1 truncate',
          !value && 'text-base-content/50',
        )}
      >
        {display}
      </span>
    </button>
  );
});
DateTrigger.displayName = 'DateTrigger';

export default function Index() {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    null,
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
  const [transport, setTransport] = useState<Transport>('CAR');
  const [isTransportDropdownOpen, setIsTransportDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const destinationDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const transportDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
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

      if (
        transportDropdownRef.current &&
        !transportDropdownRef.current.contains(target)
      ) {
        setIsTransportDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsThemeDropdownOpen(false);
        setIsDestinationDropdownOpen(false);
        setIsTransportDropdownOpen(false);
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

  const selectedDestinationLabel = useMemo(
    () => (selectedDestination ? getSigunguLabel(selectedDestination) : null),
    [selectedDestination, getSigunguLabel],
  );

  const destinationSummary = selectedDestinationLabel ?? '어디로 떠나시나요?';

  const hasSelectedDestination = Boolean(selectedDestinationLabel);

  const transportLabel =
    TRANSPORT_OPTIONS.find((option) => option.value === transport)?.label ??
    '이동수단';

  const handleSearch = async () => {
    if (isSubmitting) {
      return;
    }

    const start = formatDate(startDate);
    const end = formatDate(endDate);
    if (!start || !end) {
      toast.error('여행 일정을 선택해주세요');
      return;
    }
    if (selectedThemeLabels.length === 0) {
      toast.error('테마를 최소 1개 선택해주세요');
      return;
    }

    // 계약(docs/FE_계약_추적표.md #2): sigunguCodes 는 법정동 시군구 코드(3자리 bare, 예 '130').
    // 실측 확정 — 접두 '47' 없이 sigunguStore value 그대로, 배열 전송. 목적지 UI는 단일 선택이므로
    // 원소 1개짜리 배열을 보낸다(미선택 시 생략 → 백엔드가 경북 전역에서 선정).
    const sigunguCodes = selectedDestination ? [selectedDestination] : undefined;

    setIsSubmitting(true);
    try {
      const res = await createCourse({
        peopleCount: number,
        startDate: start,
        endDate: end,
        transport,
        theme: selectedThemeLabels, // 계약(#3): 한국어 라벨 전송(코드/목id 금지)
        sigunguCodes,
      });
      // 제목은 생성 응답의 `res.title`(서버가 저장한 값)을 쓴다 — 아래 title 은 응답이
      // 비었을 때만 쓰이는 폴백이다(loadFromApi 참조).
      const destLabel = selectedDestinationLabel ?? undefined;
      usePlannerStore.getState().loadFromApi(res, {
        title: destLabel ? `${destLabel} 여행 코스` : 'AI 추천 코스',
        dests: selectedDestination ? [selectedDestination] : [],
        start,
        end,
        pax: number,
        themes: selectedThemes,
        transport,
      });
      navigate('/planner/');
    } catch (error) {
      toast.error(getApiErrorMessage(error, '코스 생성에 실패했어요'));
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="flex w-full max-w-6xl flex-col gap-3 rounded-2xl bg-base-100 p-3 shadow-lg lg:flex-row lg:items-center lg:gap-2 lg:rounded-full lg:p-4">
          {/* 목적지 */}
          <div className="flex flex-1 items-center gap-2 px-3 lg:flex-[1.3] lg:px-3">
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
                    setIsTransportDropdownOpen(false);
                    setIsDestinationDropdownOpen((current) => !current);
                  }}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-base-100 bg-base-100 text-left text-xs font-medium transition hover:border-base-300 sm:text-sm"
                >
                  <span
                    className={cn(
                      'block min-w-0 flex-1 truncate',
                      hasSelectedDestination
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
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedDestination((current) =>
                              current === option.value ? null : option.value,
                            );
                            setIsDestinationDropdownOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition hover:bg-base-200 sm:text-sm',
                            selectedDestination === option.value
                              ? 'font-semibold text-primary'
                              : 'text-base-content/70',
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {option.label}
                          </span>
                          {selectedDestination === option.value ? (
                            <Check size={16} className="shrink-0 text-primary" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-base-content/20 lg:block"></div>

          {/* 일정 */}
          <div className="flex flex-1 items-center gap-2 px-3 lg:px-3">
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
                dateFormat="MM/dd"
                customInput={<DateTrigger />}
                calendarClassName="custom-datepicker-calendar"
              />
            </div>
          </div>

          <div className="hidden h-12 w-px bg-base-content/20 lg:block"></div>

          {/* 인원 */}
          <div className="flex flex-1 items-center gap-2 px-3 lg:px-3">
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

          {/* 이동수단 */}
          <div className="relative flex flex-1 items-center gap-2 px-3 lg:px-3">
            <Car size={20} className="shrink-0 text-base-content/40" />
            <div ref={transportDropdownRef} className="w-full min-w-0">
              <div className="text-xs font-semibold text-base-content/60">
                이동수단
              </div>
              <div className="relative flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDestinationDropdownOpen(false);
                    setIsThemeDropdownOpen(false);
                    setIsTransportDropdownOpen((current) => !current);
                  }}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-base-100 bg-base-100 text-left text-xs font-medium transition hover:border-base-300 sm:text-sm"
                >
                  <span className="block min-w-0 flex-1 truncate text-base-content">
                    {transportLabel}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'shrink-0 text-base-content/40 transition-transform',
                      isTransportDropdownOpen && 'rotate-180',
                    )}
                  />
                </button>

                {isTransportDropdownOpen ? (
                  <div className="absolute top-full left-0 z-10 mt-2 w-full rounded-xl border border-base-300 bg-base-100 p-2 shadow-lg">
                    <div className="space-y-1">
                      {TRANSPORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setTransport(option.value);
                            setIsTransportDropdownOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition hover:bg-base-200 sm:text-sm',
                            transport === option.value
                              ? 'font-semibold text-primary'
                              : 'text-base-content/70',
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {option.label}
                          </span>
                          {transport === option.value ? (
                            <Check size={16} className="shrink-0 text-primary" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-base-content/20 lg:block"></div>

          {/* 테마 선택 */}
          <div className="relative flex flex-1 items-center gap-2 px-3 lg:flex-[1.3] lg:px-3">
            <TableProperties size={20} className="shrink-0 text-base-content/40" />
            <div ref={themeDropdownRef} className="w-full min-w-0">
              <div className="text-xs font-semibold text-base-content/60">
                테마
              </div>
              <div className="relative flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDestinationDropdownOpen(false);
                    setIsTransportDropdownOpen(false);
                    setIsThemeDropdownOpen((current) => !current);
                  }}
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
            disabled={isSubmitting}
            className={cn(
              'btn h-12 w-full flex-none items-center justify-center rounded-full border-none bg-primary p-0 text-white shadow-md transition hover:bg-primary-600 lg:h-12 lg:w-12',
              isSubmitting && 'pointer-events-none opacity-70',
            )}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Search size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
