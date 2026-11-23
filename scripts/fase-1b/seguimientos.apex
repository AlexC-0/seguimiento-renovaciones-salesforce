Account account = new Account(Name = runTag + '-SEGUIMIENTOS');
Boolean ready = checks.fixture(account, 'cuenta-seguimientos');
ContratoComercial__c contract;
ContratoComercial__c other;
EjecucionRenovacion__c execution = checks.execution(cut);
EjecucionRenovacion__c secondExecution = checks.execution(cut);
if (ready) {
    contract = new ContratoComercial__c(Cuenta__c = account.Id, FechaInicio__c = cut.addDays(-30), FechaVencimiento__c = cut.addDays(10), Estado__c = 'Activo');
    other = new ContratoComercial__c(Cuenta__c = account.Id, FechaInicio__c = cut.addDays(-30), FechaVencimiento__c = cut.addDays(-1), Estado__c = 'Activo');
    Boolean firstOk = checks.fixture(contract, 'contrato-actual');
    Boolean secondOk = checks.fixture(other, 'contrato-atrasado');
    Boolean executionOk = checks.fixture(execution, 'ejecucion-modelo');
    Boolean secondExecutionOk = checks.fixture(secondExecution, 'ejecucion-alternativa');
    ready = firstOk && secondOk && executionOk && secondExecutionOk;
}
if (ready) {
    List<String> states = new List<String>{'Pendiente', 'En curso', 'Cerrado', 'Descartado'};
    List<SeguimientoRenovacion__c> fixtures = new List<SeguimientoRenovacion__c>();
    for (Integer index = 0; index < states.size(); index++) {
        SeguimientoRenovacion__c value = checks.follow(contract.Id, cut.addDays(10 + index), execution.Id);
        Boolean created = checks.fixture(value, 'seguimiento-' + String.valueOf(index));
        if (created && index > 0) created = checks.persist(
            new SeguimientoRenovacion__c(Id = value.Id, Estado__c = states[index], Notas__c = 'Fixture de transición ' + runTag),
            'S-PREPARE-' + String.valueOf(index)
        );
        ready = ready && created;
        fixtures.add(value);
    }
    if (ready) {
        Id mainId = fixtures[0].Id;
        SeguimientoRenovacion__c initial = [SELECT Estado__c FROM SeguimientoRenovacion__c WHERE Id = :mainId];
        checks.record('S-INITIAL', 'Pendiente', initial.Estado__c, initial.Estado__c == 'Pendiente');
        checks.probe('S-UNIQUE', checks.follow(contract.Id, cut.addDays(10), execution.Id), true, false, 'DUPLICATE_VALUE', '');
        SeguimientoRenovacion__c initialInvalid = checks.follow(contract.Id, cut.addDays(20), execution.Id);
        initialInvalid.Estado__c = 'En curso';
        checks.probe('S-INITIAL-INVALID', initialInvalid, true, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'debe crearse en estado Pendiente');
        List<SeguimientoRenovacion__c> identityChanges = new List<SeguimientoRenovacion__c>{
            new SeguimientoRenovacion__c(Id = mainId, Contrato__c = other.Id),
            new SeguimientoRenovacion__c(Id = mainId, FechaVencimientoCapturada__c = cut.addDays(25)),
            new SeguimientoRenovacion__c(Id = mainId, ClaveIdentidad__c = String.valueOf(contract.Id) + '|' + String.valueOf(cut.addDays(25))),
            new SeguimientoRenovacion__c(Id = mainId, Ejecucion__c = secondExecution.Id)
        };
        List<String> identityFields = new List<String>{'Contrato', 'Fecha', 'Clave', 'Ejecucion'};
        for (Integer index = 0; index < identityChanges.size(); index++) {
            checks.probe('S-IMMUTABLE-' + identityFields[index], identityChanges[index], false, false,
                'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'No se pueden modificar');
        }
        for (Integer fromIndex = 0; fromIndex < states.size(); fromIndex++) {
            for (Integer toIndex = 0; toIndex < states.size(); toIndex++) {
                Boolean allowed = fromIndex == toIndex || fromIndex == 0 || (fromIndex == 1 && toIndex >= 2);
                checks.probe('S-TRANSITION-' + String.valueOf(fromIndex) + '-' + String.valueOf(toIndex),
                    new SeguimientoRenovacion__c(Id = fixtures[fromIndex].Id, Estado__c = states[toIndex], Notas__c = 'Nota válida de fixture'),
                    false, allowed, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'Solo se permite pasar');
            }
        }
        for (String terminal : new List<String>{'Cerrado', 'Descartado'}) {
            for (String note : new List<String>{null, '   '}) {
                checks.probe('S-NOTE-' + terminal + '-' + (note == null ? 'null' : 'spaces'),
                    new SeguimientoRenovacion__c(Id = mainId, Estado__c = terminal, Notas__c = note),
                    false, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'se necesita una nota con contenido');
            }
        }
        checks.probe('S-INVALID-STATE', new SeguimientoRenovacion__c(Id = mainId, Estado__c = 'NO_ADMITIDO'),
            false, false, 'INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST', '');
        Boolean closed = checks.persist(new SeguimientoRenovacion__c(Id = mainId, Estado__c = 'Cerrado', Notas__c = 'Fixture cerrado; no representa renovación.'),
            'S-CLOSE-FIXTURE');
        SeguimientoRenovacion__c view = [SELECT Aplicable__c, Estado__c FROM SeguimientoRenovacion__c WHERE Id = :mainId];
        checks.record('A-ACTIVE-MATCH', 'aplicable y Cerrado', String.valueOf(view.Aplicable__c) + '/' + view.Estado__c, closed && view.Aplicable__c && view.Estado__c == 'Cerrado');
        checks.persist(new ContratoComercial__c(Id = contract.Id, FechaVencimiento__c = cut.addDays(11)), 'A-CHANGE-DATE');
        view = [SELECT Aplicable__c FROM SeguimientoRenovacion__c WHERE Id = :mainId];
        checks.record('A-DATE-DIFFERS', 'no aplicable', String.valueOf(view.Aplicable__c), !view.Aplicable__c);
        checks.persist(new ContratoComercial__c(Id = contract.Id, FechaVencimiento__c = cut.addDays(10)), 'A-RESTORE-DATE');
        view = [SELECT Aplicable__c, Estado__c FROM SeguimientoRenovacion__c WHERE Id = :mainId];
        checks.record('A-RESTORED-CLOSED', 'aplicable y Cerrado', String.valueOf(view.Aplicable__c) + '/' + view.Estado__c, view.Aplicable__c && view.Estado__c == 'Cerrado');
        checks.persist(new ContratoComercial__c(Id = contract.Id, Estado__c = 'Inactivo'), 'A-DEACTIVATE');
        view = [SELECT Aplicable__c FROM SeguimientoRenovacion__c WHERE Id = :mainId];
        checks.record('A-INACTIVE', 'no aplicable', String.valueOf(view.Aplicable__c), !view.Aplicable__c);
        checks.persist(new ContratoComercial__c(Id = contract.Id, Estado__c = 'Activo'), 'A-RESTORE-ACTIVE');
        SeguimientoRenovacion__c overdue = checks.follow(other.Id, cut.addDays(-1), execution.Id);
        if (checks.fixture(overdue, 'seguimiento-atrasado')) {
            view = [SELECT Aplicable__c, DiasRestantes__c, Estado__c FROM SeguimientoRenovacion__c WHERE Id = :overdue.Id];
            checks.record('A-OVERDUE', 'aplicable, días negativos y Pendiente',
                String.valueOf(view.Aplicable__c) + '/' + String.valueOf(view.DiasRestantes__c) + '/' + view.Estado__c,
                view.Aplicable__c && view.DiasRestantes__c < 0 && view.Estado__c == 'Pendiente');
        }
    }
}
checks.finish('seguimientos', runTag);
