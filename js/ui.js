let elements;
function initializeApp() {
  elements = getElements();
  wireEvents();
  state.sessionType = SessionType.PRACTICE;
  state.mode = Mode.SEQUENTIAL;
  setSessionControlsEnabled(false);
  syncSessionControls();
  resetToEmptyState();
  revealRenderedText();
}
function wireEvents() {
  elements.uploadBtn.addEventListener("click", () => elements.csvInput.click());
  elements.csvInput.addEventListener("change", handleFileUpload);
  elements.sessionButtons.forEach((button) => button.addEventListener("click", handleSessionTypeChange));
  elements.shuffleCardsCheckbox.addEventListener("change", handleShuffleCardsChange);
  elements.previousBtn.addEventListener("click", showPreviousCard);
  elements.nextBtn.addEventListener("click", showNextCard);
  elements.resetBtn.addEventListener("click", resetDeck);
  elements.flashcard.addEventListener("click", toggleCardFlip);
  elements.answerStatusIndicators.forEach((indicator) => indicator.addEventListener("click", handleAnswerStatusIndicatorClick));
  getNavigationFilterCheckboxes().forEach((checkbox) => checkbox.addEventListener("change", handleNavigationFilterChange));
  elements.disclaimerLink.addEventListener("click", handleDisclaimerLinkClick);
  elements.closeDisclaimerBtn.addEventListener("click", closeDisclaimer);
  elements.disclaimerDialog.addEventListener("click", handleDisclaimerBackdropClick);
}
async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) { setSelectedFileName("No file chosen"); return; }
  setSelectedFileName(file.name);
  try {
    updateStatus("Loading CSV...");
    const text = await readFileAsText(file);
    const parsedCards = await parseCardsFromCsv(text);
    if (parsedCards.length === 0) throw new Error("The CSV file does not contain any usable cards.");
    setCards(parsedCards);
    applyDefaultShuffleForSession();
    updateModeFromShuffleControl();
    syncNavigationFilterControls();
    setSessionControlsEnabled(true);
    syncSessionControls();
    resetDeck();
  } catch (error) {
    resetToEmptyState();
    updateStatus(error.message || "Could not read the selected file.");
  }
}
function handleSessionTypeChange(event) {
  const selectedSessionType = event.currentTarget.dataset.sessionType;
  if (!selectedSessionType || selectedSessionType === state.sessionType) return;
  state.sessionType = selectedSessionType;
  applyDefaultShuffleForSession();
  updateModeFromShuffleControl();
  syncSessionControls();
  syncAnswerStatusIndicator();
  if (state.cards.length > 0) resetDeck();
}
function handleShuffleCardsChange() {
  updateModeFromShuffleControl();
  if (state.cards.length > 0 && state.sessionStarted) resetDeck();
}
function applyDefaultShuffleForSession() { elements.shuffleCardsCheckbox.checked = state.sessionType === SessionType.TEST; }
function updateModeFromShuffleControl() { state.mode = elements.shuffleCardsCheckbox.checked ? Mode.RANDOM_NO_REPEAT : Mode.SEQUENTIAL; }
function syncSessionControls() {
  elements.sessionButtons.forEach((button) => {
    const active = button.dataset.sessionType === state.sessionType;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  syncNavigationFilterControls();
}
function resetDeck() {
  if (state.cards.length === 0) return;
  state.sessionStarted = true;
  resetAnswerStatuses();
  resetProgress();
  resetCoreState();
  state.order = createOrder(state.cards.length, state.mode);
  state.currentCardIndex = state.order[0];
  renderCurrentCard();
  setControlsEnabled(true);
}
function showNextCard() {
  if (state.cards.length === 0) return;
  if (state.sessionType === SessionType.TEST) { moveToVisibleCard(1); return; }
  if (state.cursor >= state.order.length - 1) {
    updateStatus(`End of deck. You have viewed ${state.progress.viewedCount} of ${state.cards.length} cards. Press Reset.`);
    updateNavigationControls(true); return;
  }
  state.cursor += 1;
  state.currentCardIndex = state.order[state.cursor];
  renderCurrentCard();
}
function showPreviousCard() {
  if (state.cards.length === 0) return;
  if (state.sessionType === SessionType.TEST) { moveToVisibleCard(-1); return; }
  if (state.cursor <= 0) { updateNavigationControls(true); return; }
  state.cursor -= 1;
  state.currentCardIndex = state.order[state.cursor];
  renderCurrentCard();
}
function moveToVisibleCard(direction) {
  const nextCursor = getVisibleCardCursor(state.cursor, direction);
  if (nextCursor === -1) { updateNavigationControls(true); return; }
  state.cursor = nextCursor;
  state.currentCardIndex = state.order[nextCursor];
  renderCurrentCard();
}
function renderCurrentCard() {
  const card = state.cards[state.currentCardIndex];
  if (!card) return;
  markCardViewed(state.currentCardIndex);
  elements.questionText.textContent = card.question;
  elements.answerText.textContent = card.answer;
  elements.flashcard.classList.remove("is-flipped", "is-disabled");
  elements.flashcard.setAttribute("aria-disabled", "false");
  setCardState(CardState.ACTIVE);
  syncAnswerStatusIndicator();
  updateStatus(formatProgressText());
  updateNavigationControls(true);
}
function formatProgressText() {
  const total = state.cards.length;
  const currentPosition = total > 0 ? state.cursor + 1 : 0;
  if (state.sessionType === SessionType.TEST) {
    const { correct, incorrect } = computeTestTotals();
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    return `Question ${currentPosition}/${total} | Correct: ${correct} | Incorrect: ${incorrect} | Score: ${score}%`;
  }
  return `Card ${currentPosition}/${total} | Viewed: ${state.progress.viewedCount}`;
}
function computeTestTotals() {
  return state.answerStatuses.reduce((totals, status) => ({
    correct: totals.correct + (status === AnswerStatus.CORRECT ? 1 : 0),
    incorrect: totals.incorrect + (status === AnswerStatus.INCORRECT ? 1 : 0),
  }), { correct: 0, incorrect: 0 });
}
function syncAnswerStatusIndicator() {
  const shouldShowIndicator = state.sessionType === SessionType.TEST && state.currentCardIndex >= 0 && Boolean(state.cards[state.currentCardIndex]);
  elements.answerStatusIndicators.forEach((indicator) => {
    indicator.hidden = !shouldShowIndicator;
    resetAnswerStatusClasses(indicator);
    if (!shouldShowIndicator) return;
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
function resetAnswerStatusClasses(indicator) { indicator.classList.remove(...ANSWER_STATUS_CLASSES, "is-animating", "is-readonly"); }
function animateAnswerStatusIndicator() {
  elements.answerStatusIndicators.forEach((indicator) => { indicator.classList.remove("is-animating"); void indicator.offsetWidth; indicator.classList.add("is-animating"); });
}
function handleAnswerStatusIndicatorClick(event) {
  event.preventDefault(); event.stopPropagation();
  const indicator = event.currentTarget;
  if (indicator.dataset.side !== "back" || state.cards.length === 0 || state.sessionType !== SessionType.TEST || state.currentCardIndex < 0) return;
  const currentStatus = state.answerStatuses[state.currentCardIndex] || AnswerStatus.UNANSWERED;
  state.answerStatuses[state.currentCardIndex] = getNextAnswerStatus(currentStatus);
  syncAnswerStatusIndicator();
  animateAnswerStatusIndicator();
  updateNavigationControls(true);
  updateStatus(formatProgressText());
}
function getNextAnswerStatus(status) { return status === AnswerStatus.UNANSWERED ? AnswerStatus.CORRECT : status === AnswerStatus.CORRECT ? AnswerStatus.INCORRECT : AnswerStatus.UNANSWERED; }
function toggleCardFlip() {
  if (state.cards.length === 0 || elements.flashcard.getAttribute("aria-disabled") === "true") return;
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
  const isEmpty = cardState === CardState.EMPTY;
  elements.questionHeading.hidden = !isActive;
  elements.answerHeading.hidden = !isActive;
  elements.resetBtn.hidden = !isActive;
  elements.csvExample.hidden = !isEmpty;
}
function resetToEmptyState() {
  resetAllState(SessionType.PRACTICE, Mode.SEQUENTIAL);
  elements.practiceSessionBtn.setAttribute("aria-pressed", "true");
  elements.testSessionBtn.setAttribute("aria-pressed", "false");
  elements.shuffleCardsCheckbox.checked = false;
  setSessionControlsEnabled(false);
  syncSessionControls();
  elements.questionText.textContent = EMPTY_CARD_TEXT;
  elements.answerText.textContent = EMPTY_CARD_TEXT;
  elements.csvExample.textContent = EMPTY_CSV_EXAMPLE;
  elements.flashcard.classList.remove("is-flipped");
  setControlsEnabled(false);
  setCardState(CardState.EMPTY);
  syncAnswerStatusIndicator();
  updateStatus(EMPTY_STATE_MOTTO);
}
function handleNavigationFilterChange() {
  state.navigationFilters = {
    correct: elements.hideCorrectCheckbox.checked,
    incorrect: elements.hideIncorrectCheckbox.checked,
    noMark: elements.hideNoMarkCheckbox.checked,
  };
  syncNavigationFilterControls();
  if (state.sessionType === SessionType.TEST && state.sessionStarted && state.currentCardIndex >= 0) updateNavigationControls(true);
}
function syncNavigationFilterControls() {
  const filterCheckboxes = getNavigationFilterCheckboxes();
  filterCheckboxes.forEach((checkbox) => { checkbox.checked = Boolean(state.navigationFilters[checkbox.dataset.filter]); });
  const checkedCount = filterCheckboxes.filter((checkbox) => checkbox.checked).length;
  filterCheckboxes.forEach((checkbox) => {
    const lockedByFilterLimit = checkedCount >= 2 && !checkbox.checked;
    checkbox.dataset.lockedByFilterLimit = String(lockedByFilterLimit);
    checkbox.disabled = state.cards.length === 0 || state.sessionType !== SessionType.TEST || lockedByFilterLimit;
  });
}
function getNavigationFilterCheckboxes() {
  return [elements.hideCorrectCheckbox, elements.hideIncorrectCheckbox, elements.hideNoMarkCheckbox].map((checkbox, index) => {
    checkbox.dataset.filter = ["correct", "incorrect", "noMark"][index];
    return checkbox;
  });
}
function setSessionControlsEnabled(enabled) {
  elements.sessionButtons.forEach((button) => { button.disabled = !enabled; button.setAttribute("aria-disabled", String(!enabled)); });
  elements.shuffleCardsCheckbox.disabled = !enabled;
  syncNavigationFilterControls();
}
function setSelectedFileName(fileName) { elements.fileName.textContent = fileName; elements.fileName.title = fileName; }
function updateStatus(message) { elements.status.textContent = message; }
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read the selected file."));
    reader.readAsText(file);
  });
}
function handleDisclaimerLinkClick(event) { if (!elements.disclaimerDialog.showModal) return; event.preventDefault(); elements.disclaimerDialog.showModal(); }
function closeDisclaimer() { elements.disclaimerDialog.close(); }
function handleDisclaimerBackdropClick(event) { if (event.target === elements.disclaimerDialog) closeDisclaimer(); }
function revealRenderedText() {
  elements.status.classList.remove("is-pending-render");
  elements.questionText.classList.remove("is-pending-render");
  elements.answerText.classList.remove("is-pending-render");
  elements.csvExample.classList.remove("is-pending-render");
}
