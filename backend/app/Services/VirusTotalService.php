<?php
/**
 * VIRUSTOTAL SERVICE
 *
 * RESUMEN: SERVICIO QUE ENCAPSULA LA LOGICA DE CONSULTA A LA
 * VIRUSTOTAL API V3. VIRUSTOTAL CONSULTA MAS DE 70 MOTORES
 * ANTIVIRUS Y DEVUELVE UN CONSENSO DE DETECCIONES.
 *
 * LOGICA DE NEGOCIO: SE APLICA UN RATE LIMITING INTERNO PARA
 * RESPETAR LA CUOTA DEL TIER GRATUITO (4 PETICIONES POR
 * MINUTO, 500 AL DIA). CADA CONSULTA INCREMENTA EL CONTADOR
 * EN LA TABLA virustotal_rate_limit. SI SE SUPERA EL LIMITE,
 * DEVUELVE UN ERROR 429 SIN CONSULTAR LA API.
 *
 * RELACIONES:
 * - PhishingController (CONSUMIDOR)
 * - virustotal_rate_limit (CONTROL DE TASA)
 */
namespace App\Services;

class VirusTotalService
{
    // URL BASE DE LA API V3 DE VIRUSTOTAL
    private const API_URL = 'https://www.virustotal.com/api/v3/urls';

    // LIMITE DE PETICIONES POR MINUTO EN EL TIER GRATUITO
    private const LIMIT_PER_MINUTE = 4;

    // LIMITE DE PETICIONES POR DIA EN EL TIER GRATUITO
    private const LIMIT_PER_DAY = 500;

    // API KEY DE VIRUSTOTAL
    private ?string $apiKey;

    // CONEXION A LA BASE DE DATOS
    private $db;

    // CONSTRUCTOR QUE INICIALIZA CONFIGURACION Y CONEXION
    public function __construct()
    {
        $this->apiKey = env('VIRUSTOTAL_API_KEY') ?: null;
        $this->db = \Config\Database::connect();
    }

    // CONSULTA UNA URL EN VIRUSTOTAL VERIFICANDO PRIMERO EL RATE LIMIT
    public function checkUrl(string $url): array
    {
        // VALIDA QUE LA API KEY ESTA CONFIGURADA
        if (empty($this->apiKey)) {
            throw new \RuntimeException('VIRUSTOTAL_API_KEY no configurada en .env');
        }

        // VERIFICA QUE NO SE SUPERAN LOS LIMITES DE TASA
        $this->enforceRateLimit();

        // GENERA EL ID DE URL EN BASE64URL SEGUN ESPECIFICACION VT
        $urlId = rtrim(strtr(base64_encode($url), '+/', '-_'), '=');

        // CONSULTA EL REPORTE EXISTENTE EN VIRUSTOTAL
        $endpoint = self::API_URL . '/' . $urlId;

        // INICIALIZA LA SESION CURL
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'x-apikey: ' . $this->apiKey,
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT => 15,
        ]);

        // EJECUTA LA PETICION
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // REGISTRA EL CONSUMO DE LA CUOTA INDEPENDIENTEMENTE DEL RESULTADO
        $this->recordConsumption();

        // SI HUBO ERROR DE RED LANZA EXCEPCION
        if ($body === false) {
            throw new \RuntimeException('Error de red al consultar VirusTotal: ' . $error);
        }

        // SI ES 404 LA URL NO HA SIDO ANALIZADA TODAVIA
        if ($code === 404) {
            return [
                'verdict' => 'unknown',
                'message' => 'URL no analizada previamente en VirusTotal',
            ];
        }

        // SI NO ES 200 LANZA EXCEPCION
        if ($code !== 200) {
            throw new \RuntimeException("VirusTotal devolvio codigo {$code}: {$body}");
        }

        // DECODIFICA LA RESPUESTA JSON
        $data = json_decode($body, true);
        $stats = $data['data']['attributes']['last_analysis_stats'] ?? [];

        // EXTRAE LOS CONTADORES DE LOS MOTORES
        $malicious = $stats['malicious'] ?? 0;
        $suspicious = $stats['suspicious'] ?? 0;
        $harmless = $stats['harmless'] ?? 0;
        $undetected = $stats['undetected'] ?? 0;
        $total = $malicious + $suspicious + $harmless + $undetected;

        // DETERMINA EL VEREDICTO SEGUN LOS CONTADORES
        $verdict = 'safe';
        if ($malicious > 0) {
            $verdict = 'unsafe';
        } elseif ($suspicious > 0) {
            $verdict = 'suspicious';
        }

        // DEVUELVE EL VEREDICTO Y LAS ESTADISTICAS
        return [
            'verdict' => $verdict,
            'stats' => [
                'malicious' => $malicious,
                'suspicious' => $suspicious,
                'harmless' => $harmless,
                'undetected' => $undetected,
                'total_engines' => $total,
            ],
        ];
    }

    // VERIFICA QUE NO SE SUPERAN LOS LIMITES Y LANZA EXCEPCION SI SI
    private function enforceRateLimit(): void
    {
        // CUENTA LAS PETICIONES DEL ULTIMO MINUTO
        $minuteThreshold = date('Y-m-d H:i:s', strtotime('-1 minute'));
        $countMinute = $this->db->table('virustotal_rate_limit')
            ->where('consumed_at >=', $minuteThreshold)
            ->countAllResults();

        // SI SUPERA EL LIMITE POR MINUTO LANZA 429
        if ($countMinute >= self::LIMIT_PER_MINUTE) {
            throw new \RuntimeException('Limite de VirusTotal por minuto alcanzado, reintenta en breve');
        }

        // CUENTA LAS PETICIONES DEL DIA ACTUAL
        $dayThreshold = date('Y-m-d 00:00:00');
        $countDay = $this->db->table('virustotal_rate_limit')
            ->where('consumed_at >=', $dayThreshold)
            ->countAllResults();

        // SI SUPERA EL LIMITE POR DIA LANZA 429
        if ($countDay >= self::LIMIT_PER_DAY) {
            throw new \RuntimeException('Limite diario de VirusTotal alcanzado');
        }
    }

    // REGISTRA UNA NUEVA CONSULTA EN LA TABLA DE CONTROL
    private function recordConsumption(): void
    {
        $this->db->table('virustotal_rate_limit')->insert([
            'consumed_at' => date('Y-m-d H:i:s'),
        ]);
    }
}
