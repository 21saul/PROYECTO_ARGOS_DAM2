# CONFIGURACION INICIAL DE N8N PARA ARGOS

## 1. Acceso

URL: http://localhost:5679

NOTA SOBRE EL PUERTO: aunque n8n escucha internamente en 5678,
el `docker-compose.yml` lo mapea al puerto **5679** del host
(`127.0.0.1:5679:5678`) para evitar colisiones con otros
servicios locales. Usa siempre `http://localhost:5679` en el
navegador.

Autenticacion HTTP basica (definida en `docker-compose.yml`):

- Usuario: `admin`
- Password: `argos_n8n_local`

NOTA: La primera vez que accedas, n8n te pedira ademas crear
una cuenta de propietario (owner) interna. Usa cualquier email
y password que recuerdes. Esa cuenta es local y solo existe en
tu Docker (persiste en `automation/n8n/data/`, que esta
gitignored).

## 2. Importar los workflows

Una vez dentro:

1. En el menu izquierdo: Workflows
2. Boton "+" arriba a la derecha -> Import from File
3. Selecciona el archivo:
   `/home/ddev/www/ARGOS/automation/n8n/workflows/nvd-ingest.json`
4. Repite con `rss-ingest.json`

Tras importar veras los 2 workflows en estado INACTIVE (gris).

## 3. Configurar la credencial MySQL

Antes de poder activar los workflows hay que crear la credencial
de conexion a MariaDB:

1. Menu izquierdo: Credentials
2. Boton "+ Add credential"
3. Tipo: MySQL
4. Rellena:
   - Host: `ddev-argos-db`  (nombre del contenedor de ddev, NO
     `host.docker.internal` — el puerto host de ddev solo escucha
     en 127.0.0.1 y desde otro contenedor no es alcanzable)
   - Database: `db`
   - User: `db`
   - Password: `db`
   - Port: `3306`  (puerto INTERNO del contenedor de ddev, no el
     puerto expuesto al host)
   - SSL: Disabled

   NOTA DE RED: el `docker-compose.yml` conecta el contenedor
   `argos-n8n` a la red `ddev_default` (external) para que pueda
   resolver `ddev-argos-db` por DNS interno. Por tanto debes
   tener ddev arrancado ANTES de levantar n8n.
5. Boton "Test connection" -> debe decir "Connection successful"
6. Boton "Save" -> ponle nombre `ARGOS MariaDB`

## 4. Asignar la credencial a los nodos MySQL

1. Abre el workflow "ARGOS - Ingesta de CVEs del NVD"
2. Click en el nodo "Insert news_cache" (el ultimo a la derecha)
3. En el campo Credential, selecciona `ARGOS MariaDB`
4. Boton Save (esquina superior derecha del workflow)
5. Repite con el workflow "ARGOS - Ingesta de feeds RSS"

## 5. Activar los workflows

En la cabecera de cada workflow hay un toggle ACTIVE/INACTIVE.
Cambialo a ACTIVE. n8n empezara a ejecutarlos cada 24 horas
automaticamente.

## 6. Forzar una ejecucion manual ahora (opcional)

Para no esperar 24h:

1. Abre el workflow
2. Boton "Execute Workflow" (esquina superior derecha)
3. Espera a que termine la ejecucion (puede tardar 30-60 segundos)
4. Verifica el resultado en cada nodo (deben tener un check verde)

## 7. Verificar que se han insertado datos

Desde otra terminal:

```bash
cd /home/ddev/www/ARGOS/backend
ddev mysql -e "SELECT COUNT(*) FROM news_cache;"
ddev mysql -e "SELECT category, source, title FROM news_cache ORDER BY created_at DESC LIMIT 5;"
```

Deben aparecer las nuevas filas.
