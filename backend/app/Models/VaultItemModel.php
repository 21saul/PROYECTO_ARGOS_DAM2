<?php
/**
 * VAULT ITEM MODEL
 *
 * RESUMEN: MODELO DE PERSISTENCIA QUE GESTIONA EL ACCESO A LA
 * TABLA vault_items DONDE SE ALMACENAN LOS ELEMENTOS CIFRADOS
 * DE LA BOVEDA DEL USUARIO.
 *
 * LOGICA DE NEGOCIO: EL CAMPO encrypted_blob ES LONGBLOB Y
 * CONTIENE EL DATO YA CIFRADO POR EL CLIENTE. EL SERVIDOR NO
 * TIENE NI LA CLAVE NI EL IV EN CLARO. CADA ITEM PERTENECE A
 * UN UNICO USUARIO Y OPCIONALMENTE A UNA CARPETA.
 *
 * RELACIONES:
 * - VaultController (CONSUMIDOR DIRECTO)
 * - users (FK user_id)
 * - vault_folders (FK folder_id, OPCIONAL)
 */
namespace App\Models;

// IMPORTACION DE LA CLASE BASE DE MODELOS DE CI4
use CodeIgniter\Model;

class VaultItemModel extends Model
{
    // TABLA SOBRE LA QUE OPERA EL MODELO
    protected $table = 'vault_items';

    // CLAVE PRIMARIA DE LA TABLA
    protected $primaryKey = 'id';

    // CAMPOS PERMITIDOS PARA INSERCION Y ACTUALIZACION
    protected $allowedFields = [
        'user_id',
        'folder_id',
        'item_type',
        'encrypted_blob',
        'size_bytes',
    ];

    // TIPO DE DATO DE RETORNO POR DEFECTO
    protected $returnType = 'array';

    // ACTIVAR TIMESTAMPS AUTOMATICOS created_at Y updated_at
    protected $useTimestamps = true;

    // REGLAS DE VALIDACION DE NEGOCIO BASICAS
    protected $validationRules = [
        'user_id' => 'required|integer',
        'item_type' => 'required|in_list[password,note,file]',
        'encrypted_blob' => 'required',
    ];

    // MENSAJES DE VALIDACION PERSONALIZADOS EN ESPANOL
    protected $validationMessages = [
        'user_id' => [
            'required' => 'El identificador de usuario es obligatorio',
        ],
        'item_type' => [
            'required' => 'El tipo de elemento es obligatorio',
            'in_list' => 'El tipo debe ser password, note o file',
        ],
        'encrypted_blob' => [
            'required' => 'El bloque cifrado es obligatorio',
        ],
    ];

    // RECUPERA TODOS LOS ITEMS DE UN USUARIO ORDENADOS POR FECHA
    public function findByUser(int $userId): array
    {
        return $this->where('user_id', $userId)
                    ->orderBy('updated_at', 'DESC')
                    ->findAll();
    }

    // RECUPERA ITEMS DE UN USUARIO FILTRADOS POR CARPETA
    public function findByUserAndFolder(int $userId, ?int $folderId): array
    {
        $builder = $this->where('user_id', $userId);

        // SI folderId ES NULL DEVUELVE ITEMS SIN CARPETA
        if ($folderId === null) {
            $builder = $builder->where('folder_id', null);
        } else {
            $builder = $builder->where('folder_id', $folderId);
        }

        return $builder->orderBy('updated_at', 'DESC')->findAll();
    }

    // RECUPERA ITEMS DE UN USUARIO FILTRADOS POR TIPO
    public function findByUserAndType(int $userId, string $type): array
    {
        return $this->where('user_id', $userId)
                    ->where('item_type', $type)
                    ->orderBy('updated_at', 'DESC')
                    ->findAll();
    }

    // VERIFICA QUE UN ITEM EXISTE Y PERTENECE AL USUARIO
    public function belongsToUser(int $itemId, int $userId): bool
    {
        $item = $this->where('id', $itemId)
                     ->where('user_id', $userId)
                     ->first();
        return $item !== null;
    }
}
