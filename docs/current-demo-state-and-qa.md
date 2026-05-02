# Estado Actual de la Demo y Pruebas Manuales

## Version

Version actual: `2.1.0`

La version 2 marca la direccion definida del producto: Serenity opera con setup administrativo primero, coordinator operations despues, care record ejecutado por carer, review humano, closing/export y audit como trazabilidad posterior.

La version `2.1.0` fija el reset Colombia como escenario canonico: zero-start limpio, portal center para Laura, primera solicitud desde el centro, flujo Niquia/Rosalba end-to-end, carer relationship model, center data ownership, backend boundary plan, QA visual y review/closing/export/audit alineados al flujo real.

## Alcance

Este documento describe el estado actual de la demo local usando el seed `colombia`.

Comando recomendado antes de probar:

```powershell
npm run db:seed:colombia
npm run dev
```

Password compartido para todos los usuarios demo:

```text
SerenityDemo!2026
```

## Situacion actual

Serenity modela una red de homecare donde una prestadora coordina servicios para centros de cuidado. Los centros crean o necesitan demanda, la prestadora coordina cobertura y los cuidadores ejecutan visitas. Las visitas aprobadas alimentan el cierre operativo y luego se preparan para exportacion externa.

La demo local esta configurada con:

- 1 prestadora.
- 1 centro de cuidado.
- 1 sede.
- 1 recipient.
- 1 admin provider.
- 2 usuarios provider.
- 1 center manager.
- 3 carers independientes.
- 0 ordenes de servicio.
- 0 visitas.
- 0 closing periods.
- 0 export jobs y audit events.

El seed `colombia` queda intencionalmente como escenario limpio para iniciar el flujo desde cero: crear demanda para una sola paciente de Niquia, coordinar cobertura, ejecutar visitas, revisar, cerrar y exportar sin ruido de datos preexistentes.

## SER-27 operating model status

SER-27 es ahora el item rector del producto. El contrato canonico esta en [operating-model.md](./operating-model.md).

Decisiones vigentes:

- Admin setup ocurre antes de provider operations.
- Coordinator usa datos configurados; no crea jerarquia maestra durante una solicitud.
- Reviewer aprueba care records; coordinator no aprueba.
- Center manager queda limitado a su centro.
- Carer queda limitado a su perfil y visitas asignadas.
- Audit explica historia; no es una cola operativa diaria.
- La separacion backend/frontend queda diferida; primero se estabilizan boundaries de dominio.

## SER-28 admin setup status

SER-28 deja `/admin` como el punto oficial de configuracion antes de que exista demanda operativa.

Estado al cierre del 2026-04-29:

- Admin puede revisar si la red esta lista para crear la primera solicitud.
- Admin puede administrar centro cliente, sedes, contactos y patients.
- Admin puede agregar sedes a un cliente existente.
- Admin puede revisar el care team de Serenity y abrir cada carer individualmente.
- Admin puede resolver alertas de credenciales por carer desde una revision individual.
- Workflows se muestran como catalogo configurado con duracion en horas y care record esperado.
- Workflows siguen siendo seed-controlled/read-only por decision de producto hasta estabilizar el modelo.

Riesgo abierto:

- La UI sigue siendo la principal deuda. SER-28 cerro estructura y flujo, pero no resuelve todavia el cambio visual profundo que Serenity necesita.
- La referencia visual preferida usa una navegacion mas limpia, tarjetas con iconografia, graficas simples y menos cajas anidadas. Ese criterio debe alimentar `SER-35` y la decision de arquitectura frontend.
- Separar frontend/backend puede ayudar a trabajar la UI con mas libertad, pero la mejora visual debe tratarse como un rediseño de frontend y design system, no como una consecuencia automatica del split.

## SER-30A center manager portal status

SER-30A aclara que Laura no administra carers ni datos maestros provider. Laura representa al Centro de Cuidado Niquia y debe iniciar demanda desde contexto de centro.

Estado:

