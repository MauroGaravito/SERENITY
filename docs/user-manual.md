# Manual de Usuario

## Alcance

Este manual describe la app tal como existe hoy y usa como referencia la semilla actual definida en [prisma/seed.mjs](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/prisma/seed.mjs).

Todo lo que aparece aqui corresponde al estado demo sembrado para abril de 2026.

## Credenciales demo

- Password compartido: `SerenityDemo!2026`
- Provider coordinator: `coordination@serenity.local`
- Provider reviewer: `review@serenity.local`
- Harbour View center manager: `harbour.manager@serenity.local`
- Evergreen center manager: `evergreen.manager@serenity.local`
- BlueWattle center manager: `bluewattle.manager@serenity.local`
- Carer demo: `liam@serenity.local`

## Datos demo sembrados

### Organizaciones

- Prestadora: `Serenity Care Partners`
- Centros:
  - `Harbour View Care`
  - `Evergreen Support Services`
  - `BlueWattle Homecare`

### Facilities

- `Bondi Homecare North` en Bondi
- `Inner West Community` en Leichhardt
- `South Sydney Outreach` en Alexandria

### Recipients

- `Maria Thompson` (`HV-1001`)
- `George Hill` (`EV-1002`)
- `Elaine Cooper` (`BW-1003`)

### Catalogos cerrados actuales

La demo actual ya usa catalogos cerrados para `service types` y `skills`.

#### Service types

- `Domestic Assistance`
- `Community Access`
- `Personal Care`
- `Companionship`

#### Skills

- `Domestic cleaning`
- `Meal preparation`
- `Transport escort`
- `Community participation`
- `Personal hygiene support`
- `Manual handling`
- `Medication prompt`
- `Social engagement`

### Ordenes sembradas

- `SR-2401`: Morning personal care support
  - Centro: `Harbour View Care`
  - Recipient: `Maria Thompson`
  - Service type: `Personal Care`
  - Estado inicial: `partially_assigned`
  - Prioridad: `high`
- `SR-2402`: Community access and shopping support
  - Centro: `Evergreen Support Services`
  - Recipient: `George Hill`
  - Service type: `Community Access`
  - Estado inicial: `active`
  - Prioridad: `medium`
- `SR-2403`: Evening companionship coverage
  - Centro: `BlueWattle Homecare`
  - Recipient: `Elaine Cooper`
  - Service type: `Companionship`
  - Estado inicial: `open`
  - Prioridad: `critical`

### Visits sembradas

- `SR-2401`
  - una visita `approved` asignada a `Liam Ortega`
  - una visita `confirmed` asignada a `Liam Ortega`
  - una visita `scheduled` sin asignar
  - una visita `cancelled` para demo de reemplazo
- `SR-2402`
  - una visita `under_review` asignada a `Emily Tran`
- `SR-2403`
  - una visita `scheduled` sin asignar
  - una visita `no_show` para demo de cobertura rota

## Reglas de acceso actuales

- El login redirige segun rol a una superficie distinta.
- `Provider coordinator` y `Provider reviewer` entran a `/providers`.
- `Center manager` entra a `/centers`.
- `Carer` entra a `/carers`.
- Un `center manager` solo ve ordenes de su propio centro.
- Un usuario provider solo opera ordenes de su propia prestadora.
- Solo `Provider reviewer` puede aprobar o rechazar visitas.

## Perfil: Provider coordinator

### Usuario demo

- Nombre sembrado: `Alex Morgan`
- Email: `coordination@serenity.local`
- Ruta principal: `/providers`

### Que puede hacer hoy

- Ver metricas operativas de la prestadora.
- Ver la cola de ordenes que requieren accion.
- Ver periodos de cierre operativo.
- Ver visitas aprobadas listas para settlement.
- Ver que visitas quedan excluidas del settlement y que paso operativo falta.
- Registrar minutos aprobados, billable y payable por visita.
- Registrar gastos o kilometraje basicos para visitas aprobadas.
- Mover un periodo entre `open`, `locked` y `exported`.
- Crear una nueva `service order`.
- Editar una orden existente.
- Agregar visitas a una orden.
- Asignar un cuidador elegible a una visita.
- Pedir reemplazo de una visita cuando la cobertura falla.
- Registrar escalamiento operativo en la orden.
- Cambiar el estado operativo de una visita:
  - `confirmed`
  - `in_progress`
  - `completed`
  - `under_review`
  - `cancelled`
  - `no_show`
- Ver incidentes, evidencia, checklist y auditoria.

### Que no puede hacer hoy

- No puede aprobar o rechazar una visita.
- No tiene un modulo dedicado de incident creation desde UI.
- No ejecuta payroll ni pagos.

### Recorrido recomendado en la semilla

#### Ejemplo 1: orden parcialmente cubierta

Usa `SR-2401`.

- Entra a `/providers`.
- Veras la orden `SR-2401` como necesidad operativa.
- Abre `/providers/orders`.
- Entra al detalle de `SR-2401`.
- Observa:
  - `Maria Thompson`
  - `Bondi Homecare North`
  - service type `Personal Care`
  - skills requeridos: `Personal hygiene support`, `Manual handling`, `Medication prompt`
  - una visita aprobada con `Liam Ortega`
  - una visita futura sin asignar
