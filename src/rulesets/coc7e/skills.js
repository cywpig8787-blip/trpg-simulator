const fixed = (id, name, base, options = {}) => Object.freeze({ id, name, base, ...options });
const specialized = (id, name, base, options = {}) => fixed(id, name, base, { specialized: true, ...options });

export const COC7E_SKILLS = Object.freeze([
  fixed("accounting", "Accounting", 5), fixed("anthropology", "Anthropology", 1),
  fixed("appraise", "Appraise", 5), fixed("archaeology", "Archaeology", 1),
  specialized("art_craft", "Art/Craft", 5), fixed("charm", "Charm", 15),
  fixed("climb", "Climb", 20), fixed("credit_rating", "Credit Rating", 0),
  fixed("cthulhu_mythos", "Cthulhu Mythos", 0, { creation_locked: true }),
  fixed("disguise", "Disguise", 5), fixed("dodge", "Dodge", null, { base_formula: "floor(DEX/2)" }),
  fixed("drive_auto", "Drive Auto", 20), fixed("electrical_repair", "Electrical Repair", 10),
  fixed("fast_talk", "Fast Talk", 5), specialized("fighting", "Fighting", 0),
  fixed("fighting_brawl", "Fighting (Brawl)", 25), specialized("firearms", "Firearms", 0),
  fixed("firearms_handgun", "Firearms (Handgun)", 20),
  fixed("firearms_rifle_shotgun", "Firearms (Rifle/Shotgun)", 25),
  fixed("first_aid", "First Aid", 30), fixed("history", "History", 5),
  fixed("intimidate", "Intimidate", 15), fixed("jump", "Jump", 20),
  specialized("language_other", "Language (Other)", 1),
  specialized("language_own", "Language (Own)", null, { base_formula: "EDU" }),
  fixed("law", "Law", 5), fixed("library_use", "Library Use", 20),
  fixed("listen", "Listen", 20), fixed("locksmith", "Locksmith", 1),
  fixed("mechanical_repair", "Mechanical Repair", 10), fixed("medicine", "Medicine", 1),
  fixed("natural_world", "Natural World", 10), fixed("navigate", "Navigate", 10),
  fixed("occult", "Occult", 5), fixed("operate_heavy_machinery", "Operate Heavy Machinery", 1),
  fixed("persuade", "Persuade", 10), specialized("pilot", "Pilot", 1),
  fixed("psychoanalysis", "Psychoanalysis", 1), fixed("psychology", "Psychology", 10),
  fixed("ride", "Ride", 5), specialized("science", "Science", 1),
  fixed("sleight_of_hand", "Sleight of Hand", 10), fixed("spot_hidden", "Spot Hidden", 25),
  fixed("stealth", "Stealth", 20), specialized("survival", "Survival", 10),
  fixed("swim", "Swim", 20), fixed("throw", "Throw", 20), fixed("track", "Track", 10)
]);

export function resolveSkillBase(skill, characteristics) {
  if (skill.base_formula === "floor(DEX/2)") return Math.floor(characteristics.DEX / 2);
  if (skill.base_formula === "EDU") return characteristics.EDU;
  return skill.base;
}

export function createBaseSkillList(characteristics) {
  return COC7E_SKILLS.map((skill) => ({
    ...skill, base: resolveSkillBase(skill, characteristics), occupation: 0, personal: 0
  }));
}
