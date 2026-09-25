# Public parent ancestry

Mode: Read — visitors understand the known family lines of each parent.

Status: implemented extension of the approved Life with Labr identity. Sources: `src/render-litters.mjs`, `dist/pedigree-data.js`, `dist/pedigree.js`, `dist/pedigree.css`, and the parent profile in `dist/app.js`. Shared visual authority remains the root `DESIGN.md`; the owner workflow is recorded in [admin.md](admin.md).

## Purpose and content

Show the known ancestry of each litter parent through three generations. The litter page renders the tree into its HTML. Each available parent's branch has a native disclosure labelled with the parent's role and name, plus kennel when present; the first available branch starts open. The parent profile uses the same resolved ancestry and tree renderer. Existing text notes remain beneath the litter-page tree. When neither parent has ancestry or a note, the page directs visitors to the breeder for origin information.

The original published facts live in the shared data module. An explicit saved tree takes precedence, including an empty tree, so clearing is durable. A legacy text note alone suppresses the original tree fallback. Omit fully empty nodes, but keep unnamed nodes when titles or farther ancestors are known, with «Не указан» in place of the missing name. Preserve the original father/mother role after empty siblings are removed; the remaining mother's branch must never be relabelled as the father.

## Composition and responsive behavior

On a wide ancestry container, keep the three-generation column structure, nested list order, and quiet connector lines. First-generation ancestors sit on pale green panels with serif names; second-generation names retain the serif, while the third generation uses Manrope. A tree containing only first-generation ancestors uses two parallel panels. When a deeper pair has only one known member, its role and generation remain visible even on desktop.

At an ancestry container width of 700px or less, hide the column headings and stack nested branches in reading order. Each nesting level adds a 12px outer inset and 16px inner padding around a thin left guide, keeping the third generation readable within the page or profile dialog. Ancestor labels explicitly show father/mother and the generation. Third-generation names use 16px text with a 1.55 line height; title text uses 14px with a 1.6 line height. Names and titles may wrap, including long uninterrupted names.

The responsive threshold belongs to the ancestry container, not the viewport: the same tree adapts inside a narrower dialog on a wide screen. This surface keeps the incumbent cream, green, serif/sans pairing and native disclosure behavior; it does not add a new design identity or global token scale.
