# Implementation Plan: MurdMystV2 - The Ultimate Party Game

## Goal
Transform MurdMyst into a "super fun" and commercially viable murder mystery party game. The focus is on **Host Flexibility**, **Fair Solvability**, and **Premium Experience** across Web and Mobile.

## Core Pillars
1.  **Dynamic Mystery Generation**: Iterative prompt engineering to ensure fun, solvable mysteries.
2.  **Host-as-Player Mode**: Allow the host to play without spoilers.
3.  **Commercialization**: Freemium model (1-2 free games, then paywall).
4.  **Platform Parity**: Seamless experience on Web and Mobile.

## 1. Prompt Engineering & AI Architecture
**Objective**: Decouple prompts from code to allow rapid iteration and model switching (e.g., GPT-4o, Claude 3.5 Sonnet).

-   **[NEW] Prompt Registry**: Create a database table `system_prompts` or a config file to store prompt versions.
-   **[NEW] Model Selector**: Allow switching LLMs via env vars or admin config.
-   **[REFINE] Solvability Logic**: Enhance the "Solution Metadata" in the prompt to ensure the AI generates a logical path (Clue A + Clue B = Deduction C).

## 2. AI Editing & Story Coherence (Web & Mobile)
**Objective**: Allow hosts to refine the mystery using AI, ensuring changes don't break the plot.

-   **[NEW] Edge Function: `edit-character`**:
    -   Input: `characterId`, `instruction` (e.g., "Make him more suspicious").
    -   Logic: Updates character profile while maintaining consistency with `victim` and `murderer`.
-   **[NEW] Edge Function: `check-coherence`**:
    -   Input: Full party JSON.
    -   Logic: Analyzes if clues still point to the murderer and if timelines match. Returns warnings (e.g., "Clue #3 contradicts Alibi #2").
-   **[UI] Web App**:
    -   Enhance existing "AI Edit" buttons to use new Edge Functions.
    -   Improve "Check Story Coherence" visualization (currently basic).
-   **[UI] Mobile App**:
    -   Implement "AI Edit" button on Character Detail screen.
    -   Implement "Check Coherence" in Review Dashboard.

## 3. Host-as-Player Mode (Spoiler Protection)
**Objective**: The host should be able to run the game without knowing the murderer.

-   **[NEW] "Spoiler Mode" Toggle**: A setting in the dashboard.
-   **[UI] Redacted Dashboard**:
    -   Hide "The Murderer" badge.
    -   Hide "Solution" tab until the end.
    -   Hide "Victim Details" until the body is found.
-   **[NEW] "Reveal" Actions**: Buttons to "Reveal Victim" or "Reveal Solution" that require confirmation (e.g., "Are you sure? This will spoil the game.").

## 4. "Winning Path" Visualization
**Objective**: Show the host (and players) *how* the game can be won.

-   **[ENHANCE] Dynamic Winning Path**: Instead of static text, visualize the AI-generated "Solution Metadata".
    -   *Graph View*: Show dependencies (Clue #1 -> Unlocks Deduction A).
    -   *Checklist*: "Players must find: [Knife], [Diary], [Letter]".

## 5. Commercialization (Paywall)
**Objective**: Monetize the app while allowing trial.

-   **[DB] User Limits**: Track `games_created_count` in `profiles` table.
-   **[LOGIC] Gate Generation**:
    -   If `games_created_count < 2`: Allow generation.
    -   If `games_created_count >= 2`: Redirect to Stripe payment.
-   **[UI] Upgrade Prompt**: "You have 1 free mystery left. Upgrade for unlimited fun!"

## 6. Mobile App Parity & "Digital Locks"
**Objective**: Make the phone a tool, not a distraction.

-   **[FEAT] PIN Unlock (Mobile)**: Port the Web's `ClueCodeEntry` logic to Mobile.
    -   Guest taps "Found Clue" -> Enters PIN -> Unlocks content.
-   **[FEAT] Host-as-Player (Mobile)**: Implement the spoiler toggles in the mobile dashboard.

## Proposed Roadmap

### Phase 1: The "Fun" Engine (AI & Prompts)
-   [ ] Refactor `generate-mystery` to separate Prompt from Code.
-   [ ] Create `edit-character` Edge Function (AI Edit).
-   [ ] Create `check-coherence` Edge Function (Story Validation).
-   [ ] Implement "Solution Metadata" visualization (Winning Path).

### Phase 2: Host Experience (Web & Mobile)
-   [ ] **Web**: Enhance "AI Edit" & "Coherence" UI.
-   [ ] **Mobile**: Port "AI Edit" & "Coherence" UI.
-   [ ] Implement "Host-as-Player" (Spoiler Free) mode.
-   [ ] Add "Digital Lock" (PIN) feature to Mobile.

### Phase 3: Commercialization
-   [ ] Implement usage tracking.
-   [ ] Add Stripe integration (or simple "Contact to Buy" for now).
