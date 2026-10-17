export function readPcmWav(buffer) {
  if (
    buffer.length < 12 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("Expected a RIFF WAVE file");
  }
  const limit = buffer.readUInt32LE(4) + 8;
  if (limit !== buffer.length) throw new Error("Invalid RIFF length");
  let format;
  const chunks = [];
  for (let offset = 12; offset < limit; ) {
    if (offset + 8 > limit) throw new Error("Truncated chunk header");
    const kind = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const end = offset + 8 + size;
    if (end + (size % 2) > limit) throw new Error("Truncated chunk data");
    if (kind === "fmt ") {
      if (format || size < 16) throw new Error("Invalid format chunk");
      format = {
        encoding: buffer.readUInt16LE(offset + 8),
        channels: buffer.readUInt16LE(offset + 10),
        sampleRate: buffer.readUInt32LE(offset + 12),
        byteRate: buffer.readUInt32LE(offset + 16),
        blockAlign: buffer.readUInt16LE(offset + 20),
        bitsPerSample: buffer.readUInt16LE(offset + 22),
      };
    }
    if (kind === "data") chunks.push(buffer.subarray(offset + 8, end));
    offset = end + (size % 2);
  }
  if (
    !format ||
    format.encoding !== 1 ||
    format.channels !== 1 ||
    format.bitsPerSample !== 16 ||
    format.blockAlign !== 2 ||
    format.sampleRate < 8000 ||
    format.byteRate !== format.sampleRate * 2 ||
    !chunks.length
  ) {
    throw new Error("Expected 16-bit mono PCM with a valid sample rate");
  }
  const pcm = Buffer.concat(chunks);
  if (!pcm.length || pcm.length % format.blockAlign)
    throw new Error("Invalid PCM payload");
  let peak = 0;
  let energy = 0;
  for (let offset = 0; offset < pcm.length; offset += 2) {
    const sample = pcm.readInt16LE(offset) / 32768;
    peak = Math.max(peak, Math.abs(sample));
    energy += sample * sample;
  }
  return {
    ...format,
    pcm,
    durationMs: (pcm.length / format.byteRate) * 1000,
    peak,
    rms: Math.sqrt(energy / (pcm.length / 2)),
  };
}

export function encodePcmWav(pcm, sampleRate) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
