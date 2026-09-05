import {
  Coc7eCreationSession,
  COC7E_SAMPLE_OCCUPATIONS,
  COC7E_SKILLS
} from "/src/index.js";

const DRAFT_KEY = "trpg-coc7e-v2-draft";
const DRAFT_VERSION = 2;
const STEPS = ["基本資料", "選擇職業", "能力值", "技能配置", "背景故事", "完成確認"];
const CORE = ["STR", "CON", "DEX", "INT", "SIZ", "POW", "APP", "EDU"];
const ALL_CHARACTERISTICS = [...CORE, "Luck"];
const CHARACTERISTIC_LABELS = Object.freeze({
  STR: "力量", CON: "體質", DEX: "敏捷", INT: "智力",
  SIZ: "體型", POW: "意志", APP: "外貌", EDU: "教育", Luck: "幸運"
});
const OCCUPATION_LABELS = Object.freeze({
  antiquarian: "古物研究者",
  author: "作家",
  dilettante: "業餘愛好者",
  doctor_of_medicine: "醫師",
  journalist: "記者",
  police_detective: "警探",
  private_investigator: "私家偵探",
  professor: "教授"
});
const SKILL_LABELS = Object.freeze({
  accounting: "會計", anthropology: "人類學", appraise: "估價", archaeology: "考古學",
  art_craft: "藝術／工藝", charm: "魅惑", climb: "攀爬", credit_rating: "信用評級",
  cthulhu_mythos: "克蘇魯神話", disguise: "喬裝", dodge: "閃避",
  drive_auto: "汽車駕駛", electrical_repair: "電氣維修", fast_talk: "話術",
  fighting: "格鬥", fighting_brawl: "格鬥（鬥毆）", firearms: "射擊",
  firearms_handgun: "射擊（手槍）", firearms_rifle_shotgun: "射擊（步槍／霰彈槍）",
  first_aid: "急救", history: "歷史", intimidate: "恐嚇", jump: "跳躍",
  language_other: "外語", language_own: "母語", law: "法律",
  library_use: "圖書館使用", listen: "聆聽", locksmith: "鎖匠",
  mechanical_repair: "機械維修", medicine: "醫學", natural_world: "自然學",
  navigate: "導航", occult: "神祕學", operate_heavy_machinery: "操作重型機械",
  persuade: "說服", pilot: "駕駛", psychoanalysis: "精神分析",
  psychology: "心理學", ride: "騎術", science: "科學", sleight_of_hand: "妙手",
  spot_hidden: "偵查", stealth: "潛行", survival: "生存", swim: "游泳",
  throw: "投擲", track: "追蹤"
});

const DIRECT_SPECIALIZATIONS = Object.freeze({
  science: Object.freeze([
    ["Astronomy", "科學（天文學）"],
    ["Biology", "科學（生物學）"],
    ["Botany", "科學（植物學）"],
    ["Chemistry", "科學（化學）"],
    ["Cryptography", "科學（密碼學）"],
    ["Engineering", "科學（工程學）"],
    ["Forensics", "科學（法醫學）"],
    ["Geology", "科學（地質學）"],
    ["Mathematics", "科學（數學）"],
    ["Meteorology", "科學（氣象學）"],
    ["Pharmacy", "科學（藥學）"],
    ["Physics", "科學（物理學）"],
    ["Zoology", "科學（動物學）"]
  ]),
  pilot: Object.freeze([
    ["Aircraft", "駕駛（飛機）"],
    ["Boat", "駕駛（船舶）"],
    ["Dirigible", "駕駛（飛船）"]
  ]),
  survival: Object.freeze([
    ["Arctic", "生存（極地）"],
    ["Desert", "生存（沙漠）"],
    ["Sea", "生存（海洋）"],
    ["Wilderness", "生存（荒野）"]
  ])
});

const COMMON_LANGUAGES = Object.freeze([
  ["English", "外語（英語）"],
  ["Chinese", "外語（中文）"],
  ["Spanish", "外語（西班牙語）"]
]);

const GENERIC_SKILLS = COC7E_SKILLS.filter((skill) =>
  !skill.creation_locked &&
  !skill.specialized &&
  !["credit_rating", "fighting", "firearms"].includes(skill.id)
);

