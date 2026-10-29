# Phase 1: Workspace and read-only inspection

## Workspace and account

- Confirmed the working directory is `C:\HubSpot-Training\HubSpot-Session3\Assignment-Question-2`.
- Created `original-backup`, `working`, `module-references`, `evidence`, and `docs`.
- `hs account list` shows `staging-environment` as portal `51856488`; the CLI's default account remains `niraj-hub-spot-training` (`247552536`). The default was not changed.
- Remote listing and fetch commands used `--account=staging-environment`.
- No remote files, modules, pages, or global partials were modified, uploaded, or published.

## Source template and remote paths

Selected the existing **SW Service Page** as the base because it already provides the expected Smithworks page shell, editable service-oriented content, and responsive module examples.

- Remote template: `smithworks/sw-templates/SW Service Page.html`
- Local unchanged backup: `original-backup/SW Service Page.html`
- Remote module directory: `smithworks/sw-modules`
- Remote global partial directory: `smithworks/sw-partials`

The base template is available for new content, has a main DND area, and retains Smithworks shared header/footer partials plus theme asset references. Its current layout has seven content sections. For the future service landing page, use its first three existing module patterns—**SW Hero**, **SW Body + Inset**, and **SW Cards**—as the concise 3-section structure, rather than carrying over the Testimonials, FAQ, and blog sections.

Recommended page structure:

1. **Hero:** service-specific headline, short value proposition, and an ordinary page-specific CTA.
2. **Service overview:** SW Body + Inset with `show_inset=false`, an H2, and editable rich text.
3. **Service options:** SW Cards with a concise service heading and editable service cards.

Keep the DND sections full-width with zero section padding as in the base; configure spacing on modules. Retain the existing global header/footer toggles and shared theme includes/assets. The base demonstrates the theme image URL pattern `get_asset_url('../images/sw-defaults/...')`.

## Downloaded module references and verified fields

Each module was fetched into its own folder to preserve its actual `fields.json`, `module.html`, `module.css`, `module.js`, `meta.json`, and locale files:

- `smithworks/sw-modules/SW Hero.module` → `module-references/SW Hero/`
- `smithworks/sw-modules/SW Cards.module` → `module-references/SW Cards/`
- `smithworks/sw-modules/SW Body + Inset.module` → `module-references/SW Body + Inset/`

The following field names and choices were read from those downloaded schemas:

### SW Hero

- Editable content: `heading_items[]` (including `heading_text`, semantic `heading_size`, `heading_display_size`, `heading_color`, and `heading_align`), `content_area`, and `content_style`.
- CTA editor: `cta_button_items[]` (`text`, `link`, `style`, `size`, optional icon fields) and `cta_alignment`.
- Presentation settings: `styles.module_settings` includes `spacing`, `outer_background_width`, `inner_spacing`, `max_module_width`, and XL/LG/MD/SM module-height groups with breakpoint overrides and vertical alignment.
- Verified `content_style` values include `default`, `large_balanced`, `large_fullwidth`, `small`, and `blockquote`. Hero heading size choices include H1–H6 and paragraph; the display-size field has its own separate choices.

### SW Body + Inset

- Editable content: `heading_items[]`, `body_rich_text`, and `content_style`.
- Optional inset: `show_inset` and the `inset` group. The existing base sets `show_inset=false`, a suitable default for the proposed overview section.
- Presentation settings include outer/inner spacing and width controls; the responsive CSS has desktop, tablet, and mobile media-query rules.
- `content_style` supports the same verified values listed above. The `show_inset` field is a boolean.

### SW Cards

- Editable section header: `heading_items[]`, `description`, `content_style`, and heading button fields.
- Editable cards: `cards[]` supports card title (`admin_title`), media (`icon_type`, `icon`, `image`, SVG, or video-related fields), card `heading_items[]`, `rich_text`, and optional button text/link/style/size/alignment.
- Responsive grid fields: `styles.cards_layout.cards_per_row_xl`, `cards_per_row`, `cards_per_row_tablet`, and `cards_per_row_mobile`. XL and breakpoint choices are declared in `fields.json`; the schema documents XL as 1200px+, desktop as 992–1199px, tablet as 768–991px, and mobile as ≤767px. The mobile field defaults to one card per row; the other base defaults include three on XL and inherited settings at intermediate breakpoints.
- CSS also contains corresponding XL, desktop, tablet, and mobile rules.

For the new template, seed the editor with useful, generic service copy and realistic sample cards, while keeping page-specific text, links, and imagery in ordinary module fields. Do not rely on unsupported field names or values; use the downloaded schemas as the source of truth.

## Existing global partials and isolated CTA approach

The base template references:

- `smithworks/sw-partials/sw-site_header.html`
- `smithworks/sw-partials/sw-site_footer.html`

Read-only copies are in `original-backup/shared-partials/`. Both files declare `templateType: global_partial` and contain DND areas with the existing **SW Header Simple** or **SW Footer Simple** module. The existing template enables these shared global partials by default. The remote partial listing did not show an existing training-specific CTA partial. `original-backup/blog_footer.html` is a separate, empty global DND area for blog pages.

**Safe future approach:** create a new, uniquely named global partial exclusively for this assignment (for example, a training-only CTA partial), and reference that same new partial from the assignment template/pages only. Keep it separate from `sw-site_header.html`, `sw-site_footer.html`, and the existing blog partial. Before any future upload, check that the chosen unique remote path does not already exist; then verify both example pages use that same new global partial. That gives the two training pages a shared element to test without changing global site elements. No global element has been created or changed in Phase 1.

## Known limitations and next steps

- The selected source template contains seven content sections; only its first three patterns are recommended for the assignment's 2–3-section constraint.
- The downloaded modules are references, not standalone copies of every theme dependency. For example, module markup can include shared theme partials. The new template should continue referencing existing shared modules and assets rather than uploading altered module copies.
- Theme asset URLs in the base are relative to the existing theme structure; preserve that context when creating the new template.
- The downloaded module source files are large and expose many optional controls. Only use defaults and values confirmed in each module's field schema.

Next phase, after review: create the new local template from the backed-up service template in `working`, retain the three-section structure and shared theme shell, then validate the source and explicitly review the upload plan before uploading anything. Later phases can create unpublished pages, verify ordinary-module isolation and the new training-only shared CTA, test responsive/editor behavior, create a defaults-check page, and prepare evidence and handoff materials.
