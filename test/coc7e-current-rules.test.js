import test from "node:test";
import assert from "node:assert/strict";
import {
  allocateQuickstartSkills, assignQuickstartCharacteristics,
  COC7E_SAMPLE_OCCUPATIONS, createBaseSkillList, recordManualCharacteristics
} from "../src/index.js";

const assignment = { STR: 40, CON: 50, DEX: 50, INT: 50, SIZ: 60, POW: 60, APP: 70, EDU: 80 };

test("assigns the official quickstart characteristic set and rolls Luck separately", () => {
  const result = assignQuickstartCharacteristics(assignment, () => 0);
  assert.equal(result.characteristics.Luck, 15);
  assert.deepEqual(result.generation.rolls.Luck, [1, 1, 1]);
});

test("accepts player-rolled characteristic results and records their source", () => {
  const result = recordManualCharacteristics({ ...assignment, Luck: 60 }, { Luck: [4, 3, 5] });
  assert.equal(result.generation.method, "manual_roll");
  assert.equal(result.characteristics.Luck, 60);
});

test("rejects a manual Luck total that does not match the entered dice", () => {
  assert.throws(
    () => recordManualCharacteristics({ ...assignment, Luck: 65 }, { Luck: [4, 3, 5] }),
    /does not match/
  );
});

test("derives Dodge and Own Language bases from characteristics", () => {
  const skills = createBaseSkillList({ ...assignment, Luck: 50 });
  assert.equal(skills.find((skill) => skill.id === "dodge").base, 25);
  assert.equal(skills.find((skill) => skill.id === "language_own").base, 80);
});

test("contains the eight current official sample occupations", () => {
  assert.equal(COC7E_SAMPLE_OCCUPATIONS.length, 8);
  assert.ok(COC7E_SAMPLE_OCCUPATIONS.some((occupation) => occupation.id === "journalist"));
});

test("allocates current quickstart occupation and personal skill values", () => {
  const skills = createBaseSkillList({ ...assignment, Luck: 50 });
  const occupationIds = ["appraise", "art_craft", "history", "library_use", "language_other", "persuade", "spot_hidden", "psychology"];
  const values = [70, 60, 60, 50, 50, 50, 40, 40, 40];
  const assignments = Object.fromEntries([...occupationIds, "credit_rating"].map((id, i) => [id, values[i]]));
  const result = allocateQuickstartSkills(skills, occupationIds, assignments, ["accounting", "climb", "drive_auto", "listen"]);
  assert.equal(result.find((skill) => skill.id === "appraise").final, 70);
  assert.equal(result.find((skill) => skill.id === "accounting").final, 25);
});
