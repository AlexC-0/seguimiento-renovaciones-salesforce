# Uso de Renovaciones de contratos

## Comercial

Abrir la aplicación Renovaciones de contratos desde el iniciador de aplicaciones. Contratos comerciales permite consultar fechas, estado, cuenta y seguimientos relacionados. Seguimientos de renovación ofrece la lista Mis pendientes y el detalle de cada seguimiento accesible.

Para trabajar un seguimiento, abrir su detalle y usar Modificar. Cambiar Estado y añadir Notas. Pendiente puede pasar a En curso, Cerrado o Descartado; En curso solo a Cerrado o Descartado. Los estados terminales necesitan una nota con contenido y no admiten reapertura. Guardar un cierre no modifica ni renueva el contrato.

Los campos obligatorios protegidos pueden mostrar controles de edición de Salesforce, pero sus cambios se rechazan. La interfaz no sustituye la seguridad de registros, objetos y validaciones. El comercial no crea seguimientos, modifica contratos, elimina registros ni consulta ejecución o incidencia.

## Coordinación

La misma aplicación incorpora Ejecuciones de renovación e Incidencias de renovación en lectura. Coordinación puede crear y editar contratos y usar Cambiar propietario en contratos o seguimientos. Debe desactivar el envío de notificación y completar el [procedimiento de acceso y reasignación](ACCESO.md), incluida la compartición de lectura del contrato.

Los seguimientos conservan su responsable cuando cambia el propietario del contrato, salvo reasignación explícita. Cambiar fecha o estado del contrato recalcula Aplicable; no altera la historia del seguimiento. Los fixtures iniciales de fases 1B y 2 comprobaron el modelo sin jobs Batch. Las ejecuciones posteriores de fases 3 a 5 sí están vinculadas a trabajos reales; las incidencias de fases 4A y 4B incluyen fallos reales y diagnósticos de reconciliación. Consultar el Id de job, los recibos y la fase de procedencia antes de interpretar un registro.

## Informe operativo

Abrir Informes, carpeta Renovaciones de contratos, informe Seguimientos de renovación pendientes. La carpeta concede lectura a comerciales, coordinación y operadores dentro de los grupos configurados.

El informe incluye Pendiente y En curso con Aplicable=true, sin filtro que excluya vencidos. Muestra seguimiento, contrato, cuenta, vencimiento capturado, estado y días restantes. Agrupa por responsable y ordena por vencimiento dentro de cada grupo. Un valor negativo de días indica atraso.

La visibilidad depende de la sesión: cada comercial obtiene sus registros accesibles y coordinación la visión del ámbito P06. Las listas y los filtros no conceden acceso. La ordenación inicial de Mis pendientes puede diferir de la ordenación por fecha del informe.

El nombre solicitado superaba el máximo de 40 caracteres de Salesforce. El título completo Pendientes de seguimiento de renovaciones se conserva en la descripción del informe.

## Procesamiento manual

La fase 3 incorpora el recorrido técnico descrito en [FASE-3.md](FASE-3.md). El comercial continúa trabajando en la aplicación estándar. Los seguimientos generados empiezan Pendiente, pertenecen al responsable observado en el contrato y conservan la ejecución de origen. Repetir el procesamiento no reabre cierres ni sobrescribe notas o propietarios. Cerrar un seguimiento no renueva el contrato.

## Lanzar y observar como operador

La organización debe estar identificada y autenticada manualmente. Verificar el destino autorizado antes de escribir y usarlo explícitamente en cada comando. El operador necesita P06_ProcesarRenovaciones, acceso a clases, objetos, campos y registros, además de capacidad previa autorizada para Apex anónimo. P06_OperadorRenovaciones no concede Author Apex. La demostración utilizó un perfil administrativo previo: no demuestra suficiencia del Permission Set aislado. No asignar esas capacidades a comerciales para ejecutar este procedimiento.

1. Seleccionar e inventariar los IDs de contratos del ámbito autorizado. Comprobar estado, vencimiento y propietario actual. Se eligen Activos en la ventana inclusiva entre el corte local del solicitante y corte + 30 días.
2. Copiar [lanzar-renovaciones.apex](../scripts/fase-3/lanzar-renovaciones.apex) a un archivo de trabajo local excluido de Git. Completar ALCANCE_P06 con esos IDs. Conservar la variante con filtro explícito; conjunto vacío selecciona cero. Revisar el archivo antes de ejecutarlo.
3. Ejecutar la copia con el destino explícito y conservar el resultado P06_LANZAMIENTO: ejecución, job, corte, fin y zona. Si no queda claro si se creó el job, inspeccionar primero; repetir a ciegas crearía otro intento.
4. Consultar AsyncApexJob por ese único Id y la ejecución asociada. Distinguir el cierre del job del cierre persistido de la ejecución. Un Completed con NumberOfErrors mayor que cero no demuestra éxito integral.
5. Revisar seguimientos e incidencias vinculados, ecuación de contadores y marca de reconciliación. Comparar el informe con consultas completas usando la misma identidad cuando se quiera acreditar su contenido.

