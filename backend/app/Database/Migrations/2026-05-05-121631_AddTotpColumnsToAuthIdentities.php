<?php
/**
 * MIGRACION AddTotpColumnsToAuthIdentities
 *
 * RESUMEN: ANADE LAS COLUMNAS totp_secret Y totp_enabled A
 * LA TABLA auth_identities DE CODEIGNITER SHIELD PARA
 * SOPORTAR EL DOBLE FACTOR DE AUTENTICACION.
 *
 * LOGICA DE NEGOCIO: EL totp_secret SE GENERA UNA UNICA VEZ
 * AL ACTIVAR EL 2FA Y SE ALMACENA CIFRADO. EL CLIENTE
 * ESCANEA UN QR DERIVADO DE ESE SECRET CON UNA APP TIPO
 * GOOGLE AUTHENTICATOR Y A PARTIR DE AHI GENERA CODIGOS DE
 * 6 DIGITOS. totp_enabled INDICA SI EL USUARIO HA TERMINADO
 * EL FLUJO DE ACTIVACION VERIFICANDO UN PRIMER CODIGO
 * VALIDO.
 */
namespace App\Database\Migrations;

// IMPORTACION DE LA CLASE BASE DE MIGRACIONES DE CI4
use CodeIgniter\Database\Migration;

class AddTotpColumnsToAuthIdentities extends Migration
{
    // METODO QUE SE EJECUTA AL APLICAR LA MIGRACION
    public function up()
    {
        // ANADE LAS DOS COLUMNAS A LA TABLA YA EXISTENTE
        $this->forge->addColumn('auth_identities', [
            // SECRETO TOTP CIFRADO EN BASE32
            'totp_secret' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
                'after' => 'last_used_at',
            ],
            // BOOLEANO QUE INDICA SI EL 2FA ESTA ACTIVADO
            'totp_enabled' => [
                'type' => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
                'after' => 'totp_secret',
            ],
        ]);
    }

    // METODO QUE SE EJECUTA AL REVERTIR LA MIGRACION
    public function down()
    {
        // ELIMINA LAS DOS COLUMNAS ANADIDAS
        $this->forge->dropColumn('auth_identities', ['totp_secret', 'totp_enabled']);
    }
}