- `/centers` funciona como portal del centro, no solo como dashboard de metricas.
- Laura ve identidad del centro, manager, relacion con Serenity, sedes, pacientes y solicitudes.
- Sede Niquia y Rosalba son visibles antes de que exista una orden.
- El estado vacio explica que Laura puede crear la primera solicitud desde `/centers/orders`.
- El limite de rol queda visible: Laura define demanda y monitorea; Mauricio coordina cobertura; Diana revisa; carers ejecutan.

Implicacion para SER-30:

- La primera solicitud debe nacer desde el portal del centro con Laura.
- Mauricio debe verla luego como demanda entrante en provider operations.

## SER-30 first request status

SER-30 valida el primer paso operativo posterior al zero-start.

Estado:

- Laura puede crear la primera solicitud desde `/centers/orders`.
- El formulario usa datos configurados: Serenity Homecare Antioquia, Sede Niquia, Rosalba, service types y skills.
- La accion server-side valida provider vinculado al centro, facility/recipient del centro, service type, skills, ventana y duracion.
- La solicitud creada redirige al detalle center.
- Mauricio ve la solicitud en `/providers/orders` para continuar agenda y cobertura.
- Audit registra la orden creada y la visita inicial.

Resultado validado:

- `SR-2401` / `Morning personal care support` para Rosalba.
- 1 visita inicial `scheduled`.
- 2 audit events iniciales.

Handoff para la proxima sesion:

- Para empezar SER-31 desde cero, ejecutar `npm run db:seed:colombia` y luego crear `SR-2401` con Laura desde `/centers/orders`.
- Si la base local ya conserva la validacion de SER-30, usar la orden existente `SR-2401` como punto de partida.
- El siguiente paso natural es que Mauricio abra `SR-2401` en `/providers/orders`, revise la visita `scheduled` y coordine cobertura con Alvaro, Gabriel o Gloria.
- SER-31 debe validar el flujo Niquia / Rosalba end-to-end: coverage, assignment, carer execution, reviewer approval, center visibility, closing/export readiness y audit.

## SER-31 Niquia / Rosalba end-to-end status

SER-31 valida el primer flujo operacional completo despues de crear demanda desde el centro.

Decision de producto:

- Laura solicita desde el centro.
- Mauricio coordina cobertura y asigna carer.
- Gabriel ejecuta la visita asignada.
- Diana aprueba o rechaza el care record.
- Una visita aprobada debe aparecer en closing como trabajo operativo listo para settlement.

Estado:

- El seed Colombia sigue arrancando con 0 ordenes y 0 visitas.
- Gabriel tiene disponibilidad sembrada para cubrir la primera ventana de `SR-2401`.
- La aprobacion de una visita crea automaticamente un closing period `open` cuando no existe uno que cubra la fecha de la visita.
- Esto mantiene el zero-start limpio y evita que el primer flujo aprobado quede invisible para closing.

Resultado validado localmente:

- `SR-2401` / `Morning personal care support`.
- Rosalba, Sede Niquia, Centro de Cuidado Niquia.
- Visita asignada a `Gabriel Ramirez`.
- Estados recorridos: `scheduled` -> `confirmed` -> `in_progress` -> `completed` -> `under_review` -> `approved`.
- Checklist de `Personal Care`: 3 items completos.
- Evidencia: 1 item.
- Incidente: 1 nota de observacion de severidad baja.
- Review: 1 aprobacion por Diana.
- Closing: 1 periodo `open` creado para contener la visita aprobada.

Handoff para la proxima sesion:

- Si se quiere retomar desde cero, ejecutar `npm run db:seed:colombia`, crear `SR-2401` con Laura y repetir SER-31 desde la UI.
- Si se quiere retomar desde el estado ya validado, usar `SR-2401` aprobado y continuar en `/providers/closing`.
- Siguiente work item recomendado: `SER-32 Define carer relationship model`.

## SER-32 carer relationship model status

SER-32 queda como decision de modelo sin migracion.

Decision vigente:

