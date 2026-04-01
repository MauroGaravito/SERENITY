export const site = {
  name: "Serenity",
  tagline: "Operations OS for homecare networks",
  description:
    "Serenity coordina demanda, cobertura, ejecucion, evidencia y cierre para centros, prestadoras y cuidadores independientes."
};

export const pillars = [
  {
    title: "Demand to Coverage",
    body:
      "Convierte requerimientos del centro en servicios asignados con reglas claras de elegibilidad, prioridad y capacidad."
  },
  {
    title: "Field Execution",
    body:
      "Cada visita deja check-in, checklist, evidencias e incidencias con trazabilidad auditable."
  },
  {
    title: "Review to Closure",
    body:
      "Las visitas aprobadas pasan a cierre operativo y financiero sin depender de planillas manuales."
  }
] as const;

export const roles = [
  {
    slug: "centers",
    name: "Centros de cuidado",
    accent: "Te piden control operativo y cumplimiento",
    outcomes: [
      "Crear requerimientos con restricciones y prioridades",
      "Seguir cobertura, incidencias y reemplazos",
      "Revisar cumplimiento por periodo y por sede"
    ]
  },
  {
    slug: "providers",
    name: "Prestadoras",
    accent: "Son el cliente inicial y el motor del sistema",
    outcomes: [
      "Asignar segun disponibilidad, credenciales y reglas",
      "Resolver no-shows y cancelaciones tardias",
      "Cerrar visitas aprobadas para facturacion y liquidacion"
    ]
  },
  {
    slug: "carers",
    name: "Cuidadores independientes",
    accent: "Operan como workforce y como microempresa",
    outcomes: [
      "Aceptar servicios y ejecutar visitas desde movil",
      "Mantener documentos y disponibilidad al dia",
      "Registrar gastos, kilometraje e ingresos por periodo"
    ]
  }
] as const;

export const workflow = [
  "Orden de servicio",
  "Matching y asignacion",
  "Visita y evidencia",
  "Revision operativa",
  "Cierre del periodo"
] as const;
