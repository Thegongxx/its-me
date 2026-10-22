# Original visual assets

This project uses original artwork created specifically for **Xuan**. The homepage X is a split, bevelled letterform defined in `src/components/sculpture-model.ts`, with a graphite shell, lime core and aluminium/graphite faces. `src/components/sculpture.tsx` handles lighting, the generated shadow and interaction. It is procedural Three.js geometry, not a downloaded model. The former twisted ribbon has been replaced. The header mark and favicon share the new angular silhouette. The SVG illustrations contain no external imagery, product screenshots, remote resources, scripts, or personal claims. Conceptual covers remain labelled as examples.

| File | Dimensions | Purpose |
| --- | --- | --- |
| `public/visuals/build-object.svg` | 1000 × 900 | Unused original concept study retained with the source. It is not the current homepage sculpture. |
| `public/visuals/project-system.svg` | 1400 × 1000 | Pale sage modular system study, using abstract interface-like panels and a circular dial. This is not a screenshot of a working product. |
| `public/visuals/project-notes.svg` | 1400 × 1000 | Pale yellow editorial notebook study, with overlapping sheets, an original geometric B specimen, and a lime bookmark. This is not an actual learning record. |
| `public/visuals/project-signal.svg` | 1400 × 1000 | Dark forest green signal study with two sculptural rings and discrete lime connectors. This is not live device or usage data. |

## Design rules

- Current site palette: warm paper `#f5f4ef`, ink `#252823`, lime `#d0ee86`; the conceptual covers use supporting shades.
- Homepage environments use dark `#20231f` for the exhibition and pale green `#e9ecdf` for the writing desk. The opening object leaves the screen before the project covers; it is not overlaid across reading content.
- Each SVG has intrinsic dimensions, a `viewBox`, an accessible `title` and `desc`, and no embedded bitmap data.
- Render with a meaningful contextual `alt` on the HTML image element. If an adjacent caption fully describes a purely decorative image, use an empty `alt` to avoid duplicate announcements.
- Project covers can use `object-fit: cover` at their native 7:5 ratio; avoid severe cropping at narrower ratios.
- These files are static and introduce no motion. Any animation added by the site must respect `prefers-reduced-motion`.
- The single `FIELD NOTES` label uses common sans-serif fallbacks. All dominant lettering and geometry are native paths, so the covers do not depend on downloaded fonts.

## Verification

All four files were parsed as XML and checked for intrinsic dimensions, accessible labels, and forbidden active or remote content. Each SVG was also rasterized at 1000 px wide with the installed Sharp renderer and visually inspected: no clipped principal objects, missing glyphs, unexpected fills, or rendering errors were observed. File sizes range from 4.6 to 5.0 KiB. They must also be reviewed in the completed page layouts; asset validation alone does not establish page-level visual quality.

Fonts are packaged Fontsource distributions of Manrope, Noto Sans SC and IBM Plex Mono; their license texts remain in their packages. No reference-site code, 3D model, portrait or project screenshot has been imported. The award sites are quality references only; this project claims no award.
