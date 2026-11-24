# P06 — Seguimiento de renovaciones

## Estado vigente: V1 cerrada

Aceptación del 24/11/2026 como demostración técnica sobre la referencia revisada 4af11abf473f0d1d7443e5539174c301f58e7d18. V1 cerrada y aceptada dentro del alcance demostrado, con límites de verificación documentados; sin implantación productiva ni datos reales. Ver [CIERRE-V1](docs/CIERRE-V1.md) y [ACEPTACION-V1](docs/ACEPTACION-V1.md). La referencia técnica no es el futuro commit documental de cierre.

El alcance vigente es exclusivamente documental. No acceder a Salesforce, ejecutar pruebas o demostraciones ni modificar código, metadatos, permisos, datos o configuración. Conservar los inventarios de 432 registros de negocio y una compartición manual adicional. No ejecutar staging, commits, push, etiquetas, releases ni equivalentes; la publicación es manual.

Los límites aceptados no son tareas pendientes automáticas. Ampliaciones, nuevos ensayos, instalaciones y operaciones posteriores requieren un nuevo alcance explícito. Las autorizaciones de fases anteriores son antecedentes cerrados y no habilitan actuaciones nuevas. Conservar los documentos y JSON históricos, incluidos intentos fallidos y estados de aceptación anteriores; prevalece este estado vigente.

## Ámbito

Trabajar exclusivamente en este repositorio. No inspeccionar ni modificar otros proyectos. Conservar los cambios existentes y comprobar ruta, raíz, rama, remotos y estado Git antes de editar. Leer README.md, docs/PROJECT_BRIEF.md, docs/STATUS.md y docs/ENVIRONMENT.md; consultar docs/MODELO_DATOS.md para cambios en metadatos.

## Operaciones

No ejecutar staging, commits ni push. No configurar remotos, publicar ni reescribir historial sin un encargo expreso. No instalar o actualizar herramientas globales ni cambiar su configuración.

No crear, autenticar ni modificar organizaciones sin autorización específica. No reutilizar organizaciones, datos o configuraciones de otros proyectos. Antes de cualquier operación Salesforce autorizada, verificar la identidad del destino y especificarlo expresamente en el comando. La existencia de un alias local no autoriza su uso.

No imprimir ni versionar secretos, tokens, archivos de autenticación o enlaces reutilizables de acceso. No realizar comunicaciones externas ni introducir servicios de pago o privilegios amplios.

No delegar tareas. No atribuir éxito a pruebas no ejecutadas. Distinguir inspección local, revisión estática, conversión de formato, compilación por Salesforce, despliegue y comprobación funcional.

## Antecedente: estado comprobado de fase 3

Lanzamiento manual, Batch, identidad canónica y contraste implementados. Validación 0Afg700000L0MUHCA3 y despliegue 0Afg700000L0NQLCA3: 14/14 Apex. Dos jobs consecutivos, tres lotes cada uno: 120 creados y luego 120 existentes sin cambios. Se conservan 50 registros históricos, 34 archivos históricos y 247 registros nuevos. Ver docs/FASE-3.md. Login As=false, asignaciones comerciales intactas. No presentar repetición como solapamiento ni cerrar V1; fallos adversos y recuperación corresponden a otro alcance.

## Estado histórico de fase 2

Fase 2 completada: gestión comercial estándar, acceso por función, compartición e informe comprobados; 19 fixtures históricos y 31 nuevos conservados. Ver docs/FASE-2.md y docs/ACCESO.md. Login As restaurado a false y conexión temporal de navegador detenida. Las autorizaciones temporales de esta comprobación están cerradas; no son tareas pendientes. No iniciar el procesamiento de fases posteriores sin un nuevo encargo.

## Antecedente: alcance de fase 5

Validación funcional de cambios de vencimiento y responsable, matriz AC-01 a AC-20 y preparación documental del cierre sobre 69622d3013fbc77fc69877dcadddfde3dbae6be2. Destino exclusivo p06-renovaciones-dev, API 65.0; conservar los 422 registros y todas las evidencias previas. Usar dos contratos nuevos con filtros explícitos; no repetir ensayos adversos históricos ni instalación limpia.

