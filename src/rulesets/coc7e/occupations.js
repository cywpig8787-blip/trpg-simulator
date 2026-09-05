const interpersonal = Object.freeze(["charm", "fast_talk", "intimidate", "persuade"]);
const any = (count = 1, note = "Any skill") => ({ type: "any", count, note });
const oneOf = (options, note) => ({ type: "one_of", count: 1, options, note });
const skill = (id) => ({ type: "fixed", count: 1, skill_id: id });

export const COC7E_SAMPLE_OCCUPATIONS = Object.freeze([
  { id: "antiquarian", name: "Antiquarian", slots: [skill("appraise"), skill("art_craft"), skill("history"), skill("library_use"), skill("language_other"), oneOf(interpersonal, "One interpersonal skill"), skill("spot_hidden"), any()] },
  { id: "author", name: "Author", slots: [skill("art_craft"), skill("history"), skill("library_use"), oneOf(["natural_world", "occult"], "Natural World or Occult"), skill("language_other"), skill("language_own"), skill("psychology"), any()] },
  { id: "dilettante", name: "Dilettante", slots: [skill("art_craft"), skill("firearms"), skill("language_other"), skill("ride"), oneOf(interpersonal, "One interpersonal skill"), any(3)] },
  { id: "doctor_of_medicine", name: "Doctor of Medicine", slots: [skill("first_aid"), skill("language_other"), skill("medicine"), skill("psychology"), skill("science"), skill("science"), any(2, "Two academic or personal specialties")] },
  { id: "journalist", name: "Journalist", slots: [skill("art_craft"), skill("history"), skill("library_use"), skill("language_own"), oneOf(interpersonal, "One interpersonal skill"), skill("psychology"), any(2)] },
  { id: "police_detective", name: "Police Detective", slots: [oneOf(["art_craft", "disguise"], "Acting or Disguise"), skill("firearms"), skill("law"), skill("listen"), oneOf(interpersonal, "One interpersonal skill"), skill("psychology"), skill("spot_hidden"), any()] },
  { id: "private_investigator", name: "Private Investigator", slots: [skill("art_craft"), skill("disguise"), skill("law"), skill("library_use"), oneOf(interpersonal, "One interpersonal skill"), skill("psychology"), skill("spot_hidden"), any()] },
  { id: "professor", name: "Professor", slots: [skill("library_use"), skill("language_other"), skill("language_own"), skill("psychology"), any(4, "Four academic or personal specialties")] }
]);
