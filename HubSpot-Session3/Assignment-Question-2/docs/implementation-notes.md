# Phase 2 implementation notes

## Purpose

`working/ITT Training - Service Landing Page - Niraj.html` is a reusable, new-content page template based on the backed-up Smithworks SW Service Page shell. The sample service is Cloud Solutions; the copy is editorial guidance, not a claim about a real business or customer.

## Page modules and defaults

The main DND area has exactly three sections:

1. **SW Hero:** editable H1 and supporting rich text; primary CTA links to the page's service-details anchor. The existing shared hex-network theme image is used as a decorative background, with accurate alt text. The 300px minimum height and middle alignment are explicitly set at XL, desktop, tablet, and mobile breakpoints.
2. **SW Cards:** editable section heading and description plus three benefit cards. Cards use no image/icon, avoiding unrelated photography and invented claims. The responsive grid is three columns at XL and desktop, two at tablet, and one at mobile.
3. **SW Body + Inset:** editable service-details content with the inset disabled. The module's verified `custom_id` field supplies the `service-details` anchor. It has 50px vertical / 25px horizontal outer spacing and a large inner width.

The template is installed at `smithworks/Niraj-ITT-Training/Session-3/Assignment-2/templates/Session3-Assignment2-Service-Landing.html`. Its module, header/footer partial, metadata image, script, stylesheet, and screenshot references use four parent traversals to reach the existing `smithworks` theme assets. The hero uses the existing `sw-default-hero-banner-hex50-v2.jpg`; the original `sw-default-hero-hex-small-overlay.png` reference was not present remotely. The standard footer includes and prototype-mode behavior remain in the template.

## Editing boundaries

- **Marketers can edit independently per page:** Hero headline, description, CTA text/link, module settings; Cards heading, description, card headings and card rich text; Body + Inset heading, content, and supported module presentation settings. These are regular page DND modules, not global modules.
- **Fixed in the template source:** section order, initial three-section structure, module types/paths, shared shell, default styling choices, and the inclusion of the separate training CTA partial. Marketers can still rearrange or remove DND modules in the page editor if the template allows it.
- **Shared site components:** existing global site header/footer are retained and remain shared. Do not alter their partials for this exercise.
- **Training-only shared content:** `working/partials/ITT Training - Shared Service CTA - Niraj.html` is a new isolated global partial. Its text and destination are shared across pages that include it, so editing that partial changes the CTA on each such page. It contains only semantic HTML and inline styles; it does not depend on an uninspected module.

## Training CTA integration prerequisite

The template references the sibling partial at `../partials/Session3-Assignment2-Global-CTA.html`. The partial was uploaded first to `smithworks/Niraj-ITT-Training/Session-3/Assignment-2/partials/Session3-Assignment2-Global-CTA.html`; the page template was then uploaded to `smithworks/Niraj-ITT-Training/Session-3/Assignment-2/templates/Session3-Assignment2-Service-Landing.html`. Both destinations were confirmed unused before upload and confirmed present afterward in `staging-environment` (51856488). Existing `sw-site_header.html`, `sw-site_footer.html`, modules, and theme assets were not modified. No pages were created or published.

## Remaining editor and preview validation

- Preview in HubSpot; confirm HubL compilation, theme assets, module rendering, shared header/footer, and the isolated global CTA. This remains pending because the available browser session redirected to HubSpot login (401).
- Confirm the CTA anchor navigates to the details module and replace the placeholder label/link before publication.
- Verify CTA editing in the global partial updates all pages using this assignment template, while editing an ordinary module on one page does not alter another.
- Inspect desktop, tablet, and mobile views; confirm no overflow, suitable hero content height, card stacking, and readable contrast.
- In the page editor, verify defaults load, all ordinary module fields can be edited independently, and the template remains available for new pages.
- Re-check the unique remote partial path and intended remote account before any future upload. Upload and page creation are outside this phase.

## Recovery

The original source remains unchanged at `original-backup/SW Service Page.html`; downloaded module and shared-partial references remain in their original Phase 1 folders. To discard this local implementation, remove only the new template, local CTA partial, and Phase 2 documentation files. Do not overwrite or delete the original backup or references. No remote rollback is needed because nothing was uploaded.
