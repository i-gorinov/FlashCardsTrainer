# Flashcard Trainer

Flashcard Trainer is a lightweight, browser-based study app for reviewing question-and-answer pairs from a CSV file. It runs entirely client-side, requires no build step, and uses plain HTML, CSS, and JavaScript.

## Features

- Upload flashcards from a CSV file
- Flip cards by clicking them
- Navigate between cards with Previous and Next controls
- Track progress during a session
- Work as a static website with no backend or external dependencies
- Keep button visual states consistent across desktop hover and touch press interactions
- Study in two modes:
  - Sequential
  - Random (with repetition)
- Test your knowledge in Random (no repetition) mode
  - Mark answers as Correct, Incorrect, or Unanswered in Test mode
  - Filter test navigation by answer status using the Hide category controls


## Getting started

1. Download or clone this repository.
2. Open index.html in a modern web browser, or serve the folder with any simple static server.
3. Upload a CSV file containing your flashcards using Upload CSV.
4. Choose Practice or Test, then begin reviewing cards.

## CSV format

The CSV parser expects a header row followed by one or more data rows.

Required columns:
- Question
- Answer
Optional columns:
- Topic

Example:

```csv
Topic,Question,Answer
"Internet","What is HTTP?","Hypertext Transfer Protocol"
"Databases","What is SQL?","Structured Query Language"
```

Notes:
- Column names are matched case-insensitively, so Question/Answer and question/answer both work.
- Quoted fields are supported.
- Commas inside quoted fields are supported.
- Blank rows are ignored.
- Rows with an empty question or answer are skipped.

## Interface overview

The app uses a compact controls panel with:

- Deck controls
  - Upload a CSV file
  - View the currently selected filename
- Session controls
  - Session type toggle: Practice or Test
  - Shuffle cards
  - Hide Correct, Incorrect, or No Mark cards while navigating in Test mode

### App states

- Empty state: the app starts with a prompt to upload a CSV file.
- Ready state: after a valid file is loaded, the app shows a prompt to start Study or Test.
- Active state: the current card is shown, and navigation and reset controls become available.

## Modes

### Sequential
- Cards appear in the order they are listed in the CSV file.
- Previous and Next navigation are both available.

### Random (with repetition)
- Each new card is chosen randomly.
- Cards can appear more than once in a session.

### Random (no repetition)
- Each card appears once per session.
- Navigation respects the selected Hide category filters.
- The status line shows question position, correct count, incorrect count, and score.

## Progress and answer tracking

The status line updates based on the selected mode:

- Study mode shows viewed count, unique cards seen, and deck size.
- Test mode shows question position, correct count, incorrect count, and score.

In Test mode, each card displays a compact status marker in the top-right corner. The marker cycles through:
- Unanswered
- Correct
- Incorrect

The marker is shown on both sides of the card and remains attached to the card while you navigate.

## Project structure

```text
.  
├── index.html  
├── styles.css  
├── js/  
│   ├── constants.js  
│   ├── csvParser.js  
│   ├── dom.js  
│   ├── main.js  
│   ├── navigation.js  
│   ├── state.js  
│   └── ui.js  
└── README.md  
```

### File overview

- index.html — app structure and UI markup
- styles.css — visual styling, layout, and card animation
- js/constants.js — shared constants and enums
- js/state.js — application state and progress helpers
- js/dom.js — DOM element lookup and wiring helpers
- js/csvParser.js — CSV parsing and validation
- js/navigation.js — traversal and navigation logic
- js/ui.js — UI rendering and interaction handlers
- js/main.js — main app initialization and behavior orchestration

## License

Copyright (c) 2026 Igor Gorinov

This project is licensed under the MIT License.