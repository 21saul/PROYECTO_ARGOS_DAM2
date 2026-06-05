<?php
/**
 * VAULT ITEM MODEL TEST
 *
 * RESUMEN: TESTS UNITARIOS DEL MODELO DE ELEMENTOS DE LA BOVEDA
 * QUE COMPRUEBAN LA CONFIGURACION DECLARATIVA DEL MODELO SIN
 * NECESIDAD DE ACCESO A LA BASE DE DATOS.
 *
 * LOGICA DE NEGOCIO COBERTURADA:
 * - TABLA, CLAVE PRIMARIA Y CAMPOS PERMITIDOS DEL MODELO
 * - REGLAS DE VALIDACION (TIPOS ACEPTADOS Y CAMPOS REQUERIDOS)
 * - MENSAJES DE ERROR EN ESPANOL
 *
 * RELACIONES:
 * - App\Models\VaultItemModel (SUJETO BAJO TEST)
 */
namespace Tests\Unit\Models;

// IMPORTACION DEL CASO BASE DE TESTS DE CODEIGNITER 4
use CodeIgniter\Test\CIUnitTestCase;

// IMPORTACION DEL MODELO A TESTEAR
use App\Models\VaultItemModel;

// IMPORTACION DE REFLECTION PARA INSPECCIONAR PROPIEDADES PROTEGIDAS
use ReflectionClass;

/**
 * @internal
 */
final class VaultItemModelTest extends CIUnitTestCase
{
    // LEE UNA PROPIEDAD PROTEGIDA DEL MODELO BAJO PRUEBA
    private function getProtectedProperty(object $object, string $name)
    {
        // USA REFLECTION PARA SALTARSE EL MODIFICADOR DE ACCESO
        $reflection = new ReflectionClass($object);
        $property = $reflection->getProperty($name);
        $property->setAccessible(true);
        return $property->getValue($object);
    }

    // VERIFICA QUE EL MODELO APUNTA A LA TABLA vault_items
    public function testModelUsesExpectedTable(): void
    {
        // INSTANCIA EL MODELO Y LEE EL NOMBRE DE LA TABLA
        $model = new VaultItemModel();
        $table = $this->getProtectedProperty($model, 'table');

        // LA TABLA DEBE COINCIDIR CON EL DISENO DE LA DB
        $this->assertSame('vault_items', $table);
    }

    // VERIFICA QUE EL CAMPO ID ES LA CLAVE PRIMARIA
    public function testModelDeclaresIdAsPrimaryKey(): void
    {
        // INSTANCIA EL MODELO Y LEE LA CLAVE PRIMARIA
        $model = new VaultItemModel();
        $primaryKey = $this->getProtectedProperty($model, 'primaryKey');

        // LA CLAVE PRIMARIA DEBE SER id
        $this->assertSame('id', $primaryKey);
    }

    // VERIFICA QUE LOS CAMPOS PERMITIDOS COINCIDEN CON LA SPEC
    public function testModelAllowsExactlyExpectedFields(): void
    {
        // INSTANCIA EL MODELO Y LEE LOS CAMPOS PERMITIDOS
        $model = new VaultItemModel();
        $allowed = $this->getProtectedProperty($model, 'allowedFields');

        // EL LISTADO DE CAMPOS DEBE COINCIDIR CON LA TABLA REAL
        $this->assertEqualsCanonicalizing(
            ['user_id', 'folder_id', 'item_type', 'encrypted_blob', 'size_bytes'],
            $allowed
        );
    }

    // VERIFICA QUE EL MODELO TIENE TIMESTAMPS ACTIVADOS
    public function testModelHasAutomaticTimestampsEnabled(): void
    {
        // INSTANCIA EL MODELO Y LEE LA BANDERA DE TIMESTAMPS
        $model = new VaultItemModel();
        $useTimestamps = $this->getProtectedProperty($model, 'useTimestamps');

        // EL VALOR DEBE SER TRUE PARA QUE CI4 LLENE created_at/updated_at
        $this->assertTrue($useTimestamps);
    }

    // VERIFICA QUE LAS REGLAS DE VALIDACION EXIGEN LOS CAMPOS BASE
    public function testValidationRulesRequireUserIdItemTypeAndBlob(): void
    {
        // INSTANCIA EL MODELO Y LEE LAS REGLAS DE VALIDACION
        $model = new VaultItemModel();
        $rules = $this->getProtectedProperty($model, 'validationRules');

        // LAS TRES REGLAS DEBEN MARCAR LOS CAMPOS COMO REQUERIDOS
        $this->assertStringContainsString('required', $rules['user_id']);
        $this->assertStringContainsString('required', $rules['item_type']);
        $this->assertStringContainsString('required', $rules['encrypted_blob']);
    }

    // VERIFICA QUE EL TIPO DE ITEM ESTA LIMITADO A 3 VALORES
    public function testItemTypeRuleLimitsAllowedValues(): void
    {
        // INSTANCIA EL MODELO Y LEE LAS REGLAS DE VALIDACION
        $model = new VaultItemModel();
        $rules = $this->getProtectedProperty($model, 'validationRules');

        // LA REGLA DEBE FORZAR password|note|file
        $this->assertStringContainsString('in_list[password,note,file]', $rules['item_type']);
    }

    // VERIFICA QUE LOS MENSAJES DE ERROR ESTAN EN ESPANOL
    public function testValidationMessagesAreInSpanish(): void
    {
        // INSTANCIA EL MODELO Y LEE LOS MENSAJES PERSONALIZADOS
        $model = new VaultItemModel();
        $messages = $this->getProtectedProperty($model, 'validationMessages');

        // CADA MENSAJE DEBE ESTAR EN CASTELLANO
        $this->assertStringContainsString('obligatorio', $messages['user_id']['required']);
        $this->assertStringContainsString('tipo', strtolower($messages['item_type']['in_list']));
        $this->assertStringContainsString('obligatorio', $messages['encrypted_blob']['required']);
    }
}
