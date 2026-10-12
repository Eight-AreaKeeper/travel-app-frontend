# travel-app-frontend

Web client for **TravelPass**, a travel app where people share travel notes and get a personalized, day-by-day
itinerary generated from a short Q&A. Built with React 19, TypeScript and Vite.

It talks to the REST API in **[travel-app-backend](https://github.com/Eight-AreaKeeper/travel-app-backend)**
(Spring Boot); you need that running to use the app.

## Features

- **Travel notes & guides**: browse, search and filter notes by destination, trip length and budget; read a note with its day-by-day route; comment, like and favorite.
- **Publish notes**: write a note with a cover image, photos, tags, cost and a structured daily route.
- **Customize my trip**: a step-by-step Q&A (destinations, days, dates, departure city, budget, travelers, style). It works before logging in; the answers are attached to your account when you log in.
- **Itinerary result**: watches the generation progress, then shows the plan day by day. Swap an item for a suggested alternative, edit or delete items, regenerate with a new budget or length, or export a PDF.
- **Account**: sign up with an SMS code, log in, edit your profile and avatar, and see your favorites and past trips.

## Tech stack

- [React 19](https://react.dev/) + TypeScript
- [Vite](https://vite.dev/) (dev server + build)
- [React Router](https://reactrouter.com/) for client-side routing
- [Zustand](https://github.com/pmndrs/zustand) for auth state
- [Axios](https://axios-http.com/) for API calls
- [Radix UI](https://www.radix-ui.com/) (Dialog) + [lucide-react](https://lucide.dev/) icons

## Project structure

```
src/
├── api/          Typed API client functions (one file per backend module), shared http instance, types.ts
├── components/   Reusable UI: nav bar, toast host, destination picker, note card, question field, feedback banner
├── lib/          Small helpers (formatting, pending customize-session persistence)
├── pages/        Route-level screens: Home, Guides, NoteDetail, NoteEditor, Login, Customize, Profile, Favorites, ItineraryResult, MyTrips
├── store/        Zustand stores (auth)
├── styles/       Global CSS + design tokens
├── App.tsx       Route table + shared layout
└── main.tsx      Entry point
```

## Getting started

Requires Node.js 20+.

1. Start the backend first: follow the setup in [travel-app-backend](https://github.com/Eight-AreaKeeper/travel-app-backend#getting-started) so the API is on `http://localhost:8080`.
2. Install and run the frontend:

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` and `/uploads/*` to `http://localhost:8080`
(see `vite.config.ts`), so no CORS or environment configuration is needed for local development. If your backend runs
elsewhere, change the proxy targets in `vite.config.ts`.

To sign up locally, request an SMS code on the sign-up page and read it from the backend log (`phone=... code=...`);
the backend does not send real SMS messages.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc`) and build for production into `dist/` |
| `npm run preview` | Preview the production build locally |

For production, serve `dist/` from any static host and route `/api` and `/uploads` to the backend (for example with an
nginx reverse proxy), and fall back to `index.html` for client-side routes.

## Backend contract

- All calls go through the shared Axios instance in `src/api/http.ts` with base URL `/api/v1`.
- The backend wraps every response as `{ code, message, data }` and returns business errors as **HTTP 200 with a non-zero `code`**. The response interceptor treats any `code !== 0` as an error and throws an `ApiError` with that code and message.
- The access token is sent as `Authorization: Bearer <token>`. On a `401` / `code 40100` the interceptor refreshes the token once with the stored refresh token and retries the request; if that fails, the user is logged out.
- Anonymous customize sessions send their `X-Session-Token` header until they are bound to an account.
- `src/api/types.ts` mirrors the backend DTOs. The complete endpoint reference is the backend's knife4j docs at `http://localhost:8080/doc.html`.
