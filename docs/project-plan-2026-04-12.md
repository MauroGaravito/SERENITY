# Project Plan - 2026-04-12

## Proposito

Este documento define el plan rector del proyecto Serenity hasta alcanzar el limite de producto acordado.

Ese limite no es construir un sistema financiero completo ni un EMR clinico.

El objetivo es llegar a un producto usable para homecare en Australia que cubra:

- gestion de la demanda,
- acceso a servicios,
- coordinacion operativa,
- prestacion del servicio,
- revision,
- y cierre operativo listo para integrarse con plataformas externas de payroll o pago.

## Definicion del limite del producto

Serenity debe llegar hasta el punto en que un servicio pueda quedar:

1. solicitado,
2. asignado,
3. ejecutado,
4. evidenciado,
5. revisado,
6. aprobado,
7. consolidado por periodo,
8. listo para exportacion o integracion con una plataforma externa.

Serenity no debe encargarse de:

- procesar pagos,
- almacenar informacion bancaria,
- administrar impuestos o superannuation,
- ejecutar payroll,
- contabilidad general,
- EMR clinico.

## Definicion breve del producto

Serenity es una plataforma operativa para homecare en Australia que conecta centros, prestadoras y carers para convertir cada servicio en una prestacion trazable, ejecutable, revisable y exportable hacia sistemas externos de cierre economico.

## Alcance objetivo

### 1. Demand and Access

- centros
- facilities
- recipients
- ordenes de servicio
- service types
- skills
- requerimientos por idioma o restricciones basicas

### 2. Coverage and Coordination

- matching basico
- elegibilidad por skills y credenciales
- asignacion
- reemplazo
- visibilidad de cobertura
- alertas operativas

### 3. Field Execution

- agenda del carer
- detalle de visita
- checklist
- evidencia
- incidencias
- cambio de estados de visita

### 4. Review and Compliance

- cola de revision
- aprobacion o rechazo
- trazabilidad
- auditoria por orden y visita

### 5. Operational Closure

- periodos de cierre
- minutos aprobados
- gastos o kilometraje aprobables
- estado de exportacion
- base para integracion con sistemas externos

## Fuera de alcance

No forma parte del plan actual:

- payroll nativo
- wallet o pagos directos
- transferencias bancarias
- liquidacion fiscal
- contabilidad general
- EMR
- portal de pacientes o familiares
- marketplace abierto
- telemedicina

## Estructura del plan

### Fase A. Operations Core

Objetivo:

Lograr que el flujo principal de homecare sea demostrable end-to-end.

Incluye:

- provider dashboard
- center demand
- ordenes de servicio
- service types y skills cerradas
- matching basico
- visitas
- checklist
- evidencia
- incidencias
- review
- auditoria

Estado actual:

- ampliamente avanzado

Pendientes principales:

- mejorar seed demo del carer para mostrar mejor flujo operativo
- revisar UX de algunos flujos de estado
- endurecer algunos escenarios de elegibilidad

### Fase B. Carer Profile and Reliability

Objetivo:

Volver al carer un operador confiable y administrable.

Incluye:

- disponibilidad
- credenciales
- alertas de vencimiento
- perfil profesional basico

Estado actual:

- iniciada en base operativa

Dependencia:

- que la Fase A sea suficientemente estable para demos

### Fase C. Network Control

Objetivo:

Dar a provider y center control operativo mas real.

Incluye:

- reemplazos
- escalamiento
- alertas de cobertura
- score operativo
- reportes por periodo

Estado actual:

- parcialmente iniciado de forma simple

### Fase D. Operational Closure

Objetivo:

Cerrar el trabajo operativo para exportarlo a un sistema financiero externo.

Incluye:

- periodos de cierre
- horas o minutos aprobados
- gastos y kilometraje listos para consolidacion
- export o integracion
- estado `ready for settlement/export`

Estado actual:

- avanzada con UI de periodos, settlements y gastos basicos
- incluye export package manual en `json` y `csv`
- incluye regla de `exported` despues de sync `acknowledged`

