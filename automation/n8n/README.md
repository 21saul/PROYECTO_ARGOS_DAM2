# AUTOMATIZACION CON N8N

## Arranque

cd /home/ddev/www/ARGOS/automation/n8n
docker compose up -d

## Acceso

URL: http://localhost:5679
Usuario: admin
Password: argos_n8n_local

## Conexion a MariaDB

En los nodos MySQL de n8n usar:
- Host: host.docker.internal
- Puerto: el del ddev (consultar con `ddev describe`)
- Base de datos: db
- Usuario: db
- Password: db

## Workflows incluidos

- workflows/nvd-ingest.json: Consume NVD API 2.0 cada 24h
- workflows/rss-ingest.json: Consume feeds RSS cada 24h

## Importar workflows

Una vez n8n este arrancado, importar los JSON desde la UI:
1. Login en http://localhost:5679
2. Workflows -> Import from File -> Seleccionar el JSON

## Parar

docker compose down
