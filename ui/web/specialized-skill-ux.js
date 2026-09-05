const DRAFT_KEY = "trpg-coc7e-draft";
const CUSTOM = "__custom__";

const DIRECT_BRANCHES = Object.freeze({
  science: Object.freeze([
    ["Astronomy", "科學（天文學）"],
    ["Biology", "科學（生物學）"],
    ["Botany", "科學（植物學）"],
    ["Chemistry", "科學（化學）"],
    ["Cryptography", "科學（密碼學）"],
    ["Geology", "科學（地質學）"],
    ["Pharmacy", "科學（藥學）"],
    ["Physics", "科學（物理學）"],
    ["Zoology", "科學（動物學）"]
  ]),
  pilot: Object.freeze([
    ["Boat", "駕駛（船舶）"],
    ["Aircraft", "駕駛（飛機）"],
    ["Dirigible", "駕駛（飛船）"]
  ]),
  survival: Object.freeze([
    ["Wilderness", "生存（荒野）"],
    ["Arctic", "生存（極地）"],
    ["Desert", "生存（沙漠）"],
    ["Sea", "生存（海洋）"]
  ])
});

const COMMON_LANGUAGES = Object.freeze([
  ["Spanish", "外語（西班牙語）"],
  ["English", "外語（英語）"],
  ["Chinese", "外語（中文）"]
]);

function readDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); }
  catch { return {}; }
}

function splitSkillValue(value = "") {
  const index = value.indexOf(":");
  if (index < 0) return { base: value, specialization: "" };
  return { base: value.slice(0, index), specialization: value.slice(index + 1) };
}

function fullSkillValue(base, specialization) {
  return specialization ? `${base}:${specialization}` : base;
}

function appendOption(select, value, label, selectedValue, disabled = false) {
  if ([...select.options].some((option) => option.value === value)) return;
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  option.selected = value === selectedValue;
  option.disabled = disabled;
  select.append(option);
}

function occupationUiValue(choice) {
  if (!choice?.id) return "";
  if (DIRECT_BRANCHES[choice.id] && choice.specialization) return fullSkillValue(choice.id, choice.specialization);
  if (choice.id === "language_other") {
    if (COMMON_LANGUAGES.some(([value]) => value === choice.specialization)) return fullSkillValue(choice.id, choice.specialization);
    if (choice.specialization) return fullSkillValue(choice.id, CUSTOM);
  }
  return choice.id;
}

function personalUiValue(value = "") {
  const { base, specialization } = splitSkillValue(value);
  if (DIRECT_BRANCHES[base] && specialization) return value;
  if (base === "language_other" && specialization) {
    return COMMON_LANGUAGES.some(([known]) => known === specialization)
      ? value
      : fullSkillValue(base, CUSTOM);
  }
  if (base === "art_craft" && specialization) return fullSkillValue(base, CUSTOM);
  return value;
}

function replaceSpecializedBaseOption(replacement, originalOption, selectedValue) {
  const base = originalOption.value;
  if (DIRECT_BRANCHES[base]) {
    for (const [value, label] of DIRECT_BRANCHES[base]) {
      appendOption(replacement, fullSkillValue(base, value), label, selectedValue);
    }
    return true;
  }
  if (base === "language_other") {
    for (const [value, label] of COMMON_LANGUAGES) {
      appendOption(replacement, fullSkillValue(base, value), label, selectedValue);
    }
    appendOption(replacement, fullSkillValue(base, CUSTOM), "其他外語…", selectedValue);
    return true;
  }
  return false;
}

function buildOccupationReplacement(original, selectedValue) {
  const replacement = document.createElement("select");
  replacement.className = original.className;
  replacement.setAttribute("aria-label", original.getAttribute("aria-label") || "選擇技能");
  for (const option of original.options) {
    if (!option.value) {
      appendOption(replacement, "", option.textContent, selectedValue);
      continue;
    }
    if (replaceSpecializedBaseOption(replacement, option, selectedValue)) continue;
    appendOption(replacement, option.value, option.textContent, selectedValue, option.disabled);
  }
  replacement.value = selectedValue;
  return replacement;
}

