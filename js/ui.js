let elements;
let isPromptDialogOpen = false;
function initializeApp() {
  elements = getElements();
  wireEvents();
  state.mode = Mode.SEQUENTIAL;
  setReviewControlsEnabled(false);
  syncStudyControls();
  resetToEmptyState();
  revealRenderedText();
}
function wireEvents() {
  elements.uploadBtn.addEventListener("click", () => elements.csvInput.click());
  elements.csvInput.addEventListener("change", handleFileUpload);
  elements.shuffleCardsCheckbox.addEventListener("change", handleShuffleCardsChange);
  elements.multiChoiceCheckbox.addEventListener("change", handleMultiChoiceChange);
  elements.previousBtn.addEventListener("click", showPreviousCard);
  elements.nextBtn.addEventListener("click", showNextCard);
  elements.resetBtn.addEventListener("click", resetDeck);
  elements.flashcard.addEventListener("click", toggleCardFlip);
  elements.answerStatusIndicators.forEach((indicator) => indicator.addEventListener("click", handleAnswerStatusIndicatorClick));
  getNavigationFilterCheckboxes().forEach((checkbox) => checkbox.addEventListener("change", handleNavigationFilterChange));
  elements.disclaimerLink.addEventListener("click", handleDisclaimerLinkClick);
  elements.closeDisclaimerBtn.addEventListener("click", closeDisclaimer);
  elements.disclaimerDialog.addEventListener("click", handleDisclaimerBackdropClick);
  elements.userGuideLink.addEventListener("click", handleUserGuideLinkClick);
  elements.closeUserGuideBtn.addEventListener("click", closeUserGuide);
  elements.userGuideDialog.addEventListener("click", handleUserGuideBackdropClick);
  elements.userGuideDialog.addEventListener("cancel", handleUserGuideCancel);
  window.addEventListener("message", handleIframeMessage);
  window.addEventListener("resize", handleViewportResize);
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
    applyDefaultStudyOptions();
    updateModeFromShuffleControl();
    setReviewControlsEnabled(true);
    syncStudyControls();
    resetDeck();
  } catch (error) {
    resetToEmptyState();
    updateStatus(error.message || "Could not read the selected file.");
  }
}
function handleShuffleCardsChange() {
  updateModeFromShuffleControl();
  if (state.cards.length > 0 && state.sessionStarted) resetDeck();
}
function applyDefaultStudyOptions() {
  elements.shuffleCardsCheckbox.checked = true;
  state.multiChoice = false;
  elements.multiChoiceCheckbox.checked = false;
}
function syncMultiChoiceOptionVisibility() {
  const hasDistractors = state.cards.some((card) => card.distractors && card.distractors.length > 0);
  elements.multiChoiceOption.hidden = !hasDistractors;
}
function handleMultiChoiceChange() {
  state.multiChoice = elements.multiChoiceCheckbox.checked;
  if (state.cards.length > 0 && state.sessionStarted) renderCurrentCard();
}
function updateModeFromShuffleControl() { state.mode = elements.shuffleCardsCheckbox.checked ? Mode.RANDOM_NO_REPEAT : Mode.SEQUENTIAL; }
function syncStudyControls() {
  syncMultiChoiceOptionVisibility();
  syncNavigationFilterControls();
}
function resetDeck() {
  if (state.cards.length === 0) return;
  state.sessionStarted = true;
  resetAnswerStatuses();
  resetMultiChoiceOptionOrders();
  resetProgress();
  resetCoreState();
  state.order = createOrder(state.cards.length, state.mode);
  state.currentCardIndex = state.order[0];
  renderCurrentCard();
  setControlsEnabled(true);
}
function showNextCard() {
  if (state.cards.length === 0) return;
  moveToVisibleCard(1);
}
function showPreviousCard() {
  if (state.cards.length === 0) return;
  moveToVisibleCard(-1);
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
  const category = (card.category || "").trim();
  elements.questionCategory.textContent = category;
  elements.questionCategory.hidden = !category;
  elements.questionText.textContent = card.question;
  const multiChoiceActive = state.multiChoice && card.distractors && card.distractors.length > 0;
  if (multiChoiceActive) {
    if (!state.multiChoiceOptionOrders[state.currentCardIndex]) {
      state.multiChoiceOptionOrders[state.currentCardIndex] = shuffle(
        Array.from({ length: 1 + card.distractors.length }, (_, i) => i)
      );
    }
    const order = state.multiChoiceOptionOrders[state.currentCardIndex];
    const options = [card.answer, ...card.distractors];
    elements.multiChoiceOptions.textContent = "";
    order.forEach((optionIndex, i) => {
      const p = document.createElement("p");
      p.textContent = `${MULTI_CHOICE_LETTERS[i]}) ${options[optionIndex]}`;
      elements.multiChoiceOptions.appendChild(p);
    });
    elements.multiChoiceOptions.hidden = false;
    const correctPosition = order.indexOf(0);
    elements.answerText.textContent = `${MULTI_CHOICE_LETTERS[correctPosition]}) ${card.answer}`;
  } else {
    elements.multiChoiceOptions.hidden = true;
    elements.answerText.textContent = card.answer;
  }
  elements.flashcard.classList.remove("is-flipped", "is-disabled");
  elements.flashcard.setAttribute("aria-disabled", "false");
  setCardState(CardState.ACTIVE);
  syncAnswerStatusIndicator();
  const progressStatus = formatProgressText();
  updateStatus(progressStatus.message, progressStatus.isHtml);
  updateNavigationControls(true);
}
function formatProgressText() {
  const total = state.cards.length;
  const currentPosition = total > 0 ? state.cursor + 1 : 0;
  const { correct, incorrect } = computeTestTotals();
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  if (isMobileViewport()) {
    return {
      message: `${currentPosition}/${total} | <span class="status-icon status-icon-correct" aria-hidden="true">✓</span>${correct} | <span class="status-icon status-icon-incorrect" aria-hidden="true">✗</span>${incorrect} | <span class="status-icon status-icon-score" aria-hidden="true">★</span>${score}%`,
      isHtml: true,
    };
  }
  return {
    message: `Question ${currentPosition}/${total} | Correct: ${correct} | Incorrect: ${incorrect} | Score: ${score}%`,
    isHtml: false,
  };
}
function computeTestTotals() {
  return state.answerStatuses.reduce((totals, status) => ({
    correct: totals.correct + (status === AnswerStatus.CORRECT ? 1 : 0),
    incorrect: totals.incorrect + (status === AnswerStatus.INCORRECT ? 1 : 0),
  }), { correct: 0, incorrect: 0 });
}
function syncAnswerStatusIndicator() {
  const shouldShowIndicator = state.currentCardIndex >= 0 && Boolean(state.cards[state.currentCardIndex]);
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
  if (indicator.dataset.side !== "back" || state.cards.length === 0 || state.currentCardIndex < 0) return;
  const currentStatus = state.answerStatuses[state.currentCardIndex] || AnswerStatus.UNANSWERED;
  state.answerStatuses[state.currentCardIndex] = getNextAnswerStatus(currentStatus);
  syncAnswerStatusIndicator();
  animateAnswerStatusIndicator();
  updateNavigationControls(true);
  const progressStatus = formatProgressText();
  updateStatus(progressStatus.message, progressStatus.isHtml);
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
  resetAllState(Mode.SEQUENTIAL);
  elements.shuffleCardsCheckbox.checked = false;
  elements.multiChoiceCheckbox.checked = false;
  elements.multiChoiceOption.hidden = true;
  elements.multiChoiceOptions.hidden = true;
  setReviewControlsEnabled(false);
  syncStudyControls();
  elements.questionCategory.textContent = "";
  elements.questionCategory.hidden = true;
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
  if (state.sessionStarted && state.currentCardIndex >= 0) updateNavigationControls(true);
}
function syncNavigationFilterControls() {
  const filterCheckboxes = getNavigationFilterCheckboxes();
  filterCheckboxes.forEach((checkbox) => { checkbox.checked = Boolean(state.navigationFilters[checkbox.dataset.filter]); });
  const checkedCount = filterCheckboxes.filter((checkbox) => checkbox.checked).length;
  filterCheckboxes.forEach((checkbox) => {
    const lockedByFilterLimit = checkedCount >= 2 && !checkbox.checked;
    checkbox.dataset.lockedByFilterLimit = String(lockedByFilterLimit);
    checkbox.disabled = state.cards.length === 0 || lockedByFilterLimit;
  });
}
function getNavigationFilterCheckboxes() {
  return [elements.hideCorrectCheckbox, elements.hideIncorrectCheckbox, elements.hideNoMarkCheckbox].map((checkbox, index) => {
    checkbox.dataset.filter = ["correct", "incorrect", "noMark"][index];
    return checkbox;
  });
}
function setReviewControlsEnabled(enabled) {
  elements.shuffleCardsCheckbox.disabled = !enabled;
  elements.multiChoiceCheckbox.disabled = !enabled;
  syncNavigationFilterControls();
}
function setSelectedFileName(fileName) { elements.fileName.textContent = fileName; elements.fileName.title = fileName; }
function updateStatus(message, isHtml = false) {
  if (isHtml) {
    elements.status.innerHTML = message;
    return;
  }
  elements.status.textContent = message;
}
function isMobileViewport() { return window.matchMedia("(max-width: 600px)").matches; }
function handleViewportResize() {
  if (state.cardState === CardState.ACTIVE && state.cards.length > 0) {
    const status = formatProgressText();
    updateStatus(status.message, status.isHtml);
  }
}
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
function handleUserGuideLinkClick(event) { if (!elements.userGuideDialog.showModal) return; event.preventDefault(); elements.userGuideDialog.showModal(); }
function closeUserGuide() { if (isPromptDialogOpen) return; elements.userGuideDialog.close(); }
function handleUserGuideBackdropClick(event) { if (event.target === elements.userGuideDialog) closeUserGuide(); }
function handleUserGuideCancel(event) { if (isPromptDialogOpen) event.preventDefault(); }
function handleIframeMessage(event) {
  if (event.source !== elements.userGuideFrame.contentWindow) return;
  if (event.data?.type === "flashcardPromptDialogOpened") {
    isPromptDialogOpen = true;
    elements.closeUserGuideBtn.disabled = true;
    elements.closeUserGuideBtn.setAttribute("aria-label", "Close user guide (close the AI Prompt first)");
    elements.closeUserGuideBtn.setAttribute("title", "Close the AI Prompt first");
  } else if (event.data?.type === "flashcardPromptDialogClosed") {
    isPromptDialogOpen = false;
    elements.closeUserGuideBtn.disabled = false;
    elements.closeUserGuideBtn.setAttribute("aria-label", "Close user guide");
    elements.closeUserGuideBtn.removeAttribute("title");
  }
}
function revealRenderedText() {
  elements.status.classList.remove("is-pending-render");
  elements.questionText.classList.remove("is-pending-render");
  elements.answerText.classList.remove("is-pending-render");
  elements.csvExample.classList.remove("is-pending-render");
}
