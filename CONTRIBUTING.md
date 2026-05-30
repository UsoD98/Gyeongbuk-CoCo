# CONTRIBUTING.md

경북 CoCo 기여 가이드. 코딩 규약은 [CONVENTION.md](./CONVENTION.md), 디자인 토큰은 [DESIGN.md](./DESIGN.md) 참고.

---

## 1. 브랜치 전략 — Git Flow (경량)

```
main            (보호) 릴리스 대상. 태그 부착 지점.
develop         (기본) 일상 작업의 통합 브랜치.
feature/*       기능 개발. develop에서 분기 → develop으로 PR.
fix/*           develop 대상 버그 수정.
refactor/*      동작 변경 없는 구조 변경.
chore/*         설정·도구·의존성.
hotfix/*        main에서 분기 → main과 develop 양쪽에 PR (긴급 수정).
release/*       릴리스 안정화. develop → release/x.y.z → main + develop.
```

- **`main`에 직접 push 금지.** 모든 변경은 PR을 통한다.
- 기본 작업 브랜치는 `develop`.
- 한 브랜치는 한 가지 의도만 담는다. 무관한 리팩터링과 기능 추가를 같이 묶지 않는다.

### 브랜치 네이밍

`<type>/<scope>-<짧은-설명>` (kebab-case).

```
feature/planner-date-range
fix/auth-kakao-token-storage
refactor/router-domain-split
chore/eslint-rule-tuning
hotfix/header-mobile-overflow
release/0.2.0
```

---

## 2. 작업 흐름

```bash
# 1. 최신 develop 동기화
git checkout develop
git pull origin develop

# 2. 브랜치 분기
git checkout -b feature/planner-date-range

# 3. 작업 + 커밋
npm run lint
npm run build
git add <files>
git commit -m "feat(planner) 일정 선택 DatePicker 통합"

# 4. 원격 push 및 PR
git push -u origin feature/planner-date-range
# → GitHub에서 develop ← feature/planner-date-range PR 생성
```

### 머지 전 체크

- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과
- [ ] UI 변경: 모바일·데스크톱 폭에서 동작 확인 (`npm run dev`)
- [ ] 새 의존성: `package.json` + `package-lock.json` 동시 커밋
- [ ] `.env*` 등 비공개 파일 미포함
- [ ] 신규 패턴/디자인 토큰을 도입했다면 관련 문서(CONVENTION/DESIGN) 동시 갱신

---

## 3. 커밋 메시지 규칙

### 형식

```
<type>(<scope>) <한국어 설명>

[본문 — 선택]
[푸터 — 선택, Breaking Change 등]
```

- **제목 한 줄, 72자 이내**, 마침표 없이.
- 본문은 *왜* 변경했는지 위주. *무엇*은 diff에 있다.
- 한 커밋 = 한 가지 의도. WIP·"작업"·"수정" 같은 의미 없는 메시지 금지.

### type

| type | 용도 |
| --- | --- |
| `feat` | 사용자가 인지하는 기능 추가 |
| `fix` | 사용자가 인지하는 버그 수정 |
| `refactor` | 동작 동일, 구조만 변경 |
| `style` | 포맷·세미콜론 등 코드 동작 무관 |
| `docs` | 문서만 |
| `chore` | 빌드/도구/잡일 |
| `test` | 테스트만 |
| `perf` | 성능 개선 |
| `build` | 빌드 시스템·의존성 |
| `ci` | CI 설정 |

### scope

영역 키워드. 자주 쓰는 것: `design`, `auth`, `planner`, `collection`, `routes`, `theme`, `layout`, `header`, `footer`, `deps`. scope 생략은 *전역 변경*에 한해 허용.

### 예시

```
feat(planner) 일정 선택 DatePicker 통합
fix(auth) 카카오 access_token 만료 시 재로그인 처리
refactor(routes) 도메인 라우터를 RouteObject[] spread로 분리
chore(deps) tailwindcss 4.2.4 → 4.3.0 업그레이드
docs(design) primary 팔레트 사용처 갱신
```

### Breaking Change

API/공개 인터페이스 변경 시 본문 마지막에:

```
BREAKING CHANGE: themeStore가 'system' 테마를 더 이상 제공하지 않음.
호출부는 light/dark만 처리하도록 변경할 것.
```

---

## 4. PR 규칙

### 제목

커밋과 동일 규칙 — `<type>(<scope>) <설명>`. 가능하면 머지 커밋 메시지와 일치시킨다.

### 본문 템플릿

```markdown
## 무엇을
<한 문장 요약>

## 왜
<배경·문제·관련 이슈 번호>

## 어떻게
- 구현 핵심 1
- 구현 핵심 2

## 영향
- 사용자 영향: <있음/없음, 있다면 무엇>
- 마이그레이션 필요 여부: <있음/없음>

## 확인
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] 모바일/데스크톱 UI 확인 (스크린샷 첨부)
- [ ] 문서 갱신: <CONVENTION/DESIGN/CHANGELOG/ADR — 해당 항목>

## 스크린샷 / 영상
<UI 변경 시 필수>
```

### 크기

- **300 LOC 이내**가 이상적. 그 이상이면 PR을 쪼갠다.
- 자동 생성 파일(lockfile 등)은 LOC 계산에서 제외.

### 리뷰

- 최소 리뷰어 1명. 코드 오너 영역(레이아웃/라우팅/스토어)은 가능하면 2명.
- 리뷰 코멘트는 `nit:`(취향), `suggestion:`(권장), `must:`(차단) 중 하나로 시작해 우선순위를 명확히.
- 머지 방식: **Squash merge** 기본. release 브랜치는 **Merge commit**.

### 머지 후

- 머지된 브랜치는 곧바로 삭제.
- 사용자 영향이 있으면 [CHANGELOG.md](./CHANGELOG.md)의 `[Unreleased]` 섹션에 항목 추가.

---

## 5. 릴리스 절차

[SemVer](https://semver.org/lang/ko/) 따른다 (`MAJOR.MINOR.PATCH`).

1. `release/x.y.z` 브랜치를 `develop`에서 분기.
2. 버전 번호 업데이트 (`package.json`).
3. `CHANGELOG.md`의 `[Unreleased]` 섹션을 `[x.y.z] - YYYY-MM-DD`로 확정.
4. QA 통과 후 `main`으로 PR, 머지 후 태그.
   ```bash
   git tag -a v0.2.0 -m "Release 0.2.0"
   git push origin v0.2.0
   ```
5. `release/x.y.z` → `develop` 역병합.

---

## 6. 새 의존성 추가

```bash
npm install <pkg>          # 런타임
npm install -D <pkg>       # 개발 도구
```

- 도입 근거를 PR 본문에 적는다 (대안·번들 크기·유지보수성).
- 큰 결정(상태 관리, 라우터, 스타일 시스템 등)은 [ADR](./docs/adr/)에 별도 항목으로 남긴다.

---

## 7. 이슈

- 버그: 재현 단계 / 기대 결과 / 실제 결과 / 환경(브라우저·해상도) 명시.
- 기능 제안: 사용자 시나리오 + 대안 검토 결과.
- "왜 이렇게 되어 있어?" 질문은 [docs/adr/](./docs/adr/) 먼저 확인.
