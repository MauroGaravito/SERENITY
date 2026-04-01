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

### Ordenes sembradas

- `SR-2401`: Morning personal care support
  - Centro: `Harbour View Care`
  - Recipient: `Maria Thompson`
  - Estado inicial: `partially_assigned`
  - Prioridad: `high`
- `SR-2402`: Community transport and appointment escort
  - Centro: `Evergreen Support Services`
  - Recipient: `George Hill`
  - Estado inicial: `active`
  - Prioridad: `medium`
- `SR-2403`: Overnight respite coverage
  - Centro: `BlueWattle Homecare`
  - Recipient: `Elaine Cooper`
  - Estado inicial: `open`
  - Prioridad: `critical`

### Visits sembradas

- `SR-2401`
  - una visita `approved` asignada a `Liam Ortega`
  - una visita `scheduled` sin asignar
- `SR-2402`
  - una visita `under_review` asignada a `Emily Tran`
- `SR-2403`
  - una visita `scheduled` sin asignar

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
- Crear una nueva `service order`.
- Editar una orden existente.
- Agregar visitas a una orden.
- Asignar un cuidador elegible a una visita.
- Cambiar el estado operativo de una visita:
  - `confirmed`
  - `in_progress`
  - `completed`
  - `under_review`
- Ver incidentes, evidencia, checklist y auditoria.

### Que no puede hacer hoy

- No puede aprobar o rechazar una visita.
- No tiene una vista separada de cierre financiero.
- No tiene un modulo dedicado de incident creation desde UI.

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
  - skills requeridos: `Manual handling`, `Personal care`, `Medication prompt`
  - una visita aprobada con `Liam Ortega`
  - una visita futura sin asignar
- En `Eligible carers` deberias ver opciones coherentes como:
  - `Sofia Bennett`
  - `Liam Ortega`
  - `Anika Perera`
- En `Visit control` puedes seleccionar la visita sin cobertura y asignarla.

#### Ejemplo 2: orden critica abierta

Usa `SR-2403`.

- Abre la orden `SR-2403`.
- Veras que esta `open` y con `critical risk`.
- El objetivo del coordinador es encontrar cobertura para overnight respite.
- En las notas aparece que ya hubo rechazos por duracion del turno.
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
- skills requeridos
- instrucciones
- notas de coordinacion

En el detalle de la orden puedes:

- editar configuracion operativa
- agregar una visita adicional

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
  - nota indicando que la clinica retraso el handoff
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
- required skills
- care instructions
- provider handoff note

## Perfil: Carer

### Usuario demo

- Nombre sembrado: `Liam Ortega`
- Email: `liam@serenity.local`
- Ruta principal: `/carers`

### Estado actual del producto

La superficie del cuidador todavia no es operativa.

Hoy `/carers` funciona como una pagina de direccion de producto y no como una agenda ejecutable.

### Que puede ver hoy

- la propuesta de valor para cuidador independiente
- los bloques conceptuales:
  - agenda del dia
  - checklist y evidencia
  - alertas de credenciales
  - historial de ingresos
  - gastos y kilometraje
  - disponibilidad

### Que no puede hacer todavia

- no puede ver visitas reales desde UI
- no puede cargar evidencia desde UI
- no puede reportar incidencias desde UI
- no puede gestionar kilometraje desde UI

### Datos sembrados relevantes para futuro

Aunque la UI del carer aun no esta hecha, la semilla ya contiene base real:

- `Liam Ortega`
  - rating `4.7`
  - disponibilidad `Available Mon-Fri mornings`
  - credenciales `Manual handling`, `Personal care`, `Medication prompt`
- `Emily Tran`
  - rating `4.8`
  - skills de movilidad y licencia
- `Grace Walker` y `Daniel Kim`
  - orientados a `Overnight care`

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
