# Dev Log

Registro breve de decisiones y entregas relevantes. No reemplaza Plane; sirve como memoria tecnica y de producto dentro del repo.

## 2026-05-02 - SER-36 Redefine review, closing, export after zero-start flow

Objetivo:

- Reordenar review, closing, export y audit alrededor del flujo Colombia limpio.
- Evitar que esas pantallas dependan de actividad vieja sembrada.
- Asegurar que los estados vacios expliquen que falta antes de review/closing/export/audit.

Resultado:

- `/providers/orders` muestra un empty state claro cuando no hay demanda provider.
- `/providers/export` ya no trata periodos `open` como paquetes exportables.
- Export dirige a requests si no hay periodos y a closing si solo existen periodos abiertos.
- Audit de periodo ahora reconoce eventos con `periodId` y `closingPeriodId`.
- Los gastos de closing registran `periodId` en audit para que aparezcan en el timeline del periodo.
- `docs/current-demo-state-and-qa.md`, `docs/workflows.md` y `docs/user-manual.md` reflejan el flujo post-zero-start.

Validacion ejecutada:

- `npm run db:seed:colombia`
- Browser QA en `http://127.0.0.1:3005` para `/providers/orders`, `/providers/closing`, `/providers/export` y `/providers/audit`
- `npm run typecheck`
- `npm run build`

Cierre:

- `SER-36` queda cerrado como realineacion del tramo review/closing/export/audit.
- El siguiente paso recomendado es `SER-37` o el proximo item que ataque la profundidad funcional del cierre: settlement, lock, export jobs y audit completo despues de aprobar la primera visita real.

## 2026-05-02 - SER-34 Prepare backend boundary inside current monolith

Objetivo:

- Documentar por que Serenity sigue como una sola app Next.js por ahora.
- Definir boundary backend futuro por dominio.
- Identificar server actions y funciones Prisma que deben moverse detras de service-layer boundaries.
- Definir el camino de migracion desde server actions hacia API endpoints.
- Actualizar documentacion de arquitectura y deployment.

Decision:

- No se separan servicios todavia.
- Se mantiene un deployment de una app Next.js + PostgreSQL.
- El split futuro se prepara dentro del monolito con un service layer por dominio.
- Server actions quedan como adapters de UI.
- API routes futuras deben llamar los mismos service functions.
- El backend fisico separado solo se justifica cuando mobile, jobs, integraciones o deploy velocity lo pidan.

Boundaries definidos:

- Auth and access.
- Admin setup.
- Provider operations.
- Center portal.
- Carer execution.
- Review and care records.
- Closing and export.
- Audit.

Resultado:

- Se creo [backend-boundary-plan.md](./backend-boundary-plan.md).
- Se actualizo [architecture.md](./architecture.md) con la forma objetivo interna `src/server/*`.
- Se actualizo [dokploy-deployment.md](./dokploy-deployment.md) para dejar claro que Dokploy sigue con un solo app container.
- Se actualizo [README.md](../README.md) para enlazar el plan SER-34.
- Se actualizo [current-demo-state-and-qa.md](./current-demo-state-and-qa.md) con estado y handoff.

Cierre:

- `SER-34` queda cerrado como preparacion arquitectonica.
- Primer refactor recomendado: provider operations service layer para `assignCarerToVisit`, `updateVisitStatus` y `reviewVisit`.
- Siguiente item de producto recomendado: `SER-35 Full visual QA across admin, provider, center, carer`.

## 2026-05-01 - SER-33 Define center manager workflow and data ownership

Objetivo:

- Definir si center managers crean solicitudes, monitorean o ambas.
- Definir que datos pueden editar: centro, sede, paciente, notas y request details.
- Definir que no pueden ver o cambiar: carer internals, closing, export y audit fuera de scope.
- Validar direccion UI del portal center y estado vacio Niquia.

Decision:

