# Closing Sync Deep Dive - 2026-04-13

## Proposito

Este documento explica en detalle la ultima capa que construimos en Serenity alrededor de:

- `closing`
- `export jobs`
- estados de sync
- historial de intentos
- runner interno
- handoff hacia una plataforma externa de billing o payroll

La idea es que puedas estudiarlo sin tener que reconstruir toda la logica leyendo codigo.

No es un documento comercial.

Es un documento tecnico-funcional de entendimiento.

---

## 1. Idea principal

Serenity **no procesa pagos**.

Serenity llega hasta un punto anterior:

1. un servicio fue solicitado
2. un carer fue asignado
3. la visita fue ejecutada
4. la visita fue revisada y aprobada
5. el trabajo aprobado se consolida en un periodo de cierre
6. ese periodo se prepara para entregarse a un sistema externo

Esa entrega externa es la capa que estuvimos construyendo.

La funcion de esta capa es:

- preparar datos confiables
- entregarlos a un sistema externo
- dejar trazabilidad de lo enviado
- saber si ese sistema externo acepto o rechazo el handoff

En una frase:

**Serenity cierra la operacion y entrega un paquete de settlement. El sistema externo hace el billing o payroll.**

---

## 2. Donde encaja esta capa en el flujo general

El flujo completo hoy es este:

1. `Center manager` crea o sigue una necesidad
2. `Provider coordinator` crea o gestiona la orden
3. `Provider coordinator` asigna carer y mueve la operacion
4. `Carer` ejecuta visita, checklist, evidencia e incidencia
5. `Provider reviewer` aprueba o rechaza
6. `Provider` entra a `closing`
7. guarda settlement por visita aprobada
8. bloquea el periodo
9. genera `export jobs`
10. el runner procesa esos jobs
11. Serenity registra si el sistema externo:
   - recibio el paquete
   - lo reconocio
   - lo rechazo
12. solo entonces el periodo puede pasar a `exported`

---

## 3. Conceptos clave

### 3.1 Closing period

Un `ClosingPeriod` es una ventana de tiempo donde Serenity agrupa trabajo aprobado.

Ejemplo:

- `Apr 2026 - Week 1`
- `Apr 2026 - Week 2`

Cada periodo tiene estado:

- `open`
- `locked`
- `exported`

Significado:

- `open`: el periodo todavia permite editar settlement y gastos
- `locked`: el periodo ya no deberia cambiar operativamente y esta listo para handoff
- `exported`: ya hubo un handoff suficientemente confirmado hacia el sistema externo

### 3.2 Visit settlement

Por cada visita aprobada dentro del periodo, Serenity puede guardar:

- `approvedMinutes`
- `billableCents`
- `payableCents`

Esto convierte la visita aprobada en una unidad liquidable.

### 3.3 Export package

Es el paquete de datos que Serenity construye para entregar afuera.

Hoy puede descargarse como:

- `json`
- `csv`

El `json` es el formato canonico.

Incluye:

- provider
- periodo
- totales
- visitas
- gastos

### 3.4 Export job

Un `ExportJob` representa un intento de handoff externo.

No es el pago.

Es la unidad de sincronizacion.

Ejemplo:

- enviar el periodo a `mock_payroll_gateway`
- registrar un `manual_handoff`
- simular un fallo con `qa_failure_simulation`

---

## 4. Por que existen los export jobs

Si Serenity marcara un periodo como exportado sin una entidad intermedia, perderiamos trazabilidad.

Necesitamos saber:

- que se quiso enviar
- a donde se quiso enviar
- cuando se envio
- si fallo
- si quedo pendiente de confirmacion
- si fue aceptado
- cuantos intentos hubo

Por eso `ExportJob` es importante.

Es el puente entre:

- cierre operativo interno
- y sistema economico externo

---

## 5. Modelo actual de estados visibles

Decidimos simplificar la experiencia a un solo estado visible por job.

Los estados visibles actuales son:

- `queued`
- `processing`
- `sent`
- `acknowledged`
- `failed`

### 5.1 Que significa cada estado

