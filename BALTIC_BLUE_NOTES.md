# Baltic Blue — tiered digital direction study

Source reviewed: the live Baltic Blue homepage and its public brand assets on August 13, 2026.

## What the current site already has

- A strong central phrase: **Life back to the sea**.
- A clear emotional frame: hope, restoration, responsibility, and connection.
- A specific origin story in Klintholm Havn.
- A distinctive blue gradient identity and custom wordmark.
- A useful generational promise, expressed through Jesper Carlson's quote.

The opportunity is not to invent a different Baltic Blue. It is to organize the existing voice around a more memorable digital rhythm and a clearer invitation to participate.

## The shared method

Both directions keep the same foundation:

1. Semantic HTML carries the story, headings, navigation, quote, and contact path.
2. The visual system is derived from the brand's actual language: current, horizon, connection, generations.
3. Motion is assigned a narrative job rather than added as decoration.
4. One orchestrated reveal receives most of the technical and visual budget.
5. Reduced-motion and no-WebGL states remain complete experiences.

## Tier 01 — Editorial current

Route: `/baltic-one/`

**Thesis:** message becomes motion.

The first direction uses only HTML, CSS, and small vanilla JavaScript. The sea is represented through the existing water photograph, layered gradients, orbiting points, animated tide lines, large editorial type, and a chapter rail.

The single major reveal is the transition into **Life back to the sea**. Everything before it builds the emotional and conceptual case for the phrase.

Best fit when:

- broad device support and low operational complexity matter most;
- Baltic Blue expects frequent editorial changes;
- the site needs to remain fast on modest mobile hardware;
- the organization wants a distinctive experience without owning a 3D production pipeline.

## Tier 02 — Living current and image system

Route: `/baltic-two/`

**Thesis:** the sea connects us.

The second direction uses a direct, non-sticky hero with a continuously moving procedural current layered over Baltic Blue photography. The current is atmospheric rather than scroll-controlled, while original photography carries the rest of the story through full-cover chapters.

Best fit when:

- the launch needs a stronger signature moment;
- Baltic Blue wants to communicate systems and connection, not only atmosphere;
- Baltic Blue has a growing library of strong documentary photography;
- campaign pages need a premium visual register without adding interaction friction.

## Recommendation

Use Tier 01 as the durable site architecture. Treat the Tier 02 living current and image system as a campaign-grade direction for launches, partnerships, or high-attention landing pages.

This hybrid recommendation keeps Baltic Blue's mission legible and maintainable while preserving a place for wonder.

## Prototype map

- `/baltic/` — comparison and framing page.
- `/baltic-one/` — DOM-first editorial direction.
- `/baltic-two/` — progressive WebGL direction.
- `/public/baltic/` — source logo variants and homepage water image used by the prototypes.
