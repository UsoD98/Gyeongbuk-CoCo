/**
 * 카카오 공유(Kakao JS SDK `Share.sendDefault`) 헬퍼 + 클립보드 폴백.
 *
 * 앱은 로그인에 `react-kakao-login`을 쓰지만 그 컴포넌트가 마운트된 화면에서만 SDK가 로드된다.
 * 공유는 플래너에서 일어나므로 여기서 SDK를 필요 시 직접 로드·초기화한다.
 *
 * ⚠️ 카카오 공유는 개발자 콘솔에 등록된 도메인에서만 동작한다(localhost 미등록 시 실패).
 *    또한 피드 이미지가 서버에서 크롤 불가한 주소(localhost 등)면 실패할 수 있다.
 *    따라서 어떤 실패든 삼켜(catch) `false`를 돌려주고, 호출부가 클립보드 복사로 폴백한다.
 *    → "링크 생성/공유"라는 DoD는 카카오 없이도 항상 충족된다.
 *
 * 사용 키(VITE_KAKAO_JAVASCRIPT_KEY)는 클라이언트 공개 JS 키다(민감정보 아님, 로그 금지 대상 아님).
 */

interface KakaoLinkTarget {
  mobileWebUrl?: string;
  webUrl?: string;
}

interface KakaoSDK {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share: {
    sendDefault: (settings: {
      objectType: 'feed';
      content: {
        title: string;
        description: string;
        imageUrl: string;
        link: KakaoLinkTarget;
      };
      buttons?: { title: string; link: KakaoLinkTarget }[];
    }) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

const SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';

// SDK 로드를 1회로 합친다(공유 버튼 연타 시 스크립트 중복 삽입 방지).
let sdkPromise: Promise<KakaoSDK | null> | null = null;

function loadSdk(): Promise<KakaoSDK | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Kakao) return Promise.resolve(window.Kakao);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve) => {
    const done = () => resolve(window.Kakao ?? null);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_SRC}"]`,
    );
    if (existing) {
      if (window.Kakao) done();
      else existing.addEventListener('load', done, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_SRC;
    script.async = true;
    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', () => resolve(null), { once: true });
    document.head.appendChild(script);
  });
  return sdkPromise;
}

async function ensureKakao(): Promise<KakaoSDK | null> {
  const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
  if (!key) return null;
  const kakao = await loadSdk();
  if (!kakao) return null;
  if (!kakao.isInitialized()) {
    try {
      kakao.init(key);
    } catch {
      return null;
    }
  }
  return kakao;
}

export interface ShareContent {
  /** 공유 대상 절대 URL(`/share/:id`). */
  url: string;
  title: string;
  description: string;
  /** 피드 카드 썸네일(절대 URL). 미지정 시 favicon 사용. */
  imageUrl?: string;
}

/**
 * 카카오 공유 시도. SDK 미로드·키 없음·도메인 미등록 등 어떤 실패든 `false`를 반환한다
 * (예외를 밖으로 던지지 않는다 → 호출부는 반환값만 보고 폴백을 결정).
 */
export async function shareViaKakao(content: ShareContent): Promise<boolean> {
  const kakao = await ensureKakao();
  if (!kakao) return false;
  const link: KakaoLinkTarget = {
    mobileWebUrl: content.url,
    webUrl: content.url,
  };
  try {
    kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: content.title,
        description: content.description,
        imageUrl:
          content.imageUrl ?? `${window.location.origin}/favicon.svg`,
        link,
      },
      buttons: [{ title: '코스 보기', link }],
    });
    return true;
  } catch {
    return false;
  }
}

/** 텍스트를 클립보드에 복사(공유 폴백). 성공 여부 반환. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 권한 거부·비보안 컨텍스트 → execCommand 폴백으로 진행.
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
