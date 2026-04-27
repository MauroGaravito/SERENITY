# Estado Actual de la Demo y Pruebas Manuales

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

Serenity modela una red de homecare donde una prestadora coordina servicios para varios centros de cuidado. Los centros crean o necesitan demanda, la prestadora coordina cobertura y los cuidadores ejecutan visitas. Las visitas aprobadas alimentan el cierre operativo y luego se preparan para exportacion externa.

La demo local esta configurada con:

- 1 prestadora.
- 3 centros de cuidado.
- 3 sedes.
- 3 recipients.
- 2 usuarios provider.
- 3 center managers.
- 7 carers independientes.
- 3 ordenes de servicio.
- 7 visitas.
- 2 closing periods.
- export jobs y audit events sembrados.

## Organizaciones y responsables

### Prestadora

| Organizacion | Tipo | Responsable principal | Email |
| --- | --- | --- | --- |
| Serenity Homecare Antioquia | Provider | Mauricio Garavito | `mauricio@serenity.local` |

### Equipo provider

| Persona | Rol | Que valida |
| --- | --- | --- |
| Mauricio Garavito | Provider coordinator | Dashboard, ordenes, cobertura, closing, external export y audit trail |
| Diana Chaverra | Provider reviewer | Revision/aprobacion de visitas y consulta operativa provider |

### Centros

| Centro | Sede | Barrio | Manager | Email |
| --- | --- | --- | --- | --- |
| Centro de Cuidado Niquia | Sede Niquia | Niquia | Laura Garavito | `laura@serenity.local` |
| Centro de Cuidado Cabanas | Sede Cabanas | Cabanas | Jose Garavito | `jose@serenity.local` |
| Centro de Cuidado Bello Centro | Sede Bello Centro | Bello Centro | Juan Correa | `juan@serenity.local` |

### Recipients

| Recipient | Centro | Orden principal |
| --- | --- | --- |
| Rosalba | Centro de Cuidado Niquia | `SR-2401` |
| Elizabeth Chaverra | Centro de Cuidado Cabanas | `SR-2402` |
| Betzabeth Agudelo | Centro de Cuidado Bello Centro | `SR-2403` |

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

## Ordenes sembradas

| Orden | Centro | Recipient | Tipo | Estado | Prioridad | Lectura operativa |
| --- | --- | --- | --- | --- | --- | --- |
| `SR-2401` | Centro de Cuidado Niquia | Rosalba | Personal Care | Partially assigned | High | Orden parcialmente cubierta; sirve para probar cobertura, reemplazos y visitas del carer |
| `SR-2402` | Centro de Cuidado Cabanas | Elizabeth Chaverra | Community Access | Active | Medium | Orden activa con visita en review y visita aprobada lista para closing/export |
| `SR-2403` | Centro de Cuidado Bello Centro | Betzabeth Agudelo | Companionship | Open | Critical | Orden critica con cobertura rota/no-show; sirve para probar riesgo y accion prioritaria |

## Visitas sembradas

| Orden | Estado de visita | Cuidador | Para que sirve |
| --- | --- | --- | --- |
| `SR-2401` | Approved | Gabriel Ramirez | Alimenta `Apr 2026 - Week 1` en closing |
| `SR-2401` | Confirmed | Gabriel Ramirez | Permite probar el workspace del carer |
| `SR-2401` | Scheduled | Sin asignar | Permite probar asignacion o replacement |
| `SR-2401` | Cancelled | Alvaro Ramirez | Muestra excepcion de cobertura |
| `SR-2402` | Under review | Rocio Agudelo | Permite probar aprobacion/rechazo con reviewer |
| `SR-2402` | Approved | Rocio Agudelo | Alimenta `Apr 2026 - Week 2` y external export |
| `SR-2403` | Scheduled / No-show | Sin asignar / Melissa | Muestra riesgo critico, cobertura rota y outside settlement |

## Closing, export y audit

### Closing periods

| Periodo | Estado | Contenido esperado |
| --- | --- | --- |
| Apr 2026 - Week 1 | Open | 1 visita aprobada de `SR-2401`; todavia acepta cambios |
| Apr 2026 - Week 2 | Locked | 1 visita aprobada de `SR-2402`; listo para external export |

### External export

`Apr 2026 - Week 2` tiene jobs sembrados para validar varios estados:

- `manual_handoff`: acknowledged.
- `xero_custom_connection`: acknowledged en sandbox.
- `mock_payroll_gateway`: sent, esperando acknowledgement.
- `qa_failure_simulation`: failed/rejected, listo para retry.

### Audit trail

El audit trail debe mostrar eventos como:

- orden creada,
- visita asignada,
- visita aprobada,
- visita movida a under review,
- orden critica creada.

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
- Los filtros abren ordenes relevantes y no tarjetas duplicadas.

### 3. Orders y modal de nueva orden

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
6. Abrir `SR-2401`, `SR-2402` y `SR-2403`.

Resultado esperado:

- La lista sigue siendo el centro de la pantalla.
- El formulario no empuja las ordenes hacia abajo.
- El formulario separa demanda, agenda, requisitos, instrucciones e internos.
- Una orden valida redirige al detalle para continuar cobertura/asignacion.
- Ordenes sin skills, con ventana invalida o con duracion mayor que la ventana quedan bloqueadas.
- Cada orden abre su detalle correctamente.

### 4. Review con provider reviewer

Usuario:

```text
diana@serenity.local
```

Pruebas:

1. Entrar a `/providers/orders`.
2. Abrir `SR-2402`.
3. Ubicar la visita en `under_review`.
4. Verificar que existen controles de review.
5. Probar approve o reject solo si quieres modificar el estado de la demo.

Resultado esperado:

- Diana puede revisar visitas.
- El coordinator no debe ser el usuario principal para aprobar/rechazar.

### 5. Center managers

Usuarios:

```text
laura@serenity.local
jose@serenity.local
juan@serenity.local
```

Pruebas:

1. Entrar con Laura y confirmar que ve informacion de Niquia / `SR-2401`.
2. Entrar con Jose y confirmar que ve Cabanas / `SR-2402`.
3. Entrar con Juan y confirmar que ve Bello Centro / `SR-2403`.
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
2. Confirmar que aparecen `Apr 2026 - Week 1` y `Apr 2026 - Week 2`.
3. Confirmar que Week 1 esta `Open`.
4. Confirmar que Week 2 esta `Locked`.
5. Confirmar que las visitas fuera de settlement muestran motivo.

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
2. Confirmar que Week 2 tiene paquete exportable.
3. Descargar JSON.
4. Descargar CSV.
5. Confirmar que existen jobs acknowledged, sent y failed.
6. Probar `Retry` en el job fallido solo si quieres modificar la demo.

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
2. Confirmar que se ven eventos criticos.
3. Abrir una orden y comparar que su historia operativa tenga sentido.

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
- Colombia y Australia pueden reseedearse sin romper build ni typecheck.
