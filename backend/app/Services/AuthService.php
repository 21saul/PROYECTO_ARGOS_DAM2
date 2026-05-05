<?php
/**
 * AUTH SERVICE
 *
 * RESUMEN: SERVICIO QUE ENCAPSULA LA LOGICA DE NEGOCIO DEL
 * REGISTRO Y LOGIN ZERO-KNOWLEDGE Y LA EMISION DE TOKENS JWT.
 *
 * LOGICA DE NEGOCIO: EL SERVIDOR NUNCA RECIBE LA CONTRASENA
 * MAESTRA EN TEXTO CLARO. RECIBE UN auth_hash YA DERIVADO
 * CON ARGON2ID EN EL CLIENTE Y LO COMPARA EN TIEMPO
 * CONSTANTE CONTRA EL HASH ALMACENADO. SI COINCIDE, EMITE
 * UN JWT FIRMADO CON EL SECRETO DE LA APLICACION.
 *
 * RELACIONES:
 * - AuthController (CONSUMIDOR)
 * - SHIELD (TABLAS users Y auth_identities)
 */
namespace App\Services;

// IMPORTACION DEL JWT MANAGER QUE TRAE SHIELD
use CodeIgniter\Shield\Authentication\JWTManager;

class AuthService
{
    // GENERA UN JWT FIRMADO PARA EL USUARIO INDICADO
    public function generateJwt(int $userId, string $email): string
    {
        // CONFIGURACION DE TIEMPO DE VIDA DEL TOKEN EN SEGUNDOS
        $ttl = (int) (env('JWT_TTL') ?? 3600);

        // PAYLOAD ESTANDAR DEL TOKEN CON CLAIMS BASICOS
        // SHIELD ANADE iss Y exp AUTOMATICAMENTE A PARTIR DE LA
        // CONFIGURACION; AQUI INCLUIMOS sub Y email PARA LA APP
        $payload = [
            'sub' => (string) $userId,
            'email' => $email,
        ];

        // OBTIENE EL JWT MANAGER DE SHIELD COMO SERVICIO
        /** @var JWTManager $manager */
        $manager = service('jwtmanager');

        // FIRMA Y DEVUELVE EL TOKEN COMO STRING
        return $manager->issue($payload, $ttl);
    }

    // COMPARA DOS HASHES EN TIEMPO CONSTANTE PARA EVITAR
    // ATAQUES DE TIMING SOBRE LA COMPARACION DE STRINGS
    public function verifyAuthHash(string $stored, string $provided): bool
    {
        // hash_equals ES SEGURO CONTRA TIMING ATTACKS
        return hash_equals($stored, $provided);
    }
}