Mantener inactivas las tres reglas de ensayo anteriores y no activar Login As o trazas. Reasignación técnica autorizada mediante concesión temporal exclusiva de P06_Reasignar al operador existente; validar su componente fuera del paquete de aplicación, retirar asignación y componente al terminar y verificar permisos originales. No alterar usuarios ficticios, roles, perfiles o grupos. Comparticiones manuales solo para los contratos nuevos.

Separar preparación técnica, UserRecordAccess y sesiones comerciales. Documentar cobertura parcial y decisiones de aceptación pendientes sin rebajar criterios ni cerrar V1. No ejecutar staging, commit, push ni equivalentes; la publicación es manual.

## Antecedente: alcance de fase 4B

Ensayos reales de reversión completa de execute por fallo de auditoría, aborto de un job identificado y recuperación manual sobre abfcba0e7aa682084fc93fb23fe6c0ba9cd9e998. Destino exclusivo p06-renovaciones-dev, API 65.0. Conservar los 374 registros anteriores y sus evidencias; contratos nuevos inventariados y selección explícita por IDs.

Dos reglas temporales limitadas a un contrato nuevo: rechazo de seguimiento y de su incidencia de Creación. Mantener Reconciliación disponible, conservar componentes fuera de la aplicación y verificar desactivación antes de recuperar y al terminar. La regla F4A permanece inactiva. Observación acotada que distingue cierre de job y ejecución; contraste repetido conserva resultados y diagnósticos. Abortar solo el job vinculado, tras verificar clase y solicitante; máximo dos intentos separados si el primero termina antes.

No modificar usuarios, permisos comerciales, configuración global ni Login As. No forzar concurrencia, medianoche, cambio estacional o rendimiento. Correcciones de aplicación solo ante defecto acreditado, con regresión y validación previa. No cerrar V1 ni ejecutar staging, commit o push.

## Resultado de fase 4B

Reversión real de execute por auditoría rechazada, con otro lote confirmado, y aborto antes de comenzar comprobados. Recuperaciones manuales: cinco creados y cinco existentes tras rollback; diez creados tras aborto. Conservar 374 registros anteriores, 48 nuevos y todas las evidencias; no reactivar ni repetir ensayos cerrados. Reglas F4B y F4A inactivas, TraceFlag/DebugLevel propios retirados. Dos historias adversas conservan diagnóstico y reconciliación; informe técnico con 179 IDs. Sin cambios de aplicación; cuatro regresiones del observador correctas. Ver docs/FASE-4B.md. V1 abierta; otros escenarios requieren nuevo alcance.

## Antecedente: alcance de fase 4A

Comprobar solapamiento observado, rechazo individual real y recuperación por nuevo lanzamiento manual, sobre 563b4399447898a1d86c5bc0312aded2c15ce897. Destino exclusivo p06-renovaciones-dev, API 65.0, identidad verificada antes de escribir. Conservar los 297 registros previos y sus evidencias mediante inventario completo y comparación final. Usar solo contratos nuevos inventariados y filtros explícitos de Id.

Hasta tres intentos de solapamiento con conjuntos nuevos de 30 contratos y lotes de 5, sin esperas ni consumo artificial de CPU en Apex. Distinguir encolado, Processing observado y colisión de inserción acreditada. Se autoriza una regla temporal de rechazo limitada a ISNEW y al Id exacto de un contrato nuevo; mantenerla fuera del paquete de aplicación, conservar recibos y dejarla inactiva verificada al terminar.

No cambiar usuarios, permisos comerciales, configuración global o Login As. No borrar registros de ensayo ni evidencias. No ensayar abortos ni reversión total de lotes, añadir infraestructura o declarar cerrada V1. Validar antes de desplegar correcciones mínimas si un resultado acredita un defecto.

## Resultado de fase 4A

Comprobados dos jobs con Processing observado sobre 30 contratos, un rechazo individual entre cinco y recuperación por nueva ejecución con un creado y cuatro existentes. Conservar los 297 registros anteriores, los 77 nuevos y todas las evidencias, incluidos intentos no satisfactorios. La regla P06_F4A_RechazoAcotado queda inactiva, fuera del paquete de aplicación. No reactivarla ni relanzar estos ensayos por inercia. Informe técnico y SOQL: 160 IDs coincidentes; Login As=false. No se modificó la aplicación; tres regresiones del observador correctas. Ver docs/FASE-4A.md. Colisión de inserción, abortos, reversión total de lotes y casos temporales siguen sin evidencia real; V1 abierta.

