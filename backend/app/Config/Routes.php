<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

service('auth')->routes($routes);

// GRUPO DE RUTAS DE LA API VERSION 1
$routes->group('api/v1', static function ($routes) {
    // SUBGRUPO DE RUTAS DE AUTENTICACION ZERO-KNOWLEDGE
    $routes->group('auth', static function ($routes) {
        // ENDPOINT DE REGISTRO DE NUEVOS USUARIOS
        $routes->post('register', 'Api\V1\AuthController::register');
        // ENDPOINT QUE DEVUELVE LOS PARAMETROS KDF DEL USUARIO
        $routes->get('challenge', 'Api\V1\AuthController::challenge');
        // ENDPOINT DE LOGIN QUE DEVUELVE JWT Y VAULT BLOB
        $routes->post('login', 'Api\V1\AuthController::login');
    });
    // SUBGRUPO DE RUTAS DEL DOBLE FACTOR DE AUTENTICACION
    $routes->group('totp', static function ($routes) {
        // ENDPOINT PARA GENERAR SECRETO Y URI DEL QR
        $routes->post('setup', 'Api\V1\TotpController::setup');
        // ENDPOINT PARA VERIFICAR EL PRIMER CODIGO Y ACTIVAR
        $routes->post('verify', 'Api\V1\TotpController::verify');
        // ENDPOINT PARA DESACTIVAR EL 2FA TRAS VERIFICAR CODIGO
        $routes->post('disable', 'Api\V1\TotpController::disable');
    });
});
