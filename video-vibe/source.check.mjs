// Explicit node:test entry point; outside the application Vitest filename glob.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('film.js', import.meta.url), 'utf8');
let film;
const sandbox = { VK: { film: spec => { film = spec; } }, VKit: {}, window: {},
  Image: class { async decode() {} } };
vm.runInNewContext(source, sandbox);
await Promise.resolve();

test('sample remains 30 seconds, 1080p engine / 30fps, not a full-film approval', () => {
  assert.equal(film.dur, 30);
  assert.equal(film.fps, 30);
  assert.equal(film.meta.reenactment, true);
  assert.match(film.meta.case, /Issue #3 \/ PR #4/);
});
test('five short subtitles have non-overlapping reading windows', () => {
  const subs = sandbox.window.PTM_SUBTITLES;
  assert.equal(subs.length, 5);
  let previousEnd = 0;
  for (const sub of subs) {
    assert.ok(sub.a >= previousEnd && sub.b-sub.a >= 3 && sub.b <= 23.5);
    assert.ok(sub.zh.replace(/[{}!]/g, '').length <= 28);
    previousEnd = sub.b;
  }
});
test('quotes, reenactment labels and deterministic timeline are retained', () => {
  assert.ok(source.includes('Closes #3.'));
  assert.ok(source.includes('证据组织示意'));
  assert.ok(source.includes('首页含样例数据'));
  assert.doesNotMatch(source, /Math\.random\(|Date\.now\(/);
});
