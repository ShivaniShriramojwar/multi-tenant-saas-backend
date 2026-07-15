export const ENTITY_TYPE = {
  PROJECT: "PROJECT",
  TASK: "TASK",
  BUG: "BUG",
  ORDER: "ORDER",
  COMMENT: "COMMENT",
} as const;

export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

export const ENTITY_TYPES = Object.values(ENTITY_TYPE) as [
  EntityType,
  ...EntityType[],
];
