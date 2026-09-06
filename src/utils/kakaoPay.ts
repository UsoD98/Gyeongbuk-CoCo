/**
 * 카카오페이 1/N 정산하기 링크.
 *
 * 카카오페이 "정산하기"는 REST API 가 아니라 개발자센터
 * [애플리케이션 > 사용 API > 1/N 정산하기 링크 발급]에서 **1회 발급받는 고정 링크**다.
 * 런타임 호출도, 시크릿 키도 없다 → `VITE_` 로 번들에 노출돼도 되는 공개 값이다.
 *
 * ⚠️ 카카오페이 문서가 명시한 한계 두 가지. UI 는 이 한계를 전제로 설계돼 있다.
 *  - 링크는 **발급자의 카카오페이 계정**에 묶인다. 앱 사용자별 정산방을 만들 수 없고,
 *    정산 요청은 링크를 발급한 계정 기준으로 열린다.
 *  - 링크에 **금액 파라미터가 없다**. 사용자가 카카오페이 화면에서 직접 입력해야 하므로
 *    `SettleModal` 이 1인당 금액을 먼저 크게 보여주고 복사까지 쥐여준다.
 */

/**
 * 발급받은 정산하기 링크(`.env` 의 `VITE_KAKAO_PAY_URI`).
 * 미설정이면 `undefined` → 호출부가 정산 UI 자체를 숨긴다(빌드는 깨지지 않는다).
 */
export const KAKAO_PAY_URI: string | undefined =
  (import.meta.env.VITE_KAKAO_PAY_URI as string | undefined)?.trim() ||
  undefined;

/** 정산 기능 노출 여부. 링크가 없으면 버튼을 그리지 않는다. */
export const kakaoPayEnabled = KAKAO_PAY_URI != null;

/**
 * 1인당 분담액(원 단위 정수).
 * `BudgetDashboard` 의 "1인당" 표기(`won(perPerson)`)와 어긋나지 않도록 같은 반올림을 쓴다.
 */
export const perPersonAmount = (perPerson: number): number =>
  Math.max(0, Math.round(perPerson));
