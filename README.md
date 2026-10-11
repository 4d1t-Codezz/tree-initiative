# Houston TREE Initiative website

Static site for the Houston TREE Initiative (Together for Restoration and Environmental Equality), hosted on GitHub Pages.
It has no build step: plain HTML, CSS and JS.

## Updating the numbers

Open **`config.js`**. Every number on the site that is likely to change is set there:

| Setting | What it controls |
|---|---|
| `schoolStudents` | "Students from Vedika's school" stat (set to a number) |
| `visitorBaseline` | Visitors from before this site launched (e.g. the Wix Analytics total); the live counter adds on top |
| `partners` | Partner list; the "N organizations" count is computed from its length |
| `nextEvent` | The "Next planting" card in Get Involved (`null` hides it) |

Tree counts, volunteer counts, event details and the team bios live directly in `index.html`. Search for the text you want to change.

The photo list for the sliding strips is in the "Planting photos" block in `main.js`.

## Files

```
index.html        page content
styles.css        design tokens (colors, type) at the top, then sections
main.js           animations (GSAP + ScrollTrigger + Lenis), visitor counter, team tabs, photo strips
config.js         editable numbers
404.html          redirects old Wix URLs (/about-us, /donate, …) to the right section
assets/img/       photos (resized; metadata/GPS stripped)
assets/bg/        Background-research images and book covers (from the original site)
assets/og.jpg     1200×630 image shown when the link is shared (iMessage, etc.)
assets/video/     background loops; hero.mp4 (desktop) + hero-sm.mp4 (phones); slingshot.mp4
```

## Publishing changes

Run `sh tools/bump-version.sh` before committing. It stamps a new `?v=` on the CSS, JS and video links in `index.html`;
without it, visitors can keep seeing the old files for up to 10 minutes (GitHub Pages caching).

## Credits

Opening (hero) video: built from Wikimedia Commons photos of Houston forests, animated with slow zooms and crossfades and color-adjusted.
Photos by JuWiki (Buffalo Bayou), Another Believer (Mercer Arboretum, 2 photos), JoanLouise (Buffalo Bayou at Memorial Park)
and Idawriter (Houston Arboretum), all [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Because of share-alike,
`assets/video/hero.mp4` is also CC BY-SA 3.0.
Slingshot Challenge video: TREE's own entry, copied from the original treeinitiative.net site (`assets/video/slingshot.mp4`).
Other forest footage (impact and get-involved sections): [Mixkit](https://mixkit.co/) (free license).
Houston footage: [Pexels](https://www.pexels.com/) (free license), clips 18126746, 10901571, 12907204, 32701339.
National Geographic Society logo: Wikimedia Commons, used only to identify the Slingshot Challenge recognition.
Visitor counter: [Abacus](https://abacus.jasoncameron.dev/) (free, no account).

## Using the treeinitiative.net domain

1. In the repo: **Settings → Pages → Custom domain**, enter `www.treeinitiative.net`.
2. At the domain registrar: add a `CNAME` record `www → 4d1t-codezz.github.io`, plus `A` records for the apex
   (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`).
3. Disconnect the domain from Wix first.
4. Update the `og:url` and `og:image` URLs in `index.html` to the new domain so link previews keep working.
