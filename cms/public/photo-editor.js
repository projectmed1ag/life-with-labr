import {photoCrop,photoOutput} from './photo-geometry.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=path=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="${path}"/></svg>`;

// The preview and exported image use the same source rectangle and rotation.
function paint(canvas,img,state,grid=false){
  const crop=photoCrop(img.naturalWidth,img.naturalHeight,state);
  const size=photoOutput(crop,grid?900:2400);
  canvas.width=size.width;canvas.height=size.height;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#f4f1e9';ctx.fillRect(0,0,size.width,size.height);
  ctx.save();ctx.scale(size.width/crop.width,size.height/crop.height);
  ctx.translate(-crop.x,-crop.y);
  ctx.translate(crop.sourceWidth/2,crop.sourceHeight/2);ctx.rotate(state.turns*Math.PI/2);
  ctx.drawImage(img,-img.naturalWidth/2,-img.naturalHeight/2);ctx.restore();
  if(grid){
    ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1;
    ctx.beginPath();for(const fraction of [1/3,2/3]){ctx.moveTo(size.width*fraction,0);ctx.lineTo(size.width*fraction,size.height);ctx.moveTo(0,size.height*fraction);ctx.lineTo(size.width,size.height*fraction);}ctx.stroke();
  }
  return crop;
}

