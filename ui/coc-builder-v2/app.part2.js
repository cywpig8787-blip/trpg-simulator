    ${selectedSkills.length ? `<div class="summary-block"><span>職業技能</span>${selectedSkills.slice(0,8).map((s)=>`<span class="pill">${esc(s)}</span>`).join("")}</div>` : ""}
  `;
}

function render() {
  clearError();
  renderProgress();
  backButton.disabled = state.step === 0;
  nextButton.textContent = state.step === STEPS.length - 1 ? "下載角色卡" : "下一步";
  [renderProfile, renderOccupation, renderAbilities, renderSkills, renderBackstory, renderReview][state.step]();
  renderSummary();
}

function renderProfile() {
  content.innerHTML = `
    <h2>基本資料</h2>
    <p class="lead">先建立調查員的基本身分。只有姓名與年齡是必要欄位，其餘可以之後再補。</p>
    <div class="field-grid">
      ${profileField("姓名", "name", true)}
      ${profileField("年齡", "age", true, "number")}
      ${profileField("代稱", "pronouns")}
      ${profileField("性別", "gender")}
      ${profileField("出身地", "birthplace")}
      ${profileField("居住地", "residence")}
    </div>
  `;
  content.querySelectorAll("[data-profile]").forEach((input) => {
    input.addEventListener("input", () => {
      state.profile[input.dataset.profile] = input.type === "number" ? Number(input.value) : input.value;
      saveState();
      renderProgress();
      renderSummary();
    });
  });
}

function profileField(label, key, required = false, type = "text") {
  return `<div class="field"><label for="p-${key}">${label}${required ? " *" : ""}</label>
    <input id="p-${key}" data-profile="${key}" type="${type}" value="${esc(state.profile[key])}" ${required ? "required" : ""}>
  </div>`;
}

function renderOccupation() {
  content.innerHTML = `
    <h2>選擇職業</h2>
    <p class="lead">職業會決定職業技能、職業技能點公式與信用評級範圍。換職業時，V2 會明確重置技能配置，避免留下舊職業的無效資料。</p>
    <div class="choice-grid">
      ${COC7E_SAMPLE_OCCUPATIONS.map((occ) => `
        <button class="choice ${occ.id === state.occupationId ? "selected" : ""}" type="button" data-occ="${occ.id}">
          <strong>${esc(occupationLabel(occ.id))}</strong>
          <span>${occ.slots.map(slotSummary).join(" · ")}</span>
          <span>信用評級 ${occ.credit_range[0]}–${occ.credit_range[1]}</span>
        </button>`).join("")}
    </div>
  `;
  content.querySelectorAll("[data-occ]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextId = button.dataset.occ;
      if (nextId === state.occupationId) return;
      state.occupationId = nextId;
      state.occupationSelections = [];
      state.occupationSpends = {};
      state.personalRows = Array.from({ length: 4 }, () => ({ id: "", specialization: "", spend: 0 }));
      state.result = null;
      saveState();
      renderOccupation();
      renderSummary();
    });
  });
}

function slotSummary(slot) {
  if (slot.type === "fixed") {
    if (slot.skill_id === "science") return "科學分支";
    if (slot.skill_id === "language_other") return "外語";
    if (slot.skill_id === "art_craft") return "藝術／工藝";
    return skillLabel(slot.skill_id);
  }
  if (slot.type === "one_of") return `任選一項：${slot.options.map(skillLabel).join("／")}`;
  return slot.count === 1 ? "任選一項技能" : `任選 ${slot.count} 項技能`;
}

function renderAbilities() {
  content.innerHTML = `
    <h2>能力值</h2>
    <p class="lead">逐項擲骰時，每一項能力值各自最多擲 5 次；快速擲骰則整組最多重擲 5 次。</p>
    <div class="segmented">
      <button type="button" data-roll-mode="manual" class="${state.rollMode === "manual" ? "active" : ""}">逐項擲骰</button>
      <button type="button" data-roll-mode="quick" class="${state.rollMode === "quick" ? "active" : ""}">快速擲骰</button>
    </div>
    ${state.rollMode === "quick" ? `<button id="roll-all" class="primary roll-all" type="button" ${state.quickRollCount >= 5 ? "disabled" : ""}>${state.quickRollCount ? `全部重擲（${state.quickRollCount}/5）` : "一鍵擲骰（0/5）"}</button>` : ""}
    <div class="ability-grid">${ALL_CHARACTERISTICS.map(abilityCard).join("")}</div>
  `;

  content.querySelectorAll("[data-roll-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.rollMode === state.rollMode) return;
      const hasRolls = ALL_CHARACTERISTICS.some((name) => state.characteristics[name] !== "");
      if (hasRolls && !confirm("切換擲骰模式會清除目前的能力值結果。確定切換嗎？")) return;
      state.rollMode = button.dataset.rollMode;
      state.characteristics = Object.fromEntries(ALL_CHARACTERISTICS.map((name) => [name, ""]));
      state.rollDetails = {};
      state.rollCounts = Object.fromEntries(ALL_CHARACTERISTICS.map((name) => [name, 0]));
      state.quickRollCount = 0;
      state.occupationSpends = {};
      state.personalRows.forEach((row) => row.spend = 0);
      saveState();
      render();
    });
  });

  document.querySelector("#roll-all")?.addEventListener("click", rollAll);
  content.querySelectorAll("[data-roll-one]").forEach((button) => {
    button.addEventListener("click", () => rollOne(button.dataset.rollOne));
  });
}

function abilityCard(name) {
  const count = state.rollMode === "quick" ? state.quickRollCount : Number(state.rollCounts[name] || 0);
  const detail = state.rollDetails[name];
  const diceText = detail ? `${detail.dice.join("＋")}${detail.bonus ? `＋${detail.bonus}` : ""}，×5` : "尚未擲骰";
  return `<div class="ability-card">
    <div class="ability-top"><span>${CHARACTERISTIC_LABELS[name]}</span><span>${state.rollMode === "manual" ? `${count}/5` : ""}</span></div>
    <div class="ability-value">${state.characteristics[name] || "—"}</div>
    <div class="roll-line">
      <small>${diceText}</small>
      ${state.rollMode === "manual" ? `<button class="die" type="button" data-roll-one="${name}" ${count >= 5 ? "disabled" : ""}>${state.characteristics[name] ? "↻" : "⚄"}</button>` : ""}
    </div>
  </div>`;
}

function rollDice(count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

function rollOne(name) {
  const currentCount = Number(state.rollCounts[name] || 0);
  if (currentCount >= 5) return;
  const plusSix = ["SIZ", "INT", "EDU"].includes(name);
  const dice = rollDice(plusSix ? 2 : 3);
  const bonus = plusSix ? 6 : 0;
  state.characteristics[name] = (dice.reduce((sum, value) => sum + value, 0) + bonus) * 5;
  state.rollDetails[name] = { dice, bonus };
  state.rollCounts[name] = currentCount + 1;
  resetPointSpendsAfterCharacteristicChange();
  saveState();
  renderAbilities();
  renderSummary();
}

function rollAll() {
  if (state.quickRollCount >= 5) return;
  ALL_CHARACTERISTICS.forEach((name) => {
    const plusSix = ["SIZ", "INT", "EDU"].includes(name);
    const dice = rollDice(plusSix ? 2 : 3);
    const bonus = plusSix ? 6 : 0;
    state.characteristics[name] = (dice.reduce((sum, value) => sum + value, 0) + bonus) * 5;
    state.rollDetails[name] = { dice, bonus };
  });
  state.quickRollCount += 1;
  resetPointSpendsAfterCharacteristicChange();
  saveState();
  renderAbilities();
  renderSummary();
}

function resetPointSpendsAfterCharacteristicChange() {
  state.occupationSpends = {};
  state.personalRows.forEach((row) => row.spend = 0);
  state.result = null;
}

function ensureOccupationRows() {
  const occ = selectedOccupation();
  if (!occ) return;
  let index = 0;
  for (const slot of occ.slots) {
    for (let n = 0; n < slot.count; n++, index++) {
      state.occupationSelections[index] ??= { id: "", specialization: "" };
      if (slot.type === "fixed") state.occupationSelections[index].id = slot.skill_id;
    }
  }
  state.occupationSelections = state.occupationSelections.slice(0, 8);
}

function renderSkills() {
  ensureOccupationRows();
  const occ = selectedOccupation();
  if (!occ) {
    content.innerHTML = `<h2>技能配置</h2><p class="lead">請先選擇職業。</p>`;
    return;
  }

  content.innerHTML = `
    <h2>技能配置</h2>
    <p class="lead">職業技能與個人興趣使用不同點數池。數字輸入不會整頁重畫；你可以連續輸入，不會再因為欄位失焦而一直重新點。</p>
    <div class="pool-grid">
      <div class="pool-card"><strong>職業技能點</strong><span id="occ-pool">剩餘 ${occupationPool() - occupationUsed()}／${occupationPool()}</span></div>
      <div class="pool-card"><strong>個人興趣點</strong><span id="personal-pool">剩餘 ${personalPool() - personalUsed()}／${personalPool()}</span></div>
    </div>

    <section class="skill-section">
      <div class="skill-head"><div><h3>職業技能｜${esc(occupationLabel(occ.id))}</h3><small>必須完成 8 項職業技能，且最終值不可超過 90。</small></div></div>
