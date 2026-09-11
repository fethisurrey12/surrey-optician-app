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
| `POST /staff/purchases` | till | Record a purchase and award points |
| `POST /staff/check-in` | desk | Check a patient in from their membership QR |
| `GET /wallet/status` | public | What wallet signing material is missing |

Members authenticate with a bearer token; the till and desk present `X-Staff-Key`.

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
`src/tokens.ts`. And `assets/images/logo-mark.png` is a **trace**, not the
practice's artwork — their own `Surrey Opticians Logo-01.png` lives in the
SOMarketing SharePoint site and should replace it.

## Before going live

- [ ] Set `JWT_SECRET` — an unset one is regenerated per boot and signs everyone out
- [ ] Set `EXPOSE_DEV_OTP=false` — otherwise the sign-in code is returned in the API response
- [ ] Set `CORS_ORIGINS` to the real origins rather than `*`
- [ ] Set `SMS_PROVIDER=twilio` with credentials, so codes actually reach members
- [ ] Set `STAFF_API_KEY` before the till can post purchases
- [ ] Set `SEED_DEMO_DATA=false` on the practice's deployment
- [ ] Add the Apple and Google Wallet signing material — see `backend/WALLET_SETUP.md`
- [ ] Replace `frontend/assets/images/logo-mark.png` with the practice's real logo
- [ ] Confirm opening hours — the brand book does not state them
- [ ] Change the bundle identifier from Emergent's `com.emergent.surreyopticians.xkx2pz`
