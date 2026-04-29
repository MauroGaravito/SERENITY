# Dev Log

Registro breve de decisiones y entregas relevantes. No reemplaza Plane; sirve como memoria tecnica y de producto dentro del repo.

## 2026-04-29 - Version 2 direction defined

Nota de cierre:

- Serenity queda versionada como `2.0.0`.
- La direccion del producto queda definida alrededor de un operating model admin-first.
- Plane fue reorganizado para continuar desde nuevos work items SER-27 a SER-36.
- Los modulos anteriores fueron removidos para evitar ruido y deuda conceptual.
- `SER-27` queda como contrato rector de roles, propiedad de datos y flujo de negocio.

Estado del producto:

- Admin configura la red: prestadora, centros cliente, sedes, contactos, pacientes, carers y workflows.
- Coordinator opera demanda, agenda, cobertura, asignaciones y reemplazos.
- Carer ejecuta visitas y produce el care record.
- Reviewer aprueba o rechaza care records.
- Closing/export/audit quedan despues de visitas reales aprobadas, no como datos sembrados que confunden el flujo.
- Colombia es el escenario canonico de cero inicio: Niquia, Rosalba, siete carers y cero ordenes.

Validacion final ejecutada:

- `npm run db:generate`
- `npm run db:push`
- `npm run db:seed:colombia`
- `npm run typecheck`
- `npm run build`

Resultado:

- Todas las validaciones pasaron.
- Persiste el warning conocido de Next por `<img>` en `src/components/carers/carer-workspace.tsx`.

Siguiente sesion recomendada:

- Cerrar/revisar `SER-27` contra [operating-model.md](./operating-model.md).
- Continuar con `SER-29 Validate Colombia zero-start scenario`.
- Despues avanzar `SER-28`, `SER-30` y `SER-31` para completar el primer flujo Niquia / Rosalba.

## 2026-04-29 - SER-27 operating model reset

Objetivo:

- Redefinir Serenity alrededor de un operating model admin-first.
- Separar configuracion maestra de operacion diaria.
- Clarificar que hace cada actor y que datos le pertenecen.

Resultado:

- Se creo [operating-model.md](./operating-model.md) como contrato canonico de SER-27.
- El modelo establece cinco actores: Admin, Provider Coordinator, Provider Reviewer, Center Manager y Carer.
- Se documento la matriz de propiedad para provider, center, site, patient, carer, service request, visit, care record, review, closing, export y audit.
- Se definio el happy path desde admin setup hasta external export.
- Se establecio que `EMPLOYEE` e `INDEPENDENT` son suficientes para el MVP hasta que SER-32 decida si `permanent` / `casual` entran al modelo.
- Se actualizo product direction, workflows, business rules, domain model, architecture y current demo QA para referenciar el operating model.

Decision:

- No separar backend/frontend todavia.
- Primero estabilizar boundaries de dominio dentro del monolito Next.

Validacion recomendada:

- Revisar SER-27 en Plane contra [operating-model.md](./operating-model.md).
- Marcar SER-26 como antecedente visual y continuar la ejecucion desde SER-27.

## 2026-04-28 - SER-26 UI hierarchy redesign checkpoint

Objetivo:

- Avanzar SER-26 como rediseño transversal de jerarquia visual, lenguaje operativo y claridad de UI.
- Mantener la logica backend estable mientras se mejora la experiencia frontend.
- Dejar un punto claro para continuar el 2026-04-29.

Resultado:

