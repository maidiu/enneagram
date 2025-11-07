1. Data shape per type

Something like:

type LevelOfDevelopment = {
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  band: "Healthy" | "Average" | "Unhealthy"; // 1–3, 4–6, 7–9
  label: string;        // short name, e.g. "The Wise Realist"
  summary: string;      // 40–80 words, paraphrased Riso
  inner_world: string;  // 1–2 sentences: subjective experience
  outer_behavior: string; // 1–2 sentences: what others see
  markers: string[];    // 3–6 bullet traits
  growth_notes?: string; // how to move up from this level
  
};


type EnneagramType = {
  id: number;                 // 1–9
  name: string;               // "The Reformer", etc (you can rename)
  center: "Body" | "Heart" | "Head";
  instinct_triad: "Conservation" | "Relation" | "Adaptation"; // Ichazo naming, optional
  core_summary: {
    one_liner: string;
    short_paragraph: string;
    core_motivation: string;
    core_fear: string;
  };
  dynamics: {
    passion: string;          // "Anger (Resentment)"
    fixation: string;         // "Perfectionism"
    virtue: string;           // "Serenity"
    holy_idea?: string;       // If you want Ichazo’s higher state word
  };
  structure: {
    center_description: string;        // What "Body/Heart/Head" means for this type
    stance?: "Assertive" | "Compliant" | "Withdrawn";  // Hornevian
    harmony?: "Positive" | "Competency" | "Reactive";  // Harmonic
    object_relation?: "Attachment" | "Frustration" | "Rejection";
  };
  arrows: {
    stress_point: number;
    growth_point: number;
    stress_description: string;
    growth_description: string;
  };
  wings: {
    left_wing: number;
    right_wing: number;
    description_left: string;  // brief “flavor” of this wing blend
    description_right: string;
  };
  instincts: {
    self_pres: {
      nickname: string;       // e.g. "The Worrier", "The Castle"
      description: string;    // 2–3 sentences
      focus: string[];        // bullet words: ["security", "comfort", ...]
    };
    social: {
      nickname: string;
      description: string;
      focus: string[];
    };
    sexual: {
      nickname: string;
      description: string;
      focus: string[];
    };
    overview: string;         // how this type changes across instincts
  };
  levels_of_development: {
    overview: string;          // 2–3 sentence map Healthy→Unhealthy for this type
    levels: LevelOfDevelopment[]
  };
  patterns: {
    strengths: string[];      // 5–7 bullets
    pitfalls: string[];       // 5–7 bullets
    typical_childhood_story?: string;  // short pattern, not biography
    common_mistypings: string[];       // e.g. "1s often confuse themselves with 5s and 6s"
  };
  growth_practices: {
    inner_work: string[];     // 4–6 bullet practices (awareness, reframes)
    relational_practices: string[];    // how to show up with others differently
    somatic_practices?: string[];      // if you want the “body work” angle
  };
  relationships: {
    what_others_appreciate: string[];
    what_others_struggle_with: string[];
    notes_for_partners_friends: string;  // 1 short para
  };
  further_reading: {
    naranjo_chapters: string[];    // references by part/chapter, not quotes
    chestnut_sections: string[];
    riso_sections: string[];
  };
};


That’s your content contract. Cursor can then, for each type, build an object that satisfies this.

2. UI layout (React side)

You can make this pretty with tabs + accordions. Rough layout:

Top: Type header card

Show:

name + id

Center & stance tags: Body • Instinctive, Hornevian: Compliant, etc.

core_summary.one_liner

“Read overview” button that expands core_summary.short_paragraph.

Section 1: “Core Pattern”

Accordion or tab:

Core Motive & Fear

Show core_motivation and core_fear.

Passion & Fixation

dynamics.passion, dynamics.fixation, dynamics.virtue.

One compact paragraph explaining how passion + fixation actually show up (Cursor can paraphrase from Naranjo + Chestnut).

Section 2: “Structure & Arrows”

Inside:

Center + Triads

Pull structure.center_description, stance, harmony, object_relation with short tooltips (“Reactive: tends to escalate emotion when hurt,” etc. Cursor can lean on Riso/Chestnut).

Stress & Growth

Show arrows visually (e.g. 1 → 4, 1 → 7) and expansion with arrows.stress_description and arrows.growth_description.

Section 3: “Wings”

Accordion “Wings & Flavors”:

Show both wings as pill buttons: 1w9, 1w2.

Clicking each fills a panel with description_left or description_right and 3–4 bullet markers.

Section 4: “Instinctual Variants”

Three cards side-by-side or tabs:

instincts.self_pres

instincts.social

instincts.sexual

Each card:

Nickname + 2–3 sentence description.

Focus bullets: “Anxiety about X”, “Preoccupation with Y”.

Cursor should derive these from The Complete Enneagram subtype chapters in paraphrase. 

The Complete Enneagram_ 27 Path…

Section 5: “Levels of Development”

This is where your later Levels layer plugs in conceptually.

Simple, three-tier timeline:

Healthy (levels_of_development.healthy)

Average

Unhealthy

Each with:

1 highlighted line (“At their best…”)

3–5 bullet markers.

Cursor can paraphrase Riso’s level descriptions per type at the banded level (not all 9 micro-levels). 

Personality Types - Don Richard…

Section 6: “Strengths & Pitfalls”

Two-column list:

Left: patterns.strengths

Right: patterns.pitfalls

Plus optional “common childhood pattern” and “common mistypings” at the bottom.