Ejemplo PowerShell, con variables informadas a partir del destino y los recibos propios; no contiene IDs de demostración:

~~~powershell
$destinoP06 = 'ALIAS_EXPLICITO_DEL_DESTINO_AUTORIZADO'
$archivoLanzamientoP06 = 'RUTA_LOCAL_DE_LA_COPIA_REVISADA.apex'
sf apex run --target-org $destinoP06 --api-version 65.0 --file $archivoLanzamientoP06
$jobP06 = 'ID_DEL_JOB_DEVUELTO'
sf data query --target-org $destinoP06 --api-version 65.0 --query "SELECT Id, Status, NumberOfErrors, JobItemsProcessed, TotalJobItems, CompletedDate FROM AsyncApexJob WHERE Id = '$jobP06'"
~~~

La aplicación ofrece Ejecuciones e Incidencias en lectura para coordinación. En el detalle de ejecución revisar Estado, AsyncApexJobId, corte/ventana/zona, resultados, LotesFallidos y RequiereReconciliacion. Los listados deben filtrarse por la ejecución examinada para no mezclar fixtures iniciales con otros intentos.

Durante la espera, observar con intervalos y un límite explícito; agotar la espera no demuestra un fallo del Batch. El procedimiento de evidencia usó observación acotada y varias lecturas estables. No iniciar reintentos automáticos ni modificar contadores para hacer coincidir estados.

## Contraste y recuperación manual

Si hay cierre incoherente, job fallido/abortado o duda sobre resultados, revisar el vínculo job-ejecución y los datos persistidos. Copiar [contrastar-ejecucion.apex](../scripts/fase-3/contrastar-ejecucion.apex), sustituir null por el Id de la ejecución y ejecutar la copia con sf apex run, destino y API explícitos. Debe hacerlo el solicitante autorizado de esa ejecución; no introducir IDs de trabajos ajenos.

El contraste observa el trabajo, conserva resultados confirmados y puede registrar diagnóstico y reconciliación. No recupera automáticamente registros ni corrige todos los estados ambiguos. No deducir el número de contratos perdidos multiplicando lotes fallidos por tamaño de lote: el último lote puede ser menor y sus resultados no están confirmados.

La ecuación es evaluados = creados + ya existentes + omitidos + fallidos. LotesFallidos registra reversiones aparte. Un fallo individual confirmado puede dejar éxitos del mismo lote; un execute revertido no deja sus resultados tentativos. Una recuperación correcta no borra incidencias ni limpia automáticamente la reconciliación histórica.

Una vez revisada y resuelta la causa mediante una actuación autorizada, inventariar otra vez el conjunto y lanzar expresamente una nueva ejecución con los IDs permitidos. Los existentes conservan estado, notas, propietario y origen; solo se crean identidades elegibles ausentes. Conservar el intento anterior y comparar antes/después. Los ensayos ya realizados y sus límites están en [FASE-4A](FASE-4A.md), [FASE-4B](FASE-4B.md) y [FASE-5](FASE-5.md).

## Fechas, responsabilidad e historia

La clave es la pareja contrato y fecha de vencimiento capturada. Cambiar el vencimiento puede generar un seguimiento nuevo, mientras el anterior deja de ser aplicable. Restaurar la fecha anterior vuelve a encontrar su identidad, aunque esté Cerrado: no se reabre. El transcurso del tiempo no desactiva por sí solo Aplicable; un pendiente aplicable vencido continúa en el informe como atrasado.

Cambiar el propietario del contrato solo afecta al responsable inicial de seguimientos nuevos. Para los anteriores, cualquier reasignación es explícita y requiere revisar el acceso al contrato mediante [ACCESO](ACCESO.md). No se transfiere automáticamente la historia ni se modifica su ejecución de origen.

Los programas Node de cada fase son procedimientos históricos dependientes de inventarios privados, no comandos genéricos de operación ni instalación. No relanzarlos para consultar resultados: leer sus evidencias. La [matriz de aceptación](ACEPTACION-V1.md) resume la cobertura y la [guía de instalación](INSTALACION.md) separa los pasos reutilizables de esos ensayos.