- Se introdujo una base compartida de layout con `AppShell` para alinear provider, center y carer bajo una estructura mas consistente.
- El workspace del carer fue reorganizado en secciones dedicadas: overview, availability, credentials y visit execution.
- Availability del carer ahora usa un planner visual mensual, seleccion de rangos por fecha, rangos de hora en incrementos de 30 minutos, prevencion de solapamientos y eliminacion de rangos.
- Credentials y visit execution quedaron mas separados para reducir scroll y fatiga visual.
- Visit execution cambio hacia una experiencia de registro/reporting mas clara: datos del cliente arriba, tareas de cuidado, evidencia visible, notas y excepciones.
- El detalle de orden provider fue simplificado para reducir columnas, quitar diagnosticos internos de matching de la vista principal y usar lenguaje de coordinador.
- En provider order detail se cambio el foco a `Service request`, `Visit schedule and coverage`, `Selected visit`, `Care record`, `Care coordination note` y `Order changes`.
- `Request new coverage` ahora explica en UI que elimina la asignacion actual, mantiene la visita programada y la marca para cobertura de reemplazo.
- Se cambio el texto de auditoria de `Operational escalation` a `Coordination note` para alinear el lenguaje con Serenity.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`

Resultado de validacion:

- Typecheck paso.
- Build paso.
- Queda el warning conocido de Next por uso de `<img>` en `src/components/carers/carer-workspace.tsx`.

Estado estimado de SER-26:

- Avance funcional y visual aproximado: 65-70%.
- El carer workspace esta cerca del objetivo visual esperado.
- Provider order detail mejoro, pero todavia necesita revision visual final en browser antes de considerarlo consolidado.

Punto exacto para retomar el 2026-04-29:

- Revisar visualmente `/providers/orders/[id]` con Mauricio.
- Confirmar si `Visit schedule and coverage`, `Service request`, `Add another visit`, `Care record`, `Care coordination note` y `Order changes` son los nombres definitivos.
- Decidir si schedule, coverage diagnostics y order changes deben ser detalles plegables, modales o secciones propias en la barra lateral.
- Continuar SER-26 por provider dashboard, provider orders list, closing/export y center views.
- Hacer una pasada responsive/mobile basica sobre carer y provider.
- Antes de cerrar SER-26, limpiar cualquier lenguaje tecnico visible que suene a modelo interno: coverage pool, execution narrative, escalation, demand settings, critical events.

Notas de producto:

- SER-26 sigue alineado con su descripcion: mejorar jerarquia de informacion, escaneabilidad, separacion de dominios operativos, claridad de acciones y consistencia visual sin cambiar el alcance backend.
- No cerrar SER-26 aun. Mantener en `In Progress` hasta completar QA visual transversal.

## 2026-04-27 - SER-8 Polish carer profile for demo reliability

Objetivo:

- Mejorar la claridad demo del workspace carer sin cambiar reglas de negocio.
- Hacer mas visible la continuidad entre perfil, readiness, credenciales, disponibilidad y visitas asignadas.
- Reducir ruido visual para explicar el flujo carer con menos friccion.

Resultado:

- El header del workspace carer ahora resume nombre, readiness e siguiente accion de la visita seleccionada.
- La metrica de readiness muestra blockers y attention signals para lectura rapida.
- La agenda de visitas muestra ventana programada directamente en cada fila.
- Readiness se reorganizo en lanes: ready signals, attention y blockers.
- Availability y credential forms quedan mas compactos dentro del layout operativo.
- Las secciones de alerts, availability y credentials muestran contadores accionables.
- Estilos responsive actualizados para mantener la nueva jerarquia en pantallas angostas.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`

Pruebas manuales pendientes para la etapa QA:

- Reseed Colombia con `npm run db:seed:colombia`.
- Entrar como carer demo y confirmar que el header muestra readiness y siguiente accion.
- Confirmar que las metricas superiores explican visitas, hoy, readiness y credential alerts.
- Confirmar que readiness se lee por lanes sin mezclar positivos, advertencias y bloqueos.
- Confirmar que agenda muestra recipient, service type, fecha/hora y estado.
- Confirmar que availability y credential forms siguen funcionando en el layout compacto.
- Confirmar que execution readiness, checklist, evidence e incidents siguen disponibles para la visita seleccionada.
- Revisar responsive basico del workspace carer.

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
