## Context

The Mini App already exposes an in-app XT campaign route, but the current implementation is intentionally compact and feels more like an app subsection than a true mobile rendering of the original campaign landing. The user wants the experience to feel as if the original web landing is being viewed on a phone, with the same overall hierarchy, content flow, and campaign feel.

The implementation runs inside the same Cloudflare-first Mini App shell as the rest of the product, so the design must keep route navigation, Telegram session behavior, and existing back/home navigation intact. The change is primarily a presentation and layout refactor, not a new backend capability.

Stakeholders:
- Mini App users who need a more polished campaign experience.
- Marketing/product stakeholders who want the landing to feel close to the original campaign.
- Future maintainers, because the route should stay reusable and easy to evolve.

## Goals / Non-Goals

**Goals:**
- Make `/xt-campaign` look and feel like a responsive mirror of the original XT campaign landing.
- Preserve the existing in-app navigation model and Mini App shell.
- Reuse the current campaign assets and CTA flow instead of building a separate or duplicated experience.
- Maintain mobile-first behavior while still allowing the layout to scale cleanly on larger screens.

**Non-Goals:**
- No external iframe embedding of the original landing.
- No new backend APIs or data model changes.
- No change to the discount or UID verification business rules.
- No separate standalone web app deployment for the campaign page.
- No redesign of unrelated Mini App screens.

## Decisions

1. **Keep the campaign inside the existing Mini App route system.**
   - Rationale: the app already has route handling, back navigation, and Cloudflare asset serving. Reusing the route keeps the user inside one shell and preserves the existing navigation behavior.
   - Alternatives considered:
     - External iframe or remote embed: rejected because it depends on framing policy and weakens the Telegram-native feel.
     - Separate app: rejected because it fragments navigation and deployment.

2. **Treat the original landing as a visual reference, not as a separate dependency.**
   - Rationale: the goal is to mirror the layout and hierarchy closely while still rendering natively inside the Mini App. That gives us control over responsiveness, typography, and spacing without relying on remote HTML structure.
   - Alternatives considered:
     - Direct live rendering of the external site: rejected because it introduces coupling to another deployment and makes the mobile shell harder to control.

3. **Use the existing campaign component and assets as the canonical content source.**
   - Rationale: the current `xt-campaign` component already contains the campaign messaging, imagery, and CTA structure. Keeping it as the canonical source reduces drift and makes the responsive mirror easier to maintain.
   - Alternatives considered:
     - Recreating the landing from scratch as a new page: rejected because it would duplicate content and increase the chance of mismatch.

4. **Preserve the campaign content order and CTA flow.**
   - Rationale: the mobile mirror should feel familiar to users who already know the campaign landing. Keeping the same section order reduces cognitive load and preserves marketing intent.
   - Alternatives considered:
     - Compress the page into a smaller promotional card: rejected because it no longer feels like the original landing.

5. **Use responsive stacking and spacing rather than separate mobile and desktop pages.**
   - Rationale: a single responsive component is easier to maintain and keeps behavior consistent across devices.
   - Alternatives considered:
     - Separate mobile-specific and desktop-specific implementations: rejected because they would drift over time and increase maintenance.

6. **Reuse existing campaign assets and CTA labels.**
   - Rationale: the content already exists and matches the product story. Reuse keeps the change smaller and reduces the risk of copy or asset mismatch.
   - Alternatives considered:
     - Rebuilding with new assets or rewritten copy: rejected because the goal is fidelity, not rebranding.

## Risks / Trade-offs

- [Risk] Mirroring a rich landing page inside the Mini App can create a long screen on small devices. → [Mitigation] Keep the layout responsive, stack sections cleanly, and tune spacing/typography for narrow widths.
- [Risk] The mirrored experience may diverge from the source landing if the two are maintained separately. → [Mitigation] Reuse the same campaign assets and preserve the original hierarchy as closely as possible.
- [Risk] Larger images can make the campaign feel heavy on weak connections. → [Mitigation] Keep the existing image assets but ensure the responsive layout does not force unnecessary reflows or oversized visual containers.
- [Risk] Route changes can accidentally break the back flow. → [Mitigation] Keep the current app route/back pattern and validate the home-to-campaign and campaign-to-home navigation paths.

## Migration Plan

1. Replace the current compact campaign route implementation with a responsive mirror component.
2. Update layout and styling so the campaign sections stack and scale like a polished mobile landing page.
3. Keep the existing route path and back navigation intact.
4. Add or update tests for the route, rendering, and navigation behavior.
5. Deploy and verify the page on a narrow viewport in Telegram and in desktop browser dev mode.

Rollback strategy:
- Restore the previous compact campaign page component and styles while keeping the route path unchanged.
- No database or API rollback is needed because this change is frontend-only.

## Open Questions

- None.
