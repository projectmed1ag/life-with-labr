# Owner editor

Status: implemented extension of the approved Life with Labr identity. Visual source: `cms/public/index.html`, `admin.css`, `admin.js`, and `photo-editor.js`; crop geometry is in `photo-geometry.js`. Shared tokens and component variants are recorded in the root `DESIGN.md`.

Mode: Operate. The owner signs in and completes editing tasks, including from a phone.

## Purpose and sequence

One owner manages a shared photo gallery, litters, and kennel dogs. The section navigation contains «Помёты и щенки», «Наши собаки», and «Галерея». Gallery opens directly into a photo grid with a multi-file uploader, earlier/later controls, removal, reset, and one Save changes button. There are no gallery posts, titles, dates, search, caption fields or archive controls. Photo caption editing was removed at the owner’s request because the public gallery has no visible captions; existing alternative image descriptions remain in stored data. Litters and dogs follow section → record list → editor → save draft or publish. Archive remains a separate, reversible record action; the archive view returns to the current list. Keep these operations explicit and labelled in Russian.

## Composition

### Login direction contract

THESIS: A compact branded entrance with the credentials and sign-in action. The visible «Вход в админку» heading and gallery/litters subtitle are removed as requested by the owner.

OWN-WORLD: Preserve the established forest, cream, Manrope fields and forest buttons. The approved `dist/assets/brand-header-v1.webp` logo is reused in the `46 110 2082 500` SVG viewport from `src/brand.html`; its provenance is recorded beside the asset. No new illustration or display font.

STORY: Recognize the kennel, enter the username and password, sign in. A quiet link returns to the public website. Existing authentication and recovery behavior remain intact.

