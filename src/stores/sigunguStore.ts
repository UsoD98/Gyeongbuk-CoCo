import { create } from 'zustand';

export interface SigunguOption {
  value: string;
  label: string;
}

// 경상북도 지역코드 (법정동 시군구 코드 접두 '47')
export const GYEONGBUK_AREA_CODE = '47';

// value = 시군구 코드(법정동 5자리 중 뒤 3자리), label = 시군구명.
// 포항시는 남구/북구로 분리되어 있다.
const GYEONGBUK_SIGUNGU: SigunguOption[] = [
  { value: '111', label: '포항시 남구' },
  { value: '113', label: '포항시 북구' },
  { value: '130', label: '경주시' },
  { value: '150', label: '김천시' },
  { value: '170', label: '안동시' },
  { value: '190', label: '구미시' },
  { value: '210', label: '영주시' },
  { value: '230', label: '영천시' },
  { value: '250', label: '상주시' },
  { value: '280', label: '문경시' },
  { value: '290', label: '경산시' },
  { value: '730', label: '의성군' },
  { value: '750', label: '청송군' },
  { value: '760', label: '영양군' },
  { value: '770', label: '영덕군' },
  { value: '820', label: '청도군' },
  { value: '830', label: '고령군' },
  { value: '840', label: '성주군' },
  { value: '850', label: '칠곡군' },
  { value: '900', label: '예천군' },
  { value: '920', label: '봉화군' },
  { value: '930', label: '울진군' },
  { value: '940', label: '울릉군' },
];

interface SigunguState {
  areaCode: string;
  sigunguList: SigunguOption[];
  getSigunguLabel: (value: string) => string | undefined;
}

export const useSigunguStore = create<SigunguState>((_set, get) => ({
  areaCode: GYEONGBUK_AREA_CODE,
  sigunguList: GYEONGBUK_SIGUNGU,
  getSigunguLabel: (value) =>
    get().sigunguList.find((item) => item.value === value)?.label,
}));
