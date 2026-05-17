import { hasUnlockedCard, resetProgress } from "../../storage.js";

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Nepodařilo se načíst: ${path}`);
  }

  return response.json();
}

async function loadCardsForStories(stories) {
  const results = await Promise.all(
    stories.map(async (story) => {
      try {
        const cardSet = await loadJson(`data/cards/${story.id}.json`);
        return { story, cardSet };
      } catch (error) {
        console.warn(error);
        return { story, cardSet: null };
      }
    })
  );

  return results.filter((item) => item.cardSet);
}

export async function renderCollection({ screen, stories, onBack, onOpenStory }) {
  try {
    const groups = await loadCardsForStories(stories);
    const allCards = groups.flatMap(({ story, cardSet }) => (
      cardSet.cards.map((card) => ({ story, card }))
    ));

    const unlockedTotal = allCards.filter(({ card }) => hasUnlockedCard(card.id)).length;
    const total = allCards.length;

    screen.innerHTML = `
      <section class="collection-screen">
        <div class="collection-header">
          <button class="soft-button collection-back" id="backToHome">← Zpět</button>

          <div class="collection-title-block">
            <div class="collection-mark" aria-hidden="true">🌟</div>
            <p class="collection-kicker">FajnBeránek</p>
            <h1>Moje kartičky</h1>
            <p>Všechny objevené kartičky ze všech příběhů na jednom místě.</p>

            <div class="collection-total">
              <strong>${unlockedTotal}</strong> / ${total} kartiček objeveno
            </div>
          </div>
        </div>

        <div class="collection-groups">
          ${groups.map(renderStoryGroup).join("")}
        </div>

        <div class="collection-tools">
          <p>Testování a správa pokroku</p>
          <button class="soft-button collection-reset-button" id="showResetConfirm">
            Vymazat pokrok
          </button>
        </div>
      </section>
    `;

    document.querySelector("#backToHome").addEventListener("click", onBack);

    document.querySelectorAll("[data-open-story]").forEach((button) => {
      button.addEventListener("click", () => {
        onOpenStory(button.dataset.openStory);
      });
    });

    document.querySelector("#showResetConfirm").addEventListener("click", () => {
      renderResetConfirm({ screen, stories, onBack, onOpenStory });
    });
  } catch (error) {
    console.error(error);
    renderCollectionError({ screen, onBack });
  }
}

function renderStoryGroup({ story, cardSet }) {
  const unlockedCount = cardSet.cards.filter((card) => hasUnlockedCard(card.id)).length;
  const total = cardSet.cards.length;

  return `
    <section class="collection-group">
      <div class="collection-group-head">
        <div>
          <p class="collection-kicker">${story.title}</p>
          <h2>${unlockedCount} / ${total} objeveno</h2>
        </div>

        <button class="soft-button collection-story-button" data-open-story="${story.id}">
          Otevřít příběh
        </button>
      </div>

      <div class="collection-card-grid">
        ${cardSet.cards.map(renderCollectionCard).join("")}
      </div>
    </section>
  `;
}

function renderCollectionCard(card) {
  const unlocked = hasUnlockedCard(card.id);

  return `
    <article class="global-card ${unlocked ? "is-unlocked" : "is-locked"}">
      <div class="global-card-emoji" aria-hidden="true">
        ${unlocked ? card.emoji : "?"}
      </div>

      <div>
        <p class="global-card-state">${unlocked ? "Odemčeno" : "Zatím tajné"}</p>
        <h3>${unlocked ? card.title : "Tajemná kartička"}</h3>
        <p>${unlocked ? card.description : "Objev ji v příběhu."}</p>
      </div>
    </article>
  `;
}

function renderResetConfirm({ screen, stories, onBack, onOpenStory }) {
  screen.innerHTML = `
    <section class="collection-screen">
      <div class="collection-empty">
        <div class="collection-mark" aria-hidden="true">🧹</div>
        <p class="collection-kicker">Testování</p>
        <h1>Vymazat pokrok?</h1>
        <p>
          Tím se zamknou všechny kartičky a aplikace začne znovu od začátku.
        </p>

        <div class="collection-reset-actions">
          <button class="soft-button" id="cancelReset">Nechat pokrok</button>
          <button class="primary-button" id="confirmReset">Vymazat</button>
        </div>
      </div>
    </section>
  `;

  document.querySelector("#cancelReset").addEventListener("click", () => {
    renderCollection({ screen, stories, onBack, onOpenStory });
  });

  document.querySelector("#confirmReset").addEventListener("click", () => {
    resetProgress();
    renderCollection({ screen, stories, onBack, onOpenStory });
  });
}

function renderCollectionError({ screen, onBack }) {
  screen.innerHTML = `
    <section class="collection-screen">
      <div class="collection-empty">
        <div class="collection-mark" aria-hidden="true">🌧️</div>
        <h1>Jejda</h1>
        <p>Sbírku kartiček se nepodařilo načíst.</p>
        <button class="primary-button" id="backToHome">Zpět</button>
      </div>
    </section>
  `;

  document.querySelector("#backToHome").addEventListener("click", onBack);
}
