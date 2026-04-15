# forestdream — Eurobase Project

EU-sovereign backend powered by Eurobase. Zero US CLOUD Act exposure.

## Connection

- **API URL**: https://forestdream.eurobase.app
- **SDK**: `@eurobase/sdk`
- **Install**: `npm install @eurobase/sdk`
- **Plan**: pro

## Database Schema

### email_tokens

| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | no |
| user_id | uuid | no |
| token_hash | text | no |
| token_type | text | no |
| expires_at | timestamp with time zone | no |
| used_at | timestamp with time zone | yes |
| created_at | timestamp with time zone | yes |

### refresh_tokens

| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | no |
| user_id | uuid | no |
| token_hash | text | no |
| expires_at | timestamp with time zone | no |
| revoked_at | timestamp with time zone | yes |
| created_at | timestamp with time zone | yes |

### storage_objects

| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | no |
| key | text | no |
| content_type | text | yes |
| size_bytes | bigint | yes |
| uploaded_by | uuid | yes |
| metadata | jsonb | yes |
| created_at | timestamp with time zone | yes |

### todos

| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | no |
| title | text | no |
| completed | boolean | yes |
| created_at | timestamp with time zone | yes |

### user_identities

| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | no |
| user_id | uuid | no |
| provider | text | no |
| provider_user_id | text | no |
| identity_data | jsonb | yes |
| last_sign_in_at | timestamp with time zone | yes |
| created_at | timestamp with time zone | yes |
| updated_at | timestamp with time zone | yes |

### users

| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | no |
| email | text | yes |
| phone | text | yes |
| password_hash | text | yes |
| display_name | text | yes |
| avatar_url | text | yes |
| metadata | jsonb | yes |
| provider | text | yes |
| provider_user_id | text | yes |
| email_confirmed_at | timestamp with time zone | yes |
| phone_confirmed_at | timestamp with time zone | yes |
| last_sign_in_at | timestamp with time zone | yes |
| banned_at | timestamp with time zone | yes |
| created_at | timestamp with time zone | yes |
| updated_at | timestamp with time zone | yes |

## SDK Usage

```typescript
import { createClient } from '@eurobase/sdk'

const eb = createClient({
  url: 'https://forestdream.eurobase.app',
  apiKey: process.env.EUROBASE_PUBLIC_KEY
})

// Query
const { data } = await eb.db.from('todos').select('*')

// Insert
await eb.db.from('todos').insert({ title: 'New task' })

// Update
await eb.db.from('todos').update({ completed: true }).eq('id', id)

// Delete
await eb.db.from('todos').delete().eq('id', id)

// File upload
await eb.storage.upload('path/file.pdf', file)

// Realtime
eb.realtime.on('todos', 'INSERT', (e) => console.log(e))
```

## Authentication

```typescript
// Sign up
const { data, error } = await eb.auth.signUp({ email: 'user@example.com', password: 'securepassword' })

// Sign in
await eb.auth.signIn({ email: 'user@example.com', password: 'securepassword' })

// Get current user
const { data: user } = await eb.auth.getUser()

// Listen for auth state changes
eb.auth.onAuthStateChange((event, session) => {
  console.log(event) // SIGNED_IN | SIGNED_OUT | TOKEN_REFRESHED
})

// Sign out
await eb.auth.signOut()
```

After sign-in, the JWT is sent automatically with every `eb.db` query. RLS policies are enforced server-side.

## Constraints

- All infrastructure is EU-only (Scaleway, Paris FR)
- No US-incorporated services (AWS, GCP, Azure, Stripe, Vercel, Cloudflare)
- GDPR-native by design
