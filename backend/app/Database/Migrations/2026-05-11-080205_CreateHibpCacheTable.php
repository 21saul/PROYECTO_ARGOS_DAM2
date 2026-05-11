<?php
/**
 * MIGRACION CreateHibpCacheTable
 *
 * RESUMEN: CREA LA TABLA hibp_cache QUE ALMACENA LAS RESPUESTAS
 * DEL SERVICIO HAVE I BEEN PWNED INDEXADAS POR EL PREFIJO DEL
 * HASH SHA-1 DE 5 CARACTERES (MODELO K-ANONYMITY).
 *
 * LOGICA DE NEGOCIO: CADA PREFIJO DEVUELVE CIENTOS DE HASHES
 * COINCIDENTES. CACHEAMOS LA RESPUESTA POR 24 HORAS PARA
 * REDUCIR LATENCIA Y NO AGOTAR LA CUOTA DE LA API DE HIBP.
 */
namespace App\Database\Migrations;

// IMPORTACION DE LA CLASE BASE DE MIGRACIONES DE CI4
use CodeIgniter\Database\Migration;

class CreateHibpCacheTable extends Migration
{
    // METODO QUE SE EJECUTA AL APLICAR LA MIGRACION
    public function up()
    {
        // DEFINICION DE LAS COLUMNAS DE LA TABLA
        $this->forge->addField([
            // IDENTIFICADOR PRIMARIO AUTOINCREMENTAL
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            // PREFIJO DE 5 CARACTERES DEL HASH SHA-1
            'hash_prefix' => [
                'type' => 'CHAR',
                'constraint' => 5,
            ],
            // RESPUESTA COMPLETA DE HIBP EN TEXTO PLANO
            'response_body' => [
                'type' => 'LONGTEXT',
            ],
            // FECHA DE LA RESPUESTA ORIGINAL
            'fetched_at' => [
                'type' => 'DATETIME',
            ],
        ]);

        // CLAVE PRIMARIA
        $this->forge->addPrimaryKey('id');

        // INDICE UNICO POR PREFIJO PARA LOOKUP RAPIDO
        $this->forge->addUniqueKey('hash_prefix');

        // CREACION FISICA DE LA TABLA
        $this->forge->createTable('hibp_cache');
    }

    // METODO QUE SE EJECUTA AL REVERTIR LA MIGRACION
    public function down()
    {
        // ELIMINA LA TABLA EN CASO DE ROLLBACK
        $this->forge->dropTable('hibp_cache');
    }
}
