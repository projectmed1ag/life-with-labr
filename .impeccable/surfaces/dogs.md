# Kennel dogs

Mode: Read — visitors learn about the kennel's dogs through photographs, known facts, achievements, health results, and ancestry, then contact the kennel.

Status: implemented extension of the approved Life with Labr identity. Sources: `src/data/dogs.json`, `src/render-dogs.mjs`, `src/pages/dogs.html`, `build.mjs`, `dist/dogs.css`, and the shared pedigree and photo-viewer components. Shared visual authority remains the root `DESIGN.md`; editing and publication are recorded in [admin.md](admin.md).

## Content and routes

The catalogue at `/dogs/` contains published dog records in the order selected with «Выше» / «Ниже» in the admin list. New dogs appear last. Position remains internal; the owner never needs to enter numbers. The first saved photograph is the cover. Each entry shows breed and sex, color when supplied, the dog's name, optional short description, and «Подробнее». Both the cover and the text link open the individual `/dogs/<id>/` page. If there are no published records, show the existing brief empty-state message.

A profile's identifier is generated once and remains stable when its name changes. Russian and English profiles share it under `/dogs/` and `/en/dogs/`; navigation and language links retain the matching locale. Interface labels use the existing translation mechanism. Owner-entered content has no automatic translation or separate English editing fields.

The individual page renders its content into HTML: breadcrumb navigation, cover, name, full description, known facts, and a contact link to the page's contact section. Additional photos, achievements, health tests, and the three-generation pedigree follow when supplied. Omit empty optional facts and sections. Health results are supplied by the owner; missing tests do not imply a result. The existing photo viewer opens the cover or additional photos. The pedigree reuses the same empty-branch, relationship, and responsive disclosure rules documented in [pedigree.md](pedigree.md); an existing text note follows the tree.

Draft edits do not replace the published profile. Removing publication removes its public route and catalogue/sitemap entries. Archiving also preserves the record and photos and redirects its old Russian or English URLs to the corresponding catalogue. Restoring returns a draft that must be published again. The four existing dogs — Edel, Vanessa, Mars, and Aria — seed the CMS once with their original facts and photographs; later owner edits and archive state survive restart.

## Composition and responsive behavior

Preserve the cream, forest, and gold palette, Cormorant Garamond headings, Manrope facts and body text, and real kennel photography. The catalogue keeps the existing two-column composition with staggered even entries on wide screens. At 700px and below it becomes a single column and removes the stagger. Names wrap; the catalogue uses 48px names on wide screens and 42px on narrow screens.

The profile starts with a photograph and a facts column on wide screens. Its serif name scales from 48px to 80px. The cover preserves the photograph's proportions, including the existing asset-specific display crop for Aria. The original show photographs retain their established catalogue crops; newly prepared dog photographs use the editor's fixed 3:2 crop. Additional photos form three columns, achievements form two, and the remaining sections use quiet horizontal rules and the established spacing.

At 700px and below the cover precedes the copy in one column, achievements stack, and additional photos use two columns. Long names and fact values wrap. Ancestry responds to its own container width, with native disclosures on narrow containers. Reuse the current photo viewer and contact section rather than adding another interaction or visual system.

## Evidence and limits

The finish review approved this extension. `.impeccable/review/dogs-cms/verification.txt` records the build, route and CMS test results, including migration, independent drafts, publication validation, ordering, both locales, sitemap, archive/restore and render-failure rollback. Its eight local captures cover the admin list and editor, catalogue, desktop and mobile profiles, and mobile ancestry. The public mobile check found no page overflow at the inspected 390px viewport. Native archive confirmation was not completed by browser automation; API/store checks verified its behavior, and the local test record was later archived through the authenticated local API. These are local QA results, not production captures or a production deployment.

Saved photo edits begin from the stored image. An area removed by an earlier crop can only be recovered by selecting the original file again; the viewer displays the saved result.
