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

const AnswerStatus = {
  UNANSWERED: "unanswered",
  CORRECT: "correct",
  INCORRECT: "incorrect",
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
  answerStatuses: [],
  navigationFilters: {
    correct: false,
    incorrect: false,
    noMark: false,
  },
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
  studyTab: document.getElementById("studyTab"),
  testTab: document.getElementById("testTab"),
  setupPanel: document.getElementById("setupPanel"),
  studyPanel: document.getElementById("studyPanel"),
  testPanel: document.getElementById("testPanel"),
  modeRadios: document.querySelectorAll("input[name='modeChoice']"),
  previousBtn: document.getElementById("previousBtn"),
  nextBtn: document.getElementById("nextBtn"),
  restartBtn: document.getElementById("restartBtn"),
  status: document.getElementById("status"),
  flashcard: document.getElementById("flashcard"),
  answerStatusIndicators: document.querySelectorAll(".answer-status-indicator"),
  questionText: document.getElementById("questionText"),
  answerText: document.getElementById("answerText"),
  questionHeading: document.querySelector(".flashcard-front h2"),
  answerHeading: document.querySelector(".flashcard-back h2"),
  flipHint: document.querySelector(".flip-hint"),
  hideCorrectCheckbox: document.getElementById("hideCorrectCheckbox"),
  hideIncorrectCheckbox: document.getElementById("hideIncorrectCheckbox"),
  hideNoMarkCheckbox: document.getElementById("hideNoMarkCheckbox"),
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
  elements.studyTab.addEventListener("click", handleStudyTabSelect);
  elements.testTab.addEventListener("click", handleTestTabSelect);
  elements.previousBtn.addEventListener("click", showPreviousCard);
  elements.nextBtn.addEventListener("click", showNextCard);
  elements.restartBtn.addEventListener("click", restartDeck);
  document.addEventListener("keydown", handleGlobalKeyboardNavigation);

  elements.flashcard.addEventListener("click", toggleCardFlip);
  elements.answerStatusIndicators.forEach((indicator) => {
    indicator.addEventListener("click", handleAnswerStatusIndicatorClick);
    indicator.addEventListener("keydown", handleAnswerStatusIndicatorKeydown);
  });
  elements.flashcard.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      toggleCardFlip();
    }
  });
  [
    elements.hideCorrectCheckbox,
    elements.hideIncorrectCheckbox,
    elements.hideNoMarkCheckbox,
  ].forEach((checkbox) => {
    checkbox.addEventListener("change", handleNavigationFilterChange);
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
    state.answerStatuses = [];
    viewedCount = 0;
    uniqueSeen.clear();
    state.order = [];
    state.cursor = 0;
    state.currentCardIndex = -1;
    resetNavigationFilters();
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

function handleStudyTabSelect() {
  activateTab("study");

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

  activateTab(isStudyMode(state.mode) ? "study" : "test");

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
      tab: elements.studyTab,
      panel: elements.studyPanel,
      active: category === "study",
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
  return [elements.setupTab, elements.studyTab, elements.testTab];
}

function isStudyMode(mode) {
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

function resetNavigationFilters() {
  state.navigationFilters = {
    correct: false,
    incorrect: false,
    noMark: false,
  };
  syncNavigationFilterControls();
}

function syncNavigationFilterControls() {
  const filterCheckboxes = [
    elements.hideCorrectCheckbox,
    elements.hideIncorrectCheckbox,
    elements.hideNoMarkCheckbox,
  ];
  const checkedCount = filterCheckboxes.filter((checkbox) => checkbox.checked).length;

  filterCheckboxes.forEach((checkbox) => {
    checkbox.disabled = checkedCount >= 2 && !checkbox.checked;
  });
}

function handleNavigationFilterChange() {
  state.navigationFilters = {
    correct: elements.hideCorrectCheckbox.checked,
    incorrect: elements.hideIncorrectCheckbox.checked,
    noMark: elements.hideNoMarkCheckbox.checked,
  };

  syncNavigationFilterControls();

  if (state.mode === Mode.RANDOM_NO_REPEAT && state.sessionStarted && state.currentCardIndex >= 0) {
    updateNavigationControls(true);
  }
}

function isCardVisibleInTestNavigation(cardIndex) {
  if (state.mode !== Mode.RANDOM_NO_REPEAT) {
    return true;
  }

  const cardStatus = state.answerStatuses[cardIndex] || AnswerStatus.UNANSWERED;

  if (cardStatus === AnswerStatus.CORRECT) {
    return !state.navigationFilters.correct;
  }

  if (cardStatus === AnswerStatus.INCORRECT) {
    return !state.navigationFilters.incorrect;
  }

  return !state.navigationFilters.noMark;
}

function getVisibleCardIndex(startIndex, direction) {
  const step = direction > 0 ? 1 : -1;
  let index = startIndex + step;

  while (index >= 0 && index < state.order.length) {
    if (isCardVisibleInTestNavigation(state.order[index])) {
      return index;
    }

    index += step;
  }

  return -1;
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
  state.answerStatuses = Array.from({ length: state.cards.length }, () => AnswerStatus.UNANSWERED);

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

  if (state.mode === Mode.RANDOM_NO_REPEAT) {
    const nextIndex = getVisibleCardIndex(state.cursor, 1);

    if (nextIndex === -1) {
      updateNavigationControls(true);
      return;
    }

    state.cursor = nextIndex;
    state.currentCardIndex = state.order[nextIndex];
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
  if (state.cards.length === 0 || (state.mode !== Mode.SEQUENTIAL && state.mode !== Mode.RANDOM_NO_REPEAT)) {
    return;
  }

  if (state.mode === Mode.RANDOM_NO_REPEAT) {
    const previousIndex = getVisibleCardIndex(state.cursor, -1);

    if (previousIndex === -1) {
      updateNavigationControls(true);
      return;
    }

    state.cursor = previousIndex;
    state.currentCardIndex = state.order[previousIndex];
    renderCurrentCard();
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
  syncAnswerStatusIndicator();
  elements.flashcard.classList.remove("is-disabled");
  elements.flashcard.setAttribute("aria-disabled", "false");
  setCardState(CardState.ACTIVE);

  const progressText = formatProgressText();
  updateStatus(progressText);

  updateNavigationControls(true);
}

function formatProgressText() {
  const total = state.cards.length;

  if (state.mode === Mode.RANDOM_NO_REPEAT) {
    const currentPosition = total > 0 ? state.cursor + 1 : 0;
    const correct = state.answerStatuses.filter((status) => status === AnswerStatus.CORRECT).length;
    const incorrect = state.answerStatuses.filter((status) => status === AnswerStatus.INCORRECT).length;

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    if (correct + incorrect === 0) {
      return `Question ${currentPosition}/${total} | Correct: 0 | Incorrect: 0 | Score: ${score}%`;
    }

    return `Question ${currentPosition}/${total} | Correct: ${correct} | Incorrect: ${incorrect} | Score: ${score}%`;
  }

  if (state.mode === Mode.SEQUENTIAL || state.mode === Mode.RANDOM_REPEAT) {
    return `Viewed: ${viewedCount} | Unique: ${uniqueSeen.size} | Deck: ${total}`;
  }

  return `Viewed: ${viewedCount} | Deck: ${total}`;
}

function syncAnswerStatusIndicator() {
  const shouldShowIndicator = state.mode === Mode.RANDOM_NO_REPEAT && state.currentCardIndex >= 0 && state.cards[state.currentCardIndex];

  Array.from(elements.answerStatusIndicators).forEach((indicator) => {
    indicator.hidden = !shouldShowIndicator;

    if (!shouldShowIndicator) {
      indicator.classList.remove("is-unanswered", "is-correct", "is-incorrect", "is-animating", "is-readonly");
      return;
    }

    const currentCardIndex = state.currentCardIndex;
    const status = state.answerStatuses[currentCardIndex] || AnswerStatus.UNANSWERED;
    const statusMeta = getAnswerStatusMeta(status);
    const isInteractive = indicator.dataset.side === "back";

    indicator.classList.remove("is-unanswered", "is-correct", "is-incorrect", "is-animating", "is-readonly");
    indicator.classList.add(`is-${status}`);
    indicator.classList.toggle("is-readonly", !isInteractive);
    indicator.tabIndex = isInteractive ? 0 : -1;
    indicator.setAttribute("aria-label", `Answer status: ${statusMeta.label}`);
    indicator.title = `Answer status: ${statusMeta.label}`;
    indicator.querySelector(".answer-status-symbol").textContent = statusMeta.symbol;
  });
}

function animateAnswerStatusIndicator() {
  Array.from(elements.answerStatusIndicators).forEach((indicator) => {
    indicator.classList.remove("is-animating");
    void indicator.offsetWidth;
    indicator.classList.add("is-animating");
  });
}

function handleAnswerStatusIndicatorClick(event) {
  event.preventDefault();
  event.stopPropagation();

  const indicator = event.currentTarget;
  if (indicator.dataset.side !== "back") {
    return;
  }

  if (state.cards.length === 0 || state.mode !== Mode.RANDOM_NO_REPEAT || state.currentCardIndex < 0) {
    return;
  }

  const currentStatus = state.answerStatuses[state.currentCardIndex] || AnswerStatus.UNANSWERED;
  state.answerStatuses[state.currentCardIndex] = getNextAnswerStatus(currentStatus);
  syncAnswerStatusIndicator();
  animateAnswerStatusIndicator();
  updateNavigationControls(true);
  updateStatus(formatProgressText());
}

function handleAnswerStatusIndicatorKeydown(event) {
  const indicator = event.currentTarget;
  if (indicator.dataset.side !== "back") {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    handleAnswerStatusIndicatorClick(event);
  }
}

function getNextAnswerStatus(status) {
  if (status === AnswerStatus.UNANSWERED) {
    return AnswerStatus.CORRECT;
  }

  if (status === AnswerStatus.CORRECT) {
    return AnswerStatus.INCORRECT;
  }

  return AnswerStatus.UNANSWERED;
}

function getAnswerStatusMeta(status) {
  if (status === AnswerStatus.CORRECT) {
    return { label: "correct", symbol: "✓" };
  }

  if (status === AnswerStatus.INCORRECT) {
    return { label: "incorrect", symbol: "✗" };
  }

  return { label: "unanswered", symbol: "○" };
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

  if (state.mode === Mode.RANDOM_NO_REPEAT) {
    const previousVisibleIndex = getVisibleCardIndex(state.cursor, -1);
    const nextVisibleIndex = getVisibleCardIndex(state.cursor, 1);

    elements.previousBtn.disabled = previousVisibleIndex === -1;
    elements.nextBtn.disabled = nextVisibleIndex === -1;
    return;
  }

  elements.previousBtn.disabled = true;
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
  state.answerStatuses = [];
  resetNavigationFilters();

  elements.questionText.textContent = "Upload a CSV file to begin.";
  elements.answerText.textContent = "Upload a CSV file to begin.";
  elements.flashcard.classList.remove("is-flipped");
  setControlsEnabled(false);
  setCardState(CardState.EMPTY);
  syncAnswerStatusIndicator();
}

function setReadyState() {
  elements.questionText.textContent = "Select Study or Test to begin";
  elements.answerText.textContent = "Select Study or Test to begin";
  elements.flashcard.classList.remove("is-flipped");
  setControlsEnabled(false);
  setCardState(CardState.READY);
  syncAnswerStatusIndicator();
}

function setModeTabsEnabled(enabled) {
  [elements.studyTab, elements.testTab].forEach((tab) => {
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
