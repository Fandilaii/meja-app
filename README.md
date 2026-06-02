# Meja 🪑

Indonesian premium restaurant reservation PWA — built with Next.js, Firebase, and Fonnte (WhatsApp).

## Stack

| Layer       | Choice                          |
|-------------|----------------------------------|
| Framework   | Next.js (App Router)            |
| Language    | TypeScript                      |
| Styling     | Tailwind CSS v4 + shadcn/ui     |
| Backend/DB  | Firebase (Firestore)            |
| Auth        | Firebase Auth                   |
| Storage     | Firebase Storage                |
| WhatsApp    | Fonnte API                      |
| Hosting     | Vercel                          |

## Local Setup

```bash
# 1. Clone repo
git clone https://github.com/Fandilaii/meja-app.git
cd meja-app

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in Firebase + Fonnte credentials in .env.local

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` — required keys:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project Settings |
| `FONNTE_API_TOKEN` | [fonnte.com](https://fonnte.com) dashboard |

## Seed Data

Populate Firestore with 5 sample restaurants:

```bash
npx ts-node scripts/seed.ts
```

## Screens

| Route | Description |
|-------|-------------|
| `/` | Discovery — search + filter restaurants |
| `/restaurant/[id]` | Detail + booking flow |
| `/confirmation/[id]` | Booking confirmation + WhatsApp CTA |
| `/dashboard` | Restaurant manager dashboard |

## Deploy

1. Push to GitHub
2. Import repo on [Vercel](https://vercel.com)
3. Add all env vars in Vercel project settings
4. Deploy → live URL

## Firestore Rules

Deploy security rules:

```bash
firebase deploy --only firestore:rules
```

---

*Meja v1.0 — June 2026*