function applyOccupationSelection(index, value) {
  const { base, specialization } = splitSkillValue(value);
  let original = document.querySelector(`[data-occ-skill="${index}"]`);
  if (!original || !base) return;

  if (original.value !== base) {
    original.value = base;
    original.dispatchEvent(new Event("change", { bubbles: true }));
    original = document.querySelector(`[data-occ-skill="${index}"]`);
  }

  if (specialization && specialization !== CUSTOM) {
    const detail = document.querySelector(`[data-specialization="${index}"]`);
    if (detail) {
      detail.value = specialization;
      detail.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

function addCustomInput(container, value, placeholder, onCommit) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = value || "";
  input.placeholder = placeholder;
  input.setAttribute("aria-label", placeholder);
  input.dataset.uxCustomInput = "true";
  input.addEventListener("change", () => {
    const next = input.value.trim();
    if (next) onCommit(next);
  });
  container.append(input);
}

function enhanceOccupationSelect(original) {
  if (original.dataset.uxEnhanced === "true") return;
  const hasExpandable = [...original.options].some((option) => DIRECT_BRANCHES[option.value] || option.value === "language_other");
  if (!hasExpandable) return;

  original.dataset.uxEnhanced = "true";
  const index = Number(original.dataset.occSkill);
  const draft = readDraft();
  const choice = draft.occupationSelections?.[index] ?? null;
  const selectedValue = occupationUiValue(choice);
  const replacement = buildOccupationReplacement(original, selectedValue);
  replacement.dataset.uxOccupationSelect = String(index);
  original.hidden = true;
  original.parentElement.insertBefore(replacement, original);

  const { base, specialization } = choice ?? {};
  const detailInput = document.querySelector(`[data-specialization="${index}"]`);
  const detailCell = detailInput?.closest("td");
  const directOrLanguage = Boolean(DIRECT_BRANCHES[base] || base === "language_other");
  if (directOrLanguage && detailInput) {
    detailInput.style.display = "none";
    if (detailCell && !detailCell.querySelector("[data-ux-placeholder]")) {
      const dash = document.createElement("span");
      dash.textContent = "—";
      dash.dataset.uxPlaceholder = "true";
      detailCell.append(dash);
    }
  }

  const skillCell = replacement.closest("td");
  if (base === "language_other" && specialization && !COMMON_LANGUAGES.some(([value]) => value === specialization)) {
    addCustomInput(skillCell, specialization, "輸入其他語言，例如：拉丁語", (custom) => {
      applyOccupationSelection(index, fullSkillValue("language_other", custom));
    });
  }

  replacement.addEventListener("change", () => {
    if (!replacement.value) return;
    const next = splitSkillValue(replacement.value);
    if (next.base === "language_other" && next.specialization === CUSTOM) {
      replacement.parentElement.querySelector("[data-ux-custom-input]")?.remove();
      addCustomInput(replacement.parentElement, "", "輸入其他語言，例如：拉丁語", (custom) => {
        applyOccupationSelection(index, fullSkillValue("language_other", custom));
      });
      return;
    }
    applyOccupationSelection(index, replacement.value);
  });
}

function isOccupationBaseBlocked(base, draft) {
  return (draft.occupationSelections ?? []).some((choice) => choice?.id === base);
}

function buildPersonalReplacement(original, currentValue, draft, index) {
  const replacement = document.createElement("select");
  replacement.className = original.className;
  replacement.setAttribute("aria-label", original.getAttribute("aria-label") || `興趣技能 ${index + 1}`);

  for (const option of original.options) {
    appendOption(replacement, option.value, option.textContent, personalUiValue(currentValue), option.disabled);
  }

  const selectedValue = personalUiValue(currentValue);
  const otherSelections = new Set((draft.personalSelections ?? [])
    .filter((_, otherIndex) => otherIndex !== index)
    .filter(Boolean));

  for (const [base, branches] of Object.entries(DIRECT_BRANCHES)) {
    if (isOccupationBaseBlocked(base, draft)) continue;
    for (const [specialization, label] of branches) {
      const full = fullSkillValue(base, specialization);
      if (!otherSelections.has(full) || currentValue === full) appendOption(replacement, full, label, selectedValue);
    }
  }

  if (!isOccupationBaseBlocked("language_other", draft)) {
    for (const [specialization, label] of COMMON_LANGUAGES) {
      const full = fullSkillValue("language_other", specialization);
      if (!otherSelections.has(full) || currentValue === full) appendOption(replacement, full, label, selectedValue);
    }
    appendOption(replacement, fullSkillValue("language_other", CUSTOM), "其他外語…", selectedValue);
  }

  if (!isOccupationBaseBlocked("art_craft", draft)) {
    appendOption(replacement, fullSkillValue("art_craft", CUSTOM), "藝術／工藝（自訂）…", selectedValue);
  }

  replacement.value = selectedValue;
  return replacement;
}

function applyPersonalSelection(index, value) {
  const original = document.querySelector(`[data-personal="${index}"]`);
  if (!original || !value) return;
  if (![...original.options].some((option) => option.value === value)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    original.append(option);
  }
  original.value = value;
  original.dispatchEvent(new Event("change", { bubbles: true }));
}

function enhancePersonalSelect(original) {
  if (original.dataset.uxEnhanced === "true") return;
  original.dataset.uxEnhanced = "true";
  const index = Number(original.dataset.personal);
  const draft = readDraft();
  const currentValue = draft.personalSelections?.[index] ?? "";
  const replacement = buildPersonalReplacement(original, currentValue, draft, index);
  replacement.dataset.uxPersonalSelect = String(index);
  original.hidden = true;
  original.parentElement.insertBefore(replacement, original);

  const { base, specialization } = splitSkillValue(currentValue);
  if (base === "language_other" && specialization && !COMMON_LANGUAGES.some(([value]) => value === specialization)) {
    addCustomInput(replacement.parentElement, specialization === CUSTOM ? "" : specialization, "輸入其他語言，例如：拉丁語", (custom) => {
      applyPersonalSelection(index, fullSkillValue("language_other", custom));
    });
  }
  if (base === "art_craft" && specialization) {
    addCustomInput(replacement.parentElement, specialization === CUSTOM ? "" : specialization, "輸入藝術／工藝，例如：攝影", (custom) => {
      applyPersonalSelection(index, fullSkillValue("art_craft", custom));
    });
  }

  replacement.addEventListener("change", () => {
    const next = splitSkillValue(replacement.value);
    replacement.parentElement.querySelector("[data-ux-custom-input]")?.remove();
    if (next.specialization === CUSTOM && next.base === "language_other") {
      addCustomInput(replacement.parentElement, "", "輸入其他語言，例如：拉丁語", (custom) => {
        applyPersonalSelection(index, fullSkillValue("language_other", custom));
      });
      return;
    }
    if (next.specialization === CUSTOM && next.base === "art_craft") {
      addCustomInput(replacement.parentElement, "", "輸入藝術／工藝，例如：攝影", (custom) => {
        applyPersonalSelection(index, fullSkillValue("art_craft", custom));
      });
      return;
    }
    if (replacement.value) applyPersonalSelection(index, replacement.value);
  });
}

function enhanceSkillPage() {
  const header = [...document.querySelectorAll(".skill-table th")].find((item) => item.textContent.trim() === "專精");
  if (header) header.textContent = "細項";
  document.querySelectorAll("[data-occ-skill]").forEach(enhanceOccupationSelect);
  document.querySelectorAll("[data-personal]").forEach(enhancePersonalSelect);
}

const stepContent = document.querySelector("#step-content");
if (stepContent) {
  let scheduled = false;
  const scheduleEnhance = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      enhanceSkillPage();
    });
  };
  new MutationObserver(scheduleEnhance).observe(stepContent, { childList: true, subtree: true });
  scheduleEnhance();
}
