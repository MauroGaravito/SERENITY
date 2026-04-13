# Operational Readiness Plan - 2026-04-13

## Proposito

Este documento deja por escrito el plan operativo que estamos ejecutando antes de volver a la capa de integracion externa.

El objetivo es cerrar Serenity como sistema operativo de homecare:

- cobertura,
- reemplazos,
- ejecucion,
- revision,
- excepciones,
- cierre operativo claro.

## Lo que se acaba de completar

### 1. Network control basico

- estados visibles de cobertura por orden y visita:
  - `covered`
  - `at_risk`
  - `uncovered`
  - `needs_replacement`
- `pending action` por orden en dashboard y lista
- reemplazo manual desde detalle de orden
- escalamiento operativo desde detalle de orden
- assignment pool con razones de inelegibilidad

### 2. Carer reliability basica

- readiness del carer:
  - `ready`
  - `attention_needed`
  - `restricted`
- alertas visibles por credenciales vencidas o proximas a vencer
- limites operativos visibles en el workspace del carer
- matching provider mas explicable:
  - skills faltantes
  - credencial expirada o pendiente
  - falta de bloque de disponibilidad
  - mismatch de idioma

### 3. Exception flows demo

- soporte visible para `cancelled`
- soporte visible para `no_show`
- estos casos ahora empujan el lenguaje de `replacement needed`
- la demo seed ya incluye escenarios para mostrar cobertura rota

### 4. UX operativa

- dashboard provider ahora prioriza acciones reales
- orders list muestra cobertura y accion pendiente
- order detail muestra cobertura, escalamiento y restricciones del pool
- workspace carer muestra readiness, alertas y limites
- closing muestra que visitas quedan fuera del settlement y por que

## Lo que todavia falta para cerrar la capa operativa

Esto es lo que queda pendiente antes de dar la capa operativa por totalmente cerrada:

### 1. Validacion end-to-end con base levantada

- correr `db:seed` con Postgres activo
- probar localmente:
  - `/providers`
  - `/providers/orders`
  - `/providers/orders/[id]`
  - `/carers`
- confirmar que los nuevos casos demo se ven como esperamos

### 2. Pulido final de UX

- microcopy final en provider y carer
- jerarquia visual mas consistente en paneles con muchas acciones

## Criterio de cierre operativo

La capa operativa se puede considerar cerrada cuando:

1. provider puede detectar cobertura rota, reemplazar y escalar
2. center puede entender riesgo y seguimiento sin operar el provider
3. carer puede ver readiness y limites de perfil con claridad
4. los escenarios `cancelled` y `no_show` ya no rompen la narrativa demo
5. closing deja claro que entra y que no entra al settlement
6. closing queda claramente separado de la integracion externa

## Nota de entorno

El codigo de este bloque ya compila.

La validacion completa con `db:seed` queda condicionada a tener Docker/Postgres arriba en el entorno local.
