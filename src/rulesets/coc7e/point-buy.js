import { materializeSkill } from "./skills.js";
import { successLevels } from "./derived.js";

export function occupationPointPool(occupation, characteristics) {
  const { EDU, APP, STR, DEX } = characteristics;
  if (occupation.point_formula === "EDU4") return EDU * 4;
  if (occupation.point_formula === "EDU2_APP2") return EDU * 2 + APP * 2;
  if (occupation.point_formula === "EDU2_STRDEX2") return EDU * 2 + Math.max(STR, DEX) * 2;
  throw new Error("Unknown occupation point formula");
}

export function allocatePointBuySkills(characteristics, occupationSkillIds, occupationSpends, personalSpends, occupationPool, personalPool, cap = 90) {
  const occupationSet = new Set([...occupationSkillIds, "credit_rating"]);
  const personalIds = Object.keys(personalSpends).filter((id) => Number(personalSpends[id]) > 0);
  const baseId = (id) => id.split(":", 1)[0];
  const occupationBases = new Set([...occupationSet].map(baseId));
  if (Object.keys(occupationSpends).some((id) => !occupationSet.has(id))) throw new Error("Occupation points may only be spent on occupation skills");
  if (personalIds.some((id) => occupationBases.has(baseId(id)))) throw new Error("Personal skills must differ from occupation skills");
  const occupationTotal = Object.values(occupationSpends).reduce((sum, value) => sum + Number(value || 0), 0);
  const personalTotal = Object.values(personalSpends).reduce((sum, value) => sum + Number(value || 0), 0);
  if (occupationTotal !== occupationPool) throw new Error("Occupation point pool must be fully allocated");
  if (personalTotal !== personalPool) throw new Error("Personal point pool must be fully allocated");
  return [...new Set([...occupationSet, ...personalIds])].map((id) => {
    const skill = materializeSkill(id, characteristics);
    const occupation = Number(occupationSpends[id] || 0);
    const personal = Number(personalSpends[id] || 0);
    const final = skill.base + occupation + personal;
    if (final > cap) throw new Error(`${skill.name} exceeds the creation cap`);
    return { ...skill, occupation, personal, final, ...successLevels(final) };
  });
}
