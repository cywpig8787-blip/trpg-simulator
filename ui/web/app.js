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
const occupationValues = [70, 60, 60, 50, 50, 50, 40, 40, 40];
const skillOptions = COC7E_SKILLS.filter((skill) => !skill.creation_locked && !["credit_rating", "fighting", "firearms"].includes(skill.id));
const initial = {
  step: 0, mode: "manual", profile: { name: "", age: 25, pronouns: "", gender: "", birthplace: "", residence: "" },
  occupationId: "", characteristics: Object.fromEntries([...coreNames, "Luck"].map((name) => [name, ""])),
  luckDice: ["", "", ""], rollDetails: {}, rollCounts: {}, quickRollCount: 0, occupationSelections: [], assignmentValues: [], personalSkills: ["", "", "", ""],
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
function showError(error) { message.textContent = error.message ?? String(error); message.hidden = false; window.scrollTo({ top: 0, behavior: "smooth" }); }
function clearError() { message.hidden = true; message.textContent = ""; }
function selectedOccupation() { return COC7E_SAMPLE_OCCUPATIONS.find((item) => item.id === state.occupationId); }
function skillLabel(id) { return skillLabels[id] ?? id; }
function occupationLabel(id) { return occupationLabels[id] ?? id; }
function optionsHtml(selected = "", allowed = skillOptions) {
  return `<option value="">請選擇</option>${allowed.map((skill) => `<option value="${skill.id}" ${skill.id === selected ? "selected" : ""}>${esc(skillLabel(skill.id))}</option>`).join("")}`;
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
    state.occupationId = button.dataset.id; state.occupationSelections = []; state.assignmentValues = []; saveDraft(); render();
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
      rows.push(`<tr><td>${index + 1}</td><td><select data-occ-skill="${index}" ${slot.type === "fixed" ? "disabled" : ""}>${optionsHtml(selected, allowed)}</select></td><td>${def?.specialized ? `<input data-specialization="${index}" value="${esc(current.specialization)}" placeholder="填寫專精" aria-label="${esc(skillLabel(def.id))}專精">` : "—"}</td><td><select data-assignment="${index}">${occupationValues.map((value) => `<option value="${value}" ${Number(state.assignmentValues[index] ?? occupationValues[index]) === value ? "selected" : ""}>${value}</option>`).join("")}</select></td></tr>`);
      if (slot.type === "fixed" && current.id !== fixedId) state.occupationSelections[index] = { id: fixedId, specialization: current.specialization };
    }
  }
  return rows.join("");
}
function renderSkills() {
  content.innerHTML = `<h2>技能配置</h2><p class="lead">選滿八項職業技能並分配九組數值；信用評級也占一組。個人興趣則選四項非職業技能，各增加 20。</p>
    <div class="stack"><h3>職業技能｜${esc(occupationLabel(state.occupationId))}</h3><table class="skill-table"><thead><tr><th>項次</th><th>技能</th><th>專精</th><th>最終值</th></tr></thead><tbody>${occupationRows()}<tr><td>9</td><td>信用評級</td><td>—</td><td><select data-credit>${occupationValues.map((value)=>`<option value="${value}" ${Number(state.assignmentValues[8] ?? occupationValues[8])===value?"selected":""}>${value}</option>`).join("")}</select></td></tr></tbody></table></div>
    <div class="section-divider"><h3>個人興趣技能</h3><div class="field-grid">${state.personalSkills.map((id,i)=>`<div class="field"><label>興趣技能 ${i+1}</label><select data-personal="${i}">${optionsHtml(id)}</select></div>`).join("")}</div></div>`;
  content.querySelectorAll("[data-occ-skill]").forEach((select) => select.addEventListener("change", () => { const i=Number(select.dataset.occSkill); state.occupationSelections[i]={id:select.value,specialization:""}; saveDraft(); render(); }));
  content.querySelectorAll("[data-specialization]").forEach((input) => input.addEventListener("input", () => { const i=Number(input.dataset.specialization); state.occupationSelections[i].specialization=input.value; saveDraft(); }));
  content.querySelectorAll("[data-assignment]").forEach((select) => select.addEventListener("change", () => { state.assignmentValues[Number(select.dataset.assignment)]=Number(select.value); saveDraft(); }));
  content.querySelector("[data-credit]").addEventListener("change", (e) => { state.assignmentValues[8]=Number(e.target.value); saveDraft(); });
  content.querySelectorAll("[data-personal]").forEach((select)=>select.addEventListener("change",()=>{state.personalSkills[Number(select.dataset.personal)]=select.value;saveDraft();}));
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
function buildResult() {
  const values = state.assignmentValues.length === 9 ? state.assignmentValues : occupationValues;
  const ids = selectedSkillIds();
  const assignments = Object.fromEntries([...ids,"credit_rating"].map((id,i)=>[id,Number(values[i])]));
  const session = new Coc7eCreationSession(crypto.randomUUID()).setProfile(state.profile).chooseOccupation(state.occupationId);
  if (state.mode === "manual") session.useManualRoll(
    Object.fromEntries(Object.entries(state.characteristics).map(([k,v])=>[k,Number(v)])),
    Object.fromEntries(Object.entries(state.rollDetails).map(([name, detail]) => [name, detail.dice]))
  );
  else session.useAutomaticRoll(
    Object.fromEntries([...coreNames, "Luck"].map((name)=>[name,Number(state.characteristics[name])])),
    Object.fromEntries(Object.entries(state.rollDetails).map(([name, detail]) => [name, detail.dice]))
  );
  return session.allocateSkills(ids, assignments, state.personalSkills).setBackstory(normalizeBackstory()).finalize();
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