- `EMPLOYEE` y `INDEPENDENT` son suficientes para el MVP.
- `permanent` y `casual` quedan diferidos como atributos futuros de politica contractual o roster.
- El carer pertenece operativamente a la prestadora mediante `Carer.providerId`.
- El centro no posee carers; solo ve el carer asignado y el care record dentro de visitas de su propio centro.
- Admin crea y gobierna setup del carer.
- Carer mantiene disponibilidad, evidencia de credenciales donde aplique y care records.
- Coordinator ve readiness, disponibilidad, skills, idioma, carga activa y razones de restriccion solo para carers de su provider.

Implicacion:

- No se requiere cambio de schema para SER-32.
- La documentacion rectoria ya refleja la decision.
- El siguiente paso recomendado es `SER-33 Define center manager workflow and data ownership`.

## SER-33 center manager workflow and data ownership status

SER-33 define que el center manager no es solo un lector, pero tampoco opera la prestadora.

Decision vigente:

- Center manager puede crear solicitudes y monitorear resultados dentro de su centro.
- Center manager puede ver centro, sedes, pacientes, solicitudes, cobertura, carer asignado, incidentes, evidencia resumida, review outcome y audit de sus propias ordenes.
- Center manager puede mantener contexto de pacientes cuando la politica lo habilite.
- Nuevas sedes quedan admin-owned en el MVP; mas adelante el centro puede solicitar o crear drafts sujetos a aprobacion.
- Center manager puede editar detalles de solicitud solo en etapa temprana, antes de cobertura confirmada o ejecucion.
- Despues de cobertura confirmada, cambios del centro deben entrar como request change o nota para coordinator.
- Center manager puede cancelar antes de ejecucion con motivo obligatorio; despues de ejecucion debe solicitar cambio.
- Center manager no ve pool interno de carers, credenciales completas, disponibilidad global, ratings internos, closing/export provider ni audit fuera de su scope.
- Center manager no asigna carers ni aprueba/rechaza care records.

Estado UI:

- `/centers` ya se organiza por centro, sedes, pacientes y solicitudes.
- El estado vacio Niquia muestra contexto configurado y CTA para crear solicitud.
- Los textos del portal ya no dependen de nombres hardcoded de Laura/Rosalba/Niquia.
- El audit de creacion usa el nombre de la sesion center manager.

Implicacion:

- No se requiere schema nuevo para SER-33.
- Request changes, site drafts y patient self-maintenance quedan como extensiones futuras.
- Siguiente paso recomendado: `SER-34 Prepare backend boundary inside current monolith`.

## SER-34 backend boundary inside current monolith status

SER-34 prepara arquitectura sin separar servicios todavia.

Decision vigente:

- Serenity sigue como una sola app Next.js con PostgreSQL.
- No se agrega backend container en Dokploy por ahora.
- La separacion futura se prepara con boundaries internos por dominio.
- Server actions deben quedar como adapters: parsean `FormData`, resuelven sesion, llaman servicios internos y hacen `revalidate/redirect`.
- Prisma debe quedar detras de service/data modules, no en componentes UI.
- API routes futuras deben llamar los mismos services que las server actions.

Boundaries definidos:

- Auth.
- Admin setup.
- Provider operations.
- Center portal.
- Carer execution.
- Review.
- Closing/export.
- Audit.

Documentacion:

- Plan detallado: [backend-boundary-plan.md](./backend-boundary-plan.md).
- Arquitectura actualizada: [architecture.md](./architecture.md).
- Deployment Dokploy actualizado: [dokploy-deployment.md](./dokploy-deployment.md).

Siguiente implementacion tecnica recomendada:

- Refactorizar primero provider operations, especialmente `assignCarerToVisit`, `updateVisitStatus` y `reviewVisit`, hacia un service layer interno sin cambiar la UI.

## SER-26 status para QA visual

SER-26 queda como antecedente visual. El trabajo nuevo debe guiarse por SER-27 y por el flujo admin-first.

Estado actualizado el 2026-04-29:

Nota actual: se agrego `/admin` como capa de setup para clientes, sedes, pacientes, carers y workflows. Tambien se agrego `ProviderClient` para que los centros cliente existan antes de crear ordenes. Colombia ahora es un escenario limpio para empezar desde cero.

