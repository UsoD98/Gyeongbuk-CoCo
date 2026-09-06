import Section from '@/components/user/Section.tsx';

/**
 * 카카오로 로그인한 계정에 비밀번호 변경(GBC008) 대신 띄우는 안내.
 *
 * 섹션을 통째로 감추지 않고 이유를 남기는 쪽을 택했다 — 있어야 할 자리가 말없이 비면
 * 사용자는 기능이 사라진 것으로 읽는다. 서버도 `password == null` 이면 같은 이유로 거절한다.
 */
export default function SocialPasswordNotice() {
  return (
    <Section
      title="비밀번호 변경"
      description="카카오 계정으로 로그인해서 이 계정에는 비밀번호가 없어요. 비밀번호는 카카오에서 관리합니다."
    >
      <a
        href="https://accounts.kakao.com"
        target="_blank"
        rel="noreferrer noopener"
        className="btn h-11 btn-outline self-end"
      >
        카카오 계정 관리
      </a>
    </Section>
  );
}
