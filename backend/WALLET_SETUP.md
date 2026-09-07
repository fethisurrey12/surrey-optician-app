# Wallet passes — connecting the practice's keys

The app already signs Apple `.pkpass` coupons and Google Wallet save links. It only needs
the practice's credentials. Until they are present `/api/wallet/status` returns
`apple: false` / `google: false` with a `missing` list, and the app shows the pass preview
with a prototype "Simulate" control instead of a real Wallet hand-off.

Put files in `backend/secrets/` (git-ignored) and fill `backend/.env`, then restart the
backend. Check `GET /api/wallet/status` — both flags should read `true`.

## Apple Wallet (about 15 minutes, needs an Apple Developer Program account)

1. developer.apple.com → **Certificates, Identifiers & Profiles → Identifiers → +** →
   *Pass Type IDs*. Create e.g. `pass.co.uk.surreyopticians.reward`.
2. **Certificates → +** → *Pass Type ID Certificate* → pick that identifier → upload a CSR
   from Keychain Access (Certificate Assistant → Request a Certificate from a Certificate
   Authority → Saved to disk). Download and double-click the `.cer` to install it.
3. In Keychain Access, right-click the new "Pass Type ID: …" certificate → **Export** → `.p12`
   → set a password. Save as `backend/secrets/apple_pass.p12`.
4. Download Apple's WWDR intermediate (G4) from apple.com/certificateauthority →
   `backend/secrets/wwdr.cer`.
5. Team ID: developer.apple.com → Membership details (10 characters).

```
APPLE_PASS_TYPE_ID=pass.co.uk.surreyopticians.reward
APPLE_TEAM_ID=ABCDE12345
APPLE_P12_PATH=secrets/apple_pass.p12
APPLE_P12_PASSWORD=the-export-password
APPLE_WWDR_PATH=secrets/wwdr.cer
```

(PEM pair via `APPLE_CERT_PATH` / `APPLE_KEY_PATH` also works if you prefer openssl.)

## Google Wallet (about 15 minutes, needs a Google Cloud project)

1. pay.google.com/business/console → sign up as a Wallet issuer → note the **Issuer ID**.
2. console.cloud.google.com → enable **Google Wallet API** → IAM → *Service Accounts* →
   create one → *Keys → Add key → JSON*. Save as `backend/secrets/google-wallet.json`.
3. Back in the Wallet Console → **Users** → add the service account's email with Developer access.
4. New issuers start in demo mode (passes work only for test users listed in the console);
   request publishing access from the console when ready to go live.

```
GOOGLE_ISSUER_ID=3388000000012345678
GOOGLE_SERVICE_ACCOUNT_JSON=secrets/google-wallet.json
PUBLIC_ORIGIN=https://surreyopticians.co.uk
```

## Verifying

```
curl -s https://<backend>/api/wallet/status
curl -s -o t.pkpass "https://<backend>/api/wallet/apple/SO-TEST-0001.pkpass?expires=2027-12-31&member=Test"
unzip -l t.pkpass        # pass.json, manifest.json, signature, icon*.png, logo*.png
```

Open the `.pkpass` on an iPhone (AirDrop or Safari) — Wallet should offer **Add**. Open the
Google link on Android Chrome — Wallet should offer **Save**. Neither can be tested in Expo Go
or the web preview; use a device build from **Publish → Generate iOS and Android builds**.
