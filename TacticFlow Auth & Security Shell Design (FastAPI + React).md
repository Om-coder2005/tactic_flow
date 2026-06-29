# TacticFlow Auth & Security Shell Design (FastAPI + React)

## 1. Purpose

This document defines how TacticFlow should implement authentication, CSRF protection, and HTTP security headers when moving from a localStorage + Bearer JWT prototype to a production-ready httpOnly cookie model.
It is designed to sit alongside the existing TacticFlow Master Build Spec and the v1 Implementation Status Audit, focused specifically on the "SaaS shell" (auth, cookies, CSRF, headers, and frontend integration).[^1][^2]

## 2. High-Level Goals

- Replace localStorage JWT storage with httpOnly, secure cookies for both guest and registered users.[^3][^4]
- Introduce a clear CSRF strategy suitable for cookie-based auth in a mostly same-origin app.[^5][^4]
- Standardise how the React frontend talks to the FastAPI backend without ever reading tokens directly.
- Attach a robust set of HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) via middleware rather than ad-hoc per-route configuration.[^6][^7][^8]

## 3. Auth Model Overview

### 3.1 From Bearer + localStorage to httpOnly cookies

Current prototype:
- Stores JWT tokens in localStorage and sends them in the `Authorization: Bearer` header.[^2]
- This exposes tokens to any injected JavaScript in case of XSS.

Target model:
- Keep JWT as the stateless session primitive but store tokens in httpOnly cookies set by FastAPI.[^9][^10]
- React never reads or writes tokens directly; tokens are handled entirely by the server and browser cookie mechanism.[^11][^3]

### 3.2 Tokens and Lifetimes

Recommended structure:
- `access_token` cookie (short-lived, e.g. 15–30 minutes) used on every API request to authenticate the user.
- `refresh_token` cookie (longer-lived, e.g. 7–30 days) used only on `/auth/refresh` to issue new access tokens.[^10][^4]

Cookie flags:
- `httponly=True` so JavaScript cannot read tokens.[^4][^3]
- `secure=True` in production (HTTPS only).
- `samesite="Strict"` or `"Lax"` to reduce CSRF risk depending on cross-site needs.[^12][^4]

## 4. FastAPI Auth Endpoints and Behaviour

### 4.1 Endpoints

Required endpoints (aligned with the Master Build Spec naming):[^1]

- `POST /auth/register`
  - Body: `{ email, password }`.
  - Hashes password and creates user record.
  - Returns a user DTO and sets `access_token` and `refresh_token` cookies.

- `POST /auth/login`
  - Body: `{ email, password }`.
  - Verifies credentials.
  - Issues new tokens and sets cookies.

- `POST /auth/logout`
  - Clears `access_token` and `refresh_token` cookies by setting expired cookies.

- `GET /auth/me`
  - Reads user from `access_token` cookie.
  - Returns `{ user: UserPublic | null }`.

- `POST /auth/refresh`
  - Reads and verifies `refresh_token` cookie.
  - Issues a new `access_token` cookie, optionally rotates refresh token.

- `POST /auth/guest`
  - Creates a temporary guest user or guest session.
  - Sets tokens in cookies with the same mechanism as registered users.

- `POST /auth/convert-guest`
  - Body: `{ email, password }`.
  - Converts existing guest-owned projects to a new registered user.
  - Clears guest session token and sets normal user cookies.

### 4.2 Implementing httpOnly Cookies in FastAPI

Patterns from FastAPI references:
- After creating a JWT (e.g. with `python-jose`), use `response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="Strict", path="/", max_age=...)` in the route handler.[^9][^10]
- For refresh tokens, use a different cookie name (`refresh_token`) and longer `max_age`.

Auth dependency:
- Instead of reading the token from the `Authorization` header, a custom FastAPI dependency extracts `access_token` from `request.cookies["access_token"]` and validates it.
- This dependency is used in all routes that require authentication.

Libraries and examples show that this pattern is common and well supported in FastAPI, including using third-party JWT libraries configured for cookie storage.[^13][^10][^9]

## 5. CSRF Protection Strategy

### 5.1 Why CSRF Matters Now

With headers-based tokens, CSRF risk is lower but XSS risk is higher; with cookies, tokens are not readable from JS but will be sent automatically on cross-site requests unless `SameSite` and CSRF protections are correctly configured.[^4]
A CSRF strategy complements SameSite cookies and ensures state-changing endpoints are protected.

