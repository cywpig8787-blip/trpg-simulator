    button.addEventListener("click", () => {
      state.personalRows.splice(Number(button.dataset.personalRemove), 1);
      if (!state.personalRows.length) state.personalRows.push({ id: "", specialization: "", spend: 0 });
      saveState();
      renderSkills();
    });
  });
}

function updateSkillLiveValues() {
  const occRemaining = occupationPool() - occupationUsed();
  const personalRemaining = personalPool() - personalUsed();
  const occPoolNode = document.querySelector("#occ-pool");
  const personalPoolNode = document.querySelector("#personal-pool");
  if (occPoolNode) occPoolNode.textContent = `剩餘 ${occRemaining}／${occupationPool()}`;
  if (personalPoolNode) personalPoolNode.textContent = `剩餘 ${personalRemaining}／${personalPool()}`;

  state.occupationSelections.forEach((choice, index) => {
    const full = fullSkillId(choice);
    const node = document.querySelector(`#occ-final-${index}`);
    const input = document.querySelector(`[data-occ-spend="${index}"]`);
    if (node) node.textContent = full ? String(skillBase(full) + Number(state.occupationSpends[full] || 0)) : "—";
    if (input) {
      input.disabled = !full;
      input.max = full ? String(Math.max(0, 90 - skillBase(full))) : "0";
      if (!full) input.value = "0";
    }
  });
  state.personalRows.forEach((row, index) => {
    const full = fullSkillId(row);
    const node = document.querySelector(`#personal-final-${index}`);
    const input = document.querySelector(`[data-personal-spend="${index}"]`);
    if (node) node.textContent = full ? String(skillBase(full) + Number(row.spend || 0)) : "—";
    if (input) {
      input.disabled = !full;
      input.max = full ? String(Math.max(0, 90 - skillBase(full))) : "0";
      if (!full) input.value = "0";
    }
  });

  const status = document.querySelector("#skill-status");
  if (!status) return;
  const issues = skillIssues();
  status.classList.toggle("good", issues.length === 0);
  status.textContent = issues.length ? issues.join("｜") : "技能配置完成，可以前往背景故事。";
}

function skillIssues() {
  const issues = [];
  const occ = selectedOccupation();
  if (!occ) return ["尚未選擇職業"];
  const complete = state.occupationSelections.filter((choice) => fullSkillId(choice)).length;
  if (complete < 8) issues.push(`職業技能尚缺 ${8 - complete} 項`);

  const fullIds = state.occupationSelections.map(fullSkillId).filter(Boolean);
  if (new Set(fullIds.map((id) => id.toLocaleLowerCase("zh-Hant"))).size !== fullIds.length) {
    issues.push("職業技能有重複項目");
  }

  const credit = Number(state.occupationSpends.credit_rating || 0);
  if (credit < occ.credit_range[0] || credit > occ.credit_range[1]) {
    issues.push(`信用評級需為 ${occ.credit_range[0]}–${occ.credit_range[1]}`);
  }

  const occRemaining = occupationPool() - occupationUsed();
  const personalRemaining = personalPool() - personalUsed();
  if (occRemaining !== 0) issues.push(`職業技能點剩餘 ${occRemaining}`);
  if (personalRemaining !== 0) issues.push(`個人興趣點剩餘 ${personalRemaining}`);

  const personalIncomplete = state.personalRows.some((row) => row.id && !fullSkillId(row));
  if (personalIncomplete) issues.push("有個人興趣技能尚未完成分支／內容");

  const personalFull = state.personalRows.map(fullSkillId).filter(Boolean);
  if (new Set(personalFull.map((id) => id.toLocaleLowerCase("zh-Hant"))).size !== personalFull.length) {
    issues.push("個人興趣技能有重複項目");
  }

  const occupationBases = new Set(fullIds.map(baseSkillId));
  if (personalFull.some((id) => occupationBases.has(baseSkillId(id)))) {
    issues.push("個人興趣技能不可與職業技能使用相同技能類別");
  }

  return issues;
}

