import { useRef, useState } from 'react';
import { Pencil } from 'lucide-react';

import { useCourseTitle } from '@/hooks/useCourseTitle.ts';
import { cn } from '@/utils/cn.ts';

/**
 * 코스 요약 헤더의 제목. 소유 코스면 클릭해 인라인 편집(GBC015)한다.
 *
 * - `editable=false`(게스트·미저장): 읽기 전용 제목만 렌더.
 * - `editable=true`: 클릭 → input → Enter/blur 저장, Escape 취소.
 *   저장은 useCourseTitle(낙관적 업데이트 + 실패 시 롤백)이 담당한다.
 *
 * 표시 전용 상태(편집 여부·draft)는 컨벤션대로 컴포넌트 로컬에 둔다.
 */
const TITLE_CLASS = 'truncate text-lg font-extrabold sm:text-xl';

interface Props {
  title: string;
  editable: boolean;
  courseId: number | null;
}

export default function EditableCourseTitle({
  title,
  editable,
  courseId,
}: Props) {
  const { saving, save } = useCourseTitle();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // Escape 취소 시 onBlur 커밋을 건너뛰기 위한 플래그(blur 는 취소 후에도 발생).
  const cancelRef = useRef(false);

  if (!editable || courseId == null) {
    return <h1 className={TITLE_CLASS}>{title}</h1>;
  }

  const start = () => {
    setDraft(title);
    cancelRef.current = false;
    setEditing(true);
  };

  const commit = () => {
    if (!editing) return;
    setEditing(false);
    if (cancelRef.current) {
      cancelRef.current = false;
      return; // Escape 취소 → 저장 안 함
    }
    void save(courseId, draft);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        maxLength={255}
        aria-label="코스 제목"
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur(); // → onBlur 가 단일 커밋 경로
          } else if (e.key === 'Escape') {
            cancelRef.current = true;
            e.currentTarget.blur();
          }
        }}
        className={cn(
          TITLE_CLASS,
          'w-full max-w-xs rounded-lg border border-primary/40 bg-base-100 px-2 py-0.5 outline-none focus:border-primary',
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      title="제목 수정"
      className="group flex min-w-0 items-center gap-1.5 text-left"
    >
      <h1 className={TITLE_CLASS}>{title}</h1>
      {saving ? (
        <span className="loading loading-spinner loading-xs shrink-0" />
      ) : (
        <Pencil
          size={14}
          className="shrink-0 text-base-content/40 transition-colors group-hover:text-primary"
        />
      )}
    </button>
  );
}
