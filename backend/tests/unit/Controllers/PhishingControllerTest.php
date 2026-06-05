<?php
/**
 * PHISHING CONTROLLER TEST
 *
 * RESUMEN: TESTS UNITARIOS DEL CONTROLADOR DEL PIPELINE DE
 * PHISHING QUE CUBREN LA LOGICA DE VALIDACION DE URL Y LOS
 * HELPERS PRIVADOS DE CONSTRUCCION DE RESPUESTAS DE ERROR.
 *
 * LOGICA DE NEGOCIO COBERTURADA:
 * - PhishingController::isValidUrl ACEPTA URLS BIEN FORMADAS
 *   Y RECHAZA ENTRADAS NULL, VACIAS O CON FORMATO INVALIDO
 * - PhishingController::urlError DEVUELVE 422 INVALID_URL
 * - PhishingController::serviceError DEVUELVE 502 CON CODIGO
 *   DINAMICO CONFIGURABLE
 *
 * RELACIONES:
 * - App\Controllers\Api\V1\PhishingController (SUJETO BAJO TEST)
 */
namespace Tests\Unit\Controllers;

// IMPORTACION DEL CASO BASE DE TESTS DE CODEIGNITER 4
use CodeIgniter\Test\CIUnitTestCase;

// IMPORTACION DEL CONTROLADOR A TESTEAR
use App\Controllers\Api\V1\PhishingController;

// IMPORTACION DE REFLECTION PARA EJECUTAR METODOS PRIVADOS
use ReflectionClass;
use ReflectionMethod;
use ReflectionProperty;

/**
 * @internal
 */
final class PhishingControllerTest extends CIUnitTestCase
{
    // CONSTRUYE UNA INSTANCIA DEL CONTROLADOR CON SU response INTERNA
    private function makeController(): PhishingController
    {
        // INSTANCIA EL CONTROLADOR (NO REQUIERE ROUTING)
        $controller = new PhishingController();

        // INYECTA EL OBJETO response PARA QUE LOS HELPERS LO USEN
        $property = new ReflectionProperty(\CodeIgniter\Controller::class, 'response');
        $property->setAccessible(true);
        $property->setValue($controller, service('response'));

        return $controller;
    }

    // INVOCA UN METODO PRIVADO DEL CONTROLADOR VIA REFLECTION
    private function callPrivate(PhishingController $controller, string $method, array $args = [])
    {
        // EXPONE EL METODO PRIVADO Y LO INVOCA CON LOS ARGUMENTOS
        $reflection = new ReflectionMethod(PhishingController::class, $method);
        $reflection->setAccessible(true);
        return $reflection->invokeArgs($controller, $args);
    }

    // VERIFICA QUE EL VALIDADOR ACEPTA UNA URL HTTPS BIEN FORMADA
    public function testIsValidUrlAcceptsValidHttpsUrl(): void
    {
        $controller = $this->makeController();
        $result = $this->callPrivate($controller, 'isValidUrl', ['https://argos.dev/path?q=1']);
        $this->assertTrue($result);
    }

    // VERIFICA QUE EL VALIDADOR ACEPTA UNA URL HTTP TRADICIONAL
    public function testIsValidUrlAcceptsValidHttpUrl(): void
    {
        $controller = $this->makeController();
        $result = $this->callPrivate($controller, 'isValidUrl', ['http://ejemplo.com']);
        $this->assertTrue($result);
    }

    // VERIFICA QUE EL VALIDADOR RECHAZA NULL
    public function testIsValidUrlRejectsNull(): void
    {
        $controller = $this->makeController();
        $result = $this->callPrivate($controller, 'isValidUrl', [null]);
        $this->assertFalse($result);
    }

    // VERIFICA QUE EL VALIDADOR RECHAZA UN STRING VACIO
    public function testIsValidUrlRejectsEmptyString(): void
    {
        $controller = $this->makeController();
        $result = $this->callPrivate($controller, 'isValidUrl', ['']);
        $this->assertFalse($result);
    }

    // VERIFICA QUE EL VALIDADOR RECHAZA UN STRING SIN ESQUEMA
    public function testIsValidUrlRejectsStringWithoutScheme(): void
    {
        $controller = $this->makeController();
        $result = $this->callPrivate($controller, 'isValidUrl', ['esto no es una url']);
        $this->assertFalse($result);
    }

    // VERIFICA QUE EL HELPER urlError DEVUELVE 422 INVALID_URL
    public function testUrlErrorReturnsFourTwentyTwo(): void
    {
        // EJECUTA EL HELPER Y EXTRAE EL JSON DE RESPUESTA
        $controller = $this->makeController();
        $response = $this->callPrivate($controller, 'urlError');
        $body = json_decode($response->getBody(), true);

        // EL CODIGO HTTP Y EL CODIGO DE ERROR DEBEN COINCIDIR
        $this->assertSame(422, $response->getStatusCode());
        $this->assertFalse($body['success']);
        $this->assertSame('INVALID_URL', $body['error']['code']);
    }

    // VERIFICA QUE serviceError DEVUELVE 502 CON CODIGO Y MENSAJE
    public function testServiceErrorReturnsFiveZeroTwoWithCustomCode(): void
    {
        // EJECUTA EL HELPER CON UN CODIGO Y MENSAJE A MEDIDA
        $controller = $this->makeController();
        $response = $this->callPrivate($controller, 'serviceError', [
            'VIRUSTOTAL_ERROR',
            'Cuota agotada',
        ]);
        $body = json_decode($response->getBody(), true);

        // LA RESPUESTA DEBE PROPAGAR CODIGO Y MENSAJE TAL CUAL
        $this->assertSame(502, $response->getStatusCode());
        $this->assertSame('VIRUSTOTAL_ERROR', $body['error']['code']);
        $this->assertSame('Cuota agotada', $body['error']['message']);
    }
}
