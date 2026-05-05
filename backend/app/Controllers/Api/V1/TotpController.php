<?php
/**
 * TOTP CONTROLLER
 *
 * RESUMEN: GESTIONA EL CICLO DE VIDA DEL SEGUNDO FACTOR
 * DE AUTENTICACION POR TOTP DEL USUARIO AUTENTICADO.
 *
 * LOGICA DE NEGOCIO: EL FLUJO DE ALTA TIENE TRES PASOS.
 * SETUP GENERA UN SECRETO Y UNA URI DE QR PARA EL CLIENTE.
 * VERIFY VALIDA EL PRIMER CODIGO INTRODUCIDO POR EL USUARIO
 * Y LO ACTIVA. DISABLE PERMITE DESACTIVARLO MEDIANTE
 * VALIDACION DE OTRO CODIGO VALIDO.
 *
 * ENDPOINTS:
 * - POST /api/v1/totp/setup    GENERA SECRETO Y URI QR
 * - POST /api/v1/totp/verify   VALIDA CODIGO Y ACTIVA 2FA
 * - POST /api/v1/totp/disable  DESACTIVA EL 2FA
 *
 * RELACIONES:
 * - TotpService (LOGICA DE NEGOCIO)
 * - SHIELD (TABLA auth_identities)
 */
namespace App\Controllers\Api\V1;

// IMPORTACION DEL CONTROLADOR BASE DE CI4
use App\Controllers\BaseController;

// IMPORTACION DEL SERVICIO QUE ENCAPSULA LA LOGICA TOTP
use App\Services\TotpService;

// IMPORTACION DE LA INTERFAZ DE RESPUESTA HTTP DE CI4
use CodeIgniter\HTTP\ResponseInterface;

class TotpController extends BaseController
{
    // INSTANCIA DEL SERVICIO TOTP REUTILIZABLE
    private TotpService $totpService;

    // CONSTRUCTOR QUE INYECTA EL SERVICIO TOTP
    public function __construct()
    {
        $this->totpService = new TotpService();
    }

    // GENERA UN NUEVO SECRETO Y DEVUELVE LA URI DEL QR
    public function setup(): ResponseInterface
    {
        // OBTIENE EL USUARIO AUTENTICADO MEDIANTE SHIELD
        $user = auth()->user();

        // VALIDA QUE EXISTA UN USUARIO LOGUEADO
        if (!$user) {
            return $this->failUnauthorized();
        }

        // GENERA UN SECRETO ALEATORIO BASE32 DE 160 BITS
        $secret = $this->totpService->generateSecret();

        // CONSTRUYE LA URI otpauth PARA RENDERIZAR COMO QR
        $qrUri = $this->totpService->buildQrUri($user->email, $secret);

        // GUARDA EL SECRETO EN LA AUTH_IDENTITY DEL USUARIO
        $db = \Config\Database::connect();
        $db->table('auth_identities')
           ->where('user_id', $user->id)
           ->where('type', 'email_password')
           ->update([
               'totp_secret' => $secret,
               'totp_enabled' => 0,
           ]);

        // DEVUELVE LA URI Y EL SECRETO EN BASE32 AL CLIENTE
        return $this->response->setJSON([
            'success' => true,
            'data' => [
                'qr_uri' => $qrUri,
                'secret' => $secret,
            ],
            'error' => null,
        ]);
    }

    // VERIFICA UN CODIGO DE 6 DIGITOS Y ACTIVA EL 2FA
    public function verify(): ResponseInterface
    {
        // OBTIENE EL USUARIO AUTENTICADO MEDIANTE SHIELD
        $user = auth()->user();

        // VALIDA QUE EXISTA UN USUARIO LOGUEADO
        if (!$user) {
            return $this->failUnauthorized();
        }

        // RECOGE EL CODIGO DEL CUERPO DE LA PETICION
        $code = $this->request->getJsonVar('code');

        // VALIDA QUE EL CODIGO LLEGUE Y SEA NUMERICO
        if (!$code || !preg_match('/^\d{6}$/', $code)) {
            return $this->failValidationError('CODIGO INVALIDO');
        }

        // RECUPERA EL SECRETO PREVIAMENTE GUARDADO
        $db = \Config\Database::connect();
        $identity = $db->table('auth_identities')
            ->where('user_id', $user->id)
            ->where('type', 'email_password')
            ->get()
            ->getRow();

        // VALIDA QUE EXISTA UN SECRETO YA GENERADO
        if (!$identity || !$identity->totp_secret) {
            return $this->failValidationError('SECRETO NO GENERADO');
        }

        // VERIFICA EL CODIGO CONTRA EL SECRETO ALMACENADO
        $valid = $this->totpService->verifyCode($identity->totp_secret, $code);

        // SI EL CODIGO ES INVALIDO DEVUELVE ERROR
        if (!$valid) {
            return $this->failValidationError('CODIGO NO VALIDO');
        }

        // MARCA EL TOTP COMO ACTIVADO PARA ESE USUARIO
        $db->table('auth_identities')
           ->where('user_id', $user->id)
           ->where('type', 'email_password')
           ->update(['totp_enabled' => 1]);

        // RESPONDE INDICANDO EL EXITO DE LA ACTIVACION
        return $this->response->setJSON([
            'success' => true,
            'data' => ['enabled' => true],
            'error' => null,
        ]);
    }

    // DESACTIVA EL 2FA TRAS VERIFICAR UN CODIGO VALIDO
    public function disable(): ResponseInterface
    {
        // OBTIENE EL USUARIO AUTENTICADO MEDIANTE SHIELD
        $user = auth()->user();

        // VALIDA QUE EXISTA UN USUARIO LOGUEADO
        if (!$user) {
            return $this->failUnauthorized();
        }

        // RECOGE EL CODIGO DEL CUERPO DE LA PETICION
        $code = $this->request->getJsonVar('code');

        // VALIDA QUE EL CODIGO LLEGUE Y SEA NUMERICO
        if (!$code || !preg_match('/^\d{6}$/', $code)) {
            return $this->failValidationError('CODIGO INVALIDO');
        }

        // RECUPERA EL SECRETO PARA VERIFICAR
        $db = \Config\Database::connect();
        $identity = $db->table('auth_identities')
            ->where('user_id', $user->id)
            ->where('type', 'email_password')
            ->get()
            ->getRow();

        // VERIFICA EL CODIGO ANTES DE PERMITIR DESACTIVAR
        $valid = $this->totpService->verifyCode($identity->totp_secret, $code);

        // SI EL CODIGO ES INVALIDO DEVUELVE ERROR
        if (!$valid) {
            return $this->failValidationError('CODIGO NO VALIDO');
        }

        // LIMPIA EL SECRETO Y MARCA EL TOTP COMO INACTIVO
        $db->table('auth_identities')
           ->where('user_id', $user->id)
           ->where('type', 'email_password')
           ->update([
               'totp_secret' => null,
               'totp_enabled' => 0,
           ]);

        // RESPONDE INDICANDO EL EXITO DE LA DESACTIVACION
        return $this->response->setJSON([
            'success' => true,
            'data' => ['enabled' => false],
            'error' => null,
        ]);
    }
}
