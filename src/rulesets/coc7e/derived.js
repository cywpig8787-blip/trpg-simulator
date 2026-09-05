export function successLevels(value) {
  return { regular: value, hard: Math.floor(value / 2), extreme: Math.floor(value / 5) };
}

export function damageBonusAndBuild(str, siz) {
  const total = str + siz;
  if (total <= 64) return { damage_bonus: "-2", build: -2 };
  if (total <= 84) return { damage_bonus: "-1", build: -1 };
  if (total <= 124) return { damage_bonus: "0", build: 0 };
  if (total <= 164) return { damage_bonus: "+1d4", build: 1 };
  if (total <= 204) return { damage_bonus: "+1d6", build: 2 };
  const extra = Math.floor((total - 205) / 80);
  return { damage_bonus: `+${2 + extra}d6`, build: 3 + extra };
}

export function movementRate({ STR, DEX, SIZ }, age) {
  let move = STR < SIZ && DEX < SIZ ? 7 : STR > SIZ && DEX > SIZ ? 9 : 8;
  if (age >= 80) move -= 5;
  else if (age >= 70) move -= 4;
  else if (age >= 60) move -= 3;
  else if (age >= 50) move -= 2;
  else if (age >= 40) move -= 1;
  return Math.max(1, move);
}

export function deriveInvestigatorStats(characteristics, age) {
  const { CON, SIZ, POW, STR, DEX } = characteristics;
  return {
    hp: Math.floor((CON + SIZ) / 10), mp: Math.floor(POW / 5), san: POW,
    move: movementRate({ STR, DEX, SIZ }, age), ...damageBonusAndBuild(STR, SIZ)
  };
}
