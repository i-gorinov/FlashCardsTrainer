# Flashcard Trainer

Flashcard Trainer is a lightweight browser app for practicing question and answer cards from a CSV file.
It runs fully client-side with no backend and no build step.

## Highlights

- Upload a CSV deck with Question and Answer columns.
- Optionally include a Category column shown on the question side.
- Flip cards by clicking the card.
- Use one unified review workflow with no session selection.
- Optional shuffle mode with no repeated cards in one run.
- Mark answers as correct, incorrect, or unanswered.
- Filter navigation to hide selected answer categories.
- Optional multi-choice mode when Distractor columns are present.
- View live progress and score details in the status bar.
- Reset session state at any time.
- Open the Disclaimer in a modal dialog.
- View and download the AI CSV-generation prompt from a shared text file.

## How It Works

1. Open the app in a browser.
2. Click Upload CSV and choose a file.
3. Review starts in scoring mode with Shuffle cards enabled by default.
4. Optionally toggle Shuffle cards.
5. Check Multi-choice (if the CSV contains Distractor columns) to display shuffled lettered answer options on the question side.
6. Navigate cards with Previous and Next.
7. Click the card to flip between question and answer.
8. Click the status indicator on the back side to cycle through:
	 - Unanswered
	 - Correct
	 - Incorrect

## CSV Format

The CSV parser expects:

- A header row.
- At least one data row.
- Header names containing both question and answer (case-insensitive).
- An optional category header (case-insensitive) for question-side display.
- Optional columns whose header starts with `Distractor` (case-insensitive) to enable multi-choice mode.

Only rows where both fields are non-empty are imported.

### Minimal Example

```csv
Question,Answer
What is HTML?,A markup language for web pages
What is CSS?,A stylesheet language
What is JavaScript?,A programming language
```

### Optional Distractor Example

Adding one or more columns whose header starts with `Distractor` (case-insensitive) enables multi-choice mode.

```csv
Question,Answer,Distractor,Distractor 2,Distractor 3
What is the capital of France?,Paris,London,Tokyo,Amsterdam
What language runs in a browser?,JavaScript,Python,Ruby,Go
```

When Multi-choice is checked:

- The question side shows the question followed by all answer options in a random order that is preserved for the session.
- Each option is prefixed with a capital letter index: `A)`, `B)`, `C)`, etc.
- The answer side shows only the correct answer with the same letter it was assigned on the question side.

### Optional Category Example

```csv
Answer,category,QUESTION
Paris,Geography,What is the capital of France?
4,,What is 2+2?
Pacific Ocean,GEOGRAPHY,Largest ocean?
```

When category is present and non-empty, it appears centered at the top of the question side only.

### Supported Parsing Behavior

- Quoted fields are supported.
- Escaped quotes inside quoted fields are supported using double quotes.
- Both LF and CRLF line endings are supported.
- UTF-8 BOM in header cells is handled.

### Validation Errors You May See

- CSV must include a header row and at least one data row.
- CSV header must include both question and answer columns.
- CSV contains an unterminated quoted field.
- The CSV file does not contain any usable cards.

## Review Behavior

- Status shows:
	- Current question index
	- Correct count
	- Incorrect count
	- Score percentage based on total cards
- Desktop status format: `Question 12/100 | Correct: 8 | Incorrect: 2 | Score: 80%`
- Mobile status format (small viewports): `12/100 | ✓8 | ✗2 | ★80%`
- Answer state can be cycled from the back-side indicator.
- Navigation filter checkboxes can hide cards by answer state.
- At most two hide filters can be active at once.
- Multi-choice checkbox appears when the CSV contains Distractor columns.
- When checked, the question side displays the correct answer and all distractors in a shuffled, lettered order that is stable for the session.
- The answer side shows the correct answer with its assigned letter.
- Multi-choice is unchecked by default whenever a deck is loaded.
- Shuffle is enabled by default whenever a deck is loaded.
- Toggling Multi-choice preserves the current card position, answer statuses, and all review progress.

## Navigation Filters

Filters are available for:

- Correct
- Incorrect
- No Mark

When filters hide a category, Next and Previous skip hidden cards.
Filters are disabled when no deck is loaded.

## Running Locally

This project has no npm or build tooling. You can run it as static files.

### Option 1: Open Directly

Open index.html in a modern browser.

Note: the AI prompt preview in the user guide loads from a separate text file, so that feature requires a static server instead of opening the guide page directly with `file://`.

### Option 2: Use a Local Static Server

Any static server works. Example with Python:

```powershell
python -m http.server 8080
```

Then open http://localhost:8080.

Live Server in VS Code is also supported for local testing.

## Project Structure

```text
.  
|-- index.html            # Main application shell  
|-- disclaimer.html       # Disclaimer page shown in dialog iframe  
|-- images/ 
|-- ai-prompts/  
|   |-- FlashcardTrainer_prompt.txt  # Shared AI prompt source used by the user guide  
|-- css/  
|   |-- styles.css        # App styling and responsive layout  
|-- documentation/  
|   |-- user-guide.html   # User guide shown in dialog iframe  
|-- js/  
    |-- main.js           # App bootstrap  
    |-- constants.js      # Shared enums, labels, and static text  
    |-- state.js          # Mutable app state and state reset helpers  
    |-- dom.js            # Required DOM element lookup  
    |-- csvParser.js      # CSV parser and card extraction  
    |-- navigation.js     # Order creation, shuffling, visibility checks  
    |-- ui.js             # Event wiring and UI orchestration  
```

## Browser Support Notes

The app uses modern browser APIs and CSS features such as:

- dialog element
- FileReader API
- color-mix in CSS

Use an up-to-date browser for best compatibility.

## Known Limitations

- Data is in-memory only; no persistence between reloads.
- No import/export of answer results.
- CSV import supports question and answer mapping with optional category.
- Very large CSV files may still take noticeable time to parse.

## Troubleshooting

- Upload button does nothing:
	- Verify your browser allows file input interaction.
	- Check if the selected file is a valid CSV text file.
- Cards do not appear after upload:
	- Confirm the header includes question and answer.
	- Ensure rows contain non-empty values for both fields.
- Disclaimer opens as a page instead of dialog:
	- Your browser may not support showModal on dialog.

## License and Use

This project is provided for personal learning and educational use.
See disclaimer.html for the full disclaimer text shown by the app.
