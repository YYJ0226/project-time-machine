/* ch0.js — 0–30 秒：已验收的三十秒开场。需求 #3 → PR #4 → 不确认 → 核对 → 片名。 */
(function (G) {
'use strict';
const { lerp, ss, fade } = G.VK;
const K = G.VKit, WS = G.WS, P = WS.P;
const C = { ink: '#172b3b', paper: '#dedfd8' };

function text(x, s, px, py, size = 30, color = C.ink, family = 'VK Sans', weight = 400) {
  x.fillStyle = color; x.font = `${weight} ${size}px "${family}"`;
  x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(s, px, py);
}
function paper(x, px, py, w, h) {
  x.save(); x.shadowColor = '#000a'; x.shadowBlur = 40; x.shadowOffsetY = 14;
  const g = x.createLinearGradient(px, py, px + w, py);
  g.addColorStop(0, '#b5bdbd'); g.addColorStop(.08, C.paper); g.addColorStop(.87, '#d6dcd8'); g.addColorStop(1, '#b6c2c1');
  x.fillStyle = g; x.fillRect(px, py, w, h); x.restore();
  x.strokeStyle = '#f4f4e744'; x.strokeRect(px, py, w, h);
}

function open(fr, t) {
  const home = G.PTM_ASSETS.home;
  // A cloth-bound process book opens to a genuine requirement and implementation quote.
  const book = (x) => {
    const opening = ss(t, 4.6, 6.3), reveal = ss(t, 10.6, 12.2), close = ss(t, 23.3, 23.8);
    x.save(); x.globalAlpha *= 1 - close;
    x.beginPath(); x.rect(105, 145, 1710, 690); x.clip();
    const focusIssue = ss(t, 6.3, 7.7) * (1 - ss(t, 10.6, 12.2));
    const focusPR = ss(t, 10.6, 12.2) * (1 - ss(t, 19.2, 20.5));
    const scale = lerp(.93, 1, ss(t, 0, 3)) + .14 * focusIssue + .1 * focusPR;
    x.translate(960 + 115 * focusIssue - 85 * focusPR, 440);
    x.scale(scale, scale); x.translate(-960, -440);
    for (let i = 5; i >= 1; i--) {
      x.fillStyle = i % 2 ? '#9aa9a7' : '#4e6265';
      x.fillRect(252 - i * 2, 174 + i * 3, 1416 + i * 4, 570);
    }
    x.fillStyle = '#173743'; x.fillRect(236, 168, 1448, 592);
    paper(x, 258, 178, 700, 560); paper(x, 962, 178, 700, 560);
    const shade = x.createLinearGradient(916, 0, 1007, 0);
    shade.addColorStop(0, '#07192400'); shade.addColorStop(.5, '#07192499'); shade.addColorStop(1, '#07192400');
    x.fillStyle = shade; x.fillRect(916, 178, 91, 560);
    x.fillStyle = '#a68753'; x.fillRect(1570, 714, 34, 59);
    x.beginPath(); x.moveTo(1570, 773); x.lineTo(1587, 757); x.lineTo(1604, 773); x.fillStyle = '#02070e'; x.fill();
    text(x, '需求 / ISSUE', 308, 223, 25, '#466679', 'VK Mono');
    text(x, '#3', 308, 302, 94, reveal > .1 ? '#805c20' : '#164e65', 'VK Mono', 500);
    text(x, '项目证据同步与关联', 308, 389, 39, C.ink, 'VK Serif', 600);
    x.strokeStyle = '#3c61765c'; x.lineWidth = 2; x.beginPath(); x.moveTo(308, 430); x.lineTo(902, 430); x.stroke();
    text(x, '目标 · 节选整理', 308, 477, 26, '#527281');
    text(x, '形成最小可用的项目证据链', 308, 524, 32);
    text(x, '从公开 GitHub 仓库同步', 308, 572, 29);
    text(x, 'Issue、Commit、PR 与测试状态', 308, 618, 27);
    text(x, '01 / 开发从需求开始', 308, 695, 23, '#496877');
    text(x, '实现 / PULL REQUEST', 1017, 223, 25, '#466679', 'VK Mono');
    text(x, '#4', 1017, 302, 94, '#164e65', 'VK Mono', 500);
    text(x, '项目证据同步与审阅', 1017, 389, 39, C.ink, 'VK Serif', 600);
    text(x, '标题中文转述 · 正文原文如下', 1017, 434, 23, '#527281');
    x.save(); x.globalAlpha *= reveal;
    x.fillStyle = '#b7964c38'; x.fillRect(1004, 485, 540 * ss(t, 11, 12.1), 79);
    text(x, 'Closes #3.', 1017, 528, 62, '#2b414d', 'VK Mono', 500);
    text(x, '“关闭需求 #3”', 1017, 608, 32, '#527281');
    text(x, '编号引用的中文释义', 1017, 654, 24, '#527281');
    x.restore();
    text(x, '02 / 修改留下来路', 1017, 695, 23, '#496877');
    if (opening < 1) {
      x.save(); const w = 1404 * Math.cos(opening * Math.PI / 2);
      x.translate(258, 178); x.scale(Math.max(.001, w / 1404), 1);
      x.fillStyle = '#0c2232'; x.fillRect(0, 0, 1404, 560);
      x.drawImage(home, 213, 7, 978, 550);
      x.fillStyle = '#a1ccd944'; x.fillRect(0, 0, 10, 560);
      x.strokeStyle = '#6ea8b9'; x.lineWidth = 2; x.strokeRect(0, 0, 1404, 560); x.restore();
    }
    if (reveal > 0) {
      x.save(); x.globalAlpha *= reveal; x.setLineDash([10, 9]); x.strokeStyle = '#597b85'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(938, 310); x.lineTo(982, 528); x.stroke(); x.setLineDash([]); x.restore();
    }
    const inspect = ss(t, 19.2, 20.3);
    if (inspect > 0) {
      x.globalAlpha *= inspect; x.fillStyle = '#102c3b'; x.fillRect(682, 754, 557, 66);
      text(x, '引用可找到 · 关系仍需人工核对', 712, 788, 29, '#e0e7de');
    }
    x.restore();
  };
  fr.look.bgo = { core: .65, stars: .14, color: '#030508' };
  fr.look.under = x => book(x);
  const source = t < 4.6 ? '线上首页 · 2026-10-17 · 首页含样例数据'
    : 'GitHub 原文节选 · Issue #3 / PR #4 · 证据组织示意';
  fr.text(source, 960, 105, { font: 'sansr', size: 25, color: '#8eacb9', a: 1 - ss(t, 23.3, 23.8) });
  if (t >= 23.5) {
    const titleTime = t < 24 ? (t - 23.5) * 6.6 : 3.3 + t - 24;
    K.titleNight(fr, titleTime, { zh: '开发的来路', en: '', sub: '从一次修改，回到最初的需求', cy: 426, size: 113, track: 14 });
    fr.text('PROJECT TIME MACHINE', 960, 715, { font: 'mono', size: 25, track: 5, color: '#91aab8', a: ss(t, 27.5, 28.2) });
    fr.text('原文来源  github.com/YYJ0226/project-time-machine · issues/3 · pull/4', 960, 770,
      { font: 'sansr', size: 23, color: '#839aa8', a: ss(t, 27.5, 28.1) });
  }
}

G.CH = G.CH || {};
G.CH.open = open;
})(window);
