# Preetam Goudar — Portfolio

Professional portfolio for Preetam Goudar, published with GitHub Pages at
[preetamggoudar.github.io](https://preetamggoudar.github.io/).

## Stack

Plain HTML, CSS and JavaScript — no build step, no dependencies. Just push to `main` and
GitHub Pages serves the site.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All page content and metadata |
| `styles.css` | Design system, layout and responsive styles |
| `script.js` | Scroll reveals, rotating role text, mobile menu, stat counters |
| `assets/avatar.jpg` | GitHub avatar (legacy) |
| `assets/avatar-linkedin.jpg` | LinkedIn profile photo (source for the cut-out and social previews) |
| `assets/avatar-cutout.png` | Background-removed cut-out shown floating in 3D in the hero |

## Update content

Edit `index.html` to change text, links, experience or projects. Replace
`assets/avatar-cutout.png` to change the 3D cut-out. Commit and push to `main`;
the live site updates in under a minute.

## Local preview

```bash
cd preetam-portfolio
python3 -m http.server 8000
# open http://localhost:8000
```
