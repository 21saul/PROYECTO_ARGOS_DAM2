<?php
/**
 * MIGRACION CreatePhishtankCacheTable
 *
 * RESUMEN: CREA LA TABLA phishtank_cache QUE ALMACENA LAS
 * RESPUESTAS DE PHISHTANK PARA CADA URL CONSULTADA.
 *
 * LOGICA DE NEGOCIO: PHISHTANK TIENE LIMITES DE TASA Y SU
 * BASE DE DATOS NO CAMBIA TAN A MENUDO. CACHEAR LAS RESPUESTAS
 * 6 HORAS REDUCE LATENCIA Y EVITA AGOTAR LA CUOTA. LA URL SE
 * HASHEA CON SHA-256 PARA USARLA COMO INDICE.
 */
namespace App\Database\Migrations;

// IMPORTACION DE LA CLASE BASE DE MIGRACIONES DE CI4
use CodeIgniter\Database\Migration;

class CreatePhishtankCacheTable extends Migration
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
            // HASH SHA-256 DE LA URL COMO INDICE
            'url_hash' => [
                'type' => 'CHAR',
                'constraint' => 64,
            ],
            // URL ORIGINAL CONSULTADA
            'url' => [
                'type' => 'VARCHAR',
                'constraint' => 2048,
            ],
            // VEREDICTO BOOLEANO DE PHISHTANK
            'is_phishing' => [
                'type' => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
            ],
            // RESPUESTA COMPLETA DE PHISHTANK EN JSON
            'response_json' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            // FECHA DE LA CONSULTA
            'fetched_at' => [
                'type' => 'DATETIME',
            ],
        ]);

        // CLAVE PRIMARIA
        $this->forge->addPrimaryKey('id');

        // INDICE UNICO POR HASH DE URL
        $this->forge->addUniqueKey('url_hash');

        // CREACION FISICA DE LA TABLA
        $this->forge->createTable('phishtank_cache');
    }

    // METODO QUE SE EJECUTA AL REVERTIR LA MIGRACION
    public function down()
    {
        // ELIMINA LA TABLA EN CASO DE ROLLBACK
        $this->forge->dropTable('phishtank_cache');
    }
}
