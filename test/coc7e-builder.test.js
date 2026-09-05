import test from "node:test";
import assert from "node:assert/strict";
import { buildCoc7eInvestigator, buildSkill } from "../src/index.js";

const occupation = {
  id: "antiquarian", name: "Antiquarian",
  skill_names: ["Appraise", "History", "Library Use"], credit_rating_range: [30, 70]
};
const characteristics = {
  STR: 50, CON: 60, DEX: 70, INT: 80, SIZ: 55,
  POW: 65, APP: 45, EDU: 75, Luck: 50
};

test("builds a versioned CoC 7e investigator and derives stats", () => {
  const investigator = buildCoc7eInvestigator({
    id: "investigator-1", profile: { name: "Ada", age: 32 }, characteristics, occupation,
    skills: [
      { name: "Credit Rating", base: 0, occupation: 40 },
      { name: "Library Use", base: 20, occupation: 40, personal: 10 }
    ],
    backstory: {
      story: "An investigator with a private collection.",
      significant_people: [{ name: "Mira", relationship: "mentor", why_significant: "Taught Ada" }]
    }
  });
  assert.equal(investigator.ruleset_id, "coc_7e");
  assert.equal(investigator.sheet.characteristics.INT.hard, 40);
  assert.equal(investigator.sheet.derived.hp, 11);
  assert.equal(investigator.sheet.skills[1].final, 70);
  assert.equal(investigator.sheet.backstory.significant_people.length, 1);
});

test("rejects skills above the creation cap", () => {
  assert.throws(() => buildSkill({ name: "Library Use", base: 20, occupation: 71 }), /cap of 90/);
});

test("keeps locked Cthulhu Mythos unavailable", () => {
  assert.throws(
    () => buildSkill({ name: "Cthulhu Mythos", personal: 1, locked: true }), /locked during character creation/
  );
});

test("rejects occupation allocation outside the occupation skill list", () => {
  assert.throws(() => buildCoc7eInvestigator({
    id: "investigator-2", profile: { name: "Ada", age: 32 }, characteristics, occupation,
    skills: [{ name: "Credit Rating", occupation: 40 }, { name: "Charm", occupation: 20 }]
  }), /not an occupation skill/);
});
