# Owner editor

Status: implemented extension of the approved Life with Labr identity. Visual source: `cms/public/index.html`, `admin.css`, `admin.js`, and `photo-editor.js`; crop geometry is in `photo-geometry.js`. Shared tokens and component variants are recorded in the root `DESIGN.md`.

## Purpose and sequence

One owner manages a shared photo gallery and litters. Gallery opens directly into a photo grid with a multi-file uploader, captions, earlier/later controls, removal, reset, and one Save changes button. There are no gallery posts, titles, dates, search or archive controls. Litters follow section → record list → editor → save draft or publish. Archive remains a separate, reversible litter action; the archive view returns to the current list. Keep these operations explicit and labelled in Russian.

## Composition

The forest header holds the existing text brand, a site-opening link, and logout. The cream workspace has a section sidebar and a broad main column. The list heading and create action precede a labelled search field, archive switch, and divided rows. A row combines photo, title, useful record details, and publication state. Published litters expose a separate «Все щенки проданы!» button beside the editor-opening control; the buttons are siblings. On narrow screens the close action moves below the record. A confirmation explains catalog removal, redirecting old public URLs and reversible archiving.

The editor begins with back navigation and record identity. Ruled sections group content, parents, puppy facts, and photos. Paired fields occupy two columns when space allows. Photo previews retain explicit reorder and remove controls. Saving/publishing stay in a sticky lower bar; record actions are separate from field editing. Draft state and published state remain distinguishable, including when a published record has new unpublished changes.

## Parent ancestry

Each mother's and father's section includes a «Родословная» group after the description, both for new litters and existing records. The first ancestor pair is visible immediately, with «Отец» and «Мать» fieldset legends and labelled name and optional title fields. Names are optional too; the helper asks the owner to enter only known facts. Native inline disclosures labelled «Родители отца» or «Родители матери», with the next generation number, reveal the second and third generations. Deeper pairs stack within a lightly indented, ruled branch. The disclosure chevron follows the open state and respects reduced motion. This is part of the existing editor and uses its save draft and publish actions.

Store at most three generations, two ancestors per pair, names up to 120 characters and titles up to 500. Server validation enforces the same bounds and string types. Empty nodes are omitted from public presentation; a node with known ancestors farther along its branch remains meaningful even without a name. Preserve paternal/maternal positions when only one member of a pair is known. The public presentation is recorded in [pedigree.md](pedigree.md).

Previously published ancestry is shared through `dist/pedigree-data.js`, which also supplies the editor's complete editable pairs. An explicitly empty tree remains empty after saving and reloading instead of restoring those original facts. Existing free-text ancestry remains editable as «Примечание к родословной» and is retained alongside the tree. A legacy note on its own takes precedence over the original tree fallback. New ancestry fields do not publish until the owner uses the existing publication action.

## Photo preparation

Selecting a file opens a modal preview before upload. Puppy photos use a fixed 3:4 frame and parent photos use 3:2; gallery photos start with their original proportions and may use 3:4, 3:2 or 1:1. The preview and exported image use the same crop. Owners can drag with a mouse or finger, move the frame with arrow keys, zoom, rotate in quarter turns, and reset. The desktop dialog pairs the preview with labelled controls and keeps its actions in a sticky footer. It uses the established cream, green, Manrope, and plain admin controls.

Show the original and final dimensions, with a readable warning when the crop's shorter side is below 800 px. Export WebP at no more than 2400 px on the longer side without enlargement. Each selected file is handled in sequence; Skip advances to the next, while Cancel stops the remaining selection and keeps photos already added. Uploads remain unsaved changes until the owner saves the gallery or saves/publishes the litter.

Existing previews show saved dimensions and a «Кадр и предпросмотр» action. Gallery previews retain the saved proportions; puppy and parent previews match their respective frames. Re-editing starts from the saved file, so restoring an already cropped-out area requires selecting the original again. After the upload or edit sequence, keyboard focus returns to its initiating control.

## Visual expression

Use Manrope working headings and body text, cream page surfaces, forest primary buttons, pale input surfaces, visible labels, and restrained separators. The existing admin text wordmark is an implementation detail, not an additional system-wide display font. Public album frames, serif card titles, gold gradient CTAs, and availability ribbons do not become editor chrome.

## Responsive behavior

- Above 850px: 230px sidebar within a maximum 1500px workspace; main padding uses `44px clamp(24px,5vw,72px) 110px`.
- At 850px and below: sidebar navigation becomes a top strip and its explanatory paragraph disappears. The first ancestry pair also becomes one column, with a separator before the mother's branch.
- At 700px and below: the photo dialog stacks preview above controls; its footer actions wrap and the primary action fills the remaining space.
- At 600px and below: main padding is `26px 18px 100px`; page headings stack; paired fields become one column; record rows wrap; photo previews use two columns; the sticky save area stacks its status and two equal action columns. Ancestry inputs use 16px text, and nested ancestry indentation reduces from 20px to 14px.
- Base fields remain at least 46px high and base action buttons at least 44px high. Compact photo controls and header utility actions keep their implemented exceptions; these are not a new general target-size rule.

The gallery grid uses flexible columns of at least 210px on desktop and two columns on mobile (one below 360px). Photo controls retain 44px targets; the Save changes button is first in the mobile save bar. Existing gallery publication records are merged without publishing pending edits; their original data remains in history.

## Feedback

Puppy availability keeps a native select with a styled picker in browsers supporting `appearance: base-select`. The menu uses the light input surface, 48px option targets, pale green selection and a trailing checkmark. Availability markers are a green circle, gold circle and forest diamond; the unspecified state uses an outline circle. Labels remain essential. The browser owns keyboard selection, focus, dismissal and popup placement. Browsers without customizable-select support retain the standard native picker.

Keep saving state in the sticky bar and use the existing transient notice for operation results. Inputs preserve their values across routine record actions. Errors use Russian text, a visible error treatment, and an alert/status role where already implemented. Disabled buttons show the waiting state. Do not add public availability claims to administrative publication badges.

## Existing details not promoted into the shared system

The current implementation includes a Georgia text wordmark and text glyph direction/external-link cues. These are recorded as incumbent details rather than reusable display or icon standards. This documentation pass does not change them.
