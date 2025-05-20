let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;
let totalPairs = 0;
let clickCount = 0;
let timer = null;
let timeLeft = 0;
let powerUsed = false;

const difficultySettings = {
  easy: { pairs: 3, time: 60, rows: 2, cols: 3 },
  medium: { pairs: 6, time: 90, rows: 3, cols: 4 },
  hard: { pairs: 9, time: 120, rows: 3, cols: 6 }
};

function shuffle(array) {
  return array.sort(() => 0.5 - Math.random());
}

async function fetchPokemonImages(count) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1500`);
  const data = await res.json();
  const allPokemon = data.results;
  const selected = shuffle(allPokemon).slice(0, count);

  const images = await Promise.all(selected.map(async p => {
    const id = p.url.split('/').filter(Boolean).pop();
    const detail = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const detailData = await detail.json();
    return detailData.sprites.other['official-artwork'].front_default;
  }));

  return images;
}

function resetGameState() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  matchedPairs = 0;
  clickCount = 0;
  powerUsed = false;
  clearInterval(timer);
  $("#clicks").text(0);
  $("#matched").text(0);
  $("#remaining").text(0);
  $("#message").text("");
  $("#game_grid").removeClass("celebrate");
  $("#total").text(0);
}

function startTimer(seconds) {
  timeLeft = seconds;
  $("#timer").text(timeLeft);
  timer = setInterval(() => {
    timeLeft--;
    $("#timer").text(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timer);
      $("#message").text("⏱ Game Over!");
      $(".card").off("click");
    }
  }, 1000);
}

function updateMatchedCards() {
  $(".card[data-matched='true']").addClass("matched");
  setTimeout(() => {
    $(".card[data-matched='true']").removeClass("matched");
  }, 500);
}

function renderCards(images, rows, cols) {
  const cardImages = shuffle([...images, ...images]);
  const $grid = $("#game_grid");
  $grid
    .css({
      display: "grid",
      "grid-template-columns": `repeat(${cols}, 160px)`,
      "grid-template-rows": `repeat(${rows}, 168)`,
      "grid-gap": "15px"
    })
    .empty();

  cardImages.forEach((src, i) => {
    const card = $(`
      <div class="card" data-img="${src}" data-matched="false">
        <img class="front_face" src="${src}" alt="Pokémon" />
        <div class="back_face"></div>
      </div>
    `);
    $grid.append(card);
  });

  $(".card").on("click", handleCardClick);
}

function handleCardClick() {
  if (lockBoard || $(this).hasClass("flip") || $(this).attr('data-matched') === 'true') return;

  clickCount++;
  $("#clicks").text(clickCount);

  $(this).addClass("flip");
  const img = $(this).data("img");

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  lockBoard = true;

  const img1 = $(firstCard).data("img");
  const img2 = $(secondCard).data("img");

  if (img1 === img2) {
    matchedPairs++;
    const totalLeft = totalPairs - matchedPairs;
    $("#matched").text(matchedPairs);
    $("#remaining").text(totalLeft);
    $(firstCard).attr('data-matched', 'true');
    $(secondCard).attr('data-matched', 'true');
    $(firstCard).off("click");
    $(secondCard).off("click");
    updateMatchedCards();
    resetCards();

    if (matchedPairs === totalPairs) {
      clearInterval(timer);
      const winOverlay = $(`
        <div class="win-overlay">
          <div class="win-message">🎉 You Win!</div>
        </div>
      `);
      $("#game_grid").append(winOverlay);
    }
  } else {
    setTimeout(() => {
      $(firstCard).removeClass("flip");
      $(secondCard).removeClass("flip");
      resetCards();
    }, 1000);
  }
}

function resetCards() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

async function startGame() {
  const level = $("#difficulty").val();
  const settings = difficultySettings[level];
  totalPairs = settings.pairs;
  resetGameState();

  const images = await fetchPokemonImages(totalPairs);
  renderCards(images, settings.rows, settings.cols);
  $("#total").text(totalPairs);
  $("#remaining").text(totalPairs);

  startTimer(settings.time);
}

function resetGame() {
  startGame();
}

function applyTheme(theme) {
  $("body").removeClass("light dark").addClass(theme);
}

function usePowerUp() {
  if (powerUsed) return;
  powerUsed = true;
  $(".card").addClass("flip");
  setTimeout(() => {
    $(".card").removeClass("flip");
  }, 1500);
}

$(document).ready(() => {
  $("#startBtn").on("click", startGame);
  $("#resetBtn").on("click", resetGame);
  $("#themeSelect").on("change", (e) => applyTheme(e.target.value));
  $("#powerUpBtn").on("click", usePowerUp);

  applyTheme('light');
});