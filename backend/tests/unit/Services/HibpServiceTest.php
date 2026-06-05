<?php
/**
 * HIBP SERVICE TEST
 *
 * RESUMEN: TESTS UNITARIOS DEL SERVICIO PROXY A HAVE I BEEN
 * PWNED. SOLO CUBREN LA LOGICA DE VALIDACION DE ENTRADA Y EL
 * PARSEO DE RESPUESTAS PARA NO DEPENDER DE LA RED.
 *
 * LOGICA DE NEGOCIO COBERTURADA:
 * - HibpService::queryPrefix RECHAZA PREFIJOS MAL FORMADOS
 * - HibpService::parseResponse (METODO PRIVADO VIA REFLECTION)
 *   CONVIERTE EL TEXTO DE HIBP EN UN ARRAY ESTRUCTURADO
 *
 * RELACIONES:
 * - App\Services\HibpService (SUJETO BAJO TEST)
 */
namespace Tests\Unit\Services;

// IMPORTACION DEL CASO BASE DE TESTS DE CODEIGNITER 4
use CodeIgniter\Test\CIUnitTestCase;

// IMPORTACION DEL SERVICIO A TESTEAR
use App\Services\HibpService;

// IMPORTACION DE REFLECTION PARA ACCEDER A METODOS PRIVADOS
use ReflectionMethod;

/**
 * @internal
 */
final class HibpServiceTest extends CIUnitTestCase
{
    // VERIFICA QUE UN PREFIJO DE 4 CARACTERES SE RECHAZA
    public function testQueryPrefixRejectsTooShortPrefix(): void
    {
        // PREPARA EL SERVICIO BAJO PRUEBA
        $service = new HibpService();

        // ESPERA UNA INVALIDARGUMENT EXCEPTION POR FORMATO
        $this->expectException(\InvalidArgumentException::class);

        // ENTRADA INVALIDA DE 4 CARACTERES
        $service->queryPrefix('ABCD');
    }

    // VERIFICA QUE UN PREFIJO CON CARACTERES NO HEX SE RECHAZA
    public function testQueryPrefixRejectsNonHexPrefix(): void
    {
        // PREPARA EL SERVICIO BAJO PRUEBA
        $service = new HibpService();

        // ESPERA UNA INVALIDARGUMENT EXCEPTION POR FORMATO
        $this->expectException(\InvalidArgumentException::class);

        // 'G' NO ES UN CARACTER HEXADECIMAL VALIDO
        $service->queryPrefix('ABCDG');
    }

    // VERIFICA QUE UN PREFIJO DE 6 CARACTERES SE RECHAZA
    public function testQueryPrefixRejectsTooLongPrefix(): void
    {
        // PREPARA EL SERVICIO BAJO PRUEBA
        $service = new HibpService();

        // ESPERA UNA INVALIDARGUMENT EXCEPTION POR FORMATO
        $this->expectException(\InvalidArgumentException::class);

        // ENTRADA INVALIDA DE 6 CARACTERES
        $service->queryPrefix('ABCDEF');
    }

    // VERIFICA QUE EL PARSEO DE UNA RESPUESTA TIPICA FUNCIONA
    public function testParseResponseProducesExpectedStructure(): void
    {
        // CREA EL SERVICIO Y EXPONE EL METODO PRIVADO PARSE
        $service = new HibpService();
        $method = new ReflectionMethod(HibpService::class, 'parseResponse');
        $method->setAccessible(true);

        // SIMULA UNA RESPUESTA DE HIBP CON DOS LINEAS
        $body = "0018A45C4D1DEF81644B54AB7F969B88D65:3\r\n00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2";

        // EJECUTA EL PARSEO SOBRE LA RESPUESTA SIMULADA
        $result = $method->invoke($service, $body);

        // LA RESPUESTA DEBE TENER DOS ENTRADAS BIEN FORMADAS
        $this->assertCount(2, $result);
        $this->assertSame('0018A45C4D1DEF81644B54AB7F969B88D65', $result[0]['suffix']);
        $this->assertSame(3, $result[0]['count']);
        $this->assertSame('00D4F6E8FA6EECAD2A3AA415EEC418D38EC', $result[1]['suffix']);
        $this->assertSame(2, $result[1]['count']);
    }

    // VERIFICA QUE EL PARSEO IGNORA LINEAS MAL FORMADAS
    public function testParseResponseSkipsMalformedLines(): void
    {
        // CREA EL SERVICIO Y EXPONE EL METODO PRIVADO PARSE
        $service = new HibpService();
        $method = new ReflectionMethod(HibpService::class, 'parseResponse');
        $method->setAccessible(true);

        // INTRODUCE LINEAS VACIAS Y MAL FORMADAS QUE DEBEN IGNORARSE
        $body = "\r\nABC:1\r\n\r\nSINDOSPUNTOS\r\nDEF:2";

        // EJECUTA EL PARSEO
        $result = $method->invoke($service, $body);

        // SOLO DEBEN APARECER LAS DOS LINEAS BIEN FORMADAS
        $this->assertCount(2, $result);
        $this->assertSame('ABC', $result[0]['suffix']);
        $this->assertSame('DEF', $result[1]['suffix']);
    }

    // VERIFICA QUE EL PARSEO DEVUELVE ARRAY VACIO PARA BODY VACIO
    public function testParseResponseReturnsEmptyForEmptyBody(): void
    {
        // CREA EL SERVICIO Y EXPONE EL METODO PRIVADO PARSE
        $service = new HibpService();
        $method = new ReflectionMethod(HibpService::class, 'parseResponse');
        $method->setAccessible(true);

        // PASA UN BODY COMPLETAMENTE VACIO
        $result = $method->invoke($service, '');

        // EL RESULTADO DEBE SER UN ARRAY VACIO
        $this->assertSame([], $result);
    }
}
