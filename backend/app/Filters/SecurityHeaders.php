<?php
/**
 * SECURITY HEADERS FILTER
 *
 * RESUMEN: FILTRO GLOBAL QUE ANADE LAS CABECERAS HTTP DE SEGURIDAD
 * RECOMENDADAS POR OWASP A TODAS LAS RESPUESTAS DEL BACKEND.
 *
 * LOGICA DE NEGOCIO: SE EJECUTA EN EL HOOK after PARA NO ALTERAR EL
 * FLUJO DE LA APLICACION. CADA CABECERA MITIGA UN HALLAZGO CONCRETO
 * DOCUMENTADO EN docs/security/AUDITORIA_OWASP_ZAP.md:
 *  - HSTS (10035): EVITA DOWNGRADE A HTTP EN UN MITM.
 *  - X-CONTENT-TYPE-OPTIONS (10021): DESACTIVA MIME-SNIFFING.
 *  - REFERRER-POLICY (10037): EVITA FUGAS DE URL EN ENLACES SALIENTES.
 *  - PERMISSIONS-POLICY (10063): RESTRINGE APIS DEL NAVEGADOR NO USADAS.
 *  - X-FRAME-OPTIONS: BLOQUEA EMBEBIDO POR TERCEROS (CLICKJACKING).
 *
 * RELACIONES:
 * - SE REGISTRA COMO FILTRO GLOBAL after EN app/Config/Filters.php
 * - SE LE DEDICA UNA SECCION COMPLETA EN EL REPORTE DE AUDITORIA ZAP
 */
namespace App\Filters;

// IMPORTACION DEL CONTRATO DE FILTROS DE CODEIGNITER 4
use CodeIgniter\Filters\FilterInterface;

// IMPORTACION DE LAS INTERFACES DE REQUEST Y RESPONSE
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class SecurityHeaders implements FilterInterface
{
    // HOOK before NO HACE NADA EN ESTE FILTRO
    public function before(RequestInterface $request, $arguments = null)
    {
        // NO HAY LOGICA PREVIA AL CONTROLADOR
        return null;
    }

    // HOOK after ANADE LAS CABECERAS DE SEGURIDAD A LA RESPUESTA
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // FUERZA HTTPS DURANTE 2 ANIOS Y PERMITE PRECARGA DEL NAVEGADOR
        $response->setHeader(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload'
        );

        // DESACTIVA EL MIME-SNIFFING EN NAVEGADORES ANTIGUOS
        $response->setHeader('X-Content-Type-Options', 'nosniff');

        // EVITA LA FUGA DE LA URL ORIGEN EN ENLACES EXTERNOS
        $response->setHeader('Referrer-Policy', 'no-referrer');

        // RESTRINGE APIS DEL NAVEGADOR QUE EL BACKEND NUNCA USA
        $response->setHeader(
            'Permissions-Policy',
            'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
        );

        // BLOQUEA EL EMBEBIDO DEL BACKEND EN IFRAMES (CLICKJACKING)
        $response->setHeader('X-Frame-Options', 'DENY');

        // ELIMINA LA CABECERA X-Powered-By QUE EXPONE EL STACK
        $response->removeHeader('X-Powered-By');

        return $response;
    }
}
