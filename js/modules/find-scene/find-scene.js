import { unlockCard } from "../../storage.js";

async function loadFindScene(storyId) {
  const response = await fetch(`data/find-scene/${storyId}.json`);

  if (!response.ok) {
    throw new Error(`Hledání pro "${storyId}" zatím není připravené.`);
  }

  return response.json();
}

export async function renderFindScene({ screen, story, onBack }) {
  try {
    const findScene = await loadFindScene(story.id);

    renderTask({
      screen,
      story,
      findScene,
      taskIndex: 0,
      foundIds: [],
      feedback: "",
      onBack
    });
  } catch (error) {
    console.error(error);
    renderFindSceneMissing({ screen, story, onBack, message: error.message });
  }
}

function renderTask({ screen, story, findScene, taskIndex, foundIds, feedback, onBack }) {
  const task = findScene.tasks[taskIndex];
  const isLast = taskIndex === findScene.tasks.length - 1;
  const progressPercent = Math.round(((taskIndex + 1) / findScene.tasks.length) * 100);

  screen.innerHTML = `
    <section class="find-scene-screen">
      <div class="find-scene-card">
        <div class="find-scene-top">
          <button class="soft-button find-scene-back" id="backToStory">
            ← Zpět
          </button>

          <div class="find-scene-progress">
            ${taskIndex + 1} / ${findScene.tasks.length}
          </div>
        </div>

        <div class="find-scene-progressbar" aria-hidden="true">
          <div style="width: ${progressPercent}%"></div>
        </div>

        <p class="find-scene-kicker">${story.title}</p>
        <h1>${findScene.title}</h1>

        <p class="find-scene-instruction">
          ${task.instruction}
        </p>

        <div class="find-scene-area" aria-label="Scéna k hledání">
          <div class="find-scene-sky" aria-hidden="true"></div>
          <div class="find-scene-ground" aria-hidden="true"></div>

          ${findScene.scene.map((item) => renderSceneItem(item, foundIds)).join("")}
        </div>

        <p class="find-scene-feedback ${feedback ? "is-visible" : ""}">
          ${feedback || "Klepni na správný obrázek."}
        </p>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);

  document.querySelectorAll("[data-scene-item-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const clickedId = button.dataset.sceneItemId;

      if (clickedId === task.targetId) {
        const nextFoundIds = Array.from(new Set([...foundIds, clickedId]));

        if (isLast) {
          if (findScene.rewardCardId) {
            unlockCard(findScene.rewardCardId);
          }

          renderFindSceneDone({
            screen,
            story,
            findScene,
            onBack
          });

          return;
        }

        renderTask({
          screen,
          story,
          findScene,
          taskIndex: taskIndex + 1,
          foundIds: nextFoundIds,
          feedback: "Výborně, našel jsi to.",
          onBack
        });

        return;
      }

      renderTask({
        screen,
        story,
        findScene,
        taskIndex,
        foundIds,
        feedback: "Skoro. Zkus se podívat ještě jednou.",
        onBack
      });
    });
  });
}

function renderSceneItem(item, foundIds) {
  const found = foundIds.includes(item.id);

  return `
    <button
      class="find-scene-item find-scene-item-${item.size} ${found ? "is-found" : ""}"
      data-scene-item-id="${item.id}"
      style="left: ${item.x}%; top: ${item.y}%"
      aria-label="${item.label}"
    >
      <span aria-hidden="true">${item.emoji}</span>
    </button>
  `;
}

function renderFindSceneDone({ screen, story, findScene, onBack }) {
  screen.innerHTML = `
    <section class="find-scene-screen">
      <div class="find-scene-card find-scene-done">
        <div class="find-scene-reward" aria-hidden="true">⛵</div>

        <p class="find-scene-kicker">Hledání dokončeno</p>
        <h1>Našel jsi všechno</h1>

        <p class="find-scene-instruction">
          Prošel jsi celé hledání <strong>${findScene.title}</strong>.
        </p>

        <div class="find-scene-prize">
          <div class="find-scene-prize-icon" aria-hidden="true">⛵</div>
          <div>
            <h2>Archa</h2>
            <p>Získáváš další kartičku do sbírky.</p>
          </div>
        </div>

        <button class="primary-button" id="backToStory">
          Zpět k příběhu
        </button>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);
}

function renderFindSceneMissing({ screen, story, onBack, message }) {
  screen.innerHTML = `
    <section class="find-scene-screen">
      <div class="find-scene-card find-scene-done">
        <div class="find-scene-reward" aria-hidden="true">🔎</div>

        <h1>Hledej v obrázku</h1>

        <p class="find-scene-instruction">
          ${message}
        </p>

        <p class="find-scene-note">
          Příběh <strong>${story.title}</strong> doplníme později.
        </p>

        <button class="primary-button" id="backToStory">
          Zpět k příběhu
        </button>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);
}
