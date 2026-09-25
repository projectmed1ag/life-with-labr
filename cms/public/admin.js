const app=document.querySelector('#app'),notice=document.querySelector('#notice');
let csrf='',records=[],section='litters',current=null,dirty=false,busy=false,archived=false,pendingEdit=null;
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=prefix=>prefix+'-'+crypto.randomUUID().slice(0,8);
const clone=value=>structuredClone(value);
const publicOrigin=location.hostname==='admin.lifewithlabr.ru'?'https://lifewithlabr.ru':location.origin;
const image=src=>'/assets/'+src;
let noticeTimer;
const say=(message,error=false)=>{clearTimeout(noticeTimer);notice.textContent=message;notice.className=error?'notice error':'notice';if(!error)noticeTimer=setTimeout(()=>notice.textContent='',5000);};
async function api(url,{method='GET',data,raw}={}){
  const headers={};if(data!==undefined)headers['Content-Type']='application/json';if(method!=='GET')headers['X-CSRF-Token']=csrf;
  const response=await fetch(url,{method,headers,body:raw|| (data===undefined?undefined:JSON.stringify(data)),credentials:'same-origin'});
  const result=await response.json();
  if(!response.ok){if(response.status===401&&url!=='/api/login'){if(current)pendingEdit=clone(current);current=null;dirty=false;login();}throw new Error(result.error||'Не удалось выполнить действие.');}return result;
}
function login(){app.innerHTML=`<main class="login"><a class="brand" href="${publicOrigin}" target="_blank" rel="noopener">Life with Labr</a><h1>Вход в админку</h1><p>Галерея, помёты и щенки питомника.</p><form id="login-form"><label>Логин<input name="username" autocomplete="username" required value="admin"></label><label>Пароль<input name="password" type="password" autocomplete="current-password" required></label><p id="login-error" class="error" role="alert"></p><button class="primary" type="submit">Войти</button></form></main>`;}
function chrome(content){app.innerHTML=`<header class="app-header"><a href="#" class="brand" data-action="home">Life with Labr</a><a href="${publicOrigin}" target="_blank" rel="noopener">Открыть сайт ↗</a><button data-action="logout" class="quiet">Выйти</button></header><div class="workspace"><aside><nav aria-label="Разделы админки"><button data-section="litters" ${section==='litters'?'aria-current="page"':''}>Помёты и щенки</button><button data-section="gallery" ${section==='gallery'?'aria-current="page"':''}>Галерея</button></nav><p>${section==='gallery'?'Добавляйте фото и меняйте их порядок. Затем сохраните изменения.':'Изменения на сайте появляются после публикации.'}</p></aside><main>${content}</main></div>`;}
const recordState=r=>r.archived?'В архиве':r.published?(r.dirty?'Есть изменения':'Опубликовано'):'Черновик';
function openGallery(){current=clone(records.find(r=>r.kind==='gallery'&&r.id==='gallery'));dirty=false;galleryEditor();}
function listing(){
  if(section==='gallery')return openGallery();
  current=null;dirty=false;const items=records.filter(r=>r.kind==='litters'&&r.archived===archived);
  chrome(`<div class="page-heading"><div><h1>Помёты и щенки</h1><p>Родители, фотографии малышей, цены и статусы.</p></div><button class="primary" data-action="new">Создать помёт</button></div><div class="list-toolbar"><label class="search-label">Поиск<input id="search" type="search" placeholder="Найти по названию"></label><button class="quiet" data-action="archive-list">${archived?'Показать текущие':'Архив'}</button></div><div class="record-list">${items.length?items.map(r=>{const cover=r.data.puppies[0]?.photos[0];return `<div class="record-row" data-search="${e(r.data.title.toLowerCase())}"><button class="record-open" data-edit="${e(r.id)}">${cover?`<img src="${image(cover.src)}" alt="" width="88" height="88">`:'<span class="record-empty">Нет фото</span>'}<span class="record-info"><strong>${e(r.data.title||'Без названия')}</strong><span>${r.data.puppies.length} щенков · ${e(r.data.parents.map(p=>p.name).filter(Boolean).join(' и '))}</span></span><span class="state ${r.published&&!r.dirty?'live':''}">${recordState(r)}</span><span aria-hidden="true">→</span></button>${r.published?`<button class="record-close" data-close-litter="${e(r.id)}">Все щенки нашли дом</button>`:''}</div>`;}).join(''):`<div class="empty"><h2>${archived?'Архив пуст':'Здесь пока ничего нет'}</h2><p>${archived?'Сюда попадают помёты, которые вы убрали с сайта.':'Создайте помёт, добавьте родителей и щенков.'}</p></div>`}</div>`);
}
const field=(label,key,value,type='text',extra='')=>`<label>${label}<input data-field="${key}" type="${type}" value="${e(value)}" ${extra}></label>`;
const area=(label,key,value,max=3000)=>`<label>${label}<textarea data-field="${key}" rows="3" maxlength="${max}">${e(value)}</textarea></label>`;
const select=(label,key,value,options)=>`<label>${label}<select data-field="${key}">${options.map(([v,label])=>`<option value="${v}"${String(value??'')===v?' selected':''}>${label}</option>`).join('')}</select></label>`;
function get(key){return key.split('.').reduce((value,k)=>value[k],current.data);}
function set(key,value){const keys=key.split('.'),last=keys.pop(),target=keys.reduce((v,k)=>v[k],current.data);target[last]=value;dirty=true;document.querySelector('#save-state').textContent='Есть несохранённые изменения';}
function photoEditor(key,photos,single=false){return `<div class="photo-editor"><div class="photo-list">${photos.map((photo,i)=>`<div class="photo-edit"><img src="${image(photo.src)}" width="160" height="120" alt="${e(photo.alt)}">${single?'':field('Описание фото',`${key}.${i}.alt`,photo.alt,'text','maxlength="300"')}<div class="photo-tools">${i?`<button type="button" class="quiet" data-move="${key}" data-index="${i}" aria-label="Переместить фото ${i+1} раньше">Раньше</button>`:''}<button type="button" class="quiet" data-remove-photo="${key}" data-index="${i}">Убрать</button></div></div>`).join('')}</div><label class="upload-label">${single&&photos.length?'Заменить фото':'Добавить фото'}<input type="file" data-upload="${key}" accept="image/jpeg,image/png,image/webp" ${single?'':'multiple'}></label><p class="help">JPG, PNG или WebP до 12 МБ. ${single?'':'Первое фото станет обложкой.'}</p></div>`;}
function parentEditor(parent,i){const key=`parents.${i}`;
  return `<section class="editor-section"><div class="section-title"><h2>${parent.role}</h2><button type="button" class="quiet" data-remove-parent="${i}">Убрать родителя</button></div><div class="two-columns">${field('Кличка',key+'.name',parent.name,'text','maxlength="120"')}${field('Питомник происхождения',key+'.kennel',parent.kennel,'text','maxlength="160"')}</div>${photoEditor(key+'.image',parent.image?[{src:parent.image,width:parent.width,height:parent.height,alt:parent.name}]:[],true)}${area('Достижения и описание',key+'.description',parent.description)}${area('Родословная',key+'.pedigree',parent.pedigree,5000)}<p class="help">Для Эдель и Енота сохраняется текущая родословная, если это поле пустое.</p></section>`;}