- En `Coverage pool` veras carers elegibles y carers restringidos con razones visibles.
- En `Visit control` puedes seleccionar la visita sin cobertura y asignarla.
- Tambien puedes pedir `Request replacement` y dejar una nota de escalamiento.

#### Ejemplo 2: orden critica abierta

Usa `SR-2403`.

- Abre la orden `SR-2403`.
- Veras que esta `open` y con `critical risk`.
- El objetivo del coordinador es encontrar cobertura para acompanamiento de tarde.
- En las notas aparece que ya hubo rechazos por duracion del bloque.
- La accion esperada es asignar un carer elegible y mover la visita a `confirmed`.

### Formularios disponibles

En `/providers/orders` puedes crear una orden nueva con estos campos:

- centro
- facility
- recipient
- tipo de servicio
- titulo
- prioridad
- scheduled start
- scheduled end
- duracion planificada
- recurrencia
- idioma requerido
- skills requeridos desde catalogo cerrado
- instrucciones
- notas de coordinacion

En el detalle de la orden puedes:

- editar configuracion operativa
- agregar una visita adicional

En `/providers/closing` puedes:

- ver periodos de cierre
- revisar visitas aprobadas por periodo
- revisar visitas excluidas del settlement con motivo y siguiente paso
- guardar settlement por visita
- registrar gastos basicos
- marcar un periodo como `locked`
- encolar un `sync job` hacia un target externo mock o manual
- procesar la entrega del job
- correr la cola de jobs pendientes por lote
- chequear jobs `sent` sin resolver uno por uno
- registrar `acknowledged` o `rejected` cuando el sistema externo responde
- reintentar un `sync job` fallido
- marcar un periodo como `exported`
- descargar el export package en `json`
- descargar el export package en `csv`

## Perfil: Provider reviewer

### Usuario demo

- Nombre sembrado: `Diana Cole`
- Email: `review@serenity.local`
- Ruta principal: `/providers`

### Que puede hacer hoy

- Todo lo que ve el provider en el dashboard de operaciones.
- Revisar visitas que quedaron en `under_review`.
- Aprobar o rechazar visitas.
- Consultar el `audit trail` por orden.

### Recorrido recomendado en la semilla

#### Ejemplo principal: visita en revision

Usa `SR-2402`.

- Entra a `/providers/orders`.
- Abre `SR-2402`.
- Veras una visita asignada a `Emily Tran` con estado `under_review`.
- La visita ya tiene:
  - checklist completo
  - evidencia capturada
  - un incidente `Delay`
  - nota indicando que la salida de compras se extendio por colas
- Desde `Review outcome` puedes:
  - `Approve`
  - `Reject`

### Caso ya resuelto en la semilla

`SR-2401` contiene una visita ya aprobada.

Eso sirve para mostrar:

- una review previa de `Diana Cole`
- evidencia completa
- checklist alineado
- settlement ya asociado al cierre `Apr 2026 - Week 1`

### Workspace de cierre

Tanto `Provider coordinator` como `Provider reviewer` pueden entrar a `/providers/closing`.

La vista actual muestra:

- periodos de cierre
- visitas aprobadas dentro del periodo
- approved minutes por visita
- billable y payable
- gastos asociados
- estado de exportacion del periodo
- export batch id
- jobs de sync por periodo
- un estado visible unico por job
- referencia externa cuando la entrega fue aceptada
- historial de intentos por job
- siguiente intento programado cuando el job sigue en vuelo
- trazabilidad basica de descarga y sync

Regla clave actual:

- un periodo `open` todavia se puede editar
- un periodo `locked` equivale a `ready for export`
- un periodo `locked` puede correr sync jobs externos
- un periodo `exported` exige al menos un sync job `acknowledged`
- un periodo `exported` ya fue marcado como entregado a un sistema externo

### Export package actual

Cuando el periodo ya esta `locked` o `exported`, Serenity permite descargar:

- un paquete `json` canonico
- una vista `csv` derivada

El `json` es la referencia principal para integracion futura y contiene:

- provider
- closing period
- totals
- visits
- expenses

### Sync externo actual

Cuando el periodo ya esta `locked` o `exported`, Serenity tambien permite:

- crear un `export job`
- ver su estado visible (`queued`, `processing`, `sent`, `acknowledged`, `failed`)
- correr jobs encolados desde un runner manual por lote
- chequear estado remoto de jobs `sent`
- procesar entrega de un job encolado
- registrar confirmacion o rechazo remoto
- guardar numero de intentos
- guardar historial de intentos
- programar el siguiente chequeo con `nextAttemptAt`
- guardar referencia externa mock
- registrar error de conector para retry

La implementacion actual sigue siendo una capa de handoff:

- no ejecuta pagos
- no confirma recepcion remota real
- no sincroniza de vuelta desde payroll

## Perfil: Center manager

### Usuarios demo

