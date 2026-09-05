import { createCharacter } from "../../core/characters/character.js";
import { COC7E_RULESET } from "./constants.js";
import { assignQuickstartCharacteristics, recordManualCharacteristics, recordSystemCharacteristics } from "./characteristics.js";
import { deriveInvestigatorStats, successLevels } from "./derived.js";
import { COC7E_SAMPLE_OCCUPATIONS, validateOccupationSkillSelection } from "./occupations.js";
import { materializeSkill } from "./skills.js";
import { allocateQuickstartSkills } from "./quickstart-allocation.js";

export class Coc7eCreationSession {
  constructor(id) {
    if (!id?.trim()) throw new Error("Character id is required");
    this.id = id;
    this.profile = null;
    this.occupation = null;
    this.characteristicResult = null;
    this.skills = null;
    this.backstory = {};
  }

  setProfile(profile) {
    if (!profile?.name?.trim()) throw new Error("Investigator name is required");
    if (!Number.isInteger(profile.age) || profile.age < 15) throw new Error("Investigator age must be at least 15");
    this.profile = { ...profile };
    return this;
  }

  chooseOccupation(occupationId) {
    const occupation = COC7E_SAMPLE_OCCUPATIONS.find((item) => item.id === occupationId);
    if (!occupation) throw new Error(`Unknown occupation: ${occupationId}`);
    this.occupation = occupation;
    this.skills = null;
    return this;
  }

  useSystemRoll(assignments, random = Math.random) {
    this.characteristicResult = assignQuickstartCharacteristics(assignments, random);
    this.skills = null;
    return this;
  }

  useManualRoll(characteristics, rollRecord = {}) {
    this.characteristicResult = recordManualCharacteristics(characteristics, rollRecord);
    this.skills = null;
    return this;
  }

  useAutomaticRoll(characteristics, rollRecord = {}) {
    this.characteristicResult = recordSystemCharacteristics(characteristics, rollRecord);
    this.skills = null;
    return this;
  }

  allocateSkills(occupationSkillIds, assignments, personalSkillIds) {
    if (!this.occupation) throw new Error("Choose an occupation before allocating skills");
    if (!this.characteristicResult) throw new Error("Set characteristics before allocating skills");
    validateOccupationSkillSelection(this.occupation, occupationSkillIds);
    const allIds = [...new Set([...occupationSkillIds, "credit_rating", ...personalSkillIds])];
    const baseSkills = allIds.map((id) => materializeSkill(id, this.characteristicResult.characteristics));
    this.skills = allocateQuickstartSkills(baseSkills, occupationSkillIds, assignments, personalSkillIds)
      .map((skill) => ({ ...skill, ...successLevels(skill.final) }));
    return this;
  }

  setBackstory(backstory) {
    this.backstory = { ...backstory };
    return this;
  }

  validate() {
    const errors = [];
    if (!this.profile) errors.push("Profile is incomplete");
    if (!this.occupation) errors.push("Occupation is incomplete");
    if (!this.characteristicResult) errors.push("Characteristics are incomplete");
    if (!this.skills) errors.push("Skills are incomplete");
    return { valid: errors.length === 0, errors };
  }

  finalize() {
    const validation = this.validate();
    if (!validation.valid) throw new Error(validation.errors.join("; "));
    const characteristics = this.characteristicResult.characteristics;
    return createCharacter({
      id: this.id,
      name: this.profile.name,
      rulesetId: COC7E_RULESET.id,
      rulesetVersion: COC7E_RULESET.version,
      sheet: {
        profile: { ...this.profile },
        occupation: { id: this.occupation.id, name: this.occupation.name },
        characteristic_generation: this.characteristicResult.generation,
        characteristics: Object.fromEntries(
          Object.entries(characteristics).map(([name, value]) => [name, successLevels(value)])
        ),
        derived: deriveInvestigatorStats(characteristics, this.profile.age),
        skills: this.skills,
        story: this.backstory.story ?? "",
        backstory: {
          personal_description: this.backstory.personal_description ?? "",
          ideology_beliefs: this.backstory.ideology_beliefs ?? [],
          significant_people: this.backstory.significant_people ?? [],
          meaningful_locations: this.backstory.meaningful_locations ?? [],
          treasured_possessions: this.backstory.treasured_possessions ?? [],
          traits: this.backstory.traits ?? [],
          injuries_scars: this.backstory.injuries_scars ?? [],
          phobias: this.backstory.phobias ?? [],
          manias: this.backstory.manias ?? []
        }
      }
    });
  }
}
