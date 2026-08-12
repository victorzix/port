# Publishing to the portfolio changelog

Copy this file into any project whose releases should show up on the portfolio site. It is the complete contract — a human or a coding agent can read it and publish a release without looking at the portfolio source.

> **Not live yet.** This documents the contract agreed in `docs/superpowers/specs/2026-08-11-projects-releases-design.md`. The endpoints exist once phase 1 of that spec ships. Until then, treat this as the target shape.

## Setup

The consuming project needs two values, as environment variables or CI secrets:

```bash
PORTFOLIO_API_URL=https://<portfolio-domain>
PORTFOLIO_API_TOKEN=<the bearer token>
```

The token is the same secret the portfolio server reads as `CHANGELOG_API_TOKEN`. Every request sends it as `Authorization: Bearer $PORTFOLIO_API_TOKEN`. There is no other auth, no cookies, no CSRF.

## The model in 30 seconds

- A **project** is one entry in the portfolio's `/projects` ledger, identified by a kebab-case `slug`. Work experience does not go here — this is for open and personal projects.
- A **release** belongs to a project and is identified by its `version` (`1.4.0`, no leading `v`).
- A release holds **typed changes** — `added`, `changed`, `fixed`, `removed`, `deprecated`, `security` — in the order you send them.
- Any human-readable text is a **localized object**: `{ "en": "…", "pt": "…", "es": "…" }`. Only `en` is required; missing locales fall back to it. Project `name` is a plain string, since it is a proper noun.

## 1. Register or update the project

Do this once per project, and again whenever the description or stack changes.

```bash
curl -sS -X PUT "$PORTFOLIO_API_URL/api/projects/my-project" \
  -H "Authorization: Bearer $PORTFOLIO_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "description": {
      "en": "One line about what this does.",
      "pt": "Uma linha sobre o que isso faz."
    },
    "stack": ["Next.js", "PostgreSQL", "Tailwind CSS"],
    "status": "active",
    "year": 2026
  }'
```

`201` created, `200` updated.

## 2. Publish a release

```bash
curl -sS -X PUT "$PORTFOLIO_API_URL/api/projects/my-project/releases/1.4.0" \
  -H "Authorization: Bearer $PORTFOLIO_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "releasedAt": "2026-08-10T12:00:00Z",
    "title": { "en": "Theming release" },
    "changes": [
      { "type": "added", "text": { "en": "Dark mode", "pt": "Modo escuro" } },
      { "type": "fixed", "text": { "en": "Crash when uploading large files" } },
      { "type": "changed", "text": { "en": "Moved to Next.js 16" } }
    ]
  }'
```

`201` created, `200` updated.

## Doing both in one request

If the project may not exist yet — a first release, or a fresh database — include a `project` object. It is used **only** when the project is missing; if the project already exists it is ignored, so it is safe to send every time.

```jsonc
{
  "title": { "en": "First cut" },
  "changes": [{ "type": "added", "text": { "en": "Everything" } }],
  "project": {
    "name": "My Project",
    "description": { "en": "One line about what this does." },
    "stack": ["Next.js"],
    "status": "wip",
    "year": 2026
  }
}
```

Without it, publishing a release to an unknown slug returns `404`.

## Idempotency — the part that matters

Both endpoints are `PUT` and both are **full replacements**, not patches.

- Re-sending the same payload does not duplicate anything. It overwrites the same row.
- Re-sending a **corrected** payload fixes the record. This is how you fix a typo — not by editing Postgres.
- A release's `changes` array is replaced wholesale: whatever you send becomes the complete list. To add one entry to an existing release, send the full list including the old entries.
- An **omitted optional field becomes `null`** on update. If a project already has a `liveUrl` and your next `PUT` omits it, the link is cleared. Always send the complete object you want stored.

This means CI can retry freely and a failed half-run is harmless.

## Field reference

### Project

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | Proper noun, not localized |
| `description` | localized | yes | One line; shown in the ledger and on the detail page |
| `summary` | localized | no | Long markdown; detail page only |
| `stack` | string[] | no | Defaults to `[]`. Names must resolve to a known icon — see below |
| `status` | `active` \| `wip` \| `archived` | yes | Drives the badge and the ledger ordering |
| `year` | integer | yes | The year shown in the ledger row |
| `sortOrder` | integer | no | Defaults to `0`; lower sorts first |
| `imageUrl` | url | no | Used as `og:image` on the detail page |
| `repoUrl` | url | no | |
| `liveUrl` | url | no | |

