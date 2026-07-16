const Mode = Object.freeze({
  SEQUENTIAL: "sequential",
  RANDOM_NO_REPEAT: "randomNoRepeat",
});
const CardState = Object.freeze({
  EMPTY: "empty",
  READY: "ready",
  ACTIVE: "active",
});
const EMPTY_STATE_MOTTO = "Learn. Practice. Remember.";
const AnswerStatus = Object.freeze({
  UNANSWERED: "unanswered",
  CORRECT: "correct",
  INCORRECT: "incorrect",
});
const ANSWER_STATUS_CLASSES = Object.freeze(["is-unanswered", "is-correct", "is-incorrect"]);
const ANSWER_STATUS_META = Object.freeze({
  [AnswerStatus.UNANSWERED]: { label: "unanswered", symbol: "○" },
  [AnswerStatus.CORRECT]: { label: "correct", symbol: "✓" },
  [AnswerStatus.INCORRECT]: { label: "incorrect", symbol: "✗" },
});
const EMPTY_CARD_TEXT = "Upload a CSV file to begin.";
const EMPTY_CSV_EXAMPLE = `CSV content example:
Question,Answer
What is HTML?,A markup language for web pages
What is CSS?,A stylesheet language
What is JavaScript?,A programming language`;
const MULTI_CHOICE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