#### `queued`

El job ya existe pero aun no fue ejecutado.

Todavia no hubo delivery real.

#### `processing`

Serenity esta ejecutando el intento.

Este estado es transitorio.

Sirve para saber que el job esta en curso.

#### `sent`

El conector acepto la entrega inicial.

Todavia falta confirmacion final del sistema externo.

Esto representa:

- "lo mandamos"
- pero no todavia
- "el sistema externo ya lo dejo definitivamente aceptado"

#### `acknowledged`

El sistema externo ya reconocio el payload.

Este es el estado que realmente habilita a Serenity a tratar ese handoff como confirmado.

#### `failed`

El handoff fallo o fue rechazado.

Puede ser:

- fallo tecnico
- rechazo del conector
- rechazo posterior del sistema remoto

---

## 6. Por que simplificamos los estados

Antes habia dos conceptos separados:

- estado interno del job
- estado externo del sync

Eso era tecnicamente valido, pero para producto y operacion diaria resultaba mas confuso.

Ahora la UI y la documentacion trabajan con un solo estado visible.

Internamente todavia conservamos metadata adicional para no romper compatibilidad ni perder informacion tecnica.

Eso da dos beneficios:

1. el usuario entiende mejor el flujo
2. el modelo tecnico todavia puede crecer hacia integraciones reales

---

## 7. Estructura de un export job

Hoy un `ExportJob` guarda, entre otros, estos campos importantes:

- `closingPeriodId`
- `targetSystem`
- `format`
- `status`
- `attemptCount`
- `externalReference`
- `lastError`
- `queuedAt`
- `nextAttemptAt`
- `lastAttemptAt`
- `completedAt`
- `acknowledgedAt`
- `connectorCode`
- `connectorMessage`
- `payload`

### 7.1 Los mas importantes para entender la operacion

#### `targetSystem`

Indica hacia que destino se envía el handoff.

Hoy tenemos:

- `manual_handoff`
- `mock_payroll_gateway`
- `qa_failure_simulation`

#### `attemptCount`

Cuantas veces se intento trabajar ese job.

#### `externalReference`

Identificador que el sistema o conector externo devuelve.

Sirve para trazabilidad cruzada.

#### `lastError`

Ultimo error conocido del job.

#### `nextAttemptAt`

Este campo es nuevo y muy importante.

Define cuando el job vuelve a ser elegible para procesamiento automatico.

Es la base de la ejecucion programable.

#### `acknowledgedAt`

Marca el momento en que el sistema externo acepto el handoff.

---

## 8. Historial de intentos

Tambien agregamos `ExportJobAttempt`.

Esto existe porque un solo job puede tener varios eventos operativos:

- intento de delivery
- chequeo remoto posterior
- retry

Si guardas solo el estado final del job, pierdes historia.

Con `ExportJobAttempt` ahora Serenity puede conservar una linea de tiempo mas real.

### 8.1 Que guarda cada intento

Cada intento puede guardar:

- `kind`
- `result`
- `startedAt`
- `completedAt`
- `connectorCode`
- `connectorMessage`
- `errorMessage`
- `requestPayload`
- `responsePayload`

### 8.2 Tipos de intento actuales

- `delivery`
- `status_check`

### 8.3 Resultados posibles del intento

- `sent`
- `acknowledged`
- `failed`

### 8.4 Para que sirve esto

Sirve para:

- debugging
- auditoria tecnica
- soporte
- explicar por que un job termino en cierto estado
- construir observabilidad futura

---

## 9. Diferencia entre delivery y status check

Esto es central para entender la capa.

### 9.1 Delivery

Es el primer intento de entrega del paquete.

Ejemplo:

- Serenity arma el payload
- llama al conector
- el conector lo acepta o lo rechaza

Resultado posible:

- `failed`
- `sent`
- en algunos casos `acknowledged`

### 9.2 Status check

Es un chequeo posterior para jobs que ya quedaron en `sent`.

Se usa cuando:

- la entrega inicial salio bien
- pero falta saber si el sistema externo ya acepto definitivamente el paquete

