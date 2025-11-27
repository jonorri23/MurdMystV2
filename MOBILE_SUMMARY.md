# MurdMyst - React Native Conversion Summary

## What Was Done
I re-initialized the mobile app from scratch using **Expo** with:
- **React Native** + **NativeWind** (Tailwind CSS for React Native)
- **Expo Router** for file-based navigation
- **Supabase JS Client** with AsyncStorage persistence
- **TypeScript** for type safety

## Architecture

### Monorepo Structure
```
murdmyst/
├── src/                    # Next.js web app
├── supabase/
│   └── functions/          # Edge Functions (shared by web & mobile)
│       ├── generate-mystery/
│       └── analyze-venue/
└── MurdMystApp/            # Expo mobile app
    ├── app/                # Screens (Expo Router)
    ├── components/ui/      # Reusable UI components
    └── lib/                # Supabase client
```

### Why Edge Functions?
- **Security**: Mobile apps can't safely store OpenAI API keys
- **Cost**: Prevents API key exposure and abuse
- **Consistency**: Same AI logic for web and mobile

### Key Design Decisions

1. **NativeWind over Tailwind**
   - Native support for React Native components
   - Familiar Tailwind syntax
   - Compile-time styles (better performance)

2. **Supabase Auth** (instead of custom PIN system)
   - Secure, production-ready
   - Email verification built-in
   - Session management via AsyncStorage

3. **Realtime Subscriptions**
   - Guests receive clues instantly
   - Host sees guest list updates live
   - Built on Supabase Realtime (Postgres CDC)

4. **Image Upload Flow**
   - Mobile → Pick images (Expo ImagePicker)
   - → Upload to Supabase Storage (base64-arraybuffer)
   - → Call Edge Function with public URLs
   - → AI analyzes → Updates DB

## Edge Functions Details

### `generate-mystery`
- **Input**: `{ partyId }`
- **Process**: Fetches party/guests → Calls GPT-4o with structured schema → Saves characters, victim, clues
- **Output**: `{ success, partyId }`

### `analyze-venue`
- **Input**: `{ partyId, imageUrls }`
- **Process**: Calls GPT-4o Vision → Extracts hiding spots, objects, atmosphere
- **Output**: `{ success, analysis }`

## Future Enhancements (Not Yet Implemented)

### Additional Edge Functions
The web app has these AI features that could be migrated:
- `regenerate-character` - Re-generate a single character
- `regenerate-clue` - Re-generate a single clue
- `adjust-story` - Modify the story based on feedback
- `regenerate-portraits` - Generate DALL-E character portraits

### Mobile App Features
- Push notifications (clue alerts)
- Deep linking (join via QR code)
- Offline mode (cache character info)
- In-app camera (instead of image picker)
- Host PIN enforcement via Supabase RLS

## Production Checklist

Before deploying to App Store:
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Add error tracking (Sentry)
- [ ] Implement analytics (PostHog/Mixpanel)
- [ ] Add app icons and splash screens
- [ ] Configure app.json (bundle ID, version, etc.)
- [ ] Test on real iOS devices
- [ ] Create privacy policy & terms
- [ ] Set up App Store Connect

## Testing Locally
```bash
cd MurdMystApp
npm start
# Press 'i' for iOS Simulator
```

## Key Dependencies
- `expo` - App framework
- `expo-router` - File-based navigation
- `nativewind` - Tailwind for React Native
- `@supabase/supabase-js` - Database/Auth client
- `expo-image-picker` - Photo selection
- `base64-arraybuffer` - Image upload encoding
- `lucide-react-native` - Icons
