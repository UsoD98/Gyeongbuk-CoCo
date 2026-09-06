import { useEffect } from 'react';

/**
 * 오버레이가 열려 있는 동안 배경(문서) 스크롤을 잠근다.
 *
 * 왜 `overflow: hidden` 이 아니라 `position: fixed` 인가 — iOS Safari 는 `body` 의
 * `overflow: hidden` 을 무시한다. 바텀시트 본문을 끝까지 스크롤하면 그 관성이 뒤 페이지로
 * 넘어가(스크롤 체이닝) 닫았을 때 엉뚱한 위치에 있게 된다. `body` 를 화면에 고정하고
 * 현재 스크롤량만큼 위로 밀어 두면(`top: -y`) **보이는 그림은 그대로인 채** 문서가 더 이상
 * 스크롤되지 않고, 풀 때 그 y 로 되돌리면 원래 자리로 정확히 복귀한다.
 * 시트 안쪽 스크롤 컨테이너의 `overscroll-contain` 과 짝이다(R5).
 *
 * 오버레이는 겹칠 수 있다(드로어 위 로그인 게이트 등) → 모듈 스코프 카운터로 셈해
 * **처음 잠글 때 한 번 걸고 마지막 하나가 풀릴 때 한 번 되돌린다**. 중간에 하나가 닫혔다고
 * 배경이 풀려 버리면 남아 있는 오버레이 뒤가 다시 움직인다.
 */

/** 잠금 중 우리가 건드리는 인라인 스타일. 원래 값(대개 빈 문자열)을 그대로 되돌린다. */
const MANAGED = [
  'position',
  'top',
  'left',
  'right',
  'width',
  'paddingRight',
] as const;

type Managed = (typeof MANAGED)[number];

let lockCount = 0;
let saved: { style: Record<Managed, string>; scrollY: number } | null = null;

function apply() {
  // 이미 누군가 잠가 뒀다면 세기만 한다 — 두 번 걸면 두 번째가 top: -0 을 저장해 버린다.
  if (lockCount++ > 0) return;
  const body = document.body;
  const scrollY = window.scrollY;
  // body 를 고정하면 문서 스크롤바가 사라진다 → 데스크톱에서 콘텐츠가 그 폭만큼 튄다.
  // 사라질 스크롤바 폭을 padding 으로 메워 레이아웃 이동을 없앤다(모바일은 대개 0).
  const gutter = window.innerWidth - document.documentElement.clientWidth;

  const style = {} as Record<Managed, string>;
  for (const prop of MANAGED) style[prop] = body.style[prop];
  saved = { style, scrollY };

  body.style.position = 'fixed';
  body.style.top = `${-scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  if (gutter > 0) body.style.paddingRight = `${gutter}px`;
}

function release() {
  if (lockCount === 0) return;
  if (--lockCount > 0) return;
  const prev = saved;
  saved = null;
  if (!prev) return;

  const body = document.body;
  for (const prop of MANAGED) body.style[prop] = prev.style[prop];
  // 고정을 푼 직후에만 문서가 다시 스크롤 가능해진다 → 같은 프레임에서 원위치로 되돌린다.
  window.scrollTo(0, prev.scrollY);
}

/**
 * @param locked 오버레이가 **실제로 화면에 있는가**. 렌더 조건과 같은 값을 넘긴다
 *   (열림 플래그만 보고 잠그면 데이터 대기 중 아무것도 안 보이는데 배경만 굳는다).
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    apply();
    return release;
  }, [locked]);
}