## Antecedente: revisión acotada de fase 3

Revisión sobre 31528e267a3f2d65ba41015dc1ef9a5838c56195. Resolver trazabilidad de fuentes y diagnóstico de reconciliación. Conservar los 50 registros históricos, los 247 de fase 3 y todas sus evidencias. No relanzar demostraciones, iniciar ensayos reales de fase 4, habilitar Login As, ampliar permisos ni crear usuarios persistentes. Validar y desplegar únicamente las clases corregidas con manifest/revision-fase-3.xml. Ver docs/REVISION-FASE-3.md.

## Alcance histórico de fase 3

Fase 3: lanzamiento técnico manual, Batch Apex, identidad canónica, resultados parciales, pruebas Apex y demostración aislada de 120 contratos en lotes de 50 seguida de repetición. Destino exclusivo p06-renovaciones-dev, Developer Edition, API 65.0; contrastar la identidad con el registro privado de fase 1B antes de escribir.

Conservar los 50 fixtures anteriores y las evidencias publicadas. No repetir baterías históricas completas. Documentar las decisiones transaccionales y modos de acceso; exigir autorización también al invocar directamente el Batch. Mantener Private, los permisos comerciales y el permiso técnico anterior. El permiso de operador es separado y se asigna únicamente a la cuenta técnica existente para la demostración.

Validar antes de desplegar mediante manifiestos acotados. No ignorar errores ni desplegar componentes destructivos. No conceder Author Apex a comerciales o coordinación ni privilegios administrativos globales. No crear usuarios persistentes adicionales ni alterar los usuarios de prueba existentes. No modificar Account o User globalmente.

Se permite un trigger mínimo de identidad al insertar; no automatizar lanzamientos ni renovaciones. No añadir LWC, Flow, integraciones, programación, reintentos ni infraestructura de eventos. Las autorizaciones temporales de navegador y Login As de fase 2 están cerradas; no reactivarlas por inercia. No acceder a Gmail ni abrir otros perfiles de navegador.

La demostración usa contratos nuevos inventariados y un filtro opcional de identificadores que solo restringe la selección. Un conjunto vacío selecciona cero, nunca todos. No modificar datos históricos para alterar su elegibilidad ni añadirles seguimientos durante la demostración. Contrastar corte, ventana, jobs, resultados persistidos, repetición, acceso e informe. No presentar lanzamientos consecutivos como solapamiento real ni declarar cerrada V1.

## Documentación

Utilizar castellano y redacción técnica directa. Documentar objetivos, configuración, funcionalidades, decisiones, cambios, comprobaciones y limitaciones. Excluir relatos de conversaciones, asignaciones personales, atribuciones de elaboración y firmas o coautorías automáticas. Conservar las licencias y los créditos legítimos de terceros. No copiar encargos operativos a archivos versionados.

Los títulos propuestos de commit seguirán el formato `tipo: descripción`, sin paréntesis ni ámbitos entre paréntesis.

## Antecedente: resultado de fase 5

Recorrido real completado con dos contratos nuevos y tres jobs: dos creaciones originales, dos alternativas y dos existentes sin nuevas creaciones al restaurar. No se reabrió el cerrado ni se modificaron notas, propietario u origen de seguimientos existentes. Transferencia técnica B a A y compartición Manual Read para B comprobadas; no atribuirlas a una sesión comercial nueva. P06_F5_ReasignacionTemporal y su asignación retirados, permiso efectivo original restaurado.

Conservar los 422 registros anteriores, diez nuevos, una compartición justificada y 133 evidencias previas. No repetir los scripts de ensayo ni reactivar reglas o permisos temporales. Aplicación sin cambios, tres reglas F4A/F4B inactivas, Login As=false. Matriz AC-01 a AC-20 en docs/ACEPTACION-V1.md, resultados en docs/FASE-5.md y guía en docs/INSTALACION.md. Manifiesto conjunto revisado y convertido localmente; instalación limpia no ejecutada. V1 sigue abierta y requiere decisiones posteriores de aceptación. No ejecutar staging, commit ni push.
