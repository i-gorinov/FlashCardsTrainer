# Changelog

All notable changes to this project will be documented in this file.

## [1.5.1] - 2026-07-23

### Changed
- Clarified User Guide CSV format requirements and Multiple Choice mode instructions to better match current app behavior.

## [1.5.0] - 2026-07-23

### Added
- Segmented mode selector for choosing between Flashcards and Multiple Choice study modes.
- AI Deck Creator workflow: guided three-step dialog to generate reusable CSV decks using an AI assistant.
- AI Prompt dialog with built-in copy support for pasting the generation prompt into an AI assistant.
- CSV file creation from AI-generated content directly within the app.
- Session reset confirmation dialog to prevent accidental progress loss on file upload or reset.

### Changed
- Updated CSV column names from `FC-Question`/`FC-Answer` to `Question`/`Answer` for clarity.
- Updated Multiple Choice CSV columns to use `MC-Question`, `MC-Answer`, and distractor names.
- Renamed the navigation filter label from "Category" to "Topic" across the UI and documentation.
- Updated empty card view to include a CSV format requirements link and AI deck discovery prompt.
- Refined button styles, hover states, and icon-only reset button on mobile for improved UI consistency.
- Improved AI prompt content with clearer structure and generation guidelines.
- Updated User Guide with detailed AI CSV generation workflow and access instructions.

### Fixed
- Resolved inconsistent nested dialog states when navigating between AI prompt and deck creator dialogs.
- Improved file upload button behaviour to confirm session reset before proceeding.
- Improved mobile viewport handling for the AI prompt dialog.

---

## [1.4.0] - 2026-07-17

### Added
- User Guide dialog accessible from the app footer and via a link in the empty card view.
- Disclaimer dialog accessible from the app footer.
- AI prompt file for CSV generation guidance.

### Changed
- Reorganised project file structure: documentation moved to `documentation/`, CSS moved to `css/`.
- Improved User Guide layout, styles, and content structure.
- Rearranged footer layout for improved visual balance.

---

## [1.3.0] - 2026-07-16

### Added
- Multiple Choice study mode with distractor columns in CSV (`D1`–`D4`).
- Optional Topic/Category column in CSV, displayed on flashcard fronts.
- Navigation filters to show or hide cards by answer status (Correct, Incorrect, Unanswered).

### Changed
- Removed Practice mode; unified workflow into Study and Test modes only.
- Improved mobile responsiveness: rearranged navigation buttons and adjusted breakpoints.
- Improved button hover styles and disabled states for mobile.
- Updated progress text to show current card position relative to deck size.

### Fixed
- Corrected layout for Multiple Choice options with scrollable container.
- Fixed button hover effects on touch devices.
- Corrected alignment for session controls and navigation sections.

---

## [1.2.0] - 2026-07-09

### Added
- Disclaimer page and footer dialog.
- Architecture, CSV, JavaScript, state, and UI instruction files for modular development.

### Changed
- Complete overhaul of application structure: modularised into `constants.js`, `state.js`, `dom.js`, `csvParser.js`, `navigation.js`, `ui.js`, and `main.js`.
- Replaced app toolbar with session bar, including motto text and improved reset button visibility.
- Added flashcard icon and updated page title.
- Added CSV example display on empty card state.
- Improved status bar presentation and answer status indicator positioning for mobile.

### Fixed
- Removed flashing text on reload by updating status and rendering logic.
- Removed redundant flip hint text.

---

## [1.1.0] - 2026-07-08

### Added
- Navigation buttons for traversing flashcards (Previous / Next).
- Answer status tracking in Test mode with visual indicators (Correct / Incorrect / Unanswered).
- Animated answer status indicators with accessibility improvements.
- Study and Test session modes (renamed from Practice and renamed Restart to Reset).
- Keyboard navigation for settings tabs.
- Session state management: preventing redundant tab activation across modes.

### Changed
- Updated progress text to include total deck size.
- Refactored session management and mode tab behaviour.

---

## [1.0.0] - 2026-07-07

### Added
- Initial release of Flashcard Trainer.
- CSV file upload to load flashcard decks (Question and Answer columns).
- Sequential and shuffle study modes.
- Basic flashcard flip interaction.
- Responsive layout for desktop and mobile.
