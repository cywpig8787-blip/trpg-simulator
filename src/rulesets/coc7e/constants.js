export const COC7E_RULESET = Object.freeze({
  id: "coc_7e", version: "7e_current", creationSkillCap: 90
});
export const CHARACTERISTICS = Object.freeze([
  "STR", "CON", "DEX", "INT", "SIZ", "POW", "APP", "EDU", "Luck"
]);
export const CORE_CHARACTERISTICS = Object.freeze(CHARACTERISTICS.filter((name) => name !== "Luck"));
export const QUICKSTART_CHARACTERISTIC_VALUES = Object.freeze([40, 50, 50, 50, 60, 60, 70, 80]);
export const QUICKSTART_OCCUPATION_VALUES = Object.freeze([70, 60, 60, 50, 50, 50, 40, 40, 40]);
