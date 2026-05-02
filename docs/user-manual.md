# Manual de Usuario

## Alcance

Este manual describe la app tal como existe hoy y usa como referencia la semilla actual definida en [prisma/seed.mjs](C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/prisma/seed.mjs).

Todo lo que aparece aqui corresponde al estado demo sembrado para abril de 2026.

La semilla tiene dos perfiles:

- `colombia`: perfil local por defecto para desarrollo y aprendizaje, con nombres familiares y sedes en Bello, Antioquia.
- `australia`: perfil original para demos externas o entornos donde se quiera conservar la narrativa australiana.

Comandos:

- `npm run db:seed` usa `colombia`.
- `npm run db:seed:colombia` fuerza Colombia.
- `npm run db:seed:australia` fuerza Australia.

## Credenciales demo

- Password compartido: `SerenityDemo!2026`

### Perfil Colombia

- Serenity admin: `admin@serenity.local`
- Provider coordinator: `mauricio@serenity.local`
- Provider reviewer: `diana@serenity.local`
- Center manager Niquia: `laura@serenity.local`
- Carer demo principal: `gabriel@serenity.local`

### Perfil Australia

- Provider coordinator: `coordination@serenity.local`
- Provider reviewer: `review@serenity.local`
- Harbour View center manager: `harbour.manager@serenity.local`
- Evergreen center manager: `evergreen.manager@serenity.local`
- BlueWattle center manager: `bluewattle.manager@serenity.local`
- Carer demo principal: `liam@serenity.local`

## Datos demo sembrados

### Perfil Colombia por defecto

- Prestadora: `Serenity Homecare Antioquia`
- Centros:
  - `Centro de Cuidado Niquia`
- Facilities:
  - `Sede Niquia` en Niquia
- Recipients:
  - `Rosalba`
- Carers:
  - `Alvaro Ramirez`
  - `Gabriel Ramirez`
  - `Gloria Palacio`
- Ordenes iniciales: ninguna.
- Visitas iniciales: ninguna.
- Closing/export/audit inicial: vacio.
- Gabriel tiene disponibilidad para cubrir la primera solicitud Niquia/Rosalba cuando Laura cree `SR-2401`.

### Perfil Australia

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

El perfil Colombia no trae ordenes iniciales. Las siguientes ordenes pertenecen al perfil Australia.

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
- `Serenity admin` entra a `/admin`.
- `Provider coordinator` y `Provider reviewer` entran a `/providers`.
- `Center manager` entra a `/centers`.
- `Carer` entra a `/carers`.
- Un `center manager` solo ve ordenes de su propio centro.
- Un usuario provider solo opera ordenes de su propia prestadora.
- Solo `Provider reviewer` puede aprobar o rechazar visitas.

## Perfil: Serenity admin

### Usuario demo

- Colombia: `Serenity Admin` / `admin@serenity.local`
- Ruta principal: `/admin`

### Que puede hacer hoy

- Ver si la red operativa esta lista antes de crear demanda.
- Crear centros cliente y su primera sede.
- Crear el usuario contacto del centro.
- Crear pacientes dentro de una sede.
- Crear carers vinculados a Serenity.
- Diferenciar carers `Independent` y `Employee`.
- Gobernar estado activo, relacion con la prestadora y credenciales del carer.
- Ver contacto, disponibilidad, credenciales y bloques de disponibilidad del care team.
- Revisar el catalogo de servicios y el checklist esperado por tipo de servicio.

### Que no resuelve todavia

- No diferencia carers permanentes vs casuals; eso queda como politica futura de contrato/roster.
- No edita tarifas ni contratos.
- No tiene constructor visual completo de workflows; por ahora muestra el catalogo sembrado.

### Recorrido recomendado Colombia

1. Entrar con `admin@serenity.local`.
2. Revisar `/admin`: debe mostrar Niquia, Rosalba y 3 carers.
3. Abrir `/admin/clients`: confirmar `Centro de Cuidado Niquia`, `Sede Niquia`, Laura como contacto y Rosalba como patient.
4. Abrir `/admin/care-team`: confirmar que los carers pertenecen a Serenity y tienen datos de contacto.
5. Abrir `/admin/workflows`: revisar los tipos de servicio disponibles antes de que Mauricio cree la primera solicitud.

