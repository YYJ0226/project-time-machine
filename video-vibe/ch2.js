/* ch2.js — 78.5–150 秒：技术路线。四个角色、同步、三把钥匙、人工确认、时间轴、AI 草稿、分享与锁。 */
(function (G) {
'use strict';
const { lerp, ss, E, hash } = G.VK;
const WS = G.WS, P = WS.P;
const B = (fr, t, a, b, fn, fi, fo) => WS.beat(fr, t, a, b, fn, fi, fo);

/* 工坊四角：资料架 / 工作台 / 账本抽屉 / 打字机。整章常驻，随镜头出现 */
function workshop(fr, t, k = 1) {
  // 资料架
  fr.g({ at: [300, 470], a: k }, () => {
    fr.rect(-190, -250, 380, 500, { color: '#4b3d2b', w: 2 });
    for (let r = 0; r < 3; r++) {
      fr.rect(-178, -224 + r * 162, 356, 9, { fill: '#3b3024' });
      for (let i = 0; i < 6; i++) {
        const hh = 44 + (i % 3) * 10;
        fr.rect(-166 + i * 58, -224 + r * 162 - hh, 38, hh, { fill: ['#cfd2c8', '#b9beb2', '#a7b0a8'][i % 3], a: .9 });
        fr.rect(-158 + i * 58, -216 + r * 162 - hh, 22, 4, { fill: '#7d8883', a: .4 });
      }
    }
    fr.text('GITHUB', 0, 286, { font: 'mono', size: 14, track: 4, color: '#8fa3b5' });
  });
  // 工作台
  fr.g({ at: [960, 650], a: k }, () => {
    fr.rect(-360, -26, 720, 28, { r: 3, fill: '#2c2419' });
    fr.rect(-330, -2, 24, 190, { fill: '#221b13' }); fr.rect(306, -2, 24, 190, { fill: '#221b13' });
    fr.rect(-70, -170, 140, 144, { r: 6, fill: '#3a4046' });
    fr.rect(-140, -70, 280, 20, { r: 4, fill: '#78909c' });
    fr.line(-140, -70, 140, -70, { w: 2, color: '#b8ccd4', a: .8 });
    fr.rect(-70, -160, 140, 10, { r: 4, fill: '#55606a' });
    fr.text('NEXT.JS · 服务端', 0, 232, { font: 'mono', size: 14, track: 3, color: '#8fa3b5' });
  });
  // 账本抽屉
  WS.drawer(fr, 1400, 760, 300, 160, 'SUPABASE', k, 0);
  // 打字机
  WS.typewriter(fr, 1620, 560, .95, k, []);
  fr.text('DEEPSEEK', 1620, 660, { font: 'mono', size: 14, track: 4, color: '#8fa3b5', a: k });
  // 浏览器小窗
  fr.g({ at: [960, 300], a: k }, () => {
    fr.rect(-170, -96, 340, 192, { r: 8, fill: '#0d1b26' });
    fr.rect(-170, -96, 340, 24, { r: 8, fill: '#16283a' });
    ['#e84b75', '#f8d893', '#64e3f6'].forEach((cc, i) => fr.circle(-150 + i * 17, -84, 5, { fill: cc, a: .8 }));
    for (let l = 0; l < 5; l++) fr.rect(-150, -54 + l * 24, 100 + ((l * 53) % 180), 6, { fill: '#3f6274', a: .8 });
    fr.text('浏览器', 0, 120, { font: 'mono', size: 14, track: 4, color: '#8fa3b5' });
  });
}

function route(fr, t) {
  const cam = WS.camTrack(t, [
    [78.5, { cx: 960, cy: 540, s: 1 }],
    [87.0, { cx: 960, cy: 560, s: 1.06 }],
    [92.0, { cx: 960, cy: 600, s: 1.16 }],
    [112.0, { cx: 960, cy: 600, s: 1.16 }],
    [114.0, { cx: 960, cy: 560, s: 1.02 }],
    [131.0, { cx: 960, cy: 560, s: 1.02 }],
    [133.0, { cx: 960, cy: 580, s: 1.1 }],
    [145.0, { cx: 960, cy: 560, s: 1.0 }],
    [150.0, { cx: 960, cy: 540, s: .96 }],
  ]);
  WS.cam(fr, cam, () => {
    /* ---- 78.5–82.9：四个角色 + 四盏灯 ---- */
    B(fr, t, 78.5, 83.2, () => {
      workshop(fr, t, 1);
      const spots = [[960, 214, '浏览器'], [960, 570, '服务端'], [300, 250, 'GitHub'], [1470, 800, '账本'], [1620, 560, '打字机']];
      spots.forEach((s, i) => {
        const k = ss(t, 79.2 + i * .42, 80.0 + i * .42);
        if (k <= 0) return;
        fr.glow(s[0], s[1], 200, '#FFD9A0', .15 * k);
        fr.text(s[2], s[0], s[1] + 286, { font: 'mono', size: 13, track: 3, color: '#b8c6cc', a: k, y: 0 });
      });
    }, .6, .5);

    /* ---- 82.9–87.3：裁成同一种卡片 ---- */
    B(fr, t, 82.9, 87.6, () => {
      workshop(fr, t, .55);
      const kinds = ['ISSUE', 'COMMIT', 'PULL REQUEST', 'CHECK'];
      for (let i = 0; i < 4; i++) {
        const k = ss(t, 83.2 + i * .5, 84.3 + i * .5);
        if (k <= 0) continue;
        const px = lerp(250, 900, E.io3(k)), py = 560 + i * 46 - Math.sin(k * Math.PI) * 90;
        fr.g({ at: [px, py], rot: lerp(-.22, 0, k), a: Math.min(1, k * 1.5) }, () => {
          fr.rect(-95, -48, 190, 96, { fill: '#d7d9d0' });
          fr.text(kinds[i], 0, 0, { font: 'mono', size: 14, track: 2, color: '#2d4e5e' });
        });
      }
      const cutK = ss(t, 85.0, 85.9);
      if (cutK > 0) {
        fr.line(820, 470, 1120, 470, { w: 2.4, color: '#b8ccd4', a: .9 * cutK });
        fr.g({ at: [970, 470 + (1 - E.out3(cutK)) * -80], a: cutK }, () => fr.rect(-14, -22, 28, 44, { r: 4, fill: '#78909c' }));
      }
      const doneK = ss(t, 85.9, 86.7);
      if (doneK > 0) {
        for (let i = 0; i < 6; i++) fr.rect(1030 + i * 1.6, 660 - i * 4, 300, 190, { fill: i % 2 ? '#cfd2c8' : '#d9dcd2', a: doneK * .96 });
        fr.text('同一种结构', 1180, 720, { font: 'serifm', size: 25, track: 5, color: '#415d6a', a: doneK });
        fr.text('issue · commit · pr · check', 1180, 760, { font: 'mono', size: 12, track: 1, color: '#6f8894', a: doneK });
      }
    }, .5, .5);

    /* ---- 91.7–96.1：同步杆与一百条 ---- */
    B(fr, t, 91.7, 96.4, () => {
      workshop(fr, t, .45);
      // 同步杆
      const ang = lerp(-.7, .95, ss(t, 92.2, 94.2));
      fr.g({ at: [300, 800] }, () => {
        fr.line(0, 0, 0, 70, { w: 8, color: '#8d6b33' });
        fr.circle(0, -8, 16, { fill: '#b8914c' });
        fr.g({ at: [0, -8], rot: ang }, () => fr.rect(-7, -7, 190, 14, { r: 7, fill: '#c9a45e' }));
        fr.text('SYNC', 60, 60, { font: 'mono', size: 14, track: 3, color: '#c9d8dd' });
      });
      // 托盘 + 落卡
      fr.g({ at: [1000, 700] }, () => {
        fr.rect(-380, 140, 760, 30, { r: 6, fill: '#2c2419' });
        fr.rect(-356, 112, 712, 26, { fill: '#0b0f12' });
      });
      for (let i = 0; i < 12; i++) {
        const k = ss(t, 92.4 + i * .16, 93.3 + i * .16);
        if (k <= 0) continue;
        const px = 700 + (i % 5) * 150, py = lerp(360, 660, E.in2(Math.min(1, k * 1.15)));
        fr.rect(px, py, 132, 96, { fill: i % 3 ? '#d5d8ce' : '#c8ccc1', a: .96 });
      }
      const ck = Math.round(lerp(0, 100, ss(t, 92.4, 94.8)));
      fr.text(String(ck).padStart(3, '0'), 1000, 380, { font: 'mono', size: 110, color: '#dbe7e9', a: .26 });
      fr.text('每次同步 · 最近 100 条', 1000, 866, { font: 'mono', size: 15, track: 3, color: '#9fb6c8' });
    }, .5, .6);

    /* ---- 96.1–104.9：三把钥匙 ---- */
    B(fr, t, 96.1, 105.2, () => {
      workshop(fr, t, .3);
      WS.card(fr, 470, 560, 420, 280, { label: 'ISSUE', num: '#3', title: ['项目证据同步与关联'], lit: .8 });
      WS.card(fr, 1030, 560, 420, 280, { label: 'PULL REQUEST', num: '#4', title: ['项目证据同步与审阅'], lit: .8 });
      // 锁孔
      fr.circle(960, 640, 66, { color: '#8fa3b5', w: 1.4, a: .5 });
      fr.rect(952, 620, 16, 40, { r: 4, fill: '#0b0f12' });
      const keys = [['#3', 98.4], ['feat/evidence-sync', 100.8], ['5458666', 102.4]];
      keys.forEach((kk, i) => {
        const k = ss(t, kk[1], kk[1] + .9);
        if (k <= 0) return;
        const px = lerp(820, 940, E.out3(k)), py = 300 + i * 92;
        WS.key(fr, px, py, kk[0], k, { rot: -.05 + i * .03, s: .95 });
      });
      const ins = ss(t, 103.0, 104.0);
      if (ins > 0) {
        WS.thread(fr, [[890, 580], [960, 560], [1030, 580]], ss(t, 103.2, 104.4), { kind: 'suggest' });
        fr.text('规则建议 · 未确认', 960, 720, { font: 'mono', size: 14, track: 3, color: '#9fb6c8', a: ins * .85 });
      }
    }, .5, .5);

    /* ---- 104.9–109.3：停住，建议不是结论 ---- */
    B(fr, t, 104.9, 109.6, () => {
      workshop(fr, t, .3);
      WS.card(fr, 470, 560, 420, 280, { label: 'ISSUE', num: '#3', title: ['项目证据同步与关联'], lit: .7, dim: .9 });
      WS.card(fr, 1030, 560, 420, 280, { label: 'PULL REQUEST', num: '#4', title: ['项目证据同步与审阅'], lit: .7, dim: .9 });
      WS.thread(fr, [[890, 580], [960, 560], [1030, 580]], 1, { kind: 'suggest' });
      fr.text('置信度常量不是准确率', 960, 848, { font: 'mono', size: 14, track: 2, color: '#8d9fa8' });
    }, .5, .5);

    /* ---- 109.3–113.7：盖章，线变金 ---- */
    B(fr, t, 109.3, 114.0, () => {
      workshop(fr, t, .3);
      WS.card(fr, 470, 560, 420, 280, { label: 'ISSUE', num: '#3', title: ['项目证据同步与关联'], lit: .8 });
      WS.card(fr, 1030, 560, 420, 280, { label: 'PULL REQUEST', num: '#4', title: ['项目证据同步与审阅'], lit: .8 });
      const st = ss(t, 109.9, 111.0);
      WS.thread(fr, [[890, 580], [960, 560], [1030, 580]], .25 + .75 * st, { kind: st > .55 ? 'gold' : 'suggest' });
      WS.press(fr, 960, 560, '确认', st, {});
      if (st > .9) WS.stampMark(fr, 1110, 700, '已确认', 1, 'gold');
    }, .5, .5);

    /* ---- 113.7–118.1：四行针脚上轴 ---- */
    B(fr, t, 113.7, 118.4, () => {
      const X = WS.axis(fr, 250, 470, 1420, { lo: -40, hi: 1760, lanes: ['需求', '实现', '验证', 'AI'], days: [{ m: 0, label: '10-16' }, { m: 1440, label: '10-17' }] });
      const rows = [520, 600, 680, 760];
      const mins = G.PTM_COMMITS;
      mins.forEach((m, i) => {
        const k = ss(t, 114.0 + i * .035, 114.4 + i * .035);
        if (k <= 0) return;
        fr.line(X(m), rows[1] - 10, X(m), rows[1] + 10, { w: 2.2, color: P.ice, a: .8 * k, glow: 8, glowColor: P.ice, glowA: .4 });
      });
      [[0, 0], [0, 1440], [2, 620], [2, 1680], [2, 1400], [3, 980]].forEach(([r, m], i) => {
        const k = ss(t, 115.0 + i * .15, 115.5 + i * .15);
        if (k <= 0) return;
        fr.circle(X(m), rows[r], 6, { fill: r === 3 ? P.gold : r === 0 ? P.ice : '#8fbfc9', a: k });
      });
      fr.text('同一根轴 · 同一种时间口径', 960, 866, { font: 'mono', size: 14, track: 3, color: '#9fb6c8' });
    }, .5, .5);

    /* ---- 118.1–122.5：回放；旁边一扇锁着的门 ---- */
    B(fr, t, 118.1, 122.8, () => {
      const X = WS.axis(fr, 230, 470, 1180, { lo: -40, hi: 1760, lanes: ['需求', '实现', '验证', 'AI'], days: [{ m: 0, label: '10-16' }, { m: 1440, label: '10-17' }] });
      const rows = [520, 600, 680, 760];
      const playK = ss(t, 118.6, 121.2);
      G.PTM_COMMITS.forEach(m => {
        const on = m / 1730 <= playK;
        fr.line(X(m), rows[1] - 10, X(m), rows[1] + 10, { w: 2.2, color: on ? '#ffd9a0' : P.ice, a: on ? .95 : .35, glow: on ? 8 : 0, glowColor: '#ffd9a0', glowA: .5 });
      });
      const px = lerp(230, 1410, E.lin ? playK : playK);
      fr.line(px, 450, px, 790, { w: 1.8, color: '#ffd9a0', a: .9, glow: 16, glowColor: '#ffd9a0', glowA: .7 });
      fr.spark(px, 450, 5, '#ffd9a0', 1);
      // 门：恢复环境
      WS.door(fr, 1560, 500, 180, 340, 1, {});
      fr.rect(1592, 640, 34, 30, { r: 4, fill: '#8d6b33' });
      fr.arc(1609, 640, 12, Math.PI, 0, { color: '#c9a45e', w: 3 });
      fr.text('恢复环境', 1650, 882, { font: 'mono', size: 13, track: 2, color: '#c78b9a' });
    }, .5, .5);

    /* ---- 122.5–126.9：打字机 + 引用钉 ---- */
    B(fr, t, 122.5, 127.2, () => {
      WS.typewriter(fr, 900, 700, 1.1, 1, []);
      const lines = ['阶段摘要 · 草稿', '需求 #3 定义了证据链的最小范围，', 'PR #4 实现了同步与审阅，', '验证来自 GitHub Actions 检查。'];
      const typeK = ss(t, 123.0, 125.6);
      fr.g({ at: [900, 500] }, () => {
        fr.rect(-270, -130, 540, 260, { fill: '#e6e6da' });
        fr.rect(-270, -130, 540, 7, { fill: '#fbfbef', a: .7 });
        lines.forEach((ln, i) => {
          const k = Math.max(0, Math.min(1, typeK * 4 - i));
          if (k <= 0) return;
          const s = Array.from(ln).slice(0, Math.ceil(ln.length * k)).join('');
          fr.text(s, -244, -92 + i * 46, { font: i === 0 ? 'serifm' : 'type', size: i === 0 ? 21 : 18, color: '#22333d', align: 'l' });
        });
      });
      for (let i = 0; i < 3; i++) {
        const k = ss(t, 124.2 + i * .45, 124.7 + i * .45);
        if (k <= 0) continue;
        fr.circle(1230, 452 + i * 46, 7, { color: P.ice, w: 1.5, a: k });
        fr.circle(1230, 452 + i * 46, 2.8, { fill: P.ice, a: k });
        fr.line(1243, 452 + i * 46, 1290, 452 + i * 46, { w: 1, color: P.ice, a: .55 * k, cap: 'butt' });
        fr.text('引用', 1300, 452 + i * 46, { font: 'mono', size: 11, color: '#8d9fa8', align: 'l', a: k });
      }
      WS.stampMark(fr, 690, 400, 'AI 草稿', ss(t, 125.8, 126.3), 'ice');
    }, .5, .5);

    /* ---- 126.9–131.3：确认后才允许交付 ---- */
    B(fr, t, 126.9, 131.6, () => {
      fr.g({ at: [900, 500] }, () => {
        fr.rect(-270, -130, 540, 260, { fill: '#e6e6da' });
        fr.text('阶段摘要', -244, -92, { font: 'serifm', size: 21, color: '#22333d', align: 'l' });
        for (let i = 0; i < 3; i++) fr.rect(-244, -40 + i * 34, 300 + ((i * 71) % 150), 5, { fill: '#93a5a0', a: .55 });
      });
      WS.stampMark(fr, 690, 400, 'AI 草稿', 1, 'ice');
      const conf = ss(t, 127.8, 129.0);
      WS.press(fr, 900, 500, '确认', conf, {});
      if (conf > .9) {
        WS.stampMark(fr, 1010, 400, '已确认', 1, 'gold');
        // 草稿带被划断
        fr.line(636, 400, 744, 400, { w: 2.4, color: P.rose, a: .8 });
      }
    }, .5, .5);

    /* ---- 131.3–135.7：带期限的门 + 撤销 ---- */
    B(fr, t, 131.3, 136.0, () => {
      const rev = ss(t, 134.2, 135.2);
      WS.door(fr, 520, 420, 220, 420, 1, { ticket: 'LINK 04F2', ticketK: ss(t, 131.8, 132.4), cut: rev });
      fr.text('链接 · 可撤销 · 有期限', 630, 892, { font: 'mono', size: 13, track: 2, color: '#9fb6c8' });
      // 老师的影子在门外
      fr.g({ at: [420, 680], a: ss(t, 132.2, 132.9) }, () => {
        fr.circle(0, -70, 26, { fill: '#1c232a' });
        fr.path('M-46,70 C-46,6 46,6 46,70 Z', { fill: '#1c232a' });
        fr.text('未登录', 0, 110, { font: 'mono', size: 12, track: 2, color: '#8d9fa8' });
      });
      // 玻璃后的草稿
      fr.g({ at: [1180, 620], a: ss(t, 132.8, 133.6) }, () => {
        fr.rect(-250, -160, 500, 320, { fill: '#dfe1d7', a: .86 });
        for (let i = 0; i < 6; i++) fr.rect(-220, -116 + i * 36, 220 + ((i * 71) % 170), 5, { fill: '#9fb0ab', a: .5 });
        fr.rect(-250, -160, 500, 320, { fill: '#0a1116', a: .6 });
        fr.text('草稿不可见', 0, 0, { font: 'serifm', size: 21, track: 4, color: '#b9c7cc' });
        fr.text('只读快照 · 只含已确认内容', 0, 196, { font: 'mono', size: 12, track: 2, color: '#8d9fa8' });
      });
      if (rev > 0) fr.text('撤销 · 同一地址空白', 630, 926, { font: 'mono', size: 13, track: 2, color: '#c78b9a', a: rev });
    }, .5, .5);

    /* ---- 135.7–140：抽屉各有锁 ---- */
    B(fr, t, 135.7, 140.4, () => {
      [[560, 470], [880, 470], [1200, 470]].forEach((p, i) => {
        const k = ss(t, 136.0 + i * .35, 136.8 + i * .35);
        if (k <= 0) return;
        WS.drawer(fr, p[0], p[1], 260, 230, ['EVIDENCE', 'LINKS', 'SHARES'][i], k, 0);
        fr.rect(p[0] + 232, p[1] + 96, 16, 18, { r: 3, fill: '#a9823f', a: k });
        fr.arc(p[0] + 240, p[1] + 96, 7, Math.PI, 0, { color: '#c9a45e', w: 2.4, a: k });
      });
      fr.g({ at: [560, 800], a: ss(t, 137.4, 138.2) }, () => {
        fr.circle(0, 0, 24, { color: '#c9a45e', w: 4 });
        fr.line(24, 0, 76, 0, { w: 5, color: '#b8914c' });
        fr.line(58, 0, 58, 15, { w: 4, color: '#b8914c' });
        fr.text('钥匙只在服务端 · RLS + 所有权校验', 100, 0, { font: 'mono', size: 13, track: 2, color: '#a99c7c', align: 'l' });
      });
    }, .5, .6);

    /* ---- 140–150：无字幕的收束：四样东西回到各自位置 ---- */
    B(fr, t, 140.0, 150.4, () => {
      workshop(fr, t, .8);
      fr.text('浏览器 → 服务端 → GitHub → 账本 → 打字机 → 门', 960, 940, { font: 'mono', size: 14, track: 3, color: '#7f95a2', a: .7 });
    }, .8, .8);
  });
}
G.CH = G.CH || {};
G.CH.route = route;
})(window);
