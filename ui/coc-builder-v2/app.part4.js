  content.querySelectorAll("[data-occ-base]").forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.occBase);
      clearOccupationSpend(index);
      state.occupationSelections[index] = { id: select.value, specialization: "" };
      saveState();
      renderSkills();
      renderSummary();
    });
  });

  content.querySelectorAll("[data-occ-full]").forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.occFull);
      clearOccupationSpend(index);
      const raw = select.value;
      if (!raw) state.occupationSelections[index] = { id: "", specialization: "" };
      else {
        const [id, ...rest] = raw.split(":");
        const specialization = rest.join(":");
        state.occupationSelections[index] = {
          id,
          specialization: specialization === "__custom__" ? "" : specialization
        };
      }
      saveState();
      renderSkills();
      renderSummary();
    });
  });

  content.querySelectorAll("[data-occ-specialization]").forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.occSpecialization);
      clearOccupationSpend(index);
      state.occupationSelections[index].specialization = select.value;
      saveState();
      renderSkills();
      renderSummary();
    });
  });

  content.querySelectorAll("[data-occ-custom]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.occCustom);
      const previousFull = fullSkillId(state.occupationSelections[index]);
      if (previousFull && state.occupationSpends[previousFull]) delete state.occupationSpends[previousFull];
      state.occupationSelections[index].specialization = input.value;
      saveState();
      updateSkillLiveValues();
      renderSummary();
    });
    input.addEventListener("change", () => renderSkills());
  });

  content.querySelectorAll("[data-occ-language]").forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.occLanguage);
      clearOccupationSpend(index);
      state.occupationSelections[index].specialization = select.value === "__custom__" ? "" : select.value;
      saveState();
      renderSkills();
      renderSummary();
    });
  });

  content.querySelectorAll("[data-occ-language-custom]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.occLanguageCustom);
      clearOccupationSpend(index);
      state.occupationSelections[index].specialization = input.value;
      saveState();
      updateSkillLiveValues();
      renderSummary();
    });
    input.addEventListener("change", () => renderSkills());
  });

  content.querySelectorAll("[data-occ-spend]").forEach((input) => {
    input.addEventListener("input", () => handleOccupationSpend(input));
  });
}

function clearOccupationSpend(index) {
  const old = state.occupationSelections[index];
  const full = fullSkillId(old);
  if (full) delete state.occupationSpends[full];
}

function handleOccupationSpend(input) {
  const index = Number(input.dataset.occSpend);
  const choice = state.occupationSelections[index];
  const full = fullSkillId(choice);
  if (!full) return;
  const base = skillBase(full);
  const current = Number(state.occupationSpends[full] || 0);
  const remainingBefore = occupationPool() - occupationUsed() + current;
  const capBySkill = Math.max(0, 90 - base);
  const maxAllowed = Math.max(0, Math.min(capBySkill, remainingBefore));
  const next = Math.max(0, Math.min(Number(input.value || 0), maxAllowed));
  if (Number(input.value || 0) !== next) input.value = String(next);
  state.occupationSpends[full] = next;
  saveState();
  updateSkillLiveValues();
}

function bindCreditEvent() {
  const input = document.querySelector("#credit");
  input.addEventListener("input", () => {
    const occ = selectedOccupation();
    const current = Number(state.occupationSpends.credit_rating || 0);
    const remainingBefore = occupationPool() - occupationUsed() + current;
    const maxAllowed = Math.max(0, Math.min(occ.credit_range[1], remainingBefore));
    const next = Math.max(0, Math.min(Number(input.value || 0), maxAllowed));
    if (Number(input.value || 0) !== next) input.value = String(next);
    state.occupationSpends.credit_rating = next;
    saveState();
    updateSkillLiveValues();
  });
}

function personalRowHtml(row, index) {
  const full = fullSkillId(row);
  const base = full ? skillBase(full) : 0;
  const finalValue = full ? base + Number(row.spend || 0) : "—";
  return `<div class="personal-row">
    <select data-personal-full="${index}">${expandedSkillOptions(full, index, "personal")}</select>
    <div>${customDetailForExpandedChoice(index, row, "personal")}</div>
    <input data-personal-spend="${index}" type="number" inputmode="numeric" min="0" max="${Math.max(0, 90 - base)}" value="${Number(row.spend || 0)}" ${!full ? "disabled" : ""}>
    <strong class="skill-final" id="personal-final-${index}">${finalValue}</strong>
    <button class="remove" data-personal-remove="${index}" type="button">移除</button>
  </div>`;
}

function bindPersonalEvents() {
  document.querySelector("#add-personal").addEventListener("click", () => {
    if (state.personalRows.length >= 12) return;
    state.personalRows.push({ id: "", specialization: "", spend: 0 });
    saveState();
    renderSkills();
  });

  content.querySelectorAll("[data-personal-full]").forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.personalFull);
      const raw = select.value;
      if (!raw) state.personalRows[index] = { id: "", specialization: "", spend: 0 };
      else {
        const [id, ...rest] = raw.split(":");
        const specialization = rest.join(":");
        state.personalRows[index] = {
          id,
          specialization: specialization === "__custom__" ? "" : specialization,
          spend: 0
        };
      }
      saveState();
      renderSkills();
    });
  });

  content.querySelectorAll("[data-personal-custom]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.personalCustom);
      state.personalRows[index].specialization = input.value;
      state.personalRows[index].spend = 0;
      saveState();
      updateSkillLiveValues();
    });
    input.addEventListener("change", () => renderSkills());
  });

  content.querySelectorAll("[data-personal-language]").forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.personalLanguage);
      state.personalRows[index].specialization = select.value === "__custom__" ? "" : select.value;
      state.personalRows[index].spend = 0;
      saveState();
      renderSkills();
    });
  });

  content.querySelectorAll("[data-personal-language-custom]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.personalLanguageCustom);
      state.personalRows[index].specialization = input.value;
      state.personalRows[index].spend = 0;
      saveState();
      updateSkillLiveValues();
    });
    input.addEventListener("change", () => renderSkills());
  });

  content.querySelectorAll("[data-personal-spend]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.personalSpend);
      const row = state.personalRows[index];
      const full = fullSkillId(row);
      if (!full) return;
      const base = skillBase(full);
      const current = Number(row.spend || 0);
      const remainingBefore = personalPool() - personalUsed() + current;
      const maxAllowed = Math.max(0, Math.min(90 - base, remainingBefore));
      const next = Math.max(0, Math.min(Number(input.value || 0), maxAllowed));
      if (Number(input.value || 0) !== next) input.value = String(next);
      row.spend = next;
      saveState();
      updateSkillLiveValues();
    });
  });

  content.querySelectorAll("[data-personal-remove]").forEach((button) => {
