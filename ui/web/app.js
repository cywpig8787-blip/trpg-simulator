import {
  Coc7eCreationSession, COC7E_SAMPLE_OCCUPATIONS, COC7E_SKILLS
} from "./src/index.js";

const steps = ["基本資料", "選擇職業", "能力值", "技能配置", "背景故事", "完成確認"];
const coreNames = ["STR", "CON", "DEX", "INT", "SIZ", "POW", "APP", "EDU"];
const characteristicLabels = Object.freeze({ STR: "力量", CON: "體質", DEX: "敏捷", INT: "智力", SIZ: "體型", POW: "意志", APP: "外貌", EDU: "教育", Luck: "幸運" });
const occupationLabels = Object.freeze({
  antiquarian: "古物研究者", author: "作家", dilettante: "業餘愛好者", doctor_of_medicine: "醫師",
  journalist: "記者", police_detective: "警探", private_investigator: "私家偵探", professor: "教授"
});
const skillLabels = Object.freeze({
  accounting: "會計", anthropology: "人類學", appraise: "估價", archaeology: "考古學", art_craft: "藝術／工藝",
  charm: "魅惑", climb: "攀爬", credit_rating: "信用評級", cthulhu_mythos: "克蘇魯神話", disguise: "喬裝",
  dodge: "閃避", drive_auto: "汽車駕駛", electrical_repair: "電氣維修", fast_talk: "話術", fighting: "格鬥",
  fighting_brawl: "格鬥（鬥毆）", firearms: "射擊", firearms_handgun: "射擊（手槍）",
  firearms_rifle_shotgun: "射擊（步槍／霰彈槍）", first_aid: "急救", history: "歷史", intimidate: "恐嚇",
  jump: "跳躍", language_other: "外語", language_own: "母語", law: "法律", library_use: "圖書館使用",
  listen: "聆聽", locksmith: "鎖匠", mechanical_repair: "機械維修", medicine: "醫學", natural_world: "自然學",
  navigate: "導航", occult: "神祕學", operate_heavy_machinery: "操作重型機械", persuade: "說服", pilot: "駕駛",
  psychoanalysis: "精神分析", psychology: "心理學", ride: "騎術", science: "科學", sleight_of_hand: "妙手",
  spot_hidden: "偵查", stealth: "潛行", survival: "生存", swim: "游泳", throw: "投擲", track: "追蹤"
});
const skillOptions = COC7E_SKILLS.filter((skill) => !skill.creation_locked && !["credit_rating", "fighting", "firearms"].includes(skill.id));
const initial = {
  step: 0, mode: "manual", profile: { name: "", age: 25, pronouns: "", gender: "", birthplace: "", residence: "" },
  occupationId: "", characteristics: Object.fromEntries([...coreNames, "Luck"].map((name) => [name, ""])),
  luckDice: ["", "", ""], rollDetails: {}, rollCounts: {}, quickRollCount: 0, occupationSelections: [], occupationSpends: {}, personalSelections: ["", "", "", ""], personalSpends: {},
  backstory: { story: "", personal_description: "", ideology_beliefs: "", significant_people: "", meaningful_locations: "", treasured_possessions: "", traits: "", injuries_scars: "", phobias: "", manias: "" },
  result: null
};
let state = loadDraft();

const content = document.querySelector("#step-content");
const message = document.querySelector("#message");
const nextButton = document.querySelector("#next-button");
const backButton = document.querySelector("#back-button");

