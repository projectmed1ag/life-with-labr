import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import sharp from 'sharp';

const [source, ffmpeg = 'ffmpeg'] = process.argv.slice(2);
if (!source) throw Error('Usage: node animation/export-menu-watercolor.mjs source.mp4 [ffmpeg]');
const run = args => {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`FFmpeg exited with ${result.status}`);
};
mkdirSync('.work/menu-watercolor', {recursive:true});
// Match the original ComfyUI compositing canvas, which trims transparent
// margins on the right and bottom before resizing to the video dimensions.
const still = sharp('animation/source-menu-watercolor-v1.png')
  .extract({left:0, top:0, width:1360, height:1136}).resize(768,640,{fit:'fill'});
await still.clone().webp({quality:88,alphaQuality:100}).toFile('dist/assets/menu-watercolor-still-v1.webp');
await still.clone().flatten({background:'#172b24'}).png().toFile('.work/menu-watercolor/plate.png');

// Keep the actual calligraphy from the original artwork. The generated dogs
// move above it; a short feather through the grass joins the two plates.
const frozen = '.work/menu-watercolor/frozen-wordmark.mkv';
run(['-i',source,'-loop','1','-i','.work/menu-watercolor/plate.png',
  '-filter_complex',
  "[0:v]trim=end_frame=193,setpts=N/(24*TB),format=gbrp[animated];"+
  "[1:v]format=gbrp[still];"+
  "[animated][still]blend=all_expr='A*clip((466-Y)/36,0,1)+B*(1-clip((466-Y)/36,0,1))':shortest=1[out]",
  '-map','[out]','-an','-c:v','ffv1','-r','24','-frames:v','193',frozen]);
// Exactly one adjacent frame separates both reversals and the wrap. No
// duplicated endpoints, inserted holds, crossfaded faces or speed changes.
run(['-i',frozen,'-filter_complex',
  '[0:v]split=2[f][r];[r]trim=start_frame=1:end_frame=192,reverse,setpts=N/(24*TB)[b];'+
  '[f][b]concat=n=2:v=1:a=0,settb=1/24,setpts=N,format=yuv420p[out]',
  '-map','[out]','-an','-map_metadata','-1','-r','24','-fps_mode','cfr',
  '-c:v','libx264','-preset','slow','-crf','19','-bf','0','-g','24','-keyint_min','24','-sc_threshold','0',
  '-movflags','+faststart','dist/assets/menu-watercolor-loop-v1.mp4']);
console.log('Exported 768 × 640 watercolor loop: 384 frames at 24 fps, fixed wordmark.');
