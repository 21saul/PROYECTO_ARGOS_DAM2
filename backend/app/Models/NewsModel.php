<?php
/**
 * NEWS MODEL
 *
 * RESUMEN: MODELO DE PERSISTENCIA QUE GESTIONA EL ACCESO A LA
 * TABLA news_cache DONDE SE ALMACENAN LAS NOTICIAS DE
 * CIBERSEGURIDAD Y CVES CRITICOS INGESTADOS POR LOS WORKFLOWS
 * DE N8N.
 *
 * LOGICA DE NEGOCIO: ESTE MODELO ES DE SOLO LECTURA DESDE EL
 * BACKEND DE ARGOS. LA ESCRITURA SE REALIZA EXCLUSIVAMENTE
 * DESDE LOS WORKFLOWS DE N8N CADA 24 HORAS.
 *
 * RELACIONES:
 * - NewsController (CONSUMIDOR DIRECTO)
 */
namespace App\Models;

// IMPORTACION DE LA CLASE BASE DE MODELOS DE CI4
use CodeIgniter\Model;

class NewsModel extends Model
{
    // TABLA SOBRE LA QUE OPERA EL MODELO
    protected $table = 'news_cache';

    // CLAVE PRIMARIA DE LA TABLA
    protected $primaryKey = 'id';

    // TIPO DE DATO DE RETORNO POR DEFECTO
    protected $returnType = 'array';

    // NO USAR TIMESTAMPS AUTOMATICOS (LOS RELLENA N8N)
    protected $useTimestamps = false;

    // CAMPOS QUE EL MODELO PUEDE LEER
    protected $allowedFields = [
        'category', 'source', 'title', 'description', 'url',
        'cve_id', 'cvss_score', 'severity', 'affected_product',
        'published_at', 'created_at',
    ];

    // RECUPERA NOTICIAS PAGINADAS CON FILTROS OPCIONALES
    public function findPaginated(
        ?string $category = null,
        ?string $severity = null,
        int $limit = 20,
        int $offset = 0
    ): array {
        // CONSTRUYE LA QUERY BASE CON ORDEN POR FECHA DESC
        $builder = $this->orderBy('published_at', 'DESC');

        // APLICA FILTRO POR CATEGORIA SI VIENE
        if ($category !== null) {
            $builder = $builder->where('category', $category);
        }

        // APLICA FILTRO POR SEVERIDAD SI VIENE
        if ($severity !== null) {
            $builder = $builder->where('severity', $severity);
        }

        // EJECUTA LA QUERY CON PAGINACION
        return $builder->findAll($limit, $offset);
    }

    // CUENTA TOTAL DE REGISTROS CON LOS MISMOS FILTROS
    public function countFiltered(
        ?string $category = null,
        ?string $severity = null
    ): int {
        // CONSTRUYE LA QUERY DE CONTEO
        $builder = $this->builder();

        if ($category !== null) {
            $builder->where('category', $category);
        }
        if ($severity !== null) {
            $builder->where('severity', $severity);
        }

        return $builder->countAllResults();
    }

    // RECUPERA LA NOTICIA DESTACADA (BREAKING) MAS RECIENTE
    public function findBreaking(): ?array
    {
        return $this->where('severity', 'critical')
                    ->orderBy('published_at', 'DESC')
                    ->first();
    }

    // CALCULA ESTADISTICAS DEL DIA PARA EL BANNER SUPERIOR
    public function dailyStats(): array
    {
        // FECHA DE INICIO DEL DIA ACTUAL
        $startOfDay = date('Y-m-d 00:00:00');

        // CONEXION DIRECTA PARA CONSULTAS AGREGADAS
        $db = \Config\Database::connect();

        // CVES PUBLICADOS HOY
        $cvesToday = $db->table('news_cache')
            ->where('category', 'cve')
            ->where('published_at >=', $startOfDay)
            ->countAllResults();

        // CVSS MEDIO DE LOS CVES DEL DIA
        $cvssAvg = $db->table('news_cache')
            ->selectAvg('cvss_score', 'avg')
            ->where('category', 'cve')
            ->where('published_at >=', $startOfDay)
            ->get()
            ->getRow();

        // FUENTES ACTIVAS EN LAS ULTIMAS 24H
        $sourcesActive = $db->table('news_cache')
            ->select('source')
            ->distinct()
            ->where('created_at >=', date('Y-m-d H:i:s', strtotime('-24 hours')))
            ->get()
            ->getResultArray();

        // DEVUELVE LAS ESTADISTICAS EN FORMATO ESTRUCTURADO
        return [
            'cves_today' => $cvesToday,
            'cvss_average' => round((float) ($cvssAvg->avg ?? 0), 1),
            'sources_active' => count($sourcesActive),
            'source_list' => array_column($sourcesActive, 'source'),
        ];
    }
}
