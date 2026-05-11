<?php
/**
 * NEWS CONTROLLER
 *
 * RESUMEN: GESTIONA EL PANEL DE NOTICIAS DE CIBERSEGURIDAD Y
 * ALERTAS CVE. SIRVE EL CONTENIDO DE news_cache (POBLADO POR
 * LOS WORKFLOWS DE N8N) A LA APLICACION MOVIL.
 *
 * LOGICA DE NEGOCIO: TRES ENDPOINTS COMPLEMENTARIOS. EL LISTADO
 * PAGINADO ALIMENTA LAS CARDS DE LA PANTALLA DE NOTICIAS. EL DE
 * ESTADISTICAS ALIMENTA EL BANNER SUPERIOR DEL PANEL. EL DE
 * BREAKING DEVUELVE LA NOTICIA CRITICA MAS RECIENTE PARA EL
 * HERO CARD ANIMADO.
 *
 * ENDPOINTS:
 * - GET /api/v1/news               LISTADO PAGINADO
 * - GET /api/v1/news/stats         ESTADISTICAS DIARIAS
 * - GET /api/v1/news/breaking      NOTICIA CRITICA RECIENTE
 *
 * RELACIONES:
 * - NewsModel (PERSISTENCIA)
 * - JwtAuthFilter (AUTENTICACION)
 */
namespace App\Controllers\Api\V1;

// IMPORTACION DEL CONTROLADOR BASE DE CI4
use App\Controllers\BaseController;

// IMPORTACION DEL MODELO DE NOTICIAS
use App\Models\NewsModel;

// IMPORTACION DE LA INTERFAZ DE RESPUESTA HTTP DE CI4
use CodeIgniter\HTTP\ResponseInterface;

class NewsController extends BaseController
{
    // INSTANCIA DEL MODELO DE NOTICIAS
    private NewsModel $newsModel;

    // CATEGORIAS PERMITIDAS PARA EL FILTRO
    private const VALID_CATEGORIES = ['cve', 'phishing', 'breach', 'resource'];

    // SEVERIDADES PERMITIDAS PARA EL FILTRO
    private const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

    // CONSTRUCTOR QUE INYECTA EL MODELO
    public function __construct()
    {
        $this->newsModel = new NewsModel();
    }

    // LISTA NOTICIAS PAGINADAS Y FILTRABLES
    public function index(): ResponseInterface
    {
        // RECOGE LOS PARAMETROS DEL QUERY STRING
        $category = $this->request->getGet('category');
        $severity = $this->request->getGet('severity');
        $page = max(1, (int) ($this->request->getGet('page') ?? 1));
        $limit = min(50, max(1, (int) ($this->request->getGet('limit') ?? 20)));

        // VALIDA CATEGORIA SI VIENE
        if ($category !== null && !in_array($category, self::VALID_CATEGORIES, true)) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'INVALID_CATEGORY',
                    'message' => 'Categoria invalida',
                ],
            ]);
        }

        // VALIDA SEVERIDAD SI VIENE
        if ($severity !== null && !in_array($severity, self::VALID_SEVERITIES, true)) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'INVALID_SEVERITY',
                    'message' => 'Severidad invalida',
                ],
            ]);
        }

        // CALCULA EL OFFSET A PARTIR DE LA PAGINA Y EL LIMITE
        $offset = ($page - 1) * $limit;

        // RECUPERA LAS NOTICIAS PAGINADAS Y EL TOTAL
        $items = $this->newsModel->findPaginated($category, $severity, $limit, $offset);
        $total = $this->newsModel->countFiltered($category, $severity);

        // DEVUELVE LA LISTA CON METADATOS DE PAGINACION
        return $this->response->setJSON([
            'success' => true,
            'data' => [
                'items' => $items,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => (int) ceil($total / $limit),
                ],
                'filters' => [
                    'category' => $category,
                    'severity' => $severity,
                ],
            ],
            'error' => null,
        ]);
    }

    // DEVUELVE ESTADISTICAS DEL DIA PARA EL BANNER
    public function stats(): ResponseInterface
    {
        // RECUPERA LAS ESTADISTICAS AGREGADAS DEL DIA
        $stats = $this->newsModel->dailyStats();

        // DEVUELVE LAS ESTADISTICAS EN EL FORMATO ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => $stats,
            'error' => null,
        ]);
    }

    // DEVUELVE LA NOTICIA CRITICA MAS RECIENTE (BREAKING)
    public function breaking(): ResponseInterface
    {
        // BUSCA LA NOTICIA CRITICA MAS RECIENTE
        $breaking = $this->newsModel->findBreaking();

        // DEVUELVE EL HERO CARD EN EL FORMATO ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => $breaking,
            'error' => null,
        ]);
    }
}
