<?php
/**
 * AUTH JWT
 *
 * RESUMEN: CONFIGURACION LOCAL DEL AUTENTICADOR JWT DE SHIELD.
 * EXTIENDE LA CONFIGURACION POR DEFECTO Y SOBRESCRIBE EL
 * SECRETO LEYENDOLO DESDE LA VARIABLE DE ENTORNO JWT_SECRET
 * Y EL TIEMPO DE VIDA DESDE JWT_TTL.
 *
 * LOGICA DE NEGOCIO: EL SECRETO JWT NO DEBE VIVIR EN CODIGO
 * VERSIONADO. SE INYECTA POR ENTORNO PARA QUE LA CLAVE SEA
 * DISTINTA EN DESARROLLO Y EN PRODUCCION SIN CAMBIAR EL
 * CODIGO.
 *
 * RELACIONES:
 * - AuthService (CONSUMIDOR DEL JWTManager)
 * - SHIELD (AUTENTICADOR JWT)
 */
declare(strict_types=1);

namespace Config;

// IMPORTACION DE LA CONFIGURACION BASE DE SHIELD
use CodeIgniter\Shield\Config\AuthJWT as ShieldAuthJWT;

class AuthJWT extends ShieldAuthJWT
{
    // CONSTRUCTOR QUE INYECTA LOS VALORES DESDE .env
    public function __construct()
    {
        // EJECUTA EL CONSTRUCTOR DE BaseConfig PARA QUE FUNCIONEN
        // LOS OVERRIDES DE ENV ESTANDAR QUE PROVEE CI4
        parent::__construct();

        // SOBRESCRIBE EL ISSUER POR DEFECTO CON EL NOMBRE DEL PROYECTO
        $this->defaultClaims['iss'] = 'ARGOS';

        // RECUPERA EL SECRETO JWT DESDE EL ENTORNO
        $secret = env('JWT_SECRET');

        // SI EXISTE LO INYECTA EN EL KEYSET POR DEFECTO
        if (is_string($secret) && $secret !== '') {
            $this->keys['default'][0]['secret'] = $secret;
        }

        // RECUPERA EL TIEMPO DE VIDA DEL TOKEN DESDE EL ENTORNO
        $ttl = env('JWT_TTL');

        // SI EXISTE LO ASIGNA AL CAMPO timeToLive
        if ($ttl !== null && $ttl !== '') {
            $this->timeToLive = (int) $ttl;
        }
    }
}