function loadDraft() {
  try { return { ...structuredClone(initial), ...JSON.parse(localStorage.getItem("trpg-coc7e-draft")) }; }
  catch { return structuredClone(initial); }
}
function saveDraft() {
  localStorage.setItem("trpg-coc7e-draft", JSON.stringify({ ...state, result: null }));
  document.querySelector("#save-status").textContent = "草稿已儲存在此裝置";
}
function esc(value = "") { return String(value).replace(/[&<>'"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c])); }
function showError(error) {
  const raw = error.message ?? String(error);
  const translations = [
    ["Occupation point pool must be fully allocated", "職業技能點必須全部分配完"],
    ["Personal point pool must be fully allocated", "個人興趣點必須全部分配完"],
    ["Credit Rating is outside the occupation range", "信用評級不符合所選職業的範圍"],
    ["Choose exactly eight distinct occupation skill entries", "請選滿八項且不得重複的職業技能"],
    ["requires a specialization", "需要填寫專精項目"],
    ["exceeds the creation cap", "超過創角上限 90"]
  ];
  message.textContent = translations.find(([key]) => raw.includes(key))?.[1] ?? raw;
  message.hidden = false; window.scrollTo({ top: 0, behavior: "smooth" });
}
function clearError() { message.hidden = true; message.textContent = ""; }
function selectedOccupation() { return COC7E_SAMPLE_OCCUPATIONS.find((item) => item.id === state.occupationId); }
function skillLabel(id) { return skillLabels[id] ?? id; }
function occupationLabel(id) { return occupationLabels[id] ?? id; }
function optionsHtml(selected = "", allowed = skillOptions) {
  return `<option value="">請選擇</option>${allowed.map((skill) => `<option value="${skill.id}" ${skill.id === selected ? "selected" : ""}>${esc(skillLabel(skill.id))}</option>`).join("")}`;
}
function skillBase(id) {
  const skill = COC7E_SKILLS.find((item) => item.id === id.split(":", 1)[0]);
  if (skill?.base_formula === "floor(DEX/2)") return Math.floor(Number(state.characteristics.DEX) / 2);
  if (skill?.base_formula === "EDU") return Number(state.characteristics.EDU);
  return Number(skill?.base ?? 0);
}
function occupationPool() {
  const occ = selectedOccupation(); if (!occ) return 0;
  const { EDU, APP, STR, DEX } = Object.fromEntries(coreNames.map((name) => [name, Number(state.characteristics[name])]));
  if (occ.point_formula === "EDU4") return EDU * 4;
  if (occ.point_formula === "EDU2_APP2") return EDU * 2 + APP * 2;
  return EDU * 2 + Math.max(STR, DEX) * 2;
}

function renderProgress() {
  document.querySelector("#step-list").innerHTML = steps.map((label, index) =>
    `<li class="${index === state.step ? "active" : index < state.step ? "done" : ""}" ${index === state.step ? 'aria-current="step"' : ""}>${label}</li>`
  ).join("");
  document.querySelector("#draft-name").textContent = state.profile.name || "未命名調查員";
}

function renderProfile() {
  content.innerHTML = `<h2>基本資料</h2><p class="lead">先建立這名調查員在故事中的身分。</p><div class="field-grid">
    ${field("姓名", "name", state.profile.name, true)}${field("年齡", "age", state.profile.age, true, "number")}
    ${field("代稱", "pronouns", state.profile.pronouns)}${field("性別", "gender", state.profile.gender)}
    ${field("出身地", "birthplace", state.profile.birthplace)}${field("居住地", "residence", state.profile.residence)}
  </div>`;
  content.querySelectorAll("input").forEach((input) => input.addEventListener("input", () => {
    state.profile[input.name] = input.type === "number" ? Number(input.value) : input.value;
    saveDraft(); renderProgress(); renderSheet();
  }));
}
function field(label, name, value, required = false, type = "text") {
  return `<div class="field"><label for="${name}">${label}${required ? " *" : ""}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${required ? "required" : ""}></div>`;
}

function renderOccupation() {
  content.innerHTML = `<h2>選擇職業</h2><p class="lead">職業決定調查員可選的職業技能；其餘人生經驗留給個人興趣技能。</p><div class="choice-grid">${COC7E_SAMPLE_OCCUPATIONS.map((occ) =>
    `<button class="choice-card ${occ.id === state.occupationId ? "selected" : ""}" type="button" data-id="${occ.id}"><strong>${esc(occupationLabel(occ.id))}</strong><span>${occ.slots.map(slotSummary).join(" · ")}</span></button>`
  ).join("")}</div>`;
  content.querySelectorAll(".choice-card").forEach((button) => button.addEventListener("click", () => {
    state.occupationId = button.dataset.id; state.occupationSelections = []; state.occupationSpends = {}; state.personalSelections = ["", "", "", ""]; state.personalSpends = {}; saveDraft(); render();
  }));
}
function slotSummary(slot) {
  if (slot.type === "fixed") return skillLabel(slot.skill_id);
  if (slot.type === "one_of") return `任選一項：${slot.options.map(skillLabel).join("／")}`;
  return slot.count === 1 ? "任選一項技能" : `任選 ${slot.count} 項技能`;
}

function renderAbilities() {
  content.innerHTML = `<h2>能力值</h2><p class="lead">可以逐項擲出能力值，也可以讓系統一次擲完九項。</p>
    <div class="segmented" role="group" aria-label="能力值產生方式"><button type="button" data-mode="manual" class="${state.mode === "manual" ? "active" : ""}">逐項擲骰</button><button type="button" data-mode="system" class="${state.mode === "system" ? "active" : ""}">快速擲骰</button></div>
    ${state.mode === "system" ? `<button id="roll-all" class="primary-button roll-all-button" type="button" ${state.quickRollCount >= 5 ? "disabled" : ""}>${state.quickRollCount ? `全部重擲（${state.quickRollCount}/5）` : "一鍵擲骰（0/5）"}</button>` : ""}
    <div class="ability-grid">${coreNames.map((name, index) => abilityField(name, index)).join("")}${luckField()}</div>`;
  content.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    state.characteristics = Object.fromEntries([...coreNames, "Luck"].map((name) => [name, ""])); state.rollDetails = {}; state.rollCounts = {}; state.quickRollCount = 0; state.luckDice = ["", "", ""];
    saveDraft(); render();
  }));
  document.querySelector("#roll-all")?.addEventListener("click", rollAllCharacteristics);
  content.querySelectorAll("[data-roll-one]").forEach((button) => button.addEventListener("click", () => rollOneCharacteristic(button.dataset.rollOne)));
}
function rollDice(count) { return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1); }
function rollAllCharacteristics() {
  if (state.quickRollCount >= 5) return;
  const details = {};
  for (const name of coreNames) {
    const dice = rollDice(["SIZ", "INT", "EDU"].includes(name) ? 2 : 3);
    const bonus = ["SIZ", "INT", "EDU"].includes(name) ? 6 : 0;
    details[name] = { dice, bonus };
    state.characteristics[name] = (dice.reduce((sum, die) => sum + die, 0) + bonus) * 5;
  }
  state.luckDice = rollDice(3);
  state.characteristics.Luck = state.luckDice.reduce((sum, die) => sum + die, 0) * 5;
  details.Luck = { dice: [...state.luckDice], bonus: 0 };
  state.rollDetails = details;
  state.quickRollCount += 1;
  saveDraft(); render();
}
function rollOneCharacteristic(name) {
  const count = Number(state.rollCounts?.[name] ?? 0);
  if (count >= 5) return;
  const twoDicePlusSix = ["SIZ", "INT", "EDU"].includes(name);
  const dice = rollDice(twoDicePlusSix ? 2 : 3);
  const bonus = twoDicePlusSix ? 6 : 0;
  state.rollDetails = { ...(state.rollDetails ?? {}), [name]: { dice, bonus } };
  state.rollCounts = { ...(state.rollCounts ?? {}), [name]: count + 1 };
  state.characteristics[name] = (dice.reduce((sum, die) => sum + die, 0) + bonus) * 5;
  if (name === "Luck") state.luckDice = [...dice];
  saveDraft(); render();
}
function rollText(name) {
  const detail = state.rollDetails?.[name];
  if (!detail) return "尚未擲骰";
  return `骰面：${detail.dice.join("＋")}${detail.bonus ? `＋${detail.bonus}` : ""}，再乘五`;
}
function abilityField(name, index) {
  if (state.mode === "system") return `<div class="ability-card"><label>${characteristicLabels[name]}<small>${rollText(name)}</small></label><strong class="rolled-value">${state.characteristics[name] || "—"}</strong></div>`;
  const count = Number(state.rollCounts?.[name] ?? 0);
  return `<div class="ability-card"><label>${characteristicLabels[name]}<small>${rollText(name)}</small></label><div class="roll-row"><strong class="rolled-value">${state.characteristics[name] || "—"}</strong><span class="roll-count">${count}/5</span><button class="die-button" data-roll-one="${name}" type="button" aria-label="擲${characteristicLabels[name]}，已擲${count}次" ${count >= 5 ? "disabled" : ""}>${state.characteristics[name] ? "↻" : "⚄"}</button></div></div>`;
}
function luckField() {
  if (state.mode === "system") return `<div class="ability-card"><label>幸運 <small>${rollText("Luck")}</small></label><strong class="rolled-value">${state.characteristics.Luck || "—"}</strong></div>`;
  const count = Number(state.rollCounts?.Luck ?? 0);
  return `<div class="ability-card"><label>幸運 <small>${rollText("Luck")}</small></label><div class="roll-row"><strong class="rolled-value">${state.characteristics.Luck || "—"}</strong><span class="roll-count">${count}/5</span><button class="die-button" data-roll-one="Luck" type="button" aria-label="擲幸運，已擲${count}次" ${count >= 5 ? "disabled" : ""}>${state.characteristics.Luck ? "↻" : "⚄"}</button></div></div>`;
}

