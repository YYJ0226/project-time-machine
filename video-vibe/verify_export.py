"""Decode/count video frames and record local artifact proof, not human playback QA."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

p = argparse.ArgumentParser()
p.add_argument('movie', type=Path)
p.add_argument('--ffprobe', required=True)
a = p.parse_args()
proof = a.movie.with_suffix('.qa.json')
if proof.exists(): raise FileExistsError('Do not overwrite an existing proof')
result = subprocess.run([a.ffprobe, '-v', 'error', '-count_frames', '-show_streams',
    '-show_format', '-of', 'json', str(a.movie)], check=True, capture_output=True, text=True)
data = json.loads(result.stdout)
video = [s for s in data['streams'] if s['codec_type']=='video']
audio = [s for s in data['streams'] if s['codec_type']=='audio']
assert len(video)==len(audio)==1
v, au = video[0], audio[0]
assert (v['codec_name'], v['width'], v['height'], v['r_frame_rate'], int(v['nb_read_frames'])) == ('h264',1920,1080,'30/1',9000)
assert v['pix_fmt']=='yuv420p' and abs(float(v['duration'])-300)<.01
assert au['codec_name']=='aac' and au['sample_rate']=='48000' and au['channels']==2
assert abs(float(au['duration'])-300)<.15
data['sha256'] = hashlib.file_digest(a.movie.open('rb'), 'sha256').hexdigest()
data['humanAudition'] = 'pending user acceptance'
data['publicMusicRights'] = 'not_reviewed'
with proof.open('x',encoding='utf-8') as output:
    json.dump(data,output,ensure_ascii=False,indent=2)
print('PASS: 9000 decoded frames, H.264 1080p/30fps, AAC stereo 48kHz, 300 seconds; SHA256',data['sha256'])
