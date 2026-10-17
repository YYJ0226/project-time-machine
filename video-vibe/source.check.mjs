// Explicit node:test entry point; outside the application Vitest filename glob.
// Checks the five-minute film's source contract without rendering or reading media.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const read = f => readFile(new URL(f, import.meta.url), 'utf8');
const files = { 'film.js': await read('film.js'), 'ws.js': await read('ws.js') };
for (const f of ['ch0.js', 'ch1.js', 'ch2.js', 'ch3.js', 'ch4.js']) files[f] = await read(f);

let film;
class StubImage { set src(v) { queueMicrotask(() => this.onload && this.onload()); } }
const sandbox = {
  VK: { film: spec => { film = spec; }, ss: () => 0, fade: () => 1 },
  VKit: {}, window: {}, Image: StubImage, queueMicrotask,
};
sandbox.window = sandbox;
for (const f of ['ws.js', 'ch0.js', 'ch1.js', 'ch2.js', 'ch3.js', 'ch4.js', 'film.js']) {
  vm.runInNewContext(files[f], sandbox, { filename: f });
}
await new Promise(r => setTimeout(r, 20));

test('full film is five minutes, 1080p30 and still a labelled reenactment', () => {
  assert.equal(film.dur, 300);
  assert.equal(film.fps, 30);
  assert.equal(film.meta.reenactment, true);
  assert.match(film.meta.case, /project-time-machine/);
  assert.match(film.meta.order, /动机 → 技术路线 → 实验 → 边界/);
});

test('subtitle windows are ordered, readable and within the film', () => {
  const subs = sandbox.window.PTM_SUBTITLES;
  assert.ok(subs.length >= 50 && subs.length <= 62, subs.length);
  let previousEnd = 0;
  for (const sub of subs) {
    assert.ok(sub.a >= previousEnd && sub.b - sub.a >= 3, sub.zh);
    assert.ok(sub.b <= 294, sub.zh);
    const sentence = sub.zh.replace(/[{}!]/g, '');
    assert.ok(Array.from(sentence).length <= 30, sub.zh);
    previousEnd = sub.b;
  }
});

test('chapter boundaries and chapter marks line up', () => {
  const subs = sandbox.window.PTM_SUBTITLES;
  for (const t of [30, 78.5, 150, 262]) {
    assert.ok(!subs.some(s => s.a < t && s.b > t), `subtitle crosses chapter boundary ${t}`);
  }
});

test('quotes, reenactment labels and deterministic timeline are retained', () => {
  const all = Object.values(files).join('\n');
  assert.ok(files['film.js'].includes('Closes #3') || files['ch0.js'].includes('Closes #3.'));
  assert.ok(all.includes('证据组织示意'));
  assert.ok(all.includes('样例数据'));
  assert.doesNotMatch(all, /Math\.random\(|Date\.now\(/);
});

test('every chapter is dispatched and each chapter file is loaded by index.html', async () => {
  const html = await read('index.html');
  for (const f of ['ws.js', 'ch0.js', 'ch1.js', 'ch2.js', 'ch3.js', 'ch4.js', 'film.js']) {
    assert.ok(html.includes(`src="${f}"`), f);
  }
  for (const fn of ['open', 'pull', 'route', 'lab', 'edge']) assert.equal(typeof sandbox.CH[fn], 'function', fn);
});
