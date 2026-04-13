# External Export Spec - 2026-04-12

## Proposito

Este documento define la primera especificacion de exportacion externa para Serenity.

No describe una integracion completa con payroll.

Describe la capa de handoff que Serenity debe producir para que una plataforma externa pueda tomar trabajo ya aprobado y consolidado.

## Principio rector

Serenity no paga.

Serenity prepara y entrega un paquete de cierre operativo con identificadores estables, montos aprobados y trazabilidad suficiente para que un sistema externo procese el paso siguiente.

## Estado actual implementado

Hoy Serenity ya soporta:

- periodos `open`, `locked` y `exported`
- settlements por visita aprobada
- approved minutes
- billable y payable
- gastos basicos por visita aprobada
- descarga de export package en `json`
- descarga de export package en `csv`
- auditoria de descarga del export package
- export jobs explicitos
- un estado visible unico por job:
  - `queued`
  - `processing`
  - `sent`
  - `acknowledged`
  - `failed`
- numero de intentos por job
- ejecucion por lote de jobs encolados
- chequeo remoto separado para jobs `sent`
- historial de intentos por job
- referencia externa mock cuando el sync fue exitoso
- procesamiento de entrega por job
- confirmacion o rechazo externo simulado
- retry de jobs fallidos

Internamente, Serenity todavia conserva metadata tecnica compatible para el conector y la migracion futura, pero la UI y la operacion trabajan con un solo estado visible.

## Regla de exportabilidad

Un periodo solo se puede exportar cuando:

1. esta en estado `locked` o `exported`
2. todas las visitas aprobadas dentro del periodo ya tienen settlement
3. existe al menos un `export job` visible como `acknowledged`

Un periodo `open` no debe exponer paquete de exportacion.

## Ruta actual

La ruta actual del export package es:

- `GET /providers/closing/export/[id]`

Formatos soportados:

- `json`
- `csv`

El formato por defecto es `json`.

El `csv` se obtiene con:

- `GET /providers/closing/export/[id]?format=csv`

## Identificadores estables

La primera version usa estos identificadores:

- `closingPeriod.id`
- `visit.id`
- `visitSettlement.id`
- `serviceOrder.id`
- `serviceOrder.code`
- `careRecipient.id`
- `careRecipient.externalRef` cuando existe
- `assignedCarerId` cuando existe
- `exportBatchId`

## Export batch id

La version actual usa:

- `serenity-{closingPeriod.id}`

Eso funciona como identificador estable del paquete por periodo.

## Version del esquema

La version actual del payload es:

- `serenity-closing-export-v1`

## Estructura del JSON

El paquete JSON contiene:

### Encabezado

- `schemaVersion`
- `exportBatchId`
- `generatedAt`

### Provider

- `provider.id`
- `provider.displayName`
- `provider.legalName`
- `provider.timezone`

### Closing period

- `closingPeriod.id`
- `closingPeriod.label`
- `closingPeriod.status`
- `closingPeriod.startsAt`
- `closingPeriod.endsAt`

### Totales

- `totals.visits`
- `totals.approvedMinutes`
- `totals.billableCents`
- `totals.payableCents`
- `totals.expenseCents`

### Visitas

Cada visita exportada incluye:

- `visitId`
- `settlementId`
- `serviceOrderId`
- `orderCode`
- `orderTitle`
- `recipientId`
- `recipientExternalRef`
- `recipientName`
- `assignedCarerId`
- `carerName`
- `serviceType`
- `scheduledStart`
- `scheduledEnd`
- `actualStart`
- `actualEnd`
- `approvedMinutes`
- `billableCents`
- `payableCents`
- `currency`
- `expenses[]`

### Gastos

Cada gasto exportado incluye:

- `id`
- `type`
- `amountCents`
- `currency`
- `note`
- `evidenceUrl`
- `createdAt`

## Estructura del CSV

El CSV actual es una vista derivada del paquete JSON.

Produce una fila por visita exportada e incluye:

- identificadores del periodo
- identificadores de la visita y settlement
- order code
- recipient
- carer
- ventana horaria
- approved minutes
- billable cents
- payable cents
- total de gastos de la visita
- cantidad de gastos

## Trazabilidad actual

Cada descarga del export package crea un `AuditEvent`.

El evento guarda:

- `periodId`
- `exportBatchId`
- `format`
- `visits`

El resumen actual del audit event indica:

- que se descargo un paquete de exportacion
- para que periodo
- y en que formato

Cada sync job tambien crea trazabilidad operativa con:

- `periodId`
- `jobId`
- `targetSystem`
- `status`
- `externalReference` cuando existe
- `error` cuando falla

Cada intento del job ahora tambien puede conservar:

- `kind`
- `result`
- `startedAt`
- `completedAt`
- `connectorCode`
- `connectorMessage`
- `errorMessage`

## Sync jobs actuales

La base actual de sync trabaja con jobs asociados al `closingPeriod`.

Cada job guarda:

- `targetSystem`
- `format`
- `status`
- `attemptCount`
- `externalReference`
- `lastError`
- `queuedAt`
- `lastAttemptAt`
- `completedAt`
- `acknowledgedAt`
- `connectorCode`
- `connectorMessage`
- `payload`
- `attempts[]`

Targets demo actuales:

- `mock_payroll_gateway`
- `manual_handoff`
- `qa_failure_simulation`

## Lo que aun no hace

Esta especificacion actual todavia no cubre:

- procesamiento asincrono real por cola o worker
- callback o webhook remoto real
- versionado por partner externo
- multiples formatos por partner
- mapeos especificos por proveedor de payroll
- secretos o autenticacion real hacia conectores externos

## Siguiente evolucion recomendada

La siguiente capa sobre esta especificacion deberia incluir:

1. ejecucion desacoplada por worker, cron o heartbeat
2. confirmacion remota real del sistema receptor
3. politicas de retry mas robustas
4. mensajes de error mas estructurados
5. conectores por plataforma externa
6. observabilidad tecnica de integracion
