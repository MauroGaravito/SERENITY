# Serenity - Fuente Base para NotebookLM

Fecha: 2026-04-12

## Proposito de este documento

Este documento esta pensado como una fuente unica para cargar en NotebookLM y responder preguntas sobre Serenity.

La intencion es que una persona pueda preguntar:

- que es Serenity,
- para quien sirve,
- que puede hacer hoy,
- que no puede hacer todavia,
- como funciona cada actor,
- como se ve un flujo demo,
- y cual es el alcance actual del producto.

Este documento no describe una vision teorica amplia. Describe principalmente el estado actual de la app demo y su direccion inmediata.

## Que es Serenity

Serenity es una plataforma operativa para redes de cuidado domiciliario o `homecare`.

Su objetivo es coordinar a tres actores que normalmente trabajan con friccion y baja trazabilidad:

1. centros de cuidado que necesitan solicitar y monitorear servicios,
2. empresas prestadoras que coordinan cobertura, asignacion, ejecucion y revision,
3. cuidadores independientes que ejecutan visitas y necesitan operar con orden.

La idea central de Serenity es que cada servicio se convierta en una prestacion verificable:

- alguien solicita el servicio,
- alguien lo asigna,
- alguien lo ejecuta,
- alguien lo revisa,
- y el sistema deja trazabilidad.

## Problema que Serenity busca resolver

En homecare, la demanda, la coordinacion operativa y la ejecucion en terreno suelen estar separadas.

Eso genera problemas como:

- cobertura incompleta o tardia,
- mala asignacion de personal,
- dificultad para saber que ocurrio realmente,
- evidencia dispersa,
- disputas sobre horas o cumplimiento,
- baja profesionalizacion del cuidador independiente.

Serenity busca unificar ese circuito.

## Que no es Serenity

Serenity no es:

- un EMR clinico,
- un ERP contable completo,
- una app para familiares o pacientes,
- un marketplace abierto sin control de calidad,
- un sistema financiero completo en su estado actual.

## Actor principal actual del producto

El actor principal actual es la empresa prestadora.

La app esta construida hoy con esta prioridad:

1. provider,
2. center,
3. carer.

Esto significa que la experiencia mas madura en la demo es la de la prestadora.

## Estado actual de la app

La app ya funciona como una demo operativa multi-actor.

Hoy permite mostrar el flujo general de:

1. crear una orden o solicitud de servicio,
2. asignar cobertura,
3. ejecutar una visita,
4. revisar una visita,
5. dejar auditoria.

El producto todavia no cubre de forma completa:

- facturacion,
- liquidacion,
- gastos y kilometraje desde UI,
- carga real de archivos,
- gestion completa de disponibilidad y credenciales del cuidador.

## Actores y capacidades actuales

### Provider coordinator

Es el usuario de coordinacion operativa de la prestadora.

Puede hoy:

- ver dashboard operativo,
- ver ordenes de servicio,
- crear ordenes,
- editar ordenes,
- agregar visitas,
- asignar carers elegibles,
- cambiar estados operativos de visitas,
- ver auditoria, evidencia, checklist e incidentes.

No puede hoy:

- aprobar o rechazar visitas,
- gestionar un cierre financiero completo,
- crear incidentes desde una UI dedicada del provider.

### Provider reviewer

Es el usuario de revision operativa.

Puede hoy:

- ver todo lo que ve provider,
- revisar visitas en `under_review`,
- aprobar o rechazar visitas,
- dejar trazabilidad de la revision.

### Center manager

Es el usuario del centro de cuidado.

Puede hoy:

- ver demanda y cumplimiento,
- crear solicitudes de servicio,
- ver sus propias ordenes,
- abrir el detalle de una orden,
- ver cobertura, evidencia, incidentes y review,
- ver auditoria.

No puede hoy:

- asignar carers,
- mover estados de visitas,
- aprobar o rechazar visitas,
- editar la operacion fina del provider.

### Carer

Es el cuidador independiente.

La Fase 1 del carer ya existe.

Puede hoy:

- ver sus visitas asignadas,
- abrir el detalle de una visita,
- ver instrucciones y skills requeridas,
- completar checklist basica,
- agregar evidencia basica por referencia o URL,
- reportar incidencias simples,
- ver sus skills verificadas.

No puede hoy:

- gestionar disponibilidad,
- gestionar credenciales,
- recibir alertas de vencimiento,
- subir archivos reales,
- gestionar gastos o kilometraje,
- ver un backoffice completo.

## Catalogos cerrados actuales

La app ya usa catalogos cerrados para mantener consistencia operativa.

### Service types actuales

- `Domestic Assistance`
- `Community Access`
- `Personal Care`
- `Companionship`

### Skills actuales

- `Domestic cleaning`
- `Meal preparation`
- `Transport escort`
- `Community participation`
- `Personal hygiene support`
- `Manual handling`
- `Medication prompt`
- `Social engagement`

## Por que se usan catalogos cerrados

Los catalogos cerrados sirven para:

