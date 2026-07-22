---
description: 'CSV parsing and import rules for the Flashcard Trainer project.'
applyTo: 'js/csvParser.js, js/ui.js'
---

# CSV Handling Instructions

## Ownership

CSV parsing and validation belong in `js/csvParser.js`.

Do not implement CSV parsing directly in UI event handlers.

UI code may:

- read the uploaded file as text
- call `parseCardsFromCsv()`
- display success or error messages

## Supported CSV Behaviour

Preserve support for:

- `fc-question` and `fc-answer` columns
- case-insensitive header matching
- extra columns
- quoted fields
- embedded commas inside quoted fields
- escaped double quotes inside quoted fields
- blank line filtering

## Header Rules

The parser should accept headers in any form of capitalisation or lowercase such as:

```csv
fc-question,fc-answer
FC-Question,FC-Answer
FC-QUESTION,FC-ANSWER
category,fc-question,fc-answer
```

The parser must require both an `FC-Question` column and an `FC-Answer` column.

The `Category`, `MC-Question`, `MC-Answer`, and `MC-Distractor-1/2/3` columns are optional.

## Row Rules

Skip rows that do not contain both a usable `FC-Question` and `FC-Answer`.

Do not create partial flashcards.

The MC section (`MC-Answer`, `MC-Distractor-*`) is only stored on a card when both `MC-Answer` and at least one `MC-Distractor` column are non-empty. Partial MC data is silently discarded.

## Dependencies

Do not add CSV libraries or other dependencies unless the user explicitly requests them.

If a dependency is requested in future, prefer a proven CSV parser and update the README accordingly.

## Large Files

Preserve non-blocking behaviour where practical.

For large files, prefer yielding back to the browser periodically during parsing rather than performing one long blocking loop.
