import { COC7E_RULESET, QUICKSTART_OCCUPATION_VALUES } from "./constants.js";

export function allocateQuickstartSkills(baseSkills, occupationSkillIds, assignments, personalSkillIds) {
  if (occupationSkillIds.length !== 8 || new Set(occupationSkillIds).size !== 8) {
    throw new Error("Choose exactly eight distinct occupation skills");
  }
  const occupationSet = new Set([...occupationSkillIds, "credit_rating"]);
  const assignedIds = Object.keys(assignments ?? {});
  if (assignedIds.length !== 9 || !assignedIds.every((id) => occupationSet.has(id)) ||
      ![...occupationSet].every((id) => assignedIds.includes(id))) {
    throw new Error("Assign values to eight occupation skills and Credit Rating");
  }
  const values = Object.values(assignments).sort((a, b) => a - b);
  const expected = [...QUICKSTART_OCCUPATION_VALUES].sort((a, b) => a - b);
  if (values.some((value, index) => value !== expected[index])) {
    throw new Error("Occupation values must use the current quickstart value set");
  }
  if (personalSkillIds.length !== 4 || new Set(personalSkillIds).size !== 4) {
    throw new Error("Choose exactly four distinct personal interest skills");
  }
  if (personalSkillIds.some((id) => occupationSet.has(id))) {
    throw new Error("Personal interest skills must be non-occupation skills");
  }

  return baseSkills.map((skill) => {
    if (skill.creation_locked && (assignments[skill.id] || personalSkillIds.includes(skill.id))) {
      throw new Error(`${skill.name} is locked during character creation`);
    }
    const occupationFinal = assignments[skill.id];
    const personal = personalSkillIds.includes(skill.id) ? 20 : 0;
    const final = occupationFinal ?? skill.base + personal;
    if (final > COC7E_RULESET.creationSkillCap) throw new Error(`${skill.name} exceeds the creation cap`);
    return {
      ...skill,
      occupation: occupationFinal === undefined ? 0 : Math.max(0, occupationFinal - skill.base),
      personal,
      final
    };
  });
}