- mantener consistencia entre formularios y datos,
- hacer matching mas claro,
- evitar texto libre desordenado,
- facilitar automatizacion,
- permitir futura integracion con herramientas como MCP o procesos asistidos.

La recomendacion actual del producto es separar tres conceptos:

- `service type`: categoria visible del servicio,
- `skills`: capacidades necesarias para ejecutarlo,
- `credentials`: verificaciones o habilitaciones del cuidador.

## Datos demo actuales

La demo actual tiene:

- una prestadora: `Serenity Care Partners`
- tres centros:
  - `Harbour View Care`
  - `Evergreen Support Services`
  - `BlueWattle Homecare`
- tres recipients:
  - `Maria Thompson`
  - `George Hill`
  - `Elaine Cooper`

### Ordenes demo actuales

#### SR-2401

- titulo: `Morning personal care support`
- service type: `Personal Care`
- centro: `Harbour View Care`
- recipient: `Maria Thompson`
- estado inicial demo: `partially_assigned`
- prioridad: `high`

Skills requeridos:

- `Personal hygiene support`
- `Manual handling`
- `Medication prompt`

#### SR-2402

- titulo: `Community access and shopping support`
- service type: `Community Access`
- centro: `Evergreen Support Services`
- recipient: `George Hill`
- estado inicial demo: `active`
- prioridad: `medium`

Skills requeridos:

- `Transport escort`
- `Community participation`

#### SR-2403

- titulo: `Evening companionship coverage`
- service type: `Companionship`
- centro: `BlueWattle Homecare`
- recipient: `Elaine Cooper`
- estado inicial demo: `open`
- prioridad: `critical`

Skills requeridos:

- `Social engagement`
- `Meal preparation`
- `Medication prompt`

## Flujo demo recomendado

La narrativa demo mas clara hoy es:

1. el centro crea o visualiza una necesidad,
2. la prestadora recibe la orden,
3. la prestadora asigna o ajusta cobertura,
4. el cuidador ejecuta la visita y registra evidencia,
5. la prestadora revisa la visita,
6. el sistema conserva auditoria.

## Que se puede mostrar en una demo por actor

### Demo de provider

Se puede mostrar:

- dashboard,
- creacion de orden,
- edicion de orden,
- agregado de visita,
- asignacion de carer,
- cambio de estado,
- revision por reviewer,
- auditoria.

### Demo de center

Se puede mostrar:

- dashboard,
- creacion de solicitud,
- vista restringida a su centro,
- detalle con evidencia y review,
- trazabilidad sin capacidad de operar como provider.

### Demo de carer

Se puede mostrar:

- agenda de visitas asignadas,
- detalle de visita,
- checklist,
- evidencia,
- incidente simple.

Observacion importante:

la Fase 1 del carer ya es operativa, pero todavia no representa una app movil madura ni un backoffice completo.

## Reglas de acceso actuales

- `Provider coordinator` y `Provider reviewer` entran a `/providers`
- `Center manager` entra a `/centers`
- `Carer` entra a `/carers`
- cada actor ve solo su superficie
- un `center manager` solo ve sus propias ordenes
- un `provider reviewer` puede aprobar o rechazar visitas
- un `provider coordinator` no puede aprobar o rechazar visitas

## Que preguntas puede responder bien esta fuente

Este documento sirve bien para responder preguntas como:

- que es Serenity
- para quien esta construido
- cuales son los roles actuales
- que puede hacer cada actor
- cuales son los service types
- cuales son las skills
- como funciona el flujo demo
- cual es el alcance actual del producto
- que cosas siguen fuera del alcance
- cuando tendria sentido empezar Fase 2 del carer

## Limitaciones actuales del producto

Las principales limitaciones actuales son:

- el cierre financiero es parcial o conceptual,
- la experiencia del carer no cubre disponibilidad ni credenciales,
- la evidencia no es carga real de archivos,
- el seed del carer todavia puede mejorarse para mostrar mejor el flujo `start -> complete -> submit for review`,
- el producto no intenta cubrir EMR clinico ni contabilidad avanzada.

## Momento ideal para comenzar Fase 2 del carer

Tiene sentido comenzar Fase 2 del carer cuando:

1. la Fase 1 ya sea suficiente para demos sin ajustes urgentes,
2. el principal vacio deje de ser la ejecucion de la visita,
3. el siguiente valor claro sea la gestion del perfil del cuidador.

Fase 2 deberia enfocarse en:

- disponibilidad,
- credenciales,
- alertas de vencimiento,
- perfil profesional basico.

## Mensaje corto de posicionamiento para demos

Si se necesita una explicacion breve:

**Serenity es una plataforma operativa para homecare que conecta centros, prestadoras y cuidadores para convertir cada servicio en una prestacion trazable, ejecutable y revisable.**

## Resumen final

Serenity hoy ya es una demo funcional de operacion multi-actor en homecare.

Su mayor fortaleza actual esta en:

- coordinacion provider,
- visibilidad center,
- primera capa operativa del carer,
- y uso de catalogos cerrados para ordenar servicios y skills.

Su siguiente evolucion natural, despues de estabilizar demos, es fortalecer el perfil del carer con disponibilidad y credenciales.
