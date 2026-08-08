import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="mx-auto flex flex-col items-center justify-center space-y-3 py-12 text-base-content/60">
      <svg
        className="h-6 w-6 animate-spin text-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0
          5.373 0 12h4zm2 5.291A7.962 7.962 0
          014 12H0c0 3.042 1.135 5.824 3
          7.938l3-2.647z"
        ></path>
      </svg>
      <span className="text-sm font-medium">데이터를 불러오는 중입니다...</span>
    </div>
  );
};

export default Loading;
