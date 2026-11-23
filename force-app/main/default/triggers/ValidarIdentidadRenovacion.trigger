trigger ValidarIdentidadRenovacion on SeguimientoRenovacion__c (before insert) {
    IdentidadRenovacion.validarInsercion(Trigger.new);
}
