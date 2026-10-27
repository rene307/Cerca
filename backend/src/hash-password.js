import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';
const prompt=createInterface({input:process.stdin,output:process.stdout});
try { const pwd=await prompt.question('Contraseña ADMIN (no guardada en disco): ');if(pwd.length<12)throw new Error('Usa 12 caracteres o más.');console.log('\nADMIN_PASSWORD_HASH='+await bcrypt.hash(pwd,12));}
catch(e){console.error(e.message);process.exitCode=1;}finally{prompt.close();}
