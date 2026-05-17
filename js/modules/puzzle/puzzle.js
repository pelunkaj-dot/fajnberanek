import { unlockCard } from "../../storage.js";

async function loadPuzzle(storyId) {
  const response = await fetch(`data/puzzle/${storyId}.json`);

  if (!response.ok) {
    throw new Error(`Puzzle pro "${storyId}" zatím není připravené.`);
  }

  return response.json();
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function renderPuzzle({ screen, story, onBack }) {
  try {
    const puzzle = await loadPuzzle(story.id);
    const placed = Array(puzzle.tiles.length).fill(null);
    const bank = shuffle(puzzle.tiles);

    renderPuzzleBoard({
      screen,
      story,
      puzzle,
      placed,
      bank,
      message: "Klepni na dílek dole a pak na správné místo v obrázku.",
      selectedTileId: null,
      onBack
    });
  } catch (error) {
    console.error(error);
    renderPuzzleMissing({ screen, story, onBack, message: error.message });
  }
}

function renderPuzzleBoard({ screen, story, puzzle, placed, bank, message, selectedTileId, onBack }) {
  const doneCount = placed.filter(Boolean).length;
  const isComplete = doneCount === puzzle.tiles.length;

  if (isComplete) {
    if (puzzle.rewardCardId) {
      unlockCard(puzzle.rewardCardId);
    }

    renderPuzzleDone({ screen, story, puzzle, onBack });
    return;
  }

  screen.innerHTML = `
    <section class="puzzle-screen">
      <div class="puzzle-card">
        <div class="puzzle-top">
          <button class="soft-button puzzle-back" id="backToStory">← Zpět</button>
          <div class="puzzle-progress">${doneCount} / ${puzzle.tiles.length}</div>
        </div>

        <div class="puzzle-progressbar" aria-hidden="true">
          <div style="width: ${Math.round((doneCount / puzzle.tiles.length) * 100)}%"></div>
        </div>

        <p class="puzzle-kicker">${story.title}</p>
        <h1>${puzzle.title}</h1>
        <p class="puzzle-instruction">${message}</p>

        <div class="puzzle-board" aria-label="Puzzle obrázek">
          ${puzzle.tiles.map((tile, index) => renderSlot(tile, placed[index], index)).join("")}
        </div>

        <div class="puzzle-bank" aria-label="Dílky puzzle">
          ${bank.map((tile) => renderBankTile(tile, selectedTileId)).join("")}
        </div>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);

  document.querySelectorAll("[data-bank-tile]").forEach((button) => {
    button.addEventListener("click", () => {
      renderPuzzleBoard({
        screen,
        story,
        puzzle,
        placed,
        bank,
        message: "Teď klepni na místo, kam dílek patří.",
        selectedTileId: button.dataset.bankTile,
        onBack
      });
    });
  });

  document.querySelectorAll("[data-slot-index]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!selectedTileId) {
        renderPuzzleBoard({
          screen,
          story,
          puzzle,
          placed,
          bank,
          message: "Nejdřív si vyber dílek dole.",
          selectedTileId,
          onBack
        });
        return;
      }

      const slotIndex = Number(button.dataset.slotIndex);
      const targetTile = puzzle.tiles[slotIndex];
      const selectedTile = bank.find((tile) => tile.id === selectedTileId);

      if (!selectedTile || placed[slotIndex]) return;

      if (selectedTile.id !== targetTile.id) {
        renderPuzzleBoard({
          screen,
          story,
          puzzle,
          placed,
          bank,
          message: "Skoro. Zkus pro ten dílek jiné místo.",
          selectedTileId,
          onBack
        });
        return;
      }

      const nextPlaced = [...placed];
      nextPlaced[slotIndex] = selectedTile;
      const nextBank = bank.filter((tile) => tile.id !== selectedTile.id);

      renderPuzzleBoard({
        screen,
        story,
        puzzle,
        placed: nextPlaced,
        bank: nextBank,
        message: "Výborně, dílek je na místě.",
        selectedTileId: null,
        onBack
      });
    });
  });
}

function renderSlot(tile, placedTile, index) {
  return `
    <button class="puzzle-slot ${placedTile ? "is-filled" : ""}" data-slot-index="${index}" aria-label="místo ${index + 1}">
      <span aria-hidden="true">${placedTile ? placedTile.emoji : ""}</span>
      <small>${placedTile ? placedTile.label : ""}</small>
    </button>
  `;
}

function renderBankTile(tile, selectedTileId) {
  return `
    <button class="puzzle-bank-tile ${selectedTileId === tile.id ? "is-selected" : ""}" data-bank-tile="${tile.id}" aria-label="${tile.label}">
      <span aria-hidden="true">${tile.emoji}</span>
    </button>
  `;
}

function renderPuzzleDone({ screen, story, puzzle, onBack }) {
  screen.innerHTML = `
    <section class="puzzle-screen">
      <div class="puzzle-card puzzle-done">
        <div class="puzzle-reward" aria-hidden="true">${puzzle.rewardEmoji || "🧩"}</div>
        <p class="puzzle-kicker">Puzzle dokončeno</p>
        <h1>Poskládáno</h1>
        <p class="puzzle-instruction">Obrázek <strong>${puzzle.title}</strong> je hotový.</p>

        <div class="puzzle-prize">
          <div class="puzzle-prize-icon" aria-hidden="true">${puzzle.rewardEmoji || "🌟"}</div>
          <div>
            <h2>${puzzle.rewardTitle || "Nová kartička"}</h2>
            <p>Získáváš další kartičku do sbírky.</p>
          </div>
        </div>

        <button class="primary-button" id="backToStory">Zpět k příběhu</button>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);
}

function renderPuzzleMissing({ screen, story, onBack, message }) {
  screen.innerHTML = `
    <section class="puzzle-screen">
      <div class="puzzle-card puzzle-done">
        <div class="puzzle-reward" aria-hidden="true">🧩</div>
        <h1>Puzzle</h1>
        <p class="puzzle-instruction">${message}</p>
        <p class="puzzle-note">Příběh <strong>${story.title}</strong> doplníme později.</p>
        <button class="primary-button" id="backToStory">Zpět k příběhu</button>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);
}
