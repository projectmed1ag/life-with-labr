---
name: Life with Labr
description: A warm photographic kennel website with a restrained owner editor.
colors:
  forest: "#172b24"
  forest-hover-public: "#263e33"
  cream: "#f4f1e9"
  gold: "#dec396"
  public-ink: "#253b30"
  public-muted: "#70756b"
  public-panel-muted: "#d2d6cb"
  public-line: "rgba(37,59,48,.2)"
  ribbon-reserved: "#e8d1a7"
  ribbon-home: "#f4e4c5"
  admin-muted: "#536259"
  admin-line: "#cccfc5"
  admin-input: "#fffefa"
  admin-primary-text: "#fffdf8"
  admin-hover: "#304b3d"
  admin-quiet-hover: "#e4e8df"
  admin-selected: "#dfe6da"
  admin-state-draft: "#ede0c4"
  admin-state-draft-text: "#715223"
  admin-state-live: "#dfe8da"
  admin-state-live-text: "#304b30"
typography:
  display-public:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(64px, 6.7vw, 96px)"
    fontWeight: 400
    lineHeight: 1.04
  title-puppy:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "46px"
    fontWeight: 400
    lineHeight: 1.1
  body-public:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
  action-public:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.2
  price:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(18px, 1.8vw, 24px)"
    fontWeight: 500
  heading-admin:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "clamp(26px, 3vw, 38px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.035em"
  body-admin:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  label-admin:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 550
rounded:
  small: "4px"
  field: "6px"
  control: "8px"
  album-frame: "12px"
  album-panel: "16px"
spacing:
  compact: "8px"
  control: "12px"
  text: "16px"
  group: "20px"
  editor: "22px"
  inset: "24px"
  panel: "28px"
  section-small: "32px"
  section-medium: "40px"
  section-large: "48px"
components:
  button-public:
    textColor: "{colors.forest}"
    typography: "{typography.action-public}"
    rounded: "{rounded.album-frame}"
    padding: "15px 22px"
  button-admin-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.admin-primary-text}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
  button-admin-primary-hover:
    backgroundColor: "{colors.admin-hover}"
    textColor: "{colors.admin-primary-text}"
  button-admin-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
  button-admin-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  input-admin:
    backgroundColor: "{colors.admin-input}"
    textColor: "{colors.forest}"
    rounded: "{rounded.field}"
    padding: "12px"
  state-admin-draft:
    backgroundColor: "{colors.admin-state-draft}"
    textColor: "{colors.admin-state-draft-text}"
    rounded: "{rounded.small}"
    padding: "5px 9px"
  state-admin-live:
    backgroundColor: "{colors.admin-state-live}"
    textColor: "{colors.admin-state-live-text}"
    rounded: "{rounded.small}"
    padding: "5px 9px"
  puppy-panel:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.cream}"
    padding: "56px 26px 26px"
---

# Design System: Life with Labr

## Overview

**Creative North Star: "The Family Photo Album"**

This name describes the existing, user-approved public style; it does not introduce a new identity. Cream paper, forest-green panels, warm gold actions, expressive serif headings, and real kennel photography make the public site feel personal and composed. Slightly tilted photograph frames overlap their accompanying text panels.

The owner editor uses the same cream and green foundation with Manrope text, visible field labels, simple rows, and explicit actions. It is a quieter application of the identity. Album composition and decorative photography belong to the public presentation, while operational layout is recorded in [.impeccable/surfaces/admin.md](.impeccable/surfaces/admin.md).

This is a source scan of the shipped extension: `dist/style.css`, `pages.css`, `fonts.css`, `brand.css`, `header.css`, `home.css`, `puppies-catalog.css`, `src/render-litters.mjs`, and `cms/public/{index.html,admin.css,admin.js}`. The frontmatter records extracted values; component CSS in `.impeccable/design.json` preserves details the token schema cannot express. Sidecar tonal ramps are generated palette previews, not additional production color tokens. Existing public brand artwork remains the visual authority.

**Key Characteristics:**

- Real photographs in light album frames, with green copy panels.
- Cormorant Garamond for public display and Manrope for readable detail.
- Warm gold for public actions, emphasis, prices, and selected status treatments.
- A calm, plainly labelled admin with lists, fields, and publication state.

## Colors

The palette pairs paper warmth with deep foliage tones and a soft gold accent.

### Primary

- **Forest** anchors public panels and both headers; it is also the admin's primary action and text color.
- **Forest hover public** supplies subtle contrast inside public contact choices.

### Secondary

