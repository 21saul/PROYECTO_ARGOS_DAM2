<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * Cross-Origin Resource Sharing (CORS) Configuration
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 */
class Cors extends BaseConfig
{
    /**
     * The default CORS configuration.
     *
     * @var array{
     *      allowedOrigins: list<string>,
     *      allowedOriginsPatterns: list<string>,
     *      supportsCredentials: bool,
     *      allowedHeaders: list<string>,
     *      exposedHeaders: list<string>,
     *      allowedMethods: list<string>,
     *      maxAge: int,
     *  }
     */
    public array $default = [
        // ORIGENES PERMITIDOS PARA CONSUMIR LA API DESDE FRONTENDS LOCALES Y MOVILES
        'allowedOrigins' => [
            // IONIC SERVE EN MODO BROWSER (PUERTO POR DEFECTO 8100)
            'http://localhost:8100',
            // WEBVIEW DE CAPACITOR EN ANDROID/IOS
            'capacitor://localhost',
            // WEBVIEW DE IONIC EN COMPILACIONES NATIVAS
            'ionic://localhost',
            // SERVIDOR DE ANGULAR CLI (ng serve) POR DEFECTO
            'http://localhost:4200',
            // PETICIONES PROVENIENTES DE FILE/EMBEDS LOCALES SIN PUERTO
            'http://localhost',
        ],

        // PATRONES REGEX DE ORIGENES PERMITIDOS — CUBRE PUERTOS ALTERNATIVOS DE IONIC SERVE
        // CUANDO 8100 ESTA OCUPADO IONIC RECURRE A 8101, 8102, 8103, ETC.
        'allowedOriginsPatterns' => [
            'http://localhost:810\d',
        ],

        // NO USAMOS COOKIES NI CREDENCIALES — EL JWT VIAJA EN HEADER Authorization
        'supportsCredentials' => false,

        // CABECERAS PERMITIDAS EN PETICIONES PREFLIGHT
        'allowedHeaders' => [
            'Authorization',
            'Content-Type',
            'Accept',
        ],

        // CABECERAS QUE EL NAVEGADOR PUEDE LEER DESDE LA RESPUESTA
        'exposedHeaders' => [],

        // METODOS HTTP PERMITIDOS PARA LA API REST
        'allowedMethods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

        // CACHEO DEL RESULTADO DEL PREFLIGHT DURANTE 2 HORAS
        'maxAge' => 7200,
    ];
}