- `harbour.manager@serenity.local` -> `Harbour View Care`
- `evergreen.manager@serenity.local` -> `Evergreen Support Services`
- `bluewattle.manager@serenity.local` -> `BlueWattle Homecare`

### Ruta principal

- `/centers`

### Que puede hacer hoy

- Ver metricas de demanda y cumplimiento para su centro.
- Crear una nueva solicitud de servicio.
- Ver todas las ordenes de su centro.
- Abrir el detalle de una orden.
- Ver cobertura, incidencias, evidencia y review desde el limite del centro.
- Ver la auditoria de la orden.

### Que no puede hacer hoy

- No puede asignar carers.
- No puede mover estados de visita.
- No puede aprobar o rechazar visitas.
- No puede editar operacion fina de la prestadora.

### Ejemplos por centro

#### Harbour View center manager

Usa `harbour.manager@serenity.local`.

Lo esperable es ver `SR-2401`.

En el detalle observaras:

- provider: `Serenity Care Partners`
- recipient: `Maria Thompson`
- una visita aprobada
- una visita pendiente de cobertura
- evidencia y review visibles

#### Evergreen center manager

Usa `evergreen.manager@serenity.local`.

Lo esperable es ver `SR-2402`.

En el detalle observaras:

- estado de la orden `active`
- visita `under_review`
- incidente de tipo `Delay`
- evidencia capturada
- aun sin decision final de review

#### BlueWattle center manager

Usa `bluewattle.manager@serenity.local`.

Lo esperable es ver `SR-2403`.

En el detalle observaras:

- orden `open`
- prioridad `critical`
- visita aun sin asignacion
- nota operacional de escalacion

### Formulario disponible

En `/centers/orders` puedes crear una solicitud nueva con:

- provider
- facility
- recipient
- service type
- title
- priority
- scheduled start
- scheduled end
- planned duration
- recurrence
- required language
- required skills desde catalogo cerrado
- care instructions
- provider handoff note

## Perfil: Carer

### Usuario demo

- Nombre sembrado: `Liam Ortega`
- Email: `liam@serenity.local`
- Ruta principal: `/carers`

### Estado actual del producto

La superficie del cuidador ya tiene una Fase 1 operativa mas una base inicial de Fase 2.

Hoy `/carers` ya funciona como workspace ejecutable para el carer.

### Que puede ver hoy

- agenda de visitas asignadas
- detalle de visita
- checklist editable
- evidencia basica
- reporte simple de incidencia
- readiness visible del perfil
- alertas visibles en UI
- limites operativos explicados en pantalla
- nota de disponibilidad editable
- bloques de disponibilidad
- credenciales con estado y vencimiento
- skills verificadas derivadas de credenciales validas

### Que no puede hacer todavia

- no puede gestionar kilometraje desde UI
- no tiene subida real de archivos
- no tiene alertas automaticas fuera de la UI
- no tiene cierre economico ni payroll
- no tiene app movil nativa

### Recorrido recomendado en la semilla

Usa `liam@serenity.local`.

- Entra a `/carers`.
- Veras:
  - una visita ya `approved`
  - una visita `confirmed` lista para iniciar
  - una visita futura sin asignar que no aparece en la agenda del carer
- En la visita `confirmed` puedes recorrer:
  - `Start visit`
  - completar checklist
  - agregar evidencia
  - reportar una incidencia si quieres
  - `Complete visit`
  - `Submit for review`

### Datos sembrados relevantes

La semilla actual ya deja visible tanto ejecucion como perfil operativo del carer:

- `Liam Ortega`
  - rating `4.7`
  - disponibilidad `Available Mon-Fri mornings`
  - skills validas `Personal hygiene support`, `Manual handling`, `Medication prompt`, `Meal preparation`
  - credencial valida adicional `NDIS Worker Screening`
  - credencial `pending` `First Aid Certificate`
  - credencial `expired` `Police Check`
  - readiness restringida por credencial expirada
- `Emily Tran`
  - rating `4.8`
  - skills de `Transport escort`, `Community participation`, `Social engagement`
- `Grace Walker` y `Daniel Kim`
  - orientados a `Companionship`

## Auditoria y trazabilidad

Tanto provider como center pueden ver la linea de auditoria por orden.

Eventos sembrados en la demo:

- `ORDER_CREATED`
- `ORDER_UPDATED`
- `VISIT_CREATED`
- `VISIT_ASSIGNED`
- `VISIT_STATUS_CHANGED`
- `VISIT_REVIEWED`

Ejemplos visibles:

- `SR-2401` ya muestra creacion, asignacion y revision aprobada
- `SR-2402` muestra cambio a `under_review`
- `SR-2403` muestra creacion de una solicitud critica esperando cobertura

## Notas para demos

- La app usa datos demo y puede ser modificada por cualquier usuario que conozca las credenciales.
- Si reseedeas la base, este manual sigue siendo valido mientras no cambie [prisma/seed.mjs](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/prisma/seed.mjs).
- La UI renderiza fechas segun el navegador usando formato `en-AU`; las horas pueden verse distintas si el navegador no esta en `Australia/Sydney`.
