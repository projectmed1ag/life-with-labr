import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const source = process.argv[2];
const ffmpeg = process.argv[3] || 'ffmpeg';
if (!source) throw new Error('Usage: node animation/export-puppy-ball.mjs input.mp4 [ffmpeg]');
const output = name => resolve('dist/assets', name);
const run = args => {
  const result = spawnSync(ffmpeg, ['-hide_banner','-loglevel','error','-y',...args], {stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`FFmpeg exited with ${result.status}`);
};

// Blend the matching calm poses, then rotate the timeline past the overlap.
// Upright play always runs forward; the ball never rewinds.
const key = 'colorkey=0x00FF00:0.34:0.10,despill=type=green:mix=0.7,crop=624:416:56:16,scale=480:320';
const loop = '[0:v]trim=end_frame=145,fps=24,settb=AVTB,split=2[main][head];'
  + '[head]trim=end_frame=13,setpts=PTS-STARTPTS,fps=24,settb=AVTB[opening];'
  + '[main][opening]xfade=transition=fade:duration=0.5:offset=5.5,'
  + `trim=start_frame=13:end_frame=145,setpts=PTS-STARTPTS,${key},format=rgba[out]`;
run(['-i',source,'-filter_complex',loop,'-map','[out]','-an',
  '-c:v','libwebp_anim','-q:v','78','-loop','0',output('puppy-ball-v3.webp')]);
// Extract the actual opening frame, so loading/reduced-motion uses the same pose.
run(['-i',source,'-filter_complex',loop,'-map','[out]','-frames:v','1',
  '-c:v','libwebp','-quality','90',output('puppy-ball-still-v2.webp')]);
console.log('Exported transparent puppy-ball-v3.webp and its still');
