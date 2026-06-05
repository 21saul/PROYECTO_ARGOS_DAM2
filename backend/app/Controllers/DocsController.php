<?php
/**
 * DOCS CONTROLLER
 *
 * RESUMEN: SIRVE LA DOCUMENTACION INTERACTIVA DE LA API REST DE
 * ARGOS. EXPONE LA ESPECIFICACION OPENAPI 3.0 EN FORMATO YAML Y
 * LA INTERFAZ SWAGGER UI RENDERIZADA DESDE CDN.
 *
 * LOGICA DE NEGOCIO:
 * - /docs            DEVUELVE HTML CON SWAGGER UI (CSS + JS DE UN CDN)
 * - /docs/openapi    DEVUELVE EL YAML DESDE backend/public/openapi.yaml
 *
 * AMBOS ENDPOINTS SON PUBLICOS PORQUE LA SPEC NO CONTIENE NINGUN
 * SECRETO Y EL EQUIPO DE FRONTEND LA NECESITA SIN AUTENTICAR.
 *
 * RELACIONES:
 * - backend/public/openapi.yaml (FUENTE UNICA DE LA VERDAD)
 * - Config\Routes (REGISTRO DE LAS RUTAS PUBLICAS /docs Y /docs/openapi)
 */
namespace App\Controllers;

// IMPORTACION DE LA INTERFAZ DE RESPUESTA HTTP DE CI4
use CodeIgniter\HTTP\ResponseInterface;

class DocsController extends BaseController
{
    // SIRVE LA PAGINA HTML QUE EMBEBE SWAGGER UI DESDE CDN
    public function index(): string
    {
        // CONSTRUYE LA URL ABSOLUTA AL YAML SERVIDO POR EL MISMO BACKEND
        $specUrl = site_url('docs/openapi');

        // DEVUELVE UN HTML AUTOCONTENIDO QUE CARGA SWAGGER UI 5
        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>ARGOS API - Swagger UI</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css">
    <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/favicon-32x32.png" sizes="32x32">
    <style>
        body { margin: 0; background: #fafafa; }
        .topbar { background: #111827; padding: 14px 22px; color: #fff; font-family: system-ui, sans-serif; }
        .topbar strong { color: #38BDF8; letter-spacing: 0.04em; }
    </style>
</head>
<body>
    <div class="topbar"><strong>ARGOS</strong> &mdash; Documentacion OpenAPI 3.0</div>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            window.ui = SwaggerUIBundle({
                url: '{$specUrl}',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: 'StandaloneLayout',
                persistAuthorization: true,
                tryItOutEnabled: true
            });
        };
    </script>
</body>
</html>
HTML;
    }

    // DEVUELVE EL CONTENIDO DEL YAML DE LA ESPECIFICACION OPENAPI
    public function spec(): ResponseInterface
    {
        // RUTA ABSOLUTA AL YAML DENTRO DE LA CARPETA public DEL BACKEND
        $path = FCPATH . 'openapi.yaml';

        // SI EL ARCHIVO NO EXISTE DEVUELVE 404 CON EL ENVELOPE ESTANDAR
        if (!is_file($path)) {
            return $this->response->setStatusCode(404)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'SPEC_NOT_FOUND',
                    'message' => 'La especificacion OpenAPI no esta disponible',
                ],
            ]);
        }

        // LEE EL CONTENIDO DEL YAML Y LO DEVUELVE CON EL MIME APROPIADO
        return $this->response
            ->setHeader('Content-Type', 'application/yaml; charset=utf-8')
            ->setHeader('Cache-Control', 'public, max-age=300')
            ->setBody(file_get_contents($path));
    }
}
