<?php
/**
 * AUTH CONTROLLER
 *
 * RESUMEN: CONTROLA EL FLUJO DE REGISTRO Y LOGIN DEL USUARIO
 * BAJO EL MODELO ZERO-KNOWLEDGE. NO RECIBE NUNCA LA
 * CONTRASENA MAESTRA EN TEXTO CLARO.
 *
 * LOGICA DE NEGOCIO:
 * - REGISTER: RECIBE email, auth_hash YA DERIVADO EN CLIENTE
 *   CON ARGON2ID, kdf_salt, kdf_params Y EL vault_blob
 *   INICIAL CIFRADO. CREA EL USUARIO EN SHIELD Y ALMACENA
 *   LOS DATOS CRIPTOGRAFICOS.
 * - CHALLENGE: DEVUELVE kdf_salt Y kdf_params DEL USUARIO
 *   PARA QUE EL CLIENTE PUEDA RE-DERIVAR LA CLAVE MAESTRA
 *   ANTES DEL LOGIN.
 * - LOGIN: RECIBE email Y auth_hash. SI COINCIDE CON EL
 *   ALMACENADO, EMITE UN JWT Y DEVUELVE EL vault_blob
 *   CIFRADO PARA QUE EL CLIENTE LO DESCIFRE LOCALMENTE.
 *
 * ENDPOINTS:
 * - POST /api/v1/auth/register
 * - GET  /api/v1/auth/challenge
 * - POST /api/v1/auth/login
 *
 * RELACIONES:
 * - AuthService (LOGICA DE NEGOCIO Y JWT)
 * - SHIELD (TABLAS users Y auth_identities)
 */
namespace App\Controllers\Api\V1;

// IMPORTACION DEL CONTROLADOR BASE DE CI4
use App\Controllers\BaseController;

// IMPORTACION DEL SERVICIO DE AUTENTICACION
use App\Services\AuthService;

// IMPORTACION DE LA INTERFAZ DE RESPUESTA HTTP DE CI4
use CodeIgniter\HTTP\ResponseInterface;

// IMPORTACION DEL MODELO DE USUARIOS DE SHIELD
use CodeIgniter\Shield\Models\UserModel;

// IMPORTACION DE LA ENTIDAD USUARIO DE SHIELD
use CodeIgniter\Shield\Entities\User;

class AuthController extends BaseController
{
    // INSTANCIA DEL SERVICIO DE AUTENTICACION
    private AuthService $authService;

    // CONSTRUCTOR QUE INYECTA EL SERVICIO
    public function __construct()
    {
        $this->authService = new AuthService();
    }

