<?php
/**
 * PHISHING CONTROLLER
 *
 * RESUMEN: GESTIONA LOS TRES PROXIES DE DETECCION DE PHISHING
 * QUE COMPONEN EL PIPELINE DEL MODULO ANALIZADOR DE LA APP.
 *
 * LOGICA DE NEGOCIO: CADA MOTOR (GOOGLE SAFE BROWSING,
 * PHISHTANK Y VIRUSTOTAL) SE EXPONE EN UN ENDPOINT SEPARADO
 * PARA QUE EL FRONTEND PUEDA ENCADENARLOS EN PIPELINE SERIE
 * Y MOSTRAR EL ESTADO DE CADA UNO POR SEPARADO EN LA
 * INTERFAZ. EL CLIENTE DECIDE EL ORDEN Y SI CORTOCIRCUITA EL
 * PIPELINE ANTE UN VEREDICTO NEGATIVO TEMPRANO.
 *
 * ENDPOINTS:
 * - POST /api/v1/phishing/safebrowsing
 * - POST /api/v1/phishing/phishtank
 * - POST /api/v1/phishing/virustotal
 *
 * RELACIONES:
 * - SafeBrowsingService (LOGICA GOOGLE)
 * - PhishTankService (LOGICA PHISHTANK)
 * - VirusTotalService (LOGICA VIRUSTOTAL)
 * - JwtAuthFilter (AUTENTICACION)
 */
namespace App\Controllers\Api\V1;

// IMPORTACION DEL CONTROLADOR BASE DE CI4
use App\Controllers\BaseController;

// IMPORTACION DE LOS TRES SERVICIOS DE DETECCION
use App\Services\SafeBrowsingService;
use App\Services\PhishTankService;
use App\Services\VirusTotalService;

// IMPORTACION DE LA INTERFAZ DE RESPUESTA HTTP DE CI4
use CodeIgniter\HTTP\ResponseInterface;

class PhishingController extends BaseController
{
    // INSTANCIA DEL SERVICIO DE GOOGLE SAFE BROWSING
    private SafeBrowsingService $safeBrowsing;

    // INSTANCIA DEL SERVICIO DE PHISHTANK
    private PhishTankService $phishTank;

    // INSTANCIA DEL SERVICIO DE VIRUSTOTAL
    private VirusTotalService $virusTotal;

    // CONSTRUCTOR QUE INYECTA LOS TRES SERVICIOS
    public function __construct()
    {
        $this->safeBrowsing = new SafeBrowsingService();
        $this->phishTank = new PhishTankService();
        $this->virusTotal = new VirusTotalService();
    }

    // CONSULTA UNA URL CONTRA GOOGLE SAFE BROWSING
    public function safebrowsing(): ResponseInterface
    {
        // RECOGE LA URL DEL CUERPO JSON
        $url = $this->request->getJsonVar('url');

        // VALIDA QUE LLEGUE Y SEA URL
        if (!$this->isValidUrl($url)) {
            return $this->urlError();
        }

        // CONSULTA EL SERVICIO Y MANEJA EXCEPCIONES
        try {
            $result = $this->safeBrowsing->checkUrl($url);
        } catch (\Exception $e) {
            return $this->serviceError('SAFEBROWSING_ERROR', $e->getMessage());
        }

        // DEVUELVE LA RESPUESTA ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => $result,
            'error' => null,
        ]);
    }

    // CONSULTA UNA URL CONTRA PHISHTANK
    public function phishtank(): ResponseInterface
    {
        // RECOGE LA URL DEL CUERPO JSON
        $url = $this->request->getJsonVar('url');

        // VALIDA QUE LLEGUE Y SEA URL
        if (!$this->isValidUrl($url)) {
            return $this->urlError();
        }

        // CONSULTA EL SERVICIO Y MANEJA EXCEPCIONES
        try {
            $result = $this->phishTank->checkUrl($url);
        } catch (\Exception $e) {
            return $this->serviceError('PHISHTANK_ERROR', $e->getMessage());
        }

        // DEVUELVE LA RESPUESTA ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => $result,
            'error' => null,
        ]);
    }

    // CONSULTA UNA URL CONTRA VIRUSTOTAL
    public function virustotal(): ResponseInterface
    {
        // RECOGE LA URL DEL CUERPO JSON
        $url = $this->request->getJsonVar('url');

        // VALIDA QUE LLEGUE Y SEA URL
        if (!$this->isValidUrl($url)) {
            return $this->urlError();
        }

        // CONSULTA EL SERVICIO Y MANEJA EXCEPCIONES
        try {
            $result = $this->virusTotal->checkUrl($url);
        } catch (\RuntimeException $e) {
            // SI EL ERROR ES DE RATE LIMIT DEVUELVE 429
            if (str_contains($e->getMessage(), 'Limite')) {
                return $this->response->setStatusCode(429)->setJSON([
                    'success' => false,
                    'data' => null,
                    'error' => [
                        'code' => 'RATE_LIMIT',
                        'message' => $e->getMessage(),
                    ],
                ]);
            }
            return $this->serviceError('VIRUSTOTAL_ERROR', $e->getMessage());
        }

        // DEVUELVE LA RESPUESTA ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => $result,
            'error' => null,
        ]);
    }

    // VALIDA QUE LA URL TENGA FORMATO BASICO CORRECTO
    private function isValidUrl(?string $url): bool
    {
        return $url !== null && filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    // RESPUESTA ESTANDAR DE URL INVALIDA
    private function urlError(): ResponseInterface
    {
        return $this->response->setStatusCode(422)->setJSON([
            'success' => false,
            'data' => null,
            'error' => [
                'code' => 'INVALID_URL',
                'message' => 'La URL no tiene un formato valido',
            ],
        ]);
    }

    // RESPUESTA ESTANDAR DE ERROR DE SERVICIO EXTERNO
    private function serviceError(string $code, string $message): ResponseInterface
    {
        return $this->response->setStatusCode(502)->setJSON([
            'success' => false,
            'data' => null,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ]);
    }
}
