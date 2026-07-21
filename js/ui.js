let elements;
let isPromptDialogOpen = false;
let isUserGuideFrameLoaded = false;
let isAiDeckPromptFlowActive = false;
let aiPromptContent = "";
let aiPromptCopiedTimeoutId = 0;
let navigationFilterCheckboxes = [];
let isMobileViewportResult = false;
const AI_PROMPT_URL = "ai-prompts/FlashcardTrainer_prompt.txt";
const MOBILE_PROMPT_MAX_WIDTH = 760;
function initializeApp() {
  elements = getElements();
  navigationFilterCheckboxes = initializeNavigationFilterCheckboxes();
  isMobileViewportResult = window.matchMedia("(max-width: 600px)").matches;
  isUserGuideFrameLoaded = Boolean(elements.userGuideFrame.contentDocument && elements.userGuideFrame.contentDocument.readyState === "complete");
  updateAiPromptViewportMode();
  wireEvents();
  state.mode = Mode.SEQUENTIAL;
  setReviewControlsEnabled(false);
  syncStudyControls();
  resetToEmptyState();
  revealRenderedText();
}
function wireEvents() {
  elements.uploadBtn.addEventListener("click", handleUploadBtnClick);
  elements.csvInput.addEventListener("change", handleFileUpload);
  elements.shuffleCardsCheckbox.addEventListener("change", handleShuffleCardsChange);
  elements.multiChoiceCheckbox.addEventListener("change", handleMultiChoiceChange);
  elements.previousBtn.addEventListener("click", showPreviousCard);
  elements.nextBtn.addEventListener("click", showNextCard);
  elements.resetBtn.addEventListener("click", handleResetBtnClick);
  elements.flashcard.addEventListener("click", toggleCardFlip);
  elements.answerStatusIndicators.forEach((indicator) => indicator.addEventListener("click", handleAnswerStatusIndicatorClick));
  navigationFilterCheckboxes.forEach((checkbox) => checkbox.addEventListener("change", handleNavigationFilterChange));
  elements.disclaimerLink.addEventListener("click", handleDisclaimerLinkClick);
  elements.closeDisclaimerBtn.addEventListener("click", closeDisclaimer);
  elements.disclaimerDialog.addEventListener("click", handleDisclaimerBackdropClick);
  elements.userGuideLink.addEventListener("click", handleUserGuideLinkClick);
  elements.closeUserGuideBtn.addEventListener("click", closeUserGuide);
  elements.userGuideDialog.addEventListener("click", handleUserGuideBackdropClick);
  elements.userGuideDialog.addEventListener("cancel", handleUserGuideCancel);
  elements.userGuideFrame.addEventListener("load", handleUserGuideFrameLoad);
  elements.csvFormatLinkBtn.addEventListener("click", handleCsvFormatLinkClick);
  elements.openAiDeckCreatorBtn.addEventListener("click", openAiDeckDialog);
  elements.closeAiDeckDialogBtn.addEventListener("click", closeAiDeckDialog);
  elements.aiDeckDialog.addEventListener("click", handleAiDeckDialogBackdropClick);
  elements.aiDeckDialog.addEventListener("cancel", closeAiDeckDialog);
  elements.openAiPromptFromDeckBtn.addEventListener("click", openAiPromptFromAiDeckDialog);
  elements.saveAiCsvBtn.addEventListener("click", handleSaveAiCsvFile);
  elements.aiPromptCopyBtn.addEventListener("click", handleAiPromptCopy);
  elements.closeAiPromptDialogBtn.addEventListener("click", closeAiPromptDialog);
  elements.aiPromptDialog.addEventListener("click", handleAiPromptDialogBackdropClick);
  elements.aiPromptDialog.addEventListener("cancel", handleAiPromptDialogCancel);
  elements.aiPromptDialog.addEventListener("close", handleAiPromptDialogClose);
  window.addEventListener("message", handleIframeMessage);
  window.addEventListener("resize", handleViewportResize);
}
async function handleUploadBtnClick() {
  if (!await confirmSessionReset()) return;
  elements.csvInput.click();
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
async function handleShuffleCardsChange() {
  if (state.cards.length > 0 && state.sessionStarted) {
    if (!await confirmSessionReset()) {
      elements.shuffleCardsCheckbox.checked = state.mode === Mode.RANDOM_NO_REPEAT;
      return;
    }
  }
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
function hasActiveMeaningfulSession() {
  return state.cards.length > 0 && state.sessionStarted && state.progress.viewedCount > 0;
}
function confirmSessionReset() {
  if (!hasActiveMeaningfulSession()) return Promise.resolve(true);
  return new Promise((resolve) => {
    function resolveOk() { cleanup(); resolve(true); }
    function resolveCancel() { cleanup(); resolve(false); }
    function handleBackdropClick(event) { if (event.target === elements.sessionResetConfirmDialog) resolveCancel(); }
    function handleNativeCancel(event) { event.preventDefault(); resolveCancel(); }
    function cleanup() {
      elements.okSessionResetBtn.removeEventListener("click", resolveOk);
      elements.cancelSessionResetBtn.removeEventListener("click", resolveCancel);
      elements.sessionResetConfirmDialog.removeEventListener("click", handleBackdropClick);
      elements.sessionResetConfirmDialog.removeEventListener("cancel", handleNativeCancel);
      if (elements.sessionResetConfirmDialog.open) elements.sessionResetConfirmDialog.close();
    }
    elements.okSessionResetBtn.addEventListener("click", resolveOk);
    elements.cancelSessionResetBtn.addEventListener("click", resolveCancel);
    elements.sessionResetConfirmDialog.addEventListener("click", handleBackdropClick);
    elements.sessionResetConfirmDialog.addEventListener("cancel", handleNativeCancel);
    elements.sessionResetConfirmDialog.showModal();
  });
}
async function handleResetBtnClick() {
  if (!await confirmSessionReset()) return;
  resetDeck();
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
    const fragment = document.createDocumentFragment();
    order.forEach((optionIndex, i) => {
      const p = document.createElement("p");
      p.textContent = `${MULTI_CHOICE_LETTERS[i]}) ${options[optionIndex]}`;
      fragment.appendChild(p);
    });
    elements.multiChoiceOptions.textContent = "";
    elements.multiChoiceOptions.appendChild(fragment);
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
  elements.resetBtn.hidden = !isActive;
  elements.emptyCardView.hidden = !isEmpty;
  elements.questionText.hidden = isEmpty;
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
  elements.answerText.textContent = "";
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
  navigationFilterCheckboxes.forEach((checkbox) => { checkbox.checked = Boolean(state.navigationFilters[checkbox.dataset.filter]); });
  const checkedCount = navigationFilterCheckboxes.filter((checkbox) => checkbox.checked).length;
  navigationFilterCheckboxes.forEach((checkbox) => {
    const lockedByFilterLimit = checkedCount >= 2 && !checkbox.checked;
    checkbox.dataset.lockedByFilterLimit = String(lockedByFilterLimit);
    checkbox.disabled = state.cards.length === 0 || lockedByFilterLimit;
  });
}
function initializeNavigationFilterCheckboxes() {
  const checkboxes = [elements.hideCorrectCheckbox, elements.hideIncorrectCheckbox, elements.hideNoMarkCheckbox];
  checkboxes.forEach((checkbox, index) => {
    checkbox.dataset.filter = ["correct", "incorrect", "noMark"][index];
  });
  return checkboxes;
}
function getNavigationFilterCheckboxes() {
  return navigationFilterCheckboxes;
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
function isMobileViewport() {
  return isMobileViewportResult;
}
function handleViewportResize() {
  isMobileViewportResult = window.matchMedia("(max-width: 600px)").matches;
  if (state.cardState === CardState.ACTIVE && state.cards.length > 0) {
    const status = formatProgressText();
    updateStatus(status.message, status.isHtml);
  }
  updateAiPromptViewportMode();
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
function handleUserGuideLinkClick(event) { event.preventDefault(); openUserGuideDialog(); }
function handleCsvFormatLinkClick() { openUserGuideDialog(); scrollUserGuideToSection("csv-format"); }
function closeUserGuide() { if (isPromptDialogOpen) return; elements.userGuideDialog.close(); }
function handleUserGuideBackdropClick(event) { if (event.target === elements.userGuideDialog) closeUserGuide(); }
function handleUserGuideCancel(event) { if (isPromptDialogOpen) event.preventDefault(); }
function handleUserGuideFrameLoad() { isUserGuideFrameLoaded = true; }
function openUserGuideDialog() { if (!elements.userGuideDialog.showModal) return; if (!elements.userGuideDialog.open) elements.userGuideDialog.showModal(); }
function scrollUserGuideToSection(sectionId) {
  const scrollMessage = { type: "flashcardScrollToSection", sectionId };
  if (isUserGuideFrameLoaded && elements.userGuideFrame.contentWindow) {
    elements.userGuideFrame.contentWindow.postMessage(scrollMessage, "*");
    return;
  }
  const scrollOnLoad = () => {
    if (elements.userGuideFrame.contentWindow) elements.userGuideFrame.contentWindow.postMessage(scrollMessage, "*");
  };
  elements.userGuideFrame.addEventListener("load", scrollOnLoad, { once: true });
}
function requestOpenPromptInUserGuide() {
  const openPromptMessage = { type: "flashcardOpenPromptDialog" };
  if (isUserGuideFrameLoaded && elements.userGuideFrame.contentWindow) {
    elements.userGuideFrame.contentWindow.postMessage(openPromptMessage, "*");
    return;
  }
  const openPromptOnLoad = () => {
    if (elements.userGuideFrame.contentWindow) elements.userGuideFrame.contentWindow.postMessage(openPromptMessage, "*");
  };
  elements.userGuideFrame.addEventListener("load", openPromptOnLoad, { once: true });
}
function openAiDeckDialog() {
  if (!elements.aiDeckDialog.showModal) return;
  setAiCsvSaveStatus("");
  if (!elements.aiDeckDialog.open) elements.aiDeckDialog.showModal();
}
function closeAiDeckDialog() { if (elements.aiDeckDialog.open) elements.aiDeckDialog.close(); }
function handleAiDeckDialogBackdropClick(event) { if (event.target === elements.aiDeckDialog) closeAiDeckDialog(); }
function openAiPromptFromAiDeckDialog() {
  isAiDeckPromptFlowActive = true;
  closeAiDeckDialog();
  openAiPromptDialog();
}
function updateAiPromptViewportMode() {
  document.body.dataset.appViewport = window.matchMedia(`(max-width: ${MOBILE_PROMPT_MAX_WIDTH}px)`).matches ? "mobile" : "desktop";
}
async function ensureAiPromptLoaded() {
  if (aiPromptContent) {
    elements.aiPromptText.textContent = aiPromptContent;
    return aiPromptContent;
  }
  elements.aiPromptText.textContent = "Loading...";
  const response = await fetch(AI_PROMPT_URL);
  if (!response.ok) {
    throw new Error("Failed to load AI prompt file.");
  }
  aiPromptContent = (await response.text()).trim();
  elements.aiPromptText.textContent = aiPromptContent;
  return aiPromptContent;
}
function clearAiPromptCopiedState() {
  if (aiPromptCopiedTimeoutId) {
    window.clearTimeout(aiPromptCopiedTimeoutId);
    aiPromptCopiedTimeoutId = 0;
  }
  elements.aiPromptCopyBtn.dataset.copied = "false";
  elements.aiPromptCopyBtn.setAttribute("aria-label", "Copy AI prompt");
  elements.aiPromptCopyBtn.querySelector(".prompt-copy-label").textContent = "Copy";
  elements.aiPromptCopyStatus.textContent = "";
}
function showAiPromptCopiedState() {
  clearAiPromptCopiedState();
  elements.aiPromptCopyBtn.dataset.copied = "true";
  elements.aiPromptCopyBtn.setAttribute("aria-label", "AI prompt copied");
  elements.aiPromptCopyBtn.querySelector(".prompt-copy-label").textContent = "Copied";
  elements.aiPromptCopyStatus.textContent = "AI prompt copied to clipboard.";
  aiPromptCopiedTimeoutId = window.setTimeout(clearAiPromptCopiedState, 2000);
}
async function openAiPromptDialog() {
  updateAiPromptViewportMode();
  if (!elements.aiPromptDialog.open) elements.aiPromptDialog.showModal();
  try {
    await ensureAiPromptLoaded();
  } catch (error) {
    elements.aiPromptText.textContent = "Unable to load the AI prompt file. Serve the site through Live Server or another static server and try again.";
  }
}
function closeAiPromptDialog() {
  clearAiPromptCopiedState();
  if (elements.aiPromptDialog.open) elements.aiPromptDialog.close();
}
function handleAiPromptDialogBackdropClick(event) {
  if (event.target === elements.aiPromptDialog) closeAiPromptDialog();
}
function handleAiPromptDialogCancel() {
  closeAiPromptDialog();
}
function handleAiPromptDialogClose() {
  if (!isAiDeckPromptFlowActive) return;
  isAiDeckPromptFlowActive = false;
  openAiDeckDialog();
}
async function handleAiPromptCopy() {
  elements.aiPromptCopyBtn.disabled = true;
  try {
    const promptText = await ensureAiPromptLoaded();
    await navigator.clipboard.writeText(promptText);
    showAiPromptCopiedState();
  } catch (error) {
    elements.aiPromptCopyStatus.textContent = "Unable to copy the AI prompt.";
  } finally {
    elements.aiPromptCopyBtn.disabled = false;
  }
}
function sanitizeCsvFileName(fileName) {
  const normalizedFileName = fileName.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "-");
  if (!normalizedFileName) return "";
  return normalizedFileName.toLowerCase().endsWith(".csv") ? normalizedFileName : `${normalizedFileName}.csv`;
}
function setAiCsvSaveStatus(message, isError = false) {
  elements.aiCsvSaveStatus.textContent = message;
  elements.aiCsvSaveStatus.classList.toggle("is-error", isError);
}
function handleSaveAiCsvFile() {
  const csvContent = elements.aiCsvContentInput.value.trim();
  const csvFileName = sanitizeCsvFileName(elements.aiCsvFileNameInput.value);
  if (!csvFileName) {
    setAiCsvSaveStatus("Enter a file name before saving.", true);
    return;
  }
  if (!csvContent) {
    setAiCsvSaveStatus("Paste AI-generated CSV output before saving.", true);
    return;
  }
  const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const objectUrl = URL.createObjectURL(csvBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = objectUrl;
  downloadLink.download = csvFileName;
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(objectUrl);
  setAiCsvSaveStatus(`Saved ${csvFileName}.`);
}
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
}