- Backend y reglas operativas se mantienen estables.
- El rediseño se concentra en frontend, lenguaje de producto y separacion de dominios operativos.
- Carer workspace es el flujo mas avanzado del rediseño.
- Provider order detail ya fue simplificado, pero sigue siendo el punto principal de revision para la proxima sesion.
- Center views, provider dashboard, provider orders list, closing y export aun necesitan la misma pasada de consistencia visual.

Validacion automatizada ya ejecutada:

```powershell
npm run typecheck
npm run build
```

Ambas pasaron. El build mantiene el warning conocido de Next por uso de `<img>` en `src/components/carers/carer-workspace.tsx`.

Prioridad de QA para el 2026-04-29:

1. Entrar como `admin@serenity.local`.
2. Validar `/admin`, `/admin/clients`, `/admin/care-team` y `/admin/workflows`.
3. Entrar como `laura@serenity.local`.
4. Confirmar que `/centers` muestra Centro de Cuidado Niquia, Sede Niquia, Rosalba y el CTA para crear la primera solicitud.
5. Entrar como `mauricio@serenity.local`.
6. Confirmar que `/providers` explica claramente el estado inicial sin ordenes.
7. Crear la primera solicitud para Rosalba desde `/centers/orders`.
8. Confirmar que Laura aterriza en el detalle de la orden creada y ve audit inicial.
9. Entrar como Mauricio y confirmar que la solicitud aparece en `/providers/orders`.
10. Probar el flujo de cobertura con Gabriel para la visita inicial de Rosalba.
11. Entrar como Gabriel, ejecutar checklist/evidencia/incidente y enviar a review.
12. Entrar como Diana, aprobar o rechazar el care record.
13. Confirmar que la visita aprobada aparece elegible en closing.
14. Continuar hacia settlement, external export y audit solo cuando existan datos creados por el flujo.

## Organizaciones y responsables

### Prestadora

| Organizacion | Tipo | Responsable principal | Email |
| --- | --- | --- | --- |
| Serenity Homecare Antioquia | Provider | Mauricio Garavito | `mauricio@serenity.local` |

### Equipo provider

| Persona | Rol | Que valida |
| --- | --- | --- |
| Serenity Admin | Platform admin | Clientes, sedes, patients, carers y workflows |
| Mauricio Garavito | Provider coordinator | Dashboard, ordenes, cobertura, closing, external export y audit trail |
| Diana Chaverra | Provider reviewer | Revision/aprobacion de visitas y consulta operativa provider |

### Centros

| Centro | Sede | Barrio | Manager | Email |
| --- | --- | --- | --- | --- |
| Centro de Cuidado Niquia | Sede Niquia | Niquia | Laura Garavito | `laura@serenity.local` |

### Recipients

| Recipient | Centro | Orden principal |
| --- | --- | --- |
| Rosalba | Centro de Cuidado Niquia | Sin orden inicial |

### Cuidadores

| Cuidador | Email | Disponibilidad sembrada | Skills principales |
| --- | --- | --- | --- |
| Alvaro Ramirez | `alvaro@serenity.local` | Thu-Fri mornings | Domestic cleaning, meal preparation, manual handling, personal hygiene support |
| Gabriel Ramirez | `gabriel@serenity.local` | Mon-Fri mornings, including first Niquia/Rosalba request window | Personal hygiene support, manual handling, medication prompt, meal preparation |
| Gloria Palacio | `gloria@serenity.local` | Thu mornings | Personal hygiene support, manual handling, medication prompt, social engagement |

## Ordenes, visitas, closing, export y audit

El seed Colombia no crea ordenes, visitas, closing periods, export jobs ni audit events. Estos datos deben aparecer solo despues de recorrer el flujo desde cero en la app.

Resultado esperado del estado inicial:

- Provider dashboard: sin solicitudes activas, sin cobertura pendiente y sin cierre operativo.
- Provider orders: lista vacia y accion clara para crear la primera solicitud.
- Center Niquia: Rosalba existe como recipient, pero sin orden activa.
- Carers: la red existe con disponibilidad y credenciales para probar matching cuando se cree una orden.
- Closing/export/audit: deben comunicar que aun no hay paquetes o eventos porque no hay visitas aprobadas.

