/**
 * 플래너 목업 데이터. `docs/sample.html`의 coco/data.jsx 를 TS로 이식.
 * API 도입 시 컴포넌트는 이 모듈 대신 `@/api/*` 를 임포트하도록만 바꾸면 된다
 * (타입은 `@/types/planner` 에 두고 데이터만 교체).
 */
import type {
  CategoryMeta,
  Course,
  PaxBucket,
  Poi,
  PoiCat,
  Region,
  Theme,
} from '@/types/planner.ts';

/** 경북 23개 시군구. ready: 경주·포항·영덕·안동만 데이터 제공. */
export const REGIONS: Region[] = [
  { code: 'gyeongju', name: '경주시', ready: true },
  { code: 'pohang', name: '포항시', ready: true },
  { code: 'yeongdeok', name: '영덕군', ready: true },
  { code: 'andong', name: '안동시', ready: true },
  { code: 'gumi', name: '구미시', ready: false },
  { code: 'gimcheon', name: '김천시', ready: false },
  { code: 'yeongju', name: '영주시', ready: false },
  { code: 'yeongcheon', name: '영천시', ready: false },
  { code: 'sangju', name: '상주시', ready: false },
  { code: 'mungyeong', name: '문경시', ready: false },
  { code: 'gyeongsan', name: '경산시', ready: false },
  { code: 'uiseong', name: '의성군', ready: false },
  { code: 'cheongsong', name: '청송군', ready: false },
  { code: 'yeongyang', name: '영양군', ready: false },
  { code: 'cheongdo', name: '청도군', ready: false },
  { code: 'goryeong', name: '고령군', ready: false },
  { code: 'seongju', name: '성주군', ready: false },
  { code: 'chilgok', name: '칠곡군', ready: false },
  { code: 'yecheon', name: '예천군', ready: false },
  { code: 'bonghwa', name: '봉화군', ready: false },
  { code: 'uljin', name: '울진군', ready: false },
  { code: 'ulleung', name: '울릉군', ready: false },
  { code: 'gunwi', name: '군위군', ready: false },
];

/** 지역 무관 일반 테마. icon 은 lucide 이름 힌트. */
export const THEMES: Theme[] = [
  { id: 'history', name: '문화·역사', icon: 'landmark' },
  { id: 'healing', name: '자연·힐링', icon: 'leaf' },
  { id: 'food', name: '미식·맛집', icon: 'utensils' },
  { id: 'cafe', name: '카페·감성', icon: 'coffee' },
  { id: 'night', name: '야경', icon: 'moon' },
  { id: 'drive', name: '드라이브', icon: 'car' },
  { id: 'activity', name: '액티비티', icon: 'activity' },
  { id: 'value', name: '가성비', icon: 'wallet' },
];

export const CATEGORIES: Record<PoiCat, CategoryMeta> = {
  sight: { label: '관광지' },
  food: { label: '음식점' },
  stay: { label: '숙박' },
  culture: { label: '문화시설' },
};

/**
 * POI 데이터.
 * price: food/sight/culture = 1인 기준, stay = 1박 객실 기준
 * x,y: 지도 플레이스홀더 상의 위치(%)
 */
