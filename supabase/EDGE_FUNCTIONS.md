# Supabase Edge Functions Setup

## Prerequisites
1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Login: `supabase login`

## Environment Variables
Create `.env` file in `supabase/`:

```bash
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=https://txpiedxxxuuqcybcbrxh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Deploy Functions

```bash
# Deploy generate-mystery function
supabase functions deploy generate-mystery

# Set secrets
supabase secrets set OPENAI_API_KEY=your-key
```

## Call from Mobile App

```typescript
const { data, error } = await supabase.functions.invoke('generate-mystery', {
  body: { partyId: '...' }
})
```

## Available Functions

### generate-mystery
Generates complete murder mystery with GPT-4o.
- **Input**: `{ partyId: string }`
- **Output**: `{ success: boolean, partyId: string }`
- **Side effects**: 
  - Updates party status to 'reviewing'
  - Creates characters for all guests
  - Saves victim, clues, and solution

## Development

Run locally:
```bash
supabase functions serve generate-mystery --env-file supabase/.env
```

Test:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-mystery' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"partyId":"test-id"}'
```
