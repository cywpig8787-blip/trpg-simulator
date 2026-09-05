import { CORE_CHARACTERISTICS, QUICKSTART_CHARACTERISTIC_VALUES } from "./constants.js";

export function rollDice(count, sides, random = Math.random) {
  return Array.from({ length: count }, () => Math.floor(random() * sides) + 1);
}

export function rollLuck(random = Math.random) {
  const dice = rollDice(3, 6, random);
  return { dice, value: calculateLuckFromDice(dice) };
}

export function calculateLuckFromDice(dice) {
  if (!Array.isArray(dice) || dice.length !== 3 ||
      dice.some((die) => !Number.isInteger(die) || die < 1 || die > 6)) {
    throw new Error("Luck requires exactly three d6 results");
  }
  return dice.reduce((sum, die) => sum + die, 0) * 5;
}

export function assignQuickstartCharacteristics(assignments, random = Math.random) {
  const names = Object.keys(assignments ?? {});
  if (names.length !== CORE_CHARACTERISTICS.length ||
      !CORE_CHARACTERISTICS.every((name) => names.includes(name))) {
    throw new Error("All eight core characteristics must be assigned exactly once");
  }
  const assignedValues = Object.values(assignments).sort((a, b) => a - b);
  const expected = [...QUICKSTART_CHARACTERISTIC_VALUES].sort((a, b) => a - b);
  if (assignedValues.some((value, index) => value !== expected[index])) {
    throw new Error("Characteristic assignments must use the current quickstart value set");
  }
  const luck = rollLuck(random);
  return {
    characteristics: { ...assignments, Luck: luck.value },
    generation: { method: "system_roll", rolls: { Luck: luck.dice } }
  };
}

export function recordManualCharacteristics(characteristics, rollRecord = {}) {
  const required = [...CORE_CHARACTERISTICS, "Luck"];
  if (!required.every((name) => Number.isInteger(characteristics?.[name]))) {
    throw new Error("Manual entry requires all characteristics and Luck");
  }
  for (const name of required) {
    const value = characteristics[name];
    if (value < 1 || value > 100) throw new Error(`${name} must be between 1 and 100`);
  }
  if (rollRecord.Luck) {
    const expectedLuck = calculateLuckFromDice(rollRecord.Luck);
    if (expectedLuck !== characteristics.Luck) throw new Error("Luck total does not match the entered dice");
  }
  return {
    characteristics: { ...characteristics },
    generation: { method: "manual_roll", rolls: { ...rollRecord } }
  };
}

export function recordSystemCharacteristics(characteristics, rollRecord = {}) {
  const recorded = recordManualCharacteristics(characteristics, { Luck: rollRecord.Luck });
  return {
    ...recorded,
    generation: { method: "system_roll", rolls: { ...rollRecord } }
  };
}
