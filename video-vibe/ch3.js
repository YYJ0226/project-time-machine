/* ch3.js — 150–262 秒：实验。拿本项目走一遍全程；每一镜都以字幕真实时间为准。 */
(function (G) {
'use strict';
const { lerp, ss, E, hash, clamp } = G.VK;
const WS = G.WS, P = WS.P;
const B = (fr, t, a, b, fn, fi, fo) => WS.beat(fr, t, a, b, fn, fi, fo);

function pile(fr, x, y, n, w, h, a, o = {}) {
  for (let i = n - 1; i >= 0; i--) {
    const k = clamp((o.grow == null ? 1 : o.grow) * n - i); if (k <= 0) continue;
    fr.rect(x - w / 2 + (i % 3) * 1.2, y - h / 2 - i * 2.4, w, h, { fill: i % 5 === 2 ? '#c6cbc0' : '#d7d9d0', a: a * Math.min(1, k * 2) * .95 });
  }
  if (o.num != null) fr.text(String(o.num), x, y + h / 2 + 52, { font: 'mono', size: 40, track: 1, color: o.tone === 'rose' ? '#e08a9e' : '#dde8ea', a });
  if (o.label) fr.text(o.label, x, y + h / 2 + 96, { font: 'mono', size: 14, track: 3, color: '#8d9fa8', a });
}

function lab(fr, t) {
  const cam = WS.camTrack(t, [
    [150.0, { cx: 960, cy: 540, s: 1 }],
    [164.0, { cx: 960, cy: 600, s: 1.06 }],
    [176.8, { cx: 960, cy: 600, s: 1.12 }],
    [185.6, { cx: 960, cy: 560, s: 1.0 }],
    [203.0, { cx: 960, cy: 600, s: 1.06 }],
    [220.4, { cx: 960, cy: 600, s: 1.0 }],
    [233.2, { cx: 960, cy: 600, s: 1.04 }],
    [250.0, { cx: 960, cy: 560, s: .98 }],
    [262.0, { cx: 960, cy: 540, s: .94 }],
  ]);
  WS.cam(fr, cam, () => {
    /* ---- 151.0–155.4：实验页 ---- */
    B(fr, t, 150.6, 155.7, () => {
      const a2 = ss(t, 151.2, 152.2);
      fr.g({ at: [960, 560], rot: -.008 }, () => {
        fr.rect(-470, -270, 940, 540, { fill: '#dfe1d7' });
        fr.rect(-470, -270, 940, 9, { fill: '#fbfbf0', a: .75 });
        fr.text('实验 · 一条真实仓库的全程', -430, -212, { font: 'serifm', size: 34, color: P.ink, align: 'l' });
        fr.line(-430, -168, 430, -168, { w: 1, color: '#a9b4b6', a: .6 });
        fr.text('案例：github.com/YYJ0226/project-time-machine', -430, -112, { font: 'mono', size: 17, track: 1, color: '#3f5c6b', align: 'l', a: a2 });
        fr.text('2026-10-16 10:25 起 · 48 次提交', -430, -68, { font: 'mono', size: 17, track: 1, color: '#3f5c6b', align: 'l', a: a2 });
        WS.stampMark(fr, 330, -212, '真实记录', ss(t, 152.6, 153.2), 'gold');
        for (let i = 0; i < 7; i++) fr.rect(-430, -8 + i * 34, 340 + ((i * 97) % 280), 6, { fill: '#9fb0ab', a: .42 * a2 });
      });
      // 其余纸片被推到一边
      for (let i = 0; i < 8; i++) {
        const k = ss(t, 151.4, 153.2);
        if (k >= 1) continue;
        fr.g({ at: [180 + hash(i) * 1560, 760 + hash(i + 2) * 180], rot: hash(i) * 1.2, a: .45 * (1 - k) }, () => fr.rect(-90, -50, 180, 100, { fill: '#c6cbc0' }));
      }
    }, .6, .5);

    /* ---- 155.4–159.6：三摞真实数量 ---- */
    B(fr, t, 155.0, 159.9, () => {
      const items = [[480, 640, 230, 'ISSUE', 11], [960, 660, 260, 'COMMIT', 48], [1440, 640, 230, 'PULL REQUEST', 9]];
      items.forEach((it, i) => {
        const k = ss(t, 155.4 + i * .45, 156.4 + i * .45);
        if (k <= 0) return;
        pile(fr, it[0], it[1], Math.min(14, 8 + i * 4), it[2], 190, k, { grow: ss(t, 155.4 + i * .45, 156.2 + i * .45), label: it[3], num: it[4] });
      });
      fr.text('github.com/YYJ0226/project-time-machine', 960, 908, { font: 'mono', size: 14, track: 2, color: '#8d9fa8', a: ss(t, 156.0, 156.8) });
    }, .5, .5);

    /* ---- 159.6–164.0：第一次同步 27 条 ---- */
    B(fr, t, 159.3, 164.3, () => {
      fr.g({ at: [960, 720] }, () => {
        fr.rect(-430, 150, 860, 34, { r: 6, fill: '#2c2419' });
        fr.rect(-404, 118, 808, 30, { fill: '#0b0f12' });
      });
      const n = 27;
      for (let i = 0; i < n; i++) {
        const k = ss(t, 159.8 + i * .19, 160.4 + i * .19);
        if (k <= 0) continue;
        const col = i % 7, row = Math.floor(i / 7);
        const px = 700 + col * 78, py = lerp(300, 640, E.in2(Math.min(1, k * 1.1))) - row * 4;
        fr.rect(px, py, 68, 48, { fill: i % 3 ? '#d5d8ce' : '#c8ccc1', a: .96 });
      }
      const ck = Math.round(lerp(0, 27, ss(t, 160.0, 162.2)));
      fr.text(String(ck), 960, 380, { font: 'mono', size: 160, color: '#dbe7e9', a: .17 });
      fr.text('首次同步 · 27 条', 960, 890, { font: 'mono', size: 16, track: 3, color: '#9fb6c8', a: ss(t, 160.4, 161.2) });
    }, .5, .5);

    /* ---- 164.0–168.2：四类卡片 ---- */
    B(fr, t, 164.0, 168.5, () => {
      const items = [[470, '需求 ISSUE', '#3'], [800, '提交 COMMIT', '91276c8'], [1130, '修改 PR', '#4'], [1460, '检查 CHECK', 'CI']];
      items.forEach((it, i) => {
        const k = ss(t, 164.2 + i * .4, 165.4 + i * .4);
        if (k <= 0) return;
        WS.card(fr, it[0] - 140, 470, 280, 300, { label: it[1], num: it[2], a: Math.min(1, k * 1.4), lit: .7, s: 1 });
      });
    }, .5, .5);

    /* ---- 168.2–172.6：#3 与 #4，Closes #3 ---- */
    B(fr, t, 168.2, 172.9, () => {
      WS.card(fr, 430, 380, 440, 280, { label: 'ISSUE', num: '#3', title: ['项目证据同步与关联'], lit: .85 });
      const prK = ss(t, 168.9, 169.9);
      WS.card(fr, 1050, 380, 440, 280, { label: 'PULL REQUEST', num: '#4', title: ['项目证据同步与审阅'], a: prK, lit: .85 });
      const q = ss(t, 169.8, 170.6);
      if (q > 0) {
        fr.rect(1110, 580, 330, 58, { color: P.gold, w: 2.2, a: q, r: 2 });
        fr.text('Closes #3.', 1128, 610, { font: 'mono', size: 34, color: '#1c3a48', align: 'l', a: q });
      }
      // 规则把两张卡连起来（虚线）
      WS.thread(fr, [[880, 520], [1050, 520]], ss(t, 171.0, 171.8), { kind: 'suggest' });
    }, .5, .5);

    /* ---- 172.6–176.8：PR #4 的检查 ---- */
    B(fr, t, 172.6, 177.1, () => {
      WS.card(fr, 430, 380, 440, 280, { label: 'ISSUE', num: '#3', title: ['项目证据同步与关联'], lit: .75 });
      WS.card(fr, 1050, 380, 440, 280, { label: 'PULL REQUEST', num: '#4', title: ['项目证据同步与审阅'], lit: .75 });
      WS.thread(fr, [[880, 520], [1050, 520]], 1, { kind: 'suggest' });
      const ck = ss(t, 173.2, 174.2);
      if (ck > 0) {
        WS.card(fr, 430, 720, 500, 150, { label: 'CHECK · CI', num: '1', title: ['通过 · 1 check passed'], a: ck, lit: .8, tone: 'gold' });
        fr.circle(860, 795, 20, { color: '#4ea36a', w: 2.6, a: ck });
        fr.poly([[852, 795], [858, 803], [870, 785]], { color: '#4ea36a', w: 2.8, a: ck });
      }
    }, .5, .5);

    /* ---- 176.8–181.2：三张卡接成金链 ---- */
    B(fr, t, 176.8, 181.5, () => {
      WS.card(fr, 430, 380, 440, 280, { label: 'ISSUE', num: '#3', title: ['项目证据同步与关联'], lit: .8 });
      WS.card(fr, 1050, 380, 440, 280, { label: 'PULL REQUEST', num: '#4', title: ['项目证据同步与审阅'], lit: .8 });
      WS.card(fr, 430, 720, 500, 150, { label: 'CHECK · CI', num: '1', title: ['通过'], lit: .8, tone: 'gold' });
      const k1 = ss(t, 177.4, 178.4), k2 = ss(t, 178.4, 179.4);
      WS.thread(fr, [[880, 520], [1050, 520]], 1, { kind: k1 > .5 ? 'gold' : 'suggest' });
      if (k2 > 0) {
        WS.thread(fr, [[760, 660], [760, 795], [930, 795]], k2, { kind: 'gold' });
        WS.thread(fr, [[1270, 660], [1270, 795], [930, 795]], k2, { kind: 'gold' });
      }
      fr.text('需求 → 实现 → 验证', 960, 900, { font: 'mono', size: 14, track: 3, color: '#d8c08a', a: ss(t, 179.0, 179.8) });
    }, .5, .5);

    /* ---- 181.2–185.6：建议 vs 确认 ---- */
    B(fr, t, 181.2, 185.9, () => {
      fr.text('只有规则', 470, 330, { font: 'mono', size: 15, track: 3, color: '#9fb6c8' });
      fr.text('按下确认', 1450, 330, { font: 'mono', size: 15, track: 3, color: '#d8c08a' });
      fr.line(960, 300, 960, 840, { w: 1, color: '#5a6670', a: .4 });
      [[470, 'suggest'], [1450, 'gold']].forEach(([x, kind], i) => {
        WS.card(fr, x - 170, 390, 340, 200, { label: 'ISSUE', num: '#3', lit: .7 });
        WS.card(fr, x - 170, 650, 340, 200, { label: 'PULL REQUEST', num: '#4', lit: .7 });
        WS.thread(fr, [[x, 590], [x, 650]], 1, { kind });
      });
      const st = ss(t, 182.6, 183.6);
      WS.press(fr, 1450, 620, '确认', st, {});
      if (st > .9) WS.stampMark(fr, 1450, 410, '已确认', 1, 'gold');
    }, .5, .5);

    /* ---- 185.6–190.0：第二次同步 63 条 ---- */
    B(fr, t, 185.6, 190.3, () => {
      for (let i = 0; i < 63; i++) {
        const k = ss(t, 186.0 + i * .045, 186.5 + i * .045);
        if (k <= 0) continue;
        const col = i % 9, row = Math.floor(i / 9);
        const px = 650 + col * 76, py = 520 + row * 44 + (1 - E.in2(k)) * -70;
        fr.rect(px, py, 68, 38, { fill: i % 4 === 0 ? '#c8ccc1' : '#d7d9d0', a: .96 });
      }
      const ck = Math.round(lerp(27, 63, ss(t, 186.2, 188.6)));
      fr.text(String(ck), 960, 330, { font: 'mono', size: 150, color: '#dbe7e9', a: .2 });
      fr.text('当前证据 63 条', 960, 890, { font: 'mono', size: 16, track: 3, color: '#9fb6c8', a: ss(t, 186.8, 187.6) });
    }, .5, .5);

    /* ---- 190.0–194.2：48 次提交上轴 ---- */
    B(fr, t, 190.0, 194.5, () => {
      const X = WS.axis(fr, 240, 500, 1440, { lo: -40, hi: 1760, lanes: ['需求', '实现', '验证', 'AI'], days: [{ m: 0, label: '10-16' }, { m: 1440, label: '10-17' }] });
      const mins = G.PTM_COMMITS;
      mins.forEach((m, i) => {
        const k = ss(t, 190.4 + i * .03, 190.8 + i * .03);
        if (k <= 0) return;
        fr.line(X(m), 590, X(m), 610, { w: 2.4, color: P.ice, a: .85 * k, glow: 8, glowColor: P.ice, glowA: .45 });
      });
      fr.text('48 次提交 · 2026-10-16 10:25 → 10-17 15:14', 960, 880, { font: 'mono', size: 14, track: 2, color: '#9fb6c8', a: ss(t, 191.0, 191.8) });
    }, .5, .5);

    /* ---- 194.2–198.6：四条泳道 ---- */
    B(fr, t, 194.2, 198.9, () => {
      const X = WS.axis(fr, 240, 470, 1440, { lo: -40, hi: 1760, lanes: ['需求', '实现', '验证', 'AI'], days: [{ m: 0, label: '10-16' }, { m: 1440, label: '10-17' }] });
      const rows = [510, 580, 650, 720];
      G.PTM_COMMITS.forEach((m, i) => {
        const k = ss(t, 194.5 + i * .02, 194.9 + i * .02);
        if (k <= 0) return;
        fr.line(X(m), rows[1] - 9, X(m), rows[1] + 9, { w: 2.2, color: P.ice, a: .8 * k, glow: 6, glowColor: P.ice, glowA: .4 });
      });
      [[0, 0], [0, 1440], [2, 620], [2, 1400], [2, 1680], [3, 980]].forEach(([r, m], i) => {
        const k = ss(t, 195.4 + i * .14, 195.9 + i * .14);
        if (k <= 0) return;
        fr.circle(X(m), rows[r], 6, { fill: r === 3 ? P.gold : P.ice, a: k });
      });
    }, .5, .5);

    /* ---- 198.6–203.0：回放 ---- */
    B(fr, t, 198.6, 203.3, () => {
      const X = WS.axis(fr, 240, 470, 1440, { lo: -40, hi: 1760, lanes: ['需求', '实现', '验证', 'AI'], days: [{ m: 0, label: '10-16' }, { m: 1440, label: '10-17' }] });
      const rows = [510, 580, 650, 720];
      const playK = ss(t, 199.0, 201.8);
      G.PTM_COMMITS.forEach(m => {
        const on = m / 1730 <= playK;
        fr.line(X(m), rows[1] - 9, X(m), rows[1] + 9, { w: 2.2, color: on ? '#ffd9a0' : P.ice, a: on ? .95 : .3, glow: on ? 8 : 0, glowColor: '#ffd9a0', glowA: .55 });
      });
      [[0, 0], [0, 1440], [2, 620], [2, 1400], [2, 1680], [3, 980]].forEach(([r, m]) => {
        fr.circle(X(m), rows[r], 6, { fill: r === 3 ? P.gold : P.ice, a: m / 1730 <= playK ? .95 : .25 });
      });
      const px = lerp(240, 1680, playK);
      fr.line(px, 450, px, 780, { w: 1.8, color: '#ffd9a0', a: .9, glow: 16, glowColor: '#ffd9a0', glowA: .7 });
      fr.spark(px, 450, 5, '#ffd9a0', 1);
      fr.text(playK < .62 ? '10-16' : '10-17', 960, 850, { font: 'mono', size: 26, track: 5, color: '#ffd9a0' });
    }, .5, .5);

    /* ---- 203.0–207.2：AI 从 37 条旧证据写草稿 ---- */
    B(fr, t, 203.0, 207.5, () => {
      WS.typewriter(fr, 620, 720, 1.0, 1, []);
      for (let i = 0; i < 12; i++) {
        const k = ss(t, 203.4 + i * .09, 204.3 + i * .09);
        if (k <= 0) continue;
        const px = lerp(940 + (i % 4) * 46, 700, E.io3(k)), py = lerp(600, 520, E.io3(k)) - (i % 3) * 26;
        fr.rect(px, py, 50, 34, { fill: '#d7d9d0', a: .95 });
      }
      const tk = ss(t, 204.0, 206.0);
      fr.g({ at: [1310, 560] }, () => {
        fr.rect(-240, -160, 480, 320, { fill: '#e4e4d8' });
        fr.text('阶段摘要 · 历史草稿', -214, -122, { font: 'serifm', size: 21, color: P.ink, align: 'l' });
        const lines = ['…PR #9 仍未合并…', '证据来自同步快照。', '待人工确认后交付。'];
        lines.forEach((s, i) => {
          const k = Math.max(0, Math.min(1, tk * 3 - i));
          if (k <= 0) return;
          fr.text(s, -214, -66 + i * 38, { font: 'type', size: 18, color: '#22333d', align: 'l' });
        });
      });
      fr.text('输入 37 条 · 生成 10-17', 960, 890, { font: 'mono', size: 14, track: 2, color: '#9fb6c8', a: ss(t, 204.4, 205.2) });
    }, .5, .5);

    /* ---- 207.2–211.6：错位 ---- */
    B(fr, t, 207.2, 211.9, () => {
      fr.g({ at: [620, 560] }, () => {
        fr.rect(-300, -200, 600, 400, { fill: '#e4e4d8' });
        fr.text('历史草稿 · 10-17 09:26', -270, -160, { font: 'mono', size: 13, track: 2, color: '#5d7480', align: 'l' });
        fr.text('…PR #9 仍未合并…', -270, -70, { font: 'type', size: 21, color: '#22333d', align: 'l' });
        fr.rect(-280, -96, 300, 46, { color: P.rose, w: 2, a: ss(t, 208.0, 208.8) });
      });
      const ck = ss(t, 208.4, 209.4);
      if (ck > 0) {
        fr.g({ at: [1370, 560], a: ck }, () => {
          fr.rect(-300, -200, 600, 400, { fill: '#e7e8dd' });
          fr.text('当前证据 · PR #9', -270, -160, { font: 'mono', size: 13, track: 2, color: '#4f6b78', align: 'l' });
          fr.text('merged', -270, -60, { font: 'mono', size: 46, color: '#2f5a3c', align: 'l' });
          fr.text('合并于 10-16 21:27', -270, -6, { font: 'mono', size: 15, color: '#4f6b78', align: 'l' });
          fr.line(-270, 30, 270, 30, { w: 1, color: '#a9b4b6', a: .5 });
          fr.text('旧输入与新证据不一致', -270, 70, { font: 'sansr', size: 17, color: '#a2626f', align: 'l' });
        });
        fr.line(930, 560, 1060, 560, { w: 1.4, color: P.rose, a: .7 * ck, dash: [7, 7] });
        fr.text('≠', 996, 560, { font: 'serifl', size: 44, color: P.rose, a: ck });
      }
    }, .5, .5);

    /* ---- 211.6–216.0：保留错位，加历史角标 ---- */
    B(fr, t, 211.6, 216.3, () => {
      fr.g({ at: [960, 560] }, () => {
        fr.rect(-360, -230, 720, 460, { fill: '#e4e4d8' });
        fr.text('阶段摘要 · 历史草稿', -330, -190, { font: 'serifm', size: 24, color: P.ink, align: 'l' });
        fr.text('…PR #9 仍未合并…', -330, -110, { font: 'type', size: 24, color: '#22333d', align: 'l' });
        fr.rect(-340, -140, 340, 54, { color: P.rose, w: 2 });
        fr.text('这一句没有改', -330, -60, { font: 'mono', size: 13, track: 2, color: '#a2626f', align: 'l' });
        for (let i = 0; i < 4; i++) fr.rect(-330, 10 + i * 36, 260 + ((i * 71) % 220), 6, { fill: '#9fb0ab', a: .45 });
        WS.stampMark(fr, 268, -176, '历史', ss(t, 213.4, 214.0), 'rose');
      });
      fr.text('原文保留 · 不改写', 960, 866, { font: 'mono', size: 14, track: 3, color: '#9fb6c8', a: ss(t, 213.6, 214.4) });
    }, .5, .5);

    /* ---- 216.0–220.4：页眉打上生成时间与条数 ---- */
    B(fr, t, 216.0, 220.7, () => {
      fr.g({ at: [960, 560] }, () => {
        fr.rect(-360, -230, 720, 460, { fill: '#e4e4d8' });
        fr.rect(-360, -230, 720, 74, { fill: '#d6d8cc' });
        fr.text('阶段摘要 · 历史草稿', -330, -180, { font: 'serifm', size: 22, color: P.ink, align: 'l' });
        const hk = ss(t, 216.4, 217.4);
        fr.text('生成 10-17 09:26 · 输入 37 条 · 当前 63 条', -330, -122, { font: 'mono', size: 15, track: 1, color: '#8a5f1c', align: 'l', a: hk });
        fr.text('…PR #9 仍未合并…', -330, -40, { font: 'type', size: 22, color: '#22333d', align: 'l' });
        fr.rect(-340, -70, 340, 52, { color: P.rose, w: 1.8, a: .8 });
        fr.text('读的人自己判断：这句话来自旧输入', -330, 60, { font: 'sansr', size: 18, color: '#3f5c6b', align: 'l', a: ss(t, 217.6, 218.6) });
      });
    }, .5, .5);

    /* ---- 220.4–224.6：旧快照冻结 vs 新页 ---- */
    B(fr, t, 220.4, 225.0, () => {
      fr.g({ at: [600, 560] }, () => {
        fr.rect(-280, -290, 560, 580, { color: '#7fa2b2', w: 2.4, a: .75, r: 8 });
        fr.rect(-262, -272, 524, 544, { fill: '#dfe1d7', a: .93 });
        fr.text('旧快照 · 已冻结', 0, -226, { font: 'mono', size: 13, track: 3, color: '#5d7480' });
        for (let i = 0; i < 9; i++) fr.rect(-226, -170 + i * 40, 260 + ((i * 61) % 180), 6, { fill: '#9fb0ab', a: .5 });
        fr.g({ at: [0, 220], rot: -.05 }, () => { fr.rect(-96, -22, 192, 44, { color: '#8a5f1c', w: 2, r: 2 }); fr.text('原文保留', 0, 0, { font: 'serif', size: 17, track: 3, color: '#8a5f1c' }); });
      });
      const nk = ss(t, 222.0, 223.0);
      fr.g({ at: [1340, 560], a: nk }, () => {
        fr.rect(-280, -290, 560, 580, { fill: '#e6e6da' });
        fr.text('新证据 · 另起一行', 0, -226, { font: 'mono', size: 13, track: 3, color: '#5d7480' });
        for (let i = 0; i < 9; i++) fr.rect(-226, -170 + i * 40, 220 + ((i * 83) % 170), 6, { fill: '#8fa6a2', a: .55 });
        fr.text('当前 63 条', 0, 220, { font: 'mono', size: 15, track: 2, color: '#4f6b78' });
      });
    }, .5, .5);

    /* ---- 224.6–228.8：老师打开链接，看不到草稿 ---- */
    B(fr, t, 224.6, 229.1, () => {
      WS.door(fr, 520, 400, 240, 440, 1, { open: ss(t, 225.0, 226.0) > .5, ticket: 'LINK 04F2', ticketK: 1 });
      fr.g({ at: [410, 690], a: ss(t, 225.0, 225.8) }, () => {
        fr.circle(0, -74, 30, { fill: '#1c232a' });
        fr.path('M-52,80 C-52,10 52,10 52,80 Z', { fill: '#1c232a' });
        fr.text('老师 · 未登录', 0, 120, { font: 'mono', size: 13, track: 2, color: '#8d9fa8' });
      });
      fr.g({ at: [1230, 580], a: ss(t, 225.8, 226.6) }, () => {
        fr.rect(-290, -180, 580, 360, { fill: '#dfe1d7', a: .88 });
        for (let i = 0; i < 7; i++) fr.rect(-250, -130 + i * 40, 240 + ((i * 71) % 180), 5, { fill: '#9fb0ab', a: .5 });
        fr.rect(-290, -180, 580, 360, { fill: '#0a1116', a: .58 });
        fr.text('草稿不可见', 0, 0, { font: 'serifm', size: 24, track: 5, color: '#b9c7cc' });
        fr.text('教师只读 · 只含已确认内容', 0, 220, { font: 'mono', size: 13, track: 2, color: '#8d9fa8' });
      });
    }, .5, .5);

    /* ---- 228.8–233.2：撤销之后空白 ---- */
    B(fr, t, 228.8, 233.5, () => {
      const rev = ss(t, 229.2, 230.4);
      fr.g({ at: [800, 560] }, () => {
        fr.rect(-300, -240, 600, 480, { fill: '#0a0f14' });
        fr.rect(-300, -240, 600, 480, { color: '#4d3d29', w: 2.4 });
        fr.text('LINK 04F2', 0, -30, { font: 'mono', size: 26, track: 4, color: rev > .6 ? '#3a4d57' : '#e3e0d2' });
        fr.text(rev > .6 ? '404 · 链接已撤销' : '教师只读快照', 0, 30, { font: 'mono', size: 16, track: 2, color: rev > .6 ? '#c78b9a' : '#8d9fa8' });
      });
      // 票被取走
      if (rev > 0) fr.g({ at: [1080, 400 - 140 * rev], rot: -.3 * rev, a: 1 - ss(t, 231.0, 231.8) }, () => {
        fr.rect(-60, -26, 120, 52, { fill: '#e3e0d2' });
        fr.text('LINK 04F2', 0, 0, { font: 'mono', size: 13, color: '#3a4d57' });
        fr.line(-60, -4, 60, -4, { w: 2, color: P.rose, dash: [7, 5] });
      });
      fr.text('同一地址 · 什么都不返回', 800, 900, { font: 'mono', size: 14, track: 3, color: '#c78b9a', a: ss(t, 230.0, 230.8) });
    }, .5, .5);

    /* ---- 233.2–237.6：114 项测试 / 8 项回归 ---- */
    B(fr, t, 233.2, 237.9, () => {
      for (let i = 0; i < 114; i++) {
        const k = ss(t, 233.6 + i * .019, 233.95 + i * .019);
        if (k <= 0) continue;
        const col = i % 24, row = Math.floor(i / 24);
        fr.circle(520 + col * 38, 320 + row * 36, 8, { fill: '#cfe0e4', a: .92 * k });
      }
      fr.text('114 项测试', 520, 600, { font: 'mono', size: 16, track: 3, color: '#d5e0e3', align: 'l', a: ss(t, 234.6, 235.2) });
      for (let i = 0; i < 8; i++) {
        const k = ss(t, 235.2 + i * .09, 235.6 + i * .09);
        if (k <= 0) continue;
        fr.rect(520 + i * 58, 640, 46, 46, { r: 5, fill: i % 2 ? '#a9823f' : '#8d6b33', a: k });
      }
      fr.text('8 项隔离生产 HTTP 回归', 520, 730, { font: 'mono', size: 16, track: 2, color: '#d5c39a', align: 'l', a: ss(t, 235.6, 236.2) });
      fr.text('15 个测试文件 · lint · production build', 520, 780, { font: 'mono', size: 13, track: 1, color: '#8d9fa8', align: 'l', a: ss(t, 236.0, 236.6) });
    }, .5, .5);

    /* ---- 237.6–241.8：37 次云端检查，2 次失败 ---- */
    B(fr, t, 237.6, 242.1, () => {
      for (let i = 0; i < 37; i++) {
        const k = ss(t, 238.0 + i * .045, 238.4 + i * .045);
        if (k <= 0) continue;
        const col = i % 13, row = Math.floor(i / 13);
        fr.circle(560 + col * 62, 330 + row * 62, 17, { fill: '#1f4a58', color: '#7fc4d4', w: 1.4, a: k });
      }
      [[9, 1], [2, 2]].forEach(([c, r], i) => {
        const k = ss(t, 239.0 + i * .35, 239.5 + i * .35);
        if (k <= 0) return;
        fr.circle(560 + c * 62, 330 + r * 62, 17, { fill: '#5c1e2c', color: P.rose, w: 2, a: k });
        fr.text('×', 560 + c * 62, 330 + r * 62, { font: 'mono', size: 18, color: '#ffd3dd', a: k });
      });
      fr.text('37 次云端检查 · 2 次失败', 560, 560, { font: 'mono', size: 16, track: 2, color: '#d5e0e3', align: 'l', a: ss(t, 239.0, 239.6) });
    }, .5, .5);

    /* ---- 241.8–246.0：失败 → 修复 → 通过 ---- */
    B(fr, t, 241.8, 246.3, () => {
      fr.g({ at: [960, 520] }, () => {
        fr.text('CI · feat/course-delivery-kit', -260, -190, { font: 'mono', size: 14, track: 2, color: '#8d9fa8', align: 'l' });
        const reds = [['39007953966', 'failure'], ['39007956639', 'failure']];
        reds.forEach((r, i) => {
          fr.g({ at: [0, -110 + i * 96], a: .95 }, () => {
            fr.rect(-320, -34, 640, 68, { r: 4, fill: '#1a1014' });
            fr.circle(-286, 0, 12, { fill: '#5c1e2c', color: P.rose, w: 1.6 });
            fr.text(r[0], -258, 0, { font: 'mono', size: 14, color: '#cbb7bc', align: 'l' });
            fr.text(r[1], 300, 0, { font: 'mono', size: 13, color: '#c78b9a', align: 'r' });
          });
        });
        const fix = ss(t, 242.8, 243.8);
        fr.g({ at: [0, 96], a: fix }, () => {
          fr.rect(-320, -34, 640, 68, { r: 4, fill: '#0f1a14' });
          fr.circle(-286, 0, 12, { fill: '#1f3a28', color: '#6dbf8a', w: 1.6 });
          fr.poly([[-292, 0], [-287, 6], [-278, -7]], { color: '#8fdcaa', w: 2.2 });
          fr.text('0d72322 · 修复路径解析', -258, 0, { font: 'mono', size: 14, color: '#bcd8c4', align: 'l' });
          fr.text('success', 300, 0, { font: 'mono', size: 13, color: '#8fdcaa', align: 'r' });
        });
        fr.text('失败停在准备脚本的输出路径检查', -320, 190, { font: 'mono', size: 13, track: 1, color: '#8d9fa8', align: 'l', a: ss(t, 243.4, 244.0) });
      });
    }, .5, .5);

    /* ---- 246.0–250.0：链接钉 ---- */
    B(fr, t, 246.0, 250.5, () => {
      const rows = [['actions/runs/39008267161', 'Canvas film source checks'], ['pull/4', 'PR #4 · 1 check passed'], ['issues/3', 'Issue #3 · CLOSED']];
      rows.forEach((r, i) => {
        const k = ss(t, 246.4 + i * .5, 247.1 + i * .5);
        if (k <= 0) return;
        fr.g({ at: [960, 400 + i * 120], a: k }, () => {
          fr.circle(-380, 0, 8, { color: P.ice, w: 1.6 });
          fr.circle(-380, 0, 3.2, { fill: P.ice });
          fr.line(-362, 0, -330, 0, { w: 1, color: P.ice, a: .6, cap: 'butt' });
          fr.text(r[0], -318, 0, { font: 'mono', size: 22, track: 1, color: '#dbe7e9', align: 'l' });
          fr.text(r[1], 380, 0, { font: 'mono', size: 13, track: 1, color: '#8d9fa8', align: 'r' });
        });
      });
      fr.text('每一个数字都有出处', 960, 800, { font: 'mono', size: 14, track: 3, color: '#9fb6c8', a: ss(t, 248.0, 248.8) });
    }, .5, .5);

    /* ---- 250–262：无字幕，回扣：册页合上 ---- */
    B(fr, t, 250.0, 262.4, () => {
      fr.g({ at: [960, 560] }, () => {
        fr.rect(-440, -280, 880, 560, { fill: '#173743' });
        fr.rect(-426, -266, 852, 532, { color: '#2c5567', w: 1.2, a: .45 });
        fr.text('开发的来路', 0, -60, { font: 'serifl', size: 64, track: 14, color: '#cfe0e4' });
        fr.text('实验页 · 2026-10-17 · 真实记录', 0, 60, { font: 'mono', size: 16, track: 3, color: '#7fa2b2' });
        fr.rect(430, -40, 22, 80, { fill: '#a68753' });
      });
    }, 1.0, 1.2);
  });
}
G.CH = G.CH || {};
G.CH.lab = lab;
})(window);