function renderBackstory() {
  content.innerHTML = `
    <h2>背景故事</h2>
    <p class="lead">自由故事和結構化背景會一起保存。重要人物、地點、珍視物與傷疤可以建立多筆資料，之後 GM／AI GM 可以直接引用。</p>

    <div class="field-grid">
      <div class="field full"><label>完整角色故事</label><textarea data-story="story">${esc(state.backstory.story)}</textarea></div>
      <div class="field full"><label>外貌描述</label><textarea data-story="personalDescription">${esc(state.backstory.personalDescription)}</textarea></div>
    </div>

    ${simpleListSection("思想／信仰", "beliefs", "例如：知識應該被自由分享")}
    ${peopleSection()}
    ${objectListSection("重要地點", "meaningfulLocations", "地點", "重要原因")}
    ${objectListSection("珍視之物", "treasuredPossessions", "物品", "重要原因")}
    ${simpleListSection("個人特質", "traits", "例如：遇到危險會先觀察出口")}
    ${scarSection()}
    ${simpleListSection("恐懼症", "phobias", "例如：深海")}
    ${simpleListSection("狂躁症", "manias", "例如：反覆整理桌面")}
  `;
  bindBackstoryEvents();
}

function simpleListSection(title, key, placeholder) {
  const list = state.backstory[key];
  return `<section class="background-group">
    <div class="skill-head"><h3>${title}</h3><button class="secondary add" type="button" data-add-simple="${key}">新增</button></div>
    <div class="repeat-list">${list.map((value, index) => `
      <div class="repeat-card">
        <div class="field"><input data-simple="${key}" data-index="${index}" value="${esc(value)}" placeholder="${esc(placeholder)}"></div>
        <div class="repeat-actions"><button class="remove" type="button" data-remove-simple="${key}" data-index="${index}">移除</button></div>
      </div>`).join("")}
    </div>
  </section>`;
}

function peopleSection() {
  return `<section class="background-group">
    <div class="skill-head"><h3>重要之人</h3><button class="secondary add" type="button" data-add-object="significantPeople">新增人物</button></div>
    <div class="repeat-list">${state.backstory.significantPeople.map((person, index) => `
      <div class="repeat-card">
        <div class="field-grid">
          <div class="field"><label>姓名／稱呼</label><input data-object="significantPeople" data-index="${index}" data-field="name" value="${esc(person.name)}"></div>
          <div class="field"><label>關係</label><input data-object="significantPeople" data-index="${index}" data-field="relationship" value="${esc(person.relationship)}"></div>
          <div class="field"><label>為何重要</label><input data-object="significantPeople" data-index="${index}" data-field="importance" value="${esc(person.importance)}"></div>
          <div class="field"><label>備註</label><input data-object="significantPeople" data-index="${index}" data-field="notes" value="${esc(person.notes)}"></div>
        </div>
        <div class="repeat-actions"><button class="remove" type="button" data-remove-object="significantPeople" data-index="${index}">移除</button></div>
      </div>`).join("")}
    </div>
  </section>`;
}

function objectListSection(title, key, nameLabel, importanceLabel) {
  return `<section class="background-group">
    <div class="skill-head"><h3>${title}</h3><button class="secondary add" type="button" data-add-object="${key}">新增</button></div>
    <div class="repeat-list">${state.backstory[key].map((item, index) => `
      <div class="repeat-card">
        <div class="field-grid">
          <div class="field"><label>${nameLabel}</label><input data-object="${key}" data-index="${index}" data-field="name" value="${esc(item.name)}"></div>
          <div class="field"><label>${importanceLabel}</label><input data-object="${key}" data-index="${index}" data-field="importance" value="${esc(item.importance)}"></div>
        </div>
        <div class="repeat-actions"><button class="remove" type="button" data-remove-object="${key}" data-index="${index}">移除</button></div>
      </div>`).join("")}
    </div>
  </section>`;
}

function scarSection() {
  return `<section class="background-group">
    <div class="skill-head"><h3>傷勢／傷疤</h3><button class="secondary add" type="button" data-add-object="scars">新增</button></div>
    <div class="repeat-list">${state.backstory.scars.map((item, index) => `
      <div class="repeat-card">
        <div class="field-grid">
          <div class="field"><label>描述</label><input data-object="scars" data-index="${index}" data-field="description" value="${esc(item.description)}"></div>
          <div class="field"><label>原因</label><input data-object="scars" data-index="${index}" data-field="cause" value="${esc(item.cause)}"></div>
        </div>
        <div class="repeat-actions"><button class="remove" type="button" data-remove-object="scars" data-index="${index}">移除</button></div>
      </div>`).join("")}
    </div>
