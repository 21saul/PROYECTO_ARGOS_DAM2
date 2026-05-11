<?php
/**
 * PHISHTANK SERVICE
 *
 * RESUMEN: SERVICIO QUE ENCAPSULA LA LOGICA DE CONSULTA A LA
 * API DE PHISHTANK OPERADA POR CISCO TALOS. PHISHTANK ES UNA
 * BASE DE DATOS COLABORATIVA DE URLS DE PHISHING VERIFICADAS
 * POR LA COMUNIDAD DE SEGURIDAD.
 *
 * LOGICA DE NEGOCIO: LAS RESPUESTAS SE CACHEAN POR 6 HORAS EN
 * MARIADB PARA NO AGOTAR LA CUOTA DEL SERVICIO Y REDUCIR
 * LATENCIA. LA URL SE HASHEA CON SHA-256 PARA INDEXAR EN LA
 * CACHE.
 *
 * RELACIONES:
 * - PhishingController (CONSUMIDOR)
 * - phishtank_cache (PERSISTENCIA DE CACHE)
 */
namespace App\Services;

class PhishTankService
{
    // URL DEL ENDPOINT DE COMPROBACION DE PHISHTANK
    private const API_URL = 'https://checkurl.phishtank.com/checkurl/';

    // CABECERA USER-AGENT REQUERIDA POR PHISHTANK
    private const USER_AGENT = 'phishtank/ARGOS';

    // API KEY OPCIONAL DE PHISHTANK
    private ?string $apiKey;

    // TIEMPO DE VIDA DE LA CACHE EN HORAS
    private int $cacheTtlHours;

    // CONEXION A LA BASE DE DATOS
    private $db;

    // CONSTRUCTOR QUE INICIALIZA CONFIGURACION Y CONEXION
    public function __construct()
    {
        $this->apiKey = env('PHISHTANK_API_KEY') ?: null;
        $this->cacheTtlHours = (int) (env('PHISHTANK_CACHE_TTL_HOURS') ?? 6);
        $this->db = \Config\Database::connect();
    }

    // CONSULTA SI UNA URL ESTA EN PHISHTANK
    public function checkUrl(string $url): array
    {
        // CALCULA EL HASH SHA-256 DE LA URL PARA INDEXAR
        $urlHash = hash('sha256', $url);

        // INTENTA RECUPERAR DESDE LA CACHE
        $cached = $this->getFromCache($urlHash);
        if ($cached !== null) {
            return [
                'source' => 'cache',
                'verdict' => $cached['is_phishing'] ? 'unsafe' : 'safe',
                'details' => json_decode($cached['response_json'] ?? '{}', true),
            ];
        }

        // SI NO ESTA EN CACHE CONSULTA A PHISHTANK
        $response = $this->fetchFromPhishtank($url);

        // GUARDA LA RESPUESTA EN CACHE
        $this->saveToCache($urlHash, $url, $response);

        // DEVUELVE EL VEREDICTO PARSEADO
        return [
            'source' => 'phishtank',
            'verdict' => $this->computeVerdict($response),
            'details' => $response,
        ];
    }

    // CALCULA EL VEREDICTO TENIENDO EN CUENTA EL CAMPO valid DE PHISHTANK
    private function computeVerdict(array $response): string
    {
        // PHISHTANK MARCA in_database CUANDO LA URL FUE REPORTADA
        $inDatabase = $response['in_database'] ?? false;

        // verified INDICA QUE LA COMUNIDAD VERIFICO EL REPORTE
        $verified = $response['verified'] ?? false;

        // valid INDICA QUE EL REGISTRO SIGUE SIENDO PHISHING ACTIVO
        // SI valid NO VIENE EN LA RESPUESTA SE ASUME true POR DEFECTO
        $valid = $response['valid'] ?? true;

        // SOLO ES UNSAFE SI ESTA EN LA BASE, VERIFICADA Y AUN VIGENTE
        return ($inDatabase && $verified && $valid) ? 'unsafe' : 'safe';
    }

    // RECUPERA UNA RESPUESTA RECIENTE DE LA CACHE
    private function getFromCache(string $urlHash): ?array
    {
        // CALCULA EL UMBRAL DE FRESCURA
        $threshold = date('Y-m-d H:i:s', strtotime("-{$this->cacheTtlHours} hours"));

        // BUSCA UNA ENTRADA RECIENTE PARA EL HASH
        $row = $this->db->table('phishtank_cache')
            ->where('url_hash', $urlHash)
            ->where('fetched_at >=', $threshold)
            ->get()
            ->getRow();

        // DEVUELVE LA FILA COMO ARRAY O NULL
        return $row ? (array) $row : null;
    }

    // CONSULTA A PHISHTANK USANDO CURL CON CABECERAS REQUERIDAS
    private function fetchFromPhishtank(string $url): array
    {
        // CONSTRUYE LOS PARAMETROS DEL POST
        $params = [
            'url' => $url,
            'format' => 'json',
        ];

        // ANADE LA API KEY SI ESTA CONFIGURADA
        if ($this->apiKey) {
            $params['app_key'] = $this->apiKey;
        }

        // INICIALIZA LA SESION CURL
        $ch = curl_init(self::API_URL);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($params),
            CURLOPT_USERAGENT => self::USER_AGENT,
            CURLOPT_TIMEOUT => 10,
        ]);

        // EJECUTA LA PETICION
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // SI HUBO ERROR DE RED LANZA EXCEPCION
        if ($body === false) {
            throw new \RuntimeException('Error de red al consultar PhishTank: ' . $error);
        }

        // SI EL CODIGO NO ES 200 LANZA EXCEPCION
        if ($code !== 200) {
            throw new \RuntimeException("PhishTank devolvio codigo {$code}");
        }

        // DECODIFICA EL JSON DE RESPUESTA
        $data = json_decode($body, true);

        // EXTRAE EL OBJETO results.url0 QUE ES EL VEREDICTO
        return $data['results'] ?? [
            'in_database' => false,
            'verified' => false,
        ];
    }

    // GUARDA O ACTUALIZA UNA RESPUESTA EN LA CACHE
    private function saveToCache(string $urlHash, string $url, array $response): void
    {
        // ELIMINA ENTRADA PREVIA DEL MISMO HASH SI EXISTE
        $this->db->table('phishtank_cache')
            ->where('url_hash', $urlHash)
            ->delete();

        // INSERTA LA NUEVA ENTRADA
        $this->db->table('phishtank_cache')->insert([
            'url_hash' => $urlHash,
            'url' => substr($url, 0, 2048),
            'is_phishing' => $this->computeVerdict($response) === 'unsafe' ? 1 : 0,
            'response_json' => json_encode($response),
            'fetched_at' => date('Y-m-d H:i:s'),
        ]);
    }
}
