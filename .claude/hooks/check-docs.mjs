#!/usr/bin/env node
// PreToolUse 게이트 — Claude가 `git commit`을 실행하기 직전,
// 문서 갱신이 필요해 보이는데 문서가 동봉되지 않았으면 커밋을 차단한다.
//
// 판별은 high-precision(좁게): feat/fix/build 타입이거나 의존성(package.json) 변경일 때만 후보.
// 오탐 탈출구: 커밋 메시지에 `[skip-docs]` 포함 시 무조건 통과.
//
// 종료 코드 규약 (Claude Code PreToolUse):
//   exit 0 → 그대로 진행
//   exit 2 → 도구 호출 차단, stderr 내용이 Claude에게 전달됨
//
// 이 게이트는 "Claude가 Bash 도구로 실행하는 커밋"만 잡는다.
// 사용자가 터미널에서 직접 커밋하면 걸리지 않는다(그건 git hook/CI 영역).

import { execSync } from 'node:child_process';

const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    // stdin이 없으면 즉시 통과
    if (process.stdin.isTTY) resolve('');
  });
}

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

// `-m "..."` / `-m '...'` 형태의 모든 메시지를 추출
function extractCommitMessages(cmd) {
  const msgs = [];
  const re = /-m\s+(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(cmd)) !== null) msgs.push((m[1] ?? m[2] ?? '').trim());
  return msgs.join('\n');
}

function pass() {
  process.exit(0);
}

function block(reason, suspects) {
  const lines = [
    '🛑 문서 동기화 점검 — 커밋을 보류했습니다.',
    '',
    reason,
    '',
    '의심 근거:',
    ...suspects.map((s) => `  • ${s}`),
    '',
    '권장 조치:',
    '  1) /sync-docs 스킬을 실행해 CHANGELOG/ADR 등 관련 문서를 갱신한 뒤, 문서 파일을 같은 커밋에 add 하고 다시 커밋하세요.',
    '  2) 문서가 정말 불필요하면 커밋 메시지에 [skip-docs] 를 추가해 이 게이트를 통과시키세요.',
    '',
    '매핑 규칙: CONTRIBUTING.md(문서 동시 갱신) · docs/adr/README.md(ADR 추가 시점).',
  ];
  process.stderr.write(lines.join('\n') + '\n');
  process.exit(2);
}

const raw = await readStdin();
if (!raw) pass();

let input;
try {
  input = JSON.parse(raw);
} catch {
  pass();
}

if (input?.tool_name !== 'Bash') pass();

const cmd = String(input?.tool_input?.command ?? '');

// `git commit` 만 게이트한다. push 시점엔 변경이 이미 커밋돼 있어 의미가 없다.
const isCommit = /\bgit\b[^|&;]*\bcommit\b/.test(cmd);
if (!isCommit) pass();

// amend/merge 는 게이트 대상에서 제외(맥락이 다름)
if (/--amend\b/.test(cmd) || /\bgit\b[^|&;]*\bmerge\b/.test(cmd)) pass();

const message = extractCommitMessages(cmd);

// 탈출구
if (/\[skip-docs\]/i.test(message)) pass();

// staged 파일 목록
const stagedRaw = git('diff --cached --name-only');
if (!stagedRaw) pass(); // staged 없음 → 커밋이 어차피 비거나 별개 처리. 게이트하지 않음.
const staged = stagedRaw.split(/\r?\n/).filter(Boolean).map((p) => p.replace(/\\/g, '/'));

// 문서가 이미 동봉됐는지
const docPattern = /^(CHANGELOG\.md|CONVENTION\.md|DESIGN\.md|CLAUDE\.md|README\.md|docs\/)/;
const docsIncluded = staged.some((p) => docPattern.test(p));
if (docsIncluded) pass(); // 문서 손댄 커밋 → 의도적으로 갱신한 것으로 간주, 통과.

// 트리거 판별 (좁게)
const suspects = [];

// 1) 의존성 변경
const depsChanged = staged.some((p) => p === 'package.json' || p === 'package-lock.json');
if (depsChanged) {
  suspects.push('package.json/lock 변경 → 의존성 도입·교체는 ADR 후보 (docs/adr).');
}

// 2) 커밋 타입
const typeMatch = message.match(/^\s*(feat|fix|build)\b/m);
if (typeMatch) {
  const t = typeMatch[1];
  const why =
    t === 'fix'
      ? 'fix → 사용자 인지 버그 수정은 CHANGELOG [Unreleased] Fixed 후보.'
      : t === 'feat'
        ? 'feat → 사용자 인지 기능 추가는 CHANGELOG [Unreleased] Added 후보.'
        : 'build → 빌드/의존성 변경은 CHANGELOG/ADR 후보.';
  suspects.push(why);
}

// 메시지가 없어(-F 또는 에디터) 타입을 못 읽는 경우: 의존성 변경만으로 판단(과탐 방지)
if (suspects.length === 0) pass();

block('문서 갱신이 필요해 보이는 변경인데, 관련 문서가 이 커밋에 포함되지 않았습니다.', suspects);