### 5.2 Double-Submit Cookie Pattern

A common approach discussed in FastAPI and JWT-in-cookies communities:[^5][^13]

- On login (or guest creation), server sets a second non-httpOnly cookie `csrf_token` containing a random secret.
- For any `POST/PUT/PATCH/DELETE` request, the React client reads `csrf_token` from `document.cookie` and sends it in a custom header `X-CSRF-Token`.
- Backend middleware or dependencies compare the header and cookie values; if they do not match, the request is rejected with `403`.

Combined with:
- `SameSite` flags on auth cookies.
- HTTPS-only cookies in production.

This pattern is simple to implement in FastAPI and is widely used with JWT-in-cookie auth.[^5][^4]

### 5.3 Scope of CSRF Checks

- Apply CSRF verification to all state-changing API routes (`POST`, `PUT`, `PATCH`, `DELETE`).
- Exempt `GET`, `HEAD`, and `OPTIONS` from CSRF checks.

Implementation details:
- A small FastAPI dependency or middleware checks `csrf_token` cookie and `X-CSRF-Token` header.
- If absent or mismatched, return `HTTPException(status_code=403, detail="CSRF token invalid")`.

## 6. React Integration Pattern

### 6.1 Removing Token Handling from React

Guidance from React + httpOnly cookie references:
- React does not read JWTs or cookies directly; instead it:
  - Posts credentials to `/auth/login` or `/auth/register`.
  - Relies on cookies set by the server through `Set-Cookie` headers.
  - Calls an endpoint such as `/auth/me` to obtain the current user profile.[^3][^11]

### 6.2 API Client Configuration

For same-origin or API under the same domain:
- Use `fetch` or `axios` without manually adding tokens; cookies are automatically attached.

For different origins (e.g. `app.example.com` and `api.example.com`):
- Enable credentials:
  - `fetch(url, { method, credentials: 'include', headers: { 'X-CSRF-Token': csrfToken, ... } })`.
  - or axios `axios.defaults.withCredentials = true`.
- Configure CORS on FastAPI to allow credentials from the frontend origin.

### 6.3 React Auth Flow for TacticFlow

Recommended flow:
- On app startup:
  - Call `/auth/me` to check session.
  - If user present, populate `authStore` with user data.
  - If null, call `/auth/guest` to create a guest session and retry `/auth/me`.

- On login/register:
  - Submit form to backend.
  - On success, call `/auth/me` and update `authStore` and load projects.

- On logout:
  - Call `/auth/logout`.
  - Clear client-side auth state and optionally re-initiate a guest session.

Throughout:
- Never store JWTs in `localStorage` or `sessionStorage`.
- Store only user profile and flags (logged in, guest, etc.) in React state.

## 7. Security Headers & CSP for FastAPI

### 7.1 Motivation

TacticFlow should ship with sensible HTTP security headers by default to reduce clickjacking, MIME sniffing, content injection, and XSS vectors beyond what cookies and CSRF address.[^8][^6]

