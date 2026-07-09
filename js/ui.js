
let elements;

function initializeApp() {
  elements = getElements();
  wireEvents();
  state.mode = getSelectedModeFromRadios();
  setModeTabsEnabled(false);
  activateTab(state.activeTab);
  resetToEmptyState();
}

function wireEvents() {
  elements.uploadBtn.addEventListener("click", () => elements.csvInput.click());
  elements.csvInput.addEventListener("change", handleFileUpload);
  elements.modeRadios.forEach((radio) => radio.addEventListener("change", handleModeChange));
  elements.setupTab.addEventListener("click", () => activateTab(TabName.SETUP));
  elements.studyTab.addEventListener("click", selectStudyTab);
  elements.testTab.addEventListener("click", selectTestTab);
  elements.previousBtn.addEventListener("click", showPreviousCard);
  elements.nextBtn.addEventListener("click", showNextCard);
  elements.resetBtn.addEventListener("click", resetDeck);
  elements.flashcard.addEventListener("click", toggleCardFlip);
  elements.answerStatusIndicators.forEach((indicator) => {
    indicator.addEventListener("click", handleAnswerStatusIndicatorClick);
  });
  getNavigationFilterCheckboxes().forEach((checkbox) => {
    checkbox.addEventListener("change", handleNavigationFilterChange);
  });
  elements.disclaimerLink.addEventListener("click", handleDisclaimerLinkClick);
  elements.closeDisclaimerBtn.addEventListener("click", closeDisclaimer);
  elements.disclaimerDialog.addEventListener("click", handleDisclaimerBackdropClick);
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0];

  if (!file) {
    setSelectedFileName("No file chosen");
    return;
  }

  setSelectedFileName(file.name);

  try {
    updateStatus("Loading CSV...");
    const text = await readFileAsText(file);
    const parsedCards = await parseCardsFromCsv(text);

    if (parsedCards.length === 0) {
      throw new Error("The CSV file does not contain any usable cards.");
    }

    setCards(parsedCards);
    syncNavigationFilterControls();
    setModeTabsEnabled(true);
    activateTab(TabName.SETUP);
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

  if (state.cards.length > 0 && state.sessionStarted) {
    resetDeck();
  }
}

function selectStudyTab() {
  if (state.activeTab === TabName.STUDY) {
    return;
  }

  activateTab(TabName.STUDY);

  if (state.cards.length === 0) {
    return;
  }

  if (!isStudyMode(state.mode) || !state.sessionStarted) {
    applyMode(Mode.SEQUENTIAL, true);
  } else {
    setModeRadio(state.mode);
  }
}

function selectTestTab() {
  if (state.activeTab === TabName.TEST) {
    return;
  }

  activateTab(TabName.TEST);

  if (state.cards.length === 0) {
    return;
  }

  if (state.mode !== Mode.RANDOM_NO_REPEAT || !state.sessionStarted) {
    applyMode(Mode.RANDOM_NO_REPEAT, true);
  } else {
    setModeRadio(state.mode);
  }
}

function applyMode(mode, shouldStartSession = false) {
  if (state.mode === mode && !shouldStartSession) {
    return;
  }

  state.mode = mode;
  setModeRadio(mode);
  syncModeTabUi();

  if (state.cards.length > 0 && (state.sessionStarted || shouldStartSession)) {
    resetDeck();
  }
}

function activateTab(tabName) {
  state.activeTab = tabName;

  getTabConfig().forEach(({ tab, panel, name }) => {
    const active = name === tabName;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    panel.hidden = !active;
  });
}

function syncModeTabUi() {
  if (state.activeTab === TabName.SETUP) {
    setModeRadio(state.mode);
    return;
  }

  activateTab(isStudyMode(state.mode) ? TabName.STUDY : TabName.TEST);
  setModeRadio(state.mode);
}

function resetDeck() {
  if (state.cards.length === 0) {
    return;
  }

  state.sessionStarted = true;
  resetAnswerStatuses();
  resetProgress();
  resetCoreState();
  state.order = createOrder(state.cards.length, state.mode);
  state.currentCardIndex = state.mode === Mode.RANDOM_REPEAT ? getRandomIndex(state.cards.length) : state.order[0];
  renderCurrentCard();
  setControlsEnabled(true);
}

