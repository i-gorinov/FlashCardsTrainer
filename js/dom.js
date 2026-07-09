function requiredElement(selector, root = document) {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error(`Required DOM element not found: ${selector}`);
  }

  return element;
}

function requiredElementList(selector, root = document) {
  const elements = root.querySelectorAll(selector);

  if (elements.length === 0) {
    throw new Error(`Required DOM elements not found: ${selector}`);
  }

  return elements;
}

function getElements() {
  return {
    uploadBtn: requiredElement("#uploadBtn"),
    csvInput: requiredElement("#csvInput"),
    fileName: requiredElement("#fileName"),
    setupTab: requiredElement("#setupTab"),
    studyTab: requiredElement("#studyTab"),
    testTab: requiredElement("#testTab"),
    setupPanel: requiredElement("#setupPanel"),
    studyPanel: requiredElement("#studyPanel"),
    testPanel: requiredElement("#testPanel"),
    modeRadios: requiredElementList("input[name='modeChoice']"),
    previousBtn: requiredElement("#previousBtn"),
    nextBtn: requiredElement("#nextBtn"),
    resetBtn: requiredElement("#resetBtn"),
    status: requiredElement("#status"),
    flashcard: requiredElement("#flashcard"),
    answerStatusIndicators: requiredElementList(".answer-status-indicator"),
    questionText: requiredElement("#questionText"),
    answerText: requiredElement("#answerText"),
    questionHeading: requiredElement(".flashcard-front h2"),
    answerHeading: requiredElement(".flashcard-back h2"),
    hideCorrectCheckbox: requiredElement("#hideCorrectCheckbox"),
    hideIncorrectCheckbox: requiredElement("#hideIncorrectCheckbox"),
    hideNoMarkCheckbox: requiredElement("#hideNoMarkCheckbox"),
    disclaimerLink: requiredElement("#disclaimerLink"),
    disclaimerDialog: requiredElement("#disclaimerDialog"),
    closeDisclaimerBtn: requiredElement("#closeDisclaimerBtn"),
  };
}
