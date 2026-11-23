Account account = new Account(Name = runTag + '-CONTRATOS');
if (checks.fixture(account, 'cuenta-contratos')) {
    ContratoComercial__c contract = new ContratoComercial__c(
        Cuenta__c = account.Id, FechaInicio__c = cut.addDays(-30),
        FechaVencimiento__c = cut.addDays(10)
    );
    if (checks.fixture(contract, 'contrato-base')) {
        ContratoComercial__c saved = [SELECT Estado__c FROM ContratoComercial__c WHERE Id = :contract.Id];
        checks.record('C-DEFAULT', 'Borrador', saved.Estado__c, saved.Estado__c == 'Borrador');
        for (String field : new List<String>{'Cuenta__c', 'FechaInicio__c', 'FechaVencimiento__c'}) {
            ContratoComercial__c missing = contract.clone(false, false, false, false);
            missing.put(field, null);
            checks.probe('C-REQUIRED-' + field, missing, true, false, 'REQUIRED_FIELD_MISSING', '');
        }
        ContratoComercial__c invalidDate = contract.clone(false, false, false, false);
        invalidDate.FechaVencimiento__c = cut.addDays(-31);
        checks.probe('C-DATES', invalidDate, true, false, 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'El vencimiento no puede');
        for (String state : new List<String>{'Borrador', 'Activo', 'Inactivo'}) {
            checks.probe('C-STATE-' + state, new ContratoComercial__c(Id = contract.Id, Estado__c = state), false, true, '', '');
        }
        checks.probe('C-INVALID-STATE', new ContratoComercial__c(Id = contract.Id, Estado__c = 'NO_ADMITIDO'),
            false, false, 'INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST', '');
        checks.persist(new ContratoComercial__c(Id = contract.Id, Estado__c = 'Activo'), 'C-PRESERVE-ACTIVE');
    }
}
checks.finish('contratos', runTag);
