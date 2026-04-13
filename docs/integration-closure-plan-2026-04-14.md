# Integration Closure Plan - 2026-04-14

## Proposito

Este documento aterriza el cierre de la capa de integracion externa de Serenity.

La meta no es que Serenity pague.

La meta es que Serenity quede lista para:

- handoff real,
- trazabilidad real,
- y pruebas reales contra una plataforma externa de billing o payroll.

## Decisiones ya tomadas

### Primer partner recomendado

- `Xero`

### Tipo de conexion inicial

- `Xero Custom Connection`

### Formato principal

- `JSON` por API

### Regla de acknowledgement

Para `xero_custom_connection`, Serenity considera `acknowledged` cuando:

1. el handoff devuelve `HTTP 2xx`
2. la respuesta devuelve una referencia externa estable

## Lo que ya esta implementado

- target system `xero_custom_connection`
- adapter en `src/lib/export-connectors.ts`
- modo `sandbox`
- modo `auth_only`
- modo `direct_post`
- configuracion por entorno
- soporte de UI para encolar jobs Xero
- semilla demo con job Xero acknowledged
- runner interno capaz de procesar jobs Xero

## Significado de cada modo

### `sandbox`

- no hace delivery externo real
- confirma el flujo con acknowledgement inmediato
- sirve para demos y validacion interna

### `auth_only`

- hace autenticacion real contra Xero
- no hace POST a un endpoint downstream
- sirve para validar credenciales y conectividad

### `direct_post`

- hace autenticacion real
- hace POST real al `XERO_HANDOFF_URL`
- usa la regla `2xx + external reference = acknowledged`

## Variables de entorno necesarias

- `XERO_CONNECTION_MODE`
- `XERO_TOKEN_URL`
- `XERO_CLIENT_ID`
- `XERO_CLIENT_SECRET`
- `XERO_HANDOFF_URL`

## Lo que falta para test real de integracion

### 1. Credenciales reales

Hace falta:

- crear la Custom Connection en Xero
- obtener `client_id`
- obtener `client_secret`

### 2. Endpoint real de handoff

Hace falta decidir una de estas dos opciones:

- endpoint intermedio propio que reciba el closing package y lo traduzca a Xero
- endpoint Xero especifico si ya se decide el objeto final de negocio

## 3. Decision funcional pendiente

Todavia falta definir que objeto real se quiere crear o afectar en Xero:

- invoice
- bill
- draft accounting record
- files/attachment handoff
- middleware propio antes de Xero

Esta es la principal decision pendiente de la capa de integracion.

## Recomendacion para avanzar

El siguiente paso correcto es:

1. crear una Custom Connection real en Xero
2. correr `auth_only`
3. validar token exchange real
4. luego decidir el endpoint final para `direct_post`
5. correr el primer test de handoff real con referencia externa

## Definition of done de la capa de integracion

La capa de integracion puede considerarse lista para test real cuando Serenity logre:

1. autenticar contra Xero con credenciales reales
2. enviar un closing package real a un endpoint definido
3. guardar `externalReference`
4. dejar el job `acknowledged`
5. permitir retry controlado cuando falle
6. dejar auditoria y attempt history suficiente para soporte
