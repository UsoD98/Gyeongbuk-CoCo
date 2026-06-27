import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KakaoLogin from 'react-kakao-login';

import { kakaoCallback } from '@/api/auth.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { toast } from '@/stores/toastStore.ts';

const kakaoJavaScriptKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;

interface KakaoLoginComponentProps {
  // 로그인 성공 후 이동할 경로. 가드에서 넘어온 원래 위치(없으면 '/').
  redirectTo?: string;
}

const KakaoLoginComponent = ({ redirectTo = '/' }: KakaoLoginComponentProps) => {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  // 콜백이 진행 중일 때 버튼 더블클릭으로 교환 요청이 중복 발사되는 것을 막는다.
  const [submitting, setSubmitting] = useState(false);

  if (!kakaoJavaScriptKey) {
    return (
      <div className="alert alert-error">
        <p className="text-sm">카카오 로그인 키가 설정되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <KakaoLogin
        token={kakaoJavaScriptKey}
        // 데스크톱 웹에는 카카오톡 앱(intent: 스킴) 핸들러가 없어 간편로그인이 실패한다.
        // false로 두어 항상 웹 OAuth 팝업(kauth.kakao.com) 플로우를 쓴다.
        throughTalk={false}
        onSuccess={async (response) => {
          setSubmitting(true);
          try {
            // FE가 받은 카카오 AccessToken을 백엔드에 넘겨 자체 JWT로 교환한다.
            const { accessToken } = await kakaoCallback({
              kakaoAccessToken: response.response.access_token,
            });
            setAccessToken(accessToken);
            toast.success('로그인되었습니다.');
            navigate(redirectTo, { replace: true });
          } catch (err) {
            toast.error(getApiErrorMessage(err, '카카오 로그인에 실패했습니다.'));
            setSubmitting(false);
          }
        }}
        onFail={(err) => {
          console.error('카카오 로그인 실패:', err);
          toast.error('카카오 로그인에 실패했습니다. 다시 시도해 주세요.');
          setSubmitting(false);
        }}
        render={({ onClick }) => (
          <button
            type="button"
            onClick={onClick}
            disabled={submitting}
            className="btn w-full border-2 border-[#f1d800] bg-[#FEE502] font-semibold text-[#181600] transition-all hover:border-[#e6c200] hover:bg-[#f1d800]"
          >
            <svg
              aria-label="Kakao logo"
              width="20"
              height="20"
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#181600"
                d="M255.5 48C299.345 48 339.897 56.5332 377.156 73.5996C414.415 90.666 443.871 113.873 465.522 143.22C487.174 172.566 498 204.577 498 239.252C498 273.926 487.174 305.982 465.522 335.42C443.871 364.857 414.46 388.109 377.291 405.175C340.122 422.241 299.525 430.775 255.5 430.775C241.607 430.775 227.262 429.781 212.467 427.795C148.233 472.402 114.042 494.977 109.892 495.518C107.907 496.241 106.012 496.15 104.208 495.248C103.486 494.706 102.945 493.983 102.584 493.08C102.223 492.177 102.043 491.365 102.043 490.642V489.559C103.126 482.515 111.335 453.169 126.672 401.518C91.8486 384.181 64.1974 361.2 43.7185 332.575C23.2395 303.951 13 272.843 13 239.252C13 204.577 23.8259 172.566 45.4777 143.22C67.1295 113.873 96.5849 90.666 133.844 73.5996C171.103 56.5332 211.655 48 255.5 48Z"
              ></path>
            </svg>
            카카오로 시작하기
          </button>
        )}
      />
    </div>
  );
};

export default KakaoLoginComponent;
