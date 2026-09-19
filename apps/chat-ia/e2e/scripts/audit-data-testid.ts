// Audit: lista data-testid en source vs tests para detectar:
//  - Selectors definidos pero no usados (testids muertos)
//  - Selectors usados en tests pero no definidos (broken tests)
//
// Run: npx tsx scripts/audit-data-testid.ts

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const SRC = '/tmp/repo-dev/apps/chat-ia/src';
const TESTS_DIR = '/tmp/repo-dev/apps/chat-ia/e2e';

function grepSelectors(dir: string, pattern: RegExp): Set<string> {
  const out = new Set<string>();
  const files = execSync(`grep -rln 'data-testid' "${dir}" 2>/dev/null || true`, { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean);
  for (const f of files) {
    try {
      const content = readFileSync(f, 'utf-8');
      let m;
      const re = new RegExp(pattern.source, 'g');
      while ((m = re.exec(content)) !== null) {
        out.add(m[1]);
      }
    } catch {
      // ignore
    }
  }
  return out;
}

const inSource = grepSelectors(SRC, /data-testid=["']([\w-]+)["']/);
const inTests = grepSelectors(TESTS_DIR, /data-testid=["']([\w-]+)["']/);

console.log(`📦 data-testid en source: ${inSource.size}`);
[...inSource].sort().forEach((id) => console.log(`   - ${id}`));
console.log();
console.log(`🧪 data-testid en tests: ${inTests.size}`);
[...inTests].sort().forEach((id) => console.log(`   - ${id}`));
console.log();

const usedInTests = [...inTests].filter((id) => inSource.has(id));
const definedButNotUsed = [...inSource].filter((id) => !inTests.has(id));
const usedButNotDefined = [...inTests].filter((id) => !inSource.has(id));

console.log(`✅ Coverage: ${usedInTests.length}/${inSource.size} testids cubiertos por al menos un test`);

if (definedButNotUsed.length) {
  console.log(`\n⚠️  Definidos pero NO usados en tests (${definedButNotUsed.length}):`);
  definedButNotUsed.forEach((id) => console.log(`   - ${id}`));
}

if (usedButNotDefined.length) {
  console.log(`\n❌ Usados en tests pero NO definidos en source (${usedButNotDefined.length}):`);
  usedButNotDefined.forEach((id) => console.log(`   - ${id}`));
  process.exitCode = 1;
}
