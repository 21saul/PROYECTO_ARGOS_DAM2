<?php
/**
 * FOLDER CONTROLLER
 *
 * RESUMEN: GESTIONA EL CRUD DE LAS CARPETAS ORGANIZATIVAS DE
 * LA BOVEDA DEL USUARIO AUTENTICADO.
 *
 * LOGICA DE NEGOCIO: LAS CARPETAS SON METADATOS EN CLARO QUE
 * AGRUPAN LOS ELEMENTOS CIFRADOS. AL ELIMINAR UNA CARPETA,
 * LOS ELEMENTOS QUE CONTENIA QUEDAN SIN CARPETA (folder_id
 * NULL) PERO NO SE BORRAN, GRACIAS A LA RESTRICCION ON
 * DELETE SET NULL DE LA MIGRACION.
 *
 * ENDPOINTS:
 * - GET    /api/v1/vault/folders         LISTAR CARPETAS
 * - POST   /api/v1/vault/folders         CREAR CARPETA
 * - GET    /api/v1/vault/folders/{id}    OBTENER CARPETA
 * - PUT    /api/v1/vault/folders/{id}    ACTUALIZAR CARPETA
 * - DELETE /api/v1/vault/folders/{id}    ELIMINAR CARPETA
 *
 * RELACIONES:
 * - VaultFolderModel (PERSISTENCIA)
 * - JwtAuthFilter (AUTENTICACION)
 */
namespace App\Controllers\Api\V1;

// IMPORTACION DEL CONTROLADOR BASE DE CI4
use App\Controllers\BaseController;

// IMPORTACION DEL MODELO DE CARPETAS
use App\Models\VaultFolderModel;

// IMPORTACION DE LA INTERFAZ DE RESPUESTA HTTP DE CI4
use CodeIgniter\HTTP\ResponseInterface;

class FolderController extends BaseController
{
    // INSTANCIA DEL MODELO PARA OPERAR SOBRE vault_folders
    private VaultFolderModel $folderModel;

    // CONSTRUCTOR QUE INYECTA EL MODELO
    public function __construct()
    {
        $this->folderModel = new VaultFolderModel();
    }

    // LISTA TODAS LAS CARPETAS DEL USUARIO CON SU CONTADOR DE ITEMS
    public function index(): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // RECUPERA LAS CARPETAS DEL USUARIO CON CONTADOR DE ITEMS
        $folders = $this->folderModel->findByUserWithCount($userId);

        // NORMALIZA TIPOS NUMERICOS PORQUE EL DRIVER DEVUELVE TODO COMO STRING
        foreach ($folders as &$folder) {
            $this->castFolderTypes($folder);
        }

