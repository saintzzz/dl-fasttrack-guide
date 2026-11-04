# CR-009: Trust pages (E-E-A-T) for fasttrack.vieschool.com

## What
Add four trust/entity pages — `about.html`, `contact.html`, `privacy.html`, `terms.html` — and link them from the footer of every page.

## Why
The site currently ships 17 content pages and zero entity/legal pages. To Google (and to users) that profile reads as a thin affiliate doorway: no operator identity, no contact path, no policies, no affiliate disclosure. Trust pages are the standard E-E-A-T floor for a referral content site:

- **About** declares who runs the site, editorial method, and the AAL referral relationship openly.
- **Contact** gives a real reachability signal.
- **Privacy + Terms** cover legal baseline; Terms carries the affiliate/referral disclosure (commission does not change user price).

## Scope
- New: `about.html`, `contact.html`, `privacy.html`, `terms.html` (light template matching guide pages; WebPage + BreadcrumbList schema)
- Edit: footer block on all 17 existing pages -> adds About/Contact/Privacy/Terms links (service-provided-by line preserved)
- Edit: `sitemap.xml` +4 URLs
- Post-deploy: IndexNow the 4 new URLs

## Impact
- No breaking changes; additive pages + footer links only.
- SEO: entity completeness for the domain; disclosure improves affiliate legitimacy.
- Out of scope: GBP/Trustpilot profiles, paid campaigns (handled separately).

## Owner
VieSchool SEO ops - 2026-11-04
