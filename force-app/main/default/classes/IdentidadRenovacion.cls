public without sharing class IdentidadRenovacion {
    public static String clave(Id contrato, Date vencimiento) {
        if (contrato == null || vencimiento == null ||
            contrato.getSObjectType() != ContratoComercial__c.SObjectType) {
            throw new IllegalArgumentException('La identidad requiere contrato y vencimiento capturado.');
        }
        return String.valueOf(contrato) + '|' +
            ('0000' + vencimiento.year()).right(4) + '-' +
            ('0' + vencimiento.month()).right(2) + '-' +
            ('0' + vencimiento.day()).right(2);
    }

    public static void validarInsercion(List<SeguimientoRenovacion__c> registros) {
        Set<Id> contratos = new Set<Id>();
        Set<Date> fechas = new Set<Date>();
        for (SeguimientoRenovacion__c registro : registros) {
            if (registro.Contrato__c == null || registro.FechaVencimientoCapturada__c == null) {
                registro.addError('La identidad requiere contrato y vencimiento capturado.');
                continue;
            }
            String esperada = clave(registro.Contrato__c, registro.FechaVencimientoCapturada__c);
            if (String.isBlank(registro.ClaveIdentidad__c)) {
                registro.ClaveIdentidad__c = esperada;
            } else if (!esperada.equals(registro.ClaveIdentidad__c)) {
                registro.ClaveIdentidad__c.addError('La clave no coincide con la identidad canónica del contrato y vencimiento capturado.');
                continue;
            }
            contratos.add(registro.Contrato__c);
            fechas.add(registro.FechaVencimientoCapturada__c);
        }
        if (contratos.isEmpty()) return;
        // Invariante global: solo se leen parejas solicitadas; no se devuelven datos ajenos.
        List<SeguimientoRenovacion__c> existentes = Database.queryWithBinds(
            'SELECT Contrato__c, FechaVencimientoCapturada__c, ClaveIdentidad__c ' +
            'FROM SeguimientoRenovacion__c WHERE Contrato__c IN :contratos ' +
            'AND FechaVencimientoCapturada__c IN :fechas',
            new Map<String, Object>{'contratos' => contratos, 'fechas' => fechas}, AccessLevel.SYSTEM_MODE);
        Set<String> parejasConClaveAnterior = new Set<String>();
        for (SeguimientoRenovacion__c existente : existentes) {
            String pareja = clave(existente.Contrato__c, existente.FechaVencimientoCapturada__c);
            if (!pareja.equals(existente.ClaveIdentidad__c)) parejasConClaveAnterior.add(pareja);
        }
        for (SeguimientoRenovacion__c registro : registros) {
            if (parejasConClaveAnterior.contains(registro.ClaveIdentidad__c)) {
                registro.addError('La pareja contrato y vencimiento ya está representada por un seguimiento anterior.');
            }
        }
    }
}