function freshState() {
  return {
    draftVersion: DRAFT_VERSION,
    step: 0,
    profile: {
      name: "", age: 25, pronouns: "", gender: "", birthplace: "", residence: ""
    },
    occupationId: "",
    rollMode: "manual",
    characteristics: Object.fromEntries(ALL_CHARACTERISTICS.map((name) => [name, ""])),
    rollDetails: {},
    rollCounts: Object.fromEntries(ALL_CHARACTERISTICS.map((name) => [name, 0])),
    quickRollCount: 0,
    occupationSelections: [],
    occupationSpends: {},
    personalRows: Array.from({ length: 4 }, () => ({ id: "", specialization: "", spend: 0 })),
    backstory: {
      story: "",
      personalDescription: "",
      beliefs: [""],
      significantPeople: [{ name: "", relationship: "", importance: "", notes: "" }],
      meaningfulLocations: [{ name: "", importance: "" }],
      treasuredPossessions: [{ name: "", importance: "" }],
      traits: [""],
      scars: [{ description: "", cause: "" }],
      phobias: [""],
      manias: [""]
    },
    result: null
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (!parsed || parsed.draftVersion !== DRAFT_VERSION) return freshState();
    return { ...freshState(), ...parsed, result: null };
  } catch {
    return freshState();
  }
}

let state = loadState();

const content = document.querySelector("#content");
const alertBox = document.querySelector("#alert");
const nextButton = document.querySelector("#next");
const backButton = document.querySelector("#back");

function saveState() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...state, result: null }));
  const node = document.querySelector("#save-state");
  if (node) node.textContent = "已自動儲存";
}

function esc(value = "") {
  return String(value).replace(/[&<>'"]/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[c]));
}

function showError(error) {
  alertBox.textContent = error?.message ?? String(error);
  alertBox.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearError() {
  alertBox.hidden = true;
  alertBox.textContent = "";
}

function selectedOccupation() {
  return COC7E_SAMPLE_OCCUPATIONS.find((item) => item.id === state.occupationId);
}

function occupationLabel(id) {
  return OCCUPATION_LABELS[id] ?? id;
}

function skillLabel(id) {
  return SKILL_LABELS[id] ?? id;
}

function skillDefinition(id) {
  return COC7E_SKILLS.find((item) => item.id === id);
}

function baseSkillId(fullId = "") {
  return fullId.split(":", 1)[0];
}

function fullSkillId(choice) {
  if (!choice?.id) return "";
  const def = skillDefinition(choice.id);
  if (!def?.specialized) return choice.id;
  const specialization = String(choice.specialization || "").trim();
  return specialization ? `${choice.id}:${specialization}` : "";
}

function displaySkillChoice(choice) {
  if (!choice?.id) return "尚未選擇";
  const full = fullSkillId(choice);
  if (!full) return skillLabel(choice.id);
  return choice.specialization ? `${skillLabel(choice.id)}（${choice.specialization}）` : skillLabel(choice.id);
}

function skillBase(id) {
  const def = skillDefinition(baseSkillId(id));
  if (!def) return 0;
  if (def.base_formula === "floor(DEX/2)") return Math.floor(Number(state.characteristics.DEX || 0) / 2);
  if (def.base_formula === "EDU") return Number(state.characteristics.EDU || 0);
  return Number(def.base || 0);
}

function occupationPool() {
  const occ = selectedOccupation();
  if (!occ) return 0;
  const EDU = Number(state.characteristics.EDU || 0);
  const APP = Number(state.characteristics.APP || 0);
  const STR = Number(state.characteristics.STR || 0);
  const DEX = Number(state.characteristics.DEX || 0);
  if (occ.point_formula === "EDU4") return EDU * 4;
  if (occ.point_formula === "EDU2_APP2") return EDU * 2 + APP * 2;
  return EDU * 2 + Math.max(STR, DEX) * 2;
}

function occupationUsed() {
  return Object.values(state.occupationSpends).reduce((sum, value) => sum + Number(value || 0), 0);
}

function personalPool() {
  return Number(state.characteristics.INT || 0) * 2;
}

function personalUsed() {
  return state.personalRows.reduce((sum, row) => sum + Number(row.spend || 0), 0);
}

function renderProgress() {
  document.querySelector("#steps").innerHTML = STEPS.map((label, index) =>
    `<li class="${index === state.step ? "active" : index < state.step ? "done" : ""}" ${index === state.step ? 'aria-current="step"' : ""}>${label}</li>`
  ).join("");
  document.querySelector("#draft-title").textContent = state.profile.name || "未命名調查員";
}

function renderSummary() {
  const stats = ALL_CHARACTERISTICS.filter((name) => state.characteristics[name] !== "")
    .map((name) => `<div class="stat"><small>${CHARACTERISTIC_LABELS[name]}</small><strong>${esc(state.characteristics[name])}</strong></div>`).join("");

  const occ = state.occupationId ? occupationLabel(state.occupationId) : "尚未選擇";
  const selectedSkills = state.occupationSelections.map(displaySkillChoice).filter((x) => x !== "尚未選擇");
  document.querySelector("#live-summary").innerHTML = `
    <div class="summary-block"><span>調查員</span><strong>${esc(state.profile.name || "未命名")}</strong></div>
    <div class="summary-block"><span>職業</span><strong>${esc(occ)}</strong></div>
    ${stats ? `<div class="summary-block"><span>能力值</span><div class="stat-row">${stats}</div></div>` : ""}