export async function preparePhoto(file,{kind='gallery',index=1,total=1,editing=false}={}){
  if(file.size>12*1024*1024)throw new Error('Фото больше 12 МБ. Выберите файл поменьше.');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Выберите фото JPG, PNG или WebP.');
  const url=URL.createObjectURL(file),img=new Image();img.src=url;
  try{await img.decode();}catch{URL.revokeObjectURL(url);throw new Error('Не удалось открыть фото. Выберите другой файл JPG, PNG или WebP.');}
  if(img.naturalWidth*img.naturalHeight>40_000_000){URL.revokeObjectURL(url);throw new Error('Фото больше 40 мегапикселей. Уменьшите его и загрузите снова.');}
  return new Promise((resolve,reject)=>{
    const initialRatio=kind==='puppy'?.75:kind==='parent'?1.5:0;
    const state={ratio:initialRatio,zoom:1,x:.5,y:.5,turns:0};
    const dialog=document.createElement('dialog');dialog.className='photo-dialog';
    dialog.setAttribute('aria-labelledby','photo-editor-title');
    const purpose=kind==='puppy'?'Карточка щенка · 3:4':kind==='parent'?'Карточка родителя · 3:2':'Фото в галерее';
    dialog.innerHTML=`<header class="photo-dialog-header"><div><h2 id="photo-editor-title">${editing?'Кадр и предпросмотр':'Подготовить фото'}</h2><p>${purpose}${total>1?` · ${index} из ${total}`:''}</p></div><button type="button" class="quiet photo-dialog-close" aria-label="Отменить обработку фото">${icon('m6 6 12 12M18 6 6 18')}</button></header>
      <div class="photo-dialog-body"><div class="photo-stage"><canvas tabindex="0" role="img" aria-label="Предпросмотр кадра. Перемещайте фото мышью, пальцем или стрелками клавиатуры."></canvas><p>Переместите фото, чтобы выбрать кадр.</p></div>
      <div class="photo-settings"><p class="photo-file-name">${escape(file.name||'Фотография')}</p><p class="photo-original-size">Исходное фото: ${img.naturalWidth} × ${img.naturalHeight} px</p>
      ${kind==='gallery'?'<label>Формат<select data-photo-ratio><option value="0">Исходные пропорции</option><option value="0.75">Вертикальный · 3:4</option><option value="1.5">Горизонтальный · 3:2</option><option value="1">Квадрат · 1:1</option></select></label><p class="photo-format-note">Исходные пропорции и масштаб 100% сохранят фото целиком.</p>':`<p class="photo-format-note">${kind==='puppy'?'Вертикальная рамка для щенка.':'Горизонтальная рамка для родителя.'} В рамке видна область, которая сохранится на сайте.</p>`}
      <label class="photo-zoom-label">Масштаб <output>100%</output><input type="range" min="1" max="3" step="0.01" value="1" aria-label="Масштаб фото"></label>
      <div class="photo-adjustments"><button type="button" data-photo-rotate>${icon('M3 10a9 9 0 1 1 2 8M3 4v6h6')}Повернуть</button><button type="button" data-photo-reset>Сбросить</button></div>
      <p class="photo-result-size" aria-live="polite"></p><p class="photo-quality" role="status"></p><p class="photo-save-note">Фото автоматически уменьшим до 2400 px по длинной стороне, без растяжения.</p><p class="photo-error" role="alert"></p></div></div>
      <footer class="photo-dialog-footer"><button type="button" data-photo-cancel>Отмена</button>${total>1?'<button type="button" class="quiet" data-photo-skip>Пропустить</button>':''}<button type="button" class="primary" data-photo-accept>${editing?'Применить кадр':'Добавить фото'}</button></footer>`;
    document.body.append(dialog);
    const canvas=dialog.querySelector('canvas'),zoom=dialog.querySelector('input[type=range]'),format=dialog.querySelector('[data-photo-ratio]');
    let result=null,exporting=false,drag=null;
    const render=()=>{
      const crop=paint(canvas,img,state,true),out=photoOutput(crop);
      canvas.style.aspectRatio=String(crop.width/crop.height);
      dialog.querySelector('output').textContent=Math.round(state.zoom*100)+'%';
      dialog.querySelector('.photo-result-size').textContent=`На сайте: ${out.width} × ${out.height} px`;
      dialog.querySelector('.photo-quality').textContent=Math.min(crop.width,crop.height)<800?'Кадр небольшой: на большом экране фото может быть нечётким. Уменьшите масштаб или выберите фото крупнее.':'';
      dialog.querySelector('.photo-error').textContent='';
    };
    const reset=()=>{Object.assign(state,{zoom:1,x:.5,y:.5});zoom.value='1';};
    zoom.addEventListener('input',()=>{state.zoom=Number(zoom.value);render();});
    format?.addEventListener('change',()=>{state.ratio=Number(format.value);reset();render();});
    dialog.querySelector('[data-photo-rotate]').addEventListener('click',()=>{state.turns=(state.turns+1)%4;reset();render();});
    dialog.querySelector('[data-photo-reset]').addEventListener('click',()=>{Object.assign(state,{ratio:initialRatio,turns:0});if(format)format.value=String(initialRatio);reset();render();});
    canvas.addEventListener('pointerdown',event=>{if(exporting)return;drag={clientX:event.clientX,clientY:event.clientY,x:state.x,y:state.y};canvas.setPointerCapture(event.pointerId);canvas.focus();});
    canvas.addEventListener('pointermove',event=>{
      if(!drag)return;const crop=photoCrop(img.naturalWidth,img.naturalHeight,state),bounds=canvas.getBoundingClientRect();
      const spanX=crop.sourceWidth-crop.width,spanY=crop.sourceHeight-crop.height;
      state.x=Math.max(0,Math.min(1,drag.x-(spanX>0?(event.clientX-drag.clientX)/bounds.width*crop.width/spanX:0)));
      state.y=Math.max(0,Math.min(1,drag.y-(spanY>0?(event.clientY-drag.clientY)/bounds.height*crop.height/spanY:0)));render();
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
    canvas.addEventListener('keydown',event=>{
      const delta=event.shiftKey?.01:.05;
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||exporting)return;
      event.preventDefault();if(event.key==='ArrowLeft')state.x+=delta;if(event.key==='ArrowRight')state.x-=delta;if(event.key==='ArrowUp')state.y+=delta;if(event.key==='ArrowDown')state.y-=delta;
      state.x=Math.max(0,Math.min(1,state.x));state.y=Math.max(0,Math.min(1,state.y));render();
    });
    dialog.querySelector('[data-photo-cancel]').onclick=dialog.querySelector('.photo-dialog-close').onclick=()=>{if(!exporting)dialog.close();};
    const skip=dialog.querySelector('[data-photo-skip]');if(skip)skip.onclick=()=>{result={skip:true};dialog.close();};
    dialog.addEventListener('cancel',event=>{if(exporting)event.preventDefault();});
    dialog.querySelector('[data-photo-accept]').addEventListener('click',async()=>{
      if(exporting)return;exporting=true;dialog.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);
      const accept=dialog.querySelector('[data-photo-accept]');accept.textContent='Обрабатываем фото…';
      try{
        const output=document.createElement('canvas');paint(output,img,state);
        const blob=await new Promise(resolve=>output.toBlob(resolve,'image/webp',.92));output.width=output.height=0;
        if(!blob)throw new Error('Не удалось обработать фото. Попробуйте ещё раз.');
        result={blob};dialog.close();
      }catch(error){dialog.querySelector('.photo-error').textContent=error.message;dialog.querySelectorAll('button,input,select').forEach(el=>el.disabled=false);accept.textContent=editing?'Применить кадр':'Добавить фото';exporting=false;}
    });
    dialog.addEventListener('close',()=>{canvas.width=canvas.height=0;URL.revokeObjectURL(url);dialog.remove();resolve(result);},{once:true});
    try{render();dialog.showModal();}catch(error){URL.revokeObjectURL(url);dialog.remove();reject(error);}
  });
}
