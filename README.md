# Flashcard Trainer

Flashcard Trainer is a lightweight browser app for practicing question and answer cards from a CSV file.
It runs fully client-side with no backend and no build step.

## Highlights

- Upload a CSV deck with Question and Answer columns.
- Flip cards by clicking the card.
- Switch between Practice and Test sessions.
- Optional shuffle mode with no repeated cards in one run.
- Mark answers in Test mode as correct, incorrect, or unanswered.
- Filter navigation in Test mode to hide selected answer categories.
- View live progress and score details in the status bar.
- Reset session state at any time.
- Open the Disclaimer in a modal dialog.

## How It Works

1. Open the app in a browser.
2. Click Upload CSV and choose a file.
3. Select a session type:
	 - Practice: standard review flow.
	 - Test: answer marking and score tracking are enabled.
4. Use Shuffle cards if you want randomized order.
5. Navigate cards with Previous and Next.
6. Click the card to flip between question and answer.
7. In Test mode, click the status indicator on the back side to cycle through:
	 - Unanswered
	 - Correct
	 - Incorrect

## CSV Format

The CSV parser expects:

- A header row.
- At least one data row.
- Header names containing both question and answer (case-insensitive).

Only rows where both fields are non-empty are imported.

### Minimal Example

```csv
Question,Answer
What is HTML?,A markup language for web pages
What is CSS?,A stylesheet language
What is JavaScript?,A programming language
```

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

## Session Behavior

### Practice

- Status shows current card index and viewed count.
- Deck end message appears when you reach the last card.
- No answer marking controls are shown.

### Test

- Status shows:
	- Current question index
	- Correct count
	- Incorrect count
	- Score percentage based on total cards
- Answer state can be cycled from the back-side indicator.
- Navigation filter checkboxes can hide cards by answer state.
- At most two hide filters can be active at once.

## Navigation Filters

In Test mode, filters are available for:

- Correct
- Incorrect
- No Mark

When filters hide a category, Next and Previous skip hidden cards.
Filters are disabled outside Test mode or when no deck is loaded.

## Running Locally

This project has no npm or build tooling. You can run it as static files.

### Option 1: Open Directly

Open index.html in a modern browser.

### Option 2: Use a Local Static Server

Any static server works. Example with Python:

```powershell
python -m http.server 8080
```

Then open http://localhost:8080.

## Project Structure

```text
.  
|-- index.html            # Main application shell  
|-- styles.css            # App styling and responsive layout  
|-- disclaimer.html       # Disclaimer page shown in dialog iframe  
|-- js/  
|   |-- main.js           # App bootstrap  
|   |-- constants.js      # Shared enums, labels, and static text  
|   |-- state.js          # Mutable app state and state reset helpers  
|   |-- dom.js            # Required DOM element lookup  
|   |-- csvParser.js      # CSV parser and card extraction  
|   |-- navigation.js     # Order creation, shuffling, visibility checks  
|   |-- ui.js             # Event wiring and UI orchestration  
|-- images/  
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
- CSV import is limited to question and answer mapping.
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
