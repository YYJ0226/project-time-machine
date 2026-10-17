/* ws.js — 《开发的来路》整片的共用画法。
 * 一个世界：夜里的装订工坊。纸、卡片、册页、钥匙、印章、打字机、抽屉、门、长尺。
 * 有体积的实心东西画进 under（不吃辉光）；细线、光点、亮字画在内容层。 */
(function (G) {
'use strict';
const { W, H, lerp, clamp, ss, seg, E, fade, smooth, hash, rng, rgba } = G.VK;

const P = {
  paper: '#d9dbd2', paper2: '#c3c7bd', edge: '#f2f2e8',
  ink: '#152a3a', ink2: '#3f5c6b', ink3: '#6b8591',
  ice: '#64E3F6', iceLo: '#3f8fa6', gold: '#F8D893', brass: '#a9823f', goldInk: '#8a5f1c',
  rose: '#E84B75', deep: '#061019', desk: '#0b1118',
};

/* 从 1920×1080 的世界坐标里取一块：镜头推近 / 平移 */
function cam(fr, c, fn) {
  const x = fr.x; x.save();
  x.translate(960, 540); x.scale(c.s, c.s); x.translate(-c.cx, -c.cy);
  fn(); x.restore();
}
const mixCam = (a, b, k) => ({ cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), k)) });