The `slug` is not in the body — it comes from the URL and must be kebab-case (`my-project`, not `My_Project`).

Values in `stack` are matched against the portfolio's icon map (`src/lib/stack-icons.ts`). An unknown name still renders, just without a glyph. Use the canonical spelling: `Next.js`, `PostgreSQL`, `Tailwind CSS`, `TypeScript`.

### Release

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `releasedAt` | ISO 8601 | no | Defaults to now |
| `title` | localized | no | Optional headline for the release |
| `notes` | localized | no | Free markdown, rendered under the changes |
| `changes` | array | yes | May be empty if `title` or `notes` carries the content |
| `changes[].type` | enum | yes | `added` \| `changed` \| `fixed` \| `removed` \| `deprecated` \| `security` |
| `changes[].text` | localized | yes | One line per change |
| `project` | object | no | See above |

The `version` comes from the URL and must be dot-separated integers (`1.4.0`, `2026.8.1`). Do not include a leading `v`. Ordering on the site is by version, correctly — `1.10.0` sorts above `1.9.0`.

### Responses

| Code | Meaning |
| --- | --- |
| `200` | Updated an existing record |
| `201` | Created a new record |
| `400` | Body failed validation, or the version in the URL is not dot-separated integers. The response includes `issues` naming the failing fields |
| `401` | Missing, malformed, or wrong bearer token |
| `404` | Unknown project slug on a release request, and no `project` object was sent |
| `500` | Server-side failure — safe to retry, the writes are transactional |

## Recipe: publish on tag push (GitHub Actions)

```yaml
name: Publish release to portfolio
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Push release
        env:
          PORTFOLIO_API_URL: ${{ vars.PORTFOLIO_API_URL }}
          PORTFOLIO_API_TOKEN: ${{ secrets.PORTFOLIO_API_TOKEN }}
          VERSION: ${{ github.event.release.tag_name }}
        run: |
          VERSION="${VERSION#v}"   # strip the leading v
          curl -sS --fail-with-body \
            -X PUT "$PORTFOLIO_API_URL/api/projects/my-project/releases/$VERSION" \
            -H "Authorization: Bearer $PORTFOLIO_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d @portfolio-release.json
```

Keep `portfolio-release.json` in the repo and edit it as part of the release commit, so the changelog text is reviewed like any other change. Because the endpoint is idempotent, re-running the job after fixing that file corrects the published release.

## For coding agents

If you are an agent working in this repository and asked to publish a release to the portfolio:

1. Read the version from this project's own source of truth — `package.json`, a tag, or a `CHANGELOG.md` heading. Strip a leading `v`.
2. Derive the changes from the actual commits or the changelog entry for that version. Map each one to a `type`. Do not invent entries, and do not pad the list to look fuller.
3. Write `en` for every change. Add `pt` only if you can do it accurately; the fallback is fine and better than a bad translation.
4. Send `PUT /api/projects/<slug>/releases/<version>` with the full `changes` array. Include the `project` object if you are not certain the project is registered.
5. Never hardcode the token. Read `PORTFOLIO_API_TOKEN` from the environment, and if it is unset, stop and say so rather than guessing.
6. Check the response code against the table above. On `400`, read `issues` and fix the payload. On `401`, the token is wrong — stop, do not retry in a loop.
7. Remember the replacement semantics: to amend a published release, re-send the complete payload, not just the delta.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `401` with a token you believe is right | The portfolio server has no `CHANGELOG_API_TOKEN` set, or it differs from yours. Both sides must match exactly |
| `404` on a release | Project not registered. Register it first, or include the `project` object |
| A change you added earlier disappeared | `changes` is replaced wholesale. Send the complete list |
| A field you set earlier is now empty | Omitted optional fields are cleared on update. Send the complete object |
| Release appears in the wrong order | Ordering is by version, not by `releasedAt`. Check the version you sent |
| A stack item has no icon | The name is not in the portfolio's icon map. Use the canonical spelling |