function occupationRows() {
  const occupation = selectedOccupation(); if (!occupation) return "";
  const rows = []; let index = 0;
  for (const slot of occupation.slots) {
    for (let n = 0; n < slot.count; n++, index++) {
      const current = state.occupationSelections[index] ?? { id: "", specialization: "" };
      let allowed = skillOptions;
      if (slot.type === "fixed") allowed = skillOptions.filter((skill) => skill.id === slot.skill_id);
      if (slot.type === "one_of") allowed = skillOptions.filter((skill) => slot.options.includes(skill.id));
      const fixedId = slot.type === "fixed" ? slot.skill_id : current.id;
      const selected = fixedId || current.id;
      const def = COC7E_SKILLS.find((skill) => skill.id === selected);
      const fullId = def?.specialized && current.specialization.trim() ? `${selected}:${current.specialization.trim()}` : selected;
      const base = skillBase(selected);
      const spend = Number(state.occupationSpends?.[fullId] ?? 0);
      rows.push(`<tr><td>${index + 1}</td><td><select data-occ-skill="${index}" ${slot.type === "fixed" ? "disabled" : ""}>${optionsHtml(selected, allowed.filter((skill) => skill.id === selected || !state.occupationSelections.some((choice,j) => j !== index && choice?.id === skill.id)))}</select></td><td>${def?.specialized ? `<input class="${current.specialization.trim()?"":"needs-value"}" data-specialization="${index}" value="${esc(current.specialization)}" placeholder="必填，例如：生物學" aria-label="${esc(skillLabel(def.id))}專精"><small class="required-note">必填且不可重複</small>` : "—"}</td><td>${base}</td><td><input data-occ-spend="${index}" type="number" min="0" max="${90-base}" value="${spend}" inputmode="numeric" ${def?.specialized&&!current.specialization.trim()?"disabled":""}></td><td>${base + spend}</td></tr>`);
      if (slot.type === "fixed" && current.id !== fixedId) state.occupationSelections[index] = { id: fixedId, specialization: current.specialization };
    }
  }
  return rows.join("");
}
function renderSkills() {
  state.occupationSpends ??= {}; state.personalSelections ??= ["", "", "", ""]; state.personalSpends ??= {};
  const occPool = occupationPool(); const occUsed = Object.values(state.occupationSpends).reduce((sum,v)=>sum+Number(v||0),0);
  const personalPool = Number(state.characteristics.INT) * 2; const personalUsed = Object.values(state.personalSpends).reduce((sum,v)=>sum+Number(v||0),0);
  const creditBase=0, creditSpend=Number(state.occupationSpends.credit_rating??0);
  content.innerHTML = `<h2>技能配置</h2><p class="lead">先選職業技能，再分配職業點數；個人興趣使用另一個點數池。每項技能最高 90。</p>
    <div class="pool-banner"><strong>職業技能點</strong><span>剩餘 ${occPool-occUsed}／${occPool}</span></div>
    <div class="stack"><h3>職業技能｜${esc(occupationLabel(state.occupationId))}</h3><table class="skill-table"><thead><tr><th>項次</th><th>技能</th><th>專精</th><th>基礎</th><th>投入</th><th>最終</th></tr></thead><tbody>${occupationRows()}<tr><td>9</td><td>信用評級</td><td>—</td><td>0</td><td><input data-credit type="number" min="${selectedOccupation()?.credit_range?.[0]??0}" max="${selectedOccupation()?.credit_range?.[1]??90}" value="${creditSpend}" inputmode="numeric"></td><td>${creditBase+creditSpend}</td></tr></tbody></table><small>信用評級範圍：${selectedOccupation()?.credit_range?.[0]}–${selectedOccupation()?.credit_range?.[1]}</small></div>
    <div class="section-divider"><div class="pool-banner"><strong>個人興趣點（智力 × 2）</strong><span>剩餘 ${personalPool-personalUsed}／${personalPool}</span></div><div class="field-grid">${state.personalSelections.map((id,i)=>personalRow(id,i)).join("")}</div><button id="add-personal" class="secondary-button" type="button">增加興趣技能</button></div>`;
  content.querySelectorAll("[data-occ-skill]").forEach((select) => select.addEventListener("change", () => { const i=Number(select.dataset.occSkill); const old=state.occupationSelections[i]; if(old?.id)Object.keys(state.occupationSpends).filter(k=>k===old.id||k.startsWith(`${old.id}:`)).forEach(k=>delete state.occupationSpends[k]); state.occupationSelections[i]={id:select.value,specialization:""}; saveDraft(); renderSkills(); }));
  content.querySelectorAll("[data-specialization]").forEach((input) => input.addEventListener("change", () => { const i=Number(input.dataset.specialization); const old=state.occupationSelections[i]; Object.keys(state.occupationSpends).filter(k=>k===old.id||k.startsWith(`${old.id}:`)).forEach(k=>delete state.occupationSpends[k]); state.occupationSelections[i].specialization=input.value; saveDraft(); renderSkills(); }));
  content.querySelectorAll("[data-occ-spend]").forEach((input)=>input.addEventListener("change",()=>{const i=Number(input.dataset.occSpend);const c=state.occupationSelections[i];if(!c?.id)return;const id=COC7E_SKILLS.find(s=>s.id===c.id)?.specialized?`${c.id}:${c.specialization.trim()}`:c.id;state.occupationSpends[id]=Number(input.value);saveDraft();renderSkills();}));
  content.querySelector("[data-credit]").addEventListener("change",(e)=>{state.occupationSpends.credit_rating=Number(e.target.value);saveDraft();renderSkills();});
  content.querySelectorAll("[data-personal]").forEach((select)=>select.addEventListener("change",()=>{const i=Number(select.dataset.personal);const old=state.personalSelections[i];if(old)delete state.personalSpends[old];state.personalSelections[i]=select.value;saveDraft();renderSkills();}));
  content.querySelectorAll("[data-personal-spend]").forEach((input)=>input.addEventListener("change",()=>{const id=state.personalSelections[Number(input.dataset.personalSpend)];if(id)state.personalSpends[id]=Number(input.value);saveDraft();renderSkills();}));
  document.querySelector("#add-personal").addEventListener("click",()=>{if(state.personalSelections.length<10){state.personalSelections.push("");saveDraft();renderSkills();}});
}
function personalRow(id,i){
  const blocked=new Set([...state.occupationSelections.map(x=>x?.id),...state.personalSelections.filter((_,j)=>j!==i)]);const allowed=skillOptions.filter(skill=>!skill.specialized&&(skill.id===id||!blocked.has(skill.id)));const base=id?skillBase(id):0;const spend=Number(state.personalSpends?.[id]??0);
  return `<div class="personal-row"><label>興趣技能 ${i+1}</label><select data-personal="${i}">${optionsHtml(id,allowed)}</select><span>基礎 ${base}</span><input data-personal-spend="${i}" type="number" min="0" max="${90-base}" value="${spend}" ${id?"":"disabled"} inputmode="numeric" aria-label="投入興趣點"><strong>最終 ${base+spend}</strong></div>`;
}