## Perfil: Provider coordinator

### Usuarios demo

- Colombia: `Mauricio Garavito` / `mauricio@serenity.local`
- Australia: `Alex Morgan` / `coordination@serenity.local`
- Ruta principal: `/providers`

### Que puede hacer hoy

- Ver el panorama operativo de la prestadora.
- Saltar a ordenes filtradas por estado, riesgo o prioridad.
- Ver la cola de ordenes que requieren accion inmediata.
- Crear una nueva `service order` desde un modal en `/providers/orders`.
- Ver periodos de cierre operativo en `/providers/closing`.
- Ver visitas aprobadas listas para settlement.
- Ver que visitas quedan excluidas del settlement y que paso operativo falta.
- Preparar exportacion externa en `/providers/export`.
- Consultar eventos criticos en `/providers/audit`.
- Registrar minutos aprobados, billable y payable por visita.
- Registrar gastos o kilometraje basicos para visitas aprobadas.
- Mover un periodo entre `open`, `locked` y `exported`.
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

### Recorrido recomendado en Colombia

Colombia arranca sin ordenes para validar el flujo desde cero.

1. Entrar a `/centers` con `laura@serenity.local`.
2. Confirmar que Laura ve Centro de Cuidado Niquia, Sede Niquia y Rosalba.
3. Ir a `/centers/orders`.
4. Crear la primera solicitud para Rosalba usando los datos configurados.
5. Confirmar que Laura aterriza en el detalle de la orden creada.
6. Entrar a `/providers` con `mauricio@serenity.local`.
7. Confirmar que la solicitud aparece como demanda entrante en `/providers/orders`.
8. Continuar a agenda, cobertura y asignacion desde provider operations.

Despues de SER-30, el punto de partida esperado para continuar la demo es:

- Orden: `SR-2401`
- Centro: `Centro de Cuidado Niquia`
- Sede: `Sede Niquia`
- Recipient: `Rosalba`
- Estado inicial provider: solicitud abierta con una visita `scheduled` sin carer asignado.
- Siguiente usuario: `mauricio@serenity.local`, para coordinar cobertura.

Despues de SER-31, el flujo esperado queda asi:

1. Mauricio asigna Gabriel a la visita inicial.
2. Gabriel pasa la visita por `in_progress` y `completed`.
3. Gabriel completa checklist, agrega evidencia y puede registrar una incidencia.
4. Gabriel envia la visita a `under_review`.
5. Diana aprueba el care record.
6. La visita queda `approved` y aparece en closing dentro de un periodo `open`.

### Recorrido recomendado en Australia

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
- Las razones de disponibilidad distinguen bloque laboral completo, disponibilidad parcial, bloque no disponible y asignaciones solapadas.
- La asignacion tambien se valida en servidor contra disponibilidad, skills vigentes y lenguaje.
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

En `/providers/orders` puedes crear una orden nueva desde el boton `New order`. El formulario abre en modal para que la lista de ordenes siga siendo visible y no obligue al usuario a bajar por toda la pantalla.

El formulario esta organizado por secciones para reducir errores:

- detalles de demanda,
- agenda inicial,
- requisitos de elegibilidad,
- instrucciones para campo,
- notas internas provider.

Cuando la orden se crea correctamente, Serenity abre el detalle de la orden para continuar con cobertura, asignacion y control de visitas.

Campos disponibles:

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

Validaciones actuales:

- al menos un skill requerido,
- fecha de fin posterior a fecha de inicio,
- duracion planificada positiva,
- duracion planificada menor o igual a la ventana programada,
- sede y recipient deben pertenecer al centro seleccionado.

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

En Colombia zero-start, `/providers/closing` empieza vacio. Aparece un periodo `open` solo despues de que Diana aprueba una visita real.

En `/providers/export` puedes:

- encolar un `sync job` hacia un target externo mock, manual o `xero_custom_connection`
- procesar la entrega del job
- correr la cola de jobs pendientes por lote
- chequear jobs `sent` sin resolver uno por uno
- registrar `acknowledged` o `rejected` cuando el sistema externo responde
- reintentar un `sync job` fallido
- marcar un periodo como `exported`
- descargar el export package en `json`
- descargar el export package en `csv`

