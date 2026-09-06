import { useState, type SubmitEvent } from 'react';

import AuthField from '@/components/auth/AuthField.tsx';
import Section from '@/components/user/Section.tsx';
import { useNicknameUpdate } from '@/hooks/useNicknameUpdate.ts';

/** 백엔드 `UserUpdateNicknameRequestDto` 제약(2자 이상 100자 이하)과 같은 규칙. */
function validate(nickname: string): string | undefined {
  const trimmed = nickname.trim();
  if (!trimmed) return '닉네임을 입력해 주세요.';
  if (trimmed.length < 2 || trimmed.length > 100)
    return '닉네임은 2자 이상 100자 이하여야 합니다.';
  return undefined;
}

/**
 * 닉네임 수정(GBC007) 폼.
 * 서버가 빈 응답을 주므로 성공 후 최신값은 `onUpdated`(회원 정보 재조회)로 다시 읽는다 —
 * 낙관적 갱신 대신 서버를 진실로 삼는다(코스 삭제와 동일한 결).
 *
 * 입력값은 `currentNickname`으로 한 번만 초기화한다. 저장 후 새 값이 내려오면
 * 호출부가 `key={currentNickname}`으로 이 컴포넌트를 다시 마운트해 초기화한다
 * (effect 로 state 를 동기화하는 대신 React 권장 패턴인 key 리셋 사용).
 */
export default function NicknameForm({
  currentNickname,
  onUpdated,
}: {
  currentNickname: string;
  onUpdated: () => void;
}) {
  const { saving, save } = useNicknameUpdate();
  const [nickname, setNickname] = useState(currentNickname);
  const [error, setError] = useState<string>();

  const trimmed = nickname.trim();
  const unchanged = trimmed === currentNickname.trim();

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = validate(nickname);
    setError(next);
    if (next || unchanged) return;

    await save(trimmed, onUpdated);
  };

  return (
    <Section title="닉네임" description="다른 사람에게 보이는 이름이에요.">
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <AuthField
          id="mypage-nickname"
          name="nickname"
          icon={<span className="text-subtle">😊</span>}
          placeholder="닉네임"
          type="text"
          autoComplete="nickname"
          value={nickname}
          onChange={setNickname}
          error={error}
        />
        <button
          type="submit"
          /* R8 · 터치 타깃 44px. daisyUI 기본 btn 은 40px 이라 높이를 직접 준다. */
          className="btn h-11 btn-primary self-end"
          disabled={saving || unchanged}
        >
          {saving && <span className="loading loading-spinner loading-sm" />}
          {saving ? '저장 중…' : '변경'}
        </button>
      </form>
    </Section>
  );
}
