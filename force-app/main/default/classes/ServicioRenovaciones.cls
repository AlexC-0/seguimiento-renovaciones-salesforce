public with sharing class ServicioRenovaciones {
    public class AccesoDenegadoException extends Exception {}
    public class ContextoInvalidoException extends Exception {}

    public static void exigirPermiso() {
        if (!FeatureManagement.checkPermission('P06_ProcesarRenovaciones')) {
            throw new AccesoDenegadoException('Se requiere el permiso de procesamiento P06.');
        }
    }

    public static Id lanzar(Integer tamanioLote) {
        return lanzar(tamanioLote, null);
    }

    public static Id lanzar(Integer tamanioLote, Set<Id> contratos) {
        exigirPermiso();
        if (tamanioLote == null || tamanioLote < 1 || tamanioLote > 200) {
            throw new IllegalArgumentException('El tamaño de lote debe estar entre 1 y 200.');
        }
        if (!ContratoComercial__c.SObjectType.getDescribe().isAccessible() ||
            !SeguimientoRenovacion__c.SObjectType.getDescribe().isAccessible() ||
            !SeguimientoRenovacion__c.SObjectType.getDescribe().isCreateable() ||
            !EjecucionRenovacion__c.SObjectType.getDescribe().isCreateable() ||
            !EjecucionRenovacion__c.SObjectType.getDescribe().isUpdateable() ||
            !IncidenciaRenovacion__c.SObjectType.getDescribe().isCreateable()) {
            throw new AccesoDenegadoException('Faltan permisos de objeto para el procesamiento P06.');
        }
        if (contratos != null) {
            for (Id contrato : contratos) {
                if (contrato == null || contrato.getSObjectType() != ContratoComercial__c.SObjectType) {
                    throw new IllegalArgumentException('El filtro solo admite identificadores de contrato.');
                }
            }
        }
        String zona = UserInfo.getTimeZone().getID();
        Date corte = Date.valueOf(System.now().format('yyyy-MM-dd', zona));
        Savepoint punto = Database.setSavepoint();
        try {
            EjecucionRenovacion__c ejecucion = new EjecucionRenovacion__c(
                FechaCorte__c = corte, InicioVentana__c = corte, FinVentana__c = corte.addDays(30),
                ZonaHoraria__c = zona, Solicitante__c = UserInfo.getUserId(), Estado__c = 'Encolada');
            insert as user ejecucion;
            Id trabajo = Database.executeBatch(new LoteRenovaciones(ejecucion.Id, contratos), tamanioLote);
            update as user new EjecucionRenovacion__c(Id = ejecucion.Id, AsyncApexJobId__c = String.valueOf(trabajo));
            return ejecucion.Id;
        } catch (Exception error) {
            Database.rollback(punto);
            throw error;
        }
    }

    public static EjecucionRenovacion__c leerEjecucion(Id identificador) {
        exigirPermiso();
        List<EjecucionRenovacion__c> filas = Database.queryWithBinds(
            'SELECT Id, FechaCorte__c, InicioVentana__c, FinVentana__c, ZonaHoraria__c, Solicitante__c, ' +
            'AsyncApexJobId__c, Estado__c, Inicio__c, Finalizacion__c, Evaluados__c, Creados__c, ' +
            'YaExistentes__c, Omitidos__c, Fallidos__c, LotesFallidos__c, RequiereReconciliacion__c ' +
            'FROM EjecucionRenovacion__c WHERE Id = :identificador FOR UPDATE',
            new Map<String, Object>{'identificador' => identificador}, AccessLevel.USER_MODE);
        if (filas.size() != 1 || filas[0].Solicitante__c != UserInfo.getUserId()) {
            throw new AccesoDenegadoException('La ejecución no corresponde al solicitante actual.');
        }
        return filas[0];
    }

    public static AsyncApexJob leerTrabajo(EjecucionRenovacion__c ejecucion) {
        exigirPermiso();
        if (ejecucion.Solicitante__c != UserInfo.getUserId() || String.isBlank(ejecucion.AsyncApexJobId__c)) {
            throw new ContextoInvalidoException('La ejecución no tiene un trabajo propio verificable.');
        }
        // Metadatos de plataforma del único job vinculado; no concede View Setup ni lee otros jobs.
        List<AsyncApexJob> trabajos = Database.queryWithBinds(
            'SELECT Id, Status, NumberOfErrors, JobItemsProcessed, TotalJobItems, CreatedById, ' +
            'JobType, ExtendedStatus, ApexClass.Name FROM AsyncApexJob WHERE Id = :trabajo AND CreatedById = :solicitante',
            new Map<String, Object>{'trabajo' => ejecucion.AsyncApexJobId__c, 'solicitante' => UserInfo.getUserId()},
            AccessLevel.SYSTEM_MODE);
        if (trabajos.size() != 1 || trabajos[0].JobType != 'BatchApex' ||
            trabajos[0].ApexClass.Name != 'LoteRenovaciones') {
            throw new ContextoInvalidoException('El trabajo no corresponde al Batch P06 y su solicitante.');
        }
        return trabajos[0];
    }

    public static AsyncApexJob contrastar(Id identificador) {
        EjecucionRenovacion__c ejecucion = leerEjecucion(identificador);
        AsyncApexJob trabajo = leerTrabajo(ejecucion);
        aplicarEstadoTrabajo(ejecucion, trabajo, false);
        return trabajo;
    }

    public static void finalizar(Id identificador, Database.BatchableContext contexto) {
        EjecucionRenovacion__c ejecucion = leerEjecucion(identificador);
        if (contexto == null || ejecucion.AsyncApexJobId__c != String.valueOf(contexto.getJobId())) {
            throw new ContextoInvalidoException('El cierre no corresponde al trabajo registrado.');
        }
        aplicarEstadoTrabajo(ejecucion, leerTrabajo(ejecucion), true);
    }

    @TestVisible
    private static void aplicarEstadoTrabajo(EjecucionRenovacion__c ejecucion, AsyncApexJob trabajo, Boolean desdeFinish) {
        exigirPermiso();
        if (ejecucion.Solicitante__c != UserInfo.getUserId() || trabajo.CreatedById != UserInfo.getUserId() ||
            ejecucion.AsyncApexJobId__c != String.valueOf(trabajo.Id) || trabajo.JobType != 'BatchApex') {
            throw new ContextoInvalidoException('El diagnóstico requiere el trabajo vinculado y su solicitante.');
        }
        Boolean terminal = new Set<String>{'Completed', 'Failed', 'Aborted'}.contains(trabajo.Status);
        if (!terminal && !(desdeFinish && trabajo.Status == 'Processing')) return;
        Boolean resumenCoherente = trabajo.NumberOfErrors != null && trabajo.NumberOfErrors >= 0 &&
            trabajo.JobItemsProcessed != null && trabajo.TotalJobItems != null && trabajo.TotalJobItems >= 0 &&
            trabajo.JobItemsProcessed == trabajo.TotalJobItems && trabajo.NumberOfErrors <= trabajo.TotalJobItems;
        Boolean cierrePersistido = new Set<String>{'Completada', 'Completada con incidencias'}.contains(ejecucion.Estado__c) &&
            ejecucion.Finalizacion__c != null;
        Boolean problema = !resumenCoherente || trabajo.NumberOfErrors != 0 ||
            trabajo.Status == 'Failed' || trabajo.Status == 'Aborted' ||
            ejecucion.RequiereReconciliacion__c || ejecucion.LotesFallidos__c > 0 || (!desdeFinish && !cierrePersistido);
        if (!problema) {
            if (desdeFinish) {
                update as user new EjecucionRenovacion__c(Id = ejecucion.Id,
                    Estado__c = ejecucion.Fallidos__c > 0 ? 'Completada con incidencias' : 'Completada',
                    Finalizacion__c = ejecucion.Finalizacion__c == null ? System.now() : ejecucion.Finalizacion__c);
            }
            return;
        }
        // Failed/Aborted no identifican la fase del error. No se infieren scopes ni contratos perdidos.
        Boolean computable = resumenCoherente &&
            (trabajo.Status == 'Completed' || (desdeFinish && trabajo.Status == 'Processing'));
        Decimal lotes = computable ? Math.max(ejecucion.LotesFallidos__c, trabajo.NumberOfErrors) : ejecucion.LotesFallidos__c;
        String estado = trabajo.Status == 'Aborted' ? 'Abortada' : 'Fallida';
        String detalle = LoteRenovaciones.sanear(trabajo.ExtendedStatus, 4096);
        // Observación estable: no incluye reloj ni el estado de ejecución que cambia este mismo método.
        String observacion = JSON.serialize(new List<String>{'v1', String.valueOf(trabajo.Id), trabajo.Status,
            String.valueOf(trabajo.NumberOfErrors), String.valueOf(trabajo.JobItemsProcessed),
            String.valueOf(trabajo.TotalJobItems), detalle});
        String huella = 'CONTRASTE_JOB:v1:' + EncodingUtil.convertToHex(Crypto.generateDigest('SHA-256', Blob.valueOf(observacion)));
        List<IncidenciaRenovacion__c> anteriores = [SELECT Id FROM IncidenciaRenovacion__c
            WHERE Ejecucion__c = :ejecucion.Id AND Etapa__c = 'Reconciliación'
            AND CodigoError__c = 'CONTRASTE_JOB' AND ClaveIntentada__c = :huella WITH USER_MODE LIMIT 1];
        Boolean actualizar = !ejecucion.RequiereReconciliacion__c || ejecucion.Estado__c != estado ||
            ejecucion.LotesFallidos__c != lotes || ejecucion.Finalizacion__c == null;
        if (!actualizar && !anteriores.isEmpty()) return;
        Savepoint punto = Database.setSavepoint();
        try {
            if (actualizar) {
                update as user new EjecucionRenovacion__c(Id = ejecucion.Id, Estado__c = estado,
                    RequiereReconciliacion__c = true, LotesFallidos__c = lotes,
                    Finalizacion__c = ejecucion.Finalizacion__c == null ? System.now() : ejecucion.Finalizacion__c);
            }
            if (anteriores.isEmpty()) {
                insert as user new IncidenciaRenovacion__c(Ejecucion__c = ejecucion.Id,
                    Etapa__c = 'Reconciliación', CodigoError__c = 'CONTRASTE_JOB', ClaveIntentada__c = huella,
                    Mensaje__c = 'Job=' + trabajo.Id + '; estado=' + trabajo.Status +
                        '; NumberOfErrors=' + trabajo.NumberOfErrors + '; JobItemsProcessed=' + trabajo.JobItemsProcessed +
                        '; TotalJobItems=' + trabajo.TotalJobItems + '; LotesFallidos conservados=' + lotes + '. ' +
                        (computable ? 'Resumen completo: máximo entre histórico y fallos de lote informados. ' :
                            'Fase o resumen no concluyente: se conserva el contador previo de lotes. ') +
                        'Los resultados individuales no se reconstruyen. Revisión manual pendiente. Detalle: ' + detalle);
            }
        } catch (Exception error) {
            Database.rollback(punto);
            throw error;
        }
    }
}
