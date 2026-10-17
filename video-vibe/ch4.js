/* ch4.js — 262–300 秒：边界与结论。册页合上，三条未完成，回到开场那一页。 */
(function (G) {
'use strict';
const { lerp, ss, E } = G.VK;
const WS = G.WS, P = WS.P;
const B = (fr, t, a, b, fn, fi, fo) => WS.beat(fr, t, a, b, fn, fi, fo);

function edge(fr, t) {
  const cam = WS.camTrack(t, [
    [262.0, { cx: 960, cy: 540, s: 1.0 }],
    [272.0, { cx: 960, cy: 545, s: .98 }],
    [281.0, { cx: 960, cy: 555, s: 1.02 }],
    [285.4, { cx: 960, cy: 540, s: 1.04 }],
    [289.6, { cx: 960, cy: 520, s: 1.0 }],
    [300.0, { cx: 960, cy: 520, s: 1.06 }],
  ]);
  WS.cam(fr, cam, () => {
    /* ---- 264–268：合上的册页 + 三条注记 ---- */
    B(fr, t, 263.6, 268.4, () => {
      fr.g({ at: [960, 545], rot: -.008 }, () => {
        fr.rect(-540, -330, 1080, 660, { fill: '#173743' });
        fr.rect(-526, -316, 1052, 632, { color: '#2c5567', w: 1.2, a: .5 });
        fr.rect(-500, -290, 1000, 580, { fill: '#1b4152' });
        fr.text('开发的来路', 0, -10, { font: 'serifl', size: 78, track: 16, color: '#cfe0e4' });
        fr.text('PROJECT TIME MACHINE · 2026-10-17', 0, 100, { font: 'mono', size: 17, track: 5, color: '#7fa2b2' });
        fr.line(-280, 144, 280, 144, { w: 1, color: '#7fa2b2', a: .5 });
        fr.text('不恢复旧环境 · 不代替人拍板', 0, 206, { font: 'serifm', size: 26, track: 8, color: '#a9c0c8' });
        fr.rect(-560, -330, 24, 660, { fill: '#0e2833' });
        fr.rect(536, -20, 26, 96, { fill: '#a68753' });
      });
    }, .6, .6);

    /* ---- 268.4–272.8：建议 / 草稿 / 回放，都待核对 ---- */
    B(fr, t, 268.4, 273.1, () => {
      fr.g({ at: [960, 545], rot: -.008 }, () => {
        fr.rect(-540, -330, 1080, 660, { fill: '#173743' });
        fr.rect(-500, -290, 1000, 580, { fill: '#1b4152' });
        fr.text('开发的来路', 0, -190, { font: 'serifl', size: 54, track: 12, color: '#a9c0c8', a: .8 });
      });
      ['建议', 'AI 草稿', '回放'].forEach((s, i) => {
        const k = ss(t, 268.8 + i * .35, 269.4 + i * .35);
        if (k <= 0) return;
        fr.g({ at: [600 + i * 360, 640], a: k }, () => {
          fr.rect(-150, -56, 300, 112, { r: 3, color: '#b8a070', w: 1.6 });
          fr.text(s, 0, -12, { font: 'serifm', size: 28, track: 6, color: '#e3d3ae' });
          fr.text('待核对 · 不是结论', 0, 26, { font: 'mono', size: 12, track: 2, color: '#a99c7c' });
        });
      });
    }, .6, .6);

    /* ---- 272.8–277.0：末页，未完成 ---- */
    B(fr, t, 272.8, 281.3, () => {
      fr.g({ at: [960, 570], rot: -.006 }, () => {
        fr.rect(-480, -330, 960, 660, { fill: '#dfe1d7' });
        fr.rect(-480, -330, 960, 9, { fill: '#fbfbf0', a: .7 });
        fr.text('未完 · 写在同一条来路上', -430, -266, { font: 'serifm', size: 32, color: P.ink, align: 'l' });
        fr.line(-430, -224, 430, -224, { w: 1, color: '#a9b4b6', a: .6 });
        const rows = [['01', '手机端适配', '尚未开始'], ['02', '五至七分钟成片', '本片是第一版'], ['03', '退出后重登的会话', 'Issue #17 · 仍待复核']];
        rows.forEach((r, i) => {
          const k = ss(t, 273.4 + i * .6, 274.0 + i * .6);
          if (k <= 0) return;
          fr.text(r[0], -430, -150 + i * 100, { font: 'mono', size: 18, track: 2, color: '#7d8f97', align: 'l', a: k });
          fr.text(r[1], -370, -150 + i * 100, { font: 'serifm', size: 32, color: P.ink, align: 'l', a: k });
          fr.text(r[2], -370, -108 + i * 100, { font: 'mono', size: 14, track: 1, color: '#a2626f', align: 'l', a: k });
          fr.line(-430, -88 + i * 100, 430, -88 + i * 100, { w: 1, color: '#a9b4b6', a: .3 * k, cap: 'butt' });
        });
      });
    }, .6, .6);

    /* ---- 281.2–285.4：首页缩略图，样例标签被照亮 ---- */
    B(fr, t, 281.2, 285.9, () => {
      fr.g({ at: [960, 560] }, () => {
        fr.rect(-470, -296, 940, 592, { fill: '#0c1218' });
        fr.rect(-450, -276, 900, 552, { color: '#8fa3b5', w: 1.2, a: .35 });
        fr.g({ at: [-450, -276] }, () => fr.x.drawImage(G.PTM_ASSETS.home, 0, 0, 900, 506));
        fr.text('线上首页 · 2026-10-17', 0, 318, { font: 'mono', size: 14, track: 2, color: '#8d9fa8' });
      });
      // 样例数据标签被照亮
      const k = ss(t, 282.6, 283.4);
      if (k > 0) {
        fr.circle(1412, 432, 60 + 40 * k, { color: P.gold, w: 1.6, a: .8 * k });
        fr.line(1412, 372, 1412, 300, { w: 1, color: P.gold, a: .7 * k, cap: 'butt' });
        fr.text('样例数据', 1412, 278, { font: 'mono', size: 14, track: 2, color: P.gold, a: k });
      }
    }, .6, .6);

    /* ---- 285.4–289.6：回场 ---- */
    B(fr, t, 285.4, 290.0, () => {
      fr.g({ at: [960, 560] }, () => {
        fr.rect(-470, -296, 940, 592, { fill: '#0c1218' });
        fr.g({ at: [-450, -276] }, () => fr.x.drawImage(G.PTM_ASSETS.home, 0, 0, 900, 506));
      });
    }, .6, .5);

    /* ---- 289.6–300：片名与文献 ---- */
    B(fr, t, 289.6, 300.0, () => {
      const a = ss(t, 289.8, 290.6);
      fr.text('开发的来路', 960, 400, { font: 'serifl', size: 132, track: 26, color: '#f2f5f2', a, glow: 26, glowColor: '#BFD9F2', glowA: .45 });
      fr.text('从一次修改，回到最初的需求', 960, 552, { font: 'serifm', size: 36, track: 14, color: '#c9ad79', a: ss(t, 291.4, 292.2) });
      ['github.com/YYJ0226/project-time-machine', 'Issue #3 · Pull Request #4 · 合并提交 b82dc81', 'GitHub Actions · 2026-10-16 — 10-17'].forEach((s, i) => {
        fr.text(s, 960, 730 + i * 38, { font: 'mono', size: 15, track: 2, color: '#7f95a2', a: ss(t, 292.2 + i * .3, 292.8 + i * .3) });
      });
      fr.text('PROJECT TIME MACHINE', 960, 640, { font: 'mono', size: 17, track: 6, color: '#8fa3b5', a: ss(t, 291.8, 292.6) });
    }, .5, .2);
  });
}
G.CH = G.CH || {};
G.CH.edge = edge;
})(window);
