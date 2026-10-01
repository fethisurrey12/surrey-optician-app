# Surrey People — the Surrey Opticians loyalty app

A customer loyalty app for Surrey Opticians, an independent optometry practice
with four practices — Coulsdon, Wallington, Wallington Green and Banstead. Members earn a point for
every £10 of private spend; ten points become a £10 voucher redeemed at the
till.

- `frontend/` — Expo / React Native app (iOS, Android, and web preview)
- `backend/` — FastAPI + MongoDB service

## The scheme

| Rule | Detail |
|---|---|
| Earning | 1 point per whole £10 of private spend, rounded down |
| NHS-funded care | Earns nothing — only the amount the customer pays counts |
| Reward | 10 points issues a £10 voucher automatically |
| Voucher term | 12 months from issue — nothing stays valid longer than a year |
| Redemption | Manual, at the till — the app never redeems itself |
| Expiry | Derived from the date on read; an expired voucher is never offered and cannot be redeemed |
| Referrals | Both parties earn a bonus point on the friend's first purchase |
| Welcome offer | One voucher, £25 towards glasses, issued the first time a patient signs in — one per member, ever |

The maths lives in `backend/scheme.py`, which is the authority; the app keeps a
matching copy in `frontend/src/lib/points.ts` for display only.

## Running it

### Backend

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env          # then fill it in
.venv/bin/uvicorn server:app --reload --port 8000
```

Needs MongoDB. Without one to hand, the in-memory dev server runs the same API
with nothing to install and the sample account already seeded:

```bash
.venv/bin/python devserver.py     # http://127.0.0.1:8000/api
```

### Frontend

```bash
cd frontend
yarn install
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000 yarn start
```

With `EXPO_PUBLIC_BACKEND_URL` unset the app falls back to its bundled sample
data, so every screen can still be demonstrated with no server running.

### Tests

```bash
cd backend && .venv/bin/python -m pytest tests/ -q
cd frontend && npx tsc --noEmit && npx expo lint
```

## The API

All routes are under `/api`.

| Route | Who | What |
|---|---|---|
| `GET /branches` | public | Branches, hours and phone numbers |
| `GET /health` | public | Service and database state |
| `POST /auth/request-otp` | public | Text a sign-in code |
| `POST /auth/verify-otp` | public | Exchange the code for a token |
| `GET /me/account` | member | The membership record |
| `PATCH /me/account` | member | Edit name, email, home branch |
| `GET /me/vouchers` | member | Vouchers, available and used |
| `GET /me/activity` | member | Points history |
| `GET /me/referrals` | member | Invites and their status |
| `POST /me/vouchers/{id}/redeem` | member | Mark a voucher used at the till |
| `POST /me/vouchers/{id}/wallet` | member | Record an Apple/Google Wallet add |
| `GET /staff/session` | desk | Confirm the practice key before the desk opens |
| `GET /staff/members?q=` | desk | Find a patient by name, number, email or code |
| `GET /staff/members/{id}` | desk | One patient: details, points, vouchers, visits |
| `POST /staff/purchases` | till | Record a purchase and award points |
| `POST /staff/check-in` | desk | Check a patient in from their membership QR |
| `GET /wallet/status` | public | What wallet signing material is missing |

Members authenticate with a bearer token; the till and desk present `X-Staff-Key`.

## What a member record holds

Signing in creates the record; the member fills in the rest once, and it is
kept from then on. The fields match the practice's own Surrey People sign-up
form.

| Field | Set by |
|---|---|
| `mobile` | Sign-in — it is the account key, and what the till searches on |
| `firstName`, `lastName` | The member |
| `email` | The member |
| `dateOfBirth` | The member, as ISO `yyyy-mm-dd` |
| `address`, `postcode` | The member |
| `homeBranchId` | The member |
| `memberCode` | Generated — the `SM-` code behind the check-in QR |
| `referralCode` | Generated from their first name and mobile |
| `points`, `totalEarned` | The till, through the loyalty engine |
| `memberSince`, `createdAt` | Generated |

Loyalty data only. No prescriptions, appointments or clinical notes — the app's
own privacy screen tells members exactly that, and it should stay true.

## Codes

Two kinds of QR, told apart by their prefix so whoever is scanning cannot
confuse them:

| Prefix | What it is | Where it is scanned |
|---|---|---|
| `SO-` | A voucher — a £10 reward, or the £25 welcome offer | The till, to apply the discount |
| `SM-` | The patient's membership code | The desk, to check them in on arrival |

Checking in records the arrival and tells the colleague who has arrived. It
moves no points, because arriving is not a purchase. Presenting a voucher code
at the desk is refused with a message saying so.

## The practice desk

`/staff` is the colleague's side of the app — the same build, a different door.
It carries the practice key (`STAFF_API_KEY`) rather than a patient's session,
so a colleague can look anyone up without that patient signing in on the device.
The key is entered once and kept in the device's secure storage; "Lock the desk"
clears it. It is reached from Settings → Practice desk, or at `/staff` directly
on a desk computer.

| On the desk | What it does |
|---|---|
| Check in | Scan the membership QR (a scanner types the code and presses enter) or type it. Says who has arrived and whether a reward is waiting. |
| Find a patient | Name, mobile — however it is read out — email, or `SM-` code |
| Their record | Details, points, rewards, visits and arrivals |
| Record a purchase | Total paid and the NHS share; points and any reward follow automatically |

The branch is chosen once on the device and remembered: everything the desk
records is attributed to it.

With no `EXPO_PUBLIC_BACKEND_URL` configured the desk opens straight onto the
bundled sample patients and says so on screen, so it can be shown and tried
before the practice's server exists.

## Booking

"Book an eye test" on Home and "Book online" on Branches hand the patient to
the practice's own booking page:

    https://www.surreyopticians.co.uk/book-appointment

It opens in an in-app browser on a phone and a new tab on web. The URL lives in
`frontend/src/lib/booking.ts`. Because booking happens on that page, the app
does not hold a diary and does not know which slots are free — whatever runs
that page owns availability.

## Brand

Colours and type come from the practice's own **Surrey Opticians Lookbook**
(2019), held in SharePoint under Marketing / SO Fonts and colours — not from a
guess at the website:

| | |
|---|---|
| Turquoise | `#009db1` — the primary, used for the ring, badges and fills |
| Dark grey | `#3b3c43` — body type |
| Dark blue | `#282460` |
| Lilac | `#7087c3` |
| Type | Gill Sans Nova (Light / Book / Semibold) |

