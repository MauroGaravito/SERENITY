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
4. Un carer pertenece a la prestadora mediante `Carer.providerId`; un centro no posee carers.
5. Un carer puede ser `EMPLOYEE` o `INDEPENDENT`; esto es suficiente para el MVP.
6. Permanente/casual no se modela todavia. Si se necesita, debe entrar despues como atributo de politica contractual o roster, no como reemplazo de `CarerKind`.
7. Una orden solo debe crearse para un centro cliente de la prestadora.
8. Una orden pertenece a un centro, una sede, un paciente y una prestadora.
9. Una orden genera una o muchas visitas.
10. Una visita puede tener cero o un cuidador asignado.
11. Una visita puede tener muchas evidencias, incidencias y revisiones historicas.
12. Solo visitas aprobadas deben llegar a `VisitSettlement`.

## SER-32: modelo de relacion del carer

La decision vigente es no agregar nuevas tablas ni enums para SER-32. El schema actual alcanza para el MVP:

- `Carer.providerId`: define que prestadora puede coordinar al carer.
- `Carer.ownerUserId`: define que usuario puede entrar al workspace del carer.
- `Carer.kind`: define si el carer es `EMPLOYEE` o `INDEPENDENT`.
- `Carer.isActive`: define si entra al pool operativo.
- `Credential`: define skills verificables y documentos.
- `AvailabilityBlock`: define disponibilidad y bloqueos.
- `Visit.assignedCarerId`: define asignacion puntual, no propiedad del centro.

Datos que Serenity necesita por tipo:

| Tipo | Datos MVP | Datos diferidos |
| --- | --- | --- |
| `INDEPENDENT` | provider, usuario owner, nombre, contacto, business/tax id cuando exista, disponibilidad, credenciales, estado activo | contrato, seguro, payout, tarifas, documentos legales ampliados |
| `EMPLOYEE` | provider, usuario owner, nombre, contacto, etiqueta employee, disponibilidad, credenciales, estado activo | payroll id, permanente/casual, reglas laborales, leave, HR onboarding |

Visibilidad:

- Coordinator ve carers activos de su prestadora, disponibilidad, readiness, credenciales relevantes, skills, idioma, carga activa y razones de restriccion.
- Admin ve y mantiene setup, tipo de relacion, estado activo y gobernanza de credenciales.
- Carer mantiene disponibilidad, evidencia de credenciales donde aplique y care records de sus visitas.
- Center manager solo ve el carer asignado y el care record dentro de visitas de su centro.

## SER-33: propiedad de datos del centro

La decision vigente es mantener el centro como dueño del contexto de demanda, no de la operacion provider.

Modelo actual suficiente para MVP:

- `Organization.kind = CENTER`: representa el centro cliente.
- `ProviderClient`: vincula el centro con la prestadora.
- `Facility.organizationId`: define las sedes del centro.
- `CareRecipient.facilityId`: define pacientes dentro de una sede.
- `ServiceOrder.centerId`: define que centro solicita o recibe el servicio.
- `ServiceOrder.providerId`: define que prestadora coordina cobertura.
- `Visit.assignedCarerId`: define asignacion puntual visible para el centro solo en su scope.
- `AuditEvent.organizationId`: permite eventos scopeados por organizacion.

Propiedad:

| Dato | Dueño MVP | Center manager |
| --- | --- | --- |
| Centro legal/provider link | Admin/provider governance | Lee |
| Contacto operativo del centro | Admin con posible self-maintenance | Lee y puede mantener cuando se habilite |
| Sede | Admin | Lee; puede solicitar nueva sede en flujo futuro |
| Patient/recipient | Admin o Center Manager por politica | Puede crear/editar dentro de su centro cuando se habilite |
| Service request | Center Manager o Coordinator | Crea y lee dentro de su centro |
| Request details | Center Manager antes de cobertura; Coordinator despues | Edita temprano; luego solicita cambios |
| Visit status/cobertura | Provider operations | Lee |
| Assigned carer identity | Provider operations | Lee solo si esta asignado a visita propia |
| Care record/evidence/incidents/review | Carer/Reviewer/Provider | Lee dentro de su centro |
| Closing/export provider | Provider operations | No ve |
| Audit | System | Lee solo eventos de sus ordenes/centro |

No se agrega schema para SER-33. Los flujos de aprobacion para sedes/pacientes y request changes pueden agregarse despues si la operacion lo exige.

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
