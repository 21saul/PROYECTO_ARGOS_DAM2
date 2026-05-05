<?php
/**
 * MIGRACION CreateVaultItemsTable
 *
 * RESUMEN: CREA LA TABLA vault_items QUE ALMACENA LOS
 * ELEMENTOS CIFRADOS DE LA BOVEDA (CONTRASENAS, NOTAS Y
 * ARCHIVOS) BAJO EL MODELO ZERO-KNOWLEDGE.
 *
 * LOGICA DE NEGOCIO: EL CAMPO encrypted_blob ES LONGBLOB
 * Y CONTIENE EL DATO YA CIFRADO POR EL CLIENTE CON
 * AES-256-GCM. EL SERVIDOR NO TIENE NI LA CLAVE NI EL IV
 * EN CLARO, POR LO QUE NUNCA PUEDE DESCIFRAR ESTOS BLOBS.
 *
 * EL CAMPO item_type INDICA EL TIPO DE ELEMENTO PARA QUE
 * EL CLIENTE SEPA COMO INTERPRETARLO TRAS EL DESCIFRADO
 * (PASSWORD, NOTE, FILE).
 *
 * RELACION: CADA ELEMENTO PERTENECE A UN USUARIO Y,
 * OPCIONALMENTE, A UNA CARPETA.
 */
namespace App\Database\Migrations;

// IMPORTACION DE LA CLASE BASE DE MIGRACIONES DE CI4
use CodeIgniter\Database\Migration;

class CreateVaultItemsTable extends Migration
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
            // CLAVE FORANEA OPCIONAL A LA CARPETA CONTENEDORA
            'folder_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'null' => true,
            ],
            // TIPO DE ELEMENTO: PASSWORD, NOTE O FILE
            'item_type' => [
                'type' => 'ENUM',
                'constraint' => ['password', 'note', 'file'],
                'default' => 'password',
            ],
            // BLOB CIFRADO OPACO QUE EL SERVIDOR NO PUEDE LEER
            'encrypted_blob' => [
                'type' => 'LONGBLOB',
            ],
            // TAMANO ORIGINAL DEL DATO ANTES DEL CIFRADO
            'size_bytes' => [
                'type' => 'INT',
                'unsigned' => true,
                'default' => 0,
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

        // INDICE PARA ACELERAR FILTRADO POR CARPETA
        $this->forge->addKey('folder_id');

        // CLAVE FORANEA AL USUARIO CON BORRADO EN CASCADA
        $this->forge->addForeignKey(
            'user_id',
            'users',
            'id',
            'CASCADE',
            'CASCADE'
        );

        // CLAVE FORANEA A LA CARPETA, NULL SI SE BORRA
        $this->forge->addForeignKey(
            'folder_id',
            'vault_folders',
            'id',
            'SET NULL',
            'CASCADE'
        );

        // CREACION FISICA DE LA TABLA EN LA BASE DE DATOS
        $this->forge->createTable('vault_items');
    }

    // METODO QUE SE EJECUTA AL REVERTIR LA MIGRACION
    public function down()
    {
        // ELIMINA LA TABLA EN CASO DE ROLLBACK
        $this->forge->dropTable('vault_items');
    }
}
