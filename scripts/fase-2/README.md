# Comprobaciones de fase 2

Los scripts requieren Node.js y la instalación existente de Salesforce CLI. P06_SF_MODULES permite indicar la carpeta de dependencias de esa instalación. No instalan herramientas globales.

Cada conexión administrativa exige el alias explícito p06-renovaciones-dev y contrasta Organization con el recibo privado de fase 1B. Las comprobaciones comerciales verifican además la identidad de la sesión de navegador antes de cada conjunto de peticiones. No utilizan el token administrativo para realizar pruebas negativas comerciales.

- inspeccionar.cjs: inventario de configuración y licencias.
- preparar-usuarios.cjs: identidades ficticias y asignaciones iniciales; no debe ejecutarse sobre la configuración final de coordinación.
- preparar-fixtures.cjs: inventario nuevo y copia de datos históricos anteriores a las pruebas.
- configurar-funcion.cjs: cambio acotado de función, retirando las asignaciones anteriores.
- api-usuario.cjs y navegador.cjs: acceso a la sesión real y al conector local de pruebas.
- cambiar-sesion.cjs: cambio entre identidades inventariadas mediante Login As; necesita la habilitación temporal específica. No habilita esa política.
- comprobar-comercial.cjs, comprobar-coordinacion.cjs y comprobar-informe.cjs: escenarios con estado y contraste del informe.
- auditar-acceso.cjs: lectura administrativa complementaria de permisos efectivos y registros.
- conservar.cjs: conservación de datos e integridad textual de archivos anteriores.
- restaurar-acceso.cjs: restablece la política temporal a su valor inicial false y comprueba la lectura posterior.

Los escenarios de estados y transferencias no constituyen una suite repetible sobre los mismos registros: pueden cerrar seguimientos, transferir propiedad y crear concesiones. Un nuevo ciclo necesita un inventario separado y resultados nuevos; no se sobrescriben evidencias históricas para aparentar otra ejecución. Los scripts de preparación no reinicializan ni borran fixtures existentes.

La conexión de navegador usa un servicio temporal en 127.0.0.1:8937 y un identificador MCP privado previamente inicializado en Chrome habitual. El servicio se detuvo al cerrar esta fase. Las credenciales, cookies, identificadores personales y respuestas completas permanecen en .sf, excluido de Git. La documentación pública contiene únicamente resultados sanitizados.

Véanse los resultados ejecutados y los límites en ../../docs/FASE-2.md. No iniciar procesamiento posterior desde estos scripts.