- Center manager crea solicitudes y monitorea outcomes dentro de su centro.
- Center manager ve centro, sedes, pacientes, solicitudes, cobertura, carer asignado, incidentes, evidencia resumida, review outcome y audit de sus propias ordenes.
- Center manager puede mantener patient context cuando la politica lo habilite.
- Nuevas sedes quedan admin-owned para el MVP; solicitud/draft de nueva sede queda diferido.
- Center manager puede editar una solicitud solo en etapa temprana, antes de cobertura confirmada o ejecucion.
- Despues de cobertura confirmada, cambios del centro deben entrar como request change o nota de coordinacion.
- Center manager puede cancelar antes de ejecucion con motivo obligatorio; despues debe solicitar cambio.
- Center manager no asigna carers, no ve pool interno, no ve credenciales completas/disponibilidad global/rating interno/restriction reasons, no aprueba care records, no opera closing/export y no ve audit fuera de su centro.

Resultado:

- No se requiere schema nuevo.
- `/centers` ya queda alineado con la estructura Centro, Sedes, Pacientes y Solicitudes.
- Se generalizaron textos del portal center para no depender de Laura/Rosalba/Niquia hardcoded.
- La accion de creacion de solicitud ahora registra audit con `session.fullName` en lugar de texto fijo.
- La decision quedo documentada en operating model, domain model, business rules, product direction, workflows, current demo QA y user manual.

Cierre:

- `SER-33` queda cerrado como decision de workflow/data ownership y ajuste menor de UI copy.
- Siguiente recomendado: `SER-34 Prepare backend boundary inside current monolith`.

## 2026-05-01 - SER-32 Define carer relationship model

Objetivo:

- Decidir si `EMPLOYEE` / `INDEPENDENT` alcanza para el MVP.
- Decidir si permanente/casual entra ahora o queda diferido.
- Definir que datos necesita Serenity por tipo de carer.
- Definir que ve Coordinator y que mantiene Admin versus Carer.

Decision:

- `EMPLOYEE` / `INDEPENDENT` es suficiente para el MVP.
- No se agrega schema nuevo para SER-32.
- `permanent` / `casual` queda diferido como politica contractual o de roster, no como tipo principal de carer.
- El carer pertenece operativamente a la prestadora mediante `Carer.providerId`.
- El centro no posee carers; solo ve el carer asignado y care record dentro de sus visitas.
- `Carer.ownerUserId` sigue siendo el vinculo de self-service para el workspace del carer.

Datos MVP por tipo:

- `INDEPENDENT`: provider, owner user, nombre, contacto, business/tax id cuando exista, disponibilidad, credenciales, skills derivadas y estado activo.
- `EMPLOYEE`: provider, owner user, nombre, contacto, etiqueta employee, disponibilidad, credenciales y estado activo.

Datos diferidos:

- Payroll id.
- Permanente/casual.
- Reglas laborales, leave, payout, seguros, rate cards y contratos ampliados.

Visibilidad y propiedad:

- Admin crea el carer, define tipo, provider link, estado activo y gobernanza de credenciales.
- Carer mantiene disponibilidad, evidencia de credenciales donde aplique y care records.
- Coordinator ve solo carers de su provider con readiness, disponibilidad, skills, idioma, carga activa y razones de restriccion.
- Center manager ve carer identity y care record solo dentro de visitas de su centro.

Documentacion actualizada:

- [operating-model.md](./operating-model.md)
- [domain-model.md](./domain-model.md)
- [business-rules.md](./business-rules.md)
- [product-direction.md](./product-direction.md)
- [workflows.md](./workflows.md)
- [current-demo-state-and-qa.md](./current-demo-state-and-qa.md)
- [user-manual.md](./user-manual.md)

Cierre:

- `SER-32` queda cerrado como decision de producto/modelo sin migracion.
- El siguiente paso recomendado es `SER-33 Define center manager workflow and data ownership`.

## 2026-05-01 - SER-31 Complete Niquia / Rosalba end-to-end workflow

Objetivo:

- Validar el flujo completo desde demanda del centro hasta visita aprobada.
- Confirmar que `SR-2401` puede pasar por coverage, assignment, ejecucion carer, checklist, evidencia, incidente, review y elegibilidad de closing.
- Dejar el escenario listo para continuar con cierre/export o con el siguiente item de ownership.

Resultado:

- El seed Colombia mantiene zero-start, pero ahora Gabriel tiene un bloque de disponibilidad que cubre la primera ventana operativa de `SR-2401`.
- Gabriel queda elegible para la visita Niquia/Rosalba con `Personal hygiene support`, `Manual handling`, idioma `English` y disponibilidad completa.
- La aprobacion de una visita desde provider reviewer crea un closing period `open` si no existe un periodo que cubra la fecha de cierre de la visita.
- Esto evita que Colombia quede sin paquete operativo despues de aprobar la primera visita.