En Colombia zero-start, `/providers/export` no muestra paquete si no existe un periodo `locked`. Si solo existe un periodo `open`, el siguiente paso sigue siendo closing.

En `/providers/audit` puedes:

- ver eventos criticos recientes
- confirmar quien cambio una orden, visita, cierre o exportacion
- explicar la historia operativa sin mezclarla con el trabajo diario

En Colombia zero-start, `/providers/audit` empieza vacio y se vuelve util cuando review, settlement, lock/export o sync jobs registran eventos del periodo.

## Perfil: Provider reviewer

### Usuario demo

- Colombia: `Diana Chaverra` / `diana@serenity.local`
- Australia: `Diana Cole` / `review@serenity.local`
- Ruta principal: `/providers`

### Que puede hacer hoy

- Todo lo que ve el provider en el dashboard de operaciones.
- Revisar visitas que quedaron en `under_review`.
- Aprobar o rechazar visitas.
- Consultar el `audit trail` por orden.

### Recorrido recomendado en Colombia zero-start

1. Laura crea `SR-2401` desde `/centers/orders`.
2. Mauricio asigna una visita a Gabriel desde `/providers/orders`.
3. Gabriel ejecuta, completa checklist, agrega evidencia y envia a `under_review`.
4. Diana entra a `/providers/orders`, abre la orden real y aprueba o rechaza la visita.
5. Si aprueba, Serenity crea un closing period `open` para esa visita.

### Recorrido recomendado en Australia seeded demo

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

Regla actual:

- `Approve` solo se habilita si la visita tiene checklist completo y al menos una evidencia capturada.

### Caso ya resuelto en la semilla

`SR-2401` contiene una visita ya aprobada.

Eso sirve para mostrar:

- una review previa de `Diana Cole`
- evidencia completa
- checklist alineado
- settlement ya asociado al cierre `Apr 2026 - Week 1`

### Workspace de cierre

Tanto `Provider coordinator` como `Provider reviewer` pueden entrar a `/providers/closing`, `/providers/export` y `/providers/audit`.

La vista de `closing` muestra:

- periodos de cierre
- visitas aprobadas dentro del periodo
- approved minutes por visita
- billable y payable
- gastos asociados
- estado de exportacion del periodo
- visitas excluidas del settlement con motivo y siguiente paso

La vista de `external export` muestra:

- export batch id
- jobs de sync por periodo
- un estado visible unico por job
- referencia externa cuando la entrega fue aceptada
- historial de intentos por job
- siguiente intento programado cuando el job sigue en vuelo
- trazabilidad basica de descarga y sync

La vista de `audit trail` muestra eventos criticos recientes del flujo.

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

La base actual de `Xero` soporta:

- `sandbox`
- `auth_only`
- `direct_post`

Regla de acknowledgement actual para `xero_custom_connection`:

- `HTTP 2xx + externalReference estable = acknowledged`

La implementacion actual sigue siendo una capa de handoff:

- no ejecuta pagos
- solo confirma recepcion remota real cuando exista `direct_post` con credenciales y endpoint reales
- no sincroniza de vuelta desde payroll

## Perfil: Center manager

### Usuarios demo

- Colombia:
  - `laura@serenity.local` -> `Centro de Cuidado Niquia`
- Australia:
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
- Ver el carer asignado solo cuando pertenece a una visita de su centro.
- Mantener contexto de pacientes cuando la politica del producto lo habilite.

### Que no puede hacer hoy

- No puede asignar carers.
- No puede mover estados de visita.
- No puede aprobar o rechazar visitas.
- No puede editar operacion fina de la prestadora.
- No puede ver credenciales completas, disponibilidad global, rating interno ni razones internas de restriccion del pool de carers.
- No puede operar closing/export provider.
- No puede ver audit fuera de su centro.
- No puede crear sedes directamente en el MVP; puede solicitar una nueva sede en una extension futura.

### Ownership definido para SER-33