Section 7: “Growth & Relationships” (click-to-expand at the end)

This is the part you said should be clickable/expandable at the end.

Inside:

Inner Work (growth_practices.inner_work)

With Others (growth_practices.relational_practices)

Optional “Body” tab if you do somatic (growth_practices.somatic_practices).

Notes for people who love this type (relationships.notes_for_partners_friends).

This is where Cursor can synthesize practice advice from Chestnut’s “growth path” and any Riso “personal growth” sections, again in short, paraphrased units.

Section 8: “Deep Dive” (for nerds)

Collapsible at the bottom:

Short list of further_reading.* references—just titles/chapters:

“Naranjo – Character and Neurosis, ch. on Type 4”

“Chestnut – The Complete Enneagram, 4sx/4sp/4so”

“Riso & Hudson – Personality Types, ch. on 4, Levels of Development.”

You don’t need full citations, just enough breadcrumb for someone with the books.

3. Notes for Cursor on how to fill this

You don’t want Cursor hallucinating; you want it mining the books you gave it. So you give it something like:

For core_summary

Use Riso’s “Overview” section + Chestnut’s type intro to build the one-liner and paragraph, capped at X words, paraphrased.

For dynamics (passion/fixation/virtue)

Take passion & fixation terms from Ichazo/Naranjo. 

The Enneagrams of the Divine Fo…

Take one 2–3 sentence explanation from Naranjo’s type chapter, paraphrased.

For structure & triads

Use Chestnut’s description of centers and triads (Hornevian, Harmonic, Object-relations) as your base. 

The Complete Enneagram_ 27 Path…

For instincts

Use The Complete Enneagram subtype chapters per type/instinct for nicknames, focus, description (summarized, no long quotes). 

The Complete Enneagram_ 27 Path…

For levels_of_development

Use Riso’s Levels text to create three aggregated bands (healthy / average / unhealthy) with 2–3 key characteristics each, not full level-by-level breakdown. 

Personality Types - Don Richard…

For growth_practices

Combine Chestnut’s “growth recommendations” + Riso’s “personality dynamics and variants” sections to extract concrete practices: “Notice when…”, “Experiment with…”.

All of that can stay within fair-use paraphrase territory and still feel like the real thing.




2. UI pattern for nine levels (that doesn’t suck)

In the React app, I’d do this:

Levels tab layout

Band overview at the top

A small 3-part horizontal bar:

Green: “Healthy (Levels 1–3)”

Yellow: “Average (4–6)”

Red: “Unhealthy (7–9)”

Underneath: levels_of_development.overview.

Accordion per Level (1–9)

Something like:

[1] Healthy – Level 1: The ____        ▼
[2] Healthy – Level 2: The ____        ▼
[3] Healthy – Level 3: The ____        ▼
[4] Average – Level 4: The ____        ▼
...
[9] Unhealthy – Level 9: The ____      ▼


Click expands to show:

summary

inner_world

outer_behavior

Bullets from markers

Optional growth_notes at the bottom (“If you’re here, watch for X, experiment with Y”).

You can also allow a “show band only” toggle: collapse all non-Healthy, or vice versa.

The effect: people can skim the band overview, then drill down on specific levels if they want detail.

3. Directions for Cursor on how to fill the 9 levels

Since you’ve already fed it the books, you just need to tell it where to drink from and how much.

You want Cursor to:

Use Riso’s Levels as the backbone

Each type has 9 Level descriptions in Personality Types. Those are your primary source for:

level names/labels,

developmental progression,

typical traits per level.

Summarize, don’t quote

For each level, compress Riso’s prose into:

one short label (label),

40–80 word summary,

1–2 sentence inner_world (subjective feel),

1–2 sentence outer_behavior (observable pattern),

3–6 bullet markers.

Respect the 3-band structure but keep all 9

Levels 1–3 → band = "Healthy"

Levels 4–6 → band = "Average"

Levels 7–9 → band = "Unhealthy"

levels_of_development.overview = 2–3 sentence paraphrase of how this type looks moving from 1→9 (using Riso’s general discussion for that type).

Add growth hints in growth_notes

Pull very short, concrete pointers from Riso’s “personal growth” + Chestnut’s growth suggestions:

“Notice when you…”

“Practice allowing…”

One or two sentences per level max. These don’t need to be in Riso; they can be distilled from the combination of:

what regresses at that level,

what the next level up looks like.

So something like:

{
  "level": 4,
  "band": "Average",
  "label": "The Pragmatic Idealist",
  "summary": "At this level, Ones still care about principles, but begin to tighten around their own standards...",
  "inner_world": "They feel subtly tense and watchful, scanning for what’s wrong and fearing they’ll be blamed.",
  "outer_behavior": "They correct others more, become rigid about ‘the right way,’ and can sound critical without noticing.",
  "markers": [
    "Frequent irritation at mistakes",
    "Strong focus on efficiency and correctness",
    "Trouble relaxing or delegating"
  ],
  "growth_notes": "Noticing body tension and deliberately letting some ‘imperfections’ stand is a key shift toward Level 3."
}


Cursor fills those from the books; your app just renders.

4. Where this plugs into the rest of your stack

Later in the pipeline, when you’re using Levels in a more quantitative way:

You can keep this same 1–9 index as the conceptual backbone.

Your future “health/integration” latent factor can be interpreted against these labels per type.

For the user-facing app, you don’t have to surface any of the math—just give them the map.