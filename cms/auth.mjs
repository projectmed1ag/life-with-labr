import {scrypt as scryptCallback,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
const options={N:131072,r:8,p:1,maxmem:192*1024*1024};
export const token=()=>randomBytes(32).toString('hex');
export const digest=value=>createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) {
  if(typeof password!=='string'||password.length<12||password.length>256) throw new Error('Пароль должен содержать от 12 до 256 символов.');
  const salt=randomBytes(16).toString('hex');
  return `scrypt:${salt}:${(await scrypt(password,salt,64,options)).toString('hex')}`;
}
export async function verifyPassword(password,encoded) {
  if(typeof password!=='string'||password.length>256) return false;
  const [method,salt,hash]=encoded.split(':');
  if(method!=='scrypt'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(hash)) return false;
  return timingSafeEqual(await scrypt(password,salt,64,options),Buffer.from(hash,'hex'));
}
