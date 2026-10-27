import { createHmac } from 'node:crypto';

export const DURACION_CODIGO_SEGUNDOS = 6 * 60;
export const normalizarCorreo = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
export const emailValido = email => typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const codigoValido = codigo => typeof codigo === 'string' && /^\d{8}$/.test(codigo);
export function firmarCodigo(correo, sal, codigo, secreto) {
  if (typeof secreto !== 'string' || secreto.length < 32) throw Error('Secreto insuficiente');
  return createHmac('sha256', secreto).update('cerca-admin-otp-v1|' + correo + '|' + sal + '|' + codigo).digest('hex');
}
