<?php
/**
 * MIGRACION AddZeroKnowledgeColumnsToUsers
 *
 * RESUMEN: ANADE A LA TABLA users LAS COLUMNAS NECESARIAS
 * PARA OPERAR BAJO EL MODELO ZERO-KNOWLEDGE: PARAMETROS DE
 * DERIVACION ARGON2ID Y EL BLOB CIFRADO PRINCIPAL DE LA
 * BOVEDA DEL USUARIO.
 *
 * LOGICA DE NEGOCIO: EL CLIENTE NECESITA RECUPERAR EL
 * kdf_salt Y kdf_params PARA RE-DERIVAR LA CLAVE MAESTRA
 * EN CADA INICIO DE SESION. EL vault_blob ES EL CONTENEDOR
 * CIFRADO DE LA BOVEDA QUE EL CLIENTE DESCIFRA TRAS EL
 * LOGIN. EL SERVIDOR NUNCA TIENE LA CLAVE PARA DESCIFRARLO.
 */
namespace App\Database\Migrations;

// IMPORTACION DE LA CLASE BASE DE MIGRACIONES DE CI4
use CodeIgniter\Database\Migration;

class AddZeroKnowledgeColumnsToUsers extends Migration
{
    // METODO QUE SE EJECUTA AL APLICAR LA MIGRACION
    public function up()
    {
        // ANADE LAS COLUMNAS A LA TABLA users DE SHIELD
        $this->forge->addColumn('users', [
            // SAL DE ARGON2ID EN BASE64 GENERADA EN CLIENTE
            'kdf_salt' => [
                'type' => 'VARCHAR',
                'constraint' => 64,
                'null' => true,
                'after' => 'active',
            ],
            // ALGORITMO USADO (PARA MIGRACION FUTURA DE KDF)
            'kdf_algorithm' => [
                'type' => 'VARCHAR',
                'constraint' => 20,
                'default' => 'argon2id',
                'after' => 'kdf_salt',
            ],
            // PARAMETROS DE ARGON2ID EN JSON (m, t, p)
            'kdf_params' => [
                'type' => 'JSON',
                'null' => true,
                'after' => 'kdf_algorithm',
            ],
            // BLOB CIFRADO DE LA BOVEDA PRINCIPAL DEL USUARIO
            'vault_blob' => [
                'type' => 'LONGBLOB',
                'null' => true,
                'after' => 'kdf_params',
            ],
        ]);
    }

    // METODO QUE SE EJECUTA AL REVERTIR LA MIGRACION
    public function down()
    {
        // ELIMINA LAS COLUMNAS ANADIDAS
        $this->forge->dropColumn('users', [
            'kdf_salt',
            'kdf_algorithm',
            'kdf_params',
            'vault_blob',
        ]);
    }
}
