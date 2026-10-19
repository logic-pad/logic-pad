# Localization (lingui)

This document describes how localization is implemented across the `logic-pad`
frontend repository and the `logic-pad-api` backend repository using
[lingui](https://lingui.dev/).

There are three independent sources of user-facing strings, each with a
different constraint:

| Source | Location | Constraint |
| --- | --- | --- |
| Frontend UI | `src/client` | Ordinary React app: use lingui's React + Vite integration |
| Puzzle logic | `packages/logic-core` | Tree-shakable: consumers that do not want strings must not pay for them |
| Backend | `logic-pad-api` | Stateless, per-request locale from `Accept-Language` |
| SSR | `src/ssr` | Crawler-facing HTML and canvas images; locale from the URL prefix, needs a CJK font |

Initial locales are `en` (source of truth) and `ja`. Adding a locale is additive:
append it to `locales`/`SUPPORTED_LOCALES` in the relevant config and let
Crowdin fill the catalog.

Every catalog in both repositories is a GetText `.po` file, because Crowdin
handles `.po` natively. See [§6](#6-extraction-compilation--crowdin) for the
tooling that keeps the three in sync.

---

## 1. Frontend UI — `src/client`

### 1.1 Wiring

- `@lingui/core` + `@lingui/react` (runtime), `@lingui/cli` +
  `@lingui/vite-plugin` (dev).
- `@tanstack/react-router` **≥ 1.140**, which is where the `rewrite` option used
  by [§1.5](#15-locale-prefixed-urls) landed. The repo was on 1.131.2 and had to
  be upgraded; see [§9](#9-tanstack-router-upgrade-1131--1170).
- `lingui.config.ts` (repo root) declares `locales: ['en','ja']` and catalogs at
  `src/client/locales/{locale}/messages`.
- `vite.config.ts` registers `lingui({ macroTransform: true })`, which both
  compiles `t`/`<Trans>` macros and turns `.po` imports into JS modules.
- `src/client/locales/i18n.ts` owns the lingui instance, the supported-locale
  list, URL→locale parsing, and `activateLocale()`.
- `src/client/state/locale.ts` exposes `useLocale` and `useActiveLocale`.
- `src/client/router/localeRewrite.ts` + `LocaleBridge.tsx` implement
  locale-prefixed URLs.
- `main.tsx` activates the locale named by the URL **before mounting**, so the
  tree renders translated on the first frame rather than flashing message ids.

### 1.2 Use `useLingui()`, not the bare macro

Inside React components always take `t` from the React binding:

```tsx
import { useLingui } from '@lingui/react/macro';

const { t } = useLingui();
// ...
<span>{t`Enable fancy animations`}</span>
```

`import { t } from '@lingui/core/macro'` looks equivalent but resolves against
the global instance and is **not** subscribed to `I18nProvider`, so such
components keep their previous language after a switch. Reserve the core macro
for non-React modules.

### 1.3 Catalog loading and fallback

`activateLocale(locale)` loads the `.po` catalog and the matching
`@logic-pad/core` locale bundle in parallel, then activates lingui and installs
the core locale (see [§2.4](#24-bridging-the-frontend-and-core-locale)).

**Memoize loading, never activation.** Concurrent calls for the same locale share
one import promise (`loadCatalogs`), so StrictMode's double render cannot fetch a
catalog twice — but `i18n.activate()` / `setCoreLocale()` run on *every* call.
Caching the activation alongside the load is a subtle bug: the first visit to a
locale works, and returning to it later silently keeps the previous language,
because the cached promise resolves without re-applying it. The symptom is
confusing precisely because everything else stays correct — the URL prefix,
`<html lang>`, the select's value and the rendered route all update; only the
translated text is stale.

Untranslated ids do **not** need manual handling: lingui resolves a missing
translation to the source-locale text at compile time
(`getTranslationsForCatalog` falls back to `sourceLocale` before finally falling
back to the id). `fallbackLocales` is therefore unnecessary and is deliberately
not configured.

### 1.4 Language picker

`src/client/components/settings/LocaleDropdown.tsx` (in the settings modal,
under "General") drives `useLocale()`. Its options are **endonyms** (`English`,
`日本語`): a language is always labelled in its own language, so these strings
must not be added to a catalog.

### 1.5 Locale-prefixed URLs

For SEO the address bar carries the language:

| URL | Serves |
| --- | --- |
| `logic-pad.com/…` | English (canonical default locale) |
| `logic-pad.com/ja/…` | Japanese |
| `logic-pad.com/en/…` | **301** to the same path without `/en` |

The backend is unaffected: it has no locale prefixes and keeps reading
`Accept-Language` per request ([§3](#3-backend--logic-pad-api)).

#### Why `rewrite` rather than `{-$locale}`

The i18n guide offers both. `/{-$locale}/about` puts the locale in the route
tree, which is the more type-safe option, but it means physically moving all ~48
route files under a `{-$locale}` directory and rewriting every relative import.
`createRouter({ rewrite })` achieves the same URLs by transforming the address
bar bidirectionally, so **no route file changes at all**:

```ts
// src/client/router/localeRewrite.ts
export const localeRewrite: LocationRewrite = {
  input: ({ url }) => {                 // /ja/solve/x → /solve/x
    currentLocale = parseLocale(url.pathname) ?? DEFAULT_LOCALE;
    url.pathname = stripLocalePrefix(url.pathname);
    return url;
  },
  output: ({ url }) => {                // /solve/x → /ja/solve/x
    if (currentLocale === DEFAULT_LOCALE) return url;
    url.pathname = url.pathname === '/'
      ? `/${currentLocale}`
      : `/${currentLocale}${url.pathname}`;
    return url;
  },
};
```

`input` runs whenever the router parses a browser URL; `output` runs when links
are generated and when history is written. `<Link to="/create">` therefore
renders `/ja/create` on a Japanese page for free.

#### The `commitLocation` trap

`commitLocation` compares the **internal** href (`isSameLocation` in
`router-core/router.js`) and skips the history write when it is unchanged. A
locale switch changes only the prefix, so the internal href is identical and the
address bar would never update. `navigate()` and `redirect()` are therefore
**useless for switching locale in place**.

`useLocale()` writes through the history layer instead
(`src/client/state/locale.ts`):

```ts
await activateLocale(next);
router.history.replace(localizeHref(next, location.href), location.state, {
  ignoreBlocker: true,
});
```

`history.replace` notifies subscribers, the router re-parses the URL (running
`input`, which updates `currentLocale`), and the tree re-renders with the new
`publicHref`. Because the matched route never changes, in-memory state survives —
an unsaved puzzle in the editor is not lost when the language changes.
`ignoreBlocker` is set for the same reason: leaving the editor warrants the
confirmation prompt, translating it does not.

#### The URL is the single source of truth

There is deliberately **no `localStorage` persistence** for the locale. An
earlier draft read the language from storage at boot, which made the rendered
language disagree with the URL (a `ja` preference serving English content at
`/`, or vice versa) and raced against the router's own rewrite. The prefix is
what crawlers index, what is bookmarked and what is shared, so it is authoritative:

- `main.tsx` activates `localeFromUrl()` before mounting, so the first frame is
  already translated.
- `useActiveLocale()` derives the locale from `router.state.location.publicHref`.
  Components rendering `@logic-pad/core` text must call it (see
  [§2.3](#23-everything-user-facing-must-be-lazy)) because that text bypasses
  `I18nProvider`.

Auto-redirecting `/` to `/ja` from `Accept-Language` is intentionally **not**
done: surprise redirects hurt crawling, and Google recommends serving the
default locale unprefixed.

#### `LocaleBridge`

`src/client/router/LocaleBridge.tsx` (mounted in `__root.tsx`) turns the prefix
into the SEO signals:

- **canonicalises `/en`** client-side, for entries that never reach the static
  server (dev, or a deep link resolved by the SPA fallback). Crawlers get the
  real 301 from the server instead.
- sets `<html lang>`, which `index.html` hardcodes to `en`.
- renders reciprocal `hreflang` alternates (`en`, `ja`, `x-default`) for the
  current path, so the two prefixes are recognised as one language cluster.

React 19 hoists the `<link>` elements into `<head>`, matching how the repo
already renders `<meta name="robots">` from a component body.

#### Server-side consequences

Locale prefixes are public URLs, so `src/ssr` had to follow:

- `src/ssr/index.ts` answers `/en…` with a **301** in `onRequest` (before route
  resolution — `onBeforeHandle` would never run, since the path matches no
  route). `pluginRoutes` now also recognises `/ja/(solve|collection|profile)/`.
- `src/ssr/routes/ssr.ts` registers the three SSR pages under both `''` and
  `/ja`, and stamps `<html lang="ja">` on the prefixed variant via `withLang`.
  They are written out explicitly rather than with `group()`: `group(prefix,
  cb)` expects you to register on the scoped instance it hands you, and returning
  a freshly built `Elysia` from the callback silently mounts nothing.
- `src/ssr/routes/sitemap.ts` emits every entry with `links` alternates for
  `en`/`ja`/`x-default`, so `/ja/…` pages are discovered as translations rather
  than as unrelated pages.

#### Known limitation: link `href` attributes go stale across an in-app switch

After switching language in the settings modal, `<a href>` attributes already on
screen keep the prefix (or absence of one) they were rendered with. Fresh loads
and left-clicks are correct; the exposure is limited to **middle-click, "open in
new tab" and "copy link address"** on a link that predates the switch.

The cause is inside TanStack Router, not in our rewrite. `useLinkProps` derives
its href through a per-route "link scope" (`matchContext.js`) that rebuilds only
when the location object identity changes *and* the route is not departing, and
`Link` is wired to it via `useSyncExternalStore`. A prefix-only swap changes the
public href but not the matched route, and the rendered links do not recompute —
verified by forcing a brand-new location object into `router.stores.location`
from the console, which still did not refresh them.

Approaches tried and rejected, each confirmed empirically rather than reasoned
about:

| Approach | Outcome |
| --- | --- |
| Clear `router.staticLocations` (private `WeakMap` href memo) | No effect; also reaches into a `private` field |
| Track locale as module state instead of reading `window.location` | No effect on links; the hrefs are not lagging, they are frozen |
| `router.invalidate()` (public API) | No effect |
| Return a new `URL` from `output` instead of mutating | Correct in principle — `buildLocation` reads `href` off the object it passed us *after* calling `output`, so mutation leaks the prefix into the internal href — but no observable symptom changed, and it allocates on every link render. Reverted |

A fix would need either remounting the tree (which discards the unsaved editor
buffer — the exact thing `history.replace` exists to protect) or threading a
locale-dependent `key` through every link-bearing component. Neither is
proportionate to a cosmetic edge case in a rarely-used flow, so it is accepted
and documented instead.

---

## 2. `@logic-pad/core` — tree-shakable optional locale

### 2.1 The facade

`src/locale/index.ts` exports `setLocale`, `getLocale`, the `Locale` type, and a
translation facade:

```ts
export const i18n = {
  t(id: string, values?: Values): string {
    return activeLocale ? activeLocale.i18n.t(id, values) : id;
  },
};
```

Two details are load-bearing:

- **The binding is named `i18n` with a `t` method on purpose.** lingui's stock
  message extractor recognises `i18n.t('literal-id')` and `i18n._(...)` call
  sites (`@lingui/babel-plugin-extract-messages`, `isI18nMethod`), so
  `lingui extract` collects every id in this package with no custom tooling.
  Renaming it to a bare `t` would silently break extraction.
- **It imports `@lingui/core` with `import type` only.** The facade therefore
  contributes no runtime dependency, and consumers that never install a locale
  bundle pull zero lingui code. Verified by bundling a consumer that uses
  `CellCountRule` without a locale: 55.8 KB with no lingui markers in the
  output, versus 104.8 KB (lingui runtime present) once `locale/ja` is imported.

### 2.2 Call sites carry ids, never English

```ts
public get title(): string {
  return i18n.t('rule.cell_count.title');
}
```

English text lives only in `src/locale/catalogs/en/messages.po`. Putting it at
the call site (e.g. as a descriptor's `message`) would defeat the entire point:
the strings would ship even when no locale is installed.

The consequence is that `en` catalog entries are **authored by hand**;
`lingui extract` creates them with the id as `msgstr` and preserves your edits on
subsequent runs. Re-run extract after adding ids, then fill in the English.

### 2.3 Everything user-facing must be lazy

This is the easiest invariant to violate, and violating it fails silently:
strings are snapshotted in whatever locale (or no locale) was active at import
time.

Core instantiates rule prototypes at module load — `export const instance = new
CellCountRule(...)` at the bottom of each rule file, and `allRules` is populated
from those instances in `src/data/rules/index.ts`. Static config arrays
(`private static readonly CONFIGS = Object.freeze([...])`) are likewise
evaluated at class-definition time. So:

- `title` must be a **getter**, never `public readonly title = i18n.t(...)`.
- Config `description`/`explanation` must be **getters inside the object
  literals** in `CONFIGS`. Freezing the array does not freeze the elements, and a
  getter satisfies the `readonly description: string` on `Config<T>`, so this
  type-checks cleanly.
- `SearchVariant.description` is lazy via `searchVariantOf()` in
  `src/data/rules/rule.ts`, which returns an object whose `description` is a
  getter over `rule.explanation`. Snapshotting it would freeze the search list.

`explanation` is already a getter on every rule, so it is safe by construction.

### 2.4 Bridging the frontend and core locale

`activateLocale` also installs the corresponding core bundle, so UI chrome and
rule text always agree:

```ts
const coreCatalogs: Record<Locale, () => Promise<{ default: CoreLocale }>> = {
  en: () => import('@logic-pad/core/locale/en'),
  ja: () => import('@logic-pad/core/locale/ja'),
};
```

They are dynamic imports behind a literal-keyed map so each locale becomes its
own chunk and only the active one is fetched. The frontend resolves
`@logic-pad/core` to `packages/logic-core/src` through the Vite alias, so these
paths work in dev without building the package.

### 2.5 Never key identity off a localized string

`SearchVariant.description` is display text. It must not be used to look a rule
up: translations collide. `InstructionSearch` resolves selections by **index**
into its variant list (`Autocomplete` passes the index through `onConfirm`), and
anything persisting a rule should use `rule.id`.

### 2.6 Locale bundles and packaging

`src/locale/en.ts` / `ja.ts` build a lingui instance from the generated catalog:

```ts
export const locale: Locale = {
  code: 'en',
  i18n: setupI18n({ locale: 'en', messages: { en: messages } }),
};
```

Pass `messages` to `setupI18n` rather than calling `load()` afterwards: the
separate call emits a "Messages for locale ... not loaded" warning during
construction.

Catalogs are generated at `src/locale/catalogs/{locale}/messages.ts` (see
[§6](#6-extraction-compilation--crowdin)). A generated **`.ts`** module is used
deliberately instead of `.json`: `tsc` does not copy JSON assets to `dist`, so a
`.json` import would break the published package, whereas a `.ts` module
compiles into `dist/src/locale/catalogs/...` naturally.

`package.json` exports `./locale/*` → `./dist/src/locale/*.js`, giving
`@logic-pad/core/locale/en`.

### 2.7 The package entry point is generated

`src/index.ts` used to be rewritten by `scripts/genEntry.ts`, which scans
`src/data` and emits an enclosure. Anything hand-added to it — including the
locale exports — was destroyed on the next codegen.

Codegen now writes `src/index.gen.ts`, and `src/index.ts` is a thin hand-written
file:

```ts
export * from './index.gen.js';
export { getLocale, i18n, setLocale, type Locale } from './locale/index.js';
```

Because the generator only scans `src/data`, the locale facade must be re-exported
here explicitly.

### 2.8 Message id conventions

- `rule.<rule_id>.title`, `rule.<rule_id>.explanation`
- `rule.<rule_id>.config.<field>.description` / `.explanation`
- `common.<term>` for vocabulary shared across rules (`common.color`,
  `common.count`). Prefer these over repeating a string per rule: one id means
  one translation and no drift.

Use ICU plurals rather than pushing grammar into JavaScript. `cell_count` is
`{count, plural, one {…} other {…}}` with only `count`/`color` as values, so
locales with different plural rules (Japanese has a single `other` form) are not
forced into English morphology via synthetic `verb`/`plural` placeholders.

---

## 3. Backend — `logic-pad-api`

The backend deliberately has **no locale URL prefixes**. It is a JSON API, so
the language is a per-request content-negotiation concern
(`Accept-Language`), not an addressable-resource one; only the two frontend
repositories' user-facing pages get prefixed URLs.

Because the frontend's language comes from the URL prefix rather than the
browser's own setting, the two can disagree. `src/client/online/api.ts` therefore
pins backend strings to the UI by sending `Accept-Language` explicitly, read
per request from `getActiveLocale()`:

```ts
function withAcceptLanguage(config: InternalAxiosRequestConfig) {
  if (typeof window !== 'undefined') {
    config.headers.set('Accept-Language', getActiveLocale());
  }
  return config;
}
```

Three properties of this are worth knowing before changing it:

- **A request interceptor, not a default header.** The locale changes without a
  page reload ([§1.5](#15-locale-prefixed-urls)), so a value baked in at module
  load would go stale on the first switch.
- **`Accept-Language` is a CORS-safelisted header**, so it is sent without
  appearing in `Access-Control-Allow-Headers`. The backend's `cors()` options
  list only `Content-Type, Authorization` and need no change — verified against a
  recording stub rather than assumed, since a non-safelisted header here would
  have been silently dropped by the browser.
- **The header is left unset when there is no `window`.** This module is imported
  by `src/ssr`, where the visitor's language is unknown; pinning it to
  `DEFAULT_LOCALE` would be actively wrong once SSR starts localizing.

Two paths still bypass it, both benign today: `navigator.sendBeacon` in
`solveSessionSolvingBeacon` (fire-and-forget, response never read) and
`authClient`, which is better-auth's own fetch-based client. Give `authClient` a
`fetch` wrapper if auth endpoints ever start returning localized text.

### 3.1 Catalogs and instances

`packages/api/src/locales/catalogs/{locale}/messages.po` is the Crowdin source;
`messages.ts` beside it is the generated compiled catalog (same rationale as
[§2.6](#26-locale-bundles-and-packaging)). `locales/en.ts` and `ja.ts` build one
lingui instance per locale; `locales/index.ts` exposes `SUPPORTED_LOCALES`,
`DEFAULT_LOCALE` and `getI18n(locale)`.

Compiled catalogs are required, not optional: `@lingui/core` only registers its
message compiler when `NODE_ENV !== 'production'`. In production an uncompiled
catalog silently loses interpolation and plural support and logs a warning.

### 3.2 The locale plugin

`packages/api/src/hooks/locale.ts` is an Elysia plugin built on `derive`:

```ts
export const localePlugin = new Elysia().derive(
  { as: 'global' },
  ({ request }) => {
    const locale = detectLocale(request.headers.get('accept-language'));
    return { locale, i18n: getI18n(locale) };
  }
);
```

Handlers then destructure `{ i18n }` / `{ locale }` with full typing:

```ts
return status('Service Unavailable', { summary: i18n._('error.maintenance') });
```

Two traps this avoids:

- **`set.store` does not exist.** Elysia's `set` carries only response fields
  (`headers`/`status`/`redirect`/`cookie`); `store` is a **top-level** context
  member. Writing to `set.store` throws `Cannot set properties of undefined`,
  which surfaces as an HTTP 500 on every request the hook touches. It type-checks
  only because a cast hides it — do not reach for `as unknown as` on Elysia
  context objects.
- **`derive` is `onTransform`, and `transform` composes before `beforeHandle`**
  (`elysia/dist/compose.mjs`: the transform block precedes the beforeHandle
  block). That is why the maintenance gate, registered as `onBeforeHandle` after
  `.use(localePlugin)`, can still see `i18n`. `as: 'global'` makes the injection
  independent of registration order; the default `as: 'local'` does not.

`detectLocale` is a pure function of the header, so the plugin is stateless:
nothing is retained between requests and each one is served according to its own
hint.

### 3.3 `Accept-Language` parsing

Preferences are sorted by `q` descending (stable sort preserves the client's
order for ties, per RFC 9110), then each entry is honoured in turn — first as an
exact tag, then as a primary-language match. Ordering matters: for
`en;q=0.5, ja;q=1` the answer is `ja`, and for `ja-PK, en` it is `ja` (a
higher-preference primary beat a lower-preference exact). `q=0` entries are
dropped, `*` resolves to the default, and comparison is case-insensitive.

---

## 4. SSR — `src/ssr`

The static/SSR server renders crawler-facing content, so it is localized too. It
lives in the frontend repository and is therefore reached by **URL prefix**
(`/ja/...`), not by `Accept-Language` — the same rule as the pages it serves, so
a document and its `og:image` can never disagree about language.

### 4.1 Catalog and instances

`src/ssr/locales/catalogs/{locale}/messages.po` is the Crowdin source and
`messages.ts` beside it is the generated compiled catalog, committed because the
SSR process runs from source with no bundler to compile on the fly (same
rationale as [§2.6](#26-locale-bundles-and-packaging)). It is a second catalog
inside the *same* lingui config as the frontend UI, so one
`bun run locales:extract` covers both.

Call sites use the `i18n`-named facade for the same reason as core
([§2.1](#21-the-facade)): lingui's extractor recognises `i18n.t('literal-id')`.

```ts
const i18n = i18nFor(locale);
i18n.t('ssr.solve.description', { author: puzzle.creator.name });
```

### 4.2 Message ids must be literals

`lingui extract` reads ids out of the AST, so a computed id is **silently
dropped** — no error, no catalog entry, and the string renders as its own id at
runtime:

```ts
// WRONG: neither id is extracted
i18n.t(isSeries ? 'ssr.series.description' : 'ssr.collection.description', { author });

// RIGHT: two literal call sites
const description = isSeries
  ? i18n.t('ssr.series.description', { author })
  : i18n.t('ssr.collection.description', { author });
```

This bit during development: 13 of 15 ids were extracted and nothing complained.
After adding a string, confirm it appears in
`src/ssr/locales/catalogs/en/messages.po`.

### 4.3 Preview images: fonts and line breaking

`src/ssr/routes/image.ts` draws PNG previews with `@napi-rs/canvas`, which has no
system font access — only what `GlobalFonts.registerFromPath` loads. Two
independent defects were fixed alongside the string conversion. **Both predated
localization**: any puzzle with a Japanese title already produced a broken
preview image in *every* locale.

**Glyph coverage.** `public/NotoSerifCJK-Regular.ttc` is the upstream pan-CJK
OpenType Collection (OFL 1.1; `NotoSerifCJK-OFL.txt` ships beside it), used
whole rather than subset. Serif/Mincho was chosen over a Gothic face because
Palatino is a deliberate stylistic choice and a sans partner clashes with it.
Regular-only is correct because 400 is the only weight drawn, and the collection
orders Japanese first, so shared Han ideographs take their JP forms by default.
It is 25.2 MB, read by the native font engine at startup (registration is lazy,
~0.7 ms) and never reaches a browser, so it costs no bandwidth; it is also
absent from the service worker's precache.

Canvas resolves each glyph from the first family in the list that has it, so one
stack covers every script it can and Latin keeps Palatino's styling:

```ts
const font = (size: number) => `${size}px Palatino, NotoSerifCJK`;
```

**Line breaking is delegated to [`@chenglou/pretext`](https://github.com/chenglou/pretext)**
(MIT, zero dependencies) rather than implemented here. Titles are
user-generated and may be in any language, and correct breaking depends on
per-script rules — spaces between Latin words, per-character breaks plus
kinsoku-shori for CJK, grapheme segmentation for Thai and other
spaceless Southeast Asian scripts — that no amount of hardcoding covers. An
earlier hand-rolled splitter hardcoded CJK ranges and a kinsoku punctuation set,
which is exactly the wrong shape for this problem.

```ts
const { lines } = layoutWithLines(
  prepareWithSegments(text, fontString),
  maxWidth,
  lineHeight
);
```

Two integration details:

- **Pretext needs a Canvas 2D context to measure through.** Outside a browser it
  looks for a global `OffscreenCanvas`, and throws without one — which is Bun.
  `src/ssr/pretextShim.ts` supplies one backed by the same native canvas the
  renderer paints with, so its measurements are the widths the glyphs actually
  occupy. It is imported for its side effect and **must be evaluated before
  `@chenglou/pretext`**, hence a separate module rather than inline setup.
- **`setLocale(locale)` selects the breaking conventions** for the script being
  laid out, and clears pretext's cache, so it is called only when the locale
  actually changes (`applyLayoutLocale`), not on every render.

**Remaining gap: coverage is CJK-wide, not world-wide.** Measured against the
shipped stack:

| Covered | Tofu |
| --- | --- |
| Latin (incl. accented), Greek, Cyrillic, Hiragana, Katakana, Han, Hangul, CJK punctuation | Thai, Arabic, Hebrew, Devanagari, **emoji** |

Pretext still breaks those scripts correctly, so they wrap onto multiple lines
instead of overflowing — but the glyphs render as boxes. This is a font
availability problem, not a layout one: no single font covers everything, and
adding per-script faces is a size/licensing decision rather than a plumbing one.
Emoji are the most likely UGC in a puzzle title and are currently the worst
served.

Arabic and Hebrew have a second, independent problem even once a font is added:
pretext does not produce bidi levels or a visual order, and we paint line by line
with `fillText()`, so each line is ordered as its own paragraph. Per pretext's
guidance the fix is to render each paragraph as a single element with its
direction set, which canvas cannot do — so bidi text would need per-line shaping
before it is worth shipping a font for it.

`applyLayoutLocale` calls pretext's `setLocale` with the **URL** locale, which is
a proxy for the language of the (user-generated) title. That is the right call
here: pretext reads the page language from `<html lang>`, which does not exist in
a server process, and its docs say to pass it explicitly in exactly that
situation.

### 4.4 Image routes are prefixed, not negotiated

```text
/api/preview/puzzle/:id       -> English (unchanged, so existing links keep working)
/api/preview/ja/puzzle/:id    -> Japanese
```

`previewUrl(locale, kind, id)` in `src/ssr/routes/ssr.ts` builds the `og:image`
URL, keeping the image language tied to the page that references it. It is local
to that file because the image routes themselves are declared in `image.ts` and
do not need a shared helper.

---

## 5. Runtime contract for `@logic-pad/core`

```ts
// no locale installed → ids only, no lingui runtime in the bundle
import { CellCountRule } from '@logic-pad/core';
new CellCountRule(Color.Dark, 10).title; // 'rule.cell_count.title'
```

```ts
import { CellCountRule, setLocale } from '@logic-pad/core';
import en from '@logic-pad/core/locale/en';
import ja from '@logic-pad/core/locale/ja';

setLocale(en);
new CellCountRule(Color.Dark, 10).title; // 'Total Count'

setLocale(ja);
new CellCountRule(Color.Dark, 10).title; // '総数カウント'

setLocale(undefined); // back to ids
```

`setLocale` is process-global module state, so all instances — including the
prototypes registered in `allRules` — resolve through the same locale.

---

## 6. Extraction, compilation & Crowdin

`.po` files are the source of truth and are what Crowdin edits. Compiled output
is committed for `core`, the backend and SSR (they are consumed as packages, or
run by Bun from source, with no bundler to compile on the fly); the frontend
UI's `.po` files are compiled by the Vite plugin at build time.

| Surface | Config | Catalog source | Compile target | Committed? |
| --- | --- | --- | --- | --- |
| Frontend UI | `lingui.config.ts` | `src/client/locales/{locale}/messages.po` | in-build | no |
| `@logic-pad/core` | `packages/logic-core/lingui.config.ts` | `src/locale/catalogs/{locale}/messages.po` | `messages.ts` | yes |
| Backend | `packages/api/lingui.config.ts` | `src/locales/catalogs/{locale}/messages.po` | `messages.ts` | yes |
| SSR | `lingui.config.ts` (same config as the UI) | `src/ssr/locales/catalogs/{locale}/messages.po` | `messages.ts` | yes |

The UI and SSR catalogs share one lingui config so that a single
`locales:extract` covers both. The consequence is that `locales:compile` also
emits `src/client/locales/{locale}/messages.ts`, which nothing imports — those
paths are `.gitignore`d so the byproduct never lands in the repo.

Scripts:

```bash
# frontend repo
bun run locales:extract
bun run locales:compile
bun run --cwd packages/logic-core locales:extract
bun run --cwd packages/logic-core locales:compile

# backend repo
bun run --cwd packages/api locales:extract
bun run --cwd packages/api locales:compile
```

They invoke `bun x --bun lingui …`. The `--bun` flag matters: the `lingui` bin
shim has a `node` shebang, and Node 20 lacks `fs.globSync`, which
`@lingui/cli` imports. Note also that `bunx --bun lingui extract` mis-parses the
subcommand as a package specifier — use the spaced `bun x --bun` form.

`--typescript` on compile emits `export const messages = JSON.parse(…) as
Messages`, i.e. pre-compiled ICU tokens.

`crowdin.yml` in each repository maps the `en` catalogs to the mirrored locale
paths. Both manifests ship with an empty `project_id`; fill it in (or supply
`CROWDIN_PERSONAL_ACCESS_TOKEN` plus the project id in CI) before the first sync.

Workflow for a new or changed string:

1. Wrap it — `t`…` from `useLingui()` (frontend) or `i18n.t('a.stable.id')`
   (core/backend/SSR). The id **must be a string literal**; a computed id is
   silently omitted ([§4.2](#42-message-ids-must-be-literals)).
2. `locales:extract` to add the id to every locale catalog. Extraction preserves
   existing translations and marks removed ids obsolete.
3. Author the English `msgstr` in the `en` catalog (core/backend/SSR ids arrive
   with the id as their text — see [§2.2](#22-call-sites-carry-ids-never-english)).
4. Translate, locally or via Crowdin.
5. `locales:compile` where the surface has a committed artifact.

---

## 7. Verification

```bash
# logic-pad
bun run lint
bunx --bun tsc --noEmit
bun run --cwd packages/logic-core typecheck

# logic-pad-api
bun run lint        # tsc && eslint
```

Behavioural checks worth repeating after a change:

- Core with no locale emits ids; after `setLocale(en)`/`setLocale(ja)` the same
  objects return translated text — including `title`, `configs[].description`
  and `searchVariants[].description`, the three that are easy to snapshot at
  import time.
- `setLocale(undefined)` returns to ids.
- Bundling a locale-free core consumer leaves lingui out of the output.
- The backend answers the same route with different languages for different
  `Accept-Language` headers, and falls back to `en` for unsupported locales.
- Locale URLs behave end to end (`bun run dev`, then in a browser):
  - `/ja/rules` renders Japanese UI and `<html lang="ja">`;
  - `/en/rules` lands on `/rules`;
  - links on a Japanese page carry the `/ja` prefix;
  - switching language in the settings modal rewrites the address bar **without
    a page reload** — verify the editor keeps its unsaved content, which is the
    whole reason `useLocale()` bypasses `navigate()`.
- `src/ssr`: `/ja/solve/<id>` returns SSR'd HTML with `lang="ja"` while
  `/en/solve/<id>` 301s; `/sitemap.xml` lists `hreflang` alternates for both.
  Driving these needs a reachable API (or a stub on `API_ENDPOINT_PRIVATE`),
  because with no backend the SSR route and the SPA fallback return byte-identical
  HTML and the check proves nothing.

---

## 8. Current coverage and known gaps

Only a representative slice of strings is converted; the plumbing is the deliverable.

- **Core rules: 2 of ~27 converted** (`CellCountRule`, `UniqueShapeRule`). The
  remaining rules still hold literal English in `title`, `CONFIGS`
  descriptions/explanations and `explanation`. They are mechanical to convert,
  but each one must follow the laziness rules in
  [§2.3](#23-everything-user-facing-must-be-lazy) — convert with that section
  open, and prefer `common.*` ids for repeated terms.
- **`{color}` interpolates the raw enum**, so Japanese text renders
  `lightのセルは…`. Preserving this was deliberate (it matches the pre-existing
  output exactly), but colour names should eventually become `common.color.*`
  ids. This is a translation-content decision, not a plumbing one.
- **Frontend UI: 22 strings converted**, all in the settings modal. The rest of
  the app (editor, online/browse screens, metadata panels, toasts) is untouched.
- **Backend: 1 string converted** (the maintenance message). Route `summary:`
  fields, `functions.ts` notification text, and the other error strings sketched
  in the original plan are not wired up; the catalog deliberately contains only
  ids that actually appear at a call site, since hand-written entries drift.
- **SSR: 15 strings converted** — all of the crawler-facing text in `ssr.ts`
  (page titles/descriptions) and `image.ts` (canvas labels, stats, kind names).
  User-supplied content (puzzle titles, usernames, profile blurbs) is never
  translated, only rendered.
- Symbols (`Symbol.explanation`) and solver/search-variant text outside the two
  converted rules are not localized.

Routing/SEO gaps that are open on purpose:

- **No `<link rel="canonical">`.** Only `hreflang` alternates are published.
  Deciding canonicalisation for query-bearing pages (`/search/puzzles?...`) is a
  policy call that should be made deliberately rather than guessed at; a wrong
  canonical can de-index a page.
- **No `Accept-Language` auto-redirect** on the frontend. The URL is authoritative
  ([§1.5](#15-locale-prefixed-urls)); the backend negotiates on the header
  because it has no URL prefixes to consult.
- **`/ja` content is only as translated as the catalogs are.** A Japanese URL
  rendering mostly-English UI (because most UI is unconverted) is a worse crawl
  signal than no `/ja` URLs at all, so the prefix should not be advertised in the
  sitemap until the translation coverage justifies it. Consider gating the
  sitemap's `ja` alternates on coverage.

---

## 9. TanStack Router upgrade (1.131 → 1.170)

`rewrite` does not exist before 1.140, so the router had to move. Three breaking
changes surfaced, all small:

- **`ErrorComponentProps['error']` is now `unknown`** (it was `Error`).
  `src/client/router/Error.tsx` narrows it explicitly. Note that component is
  *named* `Error`, which shadows the global constructor — `error instanceof Error`
  silently tests the React component. It is renamed `ErrorPage`.
- **`remountDeps` receives the validated search object directly**, not a wrapped
  location: `search.search?.redirect` became `search.redirect`
  (`src/client/routes/auth.tsx`).
- `routeTree.gen.ts` is regenerated with a different (alphabetical) import order
  — a large but purely mechanical diff.

`@tanstack/router-vite-plugin` and `@tanstack/react-router-devtools` were bumped
alongside. `bunx --bun tsc --noEmit` is the gate that catches these.

---