function puppyEditor(puppy,i){const key=`puppies.${i}`;
  return `<section class="editor-section puppy-editor"><div class="section-title"><h2>${e(puppy.name||'Новый щенок')}</h2><button type="button" class="quiet" data-remove-puppy="${i}">Убрать щенка</button></div><div class="two-columns">${field('Кличка',key+'.name',puppy.name,'text','maxlength="120"')}${select('Пол',key+'.sex',puppy.sex,[['female','Девочка'],['male','Мальчик']])}${field('Окрас',key+'.color',puppy.color,'text','maxlength="80"')}${field('Цена, ₽',key+'.price',puppy.price,'number','min="1" max="10000000" step="1"')}</div>${select('Статус',key+'.status',puppy.status,[['','Не указан — уточнить наличие'],['available','Свободен / свободна'],['reserved','Забронирован / забронирована'],['home','Уехал / уехала в новую семью']])}<p class="help">Цена появится справа от клички. Для брони — золотая лента, для новой семьи — лента с бантом. У таких щенков кнопка связи скрыта.</p>${photoEditor(key+'.photos',puppy.photos)}${area('Описание щенка',key+'.description',puppy.description,2000)}</section>`;}
const galleryIcon=path=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="${path}"/></svg>`;
function galleryEditor(){
  const photos=current.data.photos;
  chrome(`<div class="page-heading"><div><h1>Галерея</h1><p>Все фотографии питомника в одном альбоме.</p></div><a href="${publicOrigin}/gallery/" target="_blank" rel="noopener">Посмотреть на сайте ↗</a></div>
    <form id="editor-form" class="gallery-editor"><fieldset>
      <div class="gallery-toolbar"><div><label class="upload-label">Добавить фотографии<input type="file" data-upload="photos" accept="image/jpeg,image/png,image/webp" multiple></label><p class="help">Можно выбрать несколько фото. JPG, PNG или WebP до 12 МБ каждое.</p></div><p class="gallery-count">Фотографий: ${photos.length}</p></div>
      ${photos.length?`<div class="gallery-photo-grid">${photos.map((photo,i)=>`<div class="gallery-photo"><img src="${image(photo.src)}" alt="${e(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy">${field('Подпись к фото',`photos.${i}.alt`,photo.alt,'text','maxlength="300"')}<div class="gallery-photo-tools"><button type="button" data-move="photos" data-index="${i}" data-step="-1" ${i===0?'disabled':''} aria-label="Переместить фото ${i+1} раньше" title="Раньше">${galleryIcon('M15 5 8 12l7 7')}</button><button type="button" data-move="photos" data-index="${i}" data-step="1" ${i===photos.length-1?'disabled':''} aria-label="Переместить фото ${i+1} позже" title="Позже">${galleryIcon('m9 5 7 7-7 7')}</button><button type="button" data-remove-photo="photos" data-index="${i}" aria-label="Убрать фото ${i+1} из галереи" title="Убрать из галереи">${galleryIcon('m6 6 12 12M18 6 6 18')}</button></div></div>`).join('')}</div>`:'<div class="empty"><h2>Добавьте первые фотографии</h2><p>Они появятся в общей галерее после сохранения.</p></div>'}
    </fieldset><div class="save-bar"><div id="save-state" role="status">${dirty||current.dirty?'Есть несохранённые изменения':'Изменения появятся на сайте после сохранения'}</div><div class="inline-actions"><button type="button" class="quiet" data-action="reset-gallery">Отменить изменения</button><button type="submit" class="primary">Сохранить изменения</button></div></div></form>`);
}
function editor(){
  if(current.kind==='gallery')return galleryEditor();
  const d=current.data;
  chrome(`<button class="back quiet" data-action="back">← Все помёты</button><div class="page-heading"><div><h1>${e(d.title||'Новый помёт')}</h1><span class="state">${recordState(current)}</span></div>${current.published?`<a class="quiet" href="${publicOrigin}/puppies/${d.id}/" target="_blank" rel="noopener">Посмотреть на сайте ↗</a>`:''}</div><form id="editor-form"><fieldset ${current.archived?'disabled':''}><section class="editor-section"><h2>О помёте</h2>${field('Название','title',d.title,'text','maxlength="120"')}${field('Дата рождения','birthDate',d.birthDate,'date')}${area('Описание помёта','description',d.description)}</section><div class="section-divider"><h2>Родители</h2><span>Мама и папа помёта</span></div>${d.parents.map(parentEditor).join('')}<div class="inline-actions">${!d.parents.some(p=>p.role==='Мама')?'<button type="button" data-add-parent="Мама">Добавить маму</button>':''}${!d.parents.some(p=>p.role==='Папа')?'<button type="button" data-add-parent="Папа">Добавить папу</button>':''}</div><div class="section-divider"><h2>Щенки</h2><span>${d.puppies.length} в этом помёте</span></div>${d.puppies.map(puppyEditor).join('')}<button type="button" data-action="add-puppy">Добавить щенка</button></fieldset><div class="save-bar"><div id="save-state" role="status">${dirty?'Есть несохранённые изменения':'Изменения сохранены'}</div><div class="inline-actions">${current.archived?'<button type="button" class="primary" data-save="restore">Восстановить в черновики</button>':'<button type="submit">Сохранить черновик</button><button type="button" class="primary" data-save="publish">Опубликовать</button>'}</div></div></form>${current.version&&!current.archived?`<div class="record-actions">${current.published?'<button data-save="close">Все щенки нашли дом</button><button class="quiet" data-save="unpublish">Снять с публикации</button>':'<button class="quiet" data-save="archive">В архив</button>'}<p class="help">Закрытый помёт исчезнет с сайта. Фото и данные сохранятся в архиве — помёт можно будет вернуть.</p></div>`:''}`);
}
async function refresh(){records=(await api('/api/content')).records;}
const canLeave=()=>!dirty||confirm('Есть несохранённые изменения. Выйти без сохранения?');
function confirmLitterClose(record){return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='close-litter-dialog';dialog.setAttribute('aria-labelledby','close-litter-title');dialog.setAttribute('aria-describedby','close-litter-description');
  dialog.innerHTML=`<h2 id="close-litter-title">Закрыть помёт «${e(record.data.title)}»?</h2><p id="close-litter-description">Все щенки нашли дом. Помёт исчезнет из каталога, а его страница больше не будет открываться. Фото и данные сохранятся в архиве — помёт можно будет вернуть.</p>${dirty?'<p class="help">Несохранённые изменения тоже будут сохранены.</p>':''}<form method="dialog"><button value="cancel" autofocus>Отмена</button><button value="close" class="primary">Закрыть помёт</button></form>`;
  dialog.addEventListener('close',()=>{const accepted=dialog.returnValue==='close';dialog.remove();resolve(accepted);},{once:true});document.body.append(dialog);dialog.showModal();
});}
async function save(action, record=null){
  if(busy)return;
  const fromList=!!record,target=record||current;
  if(action==='close'&&!await confirmLitterClose(target))return;
  if(['archive','unpublish'].includes(action)&&!confirm(action==='archive'?'Убрать запись с сайта и переместить в архив?':'Снять запись с публикации? Черновик сохранится.'))return;
  busy=true;const fields=document.querySelector('#editor-form fieldset');if(fields)fields.disabled=true;app.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{
    const result=await api(`/api/content/${target.kind}/${target.id}`,{method:'PUT',data:{data:target.data,version:target.version,action:action==='close'?'archive':action}});
    if(!fromList)current=result.record;
    dirty=false;await refresh();if(fromList)listing();else editor();
    say(action==='close'?'Помёт закрыт и сохранён в архиве.':section==='gallery'?'Галерея обновлена.':action==='publish'?'Опубликовано. Сайт обновлён.':action==='archive'?'Запись перенесена в архив.':'Изменения сохранены.');
  }catch(error){
    say(error.message,true);
    if(!document.querySelector('#login-form')){if(fromList)listing();else if(current)editor();}
  }finally{busy=false;}
}
app.addEventListener('submit',async event=>{event.preventDefault();if(event.target.id==='editor-form')return save(section==='gallery'?'publish':'draft');
  const form=event.target,button=form.querySelector('button');button.disabled=true;button.textContent='Входим…';
  try{const values=new FormData(form),result=await api('/api/login',{method:'POST',data:{username:values.get('username'),password:values.get('password')}});csrf=result.csrf;await refresh();if(pendingEdit){current=pendingEdit;section=current.kind;pendingEdit=null;dirty=true;editor();say('Вход восстановлен. Ваши изменения сохранены в форме.');}else{listing();say('');}}catch(error){const errorNode=document.querySelector('#login-error');if(errorNode)errorNode.textContent=error.message;button.disabled=false;button.textContent='Войти';}});
app.addEventListener('input',event=>{const input=event.target;if(input.id==='search'){document.querySelectorAll('[data-search]').forEach(row=>row.hidden=!row.dataset.search.includes(input.value.toLowerCase()));return;}
  if(input.dataset.field){let value=input.value;if(input.type==='number')value=value===''?null:Number(value);if(input.dataset.field.endsWith('.status')&&!value)value=null;set(input.dataset.field,value);}});
app.addEventListener('change',async event=>{const input=event.target;
  if(!input.dataset.upload)return;
  const files=[...input.files];if(!files.length)return;const key=input.dataset.upload,single=key.endsWith('.image');
  const limit=section==='gallery'?500:20;
  if(!single&&get(key).length+files.length>limit){say(`Можно добавить до ${limit} фотографий.`,true);input.value='';return;}
  busy=true;input.disabled=true;document.querySelector('#editor-form fieldset').disabled=true;
  try{for(let i=0;i<files.length;i++){say(`Загружаем фото ${i+1} из ${files.length}…`);if(files[i].size>12*1024*1024)throw new Error('Фото больше 12 МБ. Выберите файл поменьше.');const photo=await api('/api/upload',{method:'POST',raw:files[i]});if(single){const p=get(key.slice(0,-6));p.image=photo.src;p.width=photo.width;p.height=photo.height;}else{photo.alt=current.data.title||'';get(key).push(photo);}dirty=true;}say(section==='gallery'?'Фотографии добавлены. Сохраните изменения.':'Фотографии загружены. Сохраните запись.');}catch(error){say(error.message,true);}finally{busy=false;if(current)editor();}});
app.addEventListener('click',async event=>{const b=event.target.closest('button,a');if(!b)return;if(busy){event.preventDefault();return;}
  try{
    if(b.dataset.section){if(!canLeave())return;section=b.dataset.section;archived=false;listing();}
    if(b.dataset.edit){current=clone(records.find(r=>r.kind===section&&r.id===b.dataset.edit));dirty=false;editor();window.scrollTo(0,0);}
    if(b.dataset.closeLitter)return save('close',records.find(r=>r.kind==='litters'&&r.id===b.dataset.closeLitter));
    if(b.dataset.save)return save(b.dataset.save);
    if(b.dataset.addParent){current.data.parents.push({id:id('parent'),role:b.dataset.addParent,name:'',kennel:'',image:'',width:0,height:0,description:'',pedigree:''});dirty=true;editor();}
    if(b.dataset.removeParent!==undefined){if(confirm('Убрать родителя из этого помёта?')){current.data.parents.splice(+b.dataset.removeParent,1);dirty=true;editor();}}
    if(b.dataset.removePuppy!==undefined){if(confirm('Убрать щенка из этого помёта?')){current.data.puppies.splice(+b.dataset.removePuppy,1);dirty=true;editor();}}
    if(b.dataset.removePhoto){const key=b.dataset.removePhoto;if(key.endsWith('.image')){const p=get(key.slice(0,-6));p.image='';p.width=p.height=0;}else get(key).splice(+b.dataset.index,1);dirty=true;editor();}
    if(b.dataset.move){const photos=get(b.dataset.move),i=+b.dataset.index,next=i+Number(b.dataset.step||-1);if(next>=0&&next<photos.length){[photos[next],photos[i]]=[photos[i],photos[next]];dirty=true;editor();document.querySelector(`[data-move="${b.dataset.move}"][data-index="${next}"]:not(:disabled)`)?.focus();}}
    const action=b.dataset.action;
    if(action==='home'){event.preventDefault();if(canLeave())listing();}
    if(action==='back'&&canLeave())listing();
    if(action==='reset-gallery')openGallery();
    if(action==='archive-list'){archived=!archived;listing();}
    if(action==='new'){const key=id('litter');current={id:key,kind:'litters',version:0,published:false,archived:false,data:{id:key,title:'',birthDate:null,description:'',parents:[],puppies:[]}};dirty=true;editor();}
    if(action==='add-puppy'){current.data.puppies.push({id:id('puppy'),name:'',sex:'female',color:'Палевый',price:null,status:null,description:'',photos:[]});dirty=true;editor();document.querySelector('.puppy-editor:last-of-type')?.scrollIntoView({block:'start'});}
    if(action==='logout'&&canLeave()){await api('/api/logout',{method:'POST'});csrf='';current=null;pendingEdit=null;dirty=false;login();}
  }catch(error){say(error.message,true);}
});
window.addEventListener('beforeunload',event=>{if(dirty||busy||pendingEdit){event.preventDefault();event.returnValue='';}});
try{const result=await api('/api/session');csrf=result.csrf;await refresh();listing();}catch{login();}
