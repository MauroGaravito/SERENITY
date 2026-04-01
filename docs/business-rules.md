# Business Rules

## 1. Reglas de elegibilidad

1. Ningun cuidador puede ser asignado a un servicio si tiene credenciales vencidas o faltantes para ese tipo de servicio.
2. Ninguna visita puede confirmarse sin una ventana horaria, duracion y ubicacion definidas.
3. Todo servicio debe pertenecer a un centro y a una prestadora responsable.
4. Un cuidador no puede tener dos visitas superpuestas.

## 2. Reglas de cobertura

1. Toda orden de servicio debe tener un estado operativo visible: `draft`, `open`, `partially_assigned`, `assigned`, `in_progress`, `completed`, `under_review`, `approved`, `rejected`, `cancelled`.
2. Si una visita no tiene cuidador confirmado dentro del tiempo minimo definido, debe escalar a coordinacion.
3. Si un cuidador cancela dentro de la ventana critica, Serenity debe abrir flujo de reemplazo inmediato.
4. Todo reemplazo debe mantener trazabilidad del motivo y del responsable del cambio.

## 3. Reglas de ejecucion

1. Toda visita requiere check-in y check-out para poder pasar a revision.
2. Si el tipo de servicio exige checklist, no puede cerrarse la visita sin checklist completo o sin motivo de excepcion.
3. Toda incidencia relevante debe clasificarse al menos por tipo, severidad y comentario.
4. Toda evidencia adjunta debe quedar vinculada a la visita, al autor y a la hora de carga.
5. Si una visita queda incompleta, el sistema debe exigir una causa explicita.

## 4. Reglas de revision

1. Ninguna visita pasa a aprobada sin revision humana o regla explicita de autoaprobacion.
2. Una visita rechazada debe volver a estado corregible con observaciones visibles.
3. Toda correccion posterior a la revision debe dejar historial.
4. Las incidencias severas deben bloquear el cierre hasta resolucion o excepcion autorizada.

## 5. Reglas economicas

1. Solo horas aprobadas pueden formar parte del cierre economico.
2. Gastos y kilometraje requieren evidencia o politica habilitante.
3. Toda tarifa debe depender al menos de tipo de servicio, duracion y actor pagador.
4. Las diferencias entre horas planificadas y horas ejecutadas deben quedar justificadas.

## 6. Reglas del cuidador como microempresa

1. El cuidador mantiene un perfil profesional unico con datos operativos y administrativos.
2. Serenity debe avisar vencimientos de documentos y credenciales antes de bloquear elegibilidad.
3. El cuidador puede registrar gastos y kilometraje por visita o por jornada.
4. El historial de servicios del cuidador debe poder usarse como respaldo de ingresos y rendimiento.

## 7. Reglas de permisos

### Centro de cuidado

- Puede crear y monitorear ordenes.
- Puede ver cumplimiento, incidencias y aprobaciones.
- No puede editar registros operativos cerrados sin trazabilidad.

### Prestadora

- Puede asignar, reemplazar, revisar y cerrar.
- Es responsable final de la calidad operativa ante el centro.

### Cuidador

- Puede aceptar o rechazar servicios.
- Puede ejecutar la visita y cargar evidencia.
- No puede autoaprobar su propia visita.

## 8. Reglas de datos

1. Toda accion critica debe almacenar autor, fecha y contexto.
2. No se debe sobrescribir evidencia historica sin conservar version previa.
3. Los documentos del cuidador deben tener fecha de vencimiento y estado.
4. Toda entidad operativa debe tener un identificador unico y trazable.

## 9. KPIs recomendados

- Cobertura a tiempo.
- Tasa de reemplazo.
- No-show del cuidador.
- Visitas aprobadas sin correccion.
- Tiempo medio de aprobacion.
- Diferencia entre horas planificadas y ejecutadas.
- Incidencias por 100 visitas.
- Utilizacion por cuidador y por prestadora.
