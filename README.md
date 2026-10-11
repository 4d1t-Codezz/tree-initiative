# Houston TREE Initiative website

Static site for the Houston TREE Initiative (Together for Restoration and Environmental Equality), hosted on GitHub Pages.
It has no build step: plain HTML, CSS and JS.

## Updating the numbers

Open **`config.js`**. Every number on the site that is likely to change is set there:

| Setting | What it controls |
|---|---|
| `schoolStudents` | "Students from her school" stat (set to a number) |
| `visitorBaseline` | Visitors from before this site launched (e.g. the Wix Analytics total); the live counter adds on top |
| `partners` | Partner list; the "N organizations" count is computed from its length |
| `nextEvent` | The "Next planting" card in Get Involved (`null` hides it) |

Tree counts, volunteer counts and event details live directly in `index.html`. Search for the number you want to change.

## Files

```
index.html        page content
styles.css        design tokens (colors, type) at the top, then sections
main.js           animations (GSAP + ScrollTrigger + Lenis), visitor counter, gallery
config.js         editable numbers
404.html          redirects old Wix URLs (/about-us, /donate, …) to the right section
assets/img/       photos (resized; metadata/GPS stripped)
assets/video/     background loops (blur baked in with ffmpeg)
```

## Credits

Background footage: [Mixkit](https://mixkit.co/) (free license).
Visitor counter: [Abacus](https://abacus.jasoncameron.dev/) (free, no account).

## Using the treeinitiative.net domain

1. In the repo: **Settings → Pages → Custom domain**, enter `www.treeinitiative.net`.
2. At the domain registrar: add a `CNAME` record `www → 4d1t-codezz.github.io`, plus `A` records for the apex
   (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`).
3. Disconnect the domain from Wix first.
