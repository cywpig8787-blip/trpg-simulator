import { createCharacter } from "../../core/characters/character.js";
import { CHARACTERISTICS, COC7E_RULESET } from "./constants.js";
import { deriveInvestigatorStats, successLevels } from "./derived.js";

function assertInteger(value, label, min = 0) {
  if (!Number.isInteger(value) || value < min) throw new Error(`${label} must be an integer >= ${min}`);
}

export function buildSkill({ name, base = 0, occupation = 0, personal = 0, locked = false }) {
  [base, occupation, personal].forEach((value, index) =>
    assertInteger(value, ["base", "occupation", "personal"][index])
  );
  if (locked && (occupation > 0 || personal > 0)) throw new Error(`${name} is locked during character creation`);
  const final = base + occupation + personal;
  if (final > COC7E_RULESET.creationSkillCap) {
    throw new Error(`${name} exceeds the creation cap of ${COC7E_RULESET.creationSkillCap}`);
  }
  return { name, base, occupation, personal, final, ...successLevels(final), locked };
}

export function validateOccupation(occupation, skills, creditRating) {
  if (!occupation?.name) throw new Error("Occupation is required");
  const [minimum, maximum] = occupation.credit_rating_range ?? [];
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum)) {
    throw new Error("Occupation must define a credit rating range");
  }
  if (creditRating < minimum || creditRating > maximum) {
    throw new Error(`Credit Rating must be between ${minimum} and ${maximum}`);
  }
  const allowed = new Set([...(occupation.skill_names ?? []), "Credit Rating"]);
  for (const skill of skills) {
    if (skill.occupation > 0 && !allowed.has(skill.name)) {
      throw new Error(`${skill.name} is not an occupation skill for ${occupation.name}`);
    }
  }
}

export function buildCoc7eInvestigator(input) {
  const { profile, characteristics, occupation, skills: skillInputs = [], backstory = {} } = input;
  if (!profile?.name?.trim()) throw new Error("Investigator name is required");
  assertInteger(profile.age, "age", 15);
  for (const name of CHARACTERISTICS) assertInteger(characteristics?.[name], name, 1);

  const skills = skillInputs.map(buildSkill);
  const credit = skills.find((skill) => skill.name === "Credit Rating");
  if (!credit) throw new Error("Credit Rating skill is required");
  validateOccupation(occupation, skills, credit.final);

  const characteristicLevels = Object.fromEntries(
    CHARACTERISTICS.map((name) => [name, successLevels(characteristics[name])])
  );
  const sheet = {
    profile: {
      age: profile.age, pronouns: profile.pronouns ?? "", gender: profile.gender ?? "",
      birthplace: profile.birthplace ?? "", residence: profile.residence ?? ""
    },
    occupation: { id: occupation.id, name: occupation.name },
    characteristics: characteristicLevels,
    derived: deriveInvestigatorStats(characteristics, profile.age),
    skills,
    story: backstory.story ?? "",
    backstory: {
      personal_description: backstory.personal_description ?? "",
      ideology_beliefs: backstory.ideology_beliefs ?? [],
      significant_people: backstory.significant_people ?? [],
      meaningful_locations: backstory.meaningful_locations ?? [],
      treasured_possessions: backstory.treasured_possessions ?? [],
      traits: backstory.traits ?? [], injuries_scars: backstory.injuries_scars ?? [],
      phobias: backstory.phobias ?? [], manias: backstory.manias ?? [],
      arcane_tomes_spells: backstory.arcane_tomes_spells ?? [],
      strange_encounters: backstory.strange_encounters ?? []
    },
    possessions: input.possessions ?? [], wealth: input.wealth ?? {},
    creation: {
      occupation_points_spent: skills.reduce((sum, skill) => sum + skill.occupation, 0),
      personal_points_spent: skills.reduce((sum, skill) => sum + skill.personal, 0)
    }
  };
  return createCharacter({
    id: input.id, name: profile.name, rulesetId: COC7E_RULESET.id,
    rulesetVersion: COC7E_RULESET.version, sheet
  });
}