        // DEVUELVE LA LISTA EN EL FORMATO ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => $folders,
            'error' => null,
        ]);
    }

    // CONVIERTE LOS CAMPOS NUMERICOS DE UNA CARPETA A INT REAL
    // GARANTIZA QUE EL FRONTEND HAGA COMPARACIONES Y SUMAS CORRECTAS
    private function castFolderTypes(array &$folder): void
    {
        if (isset($folder['id']))         $folder['id']         = (int) $folder['id'];
        if (isset($folder['user_id']))    $folder['user_id']    = (int) $folder['user_id'];
        if (isset($folder['item_count'])) $folder['item_count'] = (int) $folder['item_count'];
    }

    // CREA UNA NUEVA CARPETA EN LA BOVEDA DEL USUARIO
    public function create(): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // RECOGE LOS CAMPOS DEL CUERPO JSON
        $name = $this->request->getJsonVar('name');
        $color = $this->request->getJsonVar('color') ?? '#7C3AED';
        $icon = $this->request->getJsonVar('icon') ?? 'folder';

        // VALIDA QUE LLEGUE EL NOMBRE
        if (!$name) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'MISSING_NAME',
                    'message' => 'El nombre de la carpeta es obligatorio',
                ],
            ]);
        }

        // PREPARA LOS DATOS PARA LA INSERCION
        $data = [
            'user_id' => $userId,
            'name' => $name,
            'color' => $color,
            'icon' => $icon,
        ];

        // INSERTA LA CARPETA EN LA BASE DE DATOS
        $folderId = $this->folderModel->insert($data);

        // SI LA INSERCION FALLO POR VALIDACION
        if ($folderId === false) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Datos invalidos',
                    'details' => $this->folderModel->errors(),
                ],
            ]);
        }

        // DEVUELVE EL ID DE LA NUEVA CARPETA
        return $this->response->setStatusCode(201)->setJSON([
            'success' => true,
            'data' => [
                'id' => $folderId,
                'name' => $name,
                'color' => $color,
                'icon' => $icon,
                'item_count' => 0,
            ],
            'error' => null,
        ]);
    }

    // OBTIENE UNA CARPETA CONCRETA POR SU ID
    public function show(int $id): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // VERIFICA QUE LA CARPETA PERTENECE AL USUARIO
        if (!$this->folderModel->belongsToUser($id, $userId)) {
            return $this->response->setStatusCode(404)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'FOLDER_NOT_FOUND',
                    'message' => 'Carpeta no encontrada',
                ],
            ]);
        }

        // RECUPERA LA CARPETA Y SU CONTADOR DE ITEMS
        $folder = $this->folderModel->find($id);
        $db = \Config\Database::connect();
        $folder['item_count'] = $db->table('vault_items')
                                   ->where('folder_id', $id)
                                   ->countAllResults();

        // NORMALIZA LOS TIPOS NUMERICOS A INT REAL
        $this->castFolderTypes($folder);

        // DEVUELVE LA CARPETA EN EL FORMATO ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => $folder,
            'error' => null,
        ]);
    }

    // ACTUALIZA UNA CARPETA EXISTENTE DEL USUARIO
    public function update(int $id): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // VERIFICA QUE LA CARPETA PERTENECE AL USUARIO
        if (!$this->folderModel->belongsToUser($id, $userId)) {
            return $this->response->setStatusCode(404)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'FOLDER_NOT_FOUND',
                    'message' => 'Carpeta no encontrada',
                ],
            ]);
        }

        // RECOGE LOS CAMPOS A ACTUALIZAR
        $data = [];
        $name = $this->request->getJsonVar('name');
        $color = $this->request->getJsonVar('color');
        $icon = $this->request->getJsonVar('icon');

        // AGREGA SOLO LOS CAMPOS QUE LLEGAN
        if ($name !== null) $data['name'] = $name;
        if ($color !== null) $data['color'] = $color;
        if ($icon !== null) $data['icon'] = $icon;

        // SI NO HAY NADA QUE ACTUALIZAR DEVUELVE 400
        if (empty($data)) {
            return $this->response->setStatusCode(400)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'NO_CHANGES',
                    'message' => 'No hay campos para actualizar',
                ],
            ]);
        }

        // EJECUTA LA ACTUALIZACION EN LA BASE DE DATOS
        $result = $this->folderModel->update($id, $data);

        // SI LA VALIDACION FALLO DEVUELVE 422
        if ($result === false) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Datos invalidos',
                    'details' => $this->folderModel->errors(),
                ],
            ]);
        }

        // DEVUELVE CONFIRMACION
        return $this->response->setJSON([
            'success' => true,
            'data' => [
                'id' => $id,
                'updated' => true,
            ],
            'error' => null,
        ]);
    }

    // ELIMINA UNA CARPETA DE LA BOVEDA DEL USUARIO
    public function delete(int $id): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // VERIFICA QUE LA CARPETA PERTENECE AL USUARIO
        if (!$this->folderModel->belongsToUser($id, $userId)) {
            return $this->response->setStatusCode(404)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'FOLDER_NOT_FOUND',
                    'message' => 'Carpeta no encontrada',
                ],
            ]);
        }

        // ELIMINA LA CARPETA. LOS ITEMS DENTRO QUEDAN CON folder_id NULL
        // GRACIAS A LA RESTRICCION ON DELETE SET NULL DE LA MIGRACION
        $this->folderModel->delete($id);

        // DEVUELVE CONFIRMACION
        return $this->response->setJSON([
            'success' => true,
            'data' => [
                'id' => $id,
                'deleted' => true,
            ],
            'error' => null,
        ]);
    }
}