Key headers:
- `Content-Security-Policy` (CSP): restricts what sources scripts, styles, and media can be loaded from.
- `X-Frame-Options` or equivalent CSP frame-ancestors directive: prevents clickjacking.
- `Strict-Transport-Security` (HSTS): forces HTTPS.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy`.

### 7.2 Using a Middleware Library

Rather than hand-rolling headers for each route, an ASGI/Starlette/FastAPI middleware can be added once for the entire app.[^7][^14][^6]

Options from the ecosystem:
- **Secweb**: An ASGI/FastAPI middleware that adds a comprehensive set of security headers; it can be configured with an Option object specifying header behaviour.[^6][^8]
- **secure v2**: A modern Python package for HTTP security headers, which integrates with FastAPI via a middleware that attaches headers to each response.[^7]

Implementation example:
- Install the library.
- In `main.py`, wrap the FastAPI app:
  - e.g. `SecWeb(app=app)` or `app.add_middleware(ASGIMiddleware, secure_headers=secure_headers.with_default())`.

Then refine CSP to allow:
- `self` for scripts and styles (bundled React app).
- Allowed CDN or font origins if used.
- Static export domain for images or PDFs, if separate.

## 8. Recommended Implementation Order

Based on the current TacticFlow status (engine and canvas already strong, auth and headers pending), the following order is recommended:[^2]

1. **Implement auth endpoints and move tokens to httpOnly cookies**
   - Add `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/refresh`.
   - Migrate existing guest auth to cookie-based tokens.

2. **Add CSRF protection for write operations**
   - Implement double-submit cookie pattern (`csrf_token` + `X-CSRF-Token`).
   - Enforce checks on all non-GET routes.

3. **Update React API client to use credentials and `/auth/me`**
   - Remove localStorage token handling.
   - Ensure all write requests send `X-CSRF-Token` header.

4. **Attach security header middleware**
   - Add Secweb or secure v2 middleware to FastAPI.
   - Tune CSP and other headers as needed.

Once these steps are completed, TacticFlow will have a security and auth shell aligned with the Master Build Spec and modern best practices, making it safer to expose as a multi-user SaaS while preserving the strong tactical engine already built.[^1][^2]

---

## References

1. [TacticFlow_Master_Build_Spec.md](./TacticFlow_Master_Build_Spec.md) - **TACTICFLOW**

Master Build Specification

*For AI Coding Agents · Antigravity · Codex · Claude...

2. [TacticFlow-v1-Implementation-Status-Audit-Document.md](./TacticFlow%20v1%20Implementation%20Status%20&%20Audit%20Document.md) - # TacticFlow v1 Implementation Status & Audit Document

## 1. Purpose of This Document

This document...

3. [Use httpOnly cookie To Secure Your React App | by Etearner - Medium](https://medium.com/@etearner/use-httponly-cookie-to-secure-your-react-app-4e8417d136b8) - How to enhance your React app’s security by using httpOnly cookies to protect session tokens from XS...

4. [securing JWTs for authentication, httpOnly cookies, CSRF tokens ...](https://dev.to/petrussola/today-s-rabbit-hole-jwts-in-httponly-cookies-csrf-tokens-secrets-more-1jbp) - The JWT needs to be stored inside an httpOnly cookie, a special kind of cookie that's only sent in H...

5. [Why does JWT cookie CSRF Protect function like this? : r/FastAPI](https://www.reddit.com/r/FastAPI/comments/121vip0/why_does_jwt_cookie_csrf_protect_function_like/) - All four cookies from what I can see are marked as HTTP only, adding X-CSRF-Token along with the Acc...

6. [Introducing Secweb security headers for FastAPI and Starlette ...](https://dev.to/tmotagam/introducing-secweb-security-headers-for-fastapi-and-starlette-framework-4ohl) - Secweb is a library of middlewares that helps you in setting security headers in FastAPI and Starlet...

7. [secure v2: HTTP security headers for FastAPI apps - Reddit](https://www.reddit.com/r/FastAPI/comments/1stg4iu/secure_v2_http_security_headers_for_fastapi_apps/) - I just released secure v2, a Python library for managing HTTP security headers without scattering po...

8. [Add security headers as middlewares · Issue #4420 - GitHub](https://github.com/fastapi/fastapi/issues/4420) - First Check I added a very descriptive title to this issue. I used the GitHub search to find a simil...

9. [FastAPI : Securing JWT token with HttpOnly Cookie](https://fastapitutorial.medium.com/fastapi-securing-jwt-token-with-httponly-cookie-47e0139b8dde) - Resources:

10. [Building a Secure Authentication System in FastAPI Using Cookies ...](https://www.linkedin.com/pulse/building-secure-authentication-system-fastapi-using-jwt-parasuraman-k4xac) - In this article, we will demonstrate how to create an authentication system in FastAPI using JWT tok...

11. [How to get HTTP-only cookie in React? - Stack Overflow](https://stackoverflow.com/questions/68970499/how-to-get-http-only-cookie-in-react) - I'm currently developing a MERN stack application and the authentication I use is JWT and saving it ...

12. [httpOnly cookies with React and Node](https://stackoverflow.com/questions/66814915/httponly-cookies-with-react-and-node) - I'm trying to figure out how to implement authentication/authorization with React and Node, using ht...

13. [Reading Cookie from React (backend with FastAPI + fastapi-jwt-auth)](https://stackoverflow.com/questions/66418145/reading-cookie-from-react-backend-with-fastapi-fastapi-jwt-auth) - For sessions you should use HttpOnly because its pretty much the same algorithm every time on JWT, C...

14. [Advanced Middleware - FastAPI](https://fastapi.tiangolo.com/advanced/middleware/) - FastAPI framework, high performance, easy to learn, fast to code, ready for production

