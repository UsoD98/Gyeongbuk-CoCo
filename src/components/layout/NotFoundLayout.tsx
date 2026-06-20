import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          className="leading-none font-black tracking-tight text-primary tabular-nums"
          style={{ fontSize: 96 }}
        >
          404
        </span>

        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">길을 잃으셨네요</h2>
          <p className="text-muted text-sm">
            요청하신 페이지를 찾을 수 없어요.
          </p>
        </div>

        <Link to="/" className="btn btn-primary">
          <Home size={16} />
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
