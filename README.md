# vyneDemo — Playwright Test Automation Framework

UI and API test automation for two demo applications, built with **Playwright + TypeScript** on
a four-layer architecture.

| Target                                                                | What it is                | Suite         |
| --------------------------------------------------------------------- | ------------------------- | ------------- |
| [saucedemo.com](https://www.saucedemo.com/)                           | Swag Labs e-commerce demo | UI — 20 tests |
| [jsonplaceholder.typicode.com](https://jsonplaceholder.typicode.com/) | Fake REST API             | API — 4 tests |

**24 tests, all passing.** UI 6s, API 1s.

Coverage is organised as **end-to-end user journeys**, not as a CRUD matrix — SauceDemo has no
order update, no order cancellation and no editable cart quantity, so CRUD was the wrong frame for
it. See [docs/TEST-PLAN.md](docs/TEST-PLAN.md) Part 1 for the reasoning.

A UI run reports **21 passed**: the 20 journeys plus one authentication step executed as a project
dependency.

---

## Quick start

```bash
git clone git@github.com:Daniel-Shiosaky/vyneDemo.git
cd vyneDemo

npm ci                        # install dependencies
npm run install:browsers      # download Chromium
cp .env.example .env          # then set PASSWORD (see Configuration)

npm run test:ui               # 20 UI journeys (+ 1 auth setup step)
npm run test:api              # 4 API journeys
```

Requires **Node 20+**.

> Run the two suites separately, as above. `npx playwright test` with no `--project` runs both.

## The four layers

Each layer has exactly one job. This is the rule that keeps the suite maintainable as it grows.

| Layer         | Location                                                      | Contains                                                                                         | Must NOT contain                                                |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| **spec**      | `ui/spec/*.test.ts`, `api/spec/*.test.ts`                     | Test names, navigation, page-object calls, validator calls                                       | Locators, `expect()`, implementation logic                      |
| **page**      | `ui/page/*.page.ts`                                           | `private readonly` locators, user actions (`addProductToCart()`), locator getters for validators | `expect()` — **enforced by ESLint**                             |
| **validator** | `ui/validator/*.validator.ts`, `api/validator/*.validator.ts` | Every `expect()`                                                                                 | Locators — it reaches elements only through page-object getters |
| **util**      | `ui/util/*.util.ts`, `api/util/*.util.ts`                     | API clients, auth helpers, multi-page flows, pure helpers                                        | Assertions                                                      |

A spec therefore reads as intent:

```ts
test('Verify user can finish checkout and see the order confirmation', async ({
  checkoutFlow,
  checkoutOverviewPage,
  checkoutValidator,
}) => {
  await checkoutFlow.goToOverview(ORDERED_PRODUCTS);

  await checkoutOverviewPage.finishOrder();

  await checkoutValidator.verifyOrderIsConfirmed();
});
```

The page/validator boundary is not just a convention — `ui/page/**` is lint-blocked from
importing `expect`:

```
error  'expect' import from '@playwright/test' is restricted. Page objects must not assert.
       Move the expect() into the matching ui/validator/*.validator.ts
```

## Project structure

Two top-level suites, one for UI and one for API, with the layers inside each:

```
vyneDemo/
├── playwright.config.ts                 # projects, timeouts, reporters, testIdAttribute
├── auth.setup.ts                        # logs in once -> .auth/standard.json
│
├── ui/                                  # ─── UI AUTOMATION ───
│   ├── fixtures.ts                      #   injects pages, validators and the checkout flow
│   ├── spec/                            #   ← E2E journeys only
│   │   ├── login.test.ts                #     sign in / sign out / rejections
│   │   ├── product-catalog.test.ts      #     browse + sort
│   │   ├── cart.test.ts                 #     add / remove items
│   │   └── checkout.test.ts             #     overview, cancel, finish, PDF, return home
│   ├── page/                            #   ← locators + actions, no expect()
│   │   ├── base.page.ts                 #     shared contract: path + waitUntilReady()
│   │   ├── header.component.ts          #     cart badge + burger menu, shared by all pages
│   │   ├── login.page.ts
│   │   ├── inventory.page.ts            #     the product catalog
│   │   ├── cart.page.ts
│   │   ├── checkout-information.page.ts
│   │   ├── checkout-overview.page.ts
│   │   └── checkout-complete.page.ts
│   ├── validator/                       #   ← assertions only, no locators
│   │   ├── login.validator.ts
│   │   ├── inventory.validator.ts
│   │   ├── cart.validator.ts
│   │   └── checkout.validator.ts        #     incl. PDF receipt content
│   ├── util/
│   │   ├── auth.util.ts                 #   storageState path + SIGNED_OUT
│   │   ├── checkout-flow.util.ts        #   multi-page journey helper
│   │   ├── price.util.ts                #   parse/format money, tax maths, locator slugging
│   │   └── pdf.util.ts                  #   PDF text extraction (Node zlib only)
│   ├── data/const/                      #   product, user, checkout, message constants
│   └── types/                           #   *.interface.ts
│
├── api/                                 # ─── API AUTOMATION ───
│   ├── fixtures.ts
│   ├── spec/post.test.ts                #   4 journeys against /posts
│   ├── validator/post.validator.ts
│   ├── util/
│   │   ├── base-api.util.ts             #   GET/POST/PUT/DELETE, JSON parsing, logging
│   │   └── post-api.util.ts             #   domain utility for /posts
│   ├── schema/post.schema.ts            #   Zod response contract
│   ├── data/const/post.const.ts
│   └── types/api.interface.ts
│
├── shared/const/env.const.ts            # the ONLY module that reads process.env
├── docs/
│   ├── EXPLORATION-FINDINGS.md          # ⭐ everything learned from the live apps
│   ├── TEST-PLAN.md                     # ⭐ the journeys + why not CRUD
│   └── EVALUATION.md                    #    what worked, what did not, what changed
└── .github/workflows/playwright.yml     # 2 jobs: API tests, UI tests
```

**Start with [docs/EXPLORATION-FINDINGS.md](docs/EXPLORATION-FINDINGS.md).** It records every app
behaviour, locator quirk, defect and framework gotcha verified against the live systems.
[docs/EVALUATION.md](docs/EVALUATION.md) reviews how the framework got here — what worked, what did
not, and what changed across three rewrites.

## Configuration

All environment configuration lives in **one** module, `shared/const/env.const.ts`. It is the
only file that touches `process.env` — specs, page objects and API utilities import `ENV` from
it. A missing variable fails immediately with an actionable message.

```bash
cp .env.example .env
```

Then set the one required secret:

```dotenv
PASSWORD=<the shared password printed on the SauceDemo login page>
```

Copy it from the "Password for all users" panel on <https://www.saucedemo.com/>. It is
deliberately **not** written down in this repository: no credential is committed here, even one
the application publishes itself.

`.env` and `.auth/` are both gitignored — the latter holds live session cookies.

### CI secrets

Add these under **Settings → Secrets and variables → Actions**:

`PASSWORD`, `SAUCE_USERNAME`, `LOCKED_OUT_USERNAME`

The secret is named `SAUCE_USERNAME` but is injected as the `USERNAME` env var, to avoid colliding
with the runner's own `USERNAME`. Base URLs can be overridden with the `WEB_BASE_URL` /
`API_BASE_URL` repository _variables_.

## Authentication

SauceDemo has no login API, so a UI login is the only way to obtain a session. `auth.setup.ts`
does it **once** and saves the session to `.auth/standard.json`; the UI projects then start already
signed in via `storageState`.

That leaves the login form exercised only where it is the thing under test:

| Spec            | Session                                                   |
| --------------- | --------------------------------------------------------- |
| `login.test.ts` | `SIGNED_OUT` — drives the login form, that is its purpose |
| everything else | the standard account's saved session                      |

Two things worth knowing:

- **The cart is not part of storageState.** SauceDemo keeps it in sessionStorage, so every test
  still starts with an empty cart. Session reuse costs nothing in isolation.
- **Use `SIGNED_OUT`, never `storageState: undefined`,** to start a test signed out.
  `undefined` means "not specified", so the project-level session still applies and the test
  silently runs authenticated. `SIGNED_OUT` is an explicitly empty state.

`auth.setup.ts` runs as a **setup project** that the UI projects declare as a `dependency`, not
as `globalSetup`. `globalSetup` cannot tell which projects were selected, so it authenticated
even during `npm run test:api` — making an API-only run launch a browser and demand credentials
it does not need.

## Commands

| Command                               | What it does                           |
| ------------------------------------- | -------------------------------------- |
| `npm run test:ui`                     | UI suite (Chromium)                    |
| `npm run test:api`                    | API suite — no browser, no credentials |
| `npm run test:ui:headed`              | UI with a visible browser              |
| `npm run report`                      | Open the last HTML report              |
| `npm run verify`                      | Typecheck + lint + format check        |
| `npm run lint:fix` / `npm run format` | Auto-fix                               |
| `npm run install:browsers`            | Download Chromium                      |

> **Run `npm run verify` before pushing.** CI runs the two test suites only — it will not catch a
> type error, a lint violation or formatting drift.

Anything else is a direct Playwright invocation:

```bash
npx playwright test --project=ui-chromium cart                    # by filename
npx playwright test --project=ui-chromium --debug                 # Playwright Inspector
npx playwright test --project=ui-chromium --grep @known-issue     # only documented defects
npx playwright test --project=api --grep-invert @fake-api         # skip the mock-server test
API_DEBUG=1 npm run test:api                                      # log every API call
```

## Adding a test

1. **New assertion on an existing page?** Add a `verify…()` method to that page's validator.
2. **New element?** Add a `private readonly` locator plus a getter to the page object.
3. **New page?** Create `ui/page/<name>.page.ts` extending `BasePage`, a matching validator, and
   register both in `ui/fixtures.ts` (three lines each).
4. **New API resource?** Add a domain utility beside `post-api.util.ts`, a Zod contract beside
   `post.schema.ts`, and a validator. Register the utility and validator in `api/fixtures.ts`.
5. **New journey?** Add one test to the spec that owns that part of the funnel. Prefer extending
   an existing journey over adding a near-duplicate test.

## Test tags

| Tag            | Meaning                                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@known-issue` | Asserts **actual, buggy** behaviour of the app under test. Green means "the defect is still exactly as documented." If one fails, the app changed — check whether it was fixed, then invert the test. |
| `@fake-api`    | Assertions that only hold because JSONPlaceholder does not persist writes. The first tests to rewrite if this suite is pointed at a real backend.                                                     |

## Known application defects

All verified against the live applications. None are framework bugs.

Because the suite is now scoped to the journeys in scope, only the defects reachable from those
journeys are guarded. The rest stay recorded in
[docs/EXPLORATION-FINDINGS.md](docs/EXPLORATION-FINDINGS.md) so nothing found is lost.

**SauceDemo**

| Defect                                                                                           | Pinned by a test   |
| ------------------------------------------------------------------------------------------------ | ------------------ |
| **An empty cart can be checked out to completion**, producing a confirmed $0 order               | ✅ `@known-issue`  |
| **"Reset App State" does not reset buttons** — clears the badge, leaves every button on "Remove" | ✅ `@known-issue`  |
| Empty-cart subtotal renders `$0` while tax and total render `$0.00`                              | ✅ `@known-issue`  |
| **`problem_user` / `error_user` sort dropdown is inert** — the selection silently reverts        | ❌ documented only |
| **`problem_user` / `visual_user` broken images** — 404 placeholders                              | ❌ documented only |

**JSONPlaceholder**

| Defect                                                                                                        | Pinned by a test   |
| ------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Writes are never persisted** — `POST` returns 201 with an id that 404s on read                              | ✅ `@fake-api`     |
| **`PUT` to a non-existent id returns 500** instead of 404                                                     | ❌ documented only |
| **`DELETE` on a non-existent id returns 200** instead of 404                                                  | ❌ documented only |
| **No payload validation** — `POST {}`, unknown fields and wrong types all return 201                          | ❌ documented only |
| **Fake nested routes return the whole collection instead of 404** — `/posts/1/photos` returns all 5000 photos | ❌ documented only |

## Limitations

- **JSONPlaceholder persistence cannot be tested.** The server fakes all writes. One test asserts
  the observed non-persistence, tagged `@fake-api`.
- **PDF text extraction is not a general-purpose parser.** `pdf.util.ts` handles Flate-compressed
  streams with hex or literal string operators, which is what this application produces. If the
  receipt changes encoding the journey fails loudly rather than passing vacuously — verified by
  deliberately asserting a product that was not ordered.
- **No visual regression testing.** Would need per-platform screenshot baselines.
- **Chromium only.** No other browser is configured. To add one, run
  `npx playwright install <browser>` and copy the `ui-chromium` project block in
  `playwright.config.ts` with the matching `devices[...]` descriptor.
- **Rate limit.** JSONPlaceholder allows 1000 requests (`x-ratelimit-limit`). The suite is well
  under it.

## Troubleshooting

| Symptom                                            | Cause and fix                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Missing required environment variable "PASSWORD"` | No `.env`. Run `cp .env.example .env` and set the password.                              |
| `browserType.launch: Executable doesn't exist`     | Run `npm run install:browsers`.                                                          |
| Every UI test fails on setup                       | `ui-setup` could not authenticate — check `.env` against the accounts on the login page. |
| A test unexpectedly runs logged in                 | It used `storageState: undefined` instead of `SIGNED_OUT`.                               |
| `@known-issue` test fails                          | The app changed. Check whether the defect was fixed, then invert the test.               |
| API tests fail with 429                            | Rate limit reached. Wait, or `--workers=1`.                                              |

Failed runs attach a screenshot, a video and (on retry) a trace:

```bash
npx playwright show-trace test-results/<test-dir>/trace.zip
```
