import { hasUnlockedCard } from "../../storage.js";

async function loadCards(storyId) {
  const response = await fetch(`data/cards/${storyId}.json`);

  if (!response.ok) {
    throw new Error(`Kartičky pro "${storyId}" zatím nejsou připravené.`);
  }

  return response.json();
}

export async function renderCards({ screen, story, onBack }) {
  try {
    const cardSet = await loadCards(story.id);

    screen.innerHTML = `
      <section class="cards-screen">
        <div class="cards-header">
          <button class="soft-button cards-back" id="backToStory">
            ← Zpět
          </button>

          <div class="cards-title-block">
            <div class="cards-mark" aria-hidden="true">🌟</div>
            <p class="cards-kicker">${story.title}</p>
            <h1>${cardSet.title}</h1>
            <p>
              Sbírej kartičky při objevování příběhu.
            </p>
          </div>
        </div>

        <div class="cards-grid">
          ${cardSet.cards.map(renderCard).join("")}
        </div>
      </section>
    `;

    document.querySelector("#backToStory").addEventListener("click", onBack);
  } catch (error) {
    console.error(error);
    renderCardsMissing({ screen, story, onBack, message: error.message });
  }
}

function renderCard(card) {
  const unlocked = hasUnlockedCard(card.id);

  return `
    <article class="collection-card ${unlocked ? "is-unlocked" : "is-locked"}">
      <div class="collection-card-emoji" aria-hidden="true">
        ${unlocked ? card.emoji : "?"}
      </div>

      <div class="collection-card-content">
        <p class="collection-card-state">
          ${unlocked ? "Odemčeno" : "Zatím neobjeveno"}
        </p>

        <h2>
          ${unlocked ? card.title : "Tajemná kartička"}
        </h2>

        <p>
          ${unlocked ? card.description : "Tuhle kartičku získáš při objevování příběhu."}
        </p>
      </div>
    </article>
  `;
}

function renderCardsMissing({ screen, story, onBack, message }) {
  screen.innerHTML = `
    <section class="cards-screen">
      <div class="cards-empty">
        <div class="cards-mark" aria-hidden="true">🌟</div>
        <h1>Kartičky</h1>
        <p>${message}</p>
        <p>Příběh <strong>${story.title}</strong> doplníme později.</p>

        <button class="primary-button" id="backToStory">
          Zpět k příběhu
        </button>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);
}
