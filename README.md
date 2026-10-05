# Movane Holidays

Static travel website. `dist/` contains the complete site; no build or dependency installation is required.

The hero is one continuous, procedurally constructed Three.js world. Native scroll progress drives a damped camera from airport arrivals through Colombo, Sigiriya, Kandy, tea estates, a railway tunnel, Nine Arch Bridge, Ella, safari and the southern beach. Vehicles, water, palms, wildlife and atmospheric movement are all functions of the same progress value: reversing scroll reverses the world and stopping scroll stops rendering after the camera settles. There is no video or photographic slideshow in the hero. These are artistic miniature interpretations rather than geographically exact reconstructions.

Vegetation uses spatially culled instance batches; display resolution is capped; rendering stops offscreen and while idle. Reduced-motion preferences retain destination navigation with stationary chapter views. The hero includes accessible waypoint controls, a descriptive text alternative, keyboard access and a WebGL-unavailable photographic fallback. The beach blends into the normal page and a trip-planning CTA.

Three.js r180 is locally vendored under its MIT license in `dist/vendor/LICENSE`. No runtime CDN or package install is needed. Camera/world logic lives in `dist/cinema.js`, with the overlay and responsive styling in `dist/cinema.css`.

Destination and itinerary buttons open informative dialogs. The trip planner creates a suggested itinerary and downloads a local text brief. No booking, email or CRM service is connected. Routes and brand copy are starting content for review, not confirmed commercial packages.

## Photographs

Images are downloaded from Unsplash and used under the Unsplash License (https://unsplash.com/license).

- Coast: Oliver Frsh — https://unsplash.com/photos/guDSo1bPXDk
- Ella: gemmmm (@gemmafjam) — https://unsplash.com/photos/BS8a67PahbM
- Sigiriya: sander traa — https://unsplash.com/photos/bfdshIHD5Y4

## Local preview

Run `node preview.mjs` from this directory and open the printed address.

## Brand system

The supplied MOVANE Deep Ocean brand sheet sets Ocean Black #102330, Lagoon Teal #1E9C93, Salt White #F6F5F0, Cool Grey #D3DADB and Sunstone #E0A15B. Headings use Sora; body text and UI use Inter. The MOVANE wordmark and app mark are extracted directly from that supplied PDF. The tagline is "Travel, well handled."
