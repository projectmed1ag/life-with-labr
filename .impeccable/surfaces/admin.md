# Owner editor

Status: implemented extension of the approved Life with Labr identity. Visual source: `cms/public/index.html`, `admin.css`, and `admin.js`. Shared tokens and component variants are recorded in the root `DESIGN.md`.

## Purpose and sequence

One owner manages a shared photo gallery and litters. Gallery opens directly into a photo grid with a multi-file uploader, captions, earlier/later controls, removal, reset, and one Save changes button. There are no gallery posts, titles, dates, search or archive controls. Litters follow section → record list → editor → save draft or publish. Archive remains a separate, reversible litter action; the archive view returns to the current list. Keep these operations explicit and labelled in Russian.

## Composition

The forest header holds the existing text brand, a site-opening link, and logout. The cream workspace has a section sidebar and a broad main column. The list heading and create action precede a labelled search field, archive switch, and divided rows. A row combines photo, title, useful record details, and publication state.

The editor begins with back navigation and record identity. Ruled sections group content, parents, puppy facts, and photos. Paired fields occupy two columns when space allows. Photo previews retain explicit reorder and remove controls. Saving/publishing stay in a sticky lower bar; record actions are separate from field editing. Draft state and published state remain distinguishable, including when a published record has new unpublished changes.

## Visual expression

Use Manrope working headings and body text, cream page surfaces, forest primary buttons, pale input surfaces, visible labels, and restrained separators. The existing admin text wordmark is an implementation detail, not an additional system-wide display font. Public album frames, serif card titles, gold gradient CTAs, and availability ribbons do not become editor chrome.

## Responsive behavior

- Above 850px: 230px sidebar within a maximum 1500px workspace; main padding uses `44px clamp(24px,5vw,72px) 110px`.
- At 850px and below: sidebar navigation becomes a top strip; its explanatory paragraph and the header's small descriptive label disappear.
- At 600px and below: main padding is `26px 18px 100px`; page headings stack; paired fields become one column; record rows wrap; photo previews use two columns; the sticky save area stacks its status and two equal action columns.
- Base fields remain at least 46px high and base action buttons at least 44px high. Compact photo controls and header utility actions keep their implemented exceptions; these are not a new general target-size rule.

The gallery grid uses flexible columns of at least 210px on desktop and two columns on mobile (one below 360px). Photo controls retain 44px targets; the Save changes button is first in the mobile save bar. Existing gallery publication records are merged without publishing pending edits; their original data remains in history.

## Feedback

Keep saving state in the sticky bar and use the existing transient notice for operation results. Inputs preserve their values across routine record actions. Errors use Russian text, a visible error treatment, and an alert/status role where already implemented. Disabled buttons show the waiting state. Do not add public availability claims to administrative publication badges.

## Existing details not promoted into the shared system

The current implementation includes a Georgia text wordmark and text glyph direction/external-link cues. These are recorded as incumbent details rather than reusable display or icon standards. This documentation pass does not change them.