- **Gold** marks public calls to action, prices, focus on dark panels, and selected highlights. The canonical public button also uses the incumbent warm gold gradient recorded in the sidecar.
- **Reserved ribbon** and **home ribbon** are contextual status colors on photographs. They do not replace textual status labels.

### Neutral

- **Cream** is the shared page ground and the public photograph frame.
- **Public ink**, **public muted**, and **public panel muted** separate main copy, supporting copy on cream, and supporting copy on forest.
- **Public line** provides quiet divisions; the admin uses its own opaque **admin line**.
- **Admin input** is a slightly lighter field surface. **Admin muted** carries helper text. **Admin selected** and **admin quiet hover** distinguish navigation and control states.
- **Admin state draft** and **admin state live**, each with their paired text color, communicate publication state. They are separate from the availability ribbons on public puppy photographs.

**The Surface Context Rule.** Preserve the distinction between public gold actions and admin forest actions; a shared palette does not make their button treatments interchangeable.

## Typography

**Display Font:** Cormorant Garamond, with Georgia and serif fallbacks, on the public site.
**Body Font:** Manrope, with Arial/sans-serif fallbacks publicly and system-ui/sans-serif in the admin.

The serif supplies the public site's gentle, editorial character. Manrope carries facts, prices, forms, navigation, and operational headings. Fonts are locally supplied through `dist/fonts.css`, using `font-display: swap`; the public identity artwork is not recreated with a new text font.

### Hierarchy

- **Public display:** the frontmatter display role describes the catalogue heading. Litter detail headings use `clamp(54px, 5.7vw, 88px)`; the home heading has its own observed `clamp(48px, 5.6vw, 88px)` expression. Do not flatten these surface-specific ramps into one size.
- **Public titles:** puppy names use the frontmatter puppy title role; parent names are (48px), section group titles (52px), and catalogue card headings `clamp(48px, 4.5vw, 70px)`.
- **Public body:** global paragraphs use the frontmatter body role; parent and puppy details use compact (14px) text, with descriptions commonly bounded at (44ch).
- **Public actions:** the main gold CTA uses the serif action role. Header contact controls use Manrope (14px, 600); puppy contact summaries use a (20px) serif treatment.
- **Prices:** use the frontmatter price role, tabular numerals, and no line break within the amount. Prices align to the right of the name row.
- **Admin:** the frontmatter heading, body, and label roles apply. Section headings use (21px, 650); record titles (19px), helper text (13px), and publication tags (12px). Paragraphs are bounded at (70ch).

**The Reading Roles Rule.** Public serif expression belongs to headings and established CTAs; admin forms and working headings retain Manrope.

## Layout

Public sections use generous vertical space and percentage gutters: the base section is (110px 7%), with mobile gutters of (6%). At very wide widths (1700px and above), gutters can center content within (1460px). The catalogue and litter surfaces provide their own section spacing.

- Catalogue cards: a (1180px) maximum, two columns in a (1.06fr / 1fr) ratio, and a photograph overlapping the text panel by (36px). At (700px) and below, cards become a single column capped at (480px), with the panel overlapping the photograph vertically by (24px).
- Litter content: parent and puppy sections are capped at (1200px). Parents use two columns; puppy cards use three, then two at (1000px), then one at (600px). Mobile single-column cards are capped at (480px).
- Puppy name and price: a full-width flex row with baseline alignment, a (16px) gap, and wrapping. The name may wrap; the price's auto left margin keeps it at the available right edge, including when wrapping onto another line.
- Public navigation: the final header has a centred brand, social links, and contact controls above a separate navigation row. At (760px), it switches to the compact header and menu control. Do not infer the header breakpoint from the base stylesheet's older (700px) rules.
- Admin: a centred (1500px) workspace with a (230px) sidebar and a flexible main column. At (850px), navigation becomes a horizontal strip above the content. At (600px), paired fields become one column, save actions use two equal columns, and record thumbnails reduce from (88px square) to (64px × 74px).

The sidecar lists breakpoints by purpose, because the public and admin surfaces deliberately use different thresholds. The admin surface brief preserves editor composition and workflow without turning it into a global page template.

## Elevation & Depth

The public album uses soft shadows and restrained overlap to give photographs a physical edge. Green panels supply tonal depth. Gold CTA gradients and fine inset highlights are part of the incumbent style. Admin rows and fields remain flat; only the transient notice is elevated.

### Shadow Vocabulary

- **Album photograph** (`0 18px 42px #172b2420`): catalogue, parent, and puppy frames.
- **Mobile catalogue photograph** (`0 8px 22px #172b241a`): the smaller stacked catalogue card.
- **Status ribbon** (`0 4px 12px #172b2425`): the ribbon above a photograph.
- **Admin notice** (`0 8px 28px #172b2430`): temporary save/error feedback above the editor.