/* ---------- 工坊的底：墙面、桌面、灯 ---------- */
function room(x, t, o = {}) {
  const warm = o.warm == null ? 1 : o.warm;
  x.fillStyle = '#030508'; x.fillRect(0, 0, W, H);
  let g = x.createRadialGradient(W * .5, H * .42, 0, W * .5, H * .42, W * .62);
  g.addColorStop(0, `rgba(26,34,44,${.55 * warm})`); g.addColorStop(.6, 'rgba(14,20,28,.25)'); g.addColorStop(1, 'rgba(3,5,8,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const top = o.top == null ? 690 : o.top;
  g = x.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, 'rgba(40,34,26,.0)'); g.addColorStop(.06, 'rgba(96,74,48,.42)'); g.addColorStop(.5, 'rgba(58,45,31,.34)'); g.addColorStop(1, 'rgba(10,9,8,.92)');
  x.fillStyle = g; x.fillRect(0, top, W, H - top);
  x.fillStyle = 'rgba(160,130,86,.10)'; x.fillRect(0, top, W, 2);
  // 桌面上的一团灯：光池与两道椭圆的回光
  g = x.createRadialGradient(W * .5, top + 150, 0, W * .5, top + 150, 980);
  g.addColorStop(0, `rgba(255,196,120,${.19 * warm})`); g.addColorStop(.45, `rgba(240,170,96,${.085 * warm})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, top - 120, W, H);
}

/* 一盏吊灯：线、灯罩、锥形光 */
function lamp(x, t, cx, cy, k = 1) {
  if (k <= 0) return;
  x.save(); x.globalAlpha *= k;
  x.strokeStyle = 'rgba(150,160,170,.22)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, cy - 26); x.stroke();
  x.fillStyle = 'rgba(28,30,32,1)'; x.beginPath();
  x.moveTo(cx - 58, cy); x.quadraticCurveTo(cx, cy - 54, cx + 58, cy); x.closePath(); x.fill();
  const g = x.createRadialGradient(cx, cy + 8, 0, cx, cy + 8, 22);
  g.addColorStop(0, 'rgba(255,236,198,.95)'); g.addColorStop(1, 'rgba(255,190,120,0)');
  x.fillStyle = g; x.fillRect(cx - 24, cy - 16, 48, 48);
  const c = x.createLinearGradient(cx, cy, cx, cy + 520);
  c.addColorStop(0, 'rgba(255,200,130,.10)'); c.addColorStop(1, 'rgba(255,190,120,0)');
  x.fillStyle = c; x.beginPath(); x.moveTo(cx - 42, cy + 4); x.lineTo(cx - 330, cy + 520); x.lineTo(cx + 330, cy + 520); x.lineTo(cx + 42, cy + 4); x.closePath(); x.fill();
  x.restore();
}

/* ---------- 纸 ---------- */
function paper(ctx, x, y, w, h, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  if (o.rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot); ctx.translate(-x - w / 2, -y - h / 2); }
  ctx.shadowColor = 'rgba(0,0,0,.62)'; ctx.shadowBlur = o.shadow == null ? 34 : o.shadow; ctx.shadowOffsetY = 12;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, o.paper || P.paper); g.addColorStop(.55, o.paper2 || '#d2d5cc'); g.addColorStop(1, o.paper3 || P.paper2);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(246,246,236,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  if (o.edge !== false) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, w, 2); }
  if (o.lit) {  // 被灯照亮：从左上打进来的一层暖白
    const l = ctx.createLinearGradient(x, y, x + w * .7, y + h);
    l.addColorStop(0, `rgba(255,246,226,${.30 * o.lit})`); l.addColorStop(.7, 'rgba(255,246,226,0)');
    ctx.fillStyle = l; ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

/* 一张证据卡：类型、编号、标题、一两行原文、出处。
 * o: {rot, a, tone:'ice'|'gold'|'rose', label, num, title:[行], body:[行], src, lit, pin, w, h} */
function card(fr, x, y, w, h, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  const ctx = fr.x, tone = o.tone === 'gold' ? P.gold : o.tone === 'rose' ? P.rose : P.ice;
  const dim = o.dim == null ? 1 : o.dim;
  fr.g({ a, rot: o.rot || 0, at: [x + w / 2, y + h / 2], s: o.s == null ? 1 : o.s }, () => {
    // 卡片本身用原生纸画法，但走内容层：先画影子，再纸
    const px = -w / 2, py = -h / 2;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.62)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    ctx.fillStyle = o.paper || '#d7d9d0'; ctx.fillRect(px, py, w, h); ctx.restore();
    const g = ctx.createLinearGradient(px, py, px + w, py + h);
    g.addColorStop(0, '#e0e2d9'); g.addColorStop(.6, '#d3d6cd'); g.addColorStop(1, '#c2c6bc');
    ctx.fillStyle = g; ctx.fillRect(px, py, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.30)'; ctx.fillRect(px, py, w, 2);
    ctx.strokeStyle = 'rgba(246,246,236,.45)'; ctx.lineWidth = 1; ctx.strokeRect(px + 1, py + 1, w - 2, h - 2);
    if (o.lit) { const l = ctx.createLinearGradient(px, py, px + w * .7, py + h); l.addColorStop(0, `rgba(255,247,229,${.26 * o.lit})`); l.addColorStop(.75, 'rgba(255,247,229,0)'); ctx.fillStyle = l; ctx.fillRect(px, py, w, h); }
    // 左边一条色条 = 证据类型
    ctx.fillStyle = rgba(tone, .85 * dim); ctx.fillRect(px, py, 6, h);
    // 类型行
    ctx.save(); ctx.globalAlpha *= dim;
    const tx = -w / 2 + 24;
    if (o.label) fr.text(o.label, tx, py + 30, { font: 'mono', size: 15, track: 3, color: '#4f6c7a', align: 'l' });
    if (o.num) fr.text(o.num, -w / 2 + 20, py + 78, { font: 'mono', size: 40, track: 1, color: o.tone === 'gold' ? P.goldInk : '#1d4f63', align: 'l' });
    if (o.title) (o.title.length ? o.title : [o.title]).forEach((s, i) => fr.text(s, tx, py + 122 + i * 34, { font: 'serifm', size: 27, color: P.ink, align: 'l' }));
    if (o.body) o.body.forEach((s, i) => fr.text(s, tx, py + 122 + (o.title ? (Array.isArray(o.title) ? o.title.length : 1) * 34 : 0) + i * 26, { font: 'sansr', size: 18, color: P.ink2, align: 'l' }));
    if (o.src) fr.text(o.src, tx, py + h - 20, { font: 'mono', size: 13, track: 1, color: '#6f8894', align: 'l' });
    // 原文链接钉
    if (o.pin) {
      const k = o.pin, cx = w / 2 - 24, cy = h / 2 - 22;
      fr.circle(cx, cy, 7, { color: rgba(tone, .9), w: 1.6, a: k });
      fr.circle(cx, cy, 3, { fill: rgba(tone, .9), a: k });
      fr.line(cx + 12, cy, cx + 12 + 30 * k, cy, { w: 1, color: rgba(tone, .7), a: k, cap: 'butt' });
    }
    ctx.restore();
    if (o.stamp) stampMark(fr, w / 2 - 66, -h / 2 + 56, o.stamp, o.stampK == null ? 1 : o.stampK, o.stampTone || 'gold');
  });
}

/* 纸上的印：确认 / AI 草稿 / 历史 / 未完成 */
function stampMark(fr, cx, cy, text, k, tone = 'gold') {
  if (k <= 0) return;
  const col = tone === 'rose' ? P.rose : tone === 'ice' ? P.ice : P.goldInk;
  fr.g({ at: [cx, cy], rot: -.12, a: k, s: .82 + .24 * E.outBack(clamp(k)) }, () => {
    fr.rect(-52, -17, 104, 34, { r: 3, color: rgba(col, .95), w: 2.2 });
    fr.text(text, 0, 1, { font: 'serif', size: 19, track: 3, color: rgba(col, .95) });
  });
}

/* 黄铜印章：按下时 k 0→1。返回印章头 y 偏移 */
function press(fr, x, y, text, k, o = {}) {
  if (k <= 0) return;
  const down = E.in3(clamp(k * 1.4));
  fr.g({ at: [x, y - 90 + down * 66], a: Math.min(1, k * 3) }, () => {
    fr.rect(-64, -26, 128, 46, { r: 5, fill: '#3a2c19' });
    fr.rect(-64, -26, 128, 8, { r: 4, fill: '#5e4826' });
    fr.rect(-58, 16, 116, 8, { r: 2, fill: '#8d6b33' });
    fr.text(text, 0, -3, { font: 'serif', size: 22, track: 4, color: '#e7c885' });
  });
  fr.circle(x, y, 58 * (1 - ss(k, .55, 1)), { color: P.gold, w: 1.4, a: (1 - ss(k, .55, 1)) * .7 });
}

/* 钥匙：编号 / 分支 / SHA */
function key(fr, x, y, label, k, o = {}) {
  if (k <= 0) return;
  fr.g({ at: [x, y], rot: o.rot || 0, a: k, s: o.s || 1 }, () => {
    fr.circle(-66, 0, 26, { color: '#c9a45e', w: 6 });
    fr.circle(-66, 0, 11, { color: '#8f6d2f', w: 3 });
    fr.rect(-42, -5, 100, 10, { r: 3, fill: '#b8914c' });
    fr.rect(18, 4, 9, 18, { fill: '#a4813f' });
    fr.rect(38, 4, 9, 14, { fill: '#a4813f' });
    fr.text(label, 24, -24, { font: 'mono', size: 17, color: '#e8d3a4' });
  });
}

/* 打字机：侧面剪影，纸从后面卷起；o.typed 是已经打出的行 */
function typewriter(fr, x, y, s, k, lines = [], o = {}) {
  if (k <= 0) return;
  fr.g({ at: [x, y], s, a: k }, () => {
    fr.path('M-150,40 L150,40 L128,-46 L-128,-46 Z', { fill: '#2a2f33' });
    fr.path('M-150,40 L150,40 L150,78 L-150,78 Z', { fill: '#14181b' });
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9 - r * 2; i++) {
      fr.circle(-88 + r * 14 + i * 22, 18 + r * 16, 7, { color: '#575e62', w: 1.4 });
    }
    fr.rect(-128, -64, 256, 20, { r: 9, fill: '#3a4145' });
    fr.rect(-104, -120, 208, 60, { fill: '#e2e2d6', a: .95 });
    lines.forEach((ln, i) => fr.text(ln, -92, -104 + i * 16, { font: 'type', size: 12, color: '#2a3a44', align: 'l' }));
    fr.rect(-18, -128, 36, 10, { r: 4, fill: '#8e969a' });
  });
}

/* 账本抽屉：一把锁在侧面 */
function drawer(fr, x, y, w, h, label, k, openK = 0) {
  if (k <= 0) return;
  fr.g({ at: [x, y], a: k }, () => {
    fr.rect(0, 0, w, h, { r: 4, fill: '#241d16' });
    fr.rect(3, 3, w - 6, h - 6, { r: 3, color: '#4a3b28', w: 1 });
    fr.rect(0, 0, w, h * .5, { r: 4, fill: '#2b231a' });
    fr.rect(w / 2 - 34, h * .38, 68, 16, { r: 6, fill: '#8d6b33' });
    fr.rect(w - 26, h * .26, 14, 16, { r: 3, fill: '#a9823f' });
    fr.text(label, w / 2, h * .75, { font: 'mono', size: 14, track: 2, color: '#b8a077' });
    if (openK > 0) fr.g({ at: [0, 12 * openK], a: openK }, () => fr.rect(6, h * .52, w - 12, 8, { fill: '#0a0d10' }));
  });
}

/* 一扇窄门：日期票挂在把手上 */
function door(fr, x, y, w, h, k, o = {}) {
  if (k <= 0) return;
  fr.g({ at: [x, y], a: k }, () => {
    fr.rect(-6, -6, w + 12, h + 12, { r: 3, color: '#4d3d29', w: 2 });
    fr.rect(0, 0, w, h, { fill: o.open ? '#05080b' : '#1c1710' });
    if (!o.open) {
      fr.rect(10, 10, w - 20, h - 20, { color: '#3a2e20', w: 1 });
      fr.rect(26, h * .34, w - 52, h * .28, { color: '#3a2e20', w: 1 });
    }
    fr.circle(w - 26, h * .52, 6, { fill: '#a9823f', a: o.open ? .35 : 1 });
    if (o.ticket) {
      fr.g({ at: [w - 30, h * .6], rot: .05, a: o.ticketK == null ? 1 : o.ticketK }, () => {
        fr.rect(-46, -20, 92, 40, { fill: '#e3e0d2' });
        fr.text(o.ticket, 0, -4, { font: 'mono', size: 11, color: '#3a4d57' });
        fr.text('到期 10-24', 0, 11, { font: 'mono', size: 9, color: '#6a7c84' });
        if (o.cut) { fr.line(-46, -22 + 42 * o.cut, 46, -22 + 42 * o.cut, { w: 2, color: P.rose, dash: [6, 4] }); }
      });
    }
  });
}

/* 长尺：0..minutes，四行泳道；返回 X(m) */
function axis(fr, x, y, len, o = {}) {
  const lo = o.lo == null ? -40 : o.lo, hi = o.hi == null ? 1760 : o.hi, X = m => lerp(x, x + len, (m - lo) / (hi - lo));
  const a = o.a == null ? 1 : o.a;
  fr.line(x, y, x + len, y, { w: 1.4, color: '#9fb6c8', a: .55 * a, cap: 'butt' });
  for (let m = 0; m <= 1700; m += 60) {
    const px = X(m), big = m % 360 === 0;
    fr.line(px, y, px, y + (big ? 14 : 7), { w: big ? 1.4 : 1, color: '#9fb6c8', a: (big ? .55 : .3) * a, cap: 'butt' });
  }
  (o.days || []).forEach(d => {
    const px = X(d.m);
    fr.line(px, y - 6, px, y + (o.lanes || 4) * 70 + 8, { w: 1, color: '#c9b98f', a: .28 * a, dash: [3, 5] });
    fr.text(d.label, px + 8, y - 18, { font: 'mono', size: 14, track: 2, color: '#a99c7c', align: 'l', a });
  });
  (o.lane || []).forEach((l, i) => fr.text(l, x - 16, y + 40 + i * 70, { font: 'mono', size: 14, track: 2, color: '#8fa3b5', align: 'r', a: a * .85 }));
  return X;
}

/* 线：虚线（建议）或金线（确认）。pts 至少两点，k 只画前 k 段 */
function thread(fr, pts, k, o = {}) {
  if (k <= 0) return;
  const gold = o.kind === 'gold', col = gold ? P.gold : o.kind === 'rose' ? P.rose : '#9fb6c8';
  fr.poly(pts, { k, color: col, w: gold ? 2.6 : 1.8, a: gold ? .95 : .62, dash: gold ? [] : [9, 8], glow: gold ? 14 : 0, glowColor: P.gold, glowA: .5, add: gold });
  if (k >= .999 && gold) for (const p of [pts[0], pts[pts.length - 1]]) fr.spark(p[0], p[1], 4.2, P.gold, .9);
}
function zip(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; }

/* 叠字：大字、注记 */
function note(fr, s, x, y, o = {}) { fr.text(s, x, y, Object.assign({ font: 'sansr', size: 22, color: '#cbd6da', track: 2 }, o)); }
function glowText(fr, s, x, y, size, color, a) {
  fr.text(s, x, y, { font: 'serifm', size, track: size * .08, color, a, glow: 18, glowA: .5, glowColor: color });
}


/* 按绝对时间取相机：keys = [[t, {cx,cy,s}], ...]，之间平滑插值 */
function camTrack(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  const n = keys.length; if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0; while (i < n - 2 && t > keys[i + 1][0]) i++;
  const [t1, c1] = keys[i], [t2, c2] = keys[i + 1];
  return mixCam(c1, c2, G.VK.ss(t, t1, t2));
}
/* 一段戏：在 [a,b] 内画，两端淡入淡出 */
function beat(fr, t, a, b, fn, fin = .6, fout = .6) {
  if (t < a - .001 || t > b + .001) return;
  const k = fade(t, a, b, fin, fout); if (k <= 0) return;
  fr.g({ a: k }, () => fn());
}

G.WS = { P, cam, mixCam, camTrack, beat, room, lamp, paper, card, stampMark, press, key, typewriter, drawer, door, axis, thread, zip, note, glowText };
})(window);
