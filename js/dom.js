function requiredElement(selector, root = document) {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Required DOM element not found: ${selector}`);
  return element;
}
function requiredElementList(selector, root = document) {
  const elements = root.querySelectorAll(selector);
  if (elements.length === 0) throw new Error(`Required DOM elements not found: ${selector}`);
  return elements;
}
function getElements() {
  return {
    uploadBtn: requiredElement("#uploadBtn"), csvInput: requiredElement("#csvInput"), fileName: requiredElement("#fileName"),
    sessionButtons: requiredElementList(".session-toggle-btn"), practiceSessionBtn: requiredElement("#practiceSessionBtn"), testSessionBtn: requiredElement("#testSessionBtn"),
    shuffleCardsCheckbox: requiredElement("#shuffleCardsCheckbox"), previousBtn: requiredElement("#previousBtn"), nextBtn: requiredElement("#nextBtn"), resetBtn: requiredElement("#resetBtn"),
    status: requiredElement("#status"), flashcard: requiredElement("#flashcard"), answerStatusIndicators: requiredElementList(".answer-status-indicator"),
    questionText: requiredElement("#questionText"), answerText: requiredElement("#answerText"), questionHeading: requiredElement(".flashcard-front h2"), answerHeading: requiredElement(".flashcard-back h2"),
    hideCorrectCheckbox: requiredElement("#hideCorrectCheckbox"), hideIncorrectCheckbox: requiredElement("#hideIncorrectCheckbox"), hideNoMarkCheckbox: requiredElement("#hideNoMarkCheckbox"),
    disclaimerLink: requiredElement("#disclaimerLink"), disclaimerDialog: requiredElement("#disclaimerDialog"), closeDisclaimerBtn: requiredElement("#closeDisclaimerBtn"), csvExample: requiredElement("#csvExample"),
  };
}