function renderBackstory() {
  const fields = [["story","完整角色故事"],["personal_description","外貌描述"],["ideology_beliefs","思想／信仰"],["significant_people","重要之人"],["meaningful_locations","重要地點"],["treasured_possessions","珍視之物"],["traits","個人特質"],["injuries_scars","傷勢／傷疤"],["phobias","恐懼症"],["manias","狂躁症"]];
  content.innerHTML = `<h2>背景故事</h2><p class="lead">故事與結構化欄位會同時保存，供遊戲主持人、非玩家角色和劇本事件引用。多筆內容請以換行分隔。</p><div class="field-grid">${fields.map(([id,label],i)=>`<div class="field ${i===0?"full":""}"><label for="${id}">${label}</label><textarea id="${id}" data-backstory="${id}">${esc(state.backstory[id])}</textarea></div>`).join("")}</div>`;
  content.querySelectorAll("[data-backstory]").forEach((area)=>area.addEventListener("input",()=>{state.backstory[area.dataset.backstory]=area.value;saveDraft();}));
}

function renderReview() {
  content.innerHTML = `<h2>完成確認</h2><p class="lead">確認後會產生可存檔、可交給劇本使用的調查員角色卡。</p><div class="review-card">${state.result ? `<h3>${esc(state.result.name)}</h3><p>${esc(occupationLabel(state.occupationId))} · 克蘇魯的呼喚第七版</p><button id="download-json" class="secondary-button" type="button">下載角色卡檔案</button>` : "<p>尚未產生角色卡。</p>"}</div>`;
  document.querySelector("#download-json")?.addEventListener("click", downloadResult);
}

