// Informar el Id de una ejecución existente del solicitante actual.
Id ejecucionId = null;
if (ejecucionId == null) throw new IllegalArgumentException('Indicar una ejecución P06 real.');
AsyncApexJob trabajo = ServicioRenovaciones.contrastar(ejecucionId);
EjecucionRenovacion__c ejecucion = ServicioRenovaciones.leerEjecucion(ejecucionId);
System.debug(LoggingLevel.ERROR, 'P06_CONTRASTE=' + JSON.serialize(new Map<String, Object>{
    'ejecucion' => ejecucion.Id, 'job' => trabajo.Id, 'estadoJob' => trabajo.Status,
    'lotesProcesados' => trabajo.JobItemsProcessed, 'lotesTotales' => trabajo.TotalJobItems,
    'erroresJob' => trabajo.NumberOfErrors, 'estadoEjecucion' => ejecucion.Estado__c,
    'reconciliacion' => ejecucion.RequiereReconciliacion__c,
    'evaluados' => ejecucion.Evaluados__c, 'creados' => ejecucion.Creados__c,
    'existentes' => ejecucion.YaExistentes__c, 'omitidos' => ejecucion.Omitidos__c,
    'fallidos' => ejecucion.Fallidos__c, 'lotesFallidos' => ejecucion.LotesFallidos__c
}));
