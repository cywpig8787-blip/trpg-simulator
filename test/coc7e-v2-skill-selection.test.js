import test from "node:test";
import assert from "node:assert/strict";
import {
  materializeSkill,
  validateOccupationSkillSelection,
  COC7E_SAMPLE_OCCUPATIONS
} from "../src/index.js";

const characteristics = {
  STR: 50, CON: 50, DEX: 50, INT: 60,
  SIZ: 60, POW: 60, APP: 50, EDU: 80, Luck: 55
};

test("V2 can materialize direct Science branches as distinct skills", () => {
  const biology = materializeSkill("science:Biology", characteristics);
  const pharmacy = materializeSkill("science:Pharmacy", characteristics);
  assert.equal(biology.name, "Science (Biology)");
  assert.equal(pharmacy.name, "Science (Pharmacy)");
  assert.notEqual(biology.id, pharmacy.id);
});

test("V2 custom other-language value remains a valid specialized skill", () => {
  const latin = materializeSkill("language_other:Latin", characteristics);
  assert.equal(latin.specialization, "Latin");
  assert.equal(latin.base, 1);
});

test("doctor occupation accepts two different Science branches", () => {
  const doctor = COC7E_SAMPLE_OCCUPATIONS.find((item) => item.id === "doctor_of_medicine");
  const ids = [
    "first_aid",
    "language_other:English",
    "medicine",
    "psychology",
    "science:Biology",
    "science:Pharmacy",
    "library_use",
    "history"
  ];
  assert.equal(validateOccupationSkillSelection(doctor, ids), true);
});

test("doctor occupation rejects duplicate Science branch entries", () => {
  const doctor = COC7E_SAMPLE_OCCUPATIONS.find((item) => item.id === "doctor_of_medicine");
  const ids = [
    "first_aid",
    "language_other:English",
    "medicine",
    "psychology",
    "science:Biology",
    "science:Biology",
    "library_use",
    "history"
  ];
  assert.throws(() => validateOccupationSkillSelection(doctor, ids), /eight distinct/);
});