function normalizeBackstory() {
  const listKeys = ["ideology_beliefs","significant_people","meaningful_locations","treasured_possessions","traits","injuries_scars","phobias","manias"];
  return Object.fromEntries(Object.entries(state.backstory).map(([key,value]) => [key, listKeys.includes(key) ? value.split("\n").map(v=>v.trim()).filter(Boolean) : value]));
}
function selectedSkillIds() {
  return state.occupationSelections.map(({id,specialization}) => {
    const def=COC7E_SKILLS.find((skill)=>skill.id===id); return def?.specialized ? `${id}:${specialization.trim()}` : id;
  });
}
function validateOccupationSelections() {
  const choices = Array.from({ length: 8 }, (_, index) => state.occupationSelections[index]);
  if (state.occupationSelections.length !== 8 || choices.some((choice) => !choice?.id)) {
    throw new Error("請選滿八項職業技能");
  }
  for (let index = 0; index < choices.length; index++) {
    const choice = choices[index];
    const definition = COC7E_SKILLS.find((skill) => skill.id === choice.id);
    if (definition?.specialized && !choice.specialization.trim()) {
      throw new Error(`第 ${index + 1} 項「${skillLabel(choice.id)}」需要填寫專精`);
    }
  }
  const ids = selectedSkillIds().map((id) => id.toLocaleLowerCase("zh-Hant"));
  const duplicateIndex = ids.findIndex((id, index) => ids.indexOf(id) !== index);
  if (duplicateIndex >= 0) {
    const choice = state.occupationSelections[duplicateIndex];
    throw new Error(`第 ${duplicateIndex + 1} 項「${skillLabel(choice.id)}」的專精與前面重複`);
  }
}
function buildResult() {
  validateOccupationSelections();
  const ids = selectedSkillIds();
  const session = new Coc7eCreationSession(crypto.randomUUID()).setProfile(state.profile).chooseOccupation(state.occupationId);
  if (state.mode === "manual") session.useManualRoll(
    Object.fromEntries(Object.entries(state.characteristics).map(([k,v])=>[k,Number(v)])),
    Object.fromEntries(Object.entries(state.rollDetails).map(([name, detail]) => [name, detail.dice]))
  );
  else session.useAutomaticRoll(
    Object.fromEntries([...coreNames, "Luck"].map((name)=>[name,Number(state.characteristics[name])])),
    Object.fromEntries(Object.entries(state.rollDetails).map(([name, detail]) => [name, detail.dice]))
  );
  return session.allocateSkillsByPoints(ids, state.occupationSpends, state.personalSpends).setBackstory(normalizeBackstory()).finalize();
}
function validateCurrentStep() {
  if (state.step===0) { if (!state.profile.name.trim()) throw new Error("請填寫調查員姓名"); if (!Number.isInteger(Number(state.profile.age)) || Number(state.profile.age)<15) throw new Error("年齡至少為 15"); }
  if (state.step===1 && !state.occupationId) throw new Error("請選擇一個職業");
  if (state.step===2) {
    if (coreNames.some((name)=>!Number.isInteger(Number(state.characteristics[name])))) throw new Error("請完成八項能力值");
    if (state.mode==="manual" && [...coreNames,"Luck"].some((name)=>!state.rollDetails?.[name])) throw new Error("請把每一項能力值都擲完");
    if (state.mode==="system") {
      if ([...coreNames,"Luck"].some((name)=>!Number.isInteger(Number(state.characteristics[name])))) throw new Error("請先按下一鍵擲骰");
    }
  }
  if (state.step===3) state.result=buildResult();
}
function downloadResult() { const blob=new Blob([JSON.stringify(state.result,null,2)],{type:"application/json"}); const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${state.result.name||"調查員"}.json`;a.click();URL.revokeObjectURL(a.href); }

function renderSheet() {
  const stats = [...coreNames,"Luck"].filter((name)=>state.characteristics[name]).map((name)=>`<div class="stat"><small>${characteristicLabels[name]}</small><strong>${state.characteristics[name]}</strong></div>`).join("");
  document.querySelector("#live-sheet").innerHTML=`<h3>即時摘要</h3><div class="sheet-block"><span>調查員</span><strong>${esc(state.profile.name||"未命名")}</strong></div><div class="sheet-block"><span>職業</span><strong>${esc(state.occupationId ? occupationLabel(state.occupationId) : "尚未選擇")}</strong></div>${stats?`<div class="sheet-block"><span>能力值</span><div class="stat-row">${stats}</div></div>`:""}`;
}
function render() {
  clearError(); renderProgress(); backButton.disabled=state.step===0; nextButton.textContent=state.step===steps.length-1?"下載角色卡":"下一步";
  [renderProfile,renderOccupation,renderAbilities,renderSkills,renderBackstory,renderReview][state.step](); renderSheet();
}
nextButton.addEventListener("click",()=>{try{clearError();if(state.step===steps.length-1){if(state.result)downloadResult();return;}validateCurrentStep();state.step+=1;saveDraft();render();window.scrollTo({top:0});}catch(error){showError(error);}});
backButton.addEventListener("click",()=>{if(state.step>0){state.step-=1;saveDraft();render();window.scrollTo({top:0});}});
document.querySelector("#reset-button").addEventListener("click",()=>{if(confirm("確定清除目前的創角草稿嗎？")){state=structuredClone(initial);localStorage.removeItem("trpg-coc7e-draft");render();}});
render();
