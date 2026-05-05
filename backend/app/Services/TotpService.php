<?php
/**
 * TOTP SERVICE
 *
 * RESUMEN: SERVICIO QUE ENCAPSULA LA LOGICA DE NEGOCIO DEL
 * SEGUNDO FACTOR DE AUTENTICACION BASADO EN TIME-BASED ONE
 * TIME PASSWORD (TOTP, RFC 6238).
 *
 * LOGICA DE NEGOCIO: GENERA SECRETOS BASE32 ALEATORIOS,
 * CONSTRUYE LA URI otpauth:// PARA QUE EL CLIENTE LA
 * RENDERICE COMO QR Y VERIFICA CODIGOS DE 6 DIGITOS CON
 * UNA VENTANA DE TOLERANCIA DE +-30 SEGUNDOS PARA EVITAR
 * RECHAZOS POR DESINCRONIZACION DE RELOJ.
 *
 * RELACIONES:
 * - TotpController (CONSUMIDOR)
 * - LIBRERIA RobThree\Auth\TwoFactorAuth
 */
namespace App\Services;

// IMPORTACION DE LA LIBRERIA QUE IMPLEMENTA EL ESTANDAR
use RobThree\Auth\TwoFactorAuth;

// IMPORTACION DEL PROVEEDOR DE QR USADO POR LA LIBRERIA
use RobThree\Auth\Providers\Qr\BaconQrCodeProvider;

class TotpService
{
    // INSTANCIA DE LA LIBRERIA TwoFactorAuth REUTILIZABLE
    private TwoFactorAuth $tfa;

    // CONSTRUCTOR QUE INICIALIZA LA LIBRERIA CON LA CONFIG
    public function __construct()
    {
        // INSTANCIA EL PROVEEDOR DE GENERACION DE QR
        $qrProvider = new BaconQrCodeProvider();

        // INICIALIZA LA LIBRERIA CON EL EMISOR ARGOS
        $this->tfa = new TwoFactorAuth(
            $qrProvider,
            'ARGOS',
            6,
            30,
            \RobThree\Auth\Algorithm::Sha1
        );
    }

    // GENERA UN SECRETO BASE32 NUEVO PARA UN USUARIO
    public function generateSecret(): string
    {
        // GENERA UN SECRETO ALEATORIO DE 160 BITS
        return $this->tfa->createSecret(160);
    }

    // CONSTRUYE LA URI otpauth PARA RENDERIZAR COMO QR
    public function buildQrUri(string $email, string $secret): string
    {
        // GENERA LA URI ESTANDAR otpauth:// QUE LA APP LEE
        return $this->tfa->getQRText('ARGOS:' . $email, $secret);
    }

    // VERIFICA QUE UN CODIGO DE 6 DIGITOS SEA VALIDO
    public function verifyCode(string $secret, string $code): bool
    {
        // VALIDA CON UNA TOLERANCIA DE +-1 PERIODO (30 SEG)
        return $this->tfa->verifyCode($secret, $code, 1);
    }
}
