<?php
/**
 * SECURITY HEADERS FILTER TEST
 *
 * RESUMEN: TESTS UNITARIOS QUE COMPRUEBAN QUE EL FILTRO GLOBAL
 * SecurityHeaders INYECTA TODAS LAS CABECERAS RECOMENDADAS POR
 * LA AUDITORIA OWASP ZAP (docs/security/AUDITORIA_OWASP_ZAP.md).
 *
 * LOGICA DE NEGOCIO COBERTURADA:
 * - HSTS, X-CONTENT-TYPE-OPTIONS, REFERRER-POLICY,
 *   PERMISSIONS-POLICY Y X-FRAME-OPTIONS PRESENTES
 *
 * RELACIONES:
 * - App\Filters\SecurityHeaders (SUJETO BAJO TEST)
 */
namespace Tests\Unit\Filters;

// IMPORTACION DEL CASO BASE DE TESTS DE CODEIGNITER 4
use CodeIgniter\Test\CIUnitTestCase;

// IMPORTACION DEL FILTRO A TESTEAR
use App\Filters\SecurityHeaders;

// IMPORTACION DE REQUEST/RESPONSE INCOMING USADAS EN LAS PRUEBAS
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\Response;
use CodeIgniter\HTTP\UserAgent;
use CodeIgniter\HTTP\URI;
use Config\App;

/**
 * @internal
 */
final class SecurityHeadersTest extends CIUnitTestCase
{
    // PREPARA UN PAR REQUEST/RESPONSE MINIMOS PARA EL FILTRO
    private function makeRequestAndResponse(): array
    {
        // CONSTRUYE UNA REQUEST INCOMING SOBRE UNA URL CUALQUIERA
        $request = new IncomingRequest(
            new App(),
            new URI('https://argos.local/api/v1/news'),
            null,
            new UserAgent()
        );

        // CREA UNA RESPONSE VACIA SOBRE LA QUE EL FILTRO AÑADIRA CABECERAS
        $response = new Response(new App());

        return [$request, $response];
    }

    // VERIFICA QUE TODAS LAS CABECERAS DE SEGURIDAD SE INYECTAN
    public function testAfterAddsAllExpectedSecurityHeaders(): void
    {
        // PREPARA EL FILTRO Y LOS OBJETOS DE PRUEBA
        $filter = new SecurityHeaders();
        [$request, $response] = $this->makeRequestAndResponse();

        // EJECUTA EL HOOK after Y RECOGE LA RESPUESTA TRANSFORMADA
        $result = $filter->after($request, $response);

        // LA RESPUESTA DEBE INCLUIR LAS CINCO CABECERAS CRITICAS
        $this->assertStringContainsString(
            'max-age=63072000',
            $result->getHeaderLine('Strict-Transport-Security')
        );
        $this->assertSame('nosniff', $result->getHeaderLine('X-Content-Type-Options'));
        $this->assertSame('no-referrer', $result->getHeaderLine('Referrer-Policy'));
        $this->assertStringContainsString('camera=()', $result->getHeaderLine('Permissions-Policy'));
        $this->assertSame('DENY', $result->getHeaderLine('X-Frame-Options'));
    }

    // VERIFICA QUE EL HOOK before NO MODIFICA NADA
    public function testBeforeIsANoop(): void
    {
        // PREPARA EL FILTRO Y UNA REQUEST GENERICA
        $filter = new SecurityHeaders();
        [$request,] = $this->makeRequestAndResponse();

        // EL HOOK before DEBE RETORNAR null Y NO LANZAR EXCEPCIONES
        $this->assertNull($filter->before($request));
    }
}