Two gaps. The app substitutes **Inter** for Gill Sans Nova, which is licensed
and not bundled here; swapping it is a font file plus one line in
`src/tokens.ts`.

### The logo

The logo in the app is the practice's own artwork. `Surrey Opticians
Logo-01.png` — the teal block with the SO device and the lowercase wordmark —
came from the SOMarketing SharePoint site and lives in the repository at
`frontend/assets/brand/`. Its turquoise is `#009DB1`, which is where the
palette's brand colour comes from. (The logo master PDF quotes Pantone 320C,
`#009CA6`, for print; the digital artwork is `#009DB1`.)

| File | What it is |
|---|---|
| `frontend/assets/brand/surrey-opticians-logo-01.png` | The master artwork. Everything else is rendered from it |
| `frontend/assets/brand/so-device.png` | The SO device alone, white on transparent, for the square icons |
| `frontend/assets/brand/so-device-tile.png` | The device as the artwork draws it, on its own ground |
| `frontend/src/ui/wordmarkPath.ts` | The uppercase wordmark as Gill Sans Nova outlines, from page 1 of the Brand Book 2026, drawn by `Wordmark.tsx` on the membership card, the lock screen and the join page |

The two device files are cut from the master by `scripts/extract-device.cjs`.
Re-run it if the master is ever replaced.

To regenerate every size from the artwork:

```bash
cd frontend
npm i -D playwright-core                       # once
node scripts/extract-device.cjs                # refresh the device crops
node scripts/install-logo.mjs assets/brand/surrey-opticians-logo-01.png \
  --device assets/brand/so-device.png --pad 8
```

That writes the in-app logo, the store icon, the Android adaptive icon, the
favicon, the splash image and the three Apple Wallet pass logos. `--device` is
artwork for the square icons only — the wide lockup squeezed into a square tile
reads as a stripe across an empty box. It takes PNG, JPEG or SVG (redrawing a
vector source at full size rather than enlarging a small raster), crops to the
ink so the mark sits centred, and keeps whatever ground the artwork came on.
`--ground` sets the colour behind the square icon, `--pad` its margin.

No code changes: `src/ui/LogoMark.tsx` renders `assets/images/logo-mark.png`
and takes its proportions from the file.

## Building the app

Everything above runs the app in development. These are the builds.

### A web build

```bash
cd frontend
npx expo export --platform web --output-dir dist
```

`dist/` is a static site — put it behind any web server or static host. This is
what the shared demo is.

### iOS and Android

Expo builds these in the cloud, so neither a Mac nor Android Studio is needed.

```bash
npm i -g eas-cli
eas login                      # an Expo account, free to create
cd frontend
eas build:configure            # writes eas.json, once
eas build --platform ios       # or android, or all
```

`eas build:configure` has not been run in this repository yet, so there is no
`eas.json` — the first build creates one.

Before the first build, two things in `frontend/app.json` need changing:

- `ios.bundleIdentifier` and `android.package` are still Emergent's
  `com.emergent.surreyopticians.xkx2pz`. They want to be the practice's own,
  e.g. `uk.co.surreyopticians.people`. These cannot be changed after an app is
  published, so get them right first.
- `slug` is `frontend`. It is the project's name in Expo, not something
  patients see, but `surrey-people` reads better in the dashboard.

For the App Store you also need an Apple Developer account (£79/year) and for
Google Play a Play Console account (one-off $25). `eas submit --platform ios`
uploads the finished build to App Store Connect.

### Installing it on a phone without the stores

For showing colleagues before release:

```bash
eas build --platform android --profile preview
```

That produces an `.apk` that installs directly on any Android phone. iOS needs
TestFlight, which needs the Apple Developer account.

## Before going live

- [ ] Set `JWT_SECRET` — an unset one is regenerated per boot and signs everyone out
- [ ] Set `EXPOSE_DEV_OTP=false` — otherwise the sign-in code is returned in the API response
- [ ] Set `CORS_ORIGINS` to the real origins rather than `*`
- [ ] Set `SMS_PROVIDER=twilio` with credentials, so codes actually reach members
- [ ] Set `STAFF_API_KEY` before the till can post purchases or the desk can open
- [ ] Set `SEED_DEMO_DATA=false` on the practice's deployment
- [ ] Add the Apple and Google Wallet signing material — see `backend/WALLET_SETUP.md`
- [ ] Confirm opening hours — the brand book does not state them
- [ ] Change the bundle identifier and Android package from Emergent's `com.emergent.surreyopticians.xkx2pz`
- [ ] Run `eas build:configure` and set up the Apple Developer and Play Console accounts
