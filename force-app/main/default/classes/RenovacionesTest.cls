@IsTest
private with sharing class RenovacionesTest {
    @TestSetup
    static void usuarios() {
        Id perfil = [SELECT Id FROM Profile WHERE Name = 'P06_BaseComercial'].Id;
        Map<String, Id> roles = new Map<String, Id>();
        for (UserRole rol : [SELECT Id, DeveloperName FROM UserRole WHERE DeveloperName IN ('P06_Comercial', 'P06_Coordinacion')]) {
            roles.put(rol.DeveloperName, rol.Id);
        }
        List<User> usuarios = new List<User>();
        for (String alias : new List<String>{'p06op', 'p06com', 'p06solo', 'p06fls', 'p06diag'}) {
            usuarios.add(new User(Alias = alias, LastName = 'Prueba ' + alias,
                Email = alias + '@example.invalid', Username = alias + '.' + Crypto.getRandomLong() + '@example.invalid',
                ProfileId = perfil, TimeZoneSidKey = 'Pacific/Kiritimati', LocaleSidKey = 'es_ES',
                EmailEncodingKey = 'UTF-8', LanguageLocaleKey = 'es',
                UserRoleId = roles.get(alias == 'p06op' ? 'P06_Coordinacion' : 'P06_Comercial')));
        }
        insert usuarios;
        Map<String, Id> permisos = new Map<String, Id>();
        for (PermissionSet permiso : [SELECT Id, Name FROM PermissionSet WHERE Name IN ('P06_OperadorRenovaciones', 'P06_Comercial')]) {
            permisos.put(permiso.Name, permiso.Id);
        }
        PermissionSet incompleto = new PermissionSet(Name = 'P06_PruebaFlsIncompleta', Label = 'P06 Prueba FLS incompleta');
        insert incompleto;
        insert new SetupEntityAccess(ParentId = incompleto.Id,
            SetupEntityId = [SELECT Id FROM CustomPermission WHERE DeveloperName = 'P06_ProcesarRenovaciones'].Id);
        List<ObjectPermissions> objetos = new List<ObjectPermissions>();
        for (String objeto : new List<String>{'ContratoComercial__c', 'SeguimientoRenovacion__c', 'EjecucionRenovacion__c', 'IncidenciaRenovacion__c'}) {
            objetos.add(new ObjectPermissions(ParentId = incompleto.Id, SobjectType = objeto, PermissionsRead = true,
                PermissionsCreate = objeto != 'ContratoComercial__c', PermissionsEdit = objeto == 'EjecucionRenovacion__c'));
        }
        insert objetos;
        List<FieldPermissions> campos = new List<FieldPermissions>();
        for (String campo : new List<String>{'Solicitante__c', 'AsyncApexJobId__c', 'Finalizacion__c', 'RequiereReconciliacion__c'}) {
            campos.add(new FieldPermissions(ParentId = incompleto.Id, SobjectType = 'EjecucionRenovacion__c',
                Field = 'EjecucionRenovacion__c.' + campo, PermissionsRead = true, PermissionsEdit = campo != 'AsyncApexJobId__c'));
        }
        insert campos;
        insert new PermissionSetAssignment(AssigneeId = usuarios[3].Id, PermissionSetId = incompleto.Id);
        // Permiso transitorio: puede cerrar ejecuciones y leer incidencias, pero no crearlas.
        PermissionSet sinDiagnostico = new PermissionSet(Name = 'P06_PruebaSinDiagnostico', Label = 'P06 Prueba sin creación de incidencia');
        insert sinDiagnostico;
        insert new SetupEntityAccess(ParentId = sinDiagnostico.Id,
            SetupEntityId = [SELECT Id FROM CustomPermission WHERE DeveloperName = 'P06_ProcesarRenovaciones'].Id);
        List<ObjectPermissions> objetosDiagnostico = new List<ObjectPermissions>();
        for (String objeto : new List<String>{'ContratoComercial__c', 'SeguimientoRenovacion__c', 'EjecucionRenovacion__c', 'IncidenciaRenovacion__c'}) {
            objetosDiagnostico.add(new ObjectPermissions(ParentId = sinDiagnostico.Id, SobjectType = objeto, PermissionsRead = true,
                PermissionsCreate = objeto == 'EjecucionRenovacion__c' || objeto == 'SeguimientoRenovacion__c',
                PermissionsEdit = objeto == 'EjecucionRenovacion__c'));
        }
        insert objetosDiagnostico;
        List<FieldPermissions> camposDiagnostico = new List<FieldPermissions>();
        for (String campo : new List<String>{'Solicitante__c', 'AsyncApexJobId__c', 'Finalizacion__c', 'RequiereReconciliacion__c'}) {
            camposDiagnostico.add(new FieldPermissions(ParentId = sinDiagnostico.Id, SobjectType = 'EjecucionRenovacion__c',
                Field = 'EjecucionRenovacion__c.' + campo, PermissionsRead = true, PermissionsEdit = true));
        }
        for (String campo : new List<String>{'Contrato__c', 'ClaveIntentada__c', 'Mensaje__c', 'CamposAfectados__c'}) {
            camposDiagnostico.add(new FieldPermissions(ParentId = sinDiagnostico.Id, SobjectType = 'IncidenciaRenovacion__c',
                Field = 'IncidenciaRenovacion__c.' + campo, PermissionsRead = true, PermissionsEdit = false));
        }
        insert camposDiagnostico;
        insert new PermissionSetAssignment(AssigneeId = usuarios[4].Id, PermissionSetId = sinDiagnostico.Id);
        PermissionSet soloPermiso = new PermissionSet(Name = 'P06_PruebaSoloPermiso', Label = 'P06 Prueba solo permiso');
        insert soloPermiso;
        insert new SetupEntityAccess(ParentId = soloPermiso.Id,
            SetupEntityId = [SELECT Id FROM CustomPermission WHERE DeveloperName = 'P06_ProcesarRenovaciones'].Id);
        insert new List<PermissionSetAssignment>{
            new PermissionSetAssignment(AssigneeId = usuarios[0].Id, PermissionSetId = permisos.get('P06_OperadorRenovaciones')),
            new PermissionSetAssignment(AssigneeId = usuarios[1].Id, PermissionSetId = permisos.get('P06_Comercial')),
            new PermissionSetAssignment(AssigneeId = usuarios[2].Id, PermissionSetId = soloPermiso.Id)};
    }

    private static User usuario(String alias) {
        return [SELECT Id, TimeZoneSidKey FROM User WHERE Alias = :alias AND Email = :(alias + '@example.invalid') LIMIT 1];
    }

    private static Date hoy() {
        return Date.valueOf(System.now().format('yyyy-MM-dd', UserInfo.getTimeZone().getID()));
    }

    private static List<ContratoComercial__c> contratos(List<Integer> dias, Date corte) {
        Account cuenta = new Account(Name = 'P06 Prueba aislada');
        insert as system cuenta;
        Id responsable = usuario('p06com').Id;
        List<ContratoComercial__c> filas = new List<ContratoComercial__c>();
        for (Integer dia : dias) filas.add(new ContratoComercial__c(Cuenta__c = cuenta.Id,
            FechaInicio__c = corte.addDays(-100), FechaVencimiento__c = corte.addDays(dia), Estado__c = 'Activo', OwnerId = responsable));
        insert as system filas;
        return filas;
    }

    private static EjecucionRenovacion__c ejecucion(Date corte) {
        EjecucionRenovacion__c registro = new EjecucionRenovacion__c(FechaCorte__c = corte,
            InicioVentana__c = corte, FinVentana__c = corte.addDays(30), ZonaHoraria__c = UserInfo.getTimeZone().getID(),
            Solicitante__c = UserInfo.getUserId(), Estado__c = 'Encolada');
        insert as user registro;
        return ServicioRenovaciones.leerEjecucion(registro.Id);
    }

    private static SeguimientoRenovacion__c seguimiento(ContratoComercial__c contrato, Id ejecucionId) {
        return new SeguimientoRenovacion__c(Contrato__c = contrato.Id,
            FechaVencimientoCapturada__c = contrato.FechaVencimiento__c, Ejecucion__c = ejecucionId,
            Estado__c = 'Pendiente', OwnerId = contrato.OwnerId);
    }

    @IsTest
    static void limitesEstadosCorteYJobReal() {
        System.runAs(usuario('p06op')) {
            Date corte = hoy();
            List<ContratoComercial__c> datos = contratos(new List<Integer>{-1, 0, 30, 31, 3, 4, 10}, corte);
            datos[4].Estado__c = 'Inactivo';
            datos[5].Estado__c = 'Borrador';
            update as system datos;
            Test.startTest();
            Id identificador = ServicioRenovaciones.lanzar(50, new Map<Id, ContratoComercial__c>(datos).keySet());
            EjecucionRenovacion__c encolada = ServicioRenovaciones.leerEjecucion(identificador);
            Assert.isNotNull(encolada.AsyncApexJobId__c, 'El lanzamiento persiste un Id real antes de terminar.');
            Assert.areEqual('Encolada', encolada.Estado__c);
            Assert.areEqual(encolada.AsyncApexJobId__c, String.valueOf(ServicioRenovaciones.contrastar(identificador).Id));
            Test.stopTest();
            EjecucionRenovacion__c resultado = ServicioRenovaciones.leerEjecucion(identificador);
            AsyncApexJob job = ServicioRenovaciones.contrastar(identificador);
            Assert.areEqual('Completed', job.Status);
            Assert.areEqual(1, job.TotalJobItems, 'La prueba usa un único lote.');
            Assert.areEqual(1, job.JobItemsProcessed);
            Assert.areEqual(0, job.NumberOfErrors);
            Assert.areEqual(String.valueOf(job.Id), resultado.AsyncApexJobId__c);
            Assert.areEqual(corte, resultado.FechaCorte__c);
            Assert.areEqual(corte.addDays(30), resultado.FinVentana__c);
            Assert.areEqual('Pacific/Kiritimati', resultado.ZonaHoraria__c);
            Assert.areEqual('Completada', resultado.Estado__c);
            Assert.areEqual(3, resultado.Evaluados__c);
            Assert.areEqual(3, resultado.Creados__c);
            Assert.areEqual(0, resultado.Fallidos__c);
            List<SeguimientoRenovacion__c> creados = [SELECT Contrato__c, FechaVencimientoCapturada__c, ClaveIdentidad__c,
                Estado__c, OwnerId FROM SeguimientoRenovacion__c WHERE Ejecucion__c = :identificador WITH USER_MODE];
            Set<Id> esperados = new Set<Id>{datos[1].Id, datos[2].Id, datos[6].Id};
            Assert.areEqual(3, creados.size());
            for (SeguimientoRenovacion__c fila : creados) {
                Assert.isTrue(esperados.contains(fila.Contrato__c));
                Assert.areEqual(usuario('p06com').Id, fila.OwnerId);
                Assert.areEqual('Pendiente', fila.Estado__c);
                Assert.areEqual(IdentidadRenovacion.clave(fila.Contrato__c, fila.FechaVencimientoCapturada__c), fila.ClaveIdentidad__c);
            }
            Database.SaveResult inmutable = Database.update(new EjecucionRenovacion__c(Id = identificador,
                AsyncApexJobId__c = null), false, AccessLevel.USER_MODE);
            Assert.isFalse(inmutable.isSuccess());
            Assert.isTrue(inmutable.getErrors()[0].getMessage().contains('trabajo no se puede cambiar'));
            Assert.areEqual(String.valueOf(job.Id), ServicioRenovaciones.leerEjecucion(identificador).AsyncApexJobId__c);
        }
    }

    @IsTest
    static void identidadNormalizadaYAlternativasRechazadas() {
        System.runAs(usuario('p06op')) {
            ContratoComercial__c contrato = contratos(new List<Integer>{0}, hoy())[0];
            EjecucionRenovacion__c origen = ejecucion(hoy());
            Id corto = Id.valueOf(String.valueOf(contrato.Id).left(15));
            String esperada = String.valueOf(contrato.Id) + '|' + String.valueOf(hoy());
            Assert.areEqual(29, IdentidadRenovacion.clave(corto, hoy()).length());
            Assert.areEqual(esperada, IdentidadRenovacion.clave(corto, hoy()));
            SeguimientoRenovacion__c valido = seguimiento(contrato, origen.Id);
            insert as user valido;
            Assert.areEqual(esperada, [SELECT ClaveIdentidad__c FROM SeguimientoRenovacion__c WHERE Id = :valido.Id].ClaveIdentidad__c);
            SeguimientoRenovacion__c incompatible = seguimiento(contrato, origen.Id);
            incompatible.ClaveIdentidad__c = IdentidadRenovacion.clave(contrato.Id, hoy().addDays(1));
            Database.SaveResult rechazo = Database.insert(incompatible, false, AccessLevel.USER_MODE);
            Assert.isFalse(rechazo.isSuccess());
            Assert.isTrue(rechazo.getErrors()[0].getMessage().contains('identidad canónica'));
            SeguimientoRenovacion__c alternativa = seguimiento(contrato, origen.Id);
            alternativa.ClaveIdentidad__c = esperada.toLowerCase();
            Database.SaveResult minusculas = Database.insert(alternativa, false, AccessLevel.USER_MODE);
            Assert.isFalse(minusculas.isSuccess());
            Database.SaveResult duplicado = Database.insert(seguimiento(contrato, origen.Id), false, AccessLevel.USER_MODE);
            Assert.isFalse(duplicado.isSuccess());
            Assert.areEqual(StatusCode.DUPLICATE_VALUE, duplicado.getErrors()[0].getStatusCode());
            Assert.areEqual(1, [SELECT COUNT() FROM SeguimientoRenovacion__c WHERE Contrato__c = :contrato.Id]);
        }
    }

    @IsTest
    static void repeticionConservaDatosComerciales() {
        System.runAs(usuario('p06op')) {
            ContratoComercial__c contrato = contratos(new List<Integer>{5}, hoy())[0];
            EjecucionRenovacion__c origen = ejecucion(hoy());
            SeguimientoRenovacion__c anterior = seguimiento(contrato, origen.Id);
            insert as user anterior;
            System.runAs(usuario('p06com')) {
                update as user new SeguimientoRenovacion__c(Id = anterior.Id, Estado__c = 'Cerrado', Notas__c = 'Nota conservada.');
            }
            Test.startTest();
            Id repeticion = ServicioRenovaciones.lanzar(50, new Set<Id>{contrato.Id});
            Test.stopTest();
            EjecucionRenovacion__c resultado = ServicioRenovaciones.leerEjecucion(repeticion);
            Assert.areEqual(1, resultado.Evaluados__c);
            Assert.areEqual(0, resultado.Creados__c);
            Assert.areEqual(1, resultado.YaExistentes__c);
            SeguimientoRenovacion__c conservado = [SELECT Estado__c, Notas__c, OwnerId, Ejecucion__c, ClaveIdentidad__c
                FROM SeguimientoRenovacion__c WHERE Id = :anterior.Id WITH USER_MODE];
            Assert.areEqual('Cerrado', conservado.Estado__c);
            Assert.areEqual('Nota conservada.', conservado.Notas__c);
            Assert.areEqual(contrato.OwnerId, conservado.OwnerId);
            Assert.areEqual(origen.Id, conservado.Ejecucion__c);
            Assert.areEqual(IdentidadRenovacion.clave(contrato.Id, contrato.FechaVencimiento__c), conservado.ClaveIdentidad__c);
            Assert.areEqual(1, [SELECT COUNT() FROM SeguimientoRenovacion__c WHERE Contrato__c = :contrato.Id]);
        }
    }

    @IsTest
    static void relecturaOmiteCambiosYConservaCorte() {
        System.runAs(usuario('p06op')) {
            Date corte = hoy().addDays(-5);
            List<ContratoComercial__c> datos = contratos(new List<Integer>{0, 1, 2}, corte);
            EjecucionRenovacion__c origen = ejecucion(corte);
            LoteRenovaciones lote = new LoteRenovaciones(origen.Id, null);
            datos[0].Estado__c = 'Inactivo';
            datos[1].FechaVencimiento__c = corte.addDays(31);
            update as system datos;
            lote.procesar(new Map<Id, ContratoComercial__c>(datos).keySet());
            EjecucionRenovacion__c resultado = ServicioRenovaciones.leerEjecucion(origen.Id);
            Assert.areEqual(3, resultado.Evaluados__c);
            Assert.areEqual(2, resultado.Omitidos__c);
            Assert.areEqual(1, resultado.Creados__c);
            Assert.areEqual(corte, resultado.FechaCorte__c);
            Assert.areEqual(corte.addDays(2), [SELECT FechaVencimientoCapturada__c FROM SeguimientoRenovacion__c
                WHERE Ejecucion__c = :origen.Id].FechaVencimientoCapturada__c, 'No se usa hoy al ejecutar el lote.');
        }
    }

    @IsTest
    static void resultadosParcialesEIncidencias() {
        System.runAs(usuario('p06op')) {
            List<ContratoComercial__c> datos = contratos(new List<Integer>{0, 1}, hoy());
            EjecucionRenovacion__c origen = ejecucion(hoy());
            SeguimientoRenovacion__c invalido = seguimiento(datos[1], origen.Id);
            invalido.Estado__c = 'Cerrado';
            LoteRenovaciones.registrar(origen, new List<SeguimientoRenovacion__c>{seguimiento(datos[0], origen.Id), invalido}, 0, 0);
            EjecucionRenovacion__c resultado = ServicioRenovaciones.leerEjecucion(origen.Id);
            Assert.areEqual(2, resultado.Evaluados__c);
            Assert.areEqual(1, resultado.Creados__c);
            Assert.areEqual(1, resultado.Fallidos__c);
            Assert.areEqual(0, resultado.LotesFallidos__c);
            Assert.areEqual(1, [SELECT COUNT() FROM SeguimientoRenovacion__c WHERE Ejecucion__c = :origen.Id]);
            List<IncidenciaRenovacion__c> incidencias = [SELECT Contrato__c, Etapa__c, CodigoError__c, Mensaje__c, ClaveIntentada__c
                FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :origen.Id WITH USER_MODE];
            Assert.isTrue(incidencias.size() >= 1);
            for (IncidenciaRenovacion__c incidencia : incidencias) {
                Assert.areEqual(datos[1].Id, incidencia.Contrato__c);
                Assert.areEqual('Creación', incidencia.Etapa__c);
                Assert.areEqual('FIELD_CUSTOM_VALIDATION_EXCEPTION', incidencia.CodigoError__c);
                Assert.isFalse(String.isBlank(incidencia.Mensaje__c));
            }
        }
    }

    @IsTest
    static void falloDeContadoresRevierteTodoElLote() {
        System.runAs(usuario('p06op')) {
            List<ContratoComercial__c> datos = contratos(new List<Integer>{0, 1}, hoy());
            EjecucionRenovacion__c origen = ejecucion(hoy());
            origen.FechaCorte__c = hoy().addDays(1);
            SeguimientoRenovacion__c invalido = seguimiento(datos[1], origen.Id);
            invalido.Estado__c = 'Cerrado';
            Boolean fallo = false;
            try {
                LoteRenovaciones.registrar(origen, new List<SeguimientoRenovacion__c>{seguimiento(datos[0], origen.Id), invalido}, 0, 0);
            } catch (DmlException esperado) {
                fallo = true;
            }
            Assert.isTrue(fallo);
            Assert.areEqual(0, [SELECT COUNT() FROM SeguimientoRenovacion__c WHERE Ejecucion__c = :origen.Id]);
            Assert.areEqual(0, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :origen.Id]);
            Assert.areEqual(0, ServicioRenovaciones.leerEjecucion(origen.Id).Evaluados__c);
        }
    }

    @IsTest
    static void duplicadoConfirmadoNoEsFallo() {
        System.runAs(usuario('p06op')) {
            ContratoComercial__c contrato = contratos(new List<Integer>{0}, hoy())[0];
            EjecucionRenovacion__c origen = ejecucion(hoy());
            SeguimientoRenovacion__c previo = seguimiento(contrato, origen.Id);
            insert as user previo;
            SeguimientoRenovacion__c repetido = seguimiento(contrato, origen.Id);
            repetido.ClaveIdentidad__c = IdentidadRenovacion.clave(contrato.Id, contrato.FechaVencimiento__c);
            LoteRenovaciones.registrar(origen, new List<SeguimientoRenovacion__c>{repetido}, 0, 0);
            EjecucionRenovacion__c resultado = ServicioRenovaciones.leerEjecucion(origen.Id);
            Assert.areEqual(1, resultado.YaExistentes__c);
            Assert.areEqual(0, resultado.Creados__c);
            Assert.areEqual(0, resultado.Fallidos__c);
            Assert.areEqual(0, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :origen.Id]);
        }
    }

    @IsTest
    static void conjuntoVacioNuncaSeleccionaTodos() {
        System.runAs(usuario('p06op')) {
            contratos(new List<Integer>{0}, hoy());
            Test.startTest();
            Id identificador = ServicioRenovaciones.lanzar(50, new Set<Id>());
            Test.stopTest();
            EjecucionRenovacion__c resultado = ServicioRenovaciones.leerEjecucion(identificador);
            Assert.areEqual('Completada', resultado.Estado__c);
            Assert.areEqual(0, resultado.Evaluados__c);
            Assert.areEqual(0, [SELECT COUNT() FROM SeguimientoRenovacion__c]);
            Assert.areEqual('Completed', ServicioRenovaciones.contrastar(identificador).Status);
        }
    }

    @IsTest
    static void seleccionOrdinariaSinCandidatos() {
        System.runAs(usuario('p06op')) {
            contratos(new List<Integer>{-1, 31}, hoy());
            Test.startTest();
            Id identificador = ServicioRenovaciones.lanzar(50);
            Test.stopTest();
            Assert.areEqual('Completada', ServicioRenovaciones.leerEjecucion(identificador).Estado__c);
            Assert.areEqual(0, ServicioRenovaciones.leerEjecucion(identificador).Evaluados__c);
        }
    }

    @IsTest
    static void autorizacionEnTodosLosPuntosDeEntrada() {
        LoteRenovaciones lote;
        System.runAs(usuario('p06op')) { lote = new LoteRenovaciones(ejecucion(hoy()).Id, null); }
        System.runAs(usuario('p06com')) {
            Integer denegaciones = 0;
            try { ServicioRenovaciones.lanzar(50); } catch (ServicioRenovaciones.AccesoDenegadoException e) { denegaciones++; }
            try { new LoteRenovaciones(null, null); } catch (ServicioRenovaciones.AccesoDenegadoException e) { denegaciones++; }
            try { lote.start(null); } catch (ServicioRenovaciones.AccesoDenegadoException e) { denegaciones++; }
            try { lote.execute(null, new List<SObject>()); } catch (ServicioRenovaciones.AccesoDenegadoException e) { denegaciones++; }
            try { lote.finish(null); } catch (ServicioRenovaciones.AccesoDenegadoException e) { denegaciones++; }
            try { ServicioRenovaciones.contrastar(null); } catch (ServicioRenovaciones.AccesoDenegadoException e) { denegaciones++; }
            Assert.areEqual(6, denegaciones);
        }
    }

    @IsTest
    static void permisoPersonalizadoNoSustituyeCrud() {
        System.runAs(usuario('p06solo')) {
            Assert.isTrue(FeatureManagement.checkPermission('P06_ProcesarRenovaciones'));
            Boolean rechazado = false;
            try { ServicioRenovaciones.lanzar(50); } catch (ServicioRenovaciones.AccesoDenegadoException e) { rechazado = true; }
            Assert.isTrue(rechazado);
            Assert.areEqual(0, [SELECT COUNT() FROM EjecucionRenovacion__c]);
        }
    }

    @IsTest
    static void entradasInvalidasYSaneamiento() {
        System.runAs(usuario('p06op')) {
            Integer errores = 0;
            for (Integer tamanio : new List<Integer>{0, 201, null}) {
                try { ServicioRenovaciones.lanzar(tamanio); } catch (IllegalArgumentException e) { errores++; }
            }
            try { ServicioRenovaciones.lanzar(50, new Set<Id>{UserInfo.getUserId()}); } catch (IllegalArgumentException e) { errores++; }
            try { IdentidadRenovacion.clave(null, hoy()); } catch (IllegalArgumentException e) { errores++; }
            Assert.areEqual(5, errores);
            String secreto = 'Bearer valor-secreto password=valor-privado access_token=valor-token https://example.invalid/?sid=oculto a@example.invalid';
            String limpio = LoteRenovaciones.sanear(secreto, 32768);
            Assert.isFalse(limpio.contains('valor-secreto'));
            Assert.isFalse(limpio.contains('valor-privado'));
            Assert.isFalse(limpio.contains('valor-token'));
            Assert.isFalse(limpio.contains('sid=oculto'));
            Assert.isFalse(limpio.contains('@'));
            Assert.areEqual(255, LoteRenovaciones.sanear('a'.repeat(300), 255).length());
            Assert.areEqual(32768, LoteRenovaciones.sanear('a'.repeat(33000), 32768).length());
            Assert.isFalse(String.isBlank(LoteRenovaciones.sanear(null, 255)));
        }
    }

    @IsTest
    static void falloAlGuardarJobRevierteEjecucionYCola() {
        System.runAs(usuario('p06fls')) {
            Assert.isTrue(EjecucionRenovacion__c.AsyncApexJobId__c.getDescribe().isAccessible());
            Assert.isFalse(EjecucionRenovacion__c.AsyncApexJobId__c.getDescribe().isUpdateable());
            Boolean fallo = false;
            try { ServicioRenovaciones.lanzar(50, new Set<Id>()); } catch (DmlException esperado) {
                fallo = true;
                Assert.isTrue(esperado.getDmlMessage(0).contains('AsyncApexJobId__c'), 'El fallo debe producirse al persistir el job tras encolarlo.');
            }
            Assert.isTrue(fallo, 'El permiso personalizado no permite ignorar FLS.');
            Assert.areEqual(0, [SELECT COUNT() FROM EjecucionRenovacion__c]);
            Assert.areEqual(0, [SELECT COUNT() FROM AsyncApexJob WHERE CreatedById = :UserInfo.getUserId() AND JobType = 'BatchApex']);
        }
    }

    @IsTest
    static void contrasteDetectaCierreIncoherenteSinInventarResultados() {
        System.runAs(usuario('p06op')) {
            Test.startTest();
            Id identificador = ServicioRenovaciones.lanzar(50, new Set<Id>());
            Test.stopTest();
            update as user new EjecucionRenovacion__c(Id = identificador, Estado__c = 'En curso', Finalizacion__c = null);
            AsyncApexJob real = ServicioRenovaciones.contrastar(identificador);
            Assert.areEqual('Completed', real.Status);
            EjecucionRenovacion__c resultado = ServicioRenovaciones.leerEjecucion(identificador);
            Assert.areEqual('Fallida', resultado.Estado__c);
            Assert.isTrue(resultado.RequiereReconciliacion__c);
            Assert.areEqual(0, resultado.Evaluados__c);
            Assert.areEqual(0, resultado.LotesFallidos__c);
            Assert.areEqual(1, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :identificador]);
            ServicioRenovaciones.contrastar(identificador);
            Assert.areEqual(1, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :identificador]);
            Boolean rechazo = false;
            try { new LoteRenovaciones(identificador, null); } catch (ServicioRenovaciones.ContextoInvalidoException e) { rechazo = true; }
            Assert.isTrue(rechazo, 'Una ejecución utilizada no admite otro Batch.');
        }
    }

    private static EjecucionRenovacion__c cierreIncompleto() {
        Test.startTest();
        Id identificador = ServicioRenovaciones.lanzar(50, new Set<Id>());
        Test.stopTest();
        update as user new EjecucionRenovacion__c(Id = identificador, Estado__c = 'En curso', Finalizacion__c = null,
            Evaluados__c = 7, Creados__c = 3, YaExistentes__c = 2, Omitidos__c = 1, Fallidos__c = 1);
        return ServicioRenovaciones.leerEjecucion(identificador);
    }

    private static List<Decimal> individuales(EjecucionRenovacion__c e) {
        return new List<Decimal>{e.Evaluados__c, e.Creados__c, e.YaExistentes__c, e.Omitidos__c, e.Fallidos__c};
    }

    // Observación simulada en memoria, con el Id de un job real de prueba. No modifica AsyncApexJob.
    private static AsyncApexJob observacionControlada(EjecucionRenovacion__c e, String estado,
                                                      Integer errores, Integer procesados, Integer total, String detalle) {
        AsyncApexJob real = ServicioRenovaciones.leerTrabajo(e);
        Map<String, Object> datos = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(real));
        datos.put('Status', estado);
        datos.put('NumberOfErrors', errores);
        datos.put('JobItemsProcessed', procesados);
        datos.put('TotalJobItems', total);
        datos.put('ExtendedStatus', detalle);
        return (AsyncApexJob)JSON.deserialize(JSON.serialize(datos), AsyncApexJob.class);
    }

    @IsTest
    static void marcaPreviaNoSustituyeDiagnostico() {
        System.runAs(usuario('p06op')) {
            EjecucionRenovacion__c e = cierreIncompleto();
            List<Decimal> confirmados = individuales(e);
            update as user new EjecucionRenovacion__c(Id = e.Id, Estado__c = 'Fallida',
                Finalizacion__c = System.now(), RequiereReconciliacion__c = true, LotesFallidos__c = 2);
            insert as user new IncidenciaRenovacion__c(Ejecucion__c = e.Id, Etapa__c = 'Reconciliación',
                CodigoError__c = 'CONTRASTE_JOB', Mensaje__c = 'Diagnóstico anterior sin huella.');
            IncidenciaRenovacion__c anterior = [SELECT Id, Mensaje__c FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :e.Id];
            ServicioRenovaciones.contrastar(e.Id);
            EjecucionRenovacion__c resultado = ServicioRenovaciones.leerEjecucion(e.Id);
            Assert.isTrue(resultado.RequiereReconciliacion__c);
            Assert.areEqual('Fallida', resultado.Estado__c);
            Assert.areEqual(2, resultado.LotesFallidos__c, 'Un cero posterior no borra el histórico confirmado.');
            Assert.areEqual(confirmados, individuales(resultado));
            Assert.areEqual(2, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :e.Id]);
            Assert.areEqual(anterior.Mensaje__c, [SELECT Mensaje__c FROM IncidenciaRenovacion__c WHERE Id = :anterior.Id].Mensaje__c);
            Integer dml = Limits.getDmlStatements();
            ServicioRenovaciones.contrastar(e.Id);
            Assert.areEqual(dml, Limits.getDmlStatements(), 'Sin novedades no hay escritura ni incidencia duplicada.');
            Assert.areEqual(resultado.Finalizacion__c, ServicioRenovaciones.leerEjecucion(e.Id).Finalizacion__c);
        }
    }

    @IsTest
    static void resumenControladoRecuperaLotesYConservaHistoria() {
        System.runAs(usuario('p06op')) {
            EjecucionRenovacion__c e = cierreIncompleto();
            List<Decimal> confirmados = individuales(e);
            AsyncApexJob observado = observacionControlada(e, 'Completed', 2, 3, 3, 'Fallo controlado de lote');
            ServicioRenovaciones.aplicarEstadoTrabajo(e, observado, false);
            e = ServicioRenovaciones.leerEjecucion(e.Id);
            Assert.areEqual(2, e.LotesFallidos__c);
            Assert.areEqual('Fallida', e.Estado__c);
            Assert.isTrue(e.RequiereReconciliacion__c);
            Assert.areEqual(confirmados, individuales(e));
            IncidenciaRenovacion__c primera = [SELECT Id, Mensaje__c, ClaveIntentada__c FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :e.Id];
            Assert.isTrue(primera.Mensaje__c.contains('NumberOfErrors=2'));
            Integer dml = Limits.getDmlStatements();
            ServicioRenovaciones.aplicarEstadoTrabajo(e, observado, false);
            Assert.areEqual(dml, Limits.getDmlStatements());
            observado = observacionControlada(e, 'Completed', 3, 3, 3, 'Otra observación controlada');
            ServicioRenovaciones.aplicarEstadoTrabajo(e, observado, false);
            e = ServicioRenovaciones.leerEjecucion(e.Id);
            Assert.areEqual(3, e.LotesFallidos__c);
            Assert.areEqual(2, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :e.Id]);
            observado = observacionControlada(e, 'Completed', 3, 3, 3, 'Nuevo detalle sin cambiar contadores');
            ServicioRenovaciones.aplicarEstadoTrabajo(e, observado, false);
            e = ServicioRenovaciones.leerEjecucion(e.Id);
            Assert.areEqual(3, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :e.Id]);
            observado = observacionControlada(e, 'Completed', 1, 3, 3, 'Información posterior inferior');
            ServicioRenovaciones.aplicarEstadoTrabajo(e, observado, false);
            e = ServicioRenovaciones.leerEjecucion(e.Id);
            Assert.areEqual(3, e.LotesFallidos__c);
            Assert.areEqual(confirmados, individuales(e));
            Assert.areEqual(primera.Mensaje__c, [SELECT Mensaje__c FROM IncidenciaRenovacion__c WHERE Id = :primera.Id].Mensaje__c);
            Assert.areEqual(4, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :e.Id]);
            Assert.areEqual('Completed', ServicioRenovaciones.leerTrabajo(e).Status);
            Assert.areEqual(0, ServicioRenovaciones.leerTrabajo(e).NumberOfErrors, 'El job real no sufrió el fallo simulado.');
        }
    }

    @IsTest
    static void estadosAmbiguosNoInventanLotes() {
        System.runAs(usuario('p06op')) {
            EjecucionRenovacion__c e = cierreIncompleto();
            List<Decimal> confirmados = individuales(e);
            for (String estado : new List<String>{'Failed', 'Aborted', 'Completed'}) {
                AsyncApexJob observado = observacionControlada(e, estado, 1, 0, 0, 'Fase del fallo no acreditada');
                ServicioRenovaciones.aplicarEstadoTrabajo(e, observado, false);
                e = ServicioRenovaciones.leerEjecucion(e.Id);
                Assert.areEqual(0, e.LotesFallidos__c, 'Un error sin scopes no equivale a un lote de contratos.');
                Assert.areEqual(estado == 'Aborted' ? 'Abortada' : 'Fallida', e.Estado__c);
                Assert.isTrue(e.RequiereReconciliacion__c);
                Assert.areEqual(confirmados, individuales(e));
            }
            ServicioRenovaciones.aplicarEstadoTrabajo(e, observacionControlada(e, 'Failed', 1, 3, 3, 'Fase desconocida con resumen completo'), false);
            e = ServicioRenovaciones.leerEjecucion(e.Id);
            Assert.areEqual(0, e.LotesFallidos__c, 'Failed no permite atribuir el error a execute aunque los totales coincidan.');
            AsyncApexJob desconocido = observacionControlada(e, 'Failed', null, 2, 3, 'Número de errores ausente');
            ServicioRenovaciones.aplicarEstadoTrabajo(e, desconocido, false);
            Assert.areEqual(0, ServicioRenovaciones.leerEjecucion(e.Id).LotesFallidos__c);
            Assert.areEqual(5, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :e.Id]);
            Assert.areEqual(0, ServicioRenovaciones.leerTrabajo(e).NumberOfErrors);
        }
    }

    @IsTest
    static void finishControladoDejaDiagnosticoAntesDelContraste() {
        System.runAs(usuario('p06op')) {
            EjecucionRenovacion__c e = cierreIncompleto();
            List<Decimal> confirmados = individuales(e);
            ServicioRenovaciones.aplicarEstadoTrabajo(e,
                observacionControlada(e, 'Processing', 1, 3, 3, 'Error controlado previo a finish'), true);
            e = ServicioRenovaciones.leerEjecucion(e.Id);
            Assert.isTrue(e.RequiereReconciliacion__c);
            Assert.areEqual(1, e.LotesFallidos__c);
            Assert.areEqual(1, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :e.Id]);
            AsyncApexJob terminal = observacionControlada(e, 'Completed', 1, 3, 3, 'Error controlado previo a finish');
            ServicioRenovaciones.aplicarEstadoTrabajo(e, terminal, false);
            e = ServicioRenovaciones.leerEjecucion(e.Id);
            ServicioRenovaciones.aplicarEstadoTrabajo(e, terminal, false);
            Assert.areEqual(2, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :e.Id], 'El estado terminal aporta una observación nueva, una sola vez.');
            Assert.areEqual(confirmados, individuales(e));
        }
    }

    @IsTest
    static void contrasteNoCierraTrabajosActivos() {
        System.runAs(usuario('p06op')) {
            Test.startTest();
            Id identificador = ServicioRenovaciones.lanzar(50, new Set<Id>());
            ServicioRenovaciones.contrastar(identificador);
            EjecucionRenovacion__c e = ServicioRenovaciones.leerEjecucion(identificador);
            Assert.areEqual('Encolada', e.Estado__c);
            Assert.isNull(e.Finalizacion__c);
            Assert.isFalse(e.RequiereReconciliacion__c);
            Assert.areEqual(0, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :identificador]);
            Test.stopTest();
            update as user new EjecucionRenovacion__c(Id = identificador, Estado__c = 'En curso', Finalizacion__c = null);
            e = ServicioRenovaciones.leerEjecucion(identificador);
            for (String estado : new List<String>{'Holding', 'Queued', 'Preparing', 'Processing'}) {
                Integer dml = Limits.getDmlStatements();
                ServicioRenovaciones.aplicarEstadoTrabajo(e, observacionControlada(e, estado, 1, 1, 3, null), false);
                Assert.areEqual(dml, Limits.getDmlStatements());
                Assert.areEqual('En curso', ServicioRenovaciones.leerEjecucion(identificador).Estado__c);
                Assert.isNull(ServicioRenovaciones.leerEjecucion(identificador).Finalizacion__c);
            }
        }
    }

    @IsTest
    static void diagnosticoNoPersistidoRevierteActualizacion() {
        System.runAs(usuario('p06diag')) {
            EjecucionRenovacion__c e = ejecucion(hoy());
            Test.startTest();
            Id real = Database.executeBatch(new LoteRenovaciones(e.Id, new Set<Id>()), 50);
            update as user new EjecucionRenovacion__c(Id = e.Id, AsyncApexJobId__c = String.valueOf(real));
            Test.stopTest();
            Assert.areEqual('Completed', ServicioRenovaciones.leerTrabajo(ServicioRenovaciones.leerEjecucion(e.Id)).Status);
            update as user new EjecucionRenovacion__c(Id = e.Id, Estado__c = 'En curso', Finalizacion__c = null);
            Boolean fallo = false;
            try { ServicioRenovaciones.contrastar(e.Id); } catch (TypeException esperado) {
                Assert.isTrue(esperado.getMessage().contains('INSERT not allowed on IncidenciaRenovacion__c'));
                fallo = true;
            }
            Assert.isTrue(fallo, 'La falta de creación de incidencias debe propagarse.');
            e = ServicioRenovaciones.leerEjecucion(e.Id);
            Assert.areEqual('En curso', e.Estado__c);
            Assert.isNull(e.Finalizacion__c);
            Assert.isFalse(e.RequiereReconciliacion__c);
            Assert.areEqual(0, e.LotesFallidos__c);
            Assert.areEqual(new List<Decimal>{0, 0, 0, 0, 0}, individuales(e));
            Assert.areEqual(0, [SELECT COUNT() FROM IncidenciaRenovacion__c WHERE Ejecucion__c = :e.Id]);
        }
    }
}
