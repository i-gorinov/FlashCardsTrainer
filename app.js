const Mode = {
  SEQUENTIAL: "sequential",
  RANDOM_NO_REPEAT: "randomNoRepeat",
  RANDOM_REPEAT: "randomRepeat",
};

const CardState = {
  EMPTY: "empty",
  READY: "ready",
  ACTIVE: "active",
};

// Runtime state for current dataset, traversal strategy, and active card pointer.
const state = {
  cards: [],
  mode: Mode.SEQUENTIAL,
  activeTab: "setup",
  order: [],
  cursor: 0,
  currentCardIndex: -1,
  sessionStarted: false,
  cardState: CardState.EMPTY,
};

// Session progress is separate from dataset position.
// `currentCardIndex` identifies which card is currently displayed,
// while these values track what the user has viewed in this session.
let viewedCount = 0;
// A Set keeps only unique card identifiers, so repeats are counted once.
let uniqueSeen = new Set();

const elements = {
  uploadBtn: document.getElementById("uploadBtn"),
  csvInput: document.getElementById("csvInput"),
  fileName: document.getElementById("fileName"),
  setupTab: document.getElementById("setupTab"),
  practiceTab: document.getElementById("practiceTab"),
  testTab: document.getElementById("testTab"),
  setupPanel: document.getElementById("setupPanel"),
  practicePanel: document.getElementById("practicePanel"),
  testPanel: document.getElementById("testPanel"),
  modeRadios: document.querySelectorAll("input[name='modeChoice']"),
  previousBtn: document.getElementById("previousBtn"),
  nextBtn: document.getElementById("nextBtn"),
  restartBtn: document.getElementById("restartBtn"),
  status: document.getElementById("status"),
  flashcard: document.getElementById("flashcard"),
  questionText: document.getElementById("questionText"),
  answerText: document.getElementById("answerText"),
  questionHeading: document.querySelector(".flashcard-front h2"),
  answerHeading: document.querySelector(".flashcard-back h2"),
  flipHint: document.querySelector(".flip-hint"),
};

function initializeApp() {
  // Wire UI controls to their handlers.
  elements.uploadBtn.addEventListener("click", () => {
    elements.csvInput.click();
  });
  elements.csvInput.addEventListener("change", handleFileUpload);
  elements.modeRadios.forEach((radio) => {
    radio.addEventListener("change", handleModeChange);
  });
  getSettingsTabs().forEach((tab) => {
    tab.addEventListener("keydown", handleSettingsTabKeydown);
  });
  elements.setupTab.addEventListener("click", handleSetupTabSelect);
  elements.practiceTab.addEventListener("click", handlePracticeTabSelect);
  elements.testTab.addEventListener("click", handleTestTabSelect);
  elements.previousBtn.addEventListener("click", showPreviousCard);
  elements.nextBtn.addEventListener("click", showNextCard);
  elements.restartBtn.addEventListener("click", restartDeck);
  document.addEventListener("keydown", handleGlobalKeyboardNavigation);

  elements.flashcard.addEventListener("click", toggleCardFlip);
  elements.flashcard.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      toggleCardFlip();
    }
  });

  state.mode = getSelectedModeFromRadios();
  setModeTabsEnabled(false);
  activateTab(state.activeTab);
  
  // Initialize to empty state with proper content and visibility
  resetToEmptyState();
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    elements.fileName.textContent = "No file chosen";
    elements.fileName.title = "No file chosen";
    return;
  }

  elements.fileName.textContent = file.name;
  elements.fileName.title = file.name;

  try {
    // Parse and validate the uploaded CSV before replacing existing cards.
    const text = await readFileAsText(file);
    const parsedCards = parseCardsFromCsv(text);

    if (parsedCards.length === 0) {
      throw new Error("The CSV file does not contain any usable cards.");
    }

    state.cards = parsedCards;
    state.sessionStarted = false;
    viewedCount = 0;
    uniqueSeen.clear();
    state.order = [];
    state.cursor = 0;
    state.currentCardIndex = -1;
    setModeTabsEnabled(true);
    activateTab("setup");
    setReadyState();
    updateStatus(`${parsedCards.length} cards loaded.`);
  } catch (error) {
    resetToEmptyState();
    updateStatus(error.message || "Could not read the selected file.");
  }
}

function handleModeChange() {
  const selectedMode = getSelectedModeFromRadios();
  if (!selectedMode || selectedMode === state.mode) {
    return;
  }

  state.mode = selectedMode;
  syncModeTabUi();

  if (state.cards.length === 0 || !state.sessionStarted) {
    return;
  }

  // Rebuild order and progress for the selected mode.
  restartDeck();
}

function handleSetupTabSelect() {
  activateTab("setup");
}

