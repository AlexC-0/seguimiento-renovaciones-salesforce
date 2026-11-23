// Utilidades locales del bloque anónimo; no se despliega una clase.
class P06Checks {
    List<Map<String, Object>> cases = new List<Map<String, Object>>();
    List<Map<String, Object>> inventory = new List<Map<String, Object>>();
    Integer failures = 0;
    Integer skipped = 0;

    public void record(String code, String expected, String observed, Boolean ok) {
        cases.add(new Map<String, Object>{
            'caso' => code, 'esperado' => expected, 'observado' => observed,
            'resultado' => ok ? 'correcto' : 'fallido'
        });
        if (!ok) failures++;
    }

    public void skip(String code, String reason) {
        cases.add(new Map<String, Object>{
            'caso' => code, 'esperado' => 'comprobación ejecutada',
            'observado' => reason, 'resultado' => 'no_ejecutado'
        });
        skipped++;
    }

    public Boolean fixture(SObject value, String role) {
        Database.SaveResult result = Database.insert(value, false);
        List<String> codes = new List<String>();
        for (Database.Error error : result.getErrors()) codes.add(String.valueOf(error.getStatusCode()));
        record('FIX-' + role, 'fixture creado', result.isSuccess() ? 'fixture creado' : String.join(codes, ','), result.isSuccess());
        if (result.isSuccess()) inventory.add(new Map<String, Object>{
            'objeto' => String.valueOf(value.getSObjectType()),
            'id' => String.valueOf(result.getId()), 'funcion' => role
        });
        return result.isSuccess();
    }

    public Boolean persist(SObject value, String code) {
        Database.SaveResult result = Database.update(value, false);
        List<String> codes = new List<String>();
        for (Database.Error error : result.getErrors()) codes.add(String.valueOf(error.getStatusCode()));
        record(code, 'actualización válida', result.isSuccess() ? 'actualización válida' : String.join(codes, ','), result.isSuccess());
        return result.isSuccess();
    }

    public void probe(String code, SObject value, Boolean inserting, Boolean allowed, String errorCode, String messagePart) {
        Savepoint checkpoint = Database.setSavepoint();
        try {
            Database.SaveResult result;
            if (inserting) result = Database.insert(value, false);
            else result = Database.update(value, false);
            List<String> codes = new List<String>();
            Boolean matched = false;
            for (Database.Error error : result.getErrors()) {
                codes.add(String.valueOf(error.getStatusCode()));
                if (String.valueOf(error.getStatusCode()) == errorCode &&
                    (String.isBlank(messagePart) || error.getMessage().contains(messagePart))) matched = true;
            }
            Boolean ok = allowed ? result.isSuccess() : (!result.isSuccess() && matched);
            record(code, allowed ? 'aceptado' : 'rechazado: ' + errorCode + ' / ' + messagePart,
                result.isSuccess() ? 'aceptado' : 'rechazado: ' + String.join(codes, ',') + '; regla esperada=' + String.valueOf(matched), ok);
        } catch (Exception error) {
            record(code, allowed ? 'aceptado' : 'rechazo controlado', 'excepción: ' + error.getTypeName(), false);
        } finally {
            // Restaura incluso una escritura inesperadamente aceptada.
            Database.rollback(checkpoint);
            Database.releaseSavepoint(checkpoint);
        }
    }

    public EjecucionRenovacion__c execution(Date cut) {
        return new EjecucionRenovacion__c(
            FechaCorte__c = cut, InicioVentana__c = cut, FinVentana__c = cut.addDays(30),
            ZonaHoraria__c = UserInfo.getTimeZone().getID(), Solicitante__c = UserInfo.getUserId()
        );
    }

    public SeguimientoRenovacion__c follow(Id contractId, Date expiry, Id executionId) {
        // Valor explícito de fixture; no implementa identidad de la aplicación.
        return new SeguimientoRenovacion__c(
            Contrato__c = contractId, FechaVencimientoCapturada__c = expiry,
            ClaveIdentidad__c = String.valueOf(contractId) + '|' + String.valueOf(expiry),
            Ejecucion__c = executionId
        );
    }

    public void finish(String suite, String tag) {
        System.debug(LoggingLevel.ERROR, 'P06_RESULT=' + JSON.serialize(new Map<String, Object>{
            'suite' => suite, 'marca' => tag, 'api' => '65.0',
            'tipo' => 'comprobacion_de_modelo_con_fixtures',
            'correcto' => failures == 0 && skipped == 0,
            'fallidos' => failures, 'noEjecutados' => skipped,
            'casos' => cases, 'registrosConservados' => inventory,
            'dmlUtilizado' => Limits.getDmlStatements()
        }));
    }
}
String runTag = '__P06_RUN_TAG__';
System.assert(!runTag.startsWith('__'), 'Se requiere el ejecutor de fase 1B.');
System.assertEquals((Id)'__P06_ORG_ID__', UserInfo.getOrganizationId(), 'Destino distinto del verificado.');
P06Checks checks = new P06Checks();
Date cut = Date.today();
