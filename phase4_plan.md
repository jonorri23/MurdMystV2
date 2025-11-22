# Phase 4 Implementation: Manual Editing & AI Assistance

## Overview
Phase 4 adds the ability for hosts to manually edit all generated content and get AI assistance for coherence checking. This gives hosts full creative control while maintaining AI support.

## Features to Implement

### 1. Inline Role Editing
- **Edit character fields:** Name, role description, backstory, relationships, quirks, opening action, secret objective
- **Regenerate with instructions:** "Make this character more evil", "Add a mustache"
- **UI:** Toggle
 between view/edit modes per character card

### 2. Physical Clue Editing
- **Edit clue fields:** Description, setup instruction, content, timing
- **Add new physical clues:** Manual creation
- **Remove clues:** Delete button
- **Reorder clues:** Drag-and-drop or up/down buttons

### 3. In-App Clue Editing
- **Edit clue content:** Modify text
- **Change targeting:** Select which roles receive the clue
- **Add new clues:** Manual creation during review
- **Remove clues:** Delete button

### 4. AI Story Check
- **Coherence validation:** Send entire mystery to GPT-4o for analysis
- **Get feedback:** Plot holes, inconsistencies, relationship conflicts
- **Suggestions:** AI-powered improvement recommendations
- **Result display:** Show analysis with actionable items

### 5. Enhanced Theme Customization
- **Custom directives:** "Include cult themes", "Add bird symbolism", "Make it darker"
- **Regenerate sections:** Regenerate specific character or clue with new instructions
- **Maintain consistency:** AI considers existing content when regenerating

## Technical Approach

### Server Actions Needed:
```typescript
- updateCharacter(characterId, fields)
- regenerateCharacter(characterId, instruction)
- updatePhysicalClue(partyId, clueIndex, fields)
- addPhysicalClue(partyId, clue)
- removePhysicalClue(partyId, clueIndex)
- updateInAppClue(eventId, content, targetRoles)
- validateMysteryCoherence(partyId) // AI check
```

### State Management:
- Use React `useState` for edit mode toggles
- Optimistic updates for better UX
- Server actions for persistence

### UI Components:
- Editable text areas with save/cancel
- "Edit" / "Regenerate" buttons per section
- Modal for AI Story Check results
- Inline form fields with validation

## Priority Order:
1. ✅ Character inline editing (most important)
2. ✅ Physical clue editing
3. ✅ AI Story Check
4. In-app clue editing (lower priority)
5. Enhanced theme customization (can build on #1)

Let's start!