function handleSettingsTabKeydown(event) {
  const tabs = getSettingsTabs();
  const currentIndex = tabs.indexOf(event.currentTarget);

  if (currentIndex === -1) {
    return;
  }

  let nextIndex = currentIndex;

  if (event.key === "ArrowRight") {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (event.key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = tabs.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
}

function handlePracticeTabSelect() {
  activateTab("practice");

  if (state.cards.length === 0) {
    return;
  }

  if (state.mode !== Mode.SEQUENTIAL || !state.sessionStarted) {
    applyMode(Mode.SEQUENTIAL, true);
    return;
  }

  setModeRadio(state.mode);
}

function handleTestTabSelect() {
  activateTab("test");

  if (state.cards.length === 0) {
    return;
  }

  if (state.mode !== Mode.RANDOM_NO_REPEAT || !state.sessionStarted) {
    applyMode(Mode.RANDOM_NO_REPEAT, true);
    return;
  }

  setModeRadio(state.mode);
}

function syncModeTabUi() {
  if (state.activeTab === "setup") {
    setModeRadio(state.mode);
    return;
  }

  activateTab(isPracticeMode(state.mode) ? "practice" : "test");

  setModeRadio(state.mode);
}

function activateTab(category) {
  state.activeTab = category;

  const tabConfig = [
    {
      tab: elements.setupTab,
      panel: elements.setupPanel,
      active: category === "setup",
    },
    {
      tab: elements.practiceTab,
      panel: elements.practicePanel,
      active: category === "practice",
    },
    {
      tab: elements.testTab,
      panel: elements.testPanel,
      active: category === "test",
    },
  ];

  tabConfig.forEach(({ tab, panel, active }) => {
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    panel.hidden = !active;
  });
}

function getSettingsTabs() {
  return [elements.setupTab, elements.practiceTab, elements.testTab];
}

function isPracticeMode(mode) {
  return mode === Mode.SEQUENTIAL || mode === Mode.RANDOM_REPEAT;
}

function getSelectedModeFromRadios() {
  const selectedRadio = Array.from(elements.modeRadios).find((radio) => radio.checked);
  return selectedRadio ? selectedRadio.value : Mode.SEQUENTIAL;
}

function setModeRadio(mode) {
  elements.modeRadios.forEach((radio) => {
    radio.checked = radio.value === mode;
  });
}

function applyMode(mode, shouldStartSession = false) {
  if (state.mode === mode && !shouldStartSession) {
    return;
  }

  state.mode = mode;
  setModeRadio(mode);
  syncModeTabUi();

  if (state.cards.length > 0 && (state.sessionStarted || shouldStartSession)) {
    restartDeck();
  }
}

function restartDeck() {
  if (state.cards.length === 0) {
    return;
  }

  state.sessionStarted = true;

  viewedCount = 0;
  uniqueSeen.clear();

  // Build the traversal order for the selected mode.
  state.order = createOrder(state.cards.length, state.mode);
  state.cursor = 0;

  if (state.mode === Mode.RANDOM_REPEAT) {
    state.currentCardIndex = getRandomIndex(state.cards.length);
  } else {
    state.currentCardIndex = state.order[0];
  }

  renderCurrentCard();
  setControlsEnabled(true);
}

function showNextCard() {
  if (state.cards.length === 0) {
    return;
  }

  // Repeat mode always samples a fresh random card.
  if (state.mode === Mode.RANDOM_REPEAT) {
    state.currentCardIndex = getRandomIndex(state.cards.length);
    renderCurrentCard();
    return;
  }

  if (state.cursor >= state.order.length - 1) {
    updateStatus(`End of deck. You have reviewed all ${state.cards.length} cards. Press Restart.`);
    updateNavigationControls(true);
    return;
  }

  state.cursor += 1;
  state.currentCardIndex = state.order[state.cursor];
  renderCurrentCard();
}

function showPreviousCard() {
  // Backward navigation is intentionally supported only in sequential mode.
  if (state.cards.length === 0 || state.mode !== Mode.SEQUENTIAL) {
    return;
  }

  if (state.cursor <= 0) {
    updateNavigationControls(true);
    return;
  }

  state.cursor -= 1;
  state.currentCardIndex = state.order[state.cursor];
  renderCurrentCard();
}

function renderCurrentCard() {
  const card = state.cards[state.currentCardIndex];
  if (!card) {
    return;
  }

  // Track session progress whenever a new card is shown.
  viewedCount += 1;
  uniqueSeen.add(state.currentCardIndex);

  elements.questionText.textContent = card.question;
  elements.answerText.textContent = card.answer;
  elements.flashcard.classList.remove("is-flipped");
  elements.flashcard.classList.remove("is-disabled");
  elements.flashcard.setAttribute("aria-disabled", "false");
  setCardState(CardState.ACTIVE);

  const progressText = formatProgressText();
  updateStatus(progressText);

  updateNavigationControls(true);
}

function formatProgressText() {
  const total = state.cards.length;

  if (state.mode === Mode.SEQUENTIAL || state.mode === Mode.RANDOM_REPEAT) {
    return `Viewed: ${viewedCount} | Unique: ${uniqueSeen.size} / ${total}`;
  }

  return `Viewed: ${viewedCount} | Deck: ${total}`;
}

function toggleCardFlip() {
  if (state.cards.length === 0 || elements.flashcard.getAttribute("aria-disabled") === "true") {
    return;
  }

  // CSS handles the 3D flip via the is-flipped class.
  elements.flashcard.classList.toggle("is-flipped");
}

function setControlsEnabled(enabled) {
  elements.restartBtn.disabled = !enabled;
  elements.flashcard.classList.toggle("is-disabled", !enabled);
  elements.flashcard.setAttribute("aria-disabled", String(!enabled));
  elements.flashcard.tabIndex = enabled ? 0 : -1;
  updateNavigationControls(enabled);
}

function updateNavigationControls(enabled) {
  if (!enabled || state.cards.length === 0) {
    elements.nextBtn.disabled = true;
    elements.previousBtn.disabled = true;
    return;
  }

  if (state.mode === Mode.SEQUENTIAL) {
    elements.previousBtn.disabled = state.cursor <= 0;
    elements.nextBtn.disabled = state.cursor >= state.order.length - 1;
    return;
  }

  elements.previousBtn.disabled = true;

  // Only the finite non-repeat mode reaches an actual deck end.
  if (state.mode === Mode.RANDOM_NO_REPEAT) {
    elements.nextBtn.disabled = state.cursor >= state.order.length - 1;
    return;
  }

  elements.nextBtn.disabled = false;
}

function setCardState(cardState) {
  state.cardState = cardState;
  
  // Hide/show headings and flip hint based on card state
  const isActive = cardState === CardState.ACTIVE;
  
  if (elements.questionHeading) {
    elements.questionHeading.hidden = !isActive;
  }
  if (elements.answerHeading) {
    elements.answerHeading.hidden = !isActive;
  }
  if (elements.flipHint) {
    elements.flipHint.hidden = !isActive;
  }
}

function handleGlobalKeyboardNavigation(event) {
  // Ignore shortcuts while the user is interacting with form controls.
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    isFormControl(event.target)
  ) {
    return;
  }

  if (event.key === "ArrowRight") {
    if (elements.nextBtn.disabled) {
      return;
    }

    event.preventDefault();
    showNextCard();
    return;
  }

  if (event.key === "ArrowLeft") {
    if (elements.previousBtn.disabled) {
      return;
    }

    event.preventDefault();
    showPreviousCard();
  }
}

function isFormControl(target) {
  return (
    target instanceof Element &&
    Boolean(target.closest("input, select, textarea, button, [contenteditable='true']"))
  );
}

function resetToEmptyState() {
  state.cards = [];
  state.order = [];
  state.cursor = 0;
  state.currentCardIndex = -1;
  state.mode = getSelectedModeFromRadios();
  state.sessionStarted = false;
  syncModeTabUi();
  setModeTabsEnabled(false);
  viewedCount = 0;
  uniqueSeen.clear();

  elements.questionText.textContent = "Upload a CSV file to begin.";
  elements.answerText.textContent = "Upload a CSV file to begin.";
  elements.flashcard.classList.remove("is-flipped");
  setControlsEnabled(false);
  setCardState(CardState.EMPTY);
}

function setReadyState() {
  elements.questionText.textContent = "Select Practice or Test to begin";
  elements.answerText.textContent = "Select Practice or Test to begin";
  elements.flashcard.classList.remove("is-flipped");
  setControlsEnabled(false);
  setCardState(CardState.READY);
}

function setModeTabsEnabled(enabled) {
  [elements.practiceTab, elements.testTab].forEach((tab) => {
    tab.disabled = !enabled;
    tab.setAttribute("aria-disabled", String(!enabled));
  });
}

function updateStatus(message) {
  elements.status.textContent = message;
}

function createOrder(length, mode) {
  const indexes = Array.from({ length }, (_, i) => i);

  // Only the no-repeat random mode needs a shuffled fixed traversal.
  if (mode === Mode.RANDOM_NO_REPEAT) {
    return shuffle(indexes);
  }

  return indexes;
}

function shuffle(array) {
  const result = [...array];

  // Fisher-Yates shuffle for an unbiased random ordering.
  for (let i = result.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }

  return result;
}

function getRandomIndex(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read the selected file."));

    reader.readAsText(file);
  });
}

function parseCardsFromCsv(csvText) {
  // Remove fully empty rows so accidental blank lines do not create cards.
  const rows = parseCsvRows(csvText).filter((row) =>
    row.some((cell) => cell.trim().length > 0)
  );

  if (rows.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const header = rows[0].map(normalizeHeaderCell);
  const questionIndex = header.indexOf("question");
  const answerIndex = header.indexOf("answer");

  if (questionIndex === -1 || answerIndex === -1) {
    throw new Error("CSV header must include both 'question' and 'answer' columns.");
  }

  const cards = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const question = (row[questionIndex] || "").trim();
    const answer = (row[answerIndex] || "").trim();

    // Skip partial rows to keep each flashcard complete.
    if (!question || !answer) {
      continue;
    }

    cards.push({ question, answer });
  }

  return cards;
}

function normalizeHeaderCell(value) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function parseCsvRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      // Double quotes inside a quoted value represent one literal quote.
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      // Handle both \n and \r\n line endings.
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

initializeApp();