Resultado posible:

- sigue `sent`
- pasa a `acknowledged`
- pasa a `failed`

En una integracion real, este `status_check` podria luego reemplazarse o complementarse con:

- polling real
- webhook real
- callback del partner

---

## 10. El runner interno

La capa mas nueva de todas es el runner interno.

Antes teniamos:

- crear job
- procesar manualmente
- chequear manualmente

Ahora tenemos una base para que el sistema pueda hacerlo sin sesion humana.

### 10.1 Endpoint interno

Ruta:

- `POST /api/internal/export-jobs/run`

Archivo:

- [src/app/api/internal/export-jobs/run/route.ts](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/src/app/api/internal/export-jobs/run/route.ts)

### 10.2 Seguridad

El endpoint no usa login del producto.

Usa secreto interno:

- `INTERNAL_SYNC_SECRET`

Puede autenticarse por:

- header `x-serenity-sync-secret`
- o `Authorization: Bearer ...`

Esto esta pensado para:

- Dokploy cron
- job scheduler
- heartbeat futuro
- runner externo de infraestructura

### 10.3 Que hace el runner

Cuando recibe la llamada:

1. busca jobs cuyo `nextAttemptAt` ya vencio
2. limita cuantos procesa
3. si el job estaba `queued`, corre `delivery`
4. si el job estaba `sent`, corre `status_check`
5. actualiza el estado
6. actualiza `nextAttemptAt` si corresponde
7. devuelve un resumen JSON

### 10.4 Respuesta del endpoint

Devuelve algo de este estilo:

```json
{
  "ranAt": "2026-04-13T01:54:52.546Z",
  "limit": 10,
  "summary": {
    "scanned": 1,
    "processedQueued": 0,
    "checkedSent": 1,
    "acknowledged": 1,
    "stillPending": 0,
    "failed": 0
  }
}
```

Eso es util para:

- cron logs
- monitoring
- debugging rapido

---

## 11. Como se decide el siguiente intento

La logica actual es simple y deliberadamente conservadora.

### 11.1 Si el job queda `queued`

Cuando se crea:

- `nextAttemptAt` se inicializa para ejecucion inmediata

### 11.2 Si el delivery lo deja `sent`

Serenity programa un nuevo chequeo:

- hoy: `5` minutos despues

### 11.3 Si queda `acknowledged`

No necesita nuevo intento.

Entonces:

- `nextAttemptAt = null`

### 11.4 Si queda `failed`

No se vuelve a intentar automaticamente.

Entonces:

- `nextAttemptAt = null`

El retry sigue siendo una accion controlada.

Esto es importante para no reintentar indefinidamente sin criterio.

---

## 12. Reglas de negocio actuales

### 12.1 Regla de lock

Un periodo no puede pasar a `locked` si:

- hay visitas aprobadas en ese periodo
- y no todas tienen settlement

### 12.2 Regla de exported

Un periodo no puede pasar a `exported` si:

- no tiene al menos un job `acknowledged`

Esta regla existe para evitar que Serenity "mienta" y marque un handoff como final cuando en realidad no hubo confirmacion suficiente.

### 12.3 Regla de responsabilidad

Serenity:

- prepara
- entrega
- traza
- confirma handoff

La plataforma externa:

- calcula billing o payroll
- ejecuta pago
- maneja impuestos, cuentas y dinero

---

## 13. Como se integra con la app que hara billing

Esta es la parte mas importante para estudiar.

### 13.1 Que espera Serenity de la app externa

Serenity no necesita que la app externa conozca toda la operacion clinica.

Lo que Serenity entrega es:

- periodo
- visitas aprobadas
- approved minutes
- billable
- payable
- gastos
- identificadores estables

En otras palabras:

**Serenity entrega unidades liquidadas o listas para liquidar.**

### 13.2 Que deberia hacer la app externa

La app externa deberia:

- recibir el payload
- validarlo
- crear su propio registro interno
- devolver una referencia externa
- eventualmente confirmar recepcion o rechazo
- continuar con billing/payroll fuera de Serenity

