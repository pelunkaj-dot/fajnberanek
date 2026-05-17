import { completeMiniStory, unlockCard, hasUnlockedCard } from "../../storage.js";

async function loadMiniStory(storyId) {
  const response = await fetch(`data/mini-stories/${storyId}.json`);

  if (!response.ok) {
    throw new Error(`Mini příběh pro "${storyId}" zatím není připravený.`);
  }

  return response.json();
}

export async function renderMiniStory({ screen, story, onBack }) {
  try {
    const miniStory = await loadMiniStory(story.id);

    renderSlide({
      screen,
      story,
      miniStory,
      slideIndex: 0,
      onBack
    });
  } catch (error) {
    console.error(error);

    renderMiniStoryMissing({
      screen,
      story,
      onBack,
      message: error.message
    });
  }
}

function renderSlide({ screen, story, miniStory, slideIndex, onBack }) {
  const slide = miniStory.slides[slideIndex];
  const isFirst = slideIndex === 0;
  const isLast = slideIndex === miniStory.slides.length - 1;
  const progressPercent = Math.round(((slideIndex + 1) / miniStory.slides.length) * 100);

  screen.innerHTML = `
    <section class="mini-story-screen">
      <div class="mini-story-card">
        <div class="mini-story-top">
          <button class="soft-button mini-story-back" id="backToStory">
            ← Zpět
          </button>

          <div class="mini-story-progress">
            ${slideIndex + 1} / ${miniStory.slides.length}
          </div>
        </div>

        <div class="mini-story-progressbar" aria-hidden="true">
          <div style="width: ${progressPercent}%"></div>
        </div>

        <div class="mini-story-emoji" aria-hidden="true">
          ${slide.emoji}
        </div>

        <p class="mini-story-kicker">
          ${story.title}
        </p>

        <h1>${miniStory.title}</h1>

        <p class="mini-story-text">
          ${slide.text}
        </p>

        <div class="mini-story-controls">
          <button class="soft-button" id="prevSlide" ${isFirst ? "disabled" : ""}>
            Zpět
          </button>

          <button class="primary-button" id="nextSlide">
            ${isLast ? "Dokončit" : "Dál"}
          </button>
        </div>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);

  document.querySelector("#prevSlide").addEventListener("click", () => {
    if (!isFirst) {
      renderSlide({
        screen,
        story,
        miniStory,
        slideIndex: slideIndex - 1,
        onBack
      });
    }
  });

  document.querySelector("#nextSlide").addEventListener("click", () => {
    if (isLast) {
      completeMiniStory(story.id);

      if (miniStory.rewardCardId) {
        unlockCard(miniStory.rewardCardId);
      }

      renderMiniStoryDone({
        screen,
        story,
        miniStory,
        onBack
      });

      return;
    }

    renderSlide({
      screen,
      story,
      miniStory,
      slideIndex: slideIndex + 1,
      onBack
    });
  });
}

function renderMiniStoryDone({ screen, story, miniStory, onBack }) {
  const cardAlreadyUnlocked = miniStory.rewardCardId
    ? hasUnlockedCard(miniStory.rewardCardId)
    : false;

  screen.innerHTML = `
    <section class="mini-story-screen">
      <div class="mini-story-card mini-story-done">
        <div class="mini-story-emoji mini-story-reward" aria-hidden="true">
          🌈
        </div>

        <p class="mini-story-kicker">
          Příběh dokončen
        </p>

        <h1>Hotovo</h1>

        <p class="mini-story-text">
          Došel jsi až na konec příběhu <strong>${miniStory.title}</strong>.
        </p>

        <div class="reward-card">
          <div class="reward-card-icon" aria-hidden="true">🌈</div>
          <div>
            <h2>Duha naděje</h2>
            <p>
              ${cardAlreadyUnlocked
                ? "Tahle kartička už je uložená ve tvé sbírce."
                : "Získáváš novou kartičku do sbírky."}
            </p>
          </div>
        </div>

        <div class="mini-story-controls mini-story-controls-single">
          <button class="primary-button" id="backToStory">
            Zpět k příběhu
          </button>
        </div>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);
}

function renderMiniStoryMissing({ screen, story, onBack, message }) {
  screen.innerHTML = `
    <section class="mini-story-screen">
      <div class="mini-story-card">
        <div class="mini-story-emoji" aria-hidden="true">
          📖
        </div>

        <h1>Mini příběh</h1>

        <p class="mini-story-text">
          ${message}
        </p>

        <p class="mini-story-note">
          Příběh <strong>${story.title}</strong> doplníme později.
        </p>

        <div class="mini-story-controls mini-story-controls-single">
          <button class="primary-button" id="backToStory">
            Zpět k příběhu
          </button>
        </div>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);
}
