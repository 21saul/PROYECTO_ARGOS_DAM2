<?php
/**
 * MIGRACION CreateNewsCacheTable
 *
 * RESUMEN: CREA LA TABLA news_cache QUE ALMACENA LAS
 * NOTICIAS DE CIBERSEGURIDAD Y LOS CVE CRITICOS RECOPILADOS
 * POR EL FLUJO DE n8n DESDE FUENTES EXTERNAS.
 *
 * LOGICA DE NEGOCIO: EL FLUJO DE n8n SE EJECUTA CADA 24
 * HORAS Y POBLA ESTA TABLA CON DATOS NORMALIZADOS DE INCIBE,
 * HISPASEC, BLEEPINGCOMPUTER, THE HACKER NEWS Y EL NVD. EL
 * ENDPOINT GET /api/v1/news SIRVE LA CACHE DIRECTAMENTE A
 * LA APP MOVIL.
 */
namespace App\Database\Migrations;

// IMPORTACION DE LA CLASE BASE DE MIGRACIONES DE CI4
use CodeIgniter\Database\Migration;

class CreateNewsCacheTable extends Migration
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
            // CATEGORIA DE LA NOTICIA O ALERTA
            'category' => [
                'type' => 'ENUM',
                'constraint' => ['cve', 'phishing', 'breach', 'resource'],
                'default' => 'cve',
            ],
            // FUENTE ORIGEN DE LA NOTICIA
            'source' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
            ],
            // TITULO DE LA NOTICIA O CVE
            'title' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            // DESCRIPCION CORTA O RESUMEN
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            // URL DE LA NOTICIA ORIGINAL
            'url' => [
                'type' => 'VARCHAR',
                'constraint' => 500,
                'null' => true,
            ],
            // CODIGO CVE SI APLICA (EJ. CVE-2026-12345)
            'cve_id' => [
                'type' => 'VARCHAR',
                'constraint' => 30,
                'null' => true,
            ],
            // PUNTUACION CVSS V3 SI APLICA
            'cvss_score' => [
                'type' => 'DECIMAL',
                'constraint' => '3,1',
                'null' => true,
            ],
            // SEVERIDAD: LOW, MEDIUM, HIGH, CRITICAL
            'severity' => [
                'type' => 'ENUM',
                'constraint' => ['low', 'medium', 'high', 'critical'],
                'default' => 'medium',
            ],
            // PRODUCTO AFECTADO SI APLICA
            'affected_product' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
                'null' => true,
            ],
            // FECHA DE PUBLICACION ORIGINAL
            'published_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            // FECHA DE INSERCION EN LA CACHE
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        // DEFINICION DE LA CLAVE PRIMARIA
        $this->forge->addPrimaryKey('id');

        // INDICE PARA FILTRAR POR CATEGORIA EN EL PANEL
        $this->forge->addKey('category');

        // INDICE PARA ORDENAR POR FECHA DE PUBLICACION
        $this->forge->addKey('published_at');

        // INDICE PARA BUSCAR CVES ESPECIFICOS
        $this->forge->addKey('cve_id');

        // CREACION FISICA DE LA TABLA EN LA BASE DE DATOS
        $this->forge->createTable('news_cache');
    }

    // METODO QUE SE EJECUTA AL REVERTIR LA MIGRACION
    public function down()
    {
        // ELIMINA LA TABLA EN CASO DE ROLLBACK
        $this->forge->dropTable('news_cache');
    }
}