### 13.3 Qué integración existe hoy

Hoy la integracion es una base operativa, no una integracion productiva.

Tenemos:

- payload estructurado
- `targetSystem`
- conector mock
- confirmacion mock
- runner interno
- historial de intentos

No tenemos todavia:

- partner real
- API real de billing
- webhook real
- OAuth real
- retries por categoria de error

### 13.4 Cómo se vería una integración real

Mas adelante, el camino natural seria:

1. definir un partner real
2. crear un adapter especifico
3. mapear el payload de Serenity al contrato del partner
4. procesar respuesta real del partner
5. guardar `externalReference`
6. confirmar por polling o webhook
7. marcar `acknowledged`

---

## 14. Qué parte es manual y qué parte es automática hoy

### Manual hoy

- crear jobs desde UI
- procesar un job individual desde UI
- chequear un job individual desde UI
- retry de un job fallido
- marcar `acknowledged` o `rejected` manualmente

### Programable hoy

- correr el runner interno por endpoint
- dejar que el runner tome jobs por `nextAttemptAt`
- hacer `delivery` o `status_check` sin sesion humana

### No automática todavía

- ejecución desde cron real en Dokploy
- callback remoto real
- retries inteligentes por política
- connector real de billing

---

## 15. Qué se sembró en la demo

La semilla deja ejemplos útiles para estudiar:

### `manual_handoff`

- ya queda `acknowledged`
- representa un handoff que se considera aceptado inmediatamente

### `mock_payroll_gateway`

- queda `sent`
- tiene `nextAttemptAt`
- representa un caso donde falta confirmacion posterior

### `qa_failure_simulation`

- queda `failed`
- permite estudiar retry y error path

Ademas, cada uno tiene un `ExportJobAttempt` sembrado.

---

## 16. Archivos clave para estudiar el codigo

Si quieres leer el flujo real, estos son los archivos mas importantes.

### Modelo y datos

- [prisma/schema.prisma](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/prisma/schema.prisma)
- [prisma/seed.mjs](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/prisma/seed.mjs)

### Logica principal

- [src/lib/providers-data.ts](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/src/lib/providers-data.ts)
- [src/lib/export-connectors.ts](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/src/lib/export-connectors.ts)
- [src/lib/providers.ts](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/src/lib/providers.ts)

### Acciones y UI

- [src/app/providers/actions.ts](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/src/app/providers/actions.ts)
- [src/components/providers/closing-forms.tsx](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/src/components/providers/closing-forms.tsx)
- [src/app/providers/closing/page.tsx](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/src/app/providers/closing/page.tsx)

### Runner interno

- [src/app/api/internal/export-jobs/run/route.ts](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/src/app/api/internal/export-jobs/run/route.ts)
- [/.env.example](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/.env.example)
- [/.env.dokploy.example](/C:/Users/mgara/OneDrive/Documents/DUS%20Products/SERENITY/.env.dokploy.example)

---

## 17. Qué falta para comprender la siguiente etapa

Si estudias este documento, ya deberias entender:

- por que existen los jobs
- por que simplificamos los estados
- que diferencia hay entre `delivery` y `status_check`
- para que sirve `nextAttemptAt`
- como funciona el runner
- por que Serenity no hace billing directamente

Lo siguiente que te convendria estudiar despues es:

1. como elegir un partner real
2. como diseñar el adapter de ese partner
3. que errores deberian reintentarse automaticamente
4. que confirmacion remota se va a aceptar como `acknowledged`

---

## 18. Resumen corto

La capa que construimos en estas ultimas sesiones hace esto:

- convierte el cierre operativo en jobs de handoff
- simplifica su lectura a un solo estado visible
- guarda historial de intentos
- permite entrega inicial y chequeo posterior
- programa el siguiente intento con `nextAttemptAt`
- expone un endpoint interno seguro para que un cron o runner externo procese la cola

La consecuencia es importante:

**Serenity ya no solo exporta archivos; ahora empieza a comportarse como una capa real de integracion operativa previa al billing externo.**
