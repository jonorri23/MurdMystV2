# Gap Analysis: MurdMyst Web vs. Mobile App

## 1. Executive Summary
The Web App is a feature-rich, polished Next.js application with advanced AI integration and a "premium" dark-themed UI. The Mobile App (Expo/React Native) is a functional but basic port that lacks significant features and the visual polish of the web version.

## 2. Web App Analysis
**Status:** Advanced / Near Completion (Phase 4)
**Tech Stack:** Next.js 16, React 19, Tailwind v4, Supabase, AI SDK.

### Features
- **Host Dashboard:** Comprehensive. Includes Venue Analysis, Character Generation, Story Generation.
- **Phase 4 Features (Implemented):**
    - Inline Character Editing (`EditableCharacter.tsx`).
    - Physical Clue Editing (`EditableClue.tsx`).
    - AI Story Check (Coherence validation).
- **Phase 4 Features (Pending):**
    - In-app Clue Editing (lower priority).
    - Enhanced Theme Customization.

### Look and Feel
- **Theme:** "Premium" Dark Mode (`bg-slate-950`, `text-slate-100`).
- **UI:** Polished components (likely shadcn/ui based), gradients, Lucide icons.
- **UX:** Interactive, responsive, uses Server Actions for seamless updates.

## 3. Mobile App Analysis
**Status:** Basic Prototype / MVP
**Tech Stack:** Expo 54, React Native 0.81, NativeWind v4, Supabase.

### Features (Gaps)
| Feature Area | Web App | Mobile App | Gap Severity |
| :--- | :--- | :--- | :--- |
| **Authentication** | Full Login/Signup | Basic Login/Signup | Low |
| **Join Flow** | Deep links, QR support | Basic Code Entry | Medium |
| **Guest Experience** | Character Reveal, **Chat/Messaging**, Clues, Phase Updates | Character Reveal, Clues (Read-only). **No Chat.** | **High** |
| **Host Experience** | Full Creation Suite, **Editing & AI Tools**, Venue Analysis | Basic Dashboard, View-only Lists. **No Editing/AI Tools.** | **High** |
| **Realtime** | Full Realtime Updates (Chat, Phases) | Basic Clue Updates | Medium |
| **Parity Updates** | **Instant Party Creation** (Added), **Settings in Dashboard** (Added) | **Instant Party Creation** (Native), **DALL-E Toggle** (Added) | **Resolved** |

### Look and Feel (Gaps)
- **Theme:** Uses default Tailwind colors. Lacks the specific `slate-950` / `purple-500` palette definition in config.
- **Typography:** Uses system fonts. Web likely uses a specific sans-serif stack that feels cleaner.
- **Components:** Uses raw `View`/`Text` with basic styling. Lacks the "Card" aesthetic, shadows, and gradients of the Web app.
- **Animations:** Static. Web uses Framer Motion; Mobile lacks Reanimated transitions.

## 4. Recommendations
1.  **UI Overhaul (Mobile):** Port the Web's `globals.css` variables to `tailwind.config.js` in Mobile. Create a `Theme` provider or just standard classes to match.
2.  **Guest Feature Parity:** Implement the Chat/Messaging feature for Guests on Mobile. This is critical for the "Party" experience.
3.  **Host Feature Parity:** Add "Edit" capabilities to Mobile, or at least "Regenerate" actions if full editing is too complex for small screens.
4.  **Finish Web:** Implement "In-app Clue Editing" and "Enhanced Theme Customization".
