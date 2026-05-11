<?php
/**
 * HIBP SERVICE
 *
 * RESUMEN: SERVICIO QUE ENCAPSULA LA LOGICA DE CONSULTA A LA
 * API DE HAVE I BEEN PWNED PARA VERIFICAR SI UNA CONTRASENA
 * APARECE EN FILTRACIONES MASIVAS, USANDO EL MODELO
 * K-ANONYMITY (RFC 1635).
 *
 * LOGICA DE NEGOCIO: EL CLIENTE CALCULA EL HASH SHA-1 DE LA
 * CONTRASENA Y NOS ENVIA SOLO LOS 5 PRIMEROS CARACTERES.
 * NOSOTROS CONSULTAMOS A HIBP CON ESE PREFIJO Y HIBP DEVUELVE
 * CIENTOS DE HASHES COMPLETOS QUE COMPARTEN ESE PREFIJO. EL
 * CLIENTE FINALMENTE COMPARA EN LOCAL EL RESTO DE SU HASH
 * CONTRA LA LISTA. ASI NI NOSOTROS NI HIBP CONOCEMOS NUNCA LA
 * CONTRASENA NI EL HASH COMPLETO.
 *
 * CACHE: CADA RESPUESTA SE CACHEA POR 24 HORAS EN LA TABLA
 * hibp_cache PARA REDUCIR LATENCIA Y NO AGOTAR CUOTAS.
 *
 * RELACIONES:
 * - AuditorController (CONSUMIDOR)
 * - hibp_cache (PERSISTENCIA DE CACHE)
 */
namespace App\Services;

class HibpService
{
    // URL BASE DE LA API DE PWNED PASSWORDS (NO REQUIERE KEY)
    private const HIBP_API_URL = 'https://api.pwnedpasswords.com/range/';

    // CABECERA REQUERIDA POR HIBP PARA IDENTIFICAR AL CLIENTE
    private const USER_AGENT = 'ARGOS-Backend/1.0';

    // TIEMPO DE VIDA DE LA CACHE EN HORAS
    private int $cacheTtlHours;

    // CONEXION A LA BASE DE DATOS
    private $db;

    // CONSTRUCTOR QUE INICIALIZA LA CONEXION Y EL TTL DE CACHE
    public function __construct()
    {
        $this->cacheTtlHours = (int) (env('HIBP_CACHE_TTL_HOURS') ?? 24);
        $this->db = \Config\Database::connect();
    }

    // CONSULTA EL PREFIJO DE 5 CHARS Y DEVUELVE LA RESPUESTA
    public function queryPrefix(string $prefix): array
    {
        // NORMALIZA EL PREFIJO A MAYUSCULAS PARA CONSISTENCIA
        $prefix = strtoupper($prefix);

        // VALIDA QUE EL PREFIJO TENGA EXACTAMENTE 5 CARACTERES HEX
        if (!preg_match('/^[0-9A-F]{5}$/', $prefix)) {
            throw new \InvalidArgumentException('Prefijo invalido');
        }

        // INTENTA RECUPERAR DESDE LA CACHE
        $cached = $this->getFromCache($prefix);
        if ($cached !== null) {
            return [
                'source' => 'cache',
                'prefix' => $prefix,
                'matches' => $this->parseResponse($cached),
            ];
        }

        // SI NO ESTA EN CACHE CONSULTA A HIBP
        $body = $this->fetchFromHibp($prefix);

        // GUARDA LA RESPUESTA EN CACHE PARA FUTURAS PETICIONES
        $this->saveToCache($prefix, $body);

        // DEVUELVE LA RESPUESTA PARSEADA
        return [
            'source' => 'hibp',
            'prefix' => $prefix,
            'matches' => $this->parseResponse($body),
        ];
    }

    // RECUPERA UNA RESPUESTA DE LA CACHE SI ES RECIENTE
    private function getFromCache(string $prefix): ?string
    {
        // CALCULA EL UMBRAL DE FRESCURA DE LA CACHE
        $threshold = date('Y-m-d H:i:s', strtotime("-{$this->cacheTtlHours} hours"));

        // BUSCA UNA ENTRADA RECIENTE PARA EL PREFIJO
        $row = $this->db->table('hibp_cache')
            ->where('hash_prefix', $prefix)
            ->where('fetched_at >=', $threshold)
            ->get()
            ->getRow();

        // DEVUELVE EL BODY O NULL SI NO HAY CACHE VALIDA
        return $row ? $row->response_body : null;
    }

    // CONSULTA A HIBP USANDO CURL CON CABECERAS REQUERIDAS
    private function fetchFromHibp(string $prefix): string
    {
        // CONSTRUYE LA URL CONCATENANDO EL PREFIJO
        $url = self::HIBP_API_URL . $prefix;

        // INICIALIZA LA SESION CURL
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                'User-Agent: ' . self::USER_AGENT,
                'Add-Padding: true',
            ],
        ]);

        // EJECUTA LA PETICION HTTP
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // SI HUBO ERROR DE RED LANZA EXCEPCION
        if ($body === false) {
            throw new \RuntimeException('Error de red al consultar HIBP: ' . $error);
        }

        // SI EL CODIGO NO ES 200 LANZA EXCEPCION
        if ($code !== 200) {
            throw new \RuntimeException("HIBP devolvio codigo {$code}");
        }

        return $body;
    }

    // GUARDA O ACTUALIZA UNA RESPUESTA EN LA CACHE
    private function saveToCache(string $prefix, string $body): void
    {
        // INTENTA UN UPSERT MEDIANTE DELETE + INSERT
        $this->db->table('hibp_cache')
            ->where('hash_prefix', $prefix)
            ->delete();

        $this->db->table('hibp_cache')->insert([
            'hash_prefix' => $prefix,
            'response_body' => $body,
            'fetched_at' => date('Y-m-d H:i:s'),
        ]);
    }

    // PARSEA LA RESPUESTA DE HIBP A UN ARRAY ESTRUCTURADO
    private function parseResponse(string $body): array
    {
        // LA RESPUESTA DE HIBP TIENE FORMATO: SUFIJO:CONTADOR\r\n
        $lines = explode("\r\n", trim($body));
        $matches = [];

        // PARSEA CADA LINEA EXTRAYENDO SUFIJO Y CONTADOR
        foreach ($lines as $line) {
            if (empty($line)) continue;
            $parts = explode(':', $line);
            if (count($parts) === 2) {
                $matches[] = [
                    'suffix' => trim($parts[0]),
                    'count' => (int) trim($parts[1]),
                ];
            }
        }

        return $matches;
    }
}
