# Dev Log

Registro breve de decisiones y entregas relevantes. No reemplaza Plane; sirve como memoria tecnica y de producto dentro del repo.

## 2026-04-27 - SER-7 Strengthen availability and restriction logic

Objetivo:

- Reducir asignaciones con conflictos de disponibilidad.
- Hacer visibles las razones de restriccion en provider matching.
- Alinear disponibilidad declarada, readiness y validacion server-side.

Resultado:

- Se agrego una evaluacion compartida de disponibilidad por visita.
- Matching ahora distingue `available`, `partial`, `unavailable`, `conflict` y `unknown`.
- Provider coverage pool muestra resumen de disponibilidad junto con readiness.
- Matching bloquea bloques no disponibles, disponibilidad parcial, ausencia de working block que cubra la visita y asignaciones solapadas.
- La accion server-side de asignacion revalida disponibilidad, solapes, skills vigentes para la ventana y lenguaje antes de confirmar.
- Carer readiness ahora muestra que unavailable blocks y active assignments son usados por matching.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`

Pruebas manuales pendientes para la etapa QA:

- Reseed Colombia con `npm run db:seed:colombia`.
- Entrar como provider coordinator y abrir una orden con coverage pool.
- Confirmar que carers elegibles muestran disponibilidad y readiness.
- Crear o ajustar un unavailable block que se solape con una visita y confirmar restriccion.
- Crear o ajustar un working block parcial y confirmar que no permite asignar.
- Confirmar que un carer con otra visita solapada queda restringido.
- Intentar asignar un carer restringido y confirmar que el server action devuelve error claro.
- Entrar como carer y confirmar que readiness muestra unavailable blocks y active assignments como señales operativas.

## 2026-04-27 - SER-6 Improve credential expiry alerts

Objetivo:

- Hacer que vencimientos de credenciales sean mas accionables para el carer.
- Evitar que provider matching trate credenciales vencidas por fecha como skills validas.
- Mantener continuidad entre readiness del carer y razones de elegibilidad provider.

Resultado:

- Las credenciales ahora exponen `expiryState`, resumen de vencimiento, impacto en matching y accion recomendada.
- El workspace del carer muestra tarjetas diferenciadas para credenciales vencidas, rechazadas, pendientes o proximas a vencer.
- La metrica de alertas de credenciales separa vencidas y proximas a vencer dentro de 45 dias.
- Readiness deja de contar como verified skill una credencial `valid` con `expiresAt` vencido.
- Provider matching deja de contar credenciales que vencen antes de la ventana de visita y muestra razones de restriccion alineadas.
- Carers con credenciales proximas a vencer quedan como `attention_needed`; credenciales vencidas o rechazadas quedan como `restricted`.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`

Pruebas manuales pendientes para cerrar en Plane:

- Reseed Colombia con `npm run db:seed:colombia`.
- Entrar como carer demo a `/carers`.
- Confirmar que la metrica `Credential alerts` separa vencidas y proximas a vencer.
- Confirmar que cada credential card muestra estado, fecha, countdown, impacto en matching y accion recomendada.
- Editar una credencial `valid` para poner `expiresAt` en el pasado y confirmar que pasa a bloqueo operativo.
- Editar una credencial para vencer dentro de 45 dias y confirmar que aparece como warning sin bloquear matching.
- Entrar como provider coordinator y abrir una orden con coverage pool.
- Confirmar que una credencial vencida por fecha no cuenta como skill valida para asignacion.
- Confirmar que las razones de restricted/attention carers coinciden con el workspace del carer.

## 2026-04-27 - SER-5 Refine carer readiness model and UI

Objetivo:

- Hacer que readiness del carer explique impacto operativo, no solo un estado.
- Separar señales positivas, advertencias y bloqueos.
- Alinear lo que ve el carer con lo que provider usa en matching.

Resultado:

- Readiness ahora produce un resumen estructurado con `ready`, `attention_needed` o `restricted`.
- El resumen incluye headline, impacto operativo, señales positivas, señales que requieren atencion y bloqueos.
- El workspace del carer muestra señales escaneables para verified skills, availability, pending/expiring credentials y blocking credentials.
- Provider matching ahora muestra `readinessStatus` y `readinessSummary` por carer en opciones elegibles y restringidas.
- El panel de readiness del carer incluye mini resumen de verified skills, working blocks y blockers.
- Alertas del carer se alimentan desde las mismas señales de readiness para reducir inconsistencias.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`

Pruebas manuales pendientes para cerrar en Plane:

- Reseed Colombia con `npm run db:seed:colombia`.
- Entrar como `gabriel@serenity.local` a `/carers`.
- Confirmar que el panel `Profile readiness` muestra headline, impacto operativo y señales separadas.
- Confirmar que credenciales `expired`, `pending` y `valid` se reflejan correctamente en blockers, attention y positive signals.
- Confirmar que la falta de working availability blocks aparece como attention signal cuando aplique.
- Entrar como provider coordinator y abrir una orden con coverage pool.
- Confirmar que carer options muestran readiness summary junto a rating.
- Confirmar que restricted carers muestran readiness status, readiness summary y razones de inelegibilidad.
- Validar que la narrativa de readiness del carer coincide con las razones visibles desde provider matching.

## 2026-04-26 - SER-4 Validate checklist, evidence, and incident narrative across roles

Objetivo:

- Hacer mas clara la historia de ejecucion de una visita entre carer, provider y center.
- Dar al carer señales visibles sobre que falta antes de enviar a review.
- Dar al provider reviewer contexto suficiente para aprobar o rechazar.
- Dar al center una narrativa legible sin controles operativos internos.

Resultado:

- El modelo compartido de visitas ahora transporta checklist items, evidence items e incidents completos, no solo contadores.
- Provider y center muestran checklist, evidence e incidents como narrativa de ejecucion por visita.
- Carer workspace muestra readiness de ejecucion antes de `Submit for review`.
- `Submit for review` queda bloqueado si falta completar checklist o capturar al menos una evidencia.
- `Approve` en provider reviewer queda bloqueado si falta checklist completo o evidencia.
- Incidents muestran severidad, categoria, resumen, fecha y estado abierto/resuelto cuando existe.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`

