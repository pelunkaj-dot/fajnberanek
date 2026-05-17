import { hasUnlockedCard } from "../../storage.js";
import { unlockCompletionRewardIfReady } from "../../rewards.js";

async function loadCards(storyId) {
  const response = await fetch(`data/cards/${storyId}.json`);

  if (!response.ok) {
    throw new Error(`Karticky pro "${storyId}" zatim nejsou pripravene.`);
  }

  return response.json();
}

export async function renderCards({ screen, story, onBack }) {
  try {
    const cardSet = await loadCards(story.id);
    const completionReward = unlockCompletionRewardIfReady(cardSet);
    const unlockedCount = cardSet.cards.filter((card) => hasUnlockedCard(card.id)).length;
    const totalCount = cardSet.cards.length;

    screen.innerHTML = `
      <section class="cards-screen">
        <div class="cards-header">
          <button class="soft-button cards-back" id="backToStory">← Zpět</button>

          <div class="cards-title-block">
            <div class="cards-mark" aria-hidden="true">🌟</div>
            <p class="cards-kicker">${story.title}</p>
            <h1>${cardSet.title}</h1>
            <p>Sbírej kartičky při objevování příběhu.</p>

            <div class="cards-count">
              <strong>${unlockedCount}</strong> / ${totalCount} kartičky objeveny
            </div>

            ${completionReward.changed ? renderCompletionReward(completionReward.rewardCard) : ""}
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

function renderCompletionReward(card) {
  return `
    <div class="cards-completion-reward">
      <div aria-hidden="true">${card.emoji}</div>
      <p>Dokončil jsi celý příběh. Odemkla se kartička <strong>${card.title}</strong>.</p>
    </div>
  `;
}

function renderCard(card) {
  const unlocked = hasUnlockedCard(card.id);

  return `
    <article class="collection-card ${unlocked ? "is-unlocked" : "is-locked"}">
      <div class="collection-card-emoji" aria-hidden="true">${unlocked ? card.emoji : "?"}</div>

      <div class="collection-card-content">
        <p class="collection-card-state">${unlocked ? "Odemčeno" : "Zatím neobjeveno"}</p>
        <h2>${unlocked ? card.title : "Tajemná kartička"}</h2>
        <p>${unlocked ? card.description : "Tuhle kartičku získáš při objevování příběhu."}</p>
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

        <button class="primary-button" id="backToStory">Zpět k příběhu</button>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);
}