    // ENDPOINT DE REGISTRO ZERO-KNOWLEDGE
    public function register(): ResponseInterface
    {
        // RECOGE EL CUERPO JSON DE LA PETICION
        $email = $this->request->getJsonVar('email');
        $authHash = $this->request->getJsonVar('auth_hash');
        $kdfSalt = $this->request->getJsonVar('kdf_salt');
        $kdfParams = $this->request->getJsonVar('kdf_params');
        $vaultBlob = $this->request->getJsonVar('vault_blob');

        // VALIDA QUE LLEGUEN TODOS LOS CAMPOS OBLIGATORIOS
        if (!$email || !$authHash || !$kdfSalt || !$kdfParams) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'MISSING_FIELDS',
                    'message' => 'Faltan campos obligatorios',
                ],
            ]);
        }

        // VALIDA EL FORMATO BASICO DEL EMAIL
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'INVALID_EMAIL',
                    'message' => 'El email no tiene un formato valido',
                ],
            ]);
        }

        // INSTANCIA EL MODELO DE USUARIOS DE SHIELD
        $userModel = new UserModel();

        // COMPRUEBA QUE EL EMAIL NO ESTE YA REGISTRADO
        $existing = $userModel->findByCredentials(['email' => $email]);
        if ($existing) {
            return $this->response->setStatusCode(409)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'EMAIL_TAKEN',
                    'message' => 'El email ya esta registrado',
                ],
            ]);
        }

        // CREA LA ENTIDAD USUARIO PARA SHIELD
        $user = new User([
            'username' => null,
            'email' => $email,
        ]);

        // ASIGNA EL HASH DERIVADO COMO PASSWORD DE SHIELD
        // SHIELD LO ALMACENA EN auth_identities.secret2 DURANTE save()
        $user->setPassword($authHash);

        // PERSISTE EL USUARIO Y LA IDENTIDAD email_password EN UN SOLO PASO
        $userModel->save($user);

        // RECUPERA EL USUARIO CREADO PARA OBTENER SU ID
        $createdUser = $userModel->findById($userModel->getInsertID());

        // GUARDA LOS DATOS CRIPTOGRAFICOS DIRECTAMENTE
        $db = \Config\Database::connect();
        $db->table('users')
           ->where('id', $createdUser->id)
           ->update([
               'kdf_salt' => $kdfSalt,
               'kdf_algorithm' => 'argon2id',
               'kdf_params' => json_encode($kdfParams),
               'vault_blob' => $vaultBlob,
           ]);

        // GENERA EL JWT PARA EL NUEVO USUARIO
        $token = $this->authService->generateJwt($createdUser->id, $email);

        // REGISTRA EL EVENTO EN audit_logs
        $db->table('audit_logs')->insert([
            'user_id' => $createdUser->id,
            'action' => 'register',
            'ip_address' => $this->request->getIPAddress(),
            'user_agent' => substr($this->request->getUserAgent()->getAgentString(), 0, 255),
            'status' => 'success',
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        // DEVUELVE EL TOKEN JWT Y EL ID DEL USUARIO
        return $this->response->setStatusCode(201)->setJSON([
            'success' => true,
            'data' => [
                'user_id' => $createdUser->id,
                'email' => $email,
                'token' => $token,
            ],
            'error' => null,
        ]);
    }

    // ENDPOINT DE CHALLENGE QUE DEVUELVE LOS PARAMETROS KDF
    public function challenge(): ResponseInterface
    {
        // RECOGE EL EMAIL DEL QUERY STRING
        $email = $this->request->getGet('email');

        // VALIDA QUE EL EMAIL LLEGUE
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'INVALID_EMAIL',
                    'message' => 'Email no valido',
                ],
            ]);
        }

        // BUSCA AL USUARIO POR SU EMAIL EN LA BASE DE DATOS
        $db = \Config\Database::connect();
        $user = $db->table('users')
            ->select('users.id, users.kdf_salt, users.kdf_algorithm, users.kdf_params')
            ->join('auth_identities', 'auth_identities.user_id = users.id')
            ->where('auth_identities.secret', $email)
            ->where('auth_identities.type', 'email_password')
            ->get()
            ->getRow();

        // SI NO EXISTE, DEVUELVE PARAMETROS DUMMY PARA EVITAR
        // FILTRACION DE EXISTENCIA DE USUARIOS POR TIMING
        if (!$user) {
            return $this->response->setJSON([
                'success' => true,
                'data' => [
                    'kdf_salt' => bin2hex(random_bytes(32)),
                    'kdf_algorithm' => 'argon2id',
                    'kdf_params' => [
                        'memory_cost' => 65536,
                        'time_cost' => 3,
                        'parallelism' => 1,
                    ],
                ],
                'error' => null,
            ]);
        }

        // DEVUELVE LOS PARAMETROS REALES DEL USUARIO
        return $this->response->setJSON([
            'success' => true,
            'data' => [
                'kdf_salt' => $user->kdf_salt,
                'kdf_algorithm' => $user->kdf_algorithm,
                'kdf_params' => json_decode($user->kdf_params, true),
            ],
            'error' => null,
        ]);
    }

    // ENDPOINT DE LOGIN ZERO-KNOWLEDGE
    public function login(): ResponseInterface
    {
        // RECOGE EL CUERPO JSON DE LA PETICION
        $email = $this->request->getJsonVar('email');
        $authHash = $this->request->getJsonVar('auth_hash');

        // VALIDA QUE LLEGUEN LOS DOS CAMPOS OBLIGATORIOS
        if (!$email || !$authHash) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'MISSING_FIELDS',
                    'message' => 'Faltan campos obligatorios',
                ],
            ]);
        }

        // INSTANCIA EL MODELO DE USUARIOS DE SHIELD
        $userModel = new UserModel();

        // BUSCA AL USUARIO POR EMAIL EN LAS IDENTIDADES
        $user = $userModel->findByCredentials(['email' => $email]);

        // RECUPERA LA IDENTIDAD email_password DEL USUARIO
        $db = \Config\Database::connect();
        $identity = null;
        if ($user) {
            $identity = $db->table('auth_identities')
                ->where('user_id', $user->id)
                ->where('type', 'email_password')
                ->get()
                ->getRow();
        }

        // SI NO HAY USUARIO O IDENTIDAD DEVUELVE 401 GENERICO
        if (!$user || !$identity) {
            return $this->response->setStatusCode(401)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'INVALID_CREDENTIALS',
                    'message' => 'Credenciales incorrectas',
                ],
            ]);
        }

        // VERIFICA EL HASH RECIBIDO CONTRA EL ALMACENADO
        $valid = $this->authService->verifyAuthHash(
            $identity->secret2,
            password_hash($authHash, PASSWORD_DEFAULT)
        );

        // ALTERNATIVA: USA password_verify SI SHIELD GUARDA EL HASH BCRYPT
        if (!$valid) {
            $valid = password_verify($authHash, $identity->secret2);
        }

        // SI EL HASH NO COINCIDE REGISTRA EL FALLO Y DEVUELVE 401
        if (!$valid) {
            $db->table('audit_logs')->insert([
                'user_id' => $user->id,
                'action' => 'login',
                'ip_address' => $this->request->getIPAddress(),
                'user_agent' => substr($this->request->getUserAgent()->getAgentString(), 0, 255),
                'status' => 'failed',
                'created_at' => date('Y-m-d H:i:s'),
            ]);

            return $this->response->setStatusCode(401)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'INVALID_CREDENTIALS',
                    'message' => 'Credenciales incorrectas',
                ],
            ]);
        }

        // RECUPERA EL VAULT BLOB CIFRADO DEL USUARIO
        $userData = $db->table('users')
            ->select('vault_blob')
            ->where('id', $user->id)
            ->get()
            ->getRow();

        // GENERA EL JWT FIRMADO DE LA SESION
        $token = $this->authService->generateJwt($user->id, $email);

        // REGISTRA EL LOGIN EXITOSO EN audit_logs
        $db->table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => 'login',
            'ip_address' => $this->request->getIPAddress(),
            'user_agent' => substr($this->request->getUserAgent()->getAgentString(), 0, 255),
            'status' => 'success',
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        // DEVUELVE EL TOKEN Y EL VAULT BLOB CIFRADO
        return $this->response->setJSON([
            'success' => true,
            'data' => [
                'user_id' => $user->id,
                'email' => $email,
                'token' => $token,
                'vault_blob' => $userData->vault_blob !== null
                    ? base64_encode($userData->vault_blob)
                    : null,
            ],
            'error' => null,
        ]);
    }
}
