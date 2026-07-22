const PARSE_YIELD_INTERVAL = 20000;

async function parseCardsFromCsv(csvText) {
  const rows = await parseCsvRows(csvText);
  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell.trim().length > 0));

  if (nonEmptyRows.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const header = nonEmptyRows[0].map(normalizeHeaderCell);
  const fcQuestionIndex = header.indexOf("fc-question");
  const fcAnswerIndex = header.indexOf("fc-answer");
  const categoryIndex = header.indexOf("category");
  const mcQuestionIndex = header.indexOf("mc-question");
  const mcAnswerIndex = header.indexOf("mc-answer");
  const mcDistractorIndices = ["mc-distractor-1", "mc-distractor-2", "mc-distractor-3"]
    .map((col) => header.indexOf(col))
    .filter((i) => i !== -1);

  if (fcQuestionIndex === -1 || fcAnswerIndex === -1) {
    throw new Error("CSV header must include both 'FC-Question' and 'FC-Answer' columns.");
  }

  const cards = [];

  for (const row of nonEmptyRows.slice(1)) {
    const fcQuestion = (row[fcQuestionIndex] || "").trim();
    const fcAnswer = (row[fcAnswerIndex] || "").trim();
    const category = categoryIndex === -1 ? "" : (row[categoryIndex] || "").trim();
    const mcQuestion = mcQuestionIndex === -1 ? "" : (row[mcQuestionIndex] || "").trim();
    const mcAnswer = mcAnswerIndex === -1 ? "" : (row[mcAnswerIndex] || "").trim();
    const mcDistractors = mcDistractorIndices.map((i) => (row[i] || "").trim()).filter(Boolean);

    if (fcQuestion && fcAnswer) {
      const card = { fcQuestion, fcAnswer };
      if (category) card.category = category;
      if (mcAnswer && mcDistractors.length > 0) {
        if (mcQuestion) card.mcQuestion = mcQuestion;
        card.mcAnswer = mcAnswer;
        card.mcDistractors = mcDistractors;
      }
      cards.push(card);
    }
  }

  return cards;
}

function normalizeHeaderCell(value) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase();
}

async function parseCsvRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    if (i > 0 && i % PARSE_YIELD_INTERVAL === 0) {
      await yieldToBrowser();
    }

    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (inQuotes) {
    throw new Error("CSV contains an unterminated quoted field.");
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function yieldToBrowser() {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}
