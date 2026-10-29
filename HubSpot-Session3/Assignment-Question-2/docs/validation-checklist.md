# Phase 2 validation checklist

## Locally verified

- [x] New template is based on `original-backup/SW Service Page.html`.
- [x] Compared the new file with the source; the original header include, OG metadata, shared header/footer behavior, scripts, and footer includes match.
- [x] Original theme header include, shared header/footer partial calls, OG image metadata, scripts, standard footer includes, and prototype-mode asset references are retained.
- [x] Exactly three main DND sections exist, in requested order: SW Hero, SW Cards, SW Body + Inset.
- [x] Template references were retargeted from the nested assignment template location to existing `smithworks` modules, partials, and assets; the assignment CTA points to the sibling `partials` directory.
- [x] All selected module field names and choice values were checked against the downloaded `fields.json` files; field patterns were compared with the source template.
- [x] CTA uses the supported `link` structure and a local `#service-details` destination; its target is supplied by the verified `custom_id` field.
- [x] The shared CTA partial is a new global partial and does not modify or reuse existing global elements.
- [x] DND area, section, column, row, and module start/end tags are balanced.
- [x] No files in `original-backup` or `module-references` were edited.
- [x] No HubSpot upload, page creation, or publish action was run.

## HubSpot upload and remaining validation

- [x] Confirm both requested destination folders were unused before upload.
- [x] Upload the global CTA partial first, then the page template, using `--account=staging-environment`.
- [x] Confirm both files appear at their exact remote paths in the staging Design Manager.
- [ ] Compile/preview the template in the editor and resolve any HubSpot-only HubL or module validation error. The browser session redirected to HubSpot login with 401, so this could not be verified here.
- [ ] Verify the three modules render with the intended defaults and that the shared CTA is visible.
- [ ] Confirm header/footer display and their existing page-level enable controls.
- [ ] Confirm CTA anchor navigation and replace placeholder CTA copy/link before publication.
- [ ] Test desktop, tablet, and mobile layouts, particularly hero height and card breakpoints.
- [ ] Create unpublished sample pages only after approval of the next phase; test page-local module isolation and shared partial behavior.
- [ ] Create a fresh unpublished page to verify final template defaults.

## Validation limitation

HubL compilation, editor controls, page-editor template availability, and visual responsive behavior remain unverified because the browser session was not authenticated. CLI upload success and remote directory listings confirm file storage, not HubSpot compilation. Existing required Smithworks modules and referenced theme assets were confirmed present in the staging account; no existing assets were modified.