- El centro es dueño del contexto de demanda: paciente, sede, necesidad, restricciones y notas de servicio.
- Admin/provider governance mantiene datos legales, vinculo con la prestadora y setup estructural.
- Provider coordinator mantiene cobertura, asignacion, reemplazos y cambios operativos de visita.
- Center manager puede editar una solicitud solo mientras este en etapa temprana y sin cobertura/ejecucion iniciada.
- Cuando ya existe cobertura confirmada, los cambios del centro deben entrar como solicitud de cambio o nota para coordinacion.
- La aprobacion del care record pertenece a Diana como provider reviewer.

### Ejemplo Colombia

Usa `laura@serenity.local`.

Lo esperable es ver Niquia y Rosalba sin orden inicial. Las solicitudes apareceran despues de crearlas desde center o provider.

### Ejemplos Australia por centro

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

- Colombia: `Gabriel Ramirez` / `gabriel@serenity.local`
- Australia: `Liam Ortega` / `liam@serenity.local`
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
- estado de expiracion, impacto en matching y accion recomendada por credencial
- skills verificadas derivadas de credenciales validas
- readiness del perfil con impacto operativo
- senales separadas de readiness: positivas, atencion y bloqueos
- readiness de ejecucion por visita antes de enviar a review
- resumen superior con estado de readiness y siguiente accion de visita seleccionada
- readiness organizado por señales listas, atencion y bloqueos para demo

### Que no puede hacer todavia

- no puede gestionar kilometraje desde UI
- no tiene subida real de archivos
- no tiene alertas automaticas fuera de la UI
- no tiene cierre economico ni payroll
- no tiene app movil nativa

### Recorrido recomendado en la semilla

Usa `gabriel@serenity.local` en Colombia o `liam@serenity.local` en Australia.

- Entra a `/carers`.
- En Colombia zero-start no veras visitas asignadas hasta que Laura cree `SR-2401` y Mauricio asigne Gabriel.
- En Australia veras visitas ya sembradas para Liam.
- En la visita `confirmed` puedes recorrer:
  - `Start visit`
  - completar checklist
  - agregar evidencia
  - reportar una incidencia si quieres
  - `Complete visit`
  - `Submit for review`

Reglas actuales del carer:

- `Submit for review` requiere checklist completo cuando existe template.
- `Submit for review` requiere al menos una evidencia capturada.
- El bloque de readiness de ejecucion explica que falta antes de enviar la visita.

Relacion con Serenity:

- El carer pertenece operativamente a la prestadora, no al centro.
- En el MVP puede ser `Independent` o `Employee`.
- `Permanent` y `casual` no se modelan todavia; entrarian despues como politica contractual o de roster.
- El centro solo ve la identidad del carer cuando esta asignado a una visita dentro de su scope.

Readiness del perfil:

- `ready`: tiene skills verificadas y disponibilidad declarada.
- `attention_needed`: puede operar parcialmente, pero hay advertencias como credenciales pendientes, credenciales por vencer o falta de bloques de disponibilidad.
- `restricted`: existen bloqueos como credenciales vencidas o rechazadas que afectan matching.
- Una credencial `valid` con fecha ya vencida se trata como bloqueo operativo aunque el estado manual no se haya actualizado todavia.
- Una credencial que vence dentro de 45 dias mantiene matching, pero aparece como alerta para renovar antes de afectar continuidad.

Provider ve razones compatibles en el coverage pool, de modo que el cuidador y el coordinador leen la misma logica de elegibilidad desde superficies distintas.

### Datos sembrados relevantes

La semilla Colombia deja a Gabriel listo para validar el primer flujo Niquia/Rosalba:

- `Gabriel Ramirez`
  - rating `4.7`
  - disponibilidad `Available Mon-Fri mornings`
  - disponibilidad especifica para la primera ventana de `SR-2401`
  - skills validas `Personal hygiene support`, `Manual handling`, `Medication prompt`, `Meal preparation`
  - credencial valida adicional `NDIS Worker Screening`
  - credencial `pending` `First Aid Certificate`
  - credencial `expired` `Police Check`
  - readiness restringida por credencial expirada, pero elegible para `SR-2401` porque las skills requeridas estan vigentes

La semilla Australia deja visible tanto ejecucion como perfil operativo del carer:

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
