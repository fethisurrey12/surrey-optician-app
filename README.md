# Surrey Opticians — loyalty app

A customer loyalty app for Surrey Opticians, an independent optometry practice
with branches in Coulsdon, Wallington and Banstead. Members earn a point for
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
| Voucher term | 18 months from issue |
| Redemption | Manual, at the till — the app never redeems itself |
| Referrals | Both parties earn a bonus point on the friend's first purchase |

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
| `GET /wallet/status` | public | What wallet signing material is missing |

Members authenticate with a bearer token; the till presents `X-Staff-Key`.

## Booking

"Book an eye test" on Home and "Book online" on Branches hand the patient to
the practice's own booking page:

    https://www.surreyopticians.co.uk/book-appointment

It opens in an in-app browser on a phone and a new tab on web. The URL lives in
`frontend/src/lib/booking.ts`. Because booking happens on that page, the app
does not hold a diary and does not know which slots are free — whatever runs
that page owns availability.

## Before going live

- [ ] Set `JWT_SECRET` — an unset one is regenerated per boot and signs everyone out
- [ ] Set `EXPOSE_DEV_OTP=false` — otherwise the sign-in code is returned in the API response
- [ ] Set `CORS_ORIGINS` to the real origins rather than `*`
- [ ] Set `SMS_PROVIDER=twilio` with credentials, so codes actually reach members
- [ ] Set `STAFF_API_KEY` before the till can post purchases
- [ ] Set `SEED_DEMO_DATA=false` on the practice's deployment
- [ ] Add the Apple and Google Wallet signing material — see `backend/WALLET_SETUP.md`
