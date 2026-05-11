<?php
/**
 * VAULT CONTROLLER
 *
 * RESUMEN: GESTIONA EL CRUD DE LOS ELEMENTOS CIFRADOS DE LA
 * BOVEDA DEL USUARIO AUTENTICADO.
 *
 * LOGICA DE NEGOCIO: EL SERVIDOR RECIBE BLOQUES YA CIFRADOS
 * DESDE EL CLIENTE Y LOS PERSISTE SIN CAPACIDAD DE
 * DESCIFRARLOS. CADA OPERACION VALIDA QUE EL ITEM PERTENECE
 * AL USUARIO QUE HACE LA PETICION ANTES DE CUALQUIER ACCION.
 *
 * ENDPOINTS:
 * - GET    /api/v1/vault/items       LISTAR ELEMENTOS
 * - POST   /api/v1/vault/items       CREAR ELEMENTO
 * - GET    /api/v1/vault/items/{id}  OBTENER ELEMENTO
 * - PUT    /api/v1/vault/items/{id}  ACTUALIZAR ELEMENTO
 * - DELETE /api/v1/vault/items/{id}  ELIMINAR ELEMENTO
 *
 * RELACIONES:
 * - VaultItemModel (PERSISTENCIA)
 * - JwtAuthFilter (AUTENTICACION)
 */
namespace App\Controllers\Api\V1;

// IMPORTACION DEL CONTROLADOR BASE DE CI4
use App\Controllers\BaseController;

// IMPORTACION DEL MODELO DE ELEMENTOS DE LA BOVEDA
use App\Models\VaultItemModel;

// IMPORTACION DE LA INTERFAZ DE RESPUESTA HTTP DE CI4
use CodeIgniter\HTTP\ResponseInterface;

class VaultController extends BaseController
{
    // INSTANCIA DEL MODELO PARA OPERAR SOBRE vault_items
    private VaultItemModel $itemModel;

    // CONSTRUCTOR QUE INYECTA EL MODELO
    public function __construct()
    {
        $this->itemModel = new VaultItemModel();
    }

