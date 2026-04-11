import catalogs from "@/lib/catalogs.json";

export const SERVICE_TYPE_CATALOG = catalogs.serviceTypes;
export const SKILL_CATALOG = catalogs.skills;

export type SkillName = (typeof SKILL_CATALOG)[number];
