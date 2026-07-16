function createInitialState() {
  return {
    cards: [],
    mode: Mode.SEQUENTIAL,
    order: [],
    cursor: 0,
    currentCardIndex: -1,
    sessionStarted: false,
    cardState: CardState.EMPTY,
    answerStatuses: [],
    navigationFilters: { correct: false, incorrect: false, noMark: false },
    progress: { viewedCount: 0, seenCards: new Set() },
    multiChoice: false,
    multiChoiceOptionOrders: [],
  };
}
const state = createInitialState();
function resetCoreState() { state.order = []; state.cursor = 0; state.currentCardIndex = -1; }
function resetProgress() { state.progress.viewedCount = 0; state.progress.seenCards.clear(); }
function resetNavigationFilters() { state.navigationFilters = { correct: false, incorrect: false, noMark: false }; }
function resetAnswerStatuses() { state.answerStatuses = state.cards.map(() => AnswerStatus.UNANSWERED); }
function resetMultiChoiceOptionOrders() { state.multiChoiceOptionOrders = state.cards.map(() => null); }
function resetSessionState() { state.sessionStarted = false; state.answerStatuses = []; state.multiChoice = false; state.multiChoiceOptionOrders = []; resetCoreState(); resetProgress(); resetNavigationFilters(); }
function setCards(cards) { state.cards = cards; resetSessionState(); }
function resetAllState(selectedMode = Mode.SEQUENTIAL) {
  state.cards = [];
  state.mode = selectedMode;
  state.cardState = CardState.EMPTY;
  resetSessionState();
}
function markCardViewed(cardIndex) {
  if (state.progress.seenCards.has(cardIndex)) return;
  state.progress.seenCards.add(cardIndex);
  state.progress.viewedCount += 1;
}
