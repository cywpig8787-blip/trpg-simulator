      <div class="skill-table-wrap">
        <table class="skill-table">
          <thead><tr><th>#</th><th>技能</th><th>分支／內容</th><th>基礎</th><th>投入</th><th>最終</th></tr></thead>
          <tbody>${occupationRowsHtml(occ)}</tbody>
        </table>
      </div>
      <div class="field" style="max-width:320px">
        <label for="credit">信用評級（職業要求 ${occ.credit_range[0]}–${occ.credit_range[1]}）</label>
        <input id="credit" type="number" inputmode="numeric" min="0" max="${occ.credit_range[1]}" value="${Number(state.occupationSpends.credit_rating || 0)}">
        <small class="inline-note">信用評級會使用職業技能點。</small>
      </div>
    </section>

    <section class="skill-section">
      <div class="skill-head">
        <div><h3>個人興趣技能</h3><small>可以自由增加欄位；與職業技能衝突的技能會自動從清單排除。</small></div>
        <button id="add-personal" class="secondary" type="button">增加技能</button>
      </div>
      <div id="personal-list" class="personal-list">${state.personalRows.map(personalRowHtml).join("")}</div>
    </section>

    <div id="skill-status" class="status-line"></div>
  `;

  bindOccupationSkillEvents();
  bindCreditEvent();
  bindPersonalEvents();
  updateSkillLiveValues();
}

function occupationRowsHtml(occ) {
  let index = 0;
  const rows = [];
  for (const slot of occ.slots) {
    for (let n = 0; n < slot.count; n++, index++) {
      const choice = state.occupationSelections[index];
      rows.push(occupationRowHtml(index, slot, choice));
    }
  }
  return rows.join("");
}

function occupationRowHtml(index, slot, choice) {
  const base = choice?.id ? skillBase(choice.id) : 0;
  const fullId = fullSkillId(choice);
  const spend = Number(state.occupationSpends[fullId] || 0);
  const finalValue = base + spend;

  let skillCell = "";
  let detailCell = "";

  if (slot.type === "fixed") {
    skillCell = `<strong>${esc(skillLabel(slot.skill_id))}</strong>`;
    detailCell = specializationControl(index, choice, slot.skill_id, true);
  } else if (slot.type === "one_of") {
    const selected = choice?.id || "";
    skillCell = `<select class="skill-choice" data-occ-base="${index}">
      <option value="">請選擇</option>
      ${slot.options.map((id) => `<option value="${id}" ${id === selected ? "selected" : ""}>${esc(skillLabel(id))}</option>`).join("")}
    </select>`;
    detailCell = selected ? specializationControl(index, choice, selected, false) : "—";
  } else {
    const currentFull = fullSkillId(choice);
    skillCell = `<select class="skill-choice" data-occ-full="${index}">
      ${expandedSkillOptions(currentFull, index, "occupation")}
    </select>`;
    detailCell = customDetailForExpandedChoice(index, choice, "occupation");
  }

  const def = choice?.id ? skillDefinition(choice.id) : null;
  const needsSpecialization = Boolean(def?.specialized && !String(choice.specialization || "").trim());
  return `<tr>
    <td>${index + 1}</td>
    <td class="skill-name">${skillCell}</td>
    <td class="skill-custom">${detailCell}${needsSpecialization ? `<small class="inline-note inline-error">請完成分支／內容</small>` : ""}</td>
    <td>${base || "—"}</td>
    <td><input class="skill-number" data-occ-spend="${index}" type="number" inputmode="numeric" min="0" max="${Math.max(0, 90 - base)}" value="${spend}" ${!fullId ? "disabled" : ""}></td>
    <td class="skill-final" id="occ-final-${index}">${fullId ? finalValue : "—"}</td>
  </tr>`;
}

function specializationControl(index, choice, baseId, isFixed) {
  if (!baseId) return "—";
  const def = skillDefinition(baseId);
  if (!def?.specialized) return "—";

  if (DIRECT_SPECIALIZATIONS[baseId]) {
    return `<select data-occ-specialization="${index}">
      <option value="">請選擇分支</option>
      ${DIRECT_SPECIALIZATIONS[baseId].map(([value, label]) =>
        `<option value="${esc(value)}" ${choice.specialization === value ? "selected" : ""}>${esc(label)}</option>`
      ).join("")}
    </select>`;
  }

  if (baseId === "language_other") return languageControl(index, choice, "occ");
  if (baseId === "art_craft") {
    return `<input data-occ-custom="${index}" value="${esc(choice.specialization || "")}" placeholder="例如：攝影、繪畫、烹飪">`;
  }
  if (baseId === "language_own") {
    return `<input data-occ-custom="${index}" value="${esc(choice.specialization || "")}" placeholder="輸入母語，例如：中文">`;
  }
  return isFixed
    ? `<input data-occ-custom="${index}" value="${esc(choice.specialization || "")}" placeholder="輸入分支">`
    : `<input data-occ-custom="${index}" value="${esc(choice.specialization || "")}" placeholder="輸入分支">`;
}

function languageControl(index, choice, prefix) {
  const commonValues = new Set(COMMON_LANGUAGES.map(([value]) => value));
  const current = choice.specialization || "";
  const selectValue = !current ? "" : commonValues.has(current) ? current : "__custom__";
  const dataName = prefix === "occ" ? "data-occ-language" : "data-personal-language";
  const inputName = prefix === "occ" ? "data-occ-language-custom" : "data-personal-language-custom";
  return `<div class="field">
    <select ${dataName}="${index}">
      <option value="">請選擇語言</option>
      ${COMMON_LANGUAGES.map(([value, label]) => `<option value="${value}" ${selectValue === value ? "selected" : ""}>${label}</option>`).join("")}
      <option value="__custom__" ${selectValue === "__custom__" ? "selected" : ""}>其他外語……</option>
    </select>
    ${selectValue === "__custom__" ? `<input ${inputName}="${index}" value="${esc(current)}" placeholder="輸入語言，例如：拉丁語">` : ""}
  </div>`;
}

function expandedSkillOptions(currentFull = "", rowIndex = -1, context = "occupation") {
  const options = [{ value: "", label: "請選擇" }];
  GENERIC_SKILLS.forEach((skill) => options.push({ value: skill.id, label: skillLabel(skill.id) }));
  DIRECT_SPECIALIZATIONS.science.forEach(([spec, label]) => options.push({ value: `science:${spec}`, label }));
  DIRECT_SPECIALIZATIONS.pilot.forEach(([spec, label]) => options.push({ value: `pilot:${spec}`, label }));
  DIRECT_SPECIALIZATIONS.survival.forEach(([spec, label]) => options.push({ value: `survival:${spec}`, label }));
  COMMON_LANGUAGES.forEach(([spec, label]) => options.push({ value: `language_other:${spec}`, label }));
  options.push({ value: "language_other:__custom__", label: "外語（其他……）" });
  options.push({ value: "art_craft:__custom__", label: "藝術／工藝（自訂……）" });
  if (currentFull.startsWith("language_other:") &&
      !COMMON_LANGUAGES.some(([spec]) => currentFull === `language_other:${spec}`)) {
    options.push({ value: currentFull, label: `外語（${currentFull.slice(currentFull.indexOf(":") + 1)}）` });
  }
  if (currentFull.startsWith("art_craft:")) {
    options.push({ value: currentFull, label: `藝術／工藝（${currentFull.slice(currentFull.indexOf(":") + 1)}）` });
  }

  const occupationFullIds = state.occupationSelections.map(fullSkillId);
  const occupationBaseIds = new Set(occupationFullIds.filter(Boolean).map(baseSkillId));
  const personalFullIds = state.personalRows.map(fullSkillId);

  return options.filter((option) => {
    if (!option.value || option.value === currentFull) return true;
    const normalized = option.value.endsWith(":__custom__") ? "" : option.value;
    if (context === "occupation") {
      if (!normalized) return true;
      return !occupationFullIds.some((id, idx) => idx !== rowIndex && id === normalized);
    }
    if (normalized && occupationBaseIds.has(baseSkillId(normalized))) return false;
    if (normalized && personalFullIds.some((id, idx) => idx !== rowIndex && id === normalized)) return false;
    return true;
  }).map((option) =>
    `<option value="${esc(option.value)}" ${option.value === currentFull ? "selected" : ""}>${esc(option.label)}</option>`
  ).join("");
}

function customDetailForExpandedChoice(index, choice, context) {
  if (!choice?.id) return "—";
  if (choice.id === "language_other") return languageControl(index, choice, context === "occupation" ? "occ" : "personal");
  if (choice.id === "art_craft") {
    const attr = context === "occupation" ? "data-occ-custom" : "data-personal-custom";
    return `<input ${attr}="${index}" value="${esc(choice.specialization || "")}" placeholder="輸入藝術／工藝內容">`;
  }
  return "—";
}

function bindOccupationSkillEvents() {
