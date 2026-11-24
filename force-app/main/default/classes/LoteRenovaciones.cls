public with sharing class LoteRenovaciones implements Database.Batchable<SObject> {
    private Id ejecucionId;
    private Date corte;
    private Date fin;
    private Set<Id> filtro;

    public LoteRenovaciones(Id identificador, Set<Id> contratos) {
        ServicioRenovaciones.exigirPermiso();
        EjecucionRenovacion__c ejecucion = ServicioRenovaciones.leerEjecucion(identificador);
        if (ejecucion.Estado__c != 'Encolada' || !String.isBlank(ejecucion.AsyncApexJobId__c)) {
            throw new ServicioRenovaciones.ContextoInvalidoException('Se requiere una ejecución nueva, sin trabajo asignado.');
        }
        ejecucionId = identificador;
        corte = ejecucion.FechaCorte__c;
        fin = ejecucion.FinVentana__c;
        filtro = contratos == null ? null : contratos.clone();
    }

    private EjecucionRenovacion__c validarContexto(Database.BatchableContext contexto) {
        ServicioRenovaciones.exigirPermiso();
        EjecucionRenovacion__c ejecucion = ServicioRenovaciones.leerEjecucion(ejecucionId);
        if (contexto == null || ejecucion.AsyncApexJobId__c != String.valueOf(contexto.getJobId())) {
            throw new ServicioRenovaciones.ContextoInvalidoException('El Batch no está vinculado al trabajo registrado.');
        }
        return ejecucion;
    }

    public Database.QueryLocator start(Database.BatchableContext contexto) {
        EjecucionRenovacion__c ejecucion = validarContexto(contexto);
        ejecucion.Estado__c = 'En curso';
        update as user ejecucion;
        String consulta = 'SELECT Id FROM ContratoComercial__c WHERE Estado__c = :activo ' +
            'AND FechaVencimiento__c >= :corte AND FechaVencimiento__c <= :fin';
        if (filtro != null) consulta += ' AND Id IN :filtro';
        return Database.getQueryLocatorWithBinds(consulta,
            new Map<String, Object>{'activo' => 'Activo', 'corte' => corte, 'fin' => fin, 'filtro' => filtro},
            AccessLevel.USER_MODE);
    }

    public void execute(Database.BatchableContext contexto, List<SObject> alcance) {
        validarContexto(contexto);
        Set<Id> contratos = new Set<Id>();
        for (SObject registro : alcance) contratos.add((Id)registro.get('Id'));
        procesar(contratos);
    }

    @TestVisible
    private void procesar(Set<Id> candidatos) {
        EjecucionRenovacion__c ejecucion = ServicioRenovaciones.leerEjecucion(ejecucionId);
        Map<Id, ContratoComercial__c> actuales = new Map<Id, ContratoComercial__c>(
            [SELECT Id, OwnerId, Estado__c, FechaVencimiento__c FROM ContratoComercial__c
             WHERE Id IN :candidatos WITH USER_MODE]);
        List<SeguimientoRenovacion__c> nuevos = new List<SeguimientoRenovacion__c>();
        Set<Id> elegibles = new Set<Id>();
        Set<Date> fechas = new Set<Date>();
        Integer omitidos = 0;
        for (Id candidato : candidatos) {
            ContratoComercial__c contrato = actuales.get(candidato);
            if (contrato == null || contrato.Estado__c != 'Activo' ||
                contrato.FechaVencimiento__c < corte || contrato.FechaVencimiento__c > fin) {
                omitidos++;
            } else {
                elegibles.add(contrato.Id);
                fechas.add(contrato.FechaVencimiento__c);
            }
        }
        Set<String> representadas = new Set<String>();
        if (!elegibles.isEmpty()) {
            for (SeguimientoRenovacion__c existente :
                [SELECT Contrato__c, FechaVencimientoCapturada__c FROM SeguimientoRenovacion__c
                 WHERE Contrato__c IN :elegibles AND FechaVencimientoCapturada__c IN :fechas WITH USER_MODE]) {
                representadas.add(IdentidadRenovacion.clave(existente.Contrato__c, existente.FechaVencimientoCapturada__c));
            }
        }
        Integer previos = 0;
        for (Id identificador : elegibles) {
            ContratoComercial__c contrato = actuales.get(identificador);
            String clave = IdentidadRenovacion.clave(contrato.Id, contrato.FechaVencimiento__c);
            if (representadas.contains(clave)) {
                previos++;
            } else {
                nuevos.add(new SeguimientoRenovacion__c(Contrato__c = contrato.Id,
                    FechaVencimientoCapturada__c = contrato.FechaVencimiento__c, ClaveIdentidad__c = clave,
                    Estado__c = 'Pendiente', OwnerId = contrato.OwnerId, Ejecucion__c = ejecucionId));
            }
        }
        registrar(ejecucion, nuevos, previos, omitidos);
    }

    @TestVisible
    private static void registrar(EjecucionRenovacion__c ejecucion, List<SeguimientoRenovacion__c> nuevos,
                                  Integer previos, Integer omitidos) {
        ServicioRenovaciones.exigirPermiso();
        Savepoint punto = Database.setSavepoint();
        try {
            List<Database.SaveResult> resultados = Database.insert(nuevos, false, AccessLevel.USER_MODE);
            Set<String> clavesDuplicadas = new Set<String>();
            Set<Integer> posiblesDuplicados = new Set<Integer>();
            for (Integer i = 0; i < resultados.size(); i++) {
                if (resultados[i].isSuccess()) continue;
                Boolean soloClaveDuplicada = !resultados[i].getErrors().isEmpty();
                for (Database.Error error : resultados[i].getErrors()) {
                    soloClaveDuplicada = soloClaveDuplicada && error.getStatusCode() == StatusCode.DUPLICATE_VALUE &&
                        (error.getFields().isEmpty() || error.getFields().contains('ClaveIdentidad__c')); 
                }
                if (soloClaveDuplicada) {
                    posiblesDuplicados.add(i);
                    clavesDuplicadas.add(nuevos[i].ClaveIdentidad__c);
                }
            }
            Map<String, SeguimientoRenovacion__c> confirmadas = new Map<String, SeguimientoRenovacion__c>();
            if (!clavesDuplicadas.isEmpty()) {
                for (SeguimientoRenovacion__c existente :
                    [SELECT ClaveIdentidad__c, Contrato__c, FechaVencimientoCapturada__c FROM SeguimientoRenovacion__c
                     WHERE ClaveIdentidad__c IN :clavesDuplicadas WITH USER_MODE]) {
                    confirmadas.put(existente.ClaveIdentidad__c, existente);
                }
            }
            Integer creados = 0;
            Integer fallidos = 0;
            List<IncidenciaRenovacion__c> incidencias = new List<IncidenciaRenovacion__c>();
            for (Integer i = 0; i < resultados.size(); i++) {
                if (resultados[i].isSuccess()) {
                    creados++;
                    continue;
                }
                SeguimientoRenovacion__c intento = nuevos[i];
                SeguimientoRenovacion__c confirmado = confirmadas.get(intento.ClaveIdentidad__c);
                if (posiblesDuplicados.contains(i) && confirmado != null &&
                    confirmado.Contrato__c == intento.Contrato__c &&
                    confirmado.FechaVencimientoCapturada__c == intento.FechaVencimientoCapturada__c &&
                    intento.ClaveIdentidad__c.equals(confirmado.ClaveIdentidad__c)) {
                    previos++;
                    continue;
                }
                fallidos++;
                for (Database.Error error : resultados[i].getErrors()) {
                    incidencias.add(new IncidenciaRenovacion__c(Ejecucion__c = ejecucion.Id,
                        Contrato__c = intento.Contrato__c, ClaveIntentada__c = sanear(intento.ClaveIdentidad__c, 255),
                        Etapa__c = 'Creación', CodigoError__c = String.valueOf(error.getStatusCode()),
                        Mensaje__c = sanear(error.getMessage(), 32768),
                        CamposAfectados__c = sanear(String.join(error.getFields(), ';'), 255)));
                }
            }
            if (!incidencias.isEmpty()) Database.insert(incidencias, true, AccessLevel.USER_MODE);
            ejecucion.Creados__c += creados;
            ejecucion.YaExistentes__c += previos;
            ejecucion.Omitidos__c += omitidos;
            ejecucion.Fallidos__c += fallidos;
            ejecucion.Evaluados__c += creados + previos + omitidos + fallidos;
            update as user ejecucion;
        } catch (Exception error) {
            Database.rollback(punto);
            throw error;
        }
    }

    public static String sanear(String texto, Integer maximo) {
        if (String.isBlank(texto)) return 'Sin detalle adicional.';
        String limpio = texto.replaceAll('(?i)https?://\\S+', '[URL]')
            .replaceAll('(?i)bearer\\s+[^\\s,;]+', 'Bearer [redactado]')
            .replaceAll('(?i)(access_token|refresh_token|password|passwd|sid|secret)\\s*[:=]\\s*[^\\s,;]+', '$1=[redactado]')
            .replaceAll('(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}', '[identidad]');
        String aviso = ' [truncado]';
        return limpio.length() > maximo ? limpio.left(maximo - aviso.length()) + aviso : limpio;
    }

    public void finish(Database.BatchableContext contexto) {
        ServicioRenovaciones.finalizar(ejecucionId, contexto);
    }
}
