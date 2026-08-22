/**
 * TourAPI 좌표(`mapx`=경도 / `mapy`=위도) 유효성 검사.
 *
 * TourAPI 데이터에는 좌표가 `0` 인 항목이 섞여 있다(경주 실측 324건 중 1건). 이런 값을
 * 지도 bounding box 계산에 넣으면 span 이 폭발해 나머지 마커가 한 점에 뭉치고, 카카오맵
 * 마커는 아프리카 앞바다에 찍힌다 → 대한민국 경위도 범위 밖이면 **좌표 없음**으로 본다.
 *
 * 목록(GBC017)·상세(GBC018) 두 경로가 같은 판정을 써야 하므로 여기 한 곳에 둔다.
 */
const KOREA_BBOX = { minLng: 124, maxLng: 132, minLat: 33, maxLat: 39 };

export function isValidTourCoord(
  mapx: number | null | undefined,
  mapy: number | null | undefined,
): boolean {
  return (
    mapx != null &&
    mapy != null &&
    mapx >= KOREA_BBOX.minLng &&
    mapx <= KOREA_BBOX.maxLng &&
    mapy >= KOREA_BBOX.minLat &&
    mapy <= KOREA_BBOX.maxLat
  );
}
