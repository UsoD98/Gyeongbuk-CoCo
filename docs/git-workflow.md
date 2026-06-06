# Git 워크플로우 치트시트

복붙용 명령 모음. **규칙·정책·근거는 [CONTRIBUTING.md](../CONTRIBUTING.md)가 권위 소스**이며, 이 문서는 그 흐름을 명령어로 빠르게 따라 하기 위한 참고용이다. 규칙이 바뀌면 CONTRIBUTING.md를 먼저 보라.

## TL;DR

```
develop 에서 feature/ 분기 → 작업·커밋 → develop 으로 PR → Squash 머지 → 브랜치 삭제
```

- `develop`에 **직접 커밋 금지**. 항상 작업 브랜치를 판다.
- `main`에 **직접 push 금지**. main은 릴리스(release/hotfix) PR로만 들어간다.
- 공유 브랜치(`develop`/`main`)에 **force push 금지**.

---

## 1. 기능 개발 (일상 사이클)

```bash
# ① 최신 develop 동기화
git checkout develop
git pull origin develop

# ② 작업 브랜치 분기  —  <type>/<scope>-<짧은-설명> (kebab-case)
git checkout -b feature/planner-date-range

# ③ 작업 → 검증 → 커밋
npm run lint
npm run build
git add <변경파일>
git commit -m "feat(planner) 일정 선택 DatePicker 통합"

# ④ push → PR (base: develop)
git push -u origin feature/planner-date-range
gh pr create --base develop --head feature/planner-date-range \
  --title "feat(planner) 일정 선택 DatePicker 통합" \
  --body "## 무엇을 ...(템플릿은 CONTRIBUTING §4)"

# ⑤ 리뷰 통과 후 Squash 머지
gh pr merge <번호> --squash --delete-branch

# ⑥ 로컬 정리
git checkout develop
git pull origin develop
git branch -d feature/planner-date-range   # 로컬 브랜치 삭제
```

브랜치 prefix: 기능 `feature/` · 버그 `fix/` · 구조변경 `refactor/` · 설정·의존성 `chore/`

---

## 2. 커밋 메시지 빠른 참조

형식: `<type>(<scope>) <한국어 설명>` — 제목 한 줄·72자 이내·마침표 없음.

| type | 용도 | | type | 용도 |
| --- | --- | --- | --- | --- |
| `feat` | 기능 추가 | | `chore` | 빌드/도구/잡일 |
| `fix` | 버그 수정 | | `test` | 테스트만 |
| `refactor` | 구조만 변경 | | `perf` | 성능 |
| `style` | 포맷·세미콜론 | | `build` | 빌드·의존성 |
| `docs` | 문서만 | | `ci` | CI 설정 |

scope 예: `auth` `planner` `collection` `routes` `theme` `layout` `deps` … (전역 변경 시 생략 가능)

```
feat(planner) 일정 선택 DatePicker 통합
fix(auth) 카카오 access_token 만료 시 재로그인 처리
chore(deps) tailwindcss 4.2.4 → 4.3.0 업그레이드
```

상세(Breaking Change 표기 등)는 [CONTRIBUTING.md §3](../CONTRIBUTING.md#3-커밋-메시지-규칙).

---

## 3. 릴리스 (develop → main)

main에 코드가 들어가는 **유일한 정규 경로**.

```bash
git checkout -b release/0.2.0 develop          # ① release 브랜치
# ② package.json 버전 갱신
git commit -am "chore 0.2.0 버전 번호 갱신"

gh pr create --base main --head release/0.2.0 --title "release 0.2.0" --body "..."
gh pr merge <번호> --merge                     # ③ release는 Merge commit(예외)

git tag -a v0.2.0 -m "Release 0.2.0"           # ④ 태그
git push origin v0.2.0

git checkout develop                           # ⑤ develop 역병합
git merge release/0.2.0
git push origin develop
```

---

## 4. 긴급 수정 (hotfix)

```bash
git checkout -b hotfix/header-mobile-overflow main   # main에서 분기
# 수정 → 커밋
git push -u origin hotfix/header-mobile-overflow
# → main 과 develop 양쪽에 PR
```

---

## 5. 자주 쓰는 gh / git

```bash
gh pr create --base develop --fill        # 커밋 메시지로 PR 본문 자동 채움
gh pr status                              # 내 PR 상태
gh pr checks <번호>                        # CI 상태
gh pr merge <번호> --squash --delete-branch
git fetch --prune                         # 원격에서 삭제된 브랜치 로컬 정리
git branch --merged develop               # develop에 머지돼 삭제 가능한 브랜치
```

---

## 6. 하지 말 것

| 금지 | 대신 |
| --- | --- |
| `develop`/`main`에 직접 커밋·push | `feature/*` 등으로 분기 후 PR |
| 공유 브랜치에 `git push --force` | 작업 브랜치에서만, 그것도 `--force-with-lease` |
| 한 브랜치에 무관한 변경 섞기 | 의도당 브랜치 1개 |
| `WIP`·`수정`·`update` 같은 커밋 메시지 | `<type>(<scope>) <설명>` |

---

## 7. 트러블슈팅

**Q. Squash 머지 후 develop과 main의 커밋 SHA가 달라 보인다.**
정상이다. Squash는 새 커밋을 만들므로 SHA가 갈린다. 내용이 같다면 무시해도 되고, 릴리스 시 §3-⑤ 역병합으로 흐름이 정리된다. **force push로 맞추지 말 것.**

**Q. 누군가 공유 브랜치를 force push해서 내 로컬과 어긋났다.**
로컬에 살릴 작업이 없다면:
```bash
git fetch origin
git reset --hard origin/<브랜치>
```

**Q. 커밋을 잘못된 브랜치(develop)에 했다.**
```bash
git branch feature/새브랜치          # 현재 커밋으로 작업 브랜치 생성
git reset --hard origin/develop      # develop을 원격 상태로 되돌림
git checkout feature/새브랜치         # 작업 브랜치에서 계속
```