### Fase E. External Finance Integration

Objetivo:

Permitir integracion segura con plataformas externas de payroll o pago.

Incluye:

- formato de export estable
- identificadores consistentes
- trazabilidad de exportacion
- estado de sincronizacion

No incluye:

- ejecucion del pago
- payroll propio

Estado actual:

- iniciada con export jobs, ciclo visible simplificado de sync, acuse externo mock y retry

## Prioridad recomendada

Orden recomendado de ejecucion:

1. estabilizar Fase A
2. completar Fase B
3. fortalecer Fase C
4. construir Fase D
5. definir e implementar Fase E

## Criterio de producto usable

Se puede considerar que Serenity llego al limite usable planeado cuando:

1. un centro puede crear y seguir demanda real,
2. una prestadora puede cubrir, asignar, revisar y auditar,
3. un carer puede ejecutar visitas con evidencia e incidencias,
4. el sistema puede consolidar trabajo aprobado por periodo,
5. existe una forma clara y confiable de exportar o integrar esos datos con una plataforma externa.

## Estimacion de avance actual

Estimacion aproximada al 2026-04-12:

**79% del alcance objetivo total**

## Como se calcula ese 79%

### Ya bastante avanzado

- modelo multi-actor
- login y permisos
- provider workflow
- center workflow
- catalogos cerrados iniciales
- Fase 1 del carer
- base de Fase 2 del carer
- auditoria
- workspace inicial de cierre operativo

### Parcialmente avanzado

- matching
- carer execution flow como demo
- reglas de exportacion externa
- formato inicial de export package
- trazabilidad basica de exportacion
- sync jobs con estado visible simplificado, acuse externo mock y retry

### Todavia faltante

- alertas de vencimiento
- reemplazos y escalamiento mas robustos
- sincronizacion externa real con confirmacion remota
- seed demo optimizado para cierre completo

## Interpretacion del porcentaje
El 79% no significa que falte poco.

Significa que:

- el nucleo conceptual ya esta bastante claro,
- la demo ya es funcional,
- pero aun falta una parte importante para que el producto sea operacionalmente completo y listo para conectarse bien con sistemas externos.

## Hitos recomendados

### Hito 1. Demo operacional estable

Condicion:

- provider, center y carer se pueden demostrar sin friccion mayor

### Hito 2. Carer confiable

Condicion:

- disponibilidad y credenciales ya viven en la app de forma operativa

### Hito 3. Control de red

Condicion:

- reemplazos, alertas y control por periodo son demostrables

### Hito 4. Cierre operativo exportable

Condicion:

- existe consolidacion aprobada y exportable

### Hito 5. Integracion externa

Condicion:

- Serenity entrega datos listos para integrarse con un sistema externo de payroll o pagos

## Momento ideal para pasar a Fase 2

Tiene sentido comenzar Fase B, que corresponde a la Fase 2 del carer, cuando se cumplan estas condiciones:

1. la demo actual de Fase A ya sea suficiente para mostrar ejecucion y review,
2. el principal vacio deje de ser la visita y pase a ser el perfil operativo del carer,
3. el equipo quiera mejorar confiabilidad y elegibilidad mas que solo demo.

La senal correcta es:

**cuando el producto ya pueda demostrar bien la visita, pero todavia no pueda demostrar bien la gestion del cuidador.**

## Recomendacion inmediata

Lo siguiente mas sensato ya no es seguir ampliando UI operativa general.

Lo correcto ahora es:

1. pasar de sync mock a ejecucion asincrona real
2. guardar confirmacion remota real del sistema receptor
3. endurecer manejo de errores y reintentos
4. definir conectores especificos por partner
5. solo despues decidir sincronizacion bidireccional

## Regla de decision para nuevas features

Cada nueva funcionalidad debe responder a una pregunta:

**Esto ayuda a solicitar, cubrir, ejecutar, revisar o cerrar operativamente un servicio de homecare?**

Si la respuesta es:

- `si`: probablemente entra
- `no`: probablemente debe quedar fuera o ir a una integracion externa