Validacion ejecutada:

- `npm run db:seed:colombia`
- `npm run typecheck`
- Servidor local en `http://127.0.0.1:3003`
- Validacion de datos SER-31 con `SR-2401`:
  - orden `COMPLETED`
  - visita `APPROVED`
  - carer `Gabriel Ramirez`
  - 3 checklist items completos
  - 1 evidencia
  - 1 incidente
  - 1 review aprobada por Diana
  - 1 closing period `OPEN`

Nota de validacion:

- La automatizacion Playwright pudo autenticar y cargar `/centers/orders`, pero el submit del server action redirigio a `/login` en el entorno dev automatizado. La validacion funcional de SER-31 se hizo contra la base local y las mismas entidades de producto. El flujo de creacion de orden desde Laura ya habia sido validado con submit real en SER-30.

Cierre:

- `SER-31` queda funcionalmente cerrado como primer flujo Niquia/Rosalba aprobado.
- El siguiente paso natural es `SER-32 Define carer relationship model`, porque antes de seguir agregando operacion conviene decidir si carers pertenecen solo a la prestadora, si existen perfiles employee/independent suficientes para MVP y como se modela la relacion carer-provider-center.

## 2026-04-30 - SER-30 Create first service request from center portal

Objetivo:

- Crear la primera solicitud real desde el portal del centro usando datos configurados.
- Confirmar que Laura inicia demanda para Rosalba y que Mauricio la recibe en provider operations.
- Reforzar que el coordinator no inventa demanda ni crea datos maestros durante la solicitud.

Resultado:

- `createCenterServiceOrder` valida que la prestadora seleccionada este vinculada al centro mediante `ProviderClient`.
- La accion valida ventana operativa, duracion positiva y que la duracion no exceda la ventana.
- La solicitud creada redirige a Laura al detalle `/centers/orders/[id]`.
- La orden queda asociada a Centro de Cuidado Niquia, Sede Niquia, Rosalba y Serenity Homecare Antioquia.
- Se crea una visita inicial `scheduled` esperando cobertura provider.
- Audit registra la creacion de la orden y de la visita inicial con actor Laura.
- El formulario del centro solo lista providers activos vinculados al centro.

Validacion ejecutada:

- Reseed Colombia zero-start con `npm run db:seed:colombia`.
- Login real de Laura y submit real desde `/centers/orders`.
- Se creo `SR-2401` con 1 visita inicial y 2 audit events.
- Laura ve `SR-2401` y Rosalba en `/centers/orders`.
- Mauricio ve `SR-2401` y `Morning personal care support` en `/providers/orders`.
- Provider detail muestra `SR-2401`, Rosalba, Sede Niquia y audit de creacion.

Cierre:

- `SER-30` queda funcionalmente cerrado.
- La demanda ya nace desde el centro, no desde una orden inventada por provider.
- Laura representa al centro y solicita; Mauricio recibe demanda y coordina.
- `SR-2401` es el artefacto operativo para iniciar `SER-31`.

Handoff recomendado:

- Continuar con `SER-31 Complete Niquia / Rosalba end-to-end workflow`.
- Punto de arranque: `SR-2401` creada por Laura con visita inicial `scheduled`.
- Validar primero asignacion provider con los 3 carers del seed Colombia.
- Despues continuar ejecucion carer, review de Diana, visibilidad center, closing/export y audit.

## 2026-04-30 - SER-30A Clarify center manager workspace before first request

Objetivo:

- Hacer que el perfil de Laura funcione como portal del centro antes de crear la primera solicitud.
- Mostrar centro, sedes, pacientes y solicitudes sin sugerir que Laura administra carers o cobertura provider.
- Preparar SER-30 para que la primera solicitud nazca desde demanda del centro.

Resultado:

- `/centers` ahora muestra identidad de Centro de Cuidado Niquia, manager Laura, relacion con Serenity, sedes configuradas y pacientes disponibles.
- Sede Niquia y Rosalba son visibles en estado zero-start antes de que exista una orden.
- El empty state de solicitudes incluye CTA para crear la primera solicitud desde `/centers/orders`.
- El limite de rol queda explicito: Laura define demanda y monitorea; Mauricio coordina cobertura; Diana revisa; carers ejecutan.

