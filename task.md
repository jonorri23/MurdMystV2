# Task: MurdMystV2 Development

## Current Status: Planning Phase

---

## Phase 1: The "Fun" Engine (AI & Prompts)
- [ ] **Prompt Architecture**
    - [ ] Refactor `generate-mystery` to separate Prompt from Code
    - [ ] Create `PromptRegistry` (file or DB) for versioning
    - [ ] Add "Model Selector" config (GPT-4o, etc.)
- [ ] **AI Editing & Validation (NEW)**
    - [ ] Create `edit-character` Edge Function (Input: instruction + charId)
    - [ ] Create `check-coherence` Edge Function (Input: full party JSON)
    - [ ] Update Prompts to support "Edit Mode" (partial updates)
- [ ] **Solvability & Winning Path**
    - [ ] Update Prompt to enforce "Solution Metadata" (Steps, Critical Clues)
    - [ ] Create `DynamicWinningPath` component (Web) to visualize this data
    - [ ] Create `DynamicWinningPath` component (Mobile)

## Phase 2: Host Experience (Web & Mobile)
- [ ] **AI Tools Integration**
    - [ ] **Web**: Connect "AI Edit" buttons to `edit-character` function
    - [ ] **Web**: Improve "Check Coherence" UI with `check-coherence` results
    - [ ] **Mobile**: Add "AI Edit" button to Character Details
    - [ ] **Mobile**: Add "Check Coherence" button to Review Dashboard
- [ ] **Host-as-Player Mode**
    - [ ] Add `spoiler_free_mode` boolean to `parties` table
    - [ ] Implement UI masking for Host Dashboard (Hide Murderer/Solution)
    - [ ] Add "Reveal" confirmation modals
- [ ] **Digital Locks (PIN System)**
    - [ ] Verify Web implementation of `ClueCodeEntry`
    - [ ] Implement `ClueCodeEntry` screen in Mobile App
    - [ ] Test "Physical -> Digital" flow (Paper PIN -> App Unlock)

## Phase 3: Commercialization
- [ ] **Usage Tracking**
    - [ ] Add `games_created` count to user profile
    - [ ] Implement gating logic (Max 2 free games)
- [ ] **Payment Integration**
    - [ ] (Placeholder) Add "Upgrade" UI blocking generation

## Phase 4: Polish & Release
- [ ] **Mobile UI Polish**
    - [ ] Apply "Premium" theme (Dark mode, gradients)
    - [ ] Fix any remaining "Window is not defined" warnings
- [ ] **Final Testing**
    - [ ] Full playthrough (Host + 3 Guests)