## Como leer cada pantalla provider

### `/providers`

Mision: ver el panorama general y decidir donde entrar.

Debe mostrar:

- carga actual de ordenes,
- presion de cobertura,
- visitas pendientes de review,
- visitas listas para closing,
- links a ordenes filtradas por estado, riesgo o prioridad,
- cola de accion prioritaria.

### `/providers/orders`

Mision: trabajar la demanda activa.

Debe permitir:

- ver todas las ordenes activas,
- filtrar por query desde el dashboard,
- abrir el detalle de una orden,
- crear una nueva orden desde un modal sin perder de vista la lista.

### `/providers/closing`

Mision: cerrar operativamente visitas aprobadas.

Debe enfocarse en:

- seleccionar periodo,
- ver visitas aprobadas,
- ver settlement,
- ver excepciones fuera de settlement.

No debe cargar al usuario con export jobs ni audit events; eso vive en pantallas separadas.

### `/providers/export`

Mision: preparar y verificar salida hacia sistemas externos.

Debe permitir:

- descargar JSON,
- descargar CSV,
- encolar sync job,
- correr jobs encolados,
- revisar jobs enviados,
- retry de fallidos,
- confirmar acknowledgement/rejection cuando aplique.

### `/providers/audit`

Mision: explicar que paso.

Debe mostrar trazabilidad critica sin interrumpir el flujo operativo.

## Pruebas manuales recomendadas

### 1. Preparacion local

1. Ejecutar `npm run db:seed:colombia`.
2. Ejecutar `npm run dev`.
3. Abrir `http://localhost:3000/login`.
4. Confirmar que todos los usuarios usan `SerenityDemo!2026`.

Resultado esperado:

- La app carga sin errores visibles.
- El login redirige segun el rol.
- El seed muestra nombres de Colombia.

### 2. Login provider coordinator

Usuario:

```text
mauricio@serenity.local
```

Pruebas:

1. Entrar a `/providers`.
2. Confirmar que aparece `Serenity Homecare Antioquia`.
3. Confirmar que el dashboard resume la carga actual.
4. Abrir links de riesgo/prioridad/estado desde el dashboard.
5. Confirmar que esos links llevan a `/providers/orders` con lista filtrada.

Resultado esperado:

- Mauricio puede operar la superficie provider completa.
- El dashboard muestra estado vacio hasta que se cree la primera solicitud.

### 3. Admin workspace

Usuario:

```text
admin@serenity.local
```

Pruebas:

1. Entrar a `/admin`.
2. Confirmar que el bloque `Setup readiness` indica si falta algo antes de crear solicitudes.
3. Confirmar que existe una prestadora, un centro cliente, una sede, una paciente y 3 carers.
4. Entrar a `/admin/clients` y confirmar Niquia / Sede Niquia / Laura / Rosalba.
5. Confirmar que `/admin/clients` permite agregar otra sede a un cliente existente.
6. Entrar a `/admin/care-team` y confirmar contacto, tipo, disponibilidad y credenciales de carers.
7. Expandir un carer con `Needs setup` y confirmar que la pantalla explica si faltan credenciales o disponibilidad.
8. Confirmar que Admin puede actualizar credenciales con alerta desde la revision individual del carer.
9. Entrar a `/admin/workflows` y confirmar catalogo de servicios, duracion en horas y checklist/care record.

Resultado esperado:

- El admin explica la jerarquia del negocio antes de que exista demanda.
- Mauricio no necesita crear centros o carers desde el dashboard operativo.
- Los empty states explican que falta cuando una pieza de setup no existe.
- La revision de carers no debe mostrar formularios solapados ni edicion masiva visible permanentemente.
- Los workflows explican que son catalogo configurado, no un constructor visual editable en esta etapa.

### 4. Orders y modal de nueva orden

Usuario:

```text
mauricio@serenity.local
```

Pruebas:

