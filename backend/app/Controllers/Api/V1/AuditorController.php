<?php
/**
 * AUDITOR CONTROLLER
 *
 * RESUMEN: GESTIONA LOS ENDPOINTS DEL MODULO AUDITOR: CONSULTA
 * A HAVE I BEEN PWNED PARA VERIFICAR CONTRASENAS FILTRADAS Y
 * REGISTRO DEL HISTORICO DEL PRIVACY SCORE DEL USUARIO.
 *
 * LOGICA DE NEGOCIO: LAS CONSULTAS A HIBP SE HACEN POR PREFIJO
 * DE HASH SHA-1 (5 CHARS) PARA PRESERVAR LA PRIVACIDAD DEL
 * USUARIO MEDIANTE EL MODELO K-ANONYMITY. EL PRIVACY SCORE SE
 * GUARDA CON SUS TRES SUBPUNTUACIONES (IDENTIDAD, CONTRASENAS,
 * DISPOSITIVO) PARA QUE LA INTERFAZ PUEDA MOSTRAR EVOLUCION
 * SEGMENTADA.
 *
 * ENDPOINTS:
 * - GET  /api/v1/auditor/hibp/{prefix}   CONSULTA HIBP K-ANON
 * - POST /api/v1/auditor/score           GUARDA SCORE DEL DIA
 * - GET  /api/v1/auditor/score/history   HISTORICO 8 SEMANAS
 * - GET  /api/v1/auditor/score/latest    ULTIMO SCORE
 *
 * RELACIONES:
 * - HibpService (LOGICA DE CONSULTA A HIBP)
 * - PrivacyScoreHistoryModel (PERSISTENCIA DEL HISTORICO)
 * - JwtAuthFilter (AUTENTICACION)
 */
namespace App\Controllers\Api\V1;

// IMPORTACION DEL CONTROLADOR BASE DE CI4
use App\Controllers\BaseController;

// IMPORTACION DEL SERVICIO DE HIBP
use App\Services\HibpService;

// IMPORTACION DEL MODELO DEL HISTORICO DE SCORE
use App\Models\PrivacyScoreHistoryModel;

// IMPORTACION DE LA INTERFAZ DE RESPUESTA HTTP DE CI4
use CodeIgniter\HTTP\ResponseInterface;

class AuditorController extends BaseController
{
    // INSTANCIA DEL SERVICIO DE HIBP
    private HibpService $hibpService;

    // INSTANCIA DEL MODELO DE HISTORICO
    private PrivacyScoreHistoryModel $historyModel;

    // CONSTRUCTOR QUE INYECTA LOS SERVICIOS Y MODELOS
    public function __construct()
    {
        $this->hibpService = new HibpService();
        $this->historyModel = new PrivacyScoreHistoryModel();
    }

    // CONSULTA HIBP CON UN PREFIJO DE 5 CHARS DEL HASH SHA-1
    public function hibpQuery(string $prefix): ResponseInterface
    {
        // CONVIERTE EL PREFIJO A MAYUSCULAS
        $prefix = strtoupper($prefix);

        // VALIDA EL FORMATO DEL PREFIJO
        if (!preg_match('/^[0-9A-F]{5}$/', $prefix)) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'INVALID_PREFIX',
                    'message' => 'El prefijo debe ser hexadecimal de 5 caracteres',
                ],
            ]);
        }

        // CONSULTA EL SERVICIO CON CACHE INCORPORADA
        try {
            $result = $this->hibpService->queryPrefix($prefix);
        } catch (\Exception $e) {
            return $this->response->setStatusCode(502)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'HIBP_ERROR',
                    'message' => 'Error al consultar HIBP',
                    'details' => $e->getMessage(),
                ],
            ]);
        }

        // DEVUELVE LA RESPUESTA AL CLIENTE
        return $this->response->setJSON([
            'success' => true,
            'data' => $result,
            'error' => null,
        ]);
    }

    // GUARDA UN NUEVO REGISTRO DEL PRIVACY SCORE DEL USUARIO
    public function saveScore(): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // RECOGE LOS CAMPOS DEL CUERPO JSON
        $score = $this->request->getJsonVar('score');
        $identityScore = $this->request->getJsonVar('identity_score');
        $passwordsScore = $this->request->getJsonVar('passwords_score');
        $deviceScore = $this->request->getJsonVar('device_score');

        // VALIDA QUE LLEGUEN TODOS LOS SCORES
        if ($score === null || $identityScore === null
            || $passwordsScore === null || $deviceScore === null) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'MISSING_FIELDS',
                    'message' => 'Faltan campos del Privacy Score',
                ],
            ]);
        }

        // PREPARA LOS DATOS PARA INSERCION
        $data = [
            'user_id' => $userId,
            'score' => (int) $score,
            'identity_score' => (int) $identityScore,
            'passwords_score' => (int) $passwordsScore,
            'device_score' => (int) $deviceScore,
            'recorded_at' => date('Y-m-d H:i:s'),
        ];

        // INSERTA EL REGISTRO EN LA BASE DE DATOS
        $id = $this->historyModel->insert($data);

        // SI LA VALIDACION FALLO DEVUELVE 422
        if ($id === false) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Datos invalidos',
                    'details' => $this->historyModel->errors(),
                ],
            ]);
        }

        // DEVUELVE CONFIRMACION CON EL ID GENERADO
        return $this->response->setStatusCode(201)->setJSON([
            'success' => true,
            'data' => [
                'id' => $id,
                'recorded_at' => $data['recorded_at'],
            ],
            'error' => null,
        ]);
    }

    // DEVUELVE EL HISTORICO DEL USUARIO DE LAS ULTIMAS 8 SEMANAS
    public function scoreHistory(): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // RECOGE EL NUMERO DE SEMANAS OPCIONAL (DEFAULT 8)
        $weeks = (int) ($this->request->getGet('weeks') ?? 8);

        // LIMITA EL RANGO MAXIMO A 52 SEMANAS PARA EVITAR ABUSO
        if ($weeks < 1) $weeks = 8;
        if ($weeks > 52) $weeks = 52;

        // RECUPERA EL HISTORICO DEL USUARIO
        $history = $this->historyModel->findRecentByUser($userId, $weeks);

        // DEVUELVE LA LISTA EN EL FORMATO ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => [
                'weeks' => $weeks,
                'history' => $history,
            ],
            'error' => null,
        ]);
    }

    // DEVUELVE EL ULTIMO SCORE REGISTRADO DEL USUARIO
    public function scoreLatest(): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // RECUPERA EL ULTIMO REGISTRO
        $latest = $this->historyModel->findLatestByUser($userId);

        // DEVUELVE EL DATO EN EL FORMATO ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => $latest,
            'error' => null,
        ]);
    }
}
