# Connect Auth to Obelix API

Wire Login & Register to the real Obelix auth endpoints, validate inputs, store the JWT, and force re-login when the token is missing/expired. Signup will trigger an email verification step before the user can sign in.

## Heads-up before we build

1. **Login URL**: the curl you shared points to `/auth/signup` but the response shape (accessToken, refreshtoken, jti, twoFactorLogin) is clearly a **login** payload. I'll wire login to `POST /api/obelix/v1/auth/login` with `{ email, password }`. One-line change in `src/lib/api.ts` if the path differs.
2. **Host reachability**: `http://quickteller-merchant-ui.test.kube.iswke` is an internal Kubernetes hostname over plain HTTP. The HTTPS browser preview cannot reach it (DNS + mixed-content). Options:
   - public HTTPS gateway URL, or
   - a Lovable Cloud edge function that proxies the call (recommended), or
   - run locally on the same VPN.

   I'll make the base URL configurable via `VITE_API_BASE_URL` (defaulting to the value you gave) so it lights up the moment the host is reachable. Tell me if you want me to add the proxy edge function in the same pass.

## Files

**New**
- `src/lib/api.ts` — fetch wrapper:
  - Reads base URL from `import.meta.env.VITE_API_BASE_URL`.
  - Generic `request<T>()` returning `ApiResponse<T>` and unwrapping `data`.
  - Attaches `Authorization: Bearer <token>` when present.
  - On HTTP 401 (or auth error code in envelope): clears session and dispatches a `verve:unauthorized` window event.
  - Throws `ApiError { code, description, errors }` on non-success so UIs can show server messages.
- `src/lib/auth-api.ts` — typed endpoints:
  - `login({ email, password })` → `LoginData` (accessToken, refreshtoken, jti, email, mobileNo, scope, tokenType, twoFactorLogin).
  - `signup({ firstName, lastName, phoneNumber, email, password, confirmPassword })` → `SignupData` (id, email, firstName, lastName, username). **accessToken is ignored on signup** — the user must verify their email first.
  - `resendVerification(email)` — best-effort call to `POST /auth/verify-email/resend` (graceful no-op if endpoint isn't live yet).
- `src/lib/validation.ts` — `zod` schemas (loginSchema, signupSchema with E.164 phone + password rules + confirmPassword refine).
- `src/types/api.ts` — `ApiResponse<T>`, `LoginData`, `SignupData`, `ApiError`.
- `src/pages/VerifyEmail.tsx` — post-signup screen:
  - Shows "Check your inbox" with the masked email (e.g. `j•••@gmail.com`) read from `location.state` or `?email=` query param.
  - "Resend email" button (60s cooldown) → calls `resendVerification`.
  - "I've verified, sign in" button → routes to `/login` with email prefilled via `state`.
  - Lightweight illustration / mailbox icon, matches existing `ScreenHeader` styling.
- `.env.example` — documents `VITE_API_BASE_URL`.

**Edited**
- `src/store/app-store.tsx`
  - Add `accessToken`, `refreshToken` to state; persist with the user in `localStorage`.
  - `login(email, password)` calls `auth-api.login`, stores tokens, hydrates `User` from response (`email`, `mobileNo`, name fallback from email local-part until profile endpoint exists).
  - New `register(payload)` calls `auth-api.signup`, returns `{ ok, email, error? }`. **Does not log the user in and does not store any token returned by signup.**
  - `logout()` clears tokens + user + storage.
  - Subscribes to `verve:unauthorized` → `logout()` (AppShell already redirects when `!isAuthed`) and shows a "Session expired" toast.
  - `loginBiometric` is gated on a previously stored real token (cannot bypass first-run auth).
- `src/pages/Login.tsx`
  - Identifier becomes **Email** (matches API). Drop the phone demo hint.
  - PIN input becomes a password (min 8) with show/hide toggle.
  - Validates with `loginSchema`; inline field errors + toast for server `description`.
  - Reads prefilled email from `location.state` (set by Register/VerifyEmail).
  - On success → `nav('/app')`. On `twoFactorLogin === true` → toast "2FA required" (full 2FA flow out of scope here).
- `src/pages/Register.tsx`
  - Single-step form (drop the fake OTP step). Fields: `firstName`, `lastName`, `phoneNumber`, `email`, `password`, `confirmPassword` — matching the signup contract; `idNumber` removed.
  - Validates with `signupSchema`; field-level errors.
  - On success → `nav('/verify-email', { state: { email } })`. **No token is stored.**
- `src/App.tsx` — register `/verify-email` route (public).
- `src/components/AppShell.tsx` — listen for `verve:unauthorized` as a safety net to force redirect to `/login` immediately with a toast.

## Auth flow (this pass)

```text
Register form  ──signup──▶  /verify-email  ──user clicks link in email──▶  /login (email prefilled)
                                                                                │
                                                                                ▼
                                                                         login → /app
```

- Signup response's `accessToken` is **discarded**. We only keep `email` to drive the verify screen.
- Login stores `accessToken` + `refreshtoken` in localStorage; every API call goes through `request()`.
- On `401` (or known auth error codes), tokens cleared + `verve:unauthorized` event → `AppShell` redirects to `/login` with "Session expired, please sign in again."
- Refresh-token rotation is **deferred** as you asked. `refreshtoken` is stored but unused.

## Validation rules (zod)

```text
loginSchema:   email (email, max 255), password (min 8, max 72)
signupSchema:  firstName/lastName trim 1..50,
               phoneNumber matches /^\+?[1-9]\d{7,14}$/,
               email valid + max 255,
               password min 8 + must include letter & digit,
               confirmPassword === password
```

Errors render under each field; toast surfaces server `description` / first `errors` entry.

## What I will NOT change

- Cards / Withdraw / Lipa Faster / Bills stay on mock data — only auth is wired up now.
- No refresh-token logic yet.
- No real verification-link handler page (the email link is handled by the backend host); we just instruct the user to verify and return.

## Open question

Want me to add a Lovable Cloud edge function that proxies `/api/obelix/*` to the internal host? Without it, the browser preview will fail to reach `*.test.kube.iswke`. If yes, I'll add it in the same change and point `VITE_API_BASE_URL` at the function URL.
