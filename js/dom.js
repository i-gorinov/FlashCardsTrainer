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
    shuffleCardsCheckbox: requiredElement("#shuffleCardsCheckbox"), multiChoiceCheckbox: requiredElement("#multiChoiceCheckbox"), multiChoiceOption: requiredElement("#multiChoiceOption"), multiChoiceOptions: requiredElement("#multiChoiceOptions"), previousBtn: requiredElement("#previousBtn"), nextBtn: requiredElement("#nextBtn"), resetBtn: requiredElement("#resetBtn"),
    status: requiredElement("#status"), flashcard: requiredElement("#flashcard"), answerStatusIndicators: requiredElementList(".answer-status-indicator"), emptyCardView: requiredElement("#emptyCardView"),
    questionText: requiredElement("#questionText"), answerText: requiredElement("#answerText"), questionCategory: requiredElement("#questionCategory"), questionHeading: requiredElement(".flashcard-front h2"), answerHeading: requiredElement(".flashcard-back h2"),
    hideCorrectCheckbox: requiredElement("#hideCorrectCheckbox"), hideIncorrectCheckbox: requiredElement("#hideIncorrectCheckbox"), hideNoMarkCheckbox: requiredElement("#hideNoMarkCheckbox"),
    disclaimerLink: requiredElement("#disclaimerLink"), disclaimerDialog: requiredElement("#disclaimerDialog"), closeDisclaimerBtn: requiredElement("#closeDisclaimerBtn"), userGuideLink: requiredElement("#userGuideLink"), userGuideDialog: requiredElement("#userGuideDialog"), closeUserGuideBtn: requiredElement("#closeUserGuideBtn"), userGuideFrame: requiredElement("#userGuideDialog iframe"), csvFormatLinkBtn: requiredElement("#csvFormatLinkBtn"),
    openAiDeckCreatorBtn: requiredElement("#openAiDeckCreatorBtn"), aiDeckDialog: requiredElement("#aiDeckDialog"), closeAiDeckDialogBtn: requiredElement("#closeAiDeckDialogBtn"), openAiPromptFromDeckBtn: requiredElement("#openAiPromptFromDeckBtn"), aiCsvFileNameInput: requiredElement("#aiCsvFileNameInput"), aiCsvContentInput: requiredElement("#aiCsvContentInput"), saveAiCsvBtn: requiredElement("#saveAiCsvBtn"), aiCsvSaveStatus: requiredElement("#aiCsvSaveStatus"),
    aiPromptDialog: requiredElement("#aiPromptDialog"), aiPromptText: requiredElement("#aiPromptText"), aiPromptCopyBtn: requiredElement("#aiPromptCopyBtn"), closeAiPromptDialogBtn: requiredElement("#closeAiPromptDialogBtn"), aiPromptCopyStatus: requiredElement("#aiPromptCopyStatus"),
  };
}
