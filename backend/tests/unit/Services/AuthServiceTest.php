<?php
/**
 * AUTH SERVICE TEST
 *
 * RESUMEN: TESTS UNITARIOS DEL SERVICIO DE AUTENTICACION
 * QUE COMPRUEBAN LA COMPARACION DE HASHES EN TIEMPO CONSTANTE
 * USADA EN EL FLUJO DE LOGIN ZERO-KNOWLEDGE.
 *
 * LOGICA DE NEGOCIO COBERTURADA:
 * - AuthService::verifyAuthHash COMO ENVOLTORIO DE hash_equals
 *
 * RELACIONES:
 * - App\Services\AuthService (SUJETO BAJO TEST)
 */
namespace Tests\Unit\Services;

// IMPORTACION DEL CASO BASE DE TESTS DE CODEIGNITER 4
use CodeIgniter\Test\CIUnitTestCase;

// IMPORTACION DEL SERVICIO A TESTEAR
use App\Services\AuthService;

/**
 * @internal
 */
final class AuthServiceTest extends CIUnitTestCase
{
    // INSTANCIA REUTILIZABLE DEL SERVICIO BAJO PRUEBA
    private AuthService $service;

    // INICIALIZA EL SERVICIO ANTES DE CADA TEST
    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AuthService();
    }

    // VERIFICA QUE DOS HASHES IDENTICOS COINCIDEN
    public function testVerifyAuthHashReturnsTrueForIdenticalHashes(): void
    {
        // PREPARA UN HASH SHA-256 DETERMINISTA DE EJEMPLO
        $hash = hash('sha256', 'password-derivada-en-cliente');

        // EL METODO DEBE DEVOLVER TRUE PARA HASHES IGUALES
        $this->assertTrue($this->service->verifyAuthHash($hash, $hash));
    }

    // VERIFICA QUE DOS HASHES DISTINTOS NO COINCIDEN
    public function testVerifyAuthHashReturnsFalseForDifferentHashes(): void
    {
        // PREPARA DOS HASHES DISTINTOS PARA COMPARAR
        $hashA = hash('sha256', 'usuario-correcto');
        $hashB = hash('sha256', 'usuario-distinto');

        // EL METODO DEBE DEVOLVER FALSE PARA HASHES DISTINTOS
        $this->assertFalse($this->service->verifyAuthHash($hashA, $hashB));
    }

    // VERIFICA QUE DOS STRINGS VACIOS COINCIDEN ENTRE SI
    public function testVerifyAuthHashReturnsTrueForEmptyStrings(): void
    {
        // hash_equals CONSIDERA QUE DOS STRINGS VACIOS SON IGUALES
        $this->assertTrue($this->service->verifyAuthHash('', ''));
    }

    // VERIFICA QUE HASHES DE LONGITUD DISTINTA NUNCA COINCIDEN
    public function testVerifyAuthHashReturnsFalseForDifferentLengths(): void
    {
        // PREPARA HASHES DE LONGITUDES MUY DIFERENTES
        $short = 'abc';
        $long = str_repeat('a', 256);

        // hash_equals SIEMPRE DEVUELVE FALSE PARA LONGITUDES DISTINTAS
        $this->assertFalse($this->service->verifyAuthHash($short, $long));
    }

    // VERIFICA QUE LA DIFERENCIA EN UN SOLO CARACTER ES DETECTADA
    public function testVerifyAuthHashDetectsSingleCharacterDifference(): void
    {
        // PREPARA UN HASH BASE Y UNA VARIANTE CON UN CHAR DISTINTO
        $base = str_repeat('a', 64);
        $variant = str_repeat('a', 63) . 'b';

        // EL METODO DEBE DETECTAR LA DIFERENCIA SUTIL
        $this->assertFalse($this->service->verifyAuthHash($base, $variant));
    }
}