1. Ir a `/providers/orders`.
2. Confirmar que la lista de ordenes aparece sin tener que bajar por un formulario largo.
3. Click en `New order`.
4. Confirmar que el formulario abre en modal.
5. Cerrar el modal.
6. Crear una solicitud para Rosalba.
7. Abrir la orden creada.

Resultado esperado:

- La lista sigue siendo el centro de la pantalla.
- El formulario no empuja las ordenes hacia abajo.
- El formulario separa demanda, agenda, requisitos, instrucciones e internos.
- Una orden valida redirige al detalle para continuar cobertura/asignacion.
- Ordenes sin skills, con ventana invalida o con duracion mayor que la ventana quedan bloqueadas.
- La orden creada abre su detalle correctamente.

### 4. Review con provider reviewer

Usuario:

```text
diana@serenity.local
```

Pruebas:

1. Entrar a `/providers/orders`.
2. Confirmar que no hay visitas `under_review` en el estado inicial.
3. Despues de crear y ejecutar una visita, entrar a la orden generada.
4. Ubicar la visita en `under_review`.
5. Verificar que existen controles de review.
6. Probar approve o reject solo si quieres modificar el estado de la demo.

Resultado esperado:

- Diana puede revisar visitas.
- El coordinator no debe ser el usuario principal para aprobar/rechazar.

### 5. Center managers

Usuarios:

```text
laura@serenity.local
```

Pruebas:

1. Entrar con Laura y confirmar que ve informacion de Niquia.
2. Confirmar que Rosalba existe como recipient.
3. Confirmar que no hay ordenes iniciales.
4. Confirmar que un center manager no opera asignaciones provider ni closing/export.

Resultado esperado:

- Cada manager ve su centro.
- No ve ni opera la superficie completa de la prestadora.

### 6. Carer workspace

Usuario:

```text
gabriel@serenity.local
```

Pruebas:

1. Entrar a `/carers`.
2. Confirmar que Gabriel no ve visitas asignadas en el estado inicial.
3. Despues de crear una orden y asignarle una visita, volver a `/carers`.
4. Abrir la visita asignada cuando exista.
5. Confirmar que el bloque de readiness de ejecucion explica checklist, evidencia e incidencias.
6. Confirmar que `Submit for review` queda bloqueado si falta checklist completo o evidencia.
7. Probar flujo de ejecucion si quieres modificar la demo:
   `Start visit` -> checklist/evidence -> `Complete visit` -> `Submit for review`.

Resultado esperado:

- El carer solo ve su workspace.
- El flujo de ejecucion se entiende sin entrar a provider.
- El carer entiende que falta antes de enviar a review.
- Readiness del perfil explica senales positivas, advertencias y bloqueos.
- Las razones de readiness coinciden con las razones visibles para provider en matching.

### 7. Closing

Usuario:

```text
mauricio@serenity.local
```

Pruebas:

1. Entrar a `/providers/closing`.
2. Confirmar que no hay periodos hasta que existan visitas aprobadas.
3. Despues de aprobar la primera visita, confirmar que aparece un periodo `open`.
4. Confirmar que la visita aprobada aparece como pendiente de settlement.
5. Confirmar que la pantalla explica el siguiente paso operativo.

Resultado esperado:

- Closing se entiende como cierre operativo.
- No obliga al usuario a leer export jobs ni audit events en la misma pantalla.

### 8. External export

Usuario:

```text
mauricio@serenity.local
```

Pruebas:

1. Entrar a `/providers/export`.
2. Confirmar que no hay paquetes exportables al inicio.
3. Confirmar que la pantalla dirige al cierre antes del handoff externo.

Resultado esperado:

- La pagina explica claramente que Serenity hace handoff externo.
- Los estados de jobs son visibles y auditables.

### 9. Audit trail

Usuario:

```text
mauricio@serenity.local
```

Pruebas:

1. Entrar a `/providers/audit`.
2. Confirmar que no hay eventos criticos antes de operar el flujo.
3. Crear una orden y volver para confirmar que aparecen eventos nuevos.

Resultado esperado:

- El audit trail sirve para explicar cambios, no para hacer operacion diaria.

