<?php
/**
 * MIGRACION CreateVaultFoldersTable
 *
 * RESUMEN: CREA LA TABLA vault_folders QUE ALMACENA LAS
 * CARPETAS ORGANIZATIVAS DE LA BOVEDA DE CADA USUARIO.
 *
 * LOGICA DE NEGOCIO: LOS METADATOS DE CARPETA (NOMBRE,
 * COLOR, ICONO) VIAJAN Y SE GUARDAN EN CLARO PORQUE NO
 * REVELAN INFORMACION SENSIBLE. LOS ELEMENTOS QUE CONTIENEN
 * SI ESTAN CIFRADOS Y SE GESTIONAN EN LA TABLA vault_items.
 *
 * RELACION: CADA CARPETA PERTENECE A UN UNICO USUARIO Y
 * CONTIENE CERO O MAS vault_items.
 */
namespace App\Database\Migrations;

// IMPORTACION DE LA CLASE BASE DE MIGRACIONES DE CI4
use CodeIgniter\Database\Migration;

class CreateVaultFoldersTable extends Migration
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
            // NOMBRE VISIBLE DE LA CARPETA EN LA INTERFAZ
            'name' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
            ],
            // COLOR HEXADECIMAL ASOCIADO PARA EL DISENO
            'color' => [
                'type' => 'VARCHAR',
                'constraint' => 7,
                'default' => '#7C3AED',
            ],
            // NOMBRE DEL ICONO DE PHOSPHOR ICONS A MOSTRAR
            'icon' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'default' => 'folder',
            ],
            // FECHA DE CREACION DEL REGISTRO
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            // FECHA DE ULTIMA ACTUALIZACION DEL REGISTRO
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        // DEFINICION DE LA CLAVE PRIMARIA
        $this->forge->addPrimaryKey('id');

        // INDICE PARA ACELERAR LAS BUSQUEDAS POR USUARIO
        $this->forge->addKey('user_id');

        // CLAVE FORANEA QUE GARANTIZA INTEGRIDAD REFERENCIAL
        $this->forge->addForeignKey(
            'user_id',
            'users',
            'id',
            'CASCADE',
            'CASCADE'
        );

        // CREACION FISICA DE LA TABLA EN LA BASE DE DATOS
        $this->forge->createTable('vault_folders');
    }

    // METODO QUE SE EJECUTA AL REVERTIR LA MIGRACION
    public function down()
    {
        // ELIMINA LA TABLA EN CASO DE ROLLBACK
        $this->forge->dropTable('vault_folders');
    }
}
