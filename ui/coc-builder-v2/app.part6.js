  </section>`;
}

function bindBackstoryEvents() {
  content.querySelectorAll("[data-story]").forEach((node) => {
    node.addEventListener("input", () => {
      state.backstory[node.dataset.story] = node.value;
      saveState();
    });
  });

  content.querySelectorAll("[data-simple]").forEach((node) => {
    node.addEventListener("input", () => {
      state.backstory[node.dataset.simple][Number(node.dataset.index)] = node.value;
      saveState();
    });
  });

  content.querySelectorAll("[data-object]").forEach((node) => {
    node.addEventListener("input", () => {
      state.backstory[node.dataset.object][Number(node.dataset.index)][node.dataset.field] = node.value;
      saveState();
    });
  });

  content.querySelectorAll("[data-add-simple]").forEach((button) => {
    button.addEventListener("click", () => {
      state.backstory[button.dataset.addSimple].push("");
      saveState();
      renderBackstory();
    });
  });

  content.querySelectorAll("[data-remove-simple]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.removeSimple;
      state.backstory[key].splice(Number(button.dataset.index), 1);
      if (!state.backstory[key].length) state.backstory[key].push("");
      saveState();
      renderBackstory();
    });
  });

  content.querySelectorAll("[data-add-object]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.addObject;
      if (key === "significantPeople") state.backstory[key].push({ name: "", relationship: "", importance: "", notes: "" });
      if (key === "meaningfulLocations" || key === "treasuredPossessions") state.backstory[key].push({ name: "", importance: "" });
      if (key === "scars") state.backstory[key].push({ description: "", cause: "" });
      saveState();
      renderBackstory();
    });
  });

  content.querySelectorAll("[data-remove-object]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.removeObject;
      state.backstory[key].splice(Number(button.dataset.index), 1);
      if (!state.backstory[key].length) {
        if (key === "significantPeople") state.backstory[key].push({ name: "", relationship: "", importance: "", notes: "" });
        if (key === "meaningfulLocations" || key === "treasuredPossessions") state.backstory[key].push({ name: "", importance: "" });
        if (key === "scars") state.backstory[key].push({ description: "", cause: "" });
      }
      saveState();
      renderBackstory();
    });
  });
}

function normalizedBackstory() {
  const nonEmpty = (value) => String(value || "").trim();
  return {
    story: state.backstory.story,
    personal_description: state.backstory.personalDescription,
    ideology_beliefs: state.backstory.beliefs.map(nonEmpty).filter(Boolean),
    significant_people: state.backstory.significantPeople
      .filter((p) => Object.values(p).some(nonEmpty))
      .map((p) => ({ ...p })),
    meaningful_locations: state.backstory.meaningfulLocations
      .filter((p) => Object.values(p).some(nonEmpty))
      .map((p) => ({ ...p })),
    treasured_possessions: state.backstory.treasuredPossessions
      .filter((p) => Object.values(p).some(nonEmpty))
      .map((p) => ({ ...p })),
    traits: state.backstory.traits.map(nonEmpty).filter(Boolean),
    injuries_scars: state.backstory.scars
      .filter((p) => Object.values(p).some(nonEmpty))
      .map((p) => ({ ...p })),
    phobias: state.backstory.phobias.map(nonEmpty).filter(Boolean),
    manias: state.backstory.manias.map(nonEmpty).filter(Boolean)
  };
}

function renderReview() {
  if (!state.result) {
    try {
      state.result = buildResult();
      saveState();
    } catch (error) {
      content.innerHTML = `<h2>完成確認</h2><p class="lead">角色卡尚未能產生。</p>`;
      showError(error);
      return;
    }
  }
  const sheet = state.result.sheet;
  const skills = sheet.skills.slice().sort((a,b) => b.final - a.final);
  content.innerHTML = `
    <h2>完成確認</h2>
    <p class="lead">這一頁會真正顯示角色卡重點，而不是只顯示姓名。確認後可以下載 JSON 角色卡。</p>
    <div class="review-grid">
      <div class="review-card">
        <h3>${esc(state.result.name)}</h3>
        <p>${esc(occupationLabel(state.occupationId))}</p>
        <p>年齡 ${esc(state.profile.age)}${state.profile.residence ? ` · ${esc(state.profile.residence)}` : ""}</p>
      </div>
      <div class="review-card">
        <h3>衍生數值</h3>
        <p>HP ${esc(sheet.derived.hp)} · MP ${esc(sheet.derived.mp)} · SAN ${esc(sheet.derived.san)}</p>
        <p>Move ${esc(sheet.derived.move)} · Build ${esc(sheet.derived.build)} · DB ${esc(sheet.derived.damage_bonus)}</p>
      </div>
      <div class="review-card full">
        <h3>能力值</h3>
        <div class="stat-row">${ALL_CHARACTERISTICS.map((name) => `<div class="stat"><small>${CHARACTERISTIC_LABELS[name]}</small><strong>${sheet.characteristics[name].regular}</strong></div>`).join("")}</div>
      </div>
      <div class="review-card full">
        <h3>技能</h3>
        ${skills.map((skill) => `<span class="pill">${esc(skill.name)} ${skill.final}</span>`).join("")}
      </div>
      <div class="review-card full">
        <h3>背景摘要</h3>
        <p>${esc(sheet.story || "尚未填寫完整故事")}</p>
      </div>
    </div>
    <p style="margin-top:20px"><button id="download" class="primary" type="button">下載角色卡 JSON</button></p>
  `;
  document.querySelector("#download").addEventListener("click", downloadResult);
}

function validateStep() {
  if (state.step === 0) {
    if (!state.profile.name.trim()) throw new Error("請填寫調查員姓名。");
    if (!Number.isInteger(Number(state.profile.age)) || Number(state.profile.age) < 15) throw new Error("調查員年齡至少為 15。");
  }
  if (state.step === 1 && !state.occupationId) throw new Error("請先選擇一個職業。");
  if (state.step === 2) {
    if (ALL_CHARACTERISTICS.some((name) => !Number.isInteger(Number(state.characteristics[name])) || Number(state.characteristics[name]) <= 0)) {
      throw new Error("請完成全部九項能力值擲骰。");
    }
  }
  if (state.step === 3) {
    const issues = skillIssues();
    if (issues.length) throw new Error(issues.join("；"));
    state.result = buildResult();
  }
}

function buildResult() {
  const occupationIds = state.occupationSelections.map(fullSkillId);
  const personalSpends = Object.fromEntries(
    state.personalRows
      .map((row) => [fullSkillId(row), Number(row.spend || 0)])
      .filter(([id, spend]) => id && spend > 0)
  );

  const session = new Coc7eCreationSession(crypto.randomUUID())
    .setProfile({ ...state.profile, age: Number(state.profile.age) })
    .chooseOccupation(state.occupationId);

  const characteristics = Object.fromEntries(
    ALL_CHARACTERISTICS.map((name) => [name, Number(state.characteristics[name])])
  );
  const rollRecord = Object.fromEntries(
    Object.entries(state.rollDetails).map(([name, detail]) => [name, detail.dice])
  );

  if (state.rollMode === "manual") session.useManualRoll(characteristics, rollRecord);
  else session.useAutomaticRoll(characteristics, rollRecord);

  return session
    .allocateSkillsByPoints(occupationIds, { ...state.occupationSpends }, personalSpends)
    .setBackstory(normalizedBackstory())
    .finalize();
}

function downloadResult() {
  if (!state.result) return;
  const blob = new Blob([JSON.stringify(state.result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.result.name || "調查員"}-coc7e-v2.json`;
  a.click();
  URL.revokeObjectURL(url);
}

nextButton.addEventListener("click", () => {
  try {
    clearError();
    if (state.step === STEPS.length - 1) {
      downloadResult();
      return;
    }
    validateStep();
    state.step += 1;
    saveState();
    render();
    window.scrollTo({ top: 0 });
  } catch (error) {
    showError(error);
  }
});

backButton.addEventListener("click", () => {
  if (state.step <= 0) return;
  state.step -= 1;
  saveState();
  render();
  window.scrollTo({ top: 0 });
});

document.querySelector("#reset").addEventListener("click", () => {
  if (!confirm("確定要清除 V2 的全部創角草稿嗎？舊版草稿不會受到影響。")) return;
  state = freshState();
