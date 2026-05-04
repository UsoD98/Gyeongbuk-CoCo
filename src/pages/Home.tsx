export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-lg bg-blue-100 p-6 text-center">
        <h1 className="text-2xl font-bold lg:text-4xl">반응형 Layout 테스트</h1>
        <p className="mt-2 text-gray-600 lg:text-lg">
          화면 크기에 따라 여백과 최대 너비가 어떻게 변하는지 확인해보세요.
        </p>
      </section>

      {/* Grid Section */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">콘텐츠 그리드</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg bg-gray-100 p-4">박스 1</div>
          <div className="rounded-lg bg-gray-100 p-4">박스 2</div>
          <div className="rounded-lg bg-gray-100 p-4">박스 3</div>
        </div>
      </section>

      {/* Text Section */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">설명 텍스트</h2>
        <p className="leading-relaxed text-gray-700">
          이 레이아웃은 모바일에서는 좌우 16px 여백(`px-4`)을 두고,
          데스크톱에서는 좌우 40px 여백(`lg:px-10`)을 적용합니다. 또한 최대
          너비는 1440px(`lg:max-w-[1440px]` 또는 `lg:max-w-360`)로 제한되어 중앙
          정렬(`mx-auto`)됩니다.
        </p>
      </section>
    </div>
  );
}
