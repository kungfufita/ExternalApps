# Business Name & Web Presence

Name candidates for the BC registration, the matching domain, and the plan for email
and web hosting. Tracked as project **P-003**.

## How to choose

The name must work in three places at once:

1. **BC registry** — needs a distinctive + descriptive element ("Bluepine" + "Digital").
2. **Domain** — the matching `.ca` (Canadian trust signal; CIRA requires Canadian
   presence, which a BC sole prop satisfies) and ideally the `.com`.
3. **Brand** — umbrella for *all* ventures (landlord tools today; AI services and
   micro-SaaS next), so avoid niche-specific names at the business level. Product
   lines can carry their own names underneath.

## Candidates

DNS checked 2026-08-14. **"No DNS" is a good sign but not proof** — a domain can be
registered without DNS records. Verify at the registrar before deciding, and search
the name at a BC registry / Google / trademark database before submitting the
Name Request.

| # | Business name (registry form) | .ca | .com | Notes |
|---|---|---|---|---|
| 1 | **Bluepine Digital** | ✅ no DNS | ✅ no DNS | Recommended: BC-evocative, umbrella-wide, both TLDs look open |
| 2 | **Nayler Digital** | ✅ no DNS | ✅ no DNS | Family name = easy BC approval + natural fit with sole prop |
| 3 | **Coastfire Labs** | ✅ no DNS | ✅ no DNS | Energetic, techy; "Labs" suits the venture-portfolio model |
| 4 | **Northglade Ventures** | ✅ no DNS | ✅ no DNS | Formal, portfolio-sounding; strongest if incorporation comes soon |
| 5 | **True North Toolworks** | ✅ no DNS | ✅ no DNS | Warm, product-flavored; slightly long |
| 6 | **Westhaven Digital** | ✅ no DNS | ❓ not checked | Solid alternative to #1 |
| 7 | **ExternalApps** | ✅ no DNS | ❌ taken | The working name; .com gone weakens it as the public brand |
| — | *Landlord Toolworks* | ✅ no DNS | ✅ no DNS | **Product-line brand**, not the business name — too niche for the umbrella |

**Recommendation:** register the business as one of #1–#4, and keep niche-facing
brands (like *Landlord Toolworks* for the Deal Analyzer line) as marketing names under
the umbrella. Submit 3 choices on the Name Request in priority order — that's built
into the BC process.

## Domain plan

- [ ] Buy the **.ca and .com together** for the chosen name (~$15–20/yr each) so the
  brand can't be squatted. `.ca` = primary; `.com` redirects.
- [ ] **Registrar:** a Canadian-friendly registrar that handles `.ca` cleanly —
  Webnames.ca (Canadian), Porkbun, or Namecheap all work. Enable auto-renew and
  registrar 2FA immediately; list Troy as technical/backup contact.
- [ ] **DNS:** point nameservers at **Cloudflare (free tier)** — one place for DNS,
  redirects, and later the website.

## Email (the "mail server")

**Don't self-host mail.** Deliverability, spam reputation, and patching make a
self-hosted mail server a permanent hands-on chore — the opposite of the platform's
automation bias ([Pillar 5](../docs/05-automation.md)). Use a hosted provider on the
custom domain:

| Option | Cost (approx.) | Fit |
|---|---|---|
| **Google Workspace** | ~$8 CAD/user/mo | Recommended: best marketplace/tool compatibility, Drive included |
| Proton Mail | ~$5–8/user/mo | Privacy-first alternative |
| Fastmail | ~$7/user/mo | Excellent mail, fewer integrations |

- [ ] Start with **one paid user** — `troy@<domain>` — plus free **aliases**:
  `sheila@`, `hello@`, `support@`, `billing@`. Add real mailboxes only when needed.
- [ ] Set **SPF, DKIM, DMARC** records at Cloudflare on day one (the provider gives
  the values) so marketplace and customer email never lands in spam.

## Web presence

Phased — no venture needs a big site yet:

1. **Now (P-003):** domain + email live; a one-page site (who we are, product links,
   contact) on **Cloudflare Pages or GitHub Pages** — free, static, zero maintenance.
2. **With product sales:** product pages link out to the marketplace listings
   (Etsy/Gumroad handle checkout, tax, delivery). No own-store overhead yet.
3. **Later (validated):** own storefront (per the Digital Products roadmap) — likely
   Gumroad-embedded or Shopify — plus the newsletter play from the research doc.

**Estimated fixed cost once live: ~$15–25 CAD/month** (domains amortized + one
Workspace seat). That's the business's first recurring cost — it goes in the console
financials when it starts.