Pruebas manuales pendientes para cerrar en Plane:

- Reseed Colombia con `npm run db:seed:colombia`.
- Entrar como `gabriel@serenity.local` a `/carers`.
- Abrir la visita `confirmed` y verificar que el bloque de execution readiness muestre checklist/evidence/incidents.
- Intentar enviar a review sin evidencia o checklist completo y confirmar que queda bloqueado.
- Completar checklist, agregar evidencia, reportar un incidente opcional y enviar a review.
- Entrar como `diana@serenity.local`, abrir la orden con visita en review y confirmar que ve checklist, evidence e incidents antes de aprobar/rechazar.
- Confirmar que `Approve` queda bloqueado si se manipula una visita sin checklist completo o evidencia.
- Entrar como center manager y confirmar que el center ve la narrativa de ejecucion sin controles provider-only.
- Revisar que audit trail siga mostrando eventos relevantes del flujo.

## 2026-04-26 - Improve service order creation and editing UX

Objetivo:

- Reducir friccion al crear y editar demanda provider.
- Separar detalles de demanda, agenda, requisitos, instrucciones e internos.
- Evitar ordenes incompletas o con ventanas operativas invalidas.

Resultado:

- Formulario de nueva orden reorganizado por secciones con resumen lateral.
- Creacion redirige al detalle de la orden para continuar cobertura y asignacion.
- Edicion permite ajustar ventana operativa, duracion, recurrencia, requisitos y notas con la misma estructura conceptual.
- Validacion server-side reforzada para fechas validas, fin posterior al inicio, duracion positiva, duracion dentro de la ventana y skills requeridas.
- Cuando una orden existente tiene una visita `scheduled` sin asignar, la edicion de ventana actualiza esa visita para mantener continuidad con coverage management.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`

Pruebas manuales pendientes para cerrar en Plane:

- Reseed Colombia con `npm run db:seed:colombia`.
- Entrar como `mauricio@serenity.local` a `/providers/orders`.
- Abrir `New order` y confirmar que el formulario separa claramente demanda, agenda, requisitos, instrucciones e internos.
- Crear una orden valida y confirmar que redirige al detalle de la nueva orden.
- Confirmar que la orden creada muestra una visita inicial `scheduled` lista para assignment/coverage.
- Intentar guardar una orden sin skills y confirmar bloqueo esperado.
- Intentar una ventana invalida donde `scheduledEnd <= scheduledStart` y confirmar bloqueo esperado.
- Intentar una duracion mayor que la ventana y confirmar bloqueo esperado.
- Editar una orden existente y confirmar que prioridad, duracion, recurrencia, skills, instrucciones y notas persisten.
- En una orden con visita `scheduled` sin asignar, editar la ventana y confirmar que la visita pendiente queda alineada con el nuevo horario.
- Revisar responsive basico del modal en desktop y viewport movil.

Lectura de backlog al cierre:

- SER-3 queda listo para pasar de `In Progress` a `Test Pending`.
- SER-4 sigue siendo el siguiente cierre natural dentro de `00-Operations Core`: validar checklist, evidence e incident narrative across roles.
- SER-5 a SER-8 agrupan la capa `01-Carer Reliability`; conviene tratarlas como el siguiente bloque si se quiere avanzar hacia el carer como operador confiable.
- SER-9 a SER-12 cubren `02-Network Control`; dependen de que las ordenes y visitas ya sean claras para operar coverage/replacement.
- SER-13 a SER-16 pertenecen a `03-Operational Closure`; tienen sentido despues de estabilizar operaciones core y network control.
- SER-17, SER-18, SER-20 y SER-21 mantienen el bloque de external finance y sync.
- SER-22 aparece como `Done` pero con `Test Pending`; conviene no perderlo como gate de demo end-to-end.
- SER-26 es discovery transversal de claridad UI; puede alimentarse de los hallazgos de SER-3 y SER-4.

## 2026-04-25 - SER-1 Provider demo flow stabilization

Objetivo:

- Hacer mas claro el flujo provider.
- Reducir transiciones confusas.
- Mejorar la narrativa demo end-to-end.

Resultado:

- Dashboard provider simplificado como panorama operativo.
- Orders reorganizado con formulario de nueva orden en modal.
- Closing enfocado en cierre operativo.
- External export separado para handoff externo y sync jobs.
- Audit trail separado para trazabilidad.
- Seed local Colombia y seed Australia parametrizados.
- Documento de QA creado para validar la demo local.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`
- `npm run db:seed:colombia`
- `npm run db:seed:australia`

## 2026-04-25 - SER-2 Harden visit state transitions

Objetivo:

- Evitar que una visita pueda saltar a estados incoherentes.
- Alinear la UI con reglas reales de transicion.
- Proteger la demo contra clicks accidentales durante pruebas.

Resultado:

- Matriz central de transiciones en `src/lib/visit-state.ts`.
- Validacion server-side en acciones provider y carer.
- Botones de estado filtrados segun transiciones validas.
- Review restringida a visitas en `under_review`.
- Reemplazo bloqueado para visitas que ya entraron a ejecucion, review, aprobacion o rechazo.
- Matriz documentada en `docs/business-rules.md`.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`

Pendiente:

- Pruebas manuales en browser con seed Colombia antes de marcar cierre total de QA.