Validacion ejecutada:

- Login real de Laura redirige a `/centers`.
- `/centers` contiene Centro de Cuidado Niquia, Serenity Homecare Antioquia, Sede Niquia, Rosalba, CTA de primera solicitud y limite de rol.
- `npm run typecheck`

## 2026-04-29 - SER-28 admin setup workflow

Objetivo:

- Hacer que `/admin` sea el punto oficial de setup antes de crear solicitudes.
- Convertir la pantalla admin en una vista de readiness accionable, no solo en conteos.
- Reforzar clientes, sedes, pacientes, carers y workflows con empty states y bloqueadores claros.

Resultado:

- `getAdminWorkspace` ahora calcula setup readiness, blockers, next action y alertas operativas.
- `/admin` muestra si la red esta lista para que Mauricio cree la primera solicitud.
- `/admin/clients` muestra metricas de clients, sites, contacts y patients, con empty state si no hay red.
- `/admin/care-team` muestra carers listos, alertas de credenciales, carers sin disponibilidad y carers sin credenciales.
- `/admin/workflows` muestra si los service workflows tienen checklist/care record configurado.
- Los empty states explican el siguiente paso antes de provider operations.
- `/admin/clients` permite agregar sedes a un cliente existente.
- `/admin/care-team` usa revision individual por carer en desplegables para evitar solapamiento visual.
- Admin puede actualizar el estado de credenciales con alerta desde la revision individual del carer.
- `/admin/workflows` muestra duracion en horas y declara que el catalogo es read-only por ahora.

Validacion ejecutada:

- `npm run typecheck`
- `npm run build`

Resultado:

- Typecheck paso.
- Build paso.
- Persiste el warning conocido de Next por `<img>` en `src/components/carers/carer-workspace.tsx`.

Cierre:

- `SER-28` queda funcionalmente cumplido como punto de partida admin-first.
- Admin ya puede revisar readiness, administrar clientes/sedes/pacientes, revisar carers, resolver alertas de credenciales por carer y consultar workflows configurados.
- Los workflows quedan intencionalmente controlados por seed/catalogo por ahora; crear y editar workflows desde UI se difiere hasta que el modelo este mas estable.
- La deuda visual sigue abierta: el sistema actual de tarjetas y formularios funciona, pero no alcanza el nivel visual esperado. Esto debe tratarse como trabajo explicito de UI/design system, no como parte escondida de SER-28.
- Separar frontend/backend no arregla la UI por si solo, pero una frontera frontend mas limpia puede facilitar un rediseño fuerte con mejores componentes, iconografia, layout y patrones visuales.

Handoff recomendado:

- Cerrar SER-28 en Plane como entrega funcional.
- Mañana continuar con `SER-29 Validate Colombia zero-start scenario` o, si la frustracion visual bloquea el avance, adelantar `SER-35 Full visual QA across admin, provider, center, carer`.
- Mantener `SER-34 Prepare backend boundary inside current monolith` como paso previo antes de separar fisicamente backend y frontend.

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

## 2026-05-02 - SER-35 Full visual QA across admin, provider, center, carer

Objetivo:

- Ejecutar una pasada visual completa despues del reset Colombia.
- Confirmar desktop y mobile para admin, provider, center y carer.
- Documentar o corregir los issues visuales conocidos antes de seguir con estabilizacion.

Resultado:

- Revisadas rutas admin, provider, center y carer con seed Colombia.
- Confirmados empty states de zero-start para provider closing/export/audit y center requests.
- Corregido overflow horizontal mobile en `/carers/availability`.
- Agregado registro dedicado en `docs/visual-qa-ser-35-2026-05-02.md`.
- Actualizado `docs/current-demo-state-and-qa.md` con el cierre de SER-35.

Validacion ejecutada:

- `npm run db:seed:colombia`
- Browser QA en `http://127.0.0.1:3003`
- `npm run typecheck`
- `npm run build`

Observacion:

- Algunas pantallas mobile siguen siendo largas por densidad de formularios o listas. No bloquean SER-35 porque no tienen overflow horizontal ni colisiones visuales, pero pueden alimentar un ticket futuro de composer colapsable/tabs internas.

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
