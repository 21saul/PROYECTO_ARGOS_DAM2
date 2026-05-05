<?php
/**
 * MIGRACION CreatePrivacyScoreHistoryTable
 *
 * RESUMEN: CREA LA TABLA privacy_score_history QUE GUARDA
 * LA EVOLUCION DIARIA DEL PRIVACY SCORE DE CADA USUARIO
 * PARA MOSTRAR LA TENDENCIA DE LAS ULTIMAS 8 SEMANAS.
 *
 * LOGICA DE NEGOCIO: CADA VEZ QUE EL CLIENTE CALCULA UN
 * NUEVO PRIVACY SCORE LO ENVIA AL ENDPOINT POST
 * /api/v1/auditor/score Y SE GUARDA EN ESTA TABLA. EL GET
 * DEVUELVE EL HISTORICO PARA RENDERIZAR EL GRAFICO DE
 * EVOLUCION TEMPORAL EN EL DASHBOARD.
 */
namespace App\Database\Migrations;

// IMPORTACION DE LA CLASE BASE DE MIGRACIONES DE CI4
use CodeIgniter\Database\Migration;

class CreatePrivacyScoreHistoryTable extends Migration
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
            // CLAVE FORANEA AL USUARIO PROPIETARIO
            'user_id' => [
                'type' => 'INT',
                'unsigned' => true,
            ],
            // NOTA GLOBAL DE 0 A 100
            'score' => [
                'type' => 'TINYINT',
                'unsigned' => true,
            ],
            // PUNTUACION DEL PILAR DE IDENTIDAD
            'identity_score' => [
                'type' => 'TINYINT',
                'unsigned' => true,
            ],
            // PUNTUACION DEL PILAR DE CONTRASENAS
            'passwords_score' => [
                'type' => 'TINYINT',
                'unsigned' => true,
            ],
            // PUNTUACION DEL PILAR DE DISPOSITIVO
            'device_score' => [
                'type' => 'TINYINT',
                'unsigned' => true,
            ],
            // FECHA DEL CALCULO
            'recorded_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        // DEFINICION DE LA CLAVE PRIMARIA
        $this->forge->addPrimaryKey('id');

        // INDICE PARA RECUPERAR HISTORICO DE UN USUARIO
        $this->forge->addKey(['user_id', 'recorded_at']);

        // CLAVE FORANEA AL USUARIO CON BORRADO EN CASCADA
        $this->forge->addForeignKey(
            'user_id',
            'users',
            'id',
            'CASCADE',
            'CASCADE'
        );

        // CREACION FISICA DE LA TABLA EN LA BASE DE DATOS
        $this->forge->createTable('privacy_score_history');
    }

    // METODO QUE SE EJECUTA AL REVERTIR LA MIGRACION
    public function down()
    {
        // ELIMINA LA TABLA EN CASO DE ROLLBACK
        $this->forge->dropTable('privacy_score_history');
    }
}
