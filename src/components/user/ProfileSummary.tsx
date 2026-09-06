import { Mail, MapPin, Cake, Compass } from 'lucide-react';

import type { UserInfo } from '@/api/user.ts';

/** 값이 있을 때만 렌더하는 한 줄. 미입력 필드로 화면이 비어 보이지 않게 한다. */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string | null;
}) {
  if (!value?.trim()) return null;
  return (
    <div className="flex items-start gap-2 text-sm text-base-content/70">
      <Icon size={16} className="mt-0.5 shrink-0 text-base-content/40" />
      <span className="shrink-0 text-base-content/50">{label}</span>
      {/* 긴 이메일·주소가 320px 에서 가로로 밀지 않도록 흘려보낸다(R4 와 같은 규칙). */}
      <span className="min-w-0 break-all">{value}</span>
    </div>
  );
}

/**
 * 회원 정보(GBC006) 표시 카드.
 * 이메일은 로그인 수단이라 변경 API가 없고, 확장 필드(주소·생년월일·여행 성향)도
 * 아직 수정 엔드포인트가 없어 전부 읽기 전용이다. `gender`는 코드값(Byte)이고
 * 라벨 매핑이 계약에 없어 노출하지 않는다.
 */
export default function ProfileSummary({ user }: { user: UserInfo }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-200">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-xl font-black text-primary"
        >
          {user.nickname.trim().slice(0, 1) || '?'}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-lg font-bold text-base-content">
            {user.nickname}
          </p>
          <p className="truncate text-sm text-base-content/50">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-base-200 pt-4">
        <InfoRow icon={Mail} label="이메일" value={user.email} />
        <InfoRow icon={MapPin} label="주소" value={user.address} />
        <InfoRow icon={Cake} label="생년월일" value={user.birthDate} />
        <InfoRow icon={Compass} label="여행 성향" value={user.travelType} />
      </div>
    </div>
  );
}
