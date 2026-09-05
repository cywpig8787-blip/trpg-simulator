/** Ruleset-neutral character envelope. Ruleset data stays inside `sheet`. */
export function createCharacter({ id, name, rulesetId, rulesetVersion, sheet }) {
  if (!id?.trim()) throw new Error("Character id is required");
  if (!name?.trim()) throw new Error("Character name is required");
  if (!rulesetId || !rulesetVersion) throw new Error("Ruleset identity is required");
  return {
    id, name, ruleset_id: rulesetId, ruleset_version: rulesetVersion, sheet,
    conditions: [], metadata: { created_at: new Date().toISOString() }
  };
}
