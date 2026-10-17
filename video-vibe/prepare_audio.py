"""Local-only requested BGM excerpt. No online lookup, vocals, or paid services."""
import argparse
import io
import json
from pathlib import Path
import subprocess
import wave
import numpy as np
from scipy.signal import find_peaks

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("--ffmpeg", required=True)
args = parser.parse_args()
report = args.output.with_suffix(".json")
if args.output.exists() or report.exists():
    raise FileExistsError("Audio output exists; choose a new filename")
rate = 48000
pcm = subprocess.run([args.ffmpeg, "-v", "error", "-i", str(args.source), "-t", "30",
    "-f", "wav", "-acodec", "pcm_s16le", "-ar", str(rate), "-ac", "2", "-"],
    check=True, stdout=subprocess.PIPE).stdout
with wave.open(io.BytesIO(pcm), "rb") as decoded:
    audio = np.frombuffer(decoded.readframes(rate*30), dtype="<i2").reshape(-1, 2).astype(np.float32)/32768
if len(audio) != rate * 30 or not np.isfinite(audio).all():
    raise ValueError("Expected 30 seconds of finite stereo audio")
# Rhythm estimate is diagnostic, not an asserted ground-truth tempo.
mono = audio.mean(axis=1)
hop = 480
energy = np.sqrt(np.mean(mono[:len(mono)//hop*hop].reshape(-1, hop)**2, axis=1))
onset = np.maximum(0, np.diff(energy, prepend=energy[0]))
onset -= onset.mean()
ac = np.correlate(onset, onset, mode="full")[len(onset)-1:]
lo, hi = round(6000/180), round(6000/70)
peaks, _ = find_peaks(ac[lo:hi+1])
lags = sorted((p+lo for p in peaks), key=lambda p: ac[p], reverse=True)[:3]
fade_in = np.minimum(1, np.arange(len(audio)) / (rate*.5))
fade_out = np.minimum(1, (len(audio)-1-np.arange(len(audio))) / (rate*1.25))
audio *= (fade_in * fade_out * 10**(-8/20))[:, None]
peak = float(np.max(np.abs(audio)))
if peak >= .999: raise ValueError("Clipping risk")
args.output.parent.mkdir(parents=True, exist_ok=True)
with args.output.open("xb") as output:
    with wave.open(output, "wb") as wav:
        wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(rate)
        wav.writeframes(np.rint(audio * 32767).astype("<i2").tobytes())
stats = {"seconds": len(audio)/rate, "sampleRate": rate, "channels": 2,
    "gainDb": -8, "peakDbFS": round(20*np.log10(max(peak, 1e-12)), 2),
    "fadeInSeconds": .5, "fadeOutSeconds": 1.25,
    "tempoCandidatesBpm": [round(6000/p, 2) for p in lags],
    "tempoStatus": "onset-autocorrelation estimate only; not manually auditioned",
    "sourceStartSeconds": 0, "redistributionPermission": "not_reviewed"}
with report.open("x", encoding="utf-8") as output:
    json.dump(stats, output, ensure_ascii=False, indent=2)
print(json.dumps(stats, ensure_ascii=False))