Album interactions use `cubic-bezier(.16,1,.3,1)` with short control transitions and slower photograph settling. Fine-pointer hover can straighten a tilted frame and gently enlarge the photograph. Reduced-motion rules disable the related animations and transforms. Admin controls use short color transitions (0.16s), disabled under reduced motion.

## Shapes

Album frames have rounded outer corners from the frontmatter and small inner photograph corners; the green panel has rounded lower corners (or right corners in the horizontal catalogue). Puppy portraits use a (3:4) image ratio; parent photographs use (1.5). Frame padding is (8px) for puppy portraits and (10px) for parents, reducing on mobile.

Public photographs use slight rotations: puppy cards cycle through (-1.2deg), (0.8deg), and (-0.6deg); at (600px) all use (-0.6deg). These are album materials, not a general rule for controls. The public status ribbon uses a small rounded leading edge, a folded trailing corner, and a bow SVG for the new-family state.

Admin fields, buttons, tags, and thumbnails use the smaller corner roles from the frontmatter. List rows have square edges and thin separators. Public social links are circular; ordinary editor buttons are not.

## Components

### Buttons

Public gold CTAs are softly rounded and use the established gold gradient, border, and serif label. The header's compact contact button is a flat-gold Manrope variant. Public keyboard focus is visible; on dark puppy panels the focus outline is gold. Catalogue and litter button presses use a slight (0.98) scale when motion is permitted.

Admin primary buttons use forest with light text; secondary controls are transparent with a muted green border; quiet controls omit the visible border. Base buttons have a (44px) minimum height. Hover changes the fill, and keyboard focus uses a (3px) warm outline with a (3px) offset. Disabled controls become partially opaque and indicate waiting. Smaller photo tools retain their observed compact size within the editor.

### Chips and status

Admin publication state appears as a compact text tag beside a record or under its heading. Draft/changed state and published state use their respective semantic pairs. The visible label is essential.

Public availability is a ribbon on the puppy photograph. Unspecified status creates no ribbon. Available and reserved states use text; the new-family state also includes the bow. Reserved and new-family puppies show a plain explanatory sentence in place of the inquiry control. A ribbon never substitutes for the name or price.

### Cards and containers

The public album card joins a real photograph to a forest panel containing a serif name, Manrope facts, description, and appropriate action. The puppy price sits at the right edge of the full-width name row. Multiple photo thumbnails form a horizontal strip and remove the usual overlap between portrait and copy panel.

Admin record rows are full-width buttons with a thumbnail or actual empty-photo placeholder, title, supporting details, publication state, and a trailing direction cue. Editors use ruled sections rather than nested decorative cards.

### Inputs and fields

Admin labels sit above inputs with an (8px) gap. Inputs, selects, and textareas have a visible muted border, the admin input surface, (12px) padding, and a (46px) minimum height. Textareas resize vertically. Help follows the field in muted text; errors remain readable text. Upload controls use a dashed border and a visible `focus-within` outline; uploaded photos have previews and explicit reorder/remove controls.

### Navigation

Public desktop navigation uses text links with an animated gold underline and a gold current-page state. Mobile navigation is an existing full-height forest menu with large serif links. Admin navigation uses plain Manrope buttons; the current section has a pale green fill and stronger weight. It changes position at the admin breakpoint without adopting the public overlay menu.

### Photography and dialogs

Use the kennel's real uploaded photographs and descriptive alternatives. Portraits and parent photos open the established image viewer, where `object-fit: contain` preserves the whole photograph. Previous/next controls move toward the lower edge on mobile. The editor's previews use cropped thumbnails for selection and ordering.

## Do's and Don'ts

### Do:

- **Do** preserve the approved cream, forest, gold, real-photography, and serif/sans pairing.
- **Do** apply public and admin component variants in their documented surface context.
- **Do** keep the puppy name row full width and allow the name to wrap while the price stays right-aligned.
- **Do** show publication and availability state with explicit text, including on mobile.
- **Do** preserve visible keyboard focus and the existing reduced-motion behavior.

### Don't:

- **Don't** carry album tilts, display typography, or decorative photo overlap into the owner editor.
- **Don't** invent prices, availability, or decorative status claims when data is absent.
- **Don't** show an inquiry action for a reserved puppy or one already with a new family.
- **Don't** replace the established brand artwork or real puppy photography as part of an ordinary extension.

The owner’s gallery is a single album editor: direct photo grid, captions, earlier/later controls, removal, reset and one Save changes action. Post lists, publication names and dates are not part of this surface. Public photos form one continuous grid.
