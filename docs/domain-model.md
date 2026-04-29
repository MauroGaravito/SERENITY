# Domain Model

Este modelo implementa el operating model definido en [operating-model.md](./operating-model.md).

## Unidad central

La unidad central del sistema es la **prestacion verificable**.

Antes de que exista una prestacion, el sistema necesita una **red operativa configurada**. Esa red responde preguntas basicas:

- que prestadora opera,
- que centros son clientes de esa prestadora,
- que sedes y pacientes pertenecen a cada centro,
- que carers puede coordinar la prestadora,
- que servicios y checklists se pueden solicitar.

En datos, la prestacion verificable se materializa en:

- `ServiceOrder`: define la necesidad y las condiciones.
- `Visit`: materializa cada instancia ejecutable.
- `Review`: valida si la visita entra o no al cierre.

## Entidades principales

### Organizaciones

- `Organization`: centro o prestadora.
- `ProviderClient`: relacion explicita entre una prestadora y un centro cliente.
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

1. Una prestadora puede tener muchos centros cliente mediante `ProviderClient`.
2. Un centro puede tener una o muchas sedes (`Facility`).
3. Un paciente (`CareRecipient`) pertenece a una sede.
4. Un carer pertenece a la prestadora mediante `Carer.providerId`.
5. Un carer puede ser `EMPLOYEE` o `INDEPENDENT`; la app todavia no diferencia permanente/casual.
6. Una orden solo debe crearse para un centro cliente de la prestadora.
7. Una orden pertenece a un centro, una sede, un paciente y una prestadora.
8. Una orden genera una o muchas visitas.
9. Una visita puede tener cero o un cuidador asignado.
10. Una visita puede tener muchas evidencias, incidencias y revisiones historicas.
11. Solo visitas aprobadas deben llegar a `VisitSettlement`.

## Roles de producto

- `PLATFORM_ADMIN`: configura la red operativa de la prestadora: clientes, sedes, pacientes, carers y workflows.
- `PROVIDER_COORDINATOR`: opera la demanda diaria: solicitudes, agenda, cobertura, reemplazos y notas.
- `PROVIDER_REVIEWER`: revisa care records, evidencia e incidencias antes de aprobar cierre.
- `CENTER_MANAGER`: representa al centro cliente y da contexto sobre sus pacientes y solicitudes.
- `CARER`: mantiene disponibilidad/credenciales y ejecuta visitas con care record.

## Propiedad conceptual

- Admin owns setup.
- Coordinator owns coverage.
- Carer owns execution record.
- Reviewer owns approval.
- Center Manager owns center-side context.
- System owns audit events.

## Observaciones

- La autenticacion basica por roles existe en la demo; aun no es un sistema empresarial completo de IAM.
- La facturacion no se modela completa en esta fase.
- Los formularios clinicos avanzados quedan fuera del alcance actual.