FIRST VIEWPORT: One centered panel, at most 440px wide, with 16px corners and `0 20px 64px #172b241c` shadow on a warm sand (#e9e3d7) surface. Its logo sits above a cream form with two labelled fields, inline errors, a full-width primary action and a site link. Outer padding is `40px 20px`, logo padding `32px 36px`, and form padding `32px 36px 24px`, with a 22px form gap. The logo link is capped at 320px. At 480px and below, these paddings become `28px 20px`, `28px 24px`, and `28px 24px 18px` respectively. The surface has a `100svh` minimum height with a `100vh` fallback; short screens scroll naturally.

FORM: Code-led refinement of the incumbent login, not a new visual world. No direction roll or comp round applies to this bounded extension. Native form behavior is the interaction contract.

FINISH: The reviewer approved the implemented UI and behavior in `.impeccable/review/login/{desktop,mobile,mobile-error,narrow}.png`. The requested documentation correction records the login variant in `DESIGN.md` and its sidecar; the reused logo has its provenance sidecar.

Login controls retain visible labels and native required-field validation. The username is prefilled with `admin`, uses username autocomplete, and disables autocapitalization and spellcheck; the password uses current-password autocomplete. Inputs and the primary action have 52px minimum heights and 16px text. The action adds 6px top margin; the 44px-high site link uses 13px text and -8px top margin. Empty errors are hidden; failed authentication displays Russian feedback in the alert region without clearing entered values. Submission disables the action and shows «Входим…», then restores «Войти» on failure. Logo focus is gold on forest; other controls retain the warm admin outline. The existing session-expiry recovery restores the pending editor values after successful sign-in.

### Authenticated workspace

The forest header holds the existing text brand and a grouped pair of 46px utility buttons: a cream site-opening link and an outlined logout action. Both retain visible labels and use matching 18px stroke icons. Gold focus outlines and hover accents stay legible on forest. At 600px and below the actions occupy a second row; the site link fills its spare width. The cream workspace has a section sidebar and a broad main column. The list heading and create action precede a labelled search field, archive switch, and divided rows. A row combines photo, title, useful record details, and publication state. Published litters expose a separate «Все щенки проданы!» button beside the editor-opening control; the buttons are siblings. On narrow screens the action moves below the record. Closing keeps the public catalogue card with a gold sold ribbon and bow while removing all detail links and redirecting old detail URLs to the catalogue. The same row and editor expose «Вернуть в продажу», which restores the published page immediately. Closing is separate from archiving; it preserves puppy statuses and private draft edits. Legacy archived litters with a previous publication also have a one-click «Вернуть в продажу» action. The confirmation explains that the card stays visible and the page can be reopened.

The editor begins with back navigation and record identity. Ruled sections group content, parents, puppy facts, and photos. Paired fields occupy two columns when space allows. Photo previews retain explicit reorder and remove controls. Saving/publishing stay in a sticky lower bar; record actions are separate from field editing. Draft state and published state remain distinguishable, including when a published record has new unpublished changes.

## Parent ancestry

Each mother's and father's section includes a «Родословная» group after the description, both for new litters and existing records. The first ancestor pair is visible immediately, with «Отец» and «Мать» fieldset legends and labelled name and optional title fields. Names are optional too; the helper asks the owner to enter only known facts. Native inline disclosures labelled «Родители отца» or «Родители матери», with the next generation number, reveal the second and third generations. Deeper pairs stack within a lightly indented, ruled branch. The disclosure chevron follows the open state and respects reduced motion. This is part of the existing editor and uses its save draft and publish actions.

Store at most three generations, two ancestors per pair, names up to 120 characters and titles up to 500. Server validation enforces the same bounds and string types. Empty nodes are omitted from public presentation; a node with known ancestors farther along its branch remains meaningful even without a name. Preserve paternal/maternal positions when only one member of a pair is known. The public presentation is recorded in [pedigree.md](pedigree.md).

Previously published ancestry is shared through `dist/pedigree-data.js`, which also supplies the editor's complete editable pairs. An explicitly empty tree remains empty after saving and reloading instead of restoring those original facts. Existing free-text ancestry remains editable as «Примечание к родословной» and is retained alongside the tree. A legacy note on its own takes precedence over the original tree fallback. New ancestry fields do not publish until the owner uses the existing publication action.

## Kennel dogs

«Наши собаки» opens a record list with «Добавить собаку», a labelled search by name, and «Архив» / «Показать текущих». Rows reuse the litter list's photo or empty-photo placeholder, name, sex and optional color, publication state, and editor-opening control. Visible «Выше» and «Ниже» arrow buttons move a dog one row at a time and immediately save the public order. The first up and last down controls are disabled. Controls are absent in the archive and hidden during search, with a hint to clear search. A new dog is appended at the end. Reordering preserves all unpublished profile edits and draft visibility; stale lists are rejected without overwriting newer changes. An empty current list invites the owner to create a profile, while an empty archive explains its purpose.

The editor groups «О собаке», «Фотографии», «Достижения», «Тесты здоровья», and «Родословная» into the existing ruled sections. Facts include name, sex, color, birth date, kennel of origin, owner, and breeder. There is no numeric position field in the editor. Keep the catalogue summary distinct from the full page description. Achievements and health tests use repeatable labelled rows with an explicit add and remove action. Health help asks for confirmed results only. Blank rows are omitted; a row with details or a result needs a title before publication. A profile may have up to 20 photos, with the first photo as its cover; photos retain alternative descriptions, reorder, remove, and «Кадр и предпросмотр» controls. The dog uses the same three-generation ancestor editor, with its own tree and any retained legacy note.

Publication requires a name and at least one photo. «Сохранить черновик» preserves pending edits without replacing the public version; «Опубликовать» updates the catalogue and individual page. The sticky bar distinguishes unsaved changes from saved, unpublished changes. A published record exposes «Посмотреть на сайте». The generated identifier gives the profile a stable `/dogs/<id>/` address independent of later name edits; no slug field is exposed.

«Снять с публикации» keeps the draft. «В архив» saves the record and photos, removes its public page and catalogue/sitemap entries, and redirects old Russian and English addresses to the matching catalogue. Both actions use a native confirmation. Archived fields are disabled and the sticky bar offers «Восстановить в черновики»; restoring does not publish. The initial four dogs are imported once from `src/data/dogs.json` using the `dogs-seeded-v1` migration marker, preserving their existing facts and photographs and avoiding overwriting owner edits or reviving archived records on restart. Public presentation is recorded in [dogs.md](dogs.md).

## Photo preparation

Selecting a file opens a modal preview before upload. Puppy photos use a fixed 3:4 frame; parent and kennel dog photos use 3:2. Gallery photos start with their original proportions and may use 3:4, 3:2 or 1:1. The preview and exported image use the same crop. Owners can drag with a mouse or finger, move the frame with arrow keys, zoom, rotate in quarter turns, and reset. The desktop dialog pairs the preview with labelled controls and keeps its actions in a sticky footer. It uses the established cream, green, Manrope, and plain admin controls.

Show the original and final dimensions, with a readable warning when the crop's shorter side is below 800 px. Export WebP at no more than 2400 px on the longer side without enlargement. Each selected file is handled in sequence; Skip advances to the next, while Cancel stops the remaining selection and keeps photos already added. Uploads remain unsaved changes until the owner saves the gallery or saves/publishes the litter or dog.

Existing previews show saved dimensions and a «Кадр и предпросмотр» action. Gallery previews retain the saved proportions; puppy, parent and dog previews match their respective frames. Re-editing starts from the saved file, so restoring an already cropped-out area requires selecting the original again. After the upload or edit sequence, keyboard focus returns to its initiating control.

## Visual expression

Use Manrope working headings and body text, cream page surfaces, forest primary buttons, pale input surfaces, visible labels, and restrained separators. The existing admin text wordmark is an implementation detail, not an additional system-wide display font. Public album frames, serif card titles, gold gradient CTAs, and availability ribbons do not become editor chrome.

## Responsive behavior

- Above 850px: 230px sidebar within a maximum 1500px workspace; main padding uses `44px clamp(24px,5vw,72px) 110px`.
- At 850px and below: sidebar navigation becomes a wrapping top strip and its explanatory paragraph disappears. The first ancestry pair also becomes one column, with a separator before the mother's branch.
- At 700px and below: the photo dialog stacks preview above controls; its footer actions wrap and the primary action fills the remaining space.
- At 600px and below: main padding is `26px 18px 100px`; page headings stack; paired fields become one column; record rows wrap; photo previews use two columns; the sticky save area stacks its status and two equal action columns. Ancestry inputs use 16px text, and nested ancestry indentation reduces from 20px to 14px.
- Base fields remain at least 46px high and base action buttons at least 44px high. Compact photo controls keep their implemented exceptions; header utility actions are at least 46px high on every viewport.

The gallery grid uses flexible columns of at least 210px on desktop and two columns on mobile (one below 360px). Photo controls retain 44px targets; the Save changes button is first in the mobile save bar. Existing gallery publication records are merged without publishing pending edits; their original data remains in history.

Dog photo previews use a 3:2 frame. At 600px and below they take the available width and their reorder/remove targets are at least 44px high. The three section buttons wrap with 13px text and retain visible labels.

## Feedback

Puppy availability keeps a native select with a styled picker in browsers supporting `appearance: base-select`. The menu uses the light input surface, 48px option targets, pale green selection and a trailing checkmark. Availability markers are a green circle, gold circle and forest diamond; the unspecified state uses an outline circle. Labels remain essential. The browser owns keyboard selection, focus, dismissal and popup placement. Browsers without customizable-select support retain the standard native picker.

Keep saving state in the sticky bar and use the existing transient notice for operation results. Inputs preserve their values across routine record actions. Errors use Russian text, a visible error treatment, and an alert/status role where already implemented. Disabled buttons show the waiting state. Do not add public availability claims to administrative publication badges.

## Existing details not promoted into the shared system

The current implementation includes a Georgia text wordmark and text glyph direction/external-link cues. These are recorded as incumbent details rather than reusable display or icon standards. This documentation pass does not change them.

## Dog extension verification

The finish review disposition is ship. Local desktop (1280 × 900) and mobile (390 × 844) evidence is saved in `.impeccable/review/dogs-cms/`, with the recorded checks in `verification.txt`. The pass covered the initial records, creating a dog, 3:2 photo preparation, titles, health and ancestry entry, draft saving, publication, public profiles, and the photo viewer. The native archive confirmation stalled browser automation; archive and restore behavior were verified independently through API/store checks, and the local QA record was subsequently archived through the authenticated local API. No production content was edited. The later empty-health guard in the existing parent dialog was accepted by the finish reviewer. This extends the approved visual system; root `DESIGN.md` and `.impeccable/design.json` remain unchanged by the documentation pass.
