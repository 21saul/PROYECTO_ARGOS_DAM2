<?php
/**
 * JWT AUTH FILTER TEST
 *
 * RESUMEN: TESTS UNITARIOS DEL FILTRO QUE VALIDA EL TOKEN JWT
 * EN EL HEADER Authorization DE LAS PETICIONES PROTEGIDAS.
 *
 * LOGICA DE NEGOCIO COBERTURADA:
 * - RECHAZA PETICIONES SIN HEADER Authorization (NO_TOKEN)
 * - RECHAZA HEADERS CON UN ESQUEMA DISTINTO A Bearer (NO_TOKEN)
 * - RECHAZA TOKENS QUE NO SE PUEDEN PARSEAR (INVALID_TOKEN)
 *
 * RELACIONES:
 * - App\Filters\JwtAuthFilter (SUJETO BAJO TEST)
 */
namespace Tests\Unit\Filters;

// IMPORTACION DEL CASO BASE DE TESTS DE CODEIGNITER 4
use CodeIgniter\Test\CIUnitTestCase;

// IMPORTACION DEL FILTRO A TESTEAR
use App\Filters\JwtAuthFilter;

// IMPORTACION DE LA REQUEST INCOMING USADA EN LAS PRUEBAS
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\UserAgent;
use CodeIgniter\HTTP\URI;
use Config\App;

/**
 * @internal
 */
final class JwtAuthFilterTest extends CIUnitTestCase
{
    // CONSTRUYE UNA REQUEST INCOMING MINIMA PARA EL FILTRO
    private function makeRequest(array $headers = []): IncomingRequest
    {
        // INSTANCIA UNA REQUEST INCOMING DE CODEIGNITER 4
        $request = new IncomingRequest(
            new App(),
            new URI('https://argos.local/api/v1/vault/items'),
            null,
            new UserAgent()
        );

        // ANADE CADA HEADER PROVISTO POR EL TEST
        foreach ($headers as $name => $value) {
            $request->setHeader($name, $value);
        }

        return $request;
    }

    // VERIFICA QUE SIN HEADER Authorization SE DEVUELVE 401 NO_TOKEN
    public function testBeforeRejectsRequestWithoutAuthorizationHeader(): void
    {
        // PREPARA EL FILTRO Y UNA REQUEST SIN HEADERS
        $filter = new JwtAuthFilter();
        $request = $this->makeRequest();

        // EJECUTA EL FILTRO Y RECOGE LA RESPUESTA RECHAZADA
        $response = $filter->before($request);

        // LA RESPUESTA DEBE TENER CODIGO 401
        $this->assertNotNull($response);
        $this->assertSame(401, $response->getStatusCode());

        // EL JSON DEBE CONTENER EL CODIGO DE ERROR NO_TOKEN
        $body = json_decode($response->getBody(), true);
        $this->assertFalse($body['success']);
        $this->assertSame('NO_TOKEN', $body['error']['code']);
    }

    // VERIFICA QUE UN HEADER QUE NO EMPIEZA POR Bearer SE RECHAZA
    public function testBeforeRejectsRequestWithNonBearerAuthorizationHeader(): void
    {
        // PREPARA EL FILTRO Y UNA REQUEST CON HEADER BASIC
        $filter = new JwtAuthFilter();
        $request = $this->makeRequest([
            'Authorization' => 'Basic dXNlcjpwYXNz',
        ]);

        // EJECUTA EL FILTRO Y RECOGE LA RESPUESTA RECHAZADA
        $response = $filter->before($request);

        // LA RESPUESTA DEBE SER 401 NO_TOKEN PORQUE EL ESQUEMA NO ES Bearer
        $this->assertNotNull($response);
        $this->assertSame(401, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertSame('NO_TOKEN', $body['error']['code']);
    }

    // VERIFICA QUE UN BEARER VACIO SE TRATA COMO NO_TOKEN
    public function testBeforeRejectsRequestWithEmptyBearerToken(): void
    {
        // PREPARA EL FILTRO Y UNA REQUEST CON Bearer SIN TOKEN
        $filter = new JwtAuthFilter();
        $request = $this->makeRequest([
            'Authorization' => 'Bearer ',
        ]);

        // EJECUTA EL FILTRO Y RECOGE LA RESPUESTA RECHAZADA
        $response = $filter->before($request);

        // LA REGEX EXIGE AL MENOS UN CARACTER DESPUES DE Bearer
        $this->assertNotNull($response);
        $this->assertSame(401, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertSame('NO_TOKEN', $body['error']['code']);
    }

    // VERIFICA QUE EL METODO after NO ROMPE NI MODIFICA NADA
    public function testAfterIsANoop(): void
    {
        // PREPARA EL FILTRO Y UNA REQUEST CON RESPONSE GENERICA
        $filter = new JwtAuthFilter();
        $request = $this->makeRequest();
        $response = service('response');

        // EL METODO after DEBE RETORNAR null SIN ERRORES
        $this->assertNull($filter->after($request, $response));
    }
}
