<?php
/**
 * MIGRACION CreateVirustotalRateLimitTable
 *
 * RESUMEN: CREA LA TABLA virustotal_rate_limit QUE REGISTRA
 * EL CONSUMO DE LA CUOTA DE VIRUSTOTAL POR MINUTO Y POR DIA.
 *
 * LOGICA DE NEGOCIO: EL TIER GRATUITO DE VIRUSTOTAL PERMITE
 * 4 PETICIONES POR MINUTO Y 500 AL DIA. CADA CONSULTA
 * INSERTA UN REGISTRO Y ANTES DE CONSULTAR SE CUENTAN LOS
 * REGISTROS DEL ULTIMO MINUTO Y DEL DIA ACTUAL. SI ALGUNO
 * SUPERA EL LIMITE, SE RECHAZA LA PETICION CON 429.
 */
namespace App\Database\Migrations;

// IMPORTACION DE LA CLASE BASE DE MIGRACIONES DE CI4
use CodeIgniter\Database\Migration;

class CreateVirustotalRateLimitTable extends Migration
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
            // TIMESTAMP DE LA CONSULTA
            'consumed_at' => [
                'type' => 'DATETIME',
            ],
        ]);

        // CLAVE PRIMARIA
        $this->forge->addPrimaryKey('id');

        // INDICE PARA ACELERAR LAS CONSULTAS POR FECHA
        $this->forge->addKey('consumed_at');

        // CREACION FISICA DE LA TABLA
        $this->forge->createTable('virustotal_rate_limit');
    }

    // METODO QUE SE EJECUTA AL REVERTIR LA MIGRACION
    public function down()
    {
        // ELIMINA LA TABLA EN CASO DE ROLLBACK
        $this->forge->dropTable('virustotal_rate_limit');
    }
}
