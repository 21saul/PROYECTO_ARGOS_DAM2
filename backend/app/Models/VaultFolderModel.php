<?php
/**
 * VAULT FOLDER MODEL
 *
 * RESUMEN: MODELO DE PERSISTENCIA QUE GESTIONA EL ACCESO A LA
 * TABLA vault_folders DONDE SE ALMACENAN LAS CARPETAS
 * ORGANIZATIVAS DE LA BOVEDA DEL USUARIO.
 *
 * LOGICA DE NEGOCIO: LOS METADATOS DE CARPETA (NOMBRE, COLOR,
 * ICONO) VIAJAN Y SE GUARDAN EN CLARO PORQUE NO REVELAN
 * INFORMACION SENSIBLE. LOS ELEMENTOS DENTRO SI ESTAN CIFRADOS
 * Y SE GESTIONAN EN VaultItemModel.
 *
 * RELACIONES:
 * - VaultController (CONSUMIDOR DIRECTO)
 * - users (FK user_id)
 * - vault_items (RELACION INVERSA, UN FOLDER CONTIENE N ITEMS)
 */
namespace App\Models;

// IMPORTACION DE LA CLASE BASE DE MODELOS DE CI4
use CodeIgniter\Model;

class VaultFolderModel extends Model
{
    // TABLA SOBRE LA QUE OPERA EL MODELO
    protected $table = 'vault_folders';

    // CLAVE PRIMARIA DE LA TABLA
    protected $primaryKey = 'id';

    // CAMPOS PERMITIDOS PARA INSERCION Y ACTUALIZACION
    protected $allowedFields = [
        'user_id',
        'name',
        'color',
        'icon',
    ];

    // TIPO DE DATO DE RETORNO POR DEFECTO
    protected $returnType = 'array';

    // ACTIVAR TIMESTAMPS AUTOMATICOS
    protected $useTimestamps = true;

    // REGLAS DE VALIDACION DE NEGOCIO
    protected $validationRules = [
        'user_id' => 'required|integer',
        'name' => 'required|min_length[1]|max_length[100]',
        'color' => 'permit_empty|max_length[7]',
        'icon' => 'permit_empty|max_length[50]',
    ];

    // MENSAJES DE VALIDACION PERSONALIZADOS EN ESPANOL
    protected $validationMessages = [
        'name' => [
            'required' => 'El nombre de la carpeta es obligatorio',
            'min_length' => 'El nombre no puede estar vacio',
            'max_length' => 'El nombre no puede exceder 100 caracteres',
        ],
    ];

    // RECUPERA TODAS LAS CARPETAS DE UN USUARIO ORDENADAS POR NOMBRE
    public function findByUser(int $userId): array
    {
        return $this->where('user_id', $userId)
                    ->orderBy('name', 'ASC')
                    ->findAll();
    }

    // RECUPERA CARPETAS DE UN USUARIO CON CONTADOR DE ITEMS
    public function findByUserWithCount(int $userId): array
    {
        // OBTIENE LAS CARPETAS BASICAS DEL USUARIO
        $folders = $this->findByUser($userId);

        // INSTANCIA LA CONEXION PARA EL CONTEO
        $db = \Config\Database::connect();

        // PARA CADA CARPETA AGREGA EL CONTADOR DE ITEMS
        foreach ($folders as &$folder) {
            $count = $db->table('vault_items')
                        ->where('folder_id', $folder['id'])
                        ->where('user_id', $userId)
                        ->countAllResults();
            $folder['item_count'] = $count;
        }

        return $folders;
    }

    // VERIFICA QUE UNA CARPETA EXISTE Y PERTENECE AL USUARIO
    public function belongsToUser(int $folderId, int $userId): bool
    {
        $folder = $this->where('id', $folderId)
                       ->where('user_id', $userId)
                       ->first();
        return $folder !== null;
    }
}
