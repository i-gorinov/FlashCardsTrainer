function createOrder(length, mode) {
  const indexes = Array.from({ length }, (_, index) => index);
  return mode === Mode.RANDOM_NO_REPEAT ? shuffle(indexes) : indexes;
}
function getVisibleCardCursor(startCursor, direction) {
  const step = direction > 0 ? 1 : -1;
  let cursor = startCursor + step;
  while (cursor >= 0 && cursor < state.order.length) {
    if (isCardVisibleInNavigation(state.order[cursor])) return cursor;
    cursor += step;
  }
  return -1;
}
function getNavigationState(enabled) {
  if (!enabled || state.cards.length === 0) return { canGoPrevious: false, canGoNext: false };
  return { canGoPrevious: getVisibleCardCursor(state.cursor, -1) !== -1, canGoNext: getVisibleCardCursor(state.cursor, 1) !== -1 };
}
function isCardVisibleInNavigation(cardIndex) {
  const cardStatus = state.answerStatuses[cardIndex] || AnswerStatus.UNANSWERED;
  if (cardStatus === AnswerStatus.CORRECT) return !state.navigationFilters.correct;
  if (cardStatus === AnswerStatus.INCORRECT) return !state.navigationFilters.incorrect;
  return !state.navigationFilters.noMark;
}
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }
  return result;
}
