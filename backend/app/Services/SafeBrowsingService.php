<?php
/**
 * SAFE BROWSING SERVICE
 *
 * RESUMEN: SERVICIO QUE ENCAPSULA LA LOGICA DE CONSULTA A LA
 * GOOGLE SAFE BROWSING API V4 PARA VERIFICAR SI UNA URL ESTA
 * EN LAS LISTAS DE MALWARE, INGENIERIA SOCIAL O SOFTWARE NO
 * DESEADO MANTENIDAS POR GOOGLE.
 *
 * LOGICA DE NEGOCIO: SE USA EL ENDPOINT threatMatches:find.
 * SI LA URL APARECE EN ALGUNA LISTA, GOOGLE DEVUELVE EL TIPO
 * DE AMENAZA. SI NO, DEVUELVE UN OBJETO VACIO. EN ESTE
 * SEGUNDO CASO INTERPRETAMOS QUE LA URL ES SEGURA SEGUN
 * GOOGLE (NO QUE SEA NECESARIAMENTE INOFENSIVA).
 *
 * LIMITACION: LA API ES PARA USO NO COMERCIAL. PARA
 * COMERCIALIZACION FUTURA HAY QUE MIGRAR A WEB RISK API.
 *
 * RELACIONES:
 * - PhishingController (CONSUMIDOR)
 */
namespace App\Services;

class SafeBrowsingService
{
    // URL DEL ENDPOINT THREATMATCHES:FIND DE LA API V4
    private const API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

    // API KEY DE GOOGLE SAFE BROWSING
    private ?string $apiKey;

    // CONSTRUCTOR QUE CARGA LA API KEY DESDE .ENV
    public function __construct()
    {
        $this->apiKey = env('GOOGLE_SAFEBROWSING_KEY') ?: null;
    }

    // CONSULTA SI UNA URL ESTA EN LAS LISTAS DE GOOGLE
    public function checkUrl(string $url): array
    {
        // VALIDA QUE LA API KEY ESTA CONFIGURADA
        if (empty($this->apiKey)) {
            throw new \RuntimeException('GOOGLE_SAFEBROWSING_KEY no configurada en .env');
        }

        // CONSTRUYE EL CUERPO DE LA PETICION CON EL FORMATO REQUERIDO
        $payload = [
            'client' => [
                'clientId' => 'ARGOS',
                'clientVersion' => '1.0',
            ],
            'threatInfo' => [
                'threatTypes' => [
                    'MALWARE',
                    'SOCIAL_ENGINEERING',
                    'UNWANTED_SOFTWARE',
                    'POTENTIALLY_HARMFUL_APPLICATION',
                ],
                'platformTypes' => ['ANY_PLATFORM'],
                'threatEntryTypes' => ['URL'],
                'threatEntries' => [
                    ['url' => $url],
                ],
            ],
        ];

        // CONSTRUYE LA URL CON LA API KEY EN EL QUERY STRING
        $endpoint = self::API_URL . '?key=' . urlencode($this->apiKey);

        // INICIALIZA LA SESION CURL CON LOS PARAMETROS NECESARIOS
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT => 10,
        ]);

        // EJECUTA LA PETICION HTTP
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // SI HUBO ERROR DE RED LANZA EXCEPCION
        if ($body === false) {
            throw new \RuntimeException('Error de red al consultar Safe Browsing: ' . $error);
        }

        // SI EL CODIGO HTTP NO ES 200 LANZA EXCEPCION
        if ($code !== 200) {
            throw new \RuntimeException("Safe Browsing devolvio codigo {$code}: {$body}");
        }

        // DECODIFICA LA RESPUESTA JSON
        $data = json_decode($body, true);

        // SI matches ESTA VACIO LA URL ES SEGURA SEGUN GOOGLE
        if (empty($data['matches'])) {
            return [
                'verdict' => 'safe',
                'threats' => [],
            ];
        }

        // EXTRAE LOS TIPOS DE AMENAZA DETECTADOS
        $threats = array_map(
            fn($match) => $match['threatType'] ?? 'UNKNOWN',
            $data['matches']
        );

        // DEVUELVE EL VEREDICTO CON LA LISTA DE AMENAZAS
        return [
            'verdict' => 'unsafe',
            'threats' => array_values(array_unique($threats)),
        ];
    }
}
