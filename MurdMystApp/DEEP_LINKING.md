# Deep Linking Setup for MurdMyst Mobile App

## Current Status
The app has a custom URL scheme configured: `murdmystapp://`

## Issue
Currently, SMS character links use the web app URL (`https://murdmyst.vercel.app/party/{id}/guest/{id}`), which:
- Returns 404 when opened on mobile
- Doesn't open the mobile app

## Solution (For Testing with Expo Go)

### Option 1: Custom Scheme (Works with Expo Go)
Use: `murdmystapp://party/{partyId}/guest/{guestId}`

**Pros:** Works with Expo Go
**Cons:** Doesn't fallback to App Store, shows error if app not installed

### Option 2: Expo Development URL (Expo Go Only)
Use: `exp://YOUR_IP:8081/--/party/{partyId}/guest/{guestId}`

**Pros:** Works during Expo Go development
**Cons:** Only works on your local network, requires updating IP

## Solution (For Production - Standalone Build Required)

### Universal Links / App Links
Configure `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourdomain.murdmyst",
      "associatedDomains": ["applinks:murdmyst.app"]
    },
    "android": {
      "package": "com.yourdomain.murdmyst",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "murdmyst.app",
              "pathPrefix": "/party"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### Server Setup
Create `https://murdmyst.app/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.yourdomain.murdmyst",
        "paths": ["/party/*"]
      }
    ]
  }
}
```

### Smart Banner (Web App)
Add to web app's `<head>`:
```html
<meta name="apple-itunes-app" content="app-id=YOUR_APP_ID, app-argument=murdmystapp://party/...">
```

## Next Steps (For Production)

1. **Get a custom domain** (e.g., `murdmyst.app`)
2. **Create standalone build** with `eas build`
3. **Publish to App Store/Play Store**
4. **Set up universal links** on your domain
5. **Update SMS to use** `https://murdmyst.app/party/{id}/guest/{id}`
6. **Server redirects:**
   - If app installed → Opens app
   - If not installed → Redirects to App Store/Play Store

## Testing with Expo Go (Current Limitation)

Expo Go cannot test universal links. For now, links will:
- Open in browser (web app) if using `https://` URLs
- Show 404 because `/party/[id]/guest/[id]` route doesn't exist in web app

**Workaround:** Guests should use the "Join Party" tab with Game ID + PIN instead of SMS links until standalone build is ready.
