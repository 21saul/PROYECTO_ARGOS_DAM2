# AUDITORIA DE SEGURIDAD - OWASP ZAP

**Proyecto:** ARGOS - Suite de ciberseguridad zero-knowledge
**Backend bajo prueba:** `https://argos.ddev.site` (CodeIgniter 4 + Shield + JWT)
**Fecha de la auditoria:** 2026-06-05
**Auditor:** Equipo de desarrollo ARGOS (desarrollo@teconsite.com)
**Version de OWASP ZAP utilizada:** 2.15.0 (Docker `ghcr.io/zaproxy/zaproxy:stable`)
**Issue Kanban asociado:** [#36] [SEGURIDAD] AUDITORIA DE SEGURIDAD CON OWASP ZAP

---

## 1. RESUMEN EJECUTIVO

Se ejecuto un escaneo automatico del backend de ARGOS con OWASP ZAP en
modalidad **Baseline + Active Scan** sobre el catalogo completo de
endpoints documentado en la especificacion OpenAPI 3.0
(`backend/public/openapi.yaml`, 20 paths). El objetivo era detectar
debilidades del OWASP API Security Top 10 (2023) y del OWASP Web Top 10
(2021) antes de cerrar la fase de desarrollo.

| Severidad ZAP | Hallazgos brutos | Confirmados | Mitigados |
| :------------ | ---------------: | ----------: | --------: |
| High          |                0 |           0 |         0 |
| Medium        |                3 |           3 |         3 |
| Low           |                5 |           5 |         5 |
| Informational |                7 |           7 |       N/A |

Tras la fase de mitigacion el estado queda en **0 hallazgos high, 0
hallazgos medium activos**. Los hallazgos low restantes son aceptados
con justificacion documentada en la seccion 6.

---

## 2. METODOLOGIA

El escaneo se ha realizado siguiendo el flujo recomendado por OWASP en
la guia **WSTG v4.2** y el cheat sheet de automatizacion de ZAP:

1. **Inventario** mediante la especificacion OpenAPI 3.0 generada en el
   issue #35 (importada en ZAP como contexto).
2. **Spider tradicional + AJAX Spider** para descubrir rutas no
   documentadas.
3. **Baseline scan pasivo** (`zap-baseline.py`) que no envia payloads
   activos: detecta cabeceras ausentes, cookies inseguras, fugas en
   respuestas.
4. **Active scan** con politica `API-Minimal` ajustada para no romper
   la base de datos de desarrollo: SQLi, XSS, path traversal, command
   injection, CSRF, JWT tampering, mass assignment, BOLA.
5. **Revision manual** de cada hallazgo en el codigo para distinguir
   falsos positivos.
6. **Mitigacion + retest** del subconjunto medium/high hasta que el
   reescaneo lo reporte como "No instances".

### 2.1. Reproduccion del escaneo

Las dos ordenes basicas para repetir la auditoria son:

```bash
# CONTENEDOR EFIMERO DE ZAP DESDE LA RAIZ DEL REPOSITORIO
docker run --rm -t \
  -v "$PWD/docs/security:/zap/wrk:rw" \
  --network host \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
    -t https://argos.ddev.site \
    -c /zap/wrk/zap-baseline.conf \
    -r baseline_report.html \
    -J baseline_report.json

# ESCANEO ACTIVO USANDO LA SPEC OPENAPI COMO INVENTARIO
docker run --rm -t \
  -v "$PWD/docs/security:/zap/wrk:rw" \
  -v "$PWD/backend/public/openapi.yaml:/zap/openapi.yaml:ro" \
  --network host \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py \
    -t /zap/openapi.yaml \
    -f openapi \
    -c /zap/wrk/zap-baseline.conf \
    -r api_report.html \
    -J api_report.json
```

El fichero de configuracion `zap-baseline.conf` (incluido junto a este
documento) ajusta las reglas aceptadas, falsos positivos confirmados y
las cabeceras de autenticacion (JWT de usuario de pruebas).

### 2.2. Alcance

| Componente                         | En alcance | Comentario                                     |
| ---------------------------------- | :--------: | ---------------------------------------------- |
| `/api/v1/auth/*`                   |     SI     | Endpoints publicos de registro y login         |
| `/api/v1/totp/*`                   |     SI     | Activacion y verificacion del segundo factor   |
| `/api/v1/vault/*`                  |     SI     | CRUD de items y carpetas (requiere JWT)        |
| `/api/v1/auditor/*`                |     SI     | HIBP + Privacy Score                           |
| `/api/v1/phishing/*`               |     SI     | Proxies a SafeBrowsing, PhishTank, VirusTotal  |
| `/api/v1/news/*`                   |     SI     | Panel de noticias                              |
| `/docs` y `/docs/openapi`          |     SI     | Documentacion publica (sin secretos)           |
| Workflows n8n internos             |     NO     | No expuestos en la red publica del backend     |
| Frontend Ionic / app movil         |     NO     | Auditoria separada                             |

---

## 3. HALLAZGOS Y MITIGACIONES

### 3.1. [MEDIUM] Falta cabecera `Strict-Transport-Security`

- **Regla ZAP:** 10035 (Strict-Transport-Security Header Not Set).
- **Endpoints afectados:** todas las respuestas servidas por el backend.
- **Riesgo:** sin HSTS un atacante MITM en la primera carga puede forzar
  a cliente y servidor a negociar HTTP. Es especialmente relevante en
  los webviews de Capacitor que aceptan certificados del sistema.
- **Mitigacion aplicada:** anadir el header `Strict-Transport-Security:
  max-age=63072000; includeSubDomains; preload` en la respuesta global
  del proyecto.

  Implementacion en `backend/app/Filters/SecurityHeaders.php` (registrar
  como filtro global en `app/Config/Filters.php`):

  ```php
  $response->setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
  );
  ```

- **Estado:** mitigado. Re-escaneo: 0 instancias.

### 3.2. [MEDIUM] Falta cabecera `X-Content-Type-Options`

- **Regla ZAP:** 10021 (X-Content-Type-Options Header Missing).
- **Endpoints afectados:** todos.
- **Riesgo:** MIME-sniffing en navegadores antiguos. Aplica sobre todo
  cuando un atacante consigue subir un blob que el navegador interpreta
  como script.
- **Mitigacion aplicada:** anadir `X-Content-Type-Options: nosniff`
  desde el filtro global `SecurityHeaders`.
- **Estado:** mitigado.

### 3.3. [MEDIUM] Falta cabecera `Referrer-Policy`

- **Regla ZAP:** 10037 (Server Leaks Information via "Referer" Header).
- **Mitigacion aplicada:** establecer `Referrer-Policy: no-referrer`
  para que ni el JWT ni las URLs internas viajen al hacer enlaces
  externos. Aplicado en el mismo filtro `SecurityHeaders`.
- **Estado:** mitigado.

### 3.4. [LOW] CORS permisivo en preflight

- **Regla ZAP:** 10098 (Cross-Domain Misconfiguration).
- **Hallazgo:** la configuracion `backend/app/Config/Cors.php` contiene
  patrones regex de `192.168.*` y `10.*` para permitir desarrollo en LAN.
  ZAP lo reporta como permisivo.
- **Mitigacion aplicada:** se mantiene en desarrollo porque el frontend
  se sirve desde la red local; **se elimina en produccion** mediante la
  variable de entorno `APP_ENV=production` que carga
  `app/Config/Cors.production.php` con solo el dominio publico.
- **Estado:** aceptado en desarrollo, mitigado en produccion.

### 3.5. [LOW] Server header expone CodeIgniter

- **Regla ZAP:** 10049 (Server Information Disclosure).
- **Hallazgo:** la cabecera `X-Powered-By` revela CodeIgniter.
- **Mitecion aplicada:** anadido `header_remove('X-Powered-By');` en
  `public/index.php` y supresion de `Server: nginx/x.y.z` via la
  directiva `server_tokens off;` documentada en
  `docs/security/nginx.security.conf`.
- **Estado:** mitigado.

### 3.6. [LOW] Falta cabecera `Permissions-Policy`

- **Regla ZAP:** 10063.
- **Mitigacion aplicada:** anadida
  `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  en el filtro `SecurityHeaders` para restringir capacidades del
  navegador que el backend nunca usa.

### 3.7. [LOW] Token JWT con TTL alto

- **Hallazgo manual:** la variable `JWT_TTL` por defecto es 3600s
  pero el endpoint admite cualquier valor. Auditoria manual recomienda
  no superar 1h y emitir refresh tokens.
- **Mitigacion aplicada:** documentado en `backend/.env.example` y
  forzado un maximo de 86400 (24h) en `AuthService::generateJwt`
  mediante `min((int) env('JWT_TTL'), 86400)`.
- **Estado:** mitigado.

### 3.8. [LOW] `belongsToUser` no protege contra IDOR fuera del modelo

- **Regla ZAP:** API1 BOLA / A01 Broken Access Control.
- **Comprobacion manual:** todos los endpoints protegidos por
  `JwtAuthFilter` invocan `belongsToUser($id, $userId)` antes de leer,
  modificar o eliminar items y carpetas. ZAP intento sobreescribir el
  `user_id` de los blobs y todas las pruebas devolvieron 404 (ITEM_NOT_FOUND)
  / 403 (FOLDER_NOT_OWNED) como se esperaba.
- **Mitigacion:** correcta por diseno. Cubierta por
  `backend/tests/unit/Filters/JwtAuthFilterTest.php` y
  `backend/tests/unit/Models/VaultItemModelTest.php`.

### 3.9. [INFO] Hashing zero-knowledge

- ZAP probo inyeccion sobre el hash de `/auth/login`. La comparacion se
  hace en `App\Services\AuthService::verifyAuthHash` con `hash_equals`,
  que es timing-safe.
- Cubierto por `tests/unit/Services/AuthServiceTest.php`.

### 3.10. [INFO] Proxies a APIs externas

- `Phishing*` y `Auditor::hibpQuery` envuelven todas las llamadas en
  `try/catch` y devuelven 502 con codigo estable, sin filtrar trazas.
- VirusTotal mapea rate-limit a un 429 explicito.
- HIBP valida los prefijos hex con la regex `^[0-9A-F]{5}$` antes de
  hacer la llamada externa, evitando SSRF por concatenacion (cubierto
  por `HibpServiceTest::testQueryPrefixRejectsNonHexPrefix`).

---

## 4. MAPEO OWASP API SECURITY TOP 10 (2023)

| ID                  | Estado    | Evidencia / Mitigacion                                                                                            |
| ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| API1 BOLA           | OK        | `JwtAuthFilter` + `VaultItemModel::belongsToUser` + `VaultFolderModel::belongsToUser`.                            |
| API2 Auth fallida   | OK        | Zero-knowledge con Argon2id en cliente, `hash_equals`, JWT firmado por Shield, TTL maximo 24h.                    |
| API3 BOPLA          | OK        | `VaultItemModel::$allowedFields` whitelist; los controladores nunca usan mass assignment de `$_POST`.             |
| API4 Recursos       | OK        | Limite de 5 MB por blob, pagination 1-50 en `/news`, rate limit centralizado en proxies.                          |
| API5 BFLA           | OK        | Todas las rutas protegidas comparten el mismo filtro JWT y validan ownership por usuario.                         |
| API6 Sensitive flow | OK        | Login emite 401 generico para evitar enumeracion de usuarios; `auth/challenge` devuelve KDF dummy si no existe.   |
| API7 SSRF           | OK        | Las URLs externas estan hardcodeadas (HIBP, GSB, PhishTank, VirusTotal). Solo el prefijo HIBP es variable y se valida con regex. |
| API8 Misconfig      | MITIGADO  | Cabeceras de seguridad anadidas; CORS restringido en produccion.                                                  |
| API9 Inventario     | OK        | Spec OpenAPI 3.0 servida desde `/docs/openapi`; versionado bajo `/api/v1`.                                        |
| API10 Consumo APIs  | OK        | Cache de HIBP en MariaDB, rate limit explicito en VirusTotal, timeouts duros de 10s en cURL.                      |

---

## 5. MAPEO OWASP TOP 10 (2021)

| ID                                | Estado | Comentario                                                          |
| --------------------------------- | ------ | ------------------------------------------------------------------- |
| A01 Broken Access Control         | OK     | JwtAuthFilter + ownership por usuario en cada item.                 |
| A02 Cryptographic Failures        | OK     | Argon2id en cliente, AES-256-GCM en blobs, hash_equals en login.    |
| A03 Injection                     | OK     | Query Builder de CI4 con bindings en todos los modelos.             |
| A04 Insecure Design               | OK     | Modelo zero-knowledge documentado; no hay reseteo de master password. |
| A05 Security Misconfiguration     | OK     | Cabeceras endurecidas; CSP base por defecto self.                   |
| A06 Vulnerable Components         | OK     | `composer audit` sin avisos a 2026-06-05.                           |
| A07 Identification/Auth Failures  | OK     | TOTP opcional, lockout via Shield.                                  |
| A08 Software/Data Integrity       | OK     | Composer lock subido a git; integridad JWT validada en filtro.      |
| A09 Logging Failures              | OK     | Tabla `audit_logs` registra login/registro con IP, UA y status.     |
| A10 SSRF                          | OK     | Ver API7.                                                           |

---

## 6. HALLAZGOS ACEPTADOS

| Hallazgo                                                | Justificacion                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Access-Control-Allow-Origin: http://localhost:8100`    | Necesario para Ionic en desarrollo; produccion sobreescribe a `https://argos.example.com`.                     |
| `Information Disclosure - Suspicious Comments` en Swagger UI | Generado por la libreria de Swagger UI servida desde CDN; no afecta a la API real.                       |
| Cookies de Shield sin `Secure` en entorno DDEV          | DDEV expone HTTPS local autofirmado; la flag se activa en produccion automaticamente cuando `APP_ENV=production`. |

---

## 7. RECOMENDACIONES PARA SIGUIENTES SPRINTS

1. Migrar de JWT plano a JWT con refresh token corto + rotacion, hoy
   solo se firma un access token de hasta 24h.
2. Anadir un job nocturno en n8n que ejecute `zap-api-scan.py` contra
   el entorno de staging y suba el JSON a un bucket privado para
   tracking de regresiones.
3. Habilitar la regla 40044 (Server-Side Template Injection) de ZAP en
   modo "Insane" cuando el endpoint de noticias acepte filtros de texto
   libre (todavia no implementado).
4. Integrar `composer audit` en el pipeline de CI antes de mergear a
   `develop`.
5. Anadir tests de integracion con base de datos para los flujos de
   login completos (cubrir ataques de fuerza bruta y lockout de Shield).

---

## 8. EVIDENCIAS

- `docs/security/zap-baseline.conf` - configuracion declarativa del
  escaneo baseline (reglas suprimidas + falsos positivos confirmados).
- HTML/JSON generados por ZAP se subiran al bucket privado de
  evidencias en cuanto se conecte la cuenta de almacenamiento del
  cliente. Hasta entonces se generan localmente con los comandos de la
  seccion 2.1.

---

**Conclusion:** el backend de ARGOS supera la auditoria automatizada de
OWASP ZAP en el estado actual del codigo. No quedan hallazgos high ni
medium activos. Los riesgos residuales estan documentados, aceptados o
con accion programada en los siguientes sprints.
