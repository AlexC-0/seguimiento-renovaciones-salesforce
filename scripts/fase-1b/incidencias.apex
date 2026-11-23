Account account = new Account(Name = runTag + '-INCIDENCIAS');
Boolean ready = checks.fixture(account, 'cuenta-incidencias');
ContratoComercial__c contract;
EjecucionRenovacion__c execution = checks.execution(cut);
EjecucionRenovacion__c alternative = checks.execution(cut);
if (ready) {
    contract = new ContratoComercial__c(Cuenta__c = account.Id, FechaInicio__c = cut.addDays(-30), FechaVencimiento__c = cut.addDays(10), Estado__c = 'Activo');
    Boolean contractOk = checks.fixture(contract, 'contrato-incidencia');
    Boolean executionOk = checks.fixture(execution, 'ejecucion-incidencia');
    Boolean alternativeOk = checks.fixture(alternative, 'ejecucion-alternativa');
    ready = contractOk && executionOk && alternativeOk;
}
if (ready) {
    IncidenciaRenovacion__c incident = new IncidenciaRenovacion__c(
        Ejecucion__c = execution.Id, Contrato__c = contract.Id, Etapa__c = 'Creación',
        CodigoError__c = 'P06_FIXTURE', Mensaje__c = runTag + ': fixture del modelo; no representa un fallo Batch.',
        ClaveIntentada__c = String.valueOf(contract.Id) + '|' + String.valueOf(cut.addDays(10)),
        CamposAfectados__c = 'Estado__c'
    );
    if (checks.fixture(incident, 'incidencia-base')) {
        for (String message : new List<String>{null, '', '   '}) {
            IncidenciaRenovacion__c missing = incident.clone(false, false, false, false);
            missing.Mensaje__c = message;
            checks.probe('I-MESSAGE-' + (message == null ? 'null' : (message == '' ? 'empty' : 'spaces')),
                missing, true, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'requiere un mensaje con contenido');
        }
        Map<String, Object> changes = new Map<String, Object>{
            'Mensaje__c' => 'Cambio rechazable', 'Contrato__c' => null, 'Ejecucion__c' => alternative.Id,
            'ClaveIntentada__c' => 'Otra clave', 'Etapa__c' => 'Reconciliación',
            'CodigoError__c' => 'OTRO_CODIGO', 'CamposAfectados__c' => 'Notas__c'
        };
        for (String field : changes.keySet()) {
            IncidenciaRenovacion__c changed = new IncidenciaRenovacion__c(Id = incident.Id);
            changed.put(field, changes.get(field));
            checks.probe('I-IMMUTABLE-' + field, changed, false, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'evidencias inmutables');
        }
        IncidenciaRenovacion__c view = [SELECT Ejecucion__c, Contrato__c, ClaveIntentada__c FROM IncidenciaRenovacion__c WHERE Id = :incident.Id];
        checks.record('I-RELATIONS-PRESERVED', 'referencias originales conservadas', 'comparación de referencias',
            view.Ejecucion__c == execution.Id && view.Contrato__c == contract.Id && view.ClaveIntentada__c == incident.ClaveIntentada__c);
        checks.fixture(new IncidenciaRenovacion__c(
            Ejecucion__c = execution.Id, Etapa__c = 'Lote', CodigoError__c = 'P06_FIXTURE_SIN_CONTRATO',
            Mensaje__c = runTag + ': fixture sin contrato conocido; no acredita un lote real.'
        ), 'incidencia-sin-contrato');
    }
}
checks.finish('incidencias', runTag);