### 10. Seed Australia

Prueba opcional para demos externas:

```powershell
npm run db:seed:australia
```

Resultado esperado:

- La estructura es la misma.
- Cambian nombres, centros y ubicaciones a la version Australia.
- Los usuarios originales vuelven a funcionar, por ejemplo `coordination@serenity.local`.

Despues de esta prueba, volver al seed local:

```powershell
npm run db:seed:colombia
```

## Checklist final de aceptacion

- El dashboard permite entender el estado general sin repetir listas.
- Orders permite trabajar ordenes y crear demanda desde modal.
- Closing se limita a cierre operativo.
- External export contiene handoff y jobs.
- Audit trail contiene trazabilidad.
- Cada rol entra a su superficie correcta.
- Cada center manager ve su centro.
- El carer puede ejecutar visitas desde su workspace.
- Checklist, evidencia e incidencias se pueden leer como narrativa de ejecucion desde carer, provider y center.
- Readiness del carer usa estados claros `ready`, `attention_needed` y `restricted`.
- Credenciales vencidas o con fecha vencida no cuentan como skills verificadas.
- Credenciales por vencer dentro de 45 dias muestran alerta y accion de renovacion sin bloquear matching antes del vencimiento.
- Provider matching bloquea unavailable blocks, disponibilidad parcial y visitas asignadas que se solapan.
- La accion server-side de asignacion vuelve a validar disponibilidad, skills vigentes y lenguaje antes de confirmar.
- El workspace del carer prioriza resumen operativo, readiness por lanes, agenda con ventana y formularios mas compactos para demo.
- Colombia y Australia pueden reseedearse sin romper build ni typecheck.

## SER-35 visual QA

Estado: cerrado para el reset Colombia.

Registro detallado: `docs/visual-qa-ser-35-2026-05-02.md`.

Pasada ejecutada:

- Seed usado: `npm run db:seed:colombia`.
- Dev server: `http://127.0.0.1:3003`.
- Viewports: desktop `1440x900` y mobile `390x844`.
- Roles: admin, provider coordinator, center manager y carer.

Resultado:

- Admin, provider, center y carer renderizan sus superficies sin overflow horizontal.
- Empty states de provider closing/export/audit y center requests quedan claros en zero-start.
- `/carers/availability` tenia overflow horizontal en mobile; se corrigio convirtiendo el planner a lista vertical bajo `760px`.
- Quedan observaciones no bloqueantes de scroll largo en formularios densos mobile; estan documentadas para futuros tickets de refinamiento.

## SER-36 review, closing, export and audit after zero-start

Estado: cerrado para el reset Colombia.

Decision vigente:

- Review no tiene trabajo hasta que exista una visita real completada y enviada a `under_review`.
- Closing no crea ni muestra paquetes viejos; aparece solo cuando una visita aprobada crea un periodo `open`.
- Export no considera un periodo `open` como paquete exportable. El paquete aparece solo cuando el periodo esta `locked`.
- Audit de periodo arranca vacio y toma sentido cuando review, settlement, lock/export o sync registran eventos del periodo.

Validacion zero-start:

- `npm run db:seed:colombia` deja 0 ordenes, 0 visitas, 0 closing periods, 0 export jobs y 0 audit events operativos.
- `/providers/orders` muestra `No provider demand yet` y explica que review empieza despues de una visita completada y enviada.
- `/providers/closing` muestra `No closing periods yet` y explica que hacen falta visitas aprobadas.
- `/providers/export` muestra `No export packages yet` y explica que hace falta un periodo settled + locked.
- `/providers/audit` muestra timeline vacio sin depender de actividad pre-seeded.

Cambios aplicados:

- Provider Orders tiene empty state real cuando no hay demanda.
- External Export solo selecciona periodos no `open`; si solo hay zero-start u open period, dirige al paso anterior correcto.
- Audit de periodo incluye eventos con `periodId` y `closingPeriodId`, incluyendo la aprobacion que crea un periodo de cierre.
- Expense audit en closing ahora incluye `periodId` para aparecer en el timeline del periodo.
