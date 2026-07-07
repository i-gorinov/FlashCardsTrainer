# Flashcard Trainer

A lightweight, browser-based flashcard application that loads question-and-answer pairs from a CSV file. The application runs entirely in the browser with no installation, backend, or external dependencies required.

## Features

- Load flashcards from a CSV file
- Interactive card flip animation
- Three settings tabs in one unified panel:
  - **Setup**
    - Upload CSV
    - Current file display
  - **Practice**
    - Sequential
    - Random (with repetition)
  - **Test**
    - Random (no repetition)
- Progress tracking
- Keyboard shortcuts
- Responsive design for desktop and mobile
- Client-side only — no data leaves your browser

## Getting Started

1. Download or clone this repository.
2. Open `index.html` in a modern web browser.
3. In the **Setup** tab, upload a CSV file containing your flashcards.
4. Choose **Practice** or **Test**, then begin reviewing cards.

## CSV Format

The CSV file must contain the following header row:

Question,Answer

Example:

Question,Answer
"What is HTTP?","Hypertext Transfer Protocol"
"What is SQL?","Structured Query Language"

### Notes

- Header names must be `Question` and `Answer`.
- Quoted fields are supported.
- Commas inside quoted fields are supported.
- Blank rows are ignored.
- Rows missing a question or answer are skipped.

## Mode Categories

The Settings panel uses three tabs:

- **Setup**
  - Upload CSV
  - View currently selected file name

- **Practice**
  - Sequential
  - Random (with repetition)
- **Test**
  - Random (no repetition)

Switching the selected mode after loading a CSV restarts the current deck, preserving the same behavior as before.

## Study Modes

### Sequential

Cards are displayed in the order they appear in the CSV file.

- Supports both **Next** and **Previous** navigation.
- Progress tracks:
  - Total card views
  - Unique cards encountered

### Random (No Repetition)

Cards are shown in a random order without repeats.

- Each card is shown exactly once per session.
- Previous navigation is disabled.

### Random (With Repetition)

Each new card is selected randomly.

- Cards may appear more than once.
- Progress tracks:
  - Total card views
  - Unique cards encountered

## Controls

### Mouse

- Click the card to flip between question and answer.
- Use **Next** and **Previous** buttons to navigate.

### Keyboard

- **Space** — Flip card
- **Right Arrow** — Next card
- **Left Arrow** — Previous card (Sequential mode only)
- **In Settings tabs:**
  - **Right Arrow** — Move to next tab
  - **Left Arrow** — Move to previous tab
  - **Home** — Jump to first tab
  - **End** — Jump to last tab

## Progress Tracking

Progress display is mode-dependent:

- **Viewed** – Total number of times cards have been displayed.
- **Unique** – Number of distinct cards seen during the current session.
- **Deck** – Total cards in the deck (shown in Test mode).

Example:

Practice / Random (with repetition):

Viewed: 15 | Unique: 10 / 25

Test / Random (no repetition):

Viewed: 15 | Deck: 25

This allows revisited cards to be distinguished from genuinely new cards in Practice, while Test shows progress against total deck size.

## Project Structure

.  
├── index.html  
├── styles.css  
├── app.js  
└── README.md  

### File Overview

- **index.html** – Application layout and user interface
- **styles.css** – Styling, responsive layout, and card animations
- **app.js** – CSV parsing, navigation logic, progress tracking, and application behaviour

## Design Goals

This project is intentionally:

- Simple and easy to understand
- Dependency-free
- Fully client-side
- Easy to host as a static website
- Suitable for studying any topic that can be represented as question-and-answer pairs

## Future Enhancements

Potential ideas for future development:

- Deck import/export
- Local storage persistence
- Card categories and tags
- Difficulty ratings
- Search and filtering
- Spaced repetition mode
- Statistics dashboard
- Dark mode

## License

Copyright (c) 2026 Igor Gorinov

This project is licensed under the MIT License.