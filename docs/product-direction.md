# Product Direction

## 1. Definicion concreta

Serenity debe posicionarse como una plataforma vertical de operaciones para homecare.

No solo registra evidencia. Orquesta el ciclo completo:

1. solicitud del servicio,
2. asignacion del prestador,
3. ejecucion de la visita,
4. validacion de calidad,
5. cierre administrativo y financiero.

## 2. Problema central

Hoy los tres actores principales trabajan desalineados:

- el centro necesita cobertura y control,
- la empresa prestadora necesita margen y visibilidad,
- el cuidador necesita trabajo estable y orden administrativo.

Cuando cada actor usa sistemas separados, aparecen cuatro fallas:

1. baja velocidad para cubrir servicios,
2. pobre trazabilidad de lo ejecutado,
3. disputas por horas, evidencia o calidad,
4. escasa profesionalizacion del cuidador independiente.

## 3. Posicionamiento recomendado

### Categoria

Plataforma operativa multi-actor para homecare.

### Promesa principal

Convertir cada servicio en una prestacion verificable, trazable y liquidable.

### Diferenciador

La mayoria de las herramientas resuelven una sola capa:

- scheduling,
- EVV/check-in,
- CRM,
- payroll,
- compliance.

Serenity debe resolver la continuidad entre capas.

## 4. Actor principal y orden recomendado

Los tres actores importan, pero no conviene construirlos con igual prioridad al inicio.

Orden recomendado:

1. Empresa prestadora.
2. Centro de cuidado.
3. Cuidador independiente.

Razon:

- La empresa prestadora es quien siente con mas fuerza el problema operativo completo.
- Es el mejor punto de monetizacion y adopcion inicial.
- Desde ahi se habilita el valor para centros y cuidadores sin dispersar el MVP.

## 5. Jobs to be done

### Centro de cuidado

- Necesito pedir servicios con requisitos claros.
- Necesito saber si el servicio fue cubierto correctamente.
- Necesito ver incidencias y reemplazos a tiempo.
- Necesito evidencia y reportes auditables.

### Empresa prestadora

- Necesito convertir demanda en cobertura rentable.
- Necesito asignar personal apto y disponible.
- Necesito controlar calidad y resolver excepciones.
- Necesito cerrar horas aprobadas para facturar sin reprocesos.

### Cuidador independiente

- Necesito aceptar trabajos compatibles con mi perfil y disponibilidad.
- Necesito ejecutar el servicio sin ambiguedad.
- Necesito registrar pruebas, horas, gastos y observaciones.
- Necesito ordenar mi actividad economica sin usar cinco herramientas distintas.

## 6. Capacidades del producto

### Modulo 1. Red comercial y contractual

- Centros y sedes.
- Prestadoras y equipos.
- Tipos de servicio.
- Tarifas, convenios y reglas base.

### Modulo 2. Ordenes de servicio

- Alta de requerimientos.
- Frecuencia, duracion y ventana horaria.
- Nivel de prioridad.
- Requisitos de skill, documentos y idioma.

### Modulo 3. Matching y cobertura

- Pool elegible por reglas.
- Invitacion, asignacion y reemplazo.
- Cobertura parcial o total.
- Alertas por riesgo de no cobertura.

### Modulo 4. Ejecucion de visita

- Check-in y check-out.
- Checklist por tipo de servicio.
- Notas estructuradas.
- Evidencia adjunta.
- Reporte de incidentes.

### Modulo 5. Revision y cumplimiento

- Cola de revision.
- Aprobacion, observacion o rechazo.
- Trazabilidad de cambios.
- Reportes por prestador, centro y cuidador.

### Modulo 6. Cierre economico

- Horas aprobadas.
- Gastos reembolsables.
- Consolidado por periodo.
- Base para facturacion a centros y liquidacion al cuidador.

### Modulo 7. Backoffice del cuidador

- Perfil profesional.
- Credenciales y vencimientos.
- Disponibilidad.
- Historial de trabajos.
- Gastos, kilometraje e ingresos.
- Recordatorios de documentacion pendiente.

## 7. MVP recomendado

El MVP no debe intentar resolver toda la cadena financiera ni todo el universo clinico.

### MVP fase 1

- Alta de centros, prestadoras y cuidadores.
- Ordenes de servicio.
- Matching basico por disponibilidad + credenciales.
- Agenda de visitas.
- Ejecucion con checklist y evidencia.
- Revision y aprobacion.
- Export simple para cierre.

### MVP fase 2

- Reemplazos y escalamiento operativo.
- Tarifas y reglas economicas.
- Gastos y kilometraje.
- Paneles de rendimiento.
- Portal del centro para seguimiento.

### MVP fase 3

- Facturacion asistida.
- Liquidacion del cuidador.
- Score de calidad y confiabilidad.
- Motor de recomendacion de matching.

## 8. Entidades base

- Centro
- Sede
- Prestadora
- Cuidador
- Cliente final / receptor del servicio
- Tipo de servicio
- Orden de servicio
- Turno / visita
- Checklist
- Evidencia
- Incidencia
- Revision
- Regla tarifaria
- Gasto
- Periodo de cierre

## 9. Norte de UX

Cada actor debe ver solo lo que necesita para operar.

### Centro

- Vista de demanda, cobertura, cumplimiento e incidencias.

### Prestadora

- Vista de coordinacion, capacidad, excepciones y cierre.

### Cuidador

- Vista movil primero: agenda, tareas, evidencia, ingresos y pendientes.

## 10. Recomendaciones de producto

1. Elegir homecare como vertical unica en la primera etapa.
2. Tratar a la empresa prestadora como cliente principal.
3. Disenar al cuidador como operador movil y microempresa, no solo como empleado.
4. Mantener fuera del alcance el EMR clinico y contabilidad avanzada.
5. Hacer que toda accion importante deje rastro auditable.
6. Modelar excepciones desde el dia uno: no-show, reemplazo, incidente, visita incompleta.

## 11. North Star

La metrica norte recomendada es:

**porcentaje de servicios completados y aprobados sin reproceso.**

Es una metrica que une operacion, calidad y cierre.
