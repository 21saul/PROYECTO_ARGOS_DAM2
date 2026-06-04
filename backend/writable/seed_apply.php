<?php
// APLICA EL USUARIO DE PRUEBA Y SUS DATOS DE SEMILLA A LA BASE DE DATOS.
// LEE LOS VALORES CRIPTOGRAFICOS YA DERIVADOS (COMPATIBLES CON EL FRONTEND)
// DESDE writable/seed_user.json Y LOS PERSISTE CON SENTENCIAS PREPARADAS.

// EMAIL DEL USUARIO DE PRUEBA A RECONSTRUIR
$EMAIL = 'front-test@argos.dev';

// CARGA EL JSON GENERADO POR EL SCRIPT NODE
$seed = json_decode(file_get_contents(__DIR__ . '/seed_user.json'), true);

// CONEXION A MARIADB DENTRO DEL CONTENEDOR
$m = new mysqli('db', 'db', 'db', 'db');
$m->set_charset('utf8mb4');

// LOCALIZA AL USUARIO POR SU IDENTIDAD email_password
$stmt = $m->prepare("SELECT user_id FROM auth_identities WHERE type='email_password' AND secret=?");
$stmt->bind_param('s', $EMAIL);
$stmt->execute();
$uid = ($stmt->get_result()->fetch_assoc())['user_id'] ?? null;
if (!$uid) { fwrite(STDERR, "Usuario no encontrado\n"); exit(1); }
echo "user_id=$uid\n";

// 1) HASH BCRYPT DEL auth_hash (LO QUE EL LOGIN VERIFICA CON password_verify)
$secret2 = password_hash($seed['auth_hash'], PASSWORD_BCRYPT, ['cost' => 12]);

// ACTUALIZA LA IDENTIDAD: NUEVO secret2 Y SIN FORZAR RESET
$stmt = $m->prepare("UPDATE auth_identities SET secret2=?, force_reset=0 WHERE user_id=? AND type='email_password'");
$stmt->bind_param('si', $secret2, $uid);
$stmt->execute();

// 2) ACTUALIZA EL USUARIO: ACTIVO, USERNAME, PARAMETROS KDF Y VAULT BLOB INICIAL
$kdfParams = json_encode($seed['kdf_params']);
$now = date('Y-m-d H:i:s');
$username = 'front-test';
// IMPORTANTE: LA API GUARDA LOS BLOBS YA DECODIFICADOS (base64_decode EN create())
// Y LOS RE-CODIFICA AL LEER (base64_encode EN index()/AuthController). POR ESO AQUI
// TAMBIEN GUARDAMOS LOS BYTES CRUDOS; SI GUARDARAMOS EL BASE64 TAL CUAL QUEDARIA
// DOBLE-CODIFICADO Y EL CLIENTE FALLARIA AL DESCIFRAR (OperationError EN AES-GCM).
$vaultBlobRaw = base64_decode($seed['vault_blob']);
$stmt = $m->prepare("UPDATE users SET username=?, active=1, kdf_salt=?, kdf_algorithm='argon2id', kdf_params=?, vault_blob=?, updated_at=? WHERE id=?");
$stmt->bind_param('sssssi', $username, $seed['salt'], $kdfParams, $vaultBlobRaw, $now, $uid);
$stmt->execute();

// 3) LIMPIA DATOS PREVIOS DE LA BOVEDA (CIFRADOS CON LA CONTRASENA ANTIGUA)
$m->query("DELETE FROM vault_items WHERE user_id=$uid");
$m->query("DELETE FROM vault_folders WHERE user_id=$uid");

// 4) INSERTA LAS CARPETAS Y GUARDA EL MAPEO key -> id NUEVO
$folderIds = [];
$stmt = $m->prepare("INSERT INTO vault_folders (user_id, name, color, icon, created_at, updated_at) VALUES (?,?,?,?,?,?)");
foreach ($seed['folders'] as $f) {
    $stmt->bind_param('isssss', $uid, $f['name'], $f['color'], $f['icon'], $now, $now);
    $stmt->execute();
    $folderIds[$f['key']] = $m->insert_id;
}
echo "carpetas=" . count($folderIds) . "\n";

// 5) INSERTA LOS ITEMS CIFRADOS APUNTANDO A SU CARPETA
$stmt = $m->prepare("INSERT INTO vault_items (user_id, folder_id, item_type, encrypted_blob, size_bytes, created_at, updated_at) VALUES (?,?,?,?,?,?,?)");
$count = 0;
foreach ($seed['items'] as $it) {
    $fid = $folderIds[$it['folder']];
    // DECODIFICA EL BLOB A BYTES CRUDOS (IGUAL QUE create() EN EL CONTROLADOR)
    // PARA QUE AL LEER index() LO RE-CODIFIQUE UNA SOLA VEZ Y EL CLIENTE PUEDA
    // DESCIFRARLO. size_bytes ES LA LONGITUD DE LOS BYTES CRUDOS, COMO EN LA API.
    $blobRaw = base64_decode($it['encrypted_blob']);
    $sizeBytes = strlen($blobRaw);
    $stmt->bind_param('iississ', $uid, $fid, $it['item_type'], $blobRaw, $sizeBytes, $now, $now);
    $stmt->execute();
    $count++;
}
echo "items=$count\n";

// 6) DATOS DEL AUDITOR: HISTORICO DE PRIVACY SCORE (TENDENCIA DE 6 MESES)
$m->query("DELETE FROM privacy_score_history WHERE user_id=$uid");
$scores = [
    ['2025-12-20', 52, 60, 40, 58],
    ['2026-01-20', 58, 64, 48, 62],
    ['2026-02-20', 63, 68, 55, 66],
    ['2026-03-20', 69, 72, 64, 71],
    ['2026-04-20', 74, 78, 70, 75],
    ['2026-05-20', 81, 84, 79, 80],
];
$stmt = $m->prepare("INSERT INTO privacy_score_history (user_id, score, identity_score, passwords_score, device_score, recorded_at) VALUES (?,?,?,?,?,?)");
foreach ($scores as $s) {
    $stmt->bind_param('iiiiis', $uid, $s[1], $s[2], $s[3], $s[4], $s[0]);
    $stmt->execute();
}
echo "privacy_scores=" . count($scores) . "\n";

// 7) LOGS DE AUDITORIA DE EJEMPLO (LOGINS Y ESCANEOS DEL AUDITOR)
$m->query("DELETE FROM audit_logs WHERE user_id=$uid");
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ARGOS-Demo';
$logs = [
    ['login',        '2026-05-18 09:14:02', 'success'],
    ['hibp_scan',    '2026-05-18 09:15:30', 'success'],
    ['login',        '2026-05-19 20:41:55', 'success'],
    ['login',        '2026-05-20 08:02:11', 'failed'],
    ['login',        '2026-05-20 08:02:19', 'success'],
    ['vault_export', '2026-05-20 08:05:40', 'success'],
    ['safebrowsing_scan', '2026-05-20 08:07:12', 'success'],
];
$stmt = $m->prepare("INSERT INTO audit_logs (user_id, action, ip_address, user_agent, status, created_at) VALUES (?,?,?,?,?,?)");
$ip = '192.168.1.50';
foreach ($logs as $l) {
    $stmt->bind_param('isssss', $uid, $l[0], $ip, $ua, $l[2], $l[1]);
    $stmt->execute();
}
echo "audit_logs=" . count($logs) . "\n";

echo "DONE\n";
