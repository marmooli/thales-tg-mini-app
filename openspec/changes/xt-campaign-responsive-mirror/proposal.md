## Why

The current in-app XT campaign experience works, but it still feels like a compact app section rather than a faithful mobile rendering of the original landing page. The goal is for users on a phone to feel like they are viewing the original campaign web landing, just adapted naturally to the Mini App shell.

## What Changes

- Replace the current compact `/xt-campaign` presentation with a responsive mirror of the original landing experience.
- Keep the landing inside the Mini App shell and preserve the existing navigation/back behavior.
- Reuse the campaign's existing content, assets, and call-to-action structure, but adapt layout, spacing, and stacking for mobile.
- Make the page feel like the original landing rendered natively on a phone instead of a separate reduced-feature screen.
- Preserve the original landing's visible section hierarchy, including hero, feature cards, campaign callout, and CTA/footer flow.

## Capabilities

### New Capabilities
- `xt-campaign-responsive-mirror`: a responsive in-app campaign landing page that mirrors the original XT campaign layout and content hierarchy for mobile users.

### Modified Capabilities
- None.

## Impact

- Mini App campaign route and its page component.
- Layout and styling for the XT campaign landing experience.
- Navigation from the home page into the campaign landing page.
- Reuse of existing campaign assets and content references.
- Related tests for the campaign route and responsive rendering behavior.
