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

    // SUBGRUPO DE RUTAS DE LA BOVEDA PROTEGIDAS POR JWT
    $routes->group('vault', ['filter' => 'jwtauth'], static function ($routes) {

        // SUBGRUPO DE RUTAS DE ELEMENTOS DE LA BOVEDA
        $routes->group('items', static function ($routes) {
            // LISTAR ELEMENTOS DEL USUARIO AUTENTICADO
            $routes->get('/', 'Api\V1\VaultController::index');
            // CREAR UN NUEVO ELEMENTO CIFRADO
            $routes->post('/', 'Api\V1\VaultController::create');
            // OBTENER UN ELEMENTO CONCRETO POR ID
            $routes->get('(:num)', 'Api\V1\VaultController::show/$1');
            // ACTUALIZAR UN ELEMENTO EXISTENTE
            $routes->put('(:num)', 'Api\V1\VaultController::update/$1');
            // ELIMINAR UN ELEMENTO DE LA BOVEDA
            $routes->delete('(:num)', 'Api\V1\VaultController::delete/$1');
        });

        // SUBGRUPO DE RUTAS DE CARPETAS DE LA BOVEDA
        $routes->group('folders', static function ($routes) {
            // LISTAR CARPETAS DEL USUARIO CON CONTADOR DE ITEMS
            $routes->get('/', 'Api\V1\FolderController::index');
            // CREAR UNA NUEVA CARPETA
            $routes->post('/', 'Api\V1\FolderController::create');
            // OBTENER UNA CARPETA CONCRETA POR ID
            $routes->get('(:num)', 'Api\V1\FolderController::show/$1');
            // ACTUALIZAR METADATOS DE UNA CARPETA
            $routes->put('(:num)', 'Api\V1\FolderController::update/$1');
            // ELIMINAR UNA CARPETA (LOS ITEMS QUEDAN SIN CARPETA)
            $routes->delete('(:num)', 'Api\V1\FolderController::delete/$1');
        });
    });
});