    // LISTA TODOS LOS ELEMENTOS DEL USUARIO CON FILTROS OPCIONALES
    public function index(): ResponseInterface
    {
        // OBTIENE EL user_id INYECTADO POR EL JwtAuthFilter
        $userId = $this->request->user_id;

        // RECOGE LOS FILTROS OPCIONALES DEL QUERY STRING
        $folderId = $this->request->getGet('folder_id');
        $itemType = $this->request->getGet('item_type');

        // APLICA LA LOGICA DE FILTRADO SEGUN LOS PARAMETROS RECIBIDOS
        if ($itemType) {
            $items = $this->itemModel->findByUserAndType($userId, $itemType);
        } elseif ($folderId !== null) {
            $items = $this->itemModel->findByUserAndFolder(
                $userId,
                $folderId === '' || $folderId === '0' ? null : (int) $folderId
            );
        } else {
            $items = $this->itemModel->findByUser($userId);
        }

        // CONVIERTE LOS BLOBS BINARIOS A BASE64 PARA TRANSMISION JSON
        foreach ($items as &$item) {
            if (isset($item['encrypted_blob'])) {
                $item['encrypted_blob'] = base64_encode($item['encrypted_blob']);
            }
        }

        // DEVUELVE LA LISTA EN EL FORMATO DE RESPUESTA ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => $items,
            'error' => null,
        ]);
    }

    // CREA UN NUEVO ELEMENTO CIFRADO EN LA BOVEDA DEL USUARIO
    public function create(): ResponseInterface
    {
        // OBTIENE EL user_id INYECTADO POR EL FILTRO JWT
        $userId = $this->request->user_id;

        // RECOGE LOS CAMPOS DEL CUERPO JSON DE LA PETICION
        $itemType = $this->request->getJsonVar('item_type');
        $folderId = $this->request->getJsonVar('folder_id');
        $encryptedBlobBase64 = $this->request->getJsonVar('encrypted_blob');

        // VALIDA QUE LLEGUEN LOS CAMPOS OBLIGATORIOS
        if (!$itemType || !$encryptedBlobBase64) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'MISSING_FIELDS',
                    'message' => 'Faltan campos obligatorios',
                ],
            ]);
        }

        // DECODIFICA EL BLOB BASE64 RECIBIDO A BINARIO
        $encryptedBlob = base64_decode($encryptedBlobBase64, true);

        // VALIDA QUE EL BASE64 SEA CORRECTO
        if ($encryptedBlob === false) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'INVALID_BLOB',
                    'message' => 'El bloque cifrado no es base64 valido',
                ],
            ]);
        }

        // LIMITA EL TAMANO DEL BLOB A 5 MB PARA EVITAR ABUSO
        if (strlen($encryptedBlob) > 5 * 1024 * 1024) {
            return $this->response->setStatusCode(413)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'BLOB_TOO_LARGE',
                    'message' => 'El bloque excede el tamano maximo de 5MB',
                ],
            ]);
        }

        // SI VIENE folder_id VERIFICA QUE LA CARPETA ES DEL USUARIO
        if ($folderId) {
            $folderModel = new \App\Models\VaultFolderModel();
            if (!$folderModel->belongsToUser((int) $folderId, $userId)) {
                return $this->response->setStatusCode(403)->setJSON([
                    'success' => false,
                    'data' => null,
                    'error' => [
                        'code' => 'FOLDER_NOT_OWNED',
                        'message' => 'La carpeta no pertenece al usuario',
                    ],
                ]);
            }
        }

        // PREPARA LOS DATOS PARA LA INSERCION
        $data = [
            'user_id' => $userId,
            'folder_id' => $folderId ? (int) $folderId : null,
            'item_type' => $itemType,
            'encrypted_blob' => $encryptedBlob,
            'size_bytes' => strlen($encryptedBlob),
        ];

        // INSERTA EL ELEMENTO EN LA BASE DE DATOS
        $itemId = $this->itemModel->insert($data);

        // SI LA INSERCION FALLO POR VALIDACION DEVUELVE 422
        if ($itemId === false) {
            return $this->response->setStatusCode(422)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Datos invalidos',
                    'details' => $this->itemModel->errors(),
                ],
            ]);
        }

        // DEVUELVE EL ID DEL NUEVO ELEMENTO CREADO
        return $this->response->setStatusCode(201)->setJSON([
            'success' => true,
            'data' => [
                'id' => $itemId,
                'item_type' => $itemType,
                'folder_id' => $folderId ? (int) $folderId : null,
                'size_bytes' => strlen($encryptedBlob),
            ],
            'error' => null,
        ]);
    }

    // OBTIENE UN ELEMENTO CONCRETO POR SU ID
    public function show(int $id): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // VERIFICA QUE EL ITEM PERTENECE AL USUARIO
        if (!$this->itemModel->belongsToUser($id, $userId)) {
            return $this->response->setStatusCode(404)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'ITEM_NOT_FOUND',
                    'message' => 'Elemento no encontrado',
                ],
            ]);
        }

        // RECUPERA EL ITEM COMPLETO
        $item = $this->itemModel->find($id);

        // CONVIERTE EL BLOB A BASE64 PARA TRANSMISION JSON
        if (isset($item['encrypted_blob'])) {
            $item['encrypted_blob'] = base64_encode($item['encrypted_blob']);
        }

        // DEVUELVE EL ITEM EN EL FORMATO ESTANDAR
        return $this->response->setJSON([
            'success' => true,
            'data' => $item,
            'error' => null,
        ]);
    }

    // ACTUALIZA UN ELEMENTO EXISTENTE DEL USUARIO
    public function update(int $id): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // VERIFICA QUE EL ITEM PERTENECE AL USUARIO
        if (!$this->itemModel->belongsToUser($id, $userId)) {
            return $this->response->setStatusCode(404)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'ITEM_NOT_FOUND',
                    'message' => 'Elemento no encontrado',
                ],
            ]);
        }

        // RECOGE LOS CAMPOS A ACTUALIZAR
        $encryptedBlobBase64 = $this->request->getJsonVar('encrypted_blob');
        $folderId = $this->request->getJsonVar('folder_id');

        // PREPARA LOS DATOS DE ACTUALIZACION
        $data = [];

        // SI VIENE encrypted_blob LO PROCESA
        if ($encryptedBlobBase64) {
            $encryptedBlob = base64_decode($encryptedBlobBase64, true);
            if ($encryptedBlob === false) {
                return $this->response->setStatusCode(422)->setJSON([
                    'success' => false,
                    'data' => null,
                    'error' => [
                        'code' => 'INVALID_BLOB',
                        'message' => 'El bloque cifrado no es base64 valido',
                    ],
                ]);
            }
            if (strlen($encryptedBlob) > 5 * 1024 * 1024) {
                return $this->response->setStatusCode(413)->setJSON([
                    'success' => false,
                    'data' => null,
                    'error' => [
                        'code' => 'BLOB_TOO_LARGE',
                        'message' => 'El bloque excede el tamano maximo de 5MB',
                    ],
                ]);
            }
            $data['encrypted_blob'] = $encryptedBlob;
            $data['size_bytes'] = strlen($encryptedBlob);
        }

        // SI VIENE folder_id VERIFICA PERMISOS Y LO ACTUALIZA
        if ($folderId !== null) {
            if ($folderId === 0 || $folderId === '0') {
                $data['folder_id'] = null;
            } else {
                $folderModel = new \App\Models\VaultFolderModel();
                if (!$folderModel->belongsToUser((int) $folderId, $userId)) {
                    return $this->response->setStatusCode(403)->setJSON([
                        'success' => false,
                        'data' => null,
                        'error' => [
                            'code' => 'FOLDER_NOT_OWNED',
                            'message' => 'La carpeta no pertenece al usuario',
                        ],
                    ]);
                }
                $data['folder_id'] = (int) $folderId;
            }
        }

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
        $this->itemModel->update($id, $data);

        // DEVUELVE CONFIRMACION DE LA ACTUALIZACION
        return $this->response->setJSON([
            'success' => true,
            'data' => [
                'id' => $id,
                'updated' => true,
            ],
            'error' => null,
        ]);
    }

    // ELIMINA UN ELEMENTO DE LA BOVEDA DEL USUARIO
    public function delete(int $id): ResponseInterface
    {
        // OBTIENE EL user_id DEL JWT
        $userId = $this->request->user_id;

        // VERIFICA QUE EL ITEM PERTENECE AL USUARIO
        if (!$this->itemModel->belongsToUser($id, $userId)) {
            return $this->response->setStatusCode(404)->setJSON([
                'success' => false,
                'data' => null,
                'error' => [
                    'code' => 'ITEM_NOT_FOUND',
                    'message' => 'Elemento no encontrado',
                ],
            ]);
        }

        // ELIMINA EL REGISTRO DE LA BASE DE DATOS
        $this->itemModel->delete($id);

        // DEVUELVE CONFIRMACION DE LA ELIMINACION
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
