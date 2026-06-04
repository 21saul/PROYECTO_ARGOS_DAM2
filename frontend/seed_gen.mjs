// GENERADOR DE DATOS DE SEMILLA PARA UN USUARIO DE PRUEBA DE ARGOS
// REPLICA EXACTAMENTE LA CRIPTOGRAFIA DE crypto.service.ts (hash-wasm + WebCrypto)
// PARA QUE EL auth_hash Y LOS BLOBS CIFRADOS SEAN COMPATIBLES CON EL LOGIN REAL.
import { argon2id } from 'hash-wasm';
import { webcrypto as crypto } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const PASSWORD = 'Test1234!';
const KDF = { memory_cost: 65536, time_cost: 3, parallelism: 1 };

const hexToBytes = (hex) => {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) b[i / 2] = parseInt(hex.substr(i, 2), 16);
  return b;
};
const bytesToHex = (bytes) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
const asciiToHex = (s) => { let h = ''; for (let i = 0; i < s.length; i++) h += s.charCodeAt(i).toString(16).padStart(2, '0'); return h; };
const bytesToBase64 = (bytes) => Buffer.from(bytes).toString('base64');

// GENERA SALT ALEATORIO DE 32 BYTES (IGUAL QUE generateSalt)
const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));

// DERIVA EL auth_hash (IGUAL QUE deriveAuthHash)
const authHash = await argon2id({
  password: PASSWORD, salt: hexToBytes(salt),
  iterations: KDF.time_cost, memorySize: KDF.memory_cost, parallelism: KDF.parallelism,
  hashLength: 32, outputType: 'hex',
});

// DERIVA LA CLAVE AES-256-GCM (IGUAL QUE deriveEncryptionKey, PREFIJO 'ENC')
const encSalt = hexToBytes(asciiToHex('ENC') + salt);
const rawHex = await argon2id({
  password: PASSWORD, salt: encSalt,
  iterations: KDF.time_cost, memorySize: KDF.memory_cost, parallelism: KDF.parallelism,
  hashLength: 32, outputType: 'hex',
});
const key = await crypto.subtle.importKey('raw', hexToBytes(rawHex).buffer, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

// CIFRA UNA CADENA CON AES-256-GCM (IGUAL QUE encrypt): [IV 12][CT+TAG] -> base64
const encrypt = async (plaintext) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  const combined = new Uint8Array(iv.length + ct.byteLength);
  combined.set(iv, 0); combined.set(new Uint8Array(ct), iv.length);
  return bytesToBase64(combined);
};

// VAULT BLOB INICIAL VACIO (IGUAL QUE register)
const vaultBlob = await encrypt(JSON.stringify({ items: [], folders: [], version: 1 }));

// CARPETAS DE DEMO (NOMBRE/COLOR/ICONO EN CLARO COMO EN seedDemoData)
const folders = [
  { key: 'bancos',  name: 'Bancos',          color: '#10B981', icon: 'bank' },
  { key: 'email',   name: 'Email',           color: '#7C3AED', icon: 'envelope' },
  { key: 'redes',   name: 'Redes Sociales',  color: '#EC4899', icon: 'users-three' },
  { key: 'trabajo', name: 'Trabajo',         color: '#06B6D4', icon: 'briefcase' },
  { key: 'familia', name: 'Familia',         color: '#F59E0B', icon: 'house' },
];

// ITEMS DE DEMO (PAYLOAD EN CLARO QUE SE CIFRARA)
const itemsRaw = [
  { folder: 'bancos',  type: 'password', payload: { title: 'BBVA', username: 'usuario@example.com', password: 'BBVA_Demo_2026!', url: 'https://www.bbva.es' } },
  { folder: 'bancos',  type: 'password', payload: { title: 'Santander', username: '12345678A', password: 'San_Demo_2026!', url: 'https://www.bancosantander.es' } },
  { folder: 'bancos',  type: 'note',     payload: { title: 'PIN tarjeta BBVA', notes: 'PIN: 4 ultimos digitos del telefono\nCVV en sobre del cajon' } },
  { folder: 'email',   type: 'password', payload: { title: 'Gmail Personal', username: 'usuario.demo@gmail.com', password: 'Gmail_Strong_2026!', url: 'https://mail.google.com' } },
  { folder: 'email',   type: 'password', payload: { title: 'Outlook Trabajo', username: 'trabajo@empresa.com', password: 'OutlookWork_2026!', url: 'https://outlook.live.com' } },
  { folder: 'redes',   type: 'password', payload: { title: 'Instagram', username: 'usuario_demo', password: 'Insta_2026_Demo!', url: 'https://www.instagram.com' } },
  { folder: 'redes',   type: 'password', payload: { title: 'Twitter / X', username: '@usuario_demo', password: 'TwitterX_2026!', url: 'https://x.com' } },
  { folder: 'redes',   type: 'password', payload: { title: 'LinkedIn', username: 'usuario.demo@gmail.com', password: 'LinkedIn_2026_Pro!', url: 'https://www.linkedin.com' } },
  { folder: 'trabajo', type: 'password', payload: { title: 'GitHub', username: 'usuario-demo', password: 'GitHub_Demo_2026!', url: 'https://github.com' } },
  { folder: 'trabajo', type: 'note',     payload: { title: 'Codigos 2FA Backup GitHub', notes: 'a3f2-b8c1\nd4e6-9a2f\n7b5c-1d8e\nf0a3-c6b9\n2e7d-5f4a' } },
  { folder: 'familia', type: 'password', payload: { title: 'WiFi Casa', username: 'ARGOS_Home_5G', password: 'WifiCasa_2026_Seguro!' } },
  { folder: 'familia', type: 'note',     payload: { title: 'Codigo alarma casa', notes: 'Codigo principal: 1980\nCodigo coaccion: 9110\nUbicacion del manual: cajon entrada' } },
];

// CIFRA CADA ITEM Y CALCULA size_bytes (LONGITUD DEL BLOB BASE64, COMO HACE EL BACKEND)
const items = [];
for (const it of itemsRaw) {
  const blob = await encrypt(JSON.stringify(it.payload));
  items.push({ folder: it.folder, item_type: it.type, encrypted_blob: blob, size_bytes: blob.length });
}

// VOLCADO AL DIRECTORIO writable DEL BACKEND (VISIBLE DESDE EL CONTENEDOR backend)
const out = { password: PASSWORD, salt, kdf_params: KDF, auth_hash: authHash, vault_blob: vaultBlob, folders, items };
writeFileSync('/home/ddev/www/ARGOS/backend/writable/seed_user.json', JSON.stringify(out, null, 2));
console.log('OK -> auth_hash len', authHash.length, '| items', items.length, '| folders', folders.length);
