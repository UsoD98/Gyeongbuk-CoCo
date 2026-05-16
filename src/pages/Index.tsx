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
import { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const themeOptions = [
  { value: 'adventure', label: '어드벤처' },
  { value: 'relaxation', label: '휴식' },
  { value: 'culture', label: '문화' },
  { value: 'food', label: '음식' },
];

const destinationOptions = [
  { value: 'inter', label: 'Inter' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'raleway', label: 'Raleway' },
];

export default function Index() {
  const [destination, setDestination] = useState('');
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
      themeOptions
        .filter((theme) => selectedThemes.includes(theme.value))
        .map((theme) => theme.label),
    [selectedThemes],
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

  const themeButtonTextClass =
    selectedThemeLabels.length > 0 ? 'text-gray-800' : 'text-gray-500';

  const selectedDestinationLabel =
    destinationOptions.find((option) => option.value === destination)?.label ??
    '어디로 떠나시나요?';

  const destinationButtonTextClass = destination
    ? 'text-gray-800'
    : 'text-gray-500';

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center px-4 py-6 sm:px-6 lg:p-6">
        <div className="flex w-full justify-center">
          <div className="mb-6 w-full max-w-3xl text-center">
            <h1 className="text-xl font-extrabold sm:text-2xl md:text-3xl lg:text-4xl">
              완벽한 경북 여행의 시작
            </h1>
            <p className="mt-2 text-xs text-gray-700 sm:text-sm md:text-base">
              스마트한 일정 관리와 정밀한 예산 계획으로 더 가볍고 체계적인
              여행을 떠나보세요.
              <br />
              당신만의 여행 코스를 만들어보세요.
            </p>
          </div>
        </div>
        <div className="flex w-full max-w-6xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-lg sm:gap-4 sm:rounded-full sm:p-4 lg:flex-row lg:items-center">
          {/* 목적지 */}
          <div className="flex flex-1 items-center gap-2 px-3 sm:px-4">
            <MapPin size={20} className="shrink-0 text-gray-400" />
            <div ref={destinationDropdownRef} className="w-full min-w-0">
               <div className="text-xs font-semibold text-gray-500">목적지</div>
               <div className="relative flex items-center gap-1">
                 <button
                   type="button"
                   onClick={() => {
                     setIsThemeDropdownOpen(false);
                     setIsDestinationDropdownOpen((current) => !current);
                   }}
                   className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-white bg-white text-left text-xs font-medium transition hover:border-gray-300 sm:text-sm"
                 >
                   <span
                     className={`block min-w-0 flex-1 truncate ${destinationButtonTextClass}`}
                   >
                     {selectedDestinationLabel}
                   </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-gray-400 transition-transform ${
                      isDestinationDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDestinationDropdownOpen ? (
                  <div className="absolute top-full left-0 z-10 mt-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    <div className="space-y-1">
                      {destinationOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setDestination(option.value);
                            setIsDestinationDropdownOpen(false);
                          }}
                          className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                            destination === option.value
                              ? 'bg-gray-100 font-semibold text-gray-800'
                              : 'text-gray-700'
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

           <div className="h-12 w-px bg-gray-200"></div>

           {/* 일정 */}
           <div className="flex flex-1 items-center gap-2 px-3 sm:px-4">
             <Calendar size={20} className="shrink-0 text-gray-400" />
             <div className="w-full">
               <div className="text-xs font-semibold text-gray-500">일정</div>
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
                 className="w-full cursor-pointer rounded border-0 bg-transparent text-left text-xs font-medium text-gray-800 outline-none sm:text-sm"
                 calendarClassName="custom-datepicker-calendar"
               />
             </div>
           </div>

           <div className="hidden h-12 w-px bg-gray-200 lg:block"></div>

           {/* 인원 */}
           <div className="flex flex-1 items-center gap-2 px-3 sm:px-4">
             <Users size={20} className="shrink-0 text-gray-400" />
             <div className="w-full">
               <div className="text-xs font-semibold text-gray-500">인원</div>
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   onClick={() => setNumber(Math.max(1, number - 1))}
                   className="rounded p-1 transition hover:bg-gray-100"
                 >
                   <Minus size={16} className="text-gray-400" />
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
                   className="w-10 rounded border border-white bg-transparent px-2 py-1 text-center text-sm font-medium text-gray-800 transition outline-none focus:border-primary"
                   aria-label="인원 수"
                 />
                 <button
                   type="button"
                   onClick={() => setNumber(number + 1)}
                   className="rounded p-1 transition hover:bg-gray-100"
                 >
                   <Plus size={16} className="text-gray-400" />
                 </button>
               </div>
             </div>
           </div>

           <div className="hidden h-12 w-px bg-gray-200 lg:block"></div>

           {/* 테마 선택 */}
           <div className="relative flex flex-1 items-center gap-2 px-3 sm:px-4">
             <TableProperties size={20} className="shrink-0 text-gray-400" />
             <div ref={themeDropdownRef} className="w-full min-w-0">
               <div className="text-xs font-semibold text-gray-500">테마</div>
               <div className="relative flex items-center gap-1">
                 <button
                   type="button"
                   onClick={() => setIsThemeDropdownOpen((current) => !current)}
                   className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-white bg-white text-left text-xs font-medium transition hover:border-gray-300 sm:text-sm"
                 >
                   <span
                     className={`min-w-0 flex-1 truncate ${themeButtonTextClass}`}
                   >
                     {themeSummary}
                   </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-gray-400 transition-transform ${
                      isThemeDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                 {isThemeDropdownOpen ? (
                   <div className="absolute top-full left-0 z-10 mt-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                     <div className="max-h-56 space-y-1 overflow-y-auto">
                       {themeOptions.map((theme) => (
                         <label
                           key={theme.value}
                           className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-gray-700 transition hover:bg-gray-50 sm:text-sm"
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
                     <div className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-400">
                       복수 선택 가능
                     </div>
                   </div>
                 ) : null}
               </div>
             </div>
           </div>

           {/* 검색 버튼 */}
           <button className="btn w-full flex-none items-center justify-center rounded-full border-none bg-primary p-0 text-white shadow-md transition hover:bg-primary-600 sm:h-12 sm:w-12 lg:h-12 lg:w-12 h-12">
             <Search size={20} />
           </button>
         </div>
       </div>
     </div>
   );
 }
