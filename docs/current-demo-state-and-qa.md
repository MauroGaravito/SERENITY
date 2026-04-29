# Estado Actual de la Demo y Pruebas Manuales

## Version

Version actual: `2.0.0`

La version 2 marca la direccion definida del producto: Serenity opera con setup administrativo primero, coordinator operations despues, care record ejecutado por carer, review humano, closing/export y audit como trazabilidad posterior.

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
- 7 carers independientes.
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
3. Entrar como `mauricio@serenity.local`.
4. Confirmar que `/providers` explica claramente el estado inicial sin ordenes.
5. Entrar a `/providers/orders` y crear la primera solicitud para Rosalba / Centro de Cuidado Niquia.
6. Confirmar que la orden creada guia al coordinador hacia agenda, cobertura y asignacion.
7. Probar el flujo de cobertura con los carers sembrados.
8. Continuar hacia ejecucion, review, closing, external export y audit solo cuando existan datos creados por el flujo.

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
| Gabriel Ramirez | `gabriel@serenity.local` | Mon-Fri mornings | Personal hygiene support, manual handling, medication prompt, meal preparation |
| Gloria Palacio | `gloria@serenity.local` | Thu mornings | Personal hygiene support, manual handling, medication prompt, social engagement |
| Rocio Agudelo | `rocio@serenity.local` | Tue-Wed day shifts | Transport escort, community participation, social engagement |
| Mariana | `mariana@serenity.local` | Tue day shifts | Transport escort, community participation, domestic cleaning |
| Melissa | `melissa@serenity.local` | Sat overnight | Social engagement, medication prompt, meal preparation, manual handling |
| Santiago | `santiago@serenity.local` | Sat-Sun overnight | Social engagement, medication prompt, community participation |

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
3. Confirmar que existe una prestadora, un centro cliente, una sede, una paciente y 7 carers.
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
2. Confirmar que Gabriel ve visitas asignadas.
3. Abrir la visita `confirmed`.
4. Confirmar que el bloque de readiness de ejecucion explica checklist, evidencia e incidencias.
5. Confirmar que `Submit for review` queda bloqueado si falta checklist completo o evidencia.
6. Probar flujo de ejecucion si quieres modificar la demo:
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
3. Confirmar que la pantalla explica el siguiente paso operativo.

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
