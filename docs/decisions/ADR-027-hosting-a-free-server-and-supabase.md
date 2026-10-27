# ADR-027: Hosting — A Free Google Server on IPv6 Behind Cloudflare, Postgres on Supabase

**Status:** Proposed. The direction her husband reached on 2026-10-27; not
locked. Feature 8 is paused until the domain is bought, and this is
confirmed or changed when it resumes.
**Date:** 2026-10-27 (feature 8, Going live, block 1)

---

## Context

Neuron runs only on her laptop. For now it is a portfolio project used
daily, so it should cost nothing, and it must stay deployable on any
platform, so it can move when it launches for real. A server they run
themselves is preferred. A domain will be bought, but not at once.

The refresh cookie is `SameSite=Strict` (ADR-018): the browser sends it only
when the page and the API are on the same site, the same registered domain.
Platform addresses such as `vercel.app` and `onrender.com` are on the public
suffix list, so each app on them is a site of its own.

---

## The direction

- **The API** on Google Cloud's free e2-micro (1 GB of memory), in a
  container, behind Caddy. Created with a **standard** persistent disk: the
  console's default, `pd-balanced`, is not free (about 3 dollars a month).
- **IPv6 only, behind Cloudflare's free proxy.** An in-use public IPv4
  address costs 0.005 dollars an hour, about 3.65 dollars a month; external
  IPv6 is free. Cloudflare accepts visitors on either and reaches the server
  over IPv6. This needs the domain on Cloudflare.
- **Postgres on Supabase's free plan** (500 MB), in the same part of the US
  as the server. Supabase's direct address is IPv6, which the server has.
- **The frontend separately**, on a free static or Next.js host (Vercel or
  Cloudflare Pages). With the domain, `app.` and `api.` under it are one
  site, and the cookie works unchanged.
- **Portable by four habits:** container images, configuration only from
  environment variables (ADR-007), plain Postgres, files through the S3 API.
- **Nightly backups** of the database to Google Cloud Storage (5 GB free);
  Supabase's free plan has none. A **budget alert at 1 dollar.**
- **The launch path:** after development and testing, Azure's managed
  Postgres or a larger Google server, if needed. The habits make it a move.

---

## Alternatives weighed

| Option | Why not, for now |
|---|---|
| Oracle Always Free ARM server (2 cores, 12 GB) | The best free server on paper. Capacity is often unavailable, the home region is fixed at sign-up, and an idle machine may be reclaimed. Judged too difficult to obtain |
| Azure for 12 months (1 GB machine, managed Postgres with backups) | Free for a year only, and needs a pay-as-you-go account with a chargeable card. Kept as the launch option |
| Google e2-micro with a paid IPv4 address | Works without a domain; about 3.65 dollars a month |
| Render free, Neon, Vercel | The API sleeps after 15 minutes and takes about a minute to wake; no process can keep running for feature 11 |
| AWS | The free plan ends after six months or the credits |
| Railway (about 5 to 10 dollars) or Render paid (about 20) | Cost money |
| Fly.io | Managed Postgres from about 38 dollars |
| Neon, Aiven instead of Supabase | Sleep after minutes, or power off when idle; similar sizes |

---

## Accepted costs

- **US regions only** for the free server, so every request crosses an
  ocean to reach it.
- **1 GB of outgoing traffic a month** is free; audio played through the API
  counts. Beyond it, cents per GB.
- **Supabase pauses a free project after a week without activity**, holds
  500 MB, and keeps no backups.
- **Downloads to the server over IPv6** (system updates, container images)
  are untested; GitHub's registry has long had no IPv6.
- **1 GB of memory** for the API and Caddy, with swap.
- Server work is theirs: updates, the firewall, SSH keys.

---

## Revisit when

- Feature 8 resumes, with the domain.
- The journal outgrows 500 MB, or real users arrive.
- A charge appears on the budget alert.