function showNextCard() {
  if (state.cards.length === 0) {
    return;
  }

  if (state.mode === Mode.RANDOM_REPEAT) {
    state.currentCardIndex = getRandomIndex(state.cards.length);
    renderCurrentCard();
    return;
  }

  if (state.mode === Mode.RANDOM_NO_REPEAT) {
    moveToVisibleCard(1);
    return;
  }

  if (state.cursor >= state.order.length - 1) {
    updateStatus(`End of deck. You have reviewed all ${state.cards.length} cards. Press Reset.`);
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
    moveToVisibleCard(-1);
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

function moveToVisibleCard(direction) {
  const nextCursor = getVisibleCardCursor(state.cursor, direction);

  if (nextCursor === -1) {
    updateNavigationControls(true);
    return;
  }

  state.cursor = nextCursor;
  state.currentCardIndex = state.order[nextCursor];
  renderCurrentCard();
}

function renderCurrentCard() {
  const card = state.cards[state.currentCardIndex];

  if (!card) {
    return;
  }

  markCardViewed(state.currentCardIndex);
  elements.questionText.textContent = card.question;
  elements.answerText.textContent = card.answer;
  elements.flashcard.classList.remove("is-flipped");
  elements.flashcard.classList.remove("is-disabled");
  elements.flashcard.setAttribute("aria-disabled", "false");
  setCardState(CardState.ACTIVE);
  syncAnswerStatusIndicator();
  updateStatus(formatProgressText());
  updateNavigationControls(true);
}

function formatProgressText() {
  const total = state.cards.length;

  if (state.mode === Mode.RANDOM_NO_REPEAT) {
    const currentPosition = total > 0 ? state.cursor + 1 : 0;
    const { correct, incorrect } = computeTestTotals();
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    return `Question ${currentPosition}/${total} | Correct: ${correct} | Incorrect: ${incorrect} | Score: ${score}%`;
  }

  return `Viewed: ${state.progress.viewedCount} | Unique: ${state.progress.uniqueSeen.size} | Deck: ${total}`;
}

function computeTestTotals() {
  return state.answerStatuses.reduce(
    (totals, status) => ({
      correct: totals.correct + (status === AnswerStatus.CORRECT ? 1 : 0),
      incorrect: totals.incorrect + (status === AnswerStatus.INCORRECT ? 1 : 0),
    }),
    { correct: 0, incorrect: 0 },
  );
}

function syncAnswerStatusIndicator() {
  const shouldShowIndicator = state.mode === Mode.RANDOM_NO_REPEAT && state.currentCardIndex >= 0 && Boolean(state.cards[state.currentCardIndex]);

  elements.answerStatusIndicators.forEach((indicator) => {
    indicator.hidden = !shouldShowIndicator;
    resetAnswerStatusClasses(indicator);

    if (!shouldShowIndicator) {
      return;
    }

    const status = state.answerStatuses[state.currentCardIndex] || AnswerStatus.UNANSWERED;
    const statusMeta = ANSWER_STATUS_META[status];
    const isInteractive = indicator.dataset.side === "back";

    indicator.classList.add(`is-${status}`);
    indicator.classList.toggle("is-readonly", !isInteractive);
    indicator.tabIndex = isInteractive ? 0 : -1;
    indicator.setAttribute("aria-label", `Answer status: ${statusMeta.label}`);
    indicator.title = `Answer status: ${statusMeta.label}`;
    indicator.querySelector(".answer-status-symbol").textContent = statusMeta.symbol;
  });
}

function resetAnswerStatusClasses(indicator) {
  indicator.classList.remove(...ANSWER_STATUS_CLASSES, "is-animating", "is-readonly");
}

function animateAnswerStatusIndicator() {
  elements.answerStatusIndicators.forEach((indicator) => {
    indicator.classList.remove("is-animating");
    void indicator.offsetWidth;
    indicator.classList.add("is-animating");
  });
}

function handleAnswerStatusIndicatorClick(event) {
  event.preventDefault();
  event.stopPropagation();

  const indicator = event.currentTarget;

  if (indicator.dataset.side !== "back" || state.cards.length === 0 || state.mode !== Mode.RANDOM_NO_REPEAT || state.currentCardIndex < 0) {
    return;
  }

  const currentStatus = state.answerStatuses[state.currentCardIndex] || AnswerStatus.UNANSWERED;
  state.answerStatuses[state.currentCardIndex] = getNextAnswerStatus(currentStatus);
  syncAnswerStatusIndicator();
  animateAnswerStatusIndicator();
  updateNavigationControls(true);
  updateStatus(formatProgressText());
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

function toggleCardFlip() {
  if (state.cards.length === 0 || elements.flashcard.getAttribute("aria-disabled") === "true") {
    return;
  }

  elements.flashcard.classList.toggle("is-flipped");
}

function setControlsEnabled(enabled) {
  elements.resetBtn.disabled = !enabled;
  elements.flashcard.classList.toggle("is-disabled", !enabled);
  elements.flashcard.setAttribute("aria-disabled", String(!enabled));
  updateNavigationControls(enabled);
}

function updateNavigationControls(enabled) {
  const navigationState = getNavigationState(enabled);
  elements.previousBtn.disabled = !navigationState.canGoPrevious;
  elements.nextBtn.disabled = !navigationState.canGoNext;
}

function setCardState(cardState) {
  state.cardState = cardState;
  const isActive = cardState === CardState.ACTIVE;
  elements.questionHeading.hidden = !isActive;
  elements.answerHeading.hidden = !isActive;
  elements.flipHint.hidden = !isActive;
}

function resetToEmptyState() {
  resetAllState(getSelectedModeFromRadios());
  syncModeTabUi();
  setModeTabsEnabled(false);
  syncNavigationFilterControls();
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

function syncNavigationFilterControls() {
  const filterCheckboxes = getNavigationFilterCheckboxes();

  filterCheckboxes.forEach((checkbox) => {
    checkbox.checked = Boolean(state.navigationFilters[checkbox.dataset.filter]);
  });

  const checkedCount = filterCheckboxes.filter((checkbox) => checkbox.checked).length;

  filterCheckboxes.forEach((checkbox) => {
    checkbox.disabled = checkedCount >= 2 && !checkbox.checked;
  });
}

function getNavigationFilterCheckboxes() {
  return [
    elements.hideCorrectCheckbox,
    elements.hideIncorrectCheckbox,
    elements.hideNoMarkCheckbox,
  ].map((checkbox, index) => {
    checkbox.dataset.filter = ["correct", "incorrect", "noMark"][index];
    return checkbox;
  });
}

function setModeTabsEnabled(enabled) {
  [elements.studyTab, elements.testTab].forEach((tab) => {
    tab.disabled = !enabled;
    tab.setAttribute("aria-disabled", String(!enabled));
  });
}

function getSelectedModeFromRadios() {
  return [...elements.modeRadios].find((radio) => radio.checked)?.value || Mode.SEQUENTIAL;
}

function setModeRadio(mode) {
  elements.modeRadios.forEach((radio) => {
    radio.checked = radio.value === mode;
  });
}

function getTabConfig() {
  return [
    { name: TabName.SETUP, tab: elements.setupTab, panel: elements.setupPanel },
    { name: TabName.STUDY, tab: elements.studyTab, panel: elements.studyPanel },
    { name: TabName.TEST, tab: elements.testTab, panel: elements.testPanel },
  ];
}

function isStudyMode(mode) {
  return mode === Mode.SEQUENTIAL || mode === Mode.RANDOM_REPEAT;
}

function setSelectedFileName(fileName) {
  elements.fileName.textContent = fileName;
  elements.fileName.title = fileName;
}

function updateStatus(message) {
  elements.status.textContent = message;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read the selected file."));
    reader.readAsText(file);
  });
}

function handleDisclaimerLinkClick(event) {
  if (!elements.disclaimerDialog.showModal) {
    return;
  }

  event.preventDefault();
  elements.disclaimerDialog.showModal();
}

function closeDisclaimer() {
  elements.disclaimerDialog.close();
}

function handleDisclaimerBackdropClick(event) {
  if (event.target === elements.disclaimerDialog) {
    closeDisclaimer();
  }
}
