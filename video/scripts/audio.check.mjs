import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { readPcmWav, encodePcmWav } from "./wav-info.mjs";
import ts from "typescript";

test("PCM round trip reports exact duration and signal level", () => {
  const pcm = Buffer.alloc(32000);
  pcm.writeInt16LE(16384, 0);
  const wav = readPcmWav(encodePcmWav(pcm, 16000));
  assert.equal(wav.durationMs, 1000);
  assert.equal(wav.peak, 0.5);
  assert.ok(wav.rms > 0);
});

test("rejects invalid header", () =>
  assert.throws(() => readPcmWav(Buffer.alloc(20)), /RIFF/));
test("rejects truncated data", () =>
  assert.throws(
    () => readPcmWav(encodePcmWav(Buffer.alloc(16), 16000).subarray(0, 59)),
    /length/,
  ));
test("rejects invalid PCM format", () => {
  const wav = encodePcmWav(Buffer.alloc(16), 16000);
  wav.writeUInt16LE(3, 20);
  assert.throws(() => readPcmWav(wav), /PCM/);
});
test("rejects zero-byte audio", () =>
  assert.throws(
    () => readPcmWav(encodePcmWav(Buffer.alloc(0), 16000)),
    /payload/,
  ));

test("scratch narration and captions match measured WAV assets", () => {
  const folder = new URL("../public/audio/offline-v2/", import.meta.url);
  const metadata = JSON.parse(
    readFileSync(new URL("timing.json", folder), "utf8"),
  );
  const bytes = readFileSync(new URL("opening.wav", folder));
  const full = readPcmWav(bytes);
  assert.equal(full.durationMs, 15000);
  assert.equal(metadata.durationMs, full.durationMs);
  assert.equal(
    metadata.sha256,
    createHash("sha256").update(bytes).digest("hex"),
  );
  assert.equal(metadata.finalVoiceAccepted, false);
  assert.ok(
    full.rms > 0.01 && full.peak < 1,
    "non-silent and no full-scale samples",
  );
  assert.equal(metadata.segments.length, 3);
  for (const [index, caption] of metadata.segments.entries()) {
    const source = readPcmWav(
      readFileSync(new URL(`phrase-0${index + 1}.wav`, folder)),
    );
    assert.ok(
      Math.abs(caption.endMs - caption.startMs - source.durationMs) < 0.001,
    );
    assert.ok(caption.startMs >= (metadata.segments[index - 1]?.endMs ?? 0));
    assert.ok(caption.endMs < 15000);
    const start = Math.round((caption.startMs * full.sampleRate) / 1000) * 2;
    assert.deepEqual(
      full.pcm.subarray(start, start + source.pcm.length),
      source.pcm,
    );
  }
});

test("inline Studio captions match the current no-narration visual script", () => {
  const text = readFileSync(
    new URL("../src/Composition.tsx", import.meta.url),
    "utf8",
  );
  const source = ts.createSourceFile(
    "Composition.tsx",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let captions;
  const visit = (node) => {
    if (
      ts.isJsxSelfClosingElement(node) &&
      node.tagName.getText(source) === "BasicCaptions"
    ) {
      const attribute = node.attributes.properties.find(
        (prop) =>
          ts.isJsxAttribute(prop) && prop.name.getText(source) === "captions",
      );
      const array = attribute?.initializer?.expression;
      assert.ok(
        array && ts.isArrayLiteralExpression(array),
        "captions must remain an inline editable array",
      );
      captions = array.elements.map((entry) =>
        Object.fromEntries(
          entry.properties.map((property) => {
            const value = property.initializer;
            return [
              property.name.getText(source),
              ts.isStringLiteral(value)
                ? value.text
                : ts.isNumericLiteral(value)
                  ? Number(value.text)
                  : value.kind === ts.SyntaxKind.TrueKeyword
                    ? true
                    : null,
            ];
          }),
        ),
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  const visualCopy = JSON.parse(
    readFileSync(new URL("../visual-copy.json", import.meta.url), "utf8"),
  );
  assert.equal(captions?.length, 3);
  for (const [index, caption] of captions.entries()) {
    assert.equal(caption.text, visualCopy.segments[index].text);
    assert.equal(caption.startMs, visualCopy.segments[index].startMs);
    assert.equal(caption.endMs, visualCopy.segments[index].endMs);
    assert.ok(caption.endMs - caption.startMs >= 3000);
    assert.ok(caption.endMs <= 15000);
  }
});

test("original music has the expected duration, provenance, headroom and fades", () => {
  const folder = new URL("../public/audio/music-v1/", import.meta.url);
  const bytes = readFileSync(new URL("evidence-pulse.wav", folder));
  const metadata = JSON.parse(
    readFileSync(new URL("provenance.json", folder), "utf8"),
  );
  const wav = readPcmWav(bytes);
  assert.equal(wav.durationMs, 15000);
  assert.equal(metadata.bpm, 128);
  assert.equal((metadata.beats * 60) / metadata.bpm, 15);
  assert.equal(
    metadata.sha256,
    createHash("sha256").update(bytes).digest("hex"),
  );
  assert.equal(metadata.samplesUsed, false);
  assert.equal(metadata.paidCalls, 0);
  assert.ok(wav.peak > 0.5 && wav.peak < 0.6);
  assert.ok(wav.rms > 0.01);
  assert.equal(wav.pcm.readInt16LE(0), 0);
  assert.ok(Math.abs(wav.pcm.readInt16LE(wav.pcm.length - 2)) <= 2);
});

test("active composition plays music only, not retired narration", () => {
  const source = readFileSync(
    new URL("../src/Composition.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /audio\/music-v1\/evidence-pulse\.wav/);
  assert.doesNotMatch(source, /audio\/offline-v[0-9]+\//);
  assert.match(source, /无口播/);
});