export const POIS: Poi[] = [
  // ===== 경주 =====
  { id: 'gj-bulguksa', region: 'gyeongju', name: '불국사', cat: 'sight',
    themes: ['history'], buckets: [1, 2, '3-4'], price: 6000, priceNote: '입장료/인',
    hours: '09:00–18:00', rating: 4.7, reviews: 12840, x: 68, y: 30,
    tags: ['유네스코', '필수코스'], img: '불국사 전경',
    desc: '신라 불교문화의 정수. 청운교·백운교와 석가탑·다보탑이 있는 경주 대표 사찰.' },
  { id: 'gj-seokguram', region: 'gyeongju', name: '석굴암', cat: 'sight',
    themes: ['history', 'healing'], buckets: [1, 2], price: 6000, priceNote: '입장료/인',
    hours: '09:00–17:30', rating: 4.6, reviews: 5210, x: 78, y: 24,
    tags: ['유네스코'], img: '석굴암 본존불',
    desc: '토함산 중턱의 인공 석굴 사원. 본존불의 미소로 유명한 신라 조각의 걸작.' },
  { id: 'gj-cheomseongdae', region: 'gyeongju', name: '첨성대', cat: 'sight',
    themes: ['history', 'night'], buckets: [1, 2, '3-4'], price: 0, priceNote: '무료',
    hours: '상시', rating: 4.4, reviews: 9870, x: 42, y: 52,
    tags: ['무료', '야경'], img: '첨성대 + 들꽃',
    desc: '동양에서 가장 오래된 천문대. 밤이면 조명이 켜져 야경 산책 코스로 인기.' },
  { id: 'gj-daereungwon', region: 'gyeongju', name: '대릉원 · 천마총', cat: 'sight',
    themes: ['history'], buckets: [1, 2, '3-4'], price: 3000, priceNote: '입장료/인',
    hours: '09:00–22:00', rating: 4.5, reviews: 7430, x: 38, y: 48,
    tags: ['대형고분'], img: '대릉원 고분군',
    desc: '거대한 신라 왕족 고분군. 목련·벚꽃 시즌 포토스팟과 천마총 내부 관람.' },
  { id: 'gj-wolji', region: 'gyeongju', name: '동궁과 월지', cat: 'sight',
    themes: ['history', 'night'], buckets: [1, 2, '3-4'], price: 3000, priceNote: '입장료/인',
    hours: '09:00–22:00', rating: 4.8, reviews: 15200, x: 47, y: 55,
    tags: ['야경명소', '필수코스'], img: '월지 야경 반영',
    desc: '신라 별궁의 연못. 해 질 녘 물에 비친 누각 조명이 경주 최고의 야경.' },
  { id: 'gj-hwangridan', region: 'gyeongju', name: '황리단길', cat: 'food',
    themes: ['food', 'cafe'], buckets: [1, 2, '3-4'], price: 13000, priceNote: '1인 평균',
    hours: '11:00–21:00', rating: 4.5, reviews: 22100, x: 35, y: 58,
    tags: ['혼밥OK', '거리투어'], img: '황리단길 골목',
    desc: '한옥을 개조한 맛집·카페 거리. 바테이블·소분 메뉴가 많아 혼행에도 부담 없다.' },
  { id: 'gj-ssambap', region: 'gyeongju', name: '경주 쌈밥정식', cat: 'food',
    themes: ['food'], buckets: [2, '3-4'], price: 16000, priceNote: '1인 정식',
    hours: '10:30–20:30', rating: 4.6, reviews: 6300, x: 44, y: 60,
    tags: ['향토음식'], img: '쌈밥 한상차림',
    desc: '30첩 쌈채소와 보리밥, 된장찌개가 나오는 경주식 한정식. 2인 이상 추천.' },
  { id: 'gj-hwangnam', region: 'gyeongju', name: '황남빵 본점', cat: 'food',
    themes: ['cafe', 'value'], buckets: [1, 2, '3-4'], price: 8000, priceNote: '선물용 박스',
    hours: '08:00–22:00', rating: 4.3, reviews: 4100, x: 40, y: 54,
    tags: ['기념품', '디저트'], img: '황남빵 클로즈업',
    desc: '팥앙금이 가득한 경주 대표 간식. 따끈할 때 1~2개 맛보기 좋은 혼행 코스.' },
  { id: 'gj-bomun-cafe', region: 'gyeongju', name: '보문호 뷰 카페', cat: 'food',
    themes: ['cafe', 'healing'], buckets: [1, 2], price: 9000, priceNote: '음료/인',
    hours: '10:00–22:00', rating: 4.4, reviews: 3580, x: 70, y: 62,
    tags: ['오션뷰', '감성'], img: '호수 통창 카페',
    desc: '보문호수를 통창으로 마주하는 대형 카페. 노을과 함께 휴식하기 좋다.' },
  { id: 'gj-gyochon', region: 'gyeongju', name: '교촌마을', cat: 'culture',
    themes: ['history', 'cafe'], buckets: [1, 2, '3-4'], price: 0, priceNote: '무료입장',
    hours: '09:00–18:00', rating: 4.4, reviews: 8800, x: 36, y: 64,
    tags: ['전통한옥', '체험'], img: '교촌 한옥거리',
    desc: '최부자댁과 향교가 있는 조선 한옥마을. 교동법주·한복체험 등 즐길 거리.' },
  { id: 'gj-stay-hanok', region: 'gyeongju', name: '황남 한옥스테이', cat: 'stay',
    themes: ['history', 'healing'], buckets: [2, '3-4'], price: 120000, priceNote: '1박/객실',
    hours: '체크인 15:00', rating: 4.7, reviews: 980, x: 39, y: 56,
    tags: ['한옥', '마당'], img: '한옥 객실 마당',
    desc: '대릉원 옆 도보권 전통 한옥 게스트하우스. 마당과 툇마루가 있는 독채형 객실.' },
  { id: 'gj-stay-sense', region: 'gyeongju', name: '감성 부티크 스테이', cat: 'stay',
    themes: ['cafe', 'healing'], buckets: [1, 2], price: 95000, priceNote: '1박/객실',
    hours: '체크인 15:00', rating: 4.6, reviews: 1240, x: 50, y: 50,
    tags: ['감성숙소', '2인'], img: '감성 객실 인테리어',
    desc: '2인에 최적화된 디자인 부티크 호텔. 욕조·플레이리스트가 있는 무드 객실.' },
  { id: 'gj-stay-family', region: 'gyeongju', name: '보문 패밀리 리조트', cat: 'stay',
    themes: ['value'], buckets: ['3-4'], price: 180000, priceNote: '1박/패밀리룸',
    hours: '체크인 15:00', rating: 4.5, reviews: 2100, x: 72, y: 58,
    tags: ['패밀리룸', '비용분담'], img: '패밀리룸 트윈',
    desc: '보문관광단지 내 리조트. 4인 패밀리룸으로 1인당 숙박비 부담이 가장 낮다.' },

  // ===== 포항 =====
  { id: 'ph-homigot', region: 'pohang', name: '호미곶 해맞이광장', cat: 'sight',
    themes: ['healing', 'drive'], buckets: [1, 2, '3-4'], price: 0, priceNote: '무료',
    hours: '상시', rating: 4.5, reviews: 6700, x: 75, y: 35,
    tags: ['일출', '상생의손'], img: '상생의 손 조형물',
    desc: "한반도 가장 동쪽 일출 명소. 바다 위 '상생의 손' 조형물이 상징." },
  { id: 'ph-spacewalk', region: 'pohang', name: '포항 스페이스워크', cat: 'sight',
    themes: ['activity', 'night'], buckets: [1, 2, '3-4'], price: 0, priceNote: '무료',
    hours: '10:00–20:00', rating: 4.6, reviews: 5400, x: 40, y: 30,
    tags: ['전망', '스릴'], img: '트랙형 조형물',
    desc: '철길처럼 휘어진 트랙 위를 걷는 체험형 조형물. 포항 시내·바다 전망.' },
  { id: 'ph-jukdo', region: 'pohang', name: '죽도시장', cat: 'food',
    themes: ['food', 'value'], buckets: [2, '3-4'], price: 18000, priceNote: '1인 회/물회',
    hours: '06:00–22:00', rating: 4.4, reviews: 9100, x: 45, y: 50,
    tags: ['물회', '수산시장'], img: '죽도시장 회센터',
    desc: '동해안 최대 수산시장. 물회·대게·과메기 등 포항 미식의 중심.' },
  { id: 'ph-stay-ocean', region: 'pohang', name: '영일대 오션뷰 호텔', cat: 'stay',
    themes: ['healing', 'drive'], buckets: [2, '3-4'], price: 110000, priceNote: '1박/객실',
    hours: '체크인 15:00', rating: 4.5, reviews: 1500, x: 42, y: 38,
    tags: ['오션뷰', '가성비'], img: '오션뷰 객실',
    desc: '영일대 해변 앞 가성비 오션뷰 호텔. 야경 산책과 연계 좋은 2~3인 숙소.' },

  // ===== 영덕 =====
  { id: 'yd-blue-road', region: 'yeongdeok', name: '영덕 블루로드', cat: 'sight',
    themes: ['healing', 'drive', 'activity'], buckets: [1, 2, '3-4'], price: 0, priceNote: '무료',
    hours: '상시', rating: 4.6, reviews: 3200, x: 60, y: 40,
    tags: ['해안트레킹', '드라이브'], img: '해안 산책로',
    desc: '강구항~축산항 해안 트레킹·드라이브 코스. 풍력발전기와 동해 절경.' },
  { id: 'yd-daege', region: 'yeongdeok', name: '강구항 대게거리', cat: 'food',
    themes: ['food'], buckets: [2, '3-4'], price: 35000, priceNote: '1인 대게',
    hours: '10:00–21:00', rating: 4.5, reviews: 4800, x: 50, y: 55,
    tags: ['대게', '제철'], img: '영덕대게 한마리',
    desc: '영덕대게 원조 거리. 2~3인이 모여 한 상 나눠 먹기 좋은 제철 별미.' },
  { id: 'yd-stay-pension', region: 'yeongdeok', name: '축산항 오션 펜션', cat: 'stay',
    themes: ['healing', 'value'], buckets: [2, '3-4'], price: 130000, priceNote: '1박/객실',
    hours: '체크인 15:00', rating: 4.4, reviews: 620, x: 64, y: 48,
    tags: ['오션뷰', '바베큐'], img: '펜션 테라스',
    desc: '바다를 마주한 테라스 펜션. 바베큐장이 있어 소그룹 여행에 적합.' },

  // ===== 안동 =====
  { id: 'ad-hahoe', region: 'andong', name: '하회마을', cat: 'culture',
    themes: ['history'], buckets: [1, 2, '3-4'], price: 5000, priceNote: '입장료/인',
    hours: '09:00–18:00', rating: 4.6, reviews: 11200, x: 35, y: 45,
    tags: ['유네스코', '전통'], img: '하회마을 전경',
    desc: '낙동강이 휘감는 조선 양반촌. 탈춤 공연과 고택이 보존된 유네스코 마을.' },
  { id: 'ad-woryeong', region: 'andong', name: '월영교', cat: 'sight',
    themes: ['night', 'healing'], buckets: [1, 2, '3-4'], price: 0, priceNote: '무료',
    hours: '상시', rating: 4.5, reviews: 8400, x: 55, y: 38,
    tags: ['야경', '목교'], img: '월영교 야간조명',
    desc: '국내 최장 목책 인도교. 밤 조명과 분수가 어우러지는 안동 야경 1번지.' },
  { id: 'ad-jjimdak', region: 'andong', name: '구시장 찜닭골목', cat: 'food',
    themes: ['food', 'value'], buckets: ['3-4'], price: 12000, priceNote: '1인 (4인기준)',
    hours: '10:00–21:00', rating: 4.5, reviews: 7600, x: 48, y: 52,
    tags: ['안동찜닭', '나눠먹기'], img: '안동찜닭 한판',
    desc: '안동찜닭의 본고장. 한 판을 3~4인이 나눠 먹어 1인당 가성비 최고.' },
  { id: 'ad-stay-gotaek', region: 'andong', name: '군자마을 고택', cat: 'stay',
    themes: ['history'], buckets: ['3-4'], price: 150000, priceNote: '1박/채',
    hours: '체크인 15:00', rating: 4.7, reviews: 540, x: 42, y: 40,
    tags: ['고택체험', '4인'], img: '고택 사랑채',
    desc: '400년 종택에서의 하룻밤. 4인 친구 모임용 채 단위 한옥 고택 체험.' },
];

/** 기본 추천 코스 (경주 2박3일, 2인) */
export const DEFAULT_COURSE: Record<string, Course> = {
  gyeongju: {
    title: '경주 역사 산책 & 황리단길 미식 2박 3일',
    days: [
      { label: 'Day 1', items: ['gj-cheomseongdae', 'gj-daereungwon', 'gj-hwangridan', 'gj-stay-sense'] },
      { label: 'Day 2', items: ['gj-bulguksa', 'gj-seokguram', 'gj-ssambap', 'gj-wolji'] },
      { label: 'Day 3', items: ['gj-gyochon', 'gj-hwangnam'] },
    ],
  },
};

/** 인원수 → 버킷 매핑 */
export function paxBucket(n: number): PaxBucket {
  if (n <= 1) return 1;
  if (n === 2) return 2;
  return '3-4';
}

/** 일정(시작/종료) → 박 수 */
export function nightsFromRange(start: string, end: string): number {
  if (!start || !end) return 2;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function poiById(id: string): Poi | undefined {
  return POIS.find((p) => p.id === id);
}
