<?php
/**
 * JWT AUTH FILTER
 *
 * RESUMEN: FILTRO DE AUTENTICACION QUE VALIDA EL TOKEN JWT
 * PRESENTE EN EL HEADER Authorization DE LAS PETICIONES A
 * ENDPOINTS PROTEGIDOS.
 *
 * LOGICA DE NEGOCIO: COMPRUEBA QUE EL HEADER EXISTA, QUE
 * EMPIECE POR "Bearer ", QUE EL TOKEN SEA VALIDO Y NO HAYA
 * EXPIRADO. SI TODO ES CORRECTO, INYECTA EL user_id EN LA
 * REQUEST PARA QUE LOS CONTROLADORES PUEDAN USARLO. SI FALLA,
 * RESPONDE 401 INMEDIATAMENTE.
 *
 * RELACIONES:
 * - SE REGISTRA EN app/Config/Filters.php
 * - SE APLICA A LOS GRUPOS DE RUTAS PROTEGIDAS DE LA API
 */
namespace App\Filters;

// IMPORTACION DEL CONTRATO DE FILTROS DE CI4
use CodeIgniter\Filters\FilterInterface;

// IMPORTACION DE LAS INTERFACES DE REQUEST Y RESPONSE
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

// IMPORTACION DEL MANAGER DE JWT DE SHIELD
use CodeIgniter\Shield\Authentication\JWTManager;

class JwtAuthFilter implements FilterInterface
{
    // METODO QUE SE EJECUTA ANTES DE QUE LA REQUEST LLEGUE AL CONTROLADOR
    public function before(RequestInterface $request, $arguments = null)
    {
        // RECUPERA EL HEADER Authorization DE LA REQUEST
        $authHeader = $request->getHeaderLine('Authorization');

        // VALIDA QUE EL HEADER EXISTA Y EMPIECE POR Bearer
        if (empty($authHeader) || !preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON([
                    'success' => false,
                    'data' => null,
                    'error' => [
                        'code' => 'NO_TOKEN',
                        'message' => 'Token de autenticacion ausente o malformado',
                    ],
                ]);
        }

        // EXTRAE EL TOKEN BRUTO DEL HEADER
        $token = $matches[1];

        // INSTANCIA EL JWT MANAGER DE SHIELD
        $manager = service('jwtmanager');

        // INTENTA PARSEAR Y VALIDAR EL TOKEN
        try {
            $payload = $manager->parse($token);
        } catch (\Exception $e) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON([
                    'success' => false,
                    'data' => null,
                    'error' => [
                        'code' => 'INVALID_TOKEN',
                        'message' => 'Token invalido o expirado',
                    ],
                ]);
        }

        // EXTRAE EL SUB DEL PAYLOAD (CONTIENE EL user_id)
        $userId = $payload->sub ?? null;

        // VALIDA QUE EL SUB ESTE PRESENTE
        if (!$userId) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON([
                    'success' => false,
                    'data' => null,
                    'error' => [
                        'code' => 'INVALID_PAYLOAD',
                        'message' => 'Token sin sujeto valido',
                    ],
                ]);
        }

        // INYECTA EL user_id EN LA REQUEST PARA USO POSTERIOR
        $request->user_id = (int) $userId;
        $request->jwt_payload = $payload;
    }

    // METODO QUE SE EJECUTA TRAS LA RESPUESTA (NO ES NECESARIO AQUI)
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // NO HAY POST-PROCESAMIENTO PARA ESTE FILTRO
    }
}
