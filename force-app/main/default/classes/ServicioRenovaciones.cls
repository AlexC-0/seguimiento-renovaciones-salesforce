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
            'JobType, ApexClass.Name FROM AsyncApexJob WHERE Id = :trabajo AND CreatedById = :solicitante',
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
        if (!new Set<String>{'Completed', 'Failed', 'Aborted'}.contains(trabajo.Status)) return trabajo;
        Boolean cierreValido = trabajo.Status == 'Completed' && trabajo.NumberOfErrors == 0 &&
            trabajo.JobItemsProcessed == trabajo.TotalJobItems &&
            new Set<String>{'Completada', 'Completada con incidencias'}.contains(ejecucion.Estado__c) &&
            !ejecucion.RequiereReconciliacion__c;
        if (!cierreValido && !ejecucion.RequiereReconciliacion__c) {
            Savepoint punto = Database.setSavepoint();
            try {
                ejecucion.RequiereReconciliacion__c = true;
                ejecucion.Estado__c = trabajo.Status == 'Aborted' ? 'Abortada' : 'Fallida';
                ejecucion.Finalizacion__c = System.now();
                update as user ejecucion;
                insert as user new IncidenciaRenovacion__c(
                    Ejecucion__c = ejecucion.Id, Etapa__c = 'Reconciliación', CodigoError__c = 'CONTRASTE_JOB',
                    Mensaje__c = 'Job ' + trabajo.Status + '; lotes procesados=' + trabajo.JobItemsProcessed +
                        '; lotes totales=' + trabajo.TotalJobItems + '; errores=' + trabajo.NumberOfErrors +
                        '. Se requiere revisar resultados persistidos; no se infieren resultados individuales.');
            } catch (Exception error) {
                Database.rollback(punto);
                throw error;
            }
        }
        return trabajo;
    }
}
