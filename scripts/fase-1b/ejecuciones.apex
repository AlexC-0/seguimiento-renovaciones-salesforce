EjecucionRenovacion__c execution = checks.execution(cut);
if (checks.fixture(execution, 'ejecucion-base')) {
    EjecucionRenovacion__c saved = [
        SELECT Estado__c, Inicio__c, Finalizacion__c, AsyncApexJobId__c, Evaluados__c, Creados__c,
            YaExistentes__c, Omitidos__c, Fallidos__c, LotesFallidos__c, RequiereReconciliacion__c
        FROM EjecucionRenovacion__c WHERE Id = :execution.Id
    ];
    checks.record('E-INITIAL', 'Encolada, sin job y sin finalización', saved.Estado__c,
        saved.Estado__c == 'Encolada' && saved.Inicio__c != null && saved.Finalizacion__c == null && saved.AsyncApexJobId__c == null);
    checks.record('E-COUNTERS-DEFAULT', 'contadores cero y sin reconciliación', 'valores iniciales',
        saved.Evaluados__c == 0 && saved.Creados__c == 0 && saved.YaExistentes__c == 0 &&
        saved.Omitidos__c == 0 && saved.Fallidos__c == 0 && saved.LotesFallidos__c == 0 && !saved.RequiereReconciliacion__c);
    EjecucionRenovacion__c missingRequester = checks.execution(cut);
    missingRequester.Solicitante__c = null;
    checks.probe('E-REQUESTER-REQUIRED-INSERT', missingRequester, true, false,
        'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'requiere un solicitante');
    checks.probe('E-REQUESTER-REQUIRED-UPDATE', new EjecucionRenovacion__c(Id = execution.Id, Solicitante__c = null), false, false,
        'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'requiere un solicitante');
    EjecucionRenovacion__c invalidInitial = checks.execution(cut);
    invalidInitial.Estado__c = 'En curso';
    checks.probe('E-INITIAL-INVALID', invalidInitial, true, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'inicialmente como Encolada');
    for (String field : new List<String>{'InicioVentana__c', 'FinVentana__c'}) {
        EjecucionRenovacion__c invalidWindow = checks.execution(cut);
        invalidWindow.put(field, field == 'InicioVentana__c' ? cut.addDays(1) : cut.addDays(29));
        checks.probe('E-WINDOW-' + field, invalidWindow, true, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'La ventana debe comenzar');
    }
    Map<String, Object> changes = new Map<String, Object>{
        'FechaCorte__c' => cut.addDays(1), 'InicioVentana__c' => cut.addDays(1),
        'FinVentana__c' => cut.addDays(31), 'ZonaHoraria__c' => UserInfo.getTimeZone().getID() == 'GMT' ? 'Europe/Madrid' : 'GMT',
        'Inicio__c' => saved.Inicio__c.addSeconds(-1)
    };
    for (String field : changes.keySet()) {
        EjecucionRenovacion__c changed = new EjecucionRenovacion__c(Id = execution.Id);
        changed.put(field, changes.get(field));
        checks.probe('E-CONTEXT-' + field, changed, false, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'son inmutables');
    }
    Id currentUser = UserInfo.getUserId();
    List<User> alternatives = [SELECT Id FROM User WHERE IsActive = true AND UserType = 'Standard' AND Id != :currentUser LIMIT 1];
    if (alternatives.isEmpty()) checks.skip('E-CONTEXT-Solicitante__c', 'No hay segundo usuario estándar activo; no se crean usuarios.');
    else checks.probe('E-CONTEXT-Solicitante__c', new EjecucionRenovacion__c(Id = execution.Id, Solicitante__c = alternatives[0].Id),
        false, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'son inmutables');
    for (String field : new List<String>{'Evaluados__c', 'Creados__c', 'YaExistentes__c', 'Omitidos__c', 'Fallidos__c', 'LotesFallidos__c'}) {
        EjecucionRenovacion__c negative = new EjecucionRenovacion__c(Id = execution.Id);
        negative.put(field, -1);
        checks.probe('E-NEGATIVE-' + field, negative, false, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'no pueden ser negativos');
    }
    checks.probe('E-TOTAL-MISMATCH', new EjecucionRenovacion__c(Id = execution.Id, Evaluados__c = 1),
        false, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'Evaluados debe ser igual');
    // Los valores sintéticos de esta prueba se revierten siempre.
    checks.probe('E-TOTAL-MATCH', new EjecucionRenovacion__c(Id = execution.Id, Evaluados__c = 4, Creados__c = 1, YaExistentes__c = 1, Omitidos__c = 1, Fallidos__c = 1),
        false, true, '', '');
    for (String state : new List<String>{'Completada', 'Completada con incidencias', 'Fallida', 'Abortada'}) {
        checks.probe('E-FINAL-REQUIRED-' + state, new EjecucionRenovacion__c(Id = execution.Id, Estado__c = state),
            false, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'Los estados finales requieren');
        checks.probe('E-FINAL-VALID-' + state, new EjecucionRenovacion__c(Id = execution.Id, Estado__c = state, Finalizacion__c = saved.Inicio__c),
            false, true, '', '');
    }
    checks.probe('E-FINAL-BEFORE-START', new EjecucionRenovacion__c(Id = execution.Id, Estado__c = 'Completada', Finalizacion__c = saved.Inicio__c.addSeconds(-1)),
        false, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'no puede ser anterior al inicio');
    checks.probe('E-OPEN-WITH-END', new EjecucionRenovacion__c(Id = execution.Id, Finalizacion__c = saved.Inicio__c),
        false, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'Los estados finales requieren');
    for (String field : new List<String>{'Fallidos__c', 'LotesFallidos__c', 'RequiereReconciliacion__c'}) {
        EjecucionRenovacion__c invalidComplete = new EjecucionRenovacion__c(Id = execution.Id, Estado__c = 'Completada', Finalizacion__c = saved.Inicio__c);
        if (field == 'RequiereReconciliacion__c') invalidComplete.RequiereReconciliacion__c = true;
        else {
            invalidComplete.put(field, 1);
            if (field == 'Fallidos__c') invalidComplete.Evaluados__c = 1;
        }
        checks.probe('E-COMPLETE-ERROR-' + field, invalidComplete, false, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'no puede marcarse como Completada');
    }
    checks.probe('E-INVALID-STATE', new EjecucionRenovacion__c(Id = execution.Id, Estado__c = 'NO_ADMITIDO'),
        false, false, 'INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST', '');
    saved = [SELECT AsyncApexJobId__c, Estado__c, Evaluados__c, LotesFallidos__c FROM EjecucionRenovacion__c WHERE Id = :execution.Id];
    checks.record('E-FIXTURE-PRESERVED', 'Encolada, sin job ni resultados de procesamiento', saved.Estado__c,
        saved.Estado__c == 'Encolada' && saved.AsyncApexJobId__c == null && saved.Evaluados__c == 0 && saved.LotesFallidos__c == 0);
}
checks.finish('ejecuciones', runTag);
