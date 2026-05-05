<?php
/**
 * MIGRACION CreateAuditLogsTable
 *
 * RESUMEN: CREA LA TABLA audit_logs QUE REGISTRA LAS
 * ACCIONES SENSIBLES DEL USUARIO (LOGIN, CAMBIO DE 2FA,
 * ACCESO A LA BOVEDA, ETC.) PARA TRAZABILIDAD Y SEGURIDAD.
 *
 * LOGICA DE NEGOCIO: NUNCA SE GUARDA CONTENIDO SENSIBLE EN
 * ESTA TABLA, SOLO METADATOS DE LA ACCION. SIRVE PARA QUE
 * EL USUARIO PUEDA CONSULTAR EL HISTORIAL DE ACCESOS A SU
 * CUENTA Y PARA DETECTAR ACTIVIDAD SOSPECHOSA.
 */
namespace App\Database\Migrations;

// IMPORTACION DE LA CLASE BASE DE MIGRACIONES DE CI4
use CodeIgniter\Database\Migration;

class CreateAuditLogsTable extends Migration
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
            // CLAVE FORANEA AL USUARIO QUE REALIZO LA ACCION
            'user_id' => [
                'type' => 'INT',
                'unsigned' => true,
                'null' => true,
            ],
            // NOMBRE DE LA ACCION REGISTRADA
            'action' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
            ],
            // DIRECCION IP DESDE LA QUE SE REALIZO LA ACCION
            'ip_address' => [
                'type' => 'VARCHAR',
                'constraint' => 45,
                'null' => true,
            ],
            // CADENA USER-AGENT DEL CLIENTE
            'user_agent' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            // RESULTADO DE LA ACCION (SUCCESS, FAILED, BLOCKED)
            'status' => [
                'type' => 'ENUM',
                'constraint' => ['success', 'failed', 'blocked'],
                'default' => 'success',
            ],
            // FECHA Y HORA DEL EVENTO
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        // DEFINICION DE LA CLAVE PRIMARIA
        $this->forge->addPrimaryKey('id');

        // INDICE PARA CONSULTAR HISTORIAL POR USUARIO
        $this->forge->addKey('user_id');

        // INDICE PARA FILTRAR POR TIPO DE ACCION
        $this->forge->addKey('action');

        // CLAVE FORANEA AL USUARIO, NULL SI EL USER SE BORRA
        $this->forge->addForeignKey(
            'user_id',
            'users',
            'id',
            'SET NULL',
            'CASCADE'
        );

        // CREACION FISICA DE LA TABLA EN LA BASE DE DATOS
        $this->forge->createTable('audit_logs');
    }

    // METODO QUE SE EJECUTA AL REVERTIR LA MIGRACION
    public function down()
    {
        // ELIMINA LA TABLA EN CASO DE ROLLBACK
        $this->forge->dropTable('audit_logs');
    }
}
