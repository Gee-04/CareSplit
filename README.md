<<<<<<< HEAD

# Family Support Wallet

A cross-border family remittance app built on Open Payments / Interledger Protocol. Migrant workers send money home with automatic splitting, spending controls, and daily streaming allowances at ~1.5% fees vs the industry standard 8%.

## The problem it solves

Thandi is a nurse in London supporting her mother and two children in Khayelitsha, Cape Town. Every month she:

- Pays ~8% in transfer fees (R1,440/year lost)
- Makes three separate transfers and phone calls
- Has no way to ensure Sipho doesn't blow his allowance in the first week
- Worries Gogo will skip medication to buy groceries

This app fixes all of that.

## Features

- **OTP authentication** - signup verification + login OTP + payment confirmation
- **Automatic split payments** - one transfer splits to N family members under a single Open Payments grant
- **Spending rules** - vouchers restricted to specific categories, liquor store blocking
- **Daily streaming allowances** - Sipho's R200 allowance drips R10/day over 20 school days
- **Low fees** - ~1.5% via ILP vs 8% via Western Union / bank transfer
- **Payment history** - full audit trail per family member

## Tech stack

- **Next.js 15** (App Router, TypeScript)
- **Drizzle ORM** + **libSQL** (SQLite-compatible, Turso-ready)
- **Open Payments** (simulated in dev, production-ready hooks in `src/lib/payments.ts`)
- **bcryptjs** for password and OTP hashing
- **JWT** sessions
- **Nodemailer** (logs to console in dev, real SMTP in prod)

## Quick start

```bash
git clone <repo>
cd family-support-wallet
npm install

cp .env.example .env
# Edit .env - at minimum set JWT_SECRET

# Push DB schema
npx drizzle-kit push

# Seed demo data (Thandi + family)
npm run db:seed

# Start dev server
npm run dev
```

Open http://localhost:3000

Demo credentials:

- Email: `thandi@demo.com`
- Password: `password123`
- OTP: printed to terminal (dev mode)

## Project structure

```
src/
  app/
    page.tsx                  # Login
    signup/page.tsx           # Account creation
    dashboard/page.tsx        # Main dashboard
    send/page.tsx             # Send money + OTP confirm + live flow
    family/add/page.tsx       # Add family member with rules
    api/
      auth/
        signup/route.ts
        login/route.ts
        verify-otp/route.ts
        request-otp/route.ts
      payments/
        family/route.ts       # GET/POST family members
        send/route.ts         # POST send payment, GET history
  db/
    schema.ts                 # Drizzle schema
    index.ts                  # DB connection
    seed.ts                   # Demo data
  lib/
    auth.ts                   # JWT, OTP, bcrypt utilities
    middleware.ts             # requireAuth() helper
    notifications.ts          # Email/SMS (console in dev)
    payments.ts               # Exchange rates, Open Payments flow
```

## Production checklist

- [ ] Set strong `JWT_SECRET` in env
- [ ] Configure real SMTP (`EMAIL_HOST`, etc.) or swap nodemailer for SendGrid/Resend
- [ ] Integrate Africa's Talking / Twilio for SMS OTPs
- [ ] Replace simulated Open Payments flow in `src/lib/payments.ts` with `@interledger/open-payments` SDK
- [ ] Add real wallet addresses for family members
- [ ] Switch `DATABASE_URL` to Turso (libSQL) for production SQLite
- [ ] Add rate limiting to OTP endpoints (e.g. upstash/ratelimit)
- [ ] Deploy to Vercel / Railway

## Open Payments integration notes

The production flow in `src/lib/payments.ts` mirrors the full Open Payments protocol:

1. **Discovery** - resolve wallet addresses for sender and each receiver
2. **Incoming payments** - create an incoming payment on each family member's wallet
3. **Quote** - get a quote for the total GBP → ZAR
4. **Interactive grant** - redirect Thandi for consent (one approval covers all splits)
5. **Outgoing payments** - create N outgoing payments under the single grant
6. **Recurring grant** - Sipho's daily R10 uses an interval grant: `R20/2026-06-01T06:00:00Z/P1D`

Replace `simulateOpenPaymentsFlow()` with the real `@interledger/open-payments` client calls when connecting to a live wallet provider.

---

# Built for the Open Payments hackathon. May your packets always find a route.

# CareSplit

Sharing money across borders with loved ones
<<<<<<< HEAD

> > > > > > > # ac0be3d9a624823ad1d5366e6aeb1c5897f4790c

## Local Setup

> > > > > > > origin/main
