<?php
/**
 * TOTP SERVICE TEST
 *
 * RESUMEN: TESTS UNITARIOS DEL SERVICIO DE SEGUNDO FACTOR DE
 * AUTENTICACION QUE COMPRUEBAN LA GENERACION DE SECRETOS Y
 * LA VERIFICACION DE CODIGOS RFC 6238.
 *
 * LOGICA DE NEGOCIO COBERTURADA:
 * - TotpService::generateSecret (FORMATO BASE32 VALIDO)
 * - TotpService::buildQrUri (URI otpauth:// CORRECTA)
 * - TotpService::verifyCode (ACEPTA EL CODIGO DEL PERIODO ACTUAL
 *   Y RECHAZA CODIGOS INVENTADOS)
 *
 * RELACIONES:
 * - App\Services\TotpService (SUJETO BAJO TEST)
 * - RobThree\Auth\TwoFactorAuth (LIBRERIA EXTERNA)
 */
namespace Tests\Unit\Services;

// IMPORTACION DEL CASO BASE DE TESTS DE CODEIGNITER 4
use CodeIgniter\Test\CIUnitTestCase;

// IMPORTACION DEL SERVICIO A TESTEAR
use App\Services\TotpService;

// IMPORTACION DE LA LIBRERIA EXTERNA PARA CALCULAR CODIGOS REFERENCIA
use RobThree\Auth\TwoFactorAuth;
use RobThree\Auth\Providers\Qr\BaconQrCodeProvider;

/**
 * @internal
 */
final class TotpServiceTest extends CIUnitTestCase
{
    // INSTANCIA REUTILIZABLE DEL SERVICIO BAJO PRUEBA
    private TotpService $service;

    // INICIALIZA EL SERVICIO ANTES DE CADA TEST
    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TotpService();
    }

    // VERIFICA QUE EL SECRETO GENERADO ES UN STRING BASE32 NO VACIO
    public function testGenerateSecretReturnsBase32String(): void
    {
        // SOLICITA UN SECRETO NUEVO AL SERVICIO
        $secret = $this->service->generateSecret();

        // EL SECRETO NUNCA DEBE SER UN STRING VACIO
        $this->assertNotEmpty($secret);

        // EL ALFABETO BASE32 ESTANDAR ES A-Z2-7 SEGUN RFC 4648
        $this->assertMatchesRegularExpression('/^[A-Z2-7]+$/', $secret);
    }

    // VERIFICA QUE CADA SECRETO GENERADO ES DISTINTO
    public function testGenerateSecretReturnsUniqueValues(): void
    {
        // GENERA DOS SECRETOS CONSECUTIVOS
        $first = $this->service->generateSecret();
        $second = $this->service->generateSecret();

        // LA PROBABILIDAD DE COLISION CON 160 BITS ES DESPRECIABLE
        $this->assertNotSame($first, $second);
    }

    // VERIFICA QUE EL SECRETO TIENE LA LONGITUD ESPERADA PARA 160 BITS
    public function testGenerateSecretHasExpectedLengthForOneHundredSixtyBits(): void
    {
        // 160 BITS = 20 BYTES = 32 CHARS EN BASE32 SIN PADDING
        $secret = $this->service->generateSecret();

        // LA LONGITUD DEBE ESTAR ENTRE 30 Y 34 CHARS (CON O SIN PADDING)
        $this->assertGreaterThanOrEqual(30, strlen($secret));
        $this->assertLessThanOrEqual(34, strlen($secret));
    }

    // VERIFICA QUE LA URI otpauth INCLUYE EL EMITIDO Y EL SECRETO
    public function testBuildQrUriContainsIssuerAndSecret(): void
    {
        // PREPARA UN EMAIL Y SECRETO REPRODUCIBLES
        $secret = $this->service->generateSecret();
        $uri = $this->service->buildQrUri('usuario@ejemplo.com', $secret);

        // LA URI DEBE EMPEZAR POR EL ESQUEMA otpauth
        $this->assertStringStartsWith('otpauth://totp/', $uri);

        // EL EMISOR ARGOS DEBE APARECER COMO ETIQUETA
        $this->assertStringContainsString('ARGOS', $uri);

        // EL EMAIL DEL USUARIO DEBE APARECER URL-ENCODED EN LA ETIQUETA
        $this->assertStringContainsString('usuario%40ejemplo.com', $uri);

        // EL PARAMETRO secret DEBE APARECER EN EL QUERYSTRING
        $this->assertStringContainsString('secret=' . $secret, $uri);
    }

    // VERIFICA QUE UN CODIGO VALIDO DEL PERIODO ACTUAL ES ACEPTADO
    public function testVerifyCodeAcceptsValidCurrentCode(): void
    {
        // GENERA UN SECRETO Y CALCULA EL CODIGO ACTUAL CON LA LIBRERIA
        $secret = $this->service->generateSecret();
        $tfa = new TwoFactorAuth(new BaconQrCodeProvider(), 'ARGOS', 6, 30, \RobThree\Auth\Algorithm::Sha1);
        $code = $tfa->getCode($secret);

        // EL CODIGO RECIEN CALCULADO DEBE PASAR LA VERIFICACION
        $this->assertTrue($this->service->verifyCode($secret, $code));
    }

    // VERIFICA QUE UN CODIGO ALEATORIO INVENTADO ES RECHAZADO
    public function testVerifyCodeRejectsInvalidCode(): void
    {
        // GENERA UN SECRETO Y USA UN CODIGO INVENTADO
        $secret = $this->service->generateSecret();

        // 000000 ES UN CODIGO INVALIDO CON PROBABILIDAD ~99.99%
        $this->assertFalse($this->service->verifyCode($secret, '000000'));
    }

    // VERIFICA QUE UN CODIGO CON FORMATO INCORRECTO ES RECHAZADO
    public function testVerifyCodeRejectsMalformedCode(): void
    {
        // GENERA UN SECRETO Y USA UN CODIGO CON CARACTERES NO NUMERICOS
        $secret = $this->service->generateSecret();

        // LA LIBRERIA DEVUELVE FALSE PARA CODIGOS QUE NO COINCIDEN
        $this->assertFalse($this->service->verifyCode($secret, 'ABCDEF'));
    }
}
