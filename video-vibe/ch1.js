/* ch1.js — 30–78.5 秒：动机。每一镜都以字幕的真实时间为准。
 * 验收桌上一页成果 → 过程散在三处 → 需求 #3 把证据接起来。 */
(function (G) {
'use strict';
const { lerp, ss, E, hash, clamp } = G.VK;
const WS = G.WS, P = WS.P;
const B = (fr, t, a, b, fn, fi, fo) => WS.beat(fr, t, a, b, fn, fi, fo);

function stack(fr, x, y, w, h, n, a, o = {}) {
  for (let i = n - 1; i >= 0; i--) {
    const k = clamp((o.grow == null ? 1 : o.grow) * n - i); if (k <= 0) continue;
    fr.g({ at: [x + (i % 3) * 1.4, y - i * (o.step || 3.4)], a: a * Math.min(1, k * 2), rot: (hash(i + 3) - .5) * .014 }, () => {
      fr.rect(-w / 2, -h / 2, w, h, { fill: i % 6 === 3 ? '#bfc4ba' : '#cfd2c8' });
      fr.line(-w / 2 + 12, -h / 2 + 3, w / 2 - 12, -h / 2 + 3, { w: 1, color: '#f4f4e8', a: .5 });
      fr.line(-w / 2 + 12, h / 2 - 3, w / 2 - 12, h / 2 - 3, { w: 1, color: '#7d8883', a: .25 });
    });
  }
  if (o.label) fr.text(o.label, x, y + h / 2 + 26, { font: 'mono', size: 14, track: 3, color: '#a9b8bf', a });
}

function hand(fr, x, y, rot, a = 1) {
  fr.g({ at: [x, y], rot, a }, () => {
    fr.path('M-20,-10 C-6,-22 26,-24 42,-14 L150,-6 C160,-2 160,16 150,22 L40,30 C20,34 -2,30 -16,16 Z', { fill: '#2b2f33' });
    fr.path('M-20,-10 C-6,-22 26,-24 42,-14 L44,26 C22,32 0,30 -16,16 Z', { fill: '#3a4046' });
    fr.rect(-24, -14, 16, 46, { r: 7, fill: '#24282c' });
  });
}

function pull(fr, t) {
  const cam = WS.camTrack(t, [
    [30.0, { cx: 960, cy: 540, s: 1 }],
    [43.4, { cx: 960, cy: 545, s: 1.02 }],
    [46.4, { cx: 960, cy: 420, s: .74 }],
    [51.8, { cx: 960, cy: 420, s: .74 }],
    [54.4, { cx: 960, cy: 545, s: 1.0 }],
    [60.4, { cx: 960, cy: 560, s: 1.0 }],
    [63.0, { cx: 960, cy: 600, s: 1.06 }],
    [73.6, { cx: 960, cy: 600, s: 1.04 }],
    [78.5, { cx: 960, cy: 590, s: .97 }],
  ]);
  WS.cam(fr, cam, () => {
    /* ---- 30–35.2：验收桌上的一页成果 ---- */
    B(fr, t, 30.0, 35.4, () => {
      const slide = E.out3(ss(t, 30.2, 31.3));
      const lift = ss(t, 34.4, 35.2);
      // 一张被推过来的成果页（16:9，与真实截图同比例）
      fr.g({ at: [lerp(1330, 960, slide), 520 - lift * 20], rot: lerp(.03, -.01, slide), a: 1 - lift }, () => {
        fr.rect(-520, -292, 1040, 585, { fill: '#0c1218' });
        fr.rect(-500, -272, 1000, 545, { color: '#8fa3b5', w: 1.2, a: .35 });
        fr.g({ at: [-500, -272] }, () => fr.x.drawImage(G.PTM_ASSETS.home, 0, 0, 1000, 562));
        fr.text('成果页 · 线上首页 · 2026-10-17', -500, 300, { font: 'mono', size: 15, track: 2, color: '#8d9fa8', align: 'l' });
      });
      // 老师一侧：茶杯、一张空白评分卡
      const qa = ss(t, 31.6, 32.4);
      fr.g({ at: [1560, 330], a: qa }, () => {
        fr.ellipse(0, 0, 52, 15, { color: '#6d7a80', w: 1.5 });
        fr.path('M-48,0 C-42,62 42,62 48,0 Z', { fill: '#20262a' });
        fr.path('M48,14 C80,16 78,44 48,42', { color: '#6d7a80', w: 3 });
        fr.g({ at: [20, 106], rot: .05 }, () => {
          fr.rect(-120, -46, 240, 92, { fill: '#dfe1d7', a: .92 });
          fr.text('评分：', -100, -10, { font: 'sansr', size: 17, color: '#4f6b78', align: 'l' });
          fr.line(-30, -10, 100, -10, { w: 1, color: '#9fb0ab', a: .7 });
          fr.text('?', 118, 30, { font: 'serifl', size: 30, color: P.rose, a: .9 });
        });
      });
    }, .6, .6);

    /* ---- 35.0–39.4：翻过来是空白，笔找不到过程 ---- */
    B(fr, t, 35.0, 39.6, () => {
      const flip = ss(t, 35.3, 35.9), back = flip > .5;
      const sx = 1 - .96 * Math.sin(flip * Math.PI);
      fr.g({ at: [960, 520], s: [Math.max(.03, sx), 1] }, () => {
        // 页的侧面厚度
        fr.rect(-520, -292, 1040, 585, { fill: '#b9beb4' });
        if (!back) {
          fr.rect(-500, -272, 1000, 545, { fill: '#0c1218' });
          fr.g({ at: [-500, -272] }, () => fr.x.drawImage(G.PTM_ASSETS.home, 0, 0, 1000, 562));
        } else {
          fr.rect(-500, -272, 1000, 545, { fill: '#e2e4da' });
          fr.rect(-500, -272, 1000, 8, { fill: '#fbfbf0', a: .8 });
          // 背面：一条条空白横线，没有“过程”
          for (let i = 0; i < 9; i++) fr.line(-440, -200 + i * 52, 440, -200 + i * 52, { w: 1, color: '#b9c2bb', a: .55 });
          fr.text('背面 · 空白', 0, 236, { font: 'serifm', size: 26, track: 6, color: '#8c9aa0' });
        }
      });
      const pk = ss(t, 36.6, 37.2);
      if (pk > 0) {
        const px = lerp(500, -420, ss(t, 36.6, 38.6));
        fr.line(-430, 300, 430, 300, { w: 1.6, color: P.rose, a: .55 * pk, dash: [5, 7] });
        fr.g({ at: [px, 246], rot: -.26, a: pk }, () => {
          fr.rect(-4, 0, 8, 150, { r: 3, fill: '#20262a' });
          fr.path('M-4,0 L4,0 L2,20 L-2,20 Z', { fill: '#c9a45e' });
          fr.rect(-4, -14, 8, 16, { r: 3, fill: '#3a4046' });
        });
        fr.text('过程不在这一面', 0, 330, { font: 'mono', size: 15, track: 3, color: '#c78b9a', a: pk * .85 });
      }
    }, .5, .6);

    /* ---- 39.0–43.6：三摞材料被灯依次照亮 ---- */
    B(fr, t, 39.0, 43.9, () => {
      const lit = [ss(t, 39.2, 39.9), ss(t, 40.0, 40.7), ss(t, 40.8, 41.5)];
      const pos = [[520, 690], [960, 700], [1400, 690]];
      // 需求单：一摞有正文的纸
      fr.g({ at: pos[0], a: .95 }, () => {
        stack(fr, 0, 0, 300, 400, 6, Math.min(1, lit[0] * 1.6 + .25), { grow: 1, step: 4 });
        fr.text('ISSUE', 0, 236, { font: 'mono', size: 14, track: 3, color: '#a9b8bf', a: lit[0] });
        fr.glow(0, -60, 340, '#FFD9A0', .13 * lit[0]);
      });
      // 提交条
      fr.g({ at: pos[1], a: .95 }, () => {
        for (let i = 17; i >= 0; i--) fr.g({ at: [(hash(i * 3) - .5) * 10, -i * 5], rot: (hash(i + 9) - .5) * .05 }, () => {
          fr.rect(-300, -20, 600, 32, { fill: i % 5 === 2 ? '#c6cbc0' : '#d3d6cc' });
          fr.rect(-280, -11, 90 + ((i * 37) % 210), 8, { fill: '#9fb0ab', a: .5 });
        });
        fr.text('COMMIT', 0, 132, { font: 'mono', size: 14, track: 3, color: '#a9b8bf', a: lit[1] });
        fr.glow(0, -40, 340, '#FFD9A0', .13 * lit[1]);
      });
      // CI 日志
      fr.g({ at: pos[2], a: .95, rot: .015 }, () => {
        for (let i = 7; i >= 0; i--) fr.g({ at: [i * 1.6, -i * 5] }, () => {
          fr.rect(-250, -170, 500, 340, { fill: i % 3 ? '#d0d4ca' : '#c7ccc1' });
          for (let l = 0; l < 13; l++) {
            fr.rect(-226, -146 + l * 25, 110 + ((l * 73) % 300), 4, { fill: '#9fb0ab', a: .45 });
            if (l % 4 === 3) fr.circle(-208, -144 + l * 25, 4, { fill: '#5f8f74', a: .7 });
          }
        });
        fr.text('CHECK · CI', 0, 206, { font: 'mono', size: 14, track: 3, color: '#a9b8bf', a: lit[2] });
        fr.glow(0, -60, 340, '#FFD9A0', .13 * lit[2]);
      });
    }, .6, .5);

    /* ---- 43.6–48.0：拉高，三处在角落，中间空着 ---- */
    B(fr, t, 43.6, 48.3, () => {
      const corners = [[300, 620, '需求'], [1620, 620, '提交'], [960, 250, '验证']];
      corners.forEach((p, i) => {
        fr.g({ at: [p[0], p[1]], a: .9 }, () => {
          stack(fr, 0, 0, 280, 360, 5, .9, { grow: 1, step: 4 });
          fr.glow(0, -50, 330, '#FFD9A0', .14);
          fr.text(p[2], 0, 238, { font: 'serifm', size: 30, track: 9, color: '#b6c4ca' });
        });
      });
      fr.g({ at: [960, 690] }, () => {
        fr.rect(-380, -200, 760, 400, { color: '#a3b2b8', w: 1.6, dash: [9, 11], a: .55 });
        fr.text('?', 0, -30, { font: 'serifl', size: 150, color: '#a3b2b8', a: .55 });
        fr.text('中间没有东西', 0, 152, { font: 'mono', size: 16, track: 3, color: '#a3b2b8', a: .7 });
      });
      corners.forEach((p, i) => {
        const k = ss(t, 44.4 + i * .3, 45.2 + i * .3) * .65;
        WS.thread(fr, [[p[0], p[1]], WS.zip([p[0], p[1]], [960, 690], .55)], k, { kind: 'suggest' });
      });
    }, .6, .5);

    /* ---- 48–52.2：夜里把过程拼一遍 ---- */
    B(fr, t, 48.0, 52.5, () => {
      fr.g({ at: [960, 620] }, () => {
        fr.rect(-470, -250, 940, 500, { fill: '#dfe1d7' });
        fr.rect(-470, -250, 940, 8, { fill: '#f7f7ec', a: .7 });
        fr.text('项目过程 · 汇报稿', -430, -210, { font: 'serifm', size: 30, color: P.ink, align: 'l' });
        fr.line(-430, -176, 430, -176, { w: 1, color: '#a9b4b6', a: .55 });
        // 截图一张张被拖进来
        for (let i = 0; i < 4; i++) {
          const k = ss(t, 48.3 + i * .45, 49.2 + i * .45);
          if (k <= 0) continue;
          const dx = [-270, 40, -270, 40][i], dy = [-90, -90, 90, 90][i];
          const fall = (1 - E.out3(k)) * -240;
          fr.g({ at: [dx + 190, dy + fall], rot: (hash(i + 4) - .5) * .13, a: Math.min(1, k * 2) }, () => {
            fr.rect(-190, -64, 380, 128, { fill: '#0f2230' });
            fr.rect(-178, -52, 356, 104, { fill: i % 2 ? '#1d3644' : '#234152' });
            for (let l = 0; l < 4; l++) fr.rect(-160, -38 + l * 22, 80 + ((l * 37 + i * 23) % 190), 6, { fill: '#4c6b7a', a: .8 });
          });
        }
        // 手画的线：断在几处
        const drawK = ss(t, 50.2, 51.6);
        if (drawK > 0) {
          const pts = [];
          for (let i = 0; i <= 60; i++) {
            const u = i / 60; if ((u > .4 && u < .5) || (u > .66 && u < .72)) continue;
            pts.push([-410 + 820 * u, 224 + Math.sin(u * 9) * 7]);
          }
          fr.poly(pts, { k: drawK, color: P.rose, w: 2.4, a: .85, dash: [10, 7] });
          fr.text('拼接的过程 · 两处断开', 0, 268, { font: 'mono', size: 14, track: 2, color: '#c78b9a', a: drawK });
        }
        hand(fr, 430 + 26 * Math.sin(t * 1.6), 80, -.5, ss(t, 48.2, 48.9) * (1 - ss(t, 51.8, 52.4)));
      });
    }, .5, .5);

    /* ---- 52.2–56.4：拼出来的 vs 真实的 ---- */
    B(fr, t, 52.2, 56.7, () => {
      fr.g({ at: [960, 620], s: 1.22 }, () => {
        fr.text('拼接出来的过程', -700, -270, { font: 'mono', size: 14, track: 3, color: '#a9b8bf', align: 'l' });
        fr.text('真实的提交记录', 250, -270, { font: 'mono', size: 14, track: 3, color: '#a9b8bf', align: 'l' });
        const pts = [];
        for (let i = 0; i <= 40; i++) { const u = i / 40; if ((u > .36 && u < .48) || (u > .64 && u < .7)) continue; pts.push([-700 + 420 * u, -180 + Math.sin(u * 8) * 6]); }
        fr.poly(pts, { k: ss(t, 52.4, 53.4), color: P.rose, w: 3.2, dash: [10, 8] });
        fr.text('断在关键处', -700, -110, { font: 'sansr', size: 18, color: '#c78b9a', align: 'l', a: ss(t, 53.0, 53.6) });
        // 真实：48 个点，按真实时间分布
        const mins = G.PTM_COMMITS, realA = ss(t, 53.4, 54.0);
        mins.forEach((m, i) => {
          const u = m / 1730, px = 250 + 690 * u, py = -190 + (i % 6) * 12;
          fr.circle(px, py, 4.6, { fill: P.ice, a: ss(t, 53.4 + i * .014, 53.8 + i * .014) * .95 });
        });
        if (realA > 0) {
          fr.line(250, -26, 940, -26, { w: 1, color: '#7fa2b2', a: .45 * realA });
          fr.text('48 次提交 · 10-16 10:25 → 10-17 15:14', 250, 0, { font: 'mono', size: 14, track: 1, color: '#9fb2ba', align: 'l', a: realA });
          fr.text('连续，可回查', 250, 120, { font: 'sansr', size: 18, color: '#8fbfc9', align: 'l', a: realA });
        }
        fr.line(20, -250, 20, 200, { w: 1, color: '#5a6670', a: .5 });
      });
    }, .5, .5);

    /* ---- 56.4–60.6：需求卡 #3 落到桌上 ---- */
    B(fr, t, 56.4, 60.9, () => {
      const drop = E.out3(ss(t, 56.6, 57.8));
      fr.g({ at: [960, lerp(430, 600, drop)], a: ss(t, 56.4, 56.9), rot: lerp(-.04, -.006, drop) }, () => {
        WS.card(fr, -330, -210, 660, 420, {
          label: 'ISSUE · 需求', num: '#3', title: ['项目证据同步与关联'],
          body: ['目标 · 节选整理', '形成最小可用的项目证据链：', '从公开仓库同步 Issue、Commit、', 'PR 与测试状态，并生成可确认的关联建议。'],
          src: 'github.com/YYJ0226/project-time-machine/issues/3',
          lit: .8, pin: ss(t, 59.4, 60.0) * .8,
        });
        fr.text('CLOSED · 2026-10-16 06:40', 316, -186, { font: 'mono', size: 11, track: 1, color: '#6f8894', align: 'r' });
      });
    }, .5, .6);

    /* ---- 60.6–65.2：三槽填满 ---- */
    B(fr, t, 60.6, 65.5, () => {
      const cols = [[520, 'ISSUE', '#3', '为什么做'], [960, 'PULL REQUEST', '#4', '改了什么'], [1400, 'CHECK', 'CI', '如何验证']];
      fr.g({ at: [960, 640] }, () => {
        fr.rect(-590, -180, 1180, 380, { color: '#6b5a3c', w: 2, a: .55, r: 5 });
      });
      cols.forEach((c, i) => {
        const k = ss(t, 60.9 + i * .55, 61.6 + i * .55);
        if (k <= 0) return;
        const dy = (1 - E.out3(k)) * -170;
        WS.card(fr, c[0] - 180, 470 + dy, 360, 320, { label: c[1], num: c[2], title: [c[3]], lit: .8, a: Math.min(1, k * 1.5) });
      });
      // 金线串起三张卡
      WS.thread(fr, [[695, 640], [785, 640]], ss(t, 63.0, 63.5), { kind: 'gold' });
      WS.thread(fr, [[1135, 640], [1225, 640]], ss(t, 63.4, 63.9), { kind: 'gold' });
    }, .5, .5);

    /* ---- 65.2–69.6：链接钉，翻面看原文 ---- */
    B(fr, t, 65.2, 69.9, () => {
      const cols = [[520, 'ISSUE', '#3', '为什么做'], [960, 'PULL REQUEST', '#4', '改了什么'], [1400, 'CHECK', 'CI', '如何验证']];
      cols.forEach((c, i) => {
        const fk = ss(t, 65.6 + i * .45, 66.1 + i * .45);
        const sx = 1 - .9 * Math.sin(Math.min(1, fk) * Math.PI);
        fr.g({ at: [c[0], 640], s: [Math.max(.04, sx), 1] }, () => {
          WS.card(fr, -175, -150, 350, 300, { label: c[1], num: c[2], title: [c[3]], lit: .75 });
          if (fk > .5) {
            fr.rect(-175, -150, 350, 300, { fill: '#dfe1d7' });
            if (i < 2) {
              const img = i === 0 ? G.PTM_ASSETS.issue3 : G.PTM_ASSETS.pr4;
              fr.g({ at: [-165, -140], clip: [0, 0, 330, 300] }, () => fr.x.drawImage(img, i === 0 ? 240 : 300, i === 0 ? 260 : 540, 1600, 900, 0, 0, 330, 190));
            } else {
              fr.text('1 check passed', 0, -10, { font: 'mono', size: 20, color: '#2f5a3c' });
              fr.circle(0, -70, 22, { color: '#4ea36a', w: 3 });
              fr.poly([[-10, -70], [-2, -60], [12, -82]], { color: '#4ea36a', w: 3 });
            }
            fr.text('原文 · ' + (i === 2 ? 'GitHub Actions' : i === 0 ? 'Issue #3' : 'PR #4'), 0, 120, { font: 'mono', size: 12, track: 1, color: '#5d7480' });
          }
        });
      });
    }, .5, .5);

    /* ---- 69.6–73.6：停住，只上字 ---- */
    B(fr, t, 69.6, 78.4, () => {
      [[520, 'ISSUE', '#3'], [960, 'PULL REQUEST', '#4'], [1400, 'CHECK', 'CI']].forEach(c => {
        WS.card(fr, c[0] - 175, 490, 350, 300, { label: c[1], num: c[2], lit: .6, dim: .85 });
      });
      WS.thread(fr, [[695, 640], [785, 640]], 1, { kind: 'gold' });
      WS.thread(fr, [[1135, 640], [1225, 640]], 1, { kind: 'gold' });
      fr.text('没有打分 · 没有结论 · 没有替老师判断', 960, 868, { font: 'mono', size: 15, track: 3, color: '#9fb2ba', a: .8 });
    }, .6, .6);
  });
}
G.CH = G.CH || {};
G.CH.pull = pull;
})(window);
