<?php
/**
 * PRIVACY SCORE HISTORY MODEL
 *
 * RESUMEN: MODELO DE PERSISTENCIA QUE GESTIONA EL ACCESO A LA
 * TABLA privacy_score_history DONDE SE ALMACENA LA EVOLUCION
 * DIARIA DE LA PUNTUACION DE PRIVACIDAD DE CADA USUARIO.
 *
 * LOGICA DE NEGOCIO: CADA REGISTRO REPRESENTA UN CALCULO DEL
 * PRIVACY SCORE EN UN MOMENTO CONCRETO. LA INTERFAZ DEL
 * AUDITOR MUESTRA LA EVOLUCION DE LAS ULTIMAS 8 SEMANAS EN UN
 * GRAFICO DE TENDENCIA.
 *
 * RELACIONES:
 * - AuditorController (CONSUMIDOR DIRECTO)
 * - users (FK user_id)
 */
namespace App\Models;

// IMPORTACION DE LA CLASE BASE DE MODELOS DE CI4
use CodeIgniter\Model;

class PrivacyScoreHistoryModel extends Model
{
    // TABLA SOBRE LA QUE OPERA EL MODELO
    protected $table = 'privacy_score_history';

    // CLAVE PRIMARIA DE LA TABLA
    protected $primaryKey = 'id';

    // CAMPOS PERMITIDOS PARA INSERCION
    protected $allowedFields = [
        'user_id',
        'score',
        'identity_score',
        'passwords_score',
        'device_score',
        'recorded_at',
    ];

    // TIPO DE DATO DE RETORNO POR DEFECTO
    protected $returnType = 'array';

    // NO USAR TIMESTAMPS AUTOMATICOS (USAMOS recorded_at MANUAL)
    protected $useTimestamps = false;

    // REGLAS DE VALIDACION
    protected $validationRules = [
        'user_id' => 'required|integer',
        'score' => 'required|integer|greater_than_equal_to[0]|less_than_equal_to[100]',
        'identity_score' => 'required|integer|greater_than_equal_to[0]|less_than_equal_to[100]',
        'passwords_score' => 'required|integer|greater_than_equal_to[0]|less_than_equal_to[100]',
        'device_score' => 'required|integer|greater_than_equal_to[0]|less_than_equal_to[100]',
    ];

    // RECUPERA EL HISTORICO DE UN USUARIO EN LAS ULTIMAS N SEMANAS
    public function findRecentByUser(int $userId, int $weeks = 8): array
    {
        // CALCULA LA FECHA DE INICIO DEL PERIODO
        $since = date('Y-m-d H:i:s', strtotime("-{$weeks} weeks"));

        // CONSULTA LOS REGISTROS DEL USUARIO ORDENADOS POR FECHA
        return $this->where('user_id', $userId)
                    ->where('recorded_at >=', $since)
                    ->orderBy('recorded_at', 'ASC')
                    ->findAll();
    }

    // RECUPERA EL ULTIMO SCORE REGISTRADO DEL USUARIO
    public function findLatestByUser(int $userId): ?array
    {
        return $this->where('user_id', $userId)
                    ->orderBy('recorded_at', 'DESC')
                    ->first();
    }
}
