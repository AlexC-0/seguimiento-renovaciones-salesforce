// Un alcance vacío selecciona cero. Para selección ordinaria: ServicioRenovaciones.lanzar(50).
Set<Id> alcance = new Set<Id>{
    // ALCANCE_P06
};
Id ejecucionId = ServicioRenovaciones.lanzar(50, alcance);
EjecucionRenovacion__c ejecucion = ServicioRenovaciones.leerEjecucion(ejecucionId);
System.debug(LoggingLevel.ERROR, 'P06_LANZAMIENTO=' + JSON.serialize(new Map<String, Object>{
    'ejecucion' => ejecucion.Id,
    'job' => ejecucion.AsyncApexJobId__c,
    'corte' => ejecucion.FechaCorte__c,
    'fin' => ejecucion.FinVentana__c,
    'zona' => ejecucion.ZonaHoraria__c,
    'contratosEnFiltro' => alcance.size(),
    'tamanioLote' => 50
}));
