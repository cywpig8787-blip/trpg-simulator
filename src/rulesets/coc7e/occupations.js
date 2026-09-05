const interpersonal = Object.freeze(["charm", "fast_talk", "intimidate", "persuade"]);
const any = (count = 1, note = "Any skill") => ({ type: "any", count, note });
const oneOf = (options, note) => ({ type: "one_of", count: 1, options, note });
const skill = (id) => ({ type: "fixed", count: 1, skill_id: id });

export const COC7E_SAMPLE_OCCUPATIONS = Object.freeze([
  { id: "antiquarian", name: "Antiquarian", point_formula: "EDU4", credit_range: [30, 70], slots: [skill("appraise"), skill("art_craft"), skill("history"), skill("library_use"), skill("language_other"), oneOf(interpersonal, "One interpersonal skill"), skill("spot_hidden"), any()] },
  { id: "author", name: "Author", point_formula: "EDU4", credit_range: [9, 30], slots: [skill("art_craft"), skill("history"), skill("library_use"), oneOf(["natural_world", "occult"], "Natural World or Occult"), skill("language_other"), skill("language_own"), skill("psychology"), any()] },
  { id: "dilettante", name: "Dilettante", point_formula: "EDU2_APP2", credit_range: [50, 99], slots: [skill("art_craft"), skill("firearms"), skill("language_other"), skill("ride"), oneOf(interpersonal, "One interpersonal skill"), any(3)] },
  { id: "doctor_of_medicine", name: "Doctor of Medicine", point_formula: "EDU4", credit_range: [30, 80], slots: [skill("first_aid"), skill("language_other"), skill("medicine"), skill("psychology"), skill("science"), skill("science"), any(2, "Two academic or personal specialties")] },
  { id: "journalist", name: "Journalist", point_formula: "EDU4", credit_range: [9, 30], slots: [skill("art_craft"), skill("history"), skill("library_use"), skill("language_own"), oneOf(interpersonal, "One interpersonal skill"), skill("psychology"), any(2)] },
  { id: "police_detective", name: "Police Detective", point_formula: "EDU2_STRDEX2", credit_range: [20, 50], slots: [oneOf(["art_craft", "disguise"], "Acting or Disguise"), skill("firearms"), skill("law"), skill("listen"), oneOf(interpersonal, "One interpersonal skill"), skill("psychology"), skill("spot_hidden"), any()] },
  { id: "private_investigator", name: "Private Investigator", point_formula: "EDU2_STRDEX2", credit_range: [9, 30], slots: [skill("art_craft"), skill("disguise"), skill("law"), skill("library_use"), oneOf(interpersonal, "One interpersonal skill"), skill("psychology"), skill("spot_hidden"), any()] },
  { id: "professor", name: "Professor", point_formula: "EDU4", credit_range: [20, 70], slots: [skill("library_use"), skill("language_other"), skill("language_own"), skill("psychology"), any(4, "Four academic or personal specialties")] }
]);

const baseId = (id) => id.split(":", 1)[0];

export function validateOccupationSkillSelection(occupation, selectedSkillIds) {
  if (!occupation?.slots) throw new Error("A known occupation is required");
  if (selectedSkillIds.length !== 8 || new Set(selectedSkillIds).size !== 8) {
    throw new Error("Choose exactly eight distinct occupation skill entries");
  }
  const remaining = [...selectedSkillIds];
  const consume = (predicate, message) => {
    const index = remaining.findIndex(predicate);
    if (index < 0) throw new Error(message);
    remaining.splice(index, 1);
  };

  for (const slot of occupation.slots.filter((item) => item.type === "fixed")) {
    consume((id) => baseId(id) === slot.skill_id, `Missing required occupation skill: ${slot.skill_id}`);
  }
  for (const slot of occupation.slots.filter((item) => item.type === "one_of")) {
    consume((id) => slot.options.includes(baseId(id)), `Missing occupation choice: ${slot.note}`);
  }
  const openCount = occupation.slots
    .filter((item) => item.type === "any")
    .reduce((sum, item) => sum + item.count, 0);
  if (remaining.length !== openCount) throw new Error("Occupation skill choices do not match its open slots");
  return true;
}
