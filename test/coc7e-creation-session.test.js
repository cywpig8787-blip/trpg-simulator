import test from "node:test";
import assert from "node:assert/strict";
import { Coc7eCreationSession, materializeSkill } from "../src/index.js";

const characteristics = {
  STR: 40, CON: 50, DEX: 50, INT: 50, SIZ: 60, POW: 60, APP: 70, EDU: 80, Luck: 60
};
const occupationSkills = [
  "art_craft:Photography", "history", "library_use", "language_own:English",
  "persuade", "psychology", "spot_hidden", "stealth"
];
const values = [70, 60, 60, 50, 50, 50, 40, 40, 40];
const assignments = Object.fromEntries([...occupationSkills, "credit_rating"].map((id, i) => [id, values[i]]));

test("requires a specialization for open-ended skills", () => {
  assert.throws(() => materializeSkill("art_craft", characteristics), /requires a specialization/);
  assert.equal(materializeSkill("art_craft:Photography", characteristics).specialization, "Photography");
});

test("runs a complete manual-roll investigator creation session", () => {
  const investigator = new Coc7eCreationSession("investigator-manual")
    .setProfile({ name: "Mara Vale", age: 28, pronouns: "she/her", residence: "Boston" })
    .chooseOccupation("journalist")
    .useManualRoll(characteristics, { Luck: [4, 3, 5] })
    .allocateSkills(occupationSkills, assignments, ["accounting", "climb", "drive_auto", "listen"])
    .setBackstory({
      story: "A reporter following a story no one else believes.",
      significant_people: [{ name: "Evelyn", relationship: "editor", why_significant: "Gave Mara her first chance" }]
    })
    .finalize();

  assert.equal(investigator.sheet.characteristic_generation.method, "manual_roll");
  assert.equal(investigator.sheet.occupation.id, "journalist");
  assert.equal(investigator.sheet.skills.find((skill) => skill.id === "persuade").final, 50);
  assert.equal(investigator.sheet.backstory.significant_people.length, 1);
});

test("blocks an invalid occupation skill selection", () => {
  const session = new Coc7eCreationSession("invalid")
    .setProfile({ name: "Mara", age: 28 })
    .chooseOccupation("journalist")
    .useManualRoll(characteristics);
  assert.throws(
    () => session.allocateSkills(
      ["accounting", "climb", "drive_auto", "first_aid", "persuade", "psychology", "spot_hidden", "stealth"],
      assignments,
      ["appraise", "archaeology", "charm", "listen"]
    ),
    /Missing required occupation skill/
  );
});
