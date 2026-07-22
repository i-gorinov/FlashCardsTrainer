# Flashcard Trainer

Flashcard Trainer is a lightweight browser app for practicing question and answer cards from a CSV file.
It runs fully client-side with no backend and no build step.

## Highlights

- Upload a CSV deck with FC-Question and FC-Answer columns.
- Optionally include a Category column shown on the question side.
- Optionally include MC-Answer and MC-Distractor columns to enable multi-choice mode.
- Flip cards by clicking the card.
- Optional shuffle mode with no repeated cards in one run.
- Mark answers as correct, incorrect, or unanswered.
- Filter navigation to hide selected answer categories.
- View live progress and score details in the status bar.
- Active flashcards use subtle full-surface question and checkmark watermarks instead of visible side headings.
- Reset session state at any time, with a confirmation prompt to prevent accidental progress loss.
- On mobile, the reset control collapses to an icon-only button.
- Open the Disclaimer in a modal dialog.
- Discover AI deck creation directly from the empty card state.
- Use a guided AI deck creation dialog with a three-step quick-start workflow.
- Create and save CSV files directly in the app by pasting AI-generated output, including on mobile devices.
- View and copy the AI CSV-generation prompt from a shared text file.

## How It Works

1. Open the app in a browser.
2. Click Upload CSV and choose a file.
3. Review starts in scoring mode with Shuffle cards enabled by default.
4. Optionally toggle Shuffle cards. If a session is in progress, a confirmation dialog appears before the session resets.
5. Check Multi-choice (if the CSV contains MC-Answer and MC-Distractor columns) to display shuffled lettered answer options on the question side.
6. Navigate cards with Previous and Next.
7. Click the card to flip between question and answer.
8. Click the status indicator on the back side to cycle through:
	 - Unanswered
	 - Correct
	 - Incorrect

A **Session Reset Warning** dialog appears before any action that would discard an active learning session (Reset, loading a new CSV, or changing the Shuffle Cards setting).
The dialog only appears once at least one card has been viewed.
Cancelling the dialog leaves the current session completely unchanged.

### AI Deck Quick Start

When no deck is loaded, the empty card view shows a coherent empty state with three elements in order: "Upload a CSV file to begin.", a "View CSV format requirements" link that opens the User Guide directly at the CSV file format section, and "Don't have a deck yet? Generate one with AI."

The AI deck dialog provides:

- A short three-step workflow:
	- Open the AI Prompt
	- Generate CSV output in an AI assistant
	- Create and save a CSV file
- An in-app CSV File Creator where you can:
	- Paste AI-generated CSV output
	- Enter a deck filename
	- Save a reusable `.csv` file to your device

The AI prompt uses the same shared prompt source and preserves responsive behavior:

- Desktop and tablet: Copy option remains available.
- Mobile: Copy option only.
- Prompt content loads from `ai-prompts/FlashcardTrainer_prompt.txt`.

## CSV Format

Each row represents a single knowledge point. The CSV parser expects:

- A header row.
- At least one data row.
- `FC-Question` and `FC-Answer` columns (case-insensitive) — both required.
- An optional `Category` column (case-insensitive) for question-side display.
- Optional `MC-Question`, `MC-Answer`, `MC-Distractor-1`, `MC-Distractor-2`, `MC-Distractor-3` columns (case-insensitive) to enable multi-choice mode per card.

Only rows where both `FC-Question` and `FC-Answer` are non-empty are imported. The MC section is only stored for a card when `MC-Answer` and at least one `MC-Distractor` column are non-empty.

### Minimal Example

```csv
FC-Question,FC-Answer
What is HTML?,A markup language for web pages
What is CSS?,A stylesheet language
What is JavaScript?,A programming language
```

### Full Example

Including all columns enables multi-choice mode for those cards.

```csv
Category,FC-Question,FC-Answer,MC-Question,MC-Answer,MC-Distractor-1,MC-Distractor-2,MC-Distractor-3
Web,What is HTML?,A markup language for web pages,Which technology defines the structure of a web page?,HTML,CSS,JavaScript,SQL
Web,What is CSS?,A stylesheet language,Which language controls the visual style of a web page?,CSS,HTML,JavaScript,Python
```

When Multi-choice is checked:

- The question side shows the question followed by all answer options in a random order that is preserved for the session.
- Each option is prefixed with a capital letter index: `A)`, `B)`, `C)`, etc.
- The answer side shows only the correct answer with the same letter it was assigned on the question side.

### Optional Category Example

```csv
FC-Answer,Category,FC-Question
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
- CSV header must include both 'FC-Question' and 'FC-Answer' columns.
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
- Multi-choice checkbox appears when the CSV contains MC-Answer and MC-Distractor columns.
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

Note: Some features that load external files (such as the AI prompt and user guide) work best when served through a static server rather than opening `index.html` directly with `file://`.

### Option 2: Use a Local Static Server

A static server is recommended to ensure all features work correctly, especially the AI prompt loading.

Example with Python:

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
