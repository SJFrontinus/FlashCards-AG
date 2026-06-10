# AeroCards Project Memory & Developer Reference

AeroCards is a premium, interactive mental math speed drill web application built using vanilla HTML, CSS, and JavaScript.

## 1. Project Architecture & Core Files
- **[index.html](file:///Users/chuck/gitrepositories/FlashCards-AG/index.html)**: Contains the single-page application structure. Defines the setup screen, drill interface (with question tracking and feedback overlays), review intro panel, results board, and the draggable floating on-screen keypad.
- **[style.css](file:///Users/chuck/gitrepositories/FlashCards-AG/style.css)**: Implements the UI theme, using a high-fidelity dark mode with glassmorphism panels, customized HSL color systems, glow elements, and dynamic CSS transitions (including shake, pulse, and floating feedback).
- **[app.js](file:///Users/chuck/gitrepositories/FlashCards-AG/app.js)**: Handles game state, Fisher-Yates operand pair shuffling, custom timers, error detection, strict reinforcement typing loops, review round queue management, and localStorage configuration caching.
- **[TestUrl](file:///Users/chuck/gitrepositories/FlashCards-AG/TestUrl)**: A simple text file pointing to the live GitHub Pages site: `https://sjfrontinus.github.io/FlashCards-AG/`.

## 2. Core Features & Mechanics
### Setup & Customization
- Operators: Multiplication (default bounds 5–12) and Addition (default bounds 10–99).
- Range Configuration: Customizable Operand A and Operand B ranges (2–100 for multiplication, 10–99 for addition).
- Session size: 5 to 50 cards.
- Time Limit: 3 to 30 seconds per card, or Unlimited mode.
- Input Methods: Native keyboard or custom draggable on-screen keypad.

### Reinforcement Learning Loop
- If a user submits an incorrect answer or times out:
  1. The card triggers a shake animation (`card-shake`).
  2. The correction panel appears, showing the equation and correct answer.
  3. The user must type the correct answer to reinforce memory before the app advances.
  4. The question is flagged as "missed" and added to the review queue.

### Teach Mode
- Optional "Teach Mode" toggle on the setup screen (persisted in localStorage).
- Generates an ordered sequence from the operand ranges (B outer, A inner, fixed operand on the right, no shuffle); the drill-size and time-limit controls are hidden since sequence length derives from the ranges. The setup hint shows the computed card count and warns above 100 cards.
- Two phases, both untimed:
  1. **Learn**: each card shows the full equation including the answer (`2 × 9 = 18`). The answer masks itself on the first keypress; the user types it to advance. A wrong entry re-reveals the answer. Nothing counts toward stats.
  2. **Quiz**: after an interstitial ("Now You Try!"), the same cards repeat in the same order with answers hidden, using the normal miss/reinforcement/review-round flow. Stats reset at quiz start so results reflect the quiz only.
- Typical use: set Operand B to a single value (e.g. 9–9) to learn one times table, or a sub-range (e.g. 6–9) to re-teach trouble spots.

### Review Round
- At the end of the main session, if any questions were missed, the user enters a "Review Round."
- The missed questions are recycled in a queue until the user answers each one correctly first-try. If they miss a card in the review round, it stays in the queue.

### On-Screen Draggable Keypad
- Fully optimized touch layout with pointer event tracking.
- Features a handle for smooth desktop/mobile repositioning.
- Position resets on screen resize to fit next to the card on larger displays.

### Visual Polish & Analytics
- Dynamic canvas confetti spawns on score completion.
- Interactive results board showcasing accuracy, average speed (seconds per card), and total elapsed time.
- Tabbed results breakdown separating Mastered questions and Missed & Reviewed questions.
