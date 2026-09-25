export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = message => { throw new HttpError(400, message); };
const text = (value, label, max=300, required=false) => {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(`Проверьте поле «${label}».`);
  const result=value.trim();
  if(required && !result) fail(`Заполните поле «${label}».`);
  return result;
};
export const validId = id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(id);
const id = value => { if(!validId(value)) fail('Некорректный адрес записи.'); return value; };
const date = value => {
  if(value == null || value === '') return null;
  if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value) fail('Укажите корректную дату.');
  return value;
};
const list = (value,max,label) => { if(!Array.isArray(value)||value.length>max) fail(`Слишком много элементов: ${label}.`); return value; };
const unique = items => {if(new Set(items.map(x=>x.id)).size!==items.length) fail('Идентификаторы не должны повторяться.');return items;};
export function validateContent(kind, input, {publish=false, mediaExists=()=>true}={}) {
  if(!input || typeof input!=='object' || Array.isArray(input)) fail('Запись должна быть объектом.');
  const photo = raw => {
    if(!raw || typeof raw!=='object') fail('Некорректная фотография.');
    const src=text(raw.src,'Файл',150,true);
    if(!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(src) || !mediaExists(src)) fail('Фотография не найдена. Загрузите её заново.');
    const width=Number(raw.width), height=Number(raw.height);
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>20000||height>20000) fail('Некорректные размеры фотографии.');
    return {src,width,height,alt:text(raw.alt||'','Описание фото',300)};
  };
  const photos=(raw,required=false)=>{
    const values=list(raw||[],20,'фотографии').map(photo);
    if(required && !values.length) fail('Добавьте хотя бы одну фотографию.');
    return values;
  };
  const common={id:id(input.id),title:text(input.title||'','Название',120,publish)};
  if(kind==='gallery') return {...common,text:text(input.text||'','Текст публикации',5000),date:date(input.date),photos:photos(input.photos,publish)};
  if(kind!=='litters') fail('Неизвестный раздел.');
  const parents=unique(list(input.parents||[],2,'родители').map(raw=>{
    if(!raw || typeof raw!=='object') fail('Некорректные сведения о родителе.');
    if(!['Мама','Папа'].includes(raw.role)) fail('Укажите роль родителя.');
    const image=raw.image ? photo({src:raw.image,width:raw.width,height:raw.height,alt:raw.name||''}) : null;
    if(publish && !image) fail('Добавьте фотографии родителей.');
    return {id:id(raw.id),name:text(raw.name||'','Кличка родителя',120,publish),role:raw.role,kennel:text(raw.kennel||'','Питомник',160),description:text(raw.description||'','О родителе',3000),pedigree:text(raw.pedigree||'','Родословная',5000),image:image?.src||'',width:image?.width||0,height:image?.height||0};
  }));
  if(new Set(parents.map(p=>p.role)).size!==parents.length) fail('Выберите одного папу и одну маму.');
  const puppies=unique(list(input.puppies||[],30,'щенки').map(raw=>{
    if(!raw || typeof raw!=='object') fail('Некорректные сведения о щенке.');
    if(!['female','male'].includes(raw.sex)) fail('Укажите пол щенка.');
    if(raw.status!=null && !['available','reserved','home'].includes(raw.status)) fail('Укажите статус щенка.');
    const price=raw.price===null||raw.price===''||raw.price===undefined?null:Number(raw.price);
    if(price!==null && (!Number.isInteger(price)||price<1||price>10000000)) fail('Цена должна быть целым числом от 1 до 10 000 000 ₽.');
    return {id:id(raw.id),name:text(raw.name||'','Кличка щенка',120,publish),sex:raw.sex,color:text(raw.color||'','Окрас',80,publish),price,status:raw.status??null,description:text(raw.description||'','О щенке',2000),photos:photos(raw.photos,publish)};
  }));
  if(publish && (parents.length!==2 || !puppies.length)) fail('Для публикации добавьте обоих родителей и хотя бы одного щенка.');
  return {...common,birthDate:date(input.birthDate),description:text(input.description||'','О помёте',3000),parents,puppies};
}
