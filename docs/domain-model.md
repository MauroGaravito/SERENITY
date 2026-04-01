# Domain Model

## Unidad central

La unidad central del sistema es la **prestacion verificable**.

En datos, esa idea se materializa en:

- `ServiceOrder`: define la necesidad y las condiciones.
- `Visit`: materializa cada instancia ejecutable.
- `Review`: valida si la visita entra o no al cierre.

## Entidades principales

### Organizaciones

- `Organization`: centro o prestadora.
- `Facility`: sede o ubicacion operativa del centro.

### Workforce

- `User`: identidad de acceso.
- `Carer`: ejecutor operativo, independiente o empleado.
- `Credential`: habilitaciones del cuidador.
- `AvailabilityBlock`: disponibilidad o bloqueo horario.

### Demanda

- `CareRecipient`: receptor del servicio.
- `ServiceType`: catalogo de servicios.
- `ServiceOrder`: requerimiento contractual y operativo.

### Ejecucion

- `Visit`: turno o visita programada.
- `ChecklistTemplate`: plantilla por tipo de servicio.
- `VisitChecklistItem`: resultado real de la ejecucion.
- `Evidence`: archivos y pruebas de campo.
- `Incident`: eventos operativos relevantes.
- `Review`: aprobacion, observacion o rechazo.

### Cierre

- `Expense`: gastos o kilometraje asociados.
- `ClosingPeriod`: corte operativo y economico.
- `VisitSettlement`: relacion entre visita aprobada y cierre.

## Reglas de modelado

1. Una orden pertenece a un centro y a una prestadora.
2. Una orden genera una o muchas visitas.
3. Una visita puede tener cero o un cuidador asignado.
4. Una visita puede tener muchas evidencias, incidencias y revisiones historicas.
5. Solo visitas aprobadas deben llegar a `VisitSettlement`.

## Observaciones

- La autenticacion no esta implementada aun.
- La facturacion no se modela completa en esta fase.
- Los formularios clinicos avanzados quedan fuera del alcance actual.
