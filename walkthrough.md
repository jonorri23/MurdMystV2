# MurdMyst Mobile App Walkthrough

## ✅ Deployment Status
Both Edge Functions have been successfully deployed to Supabase:
- **generate-mystery** - Generates complete murder mystery using GPT-4o
- **analyze-venue** - Analyzes venue photos using GPT-4o Vision
- **OpenAI API Key** - Set as Supabase secret

## 📱 App Structure
The project follows a **monorepo structure**:
- **Root directory**: Contains the web app (`src/`) and shared `supabase/` folder
- **MurdMystApp/**: Self-contained Expo mobile app
- **supabase/functions/**: Edge Functions accessible by both web and mobile apps

## 🛠️ Required Setup

### 1. Create Storage Bucket (IMPORTANT!)
The venue analysis feature requires a storage bucket. Create it:
1. Go to [Supabase Storage](https://supabase.com/dashboard/project/txpiedxxxuuqcybcbrxh/storage/buckets)
2. Click "New bucket"
3. Name: `venue_images`
4. Make it **Public** (check the box)
5. Click "Create bucket"

### 2. OAuth Providers (Future)
For production, add:
- Google Sign In (via Supabase Auth)
- Apple Sign In (via Supabase Auth)

Both can be configured in the Supabase Dashboard under Authentication → Providers.

## Features Implemented
- **Authentication**: Login/Signup with email ✓
- **Host Dashboard**: View and create parties ✓
- **Party Creation**: Name and theme inputs ✓
- **Guest Management**: Add/remove guests with auto-generated PINs ✓
- **Venue Analysis**: Upload photos → AI analysis via Edge Function ✓
- **Guest Join**: Join using a 4-digit PIN ✓
- **Guest Dashboard**: View character, backstory, secret objective, and clues in real-time ✓
- **Dark Mode**: Auto-detects system theme ✓

## Running the App
1. Navigate to the mobile app:
   ```bash
   cd MurdMystApp
   ```
2. Start Expo:
   ```bash
   npm start
   ```
3. Press **`i`** for iOS Simulator (ensure Xcode is installed)

## Testing Flow
1. **Sign Up**: Create account via auth screen
2. **Create Party**: Tap "+" button, enter party name
3. **Add Guests**: Tap user+ icon → Enter names
4. **Analyze Venue**: Tap "Venue", upload photos *(requires storage bucket)*
5. **Generate Mystery**: Tap "Generate" button *(coming soon)*
6. **Guest Join**: Use 4-digit PIN to join
7. **Verify Real-time**: Clues appear instantly

## Known Issues
- Storage bucket `venue_images` must be created manually
- Google/Apple Sign In not yet configured

## Dashboard Links
- Functions: https://supabase.com/dashboard/project/txpiedxxxuuqcybcbrxh/functions
- Storage: https://supabase.com/dashboard/project/txpiedxxxuuqcybcbrxh/storage/buckets
