// ---- Shared Game Log round-wizard logic ----
// Used by both edit-model.html (the full model editor) and log-game.html
// (the focused standalone/NFC entry point). Pages including this file must
// define `currentRounds` (array) and `nextRoundLocalId` (number) themselves
// before this loads, and must have a #glGameSystem input and a
// #glRoundsContainer element in the DOM. What differs page-to-page — what
// happens when the form is actually saved — stays in each page's own
// script, since that's genuinely different (staged-until-model-save vs.
// immediate direct insert).

// Suggested tallies vary by game system — not a rigid schema, just smarter
// defaults. Anything typed that isn't listed here still works fine via
// the "Add a different tally type" field elsewhere; this only changes
// which rows show up pre-populated at 0.
const GAME_SYSTEM_TALLY_SUGGESTIONS = {
  "Warhammer 40,000": ["Character Kill", "Vehicle Kill", "Monster Kill", "Titanic Kill", "Warlord Kill"],
  "Kill Team": ["Operative Kill"],
  "Age of Sigmar": ["Hero Kill", "Monster Kill", "War Machine Kill"],
  "Warhammer: The Old World": ["Hero Kill", "Monster Kill", "War Machine Kill"],
  "Necromunda": ["Ganger Down", "Leader Down"],
  "Frostgrave": ["Wizard KO", "Apprentice KO", "Treasure Retrieved", "Scenario Victory"],
  "Mordheim": ["Warband Member Down", "Leader Down", "Treasure Retrieved"],
  "Warmachine": ["Warcaster Kill", "Warjack Destroyed", "Solo Kill", "Scenario Point"],
  "Blood Bowl": ["Touchdown", "Casualty", "Completion", "Interception"],
  "D&D": ["Boss Kill", "Level Up", "Quest Completed", "Character Death", "Magic Item Found"],
};
const DEFAULT_TALLY_SUGGESTIONS = ["Kill"];

function getTallySuggestions(){
  const system = document.getElementById("glGameSystem").value.trim();
  return GAME_SYSTEM_TALLY_SUGGESTIONS[system] || DEFAULT_TALLY_SUGGESTIONS;
}

function materializeTrailingRound(){
  const round = { _localId: nextRoundLocalId++, result: "", tallies: [] };
  currentRounds.push(round);
  return round;
}

function renderRounds(){
  const container = document.getElementById("glRoundsContainer");
  const suggestions = getTallySuggestions();
  const roundsToShow = [...currentRounds, { _localId: null, result: "", tallies: [] }]; // trailing empty round

  container.innerHTML = roundsToShow.map((round, idx) => {
    const roundId = round._localId ?? "pending";
    const chipsHtml = suggestions.map(s => `<button type="button" class="gl-round-chip" data-type="${s}" data-round-id="${roundId}">${s}</button>`).join("");
    const talliesHtml = round.tallies.map(tly => `
      <div class="gl-round-tally-row">
        <span style="flex:1;">${tly.tallyType}</span>
        <button type="button" class="gl-round-tally-dec" data-tally-type="${tly.tallyType.replace(/"/g, "&quot;")}" data-round-id="${roundId}">−</button>
        <span>${tly.count}</span>
        <button type="button" class="gl-round-tally-inc" data-tally-type="${tly.tallyType.replace(/"/g, "&quot;")}" data-round-id="${roundId}">+</button>
      </div>
    `).join("");
    return `
      <div class="gl-round">
        <div class="gl-round-label">Round ${idx + 1}</div>
        <div class="gl-round-fields">
          <select class="gl-round-result" data-round-id="${roundId}">
            <option value="">—</option>
            <option value="Win" ${round.result === "Win" ? "selected" : ""}>Win</option>
            <option value="Loss" ${round.result === "Loss" ? "selected" : ""}>Loss</option>
            <option value="Draw" ${round.result === "Draw" ? "selected" : ""}>Draw</option>
          </select>
        </div>
        <div class="gl-round-chips">${chipsHtml}</div>
        ${talliesHtml}
      </div>
    `;
  }).join("");

  function resolveRound(el){
    if (el.dataset.roundId === "pending") return materializeTrailingRound();
    return currentRounds.find(r => r._localId == el.dataset.roundId);
  }

  container.querySelectorAll(".gl-round-result").forEach(select => {
    select.addEventListener("change", () => {
      const round = resolveRound(select);
      round.result = select.value;
      renderRounds();
    });
  });
  container.querySelectorAll(".gl-round-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const round = resolveRound(chip);
      const existing = round.tallies.find(t => t.tallyType === chip.dataset.type);
      if (existing) existing.count += 1;
      else round.tallies.push({ tallyType: chip.dataset.type, count: 1 });
      renderRounds();
    });
  });
  container.querySelectorAll(".gl-round-tally-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      const round = currentRounds.find(r => r._localId == btn.dataset.roundId);
      const tly = round?.tallies.find(t => t.tallyType === btn.dataset.tallyType);
      if (tly) tly.count += 1;
      renderRounds();
    });
  });
  container.querySelectorAll(".gl-round-tally-dec").forEach(btn => {
    btn.addEventListener("click", () => {
      const round = currentRounds.find(r => r._localId == btn.dataset.roundId);
      const tly = round?.tallies.find(t => t.tallyType === btn.dataset.tallyType);
      if (tly && tly.count > 0){
        tly.count -= 1;
        if (tly.count === 0) round.tallies = round.tallies.filter(t => t !== tly);
      }
      renderRounds();
    });
  });
}