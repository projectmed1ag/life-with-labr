import {openStore} from './store.mjs';
import {hashPassword} from './auth.mjs';
import path from 'node:path';
const store=openStore(path.resolve(process.env.CMS_DATA_DIR||'.cms-data'));
try {
  const username=process.env.CMS_ADMIN_USER||'admin';
  if(store.db.prepare('SELECT 1 FROM users WHERE username=?').get(username)) throw new Error('Учётная запись уже существует.');
  let password='';
  for await (const chunk of process.stdin) password+=chunk;
  password=password.replace(/\r?\n$/,'');
  store.db.prepare('INSERT INTO users VALUES(?,?)').run(username,await hashPassword(password));
  console.log('Учётная запись создана. Пароль сохранён только в виде хеша.');
} finally {store.close();}
