export async function renderMiniStory({ screen, story, onBack }) {
  screen.innerHTML = `
    <section class="home">
      <div class="hero">
        <div class="hero-mark" aria-hidden="true">📖</div>
        <h1>Mini příběh</h1>
        <p>
          Příběh: <strong>${story.title}</strong>
        </p>
        <p>
          Modul mini příběhů je připravený. V dalším kroku načteme konkrétní data příběhu.
        </p>
        <button class="primary-button" id="backToStory">
          Zpět k příběhu
        </button>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);
}
