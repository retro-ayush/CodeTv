import { gsap } from "../../lib/gsap.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const loader = document.querySelector("[data-loader]");

/* Gate promise is created by an inline script in <head> so it exists before
   any module evaluates; here we only resolve it. */
const signalDone = window.__introRelease ?? (() => {});
if (!window.__introDone) window.__introDone = Promise.resolve();

if (!loader) {
  signalDone();
} else {
  document.body.style.overflow = "hidden";

  const reel = loader.querySelector("[data-loader-reel]");
  const frames = [...loader.querySelectorAll("[data-iframe]")];
  const flicker = loader.querySelector("[data-loader-flicker]");
  const titleMain = loader.querySelector("[data-title-main]");
  const titleRed = loader.querySelector("[data-title-red]");
  const titleBlue = loader.querySelector("[data-title-blue]");
  const fill = loader.querySelector("[data-loader-fill]");
  const count = loader.querySelector("[data-loader-count]");
  const wipes = loader.querySelectorAll("[data-loader-wipe]");

  const finish = () => {
    document.body.style.overflow = "";
    loader.classList.add("is-done");
    loader.remove();
    signalDone();
  };

  /* Readiness: fonts + DOM, deliberately not window.load (panel videos are
     lazy-loaded and must not gate the intro). */
  const pageReady = Promise.all([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((resolve) => {
      if (document.readyState !== "loading") resolve();
      else document.addEventListener("DOMContentLoaded", resolve, { once: true });
    }),
  ]);
  /* Escape hatch for a stalled font or stylesheet. Generous enough that it
     never pre-empts a slow-but-progressing intro — the animation path gates
     its own exit on the timeline completing, not on this. */
  const safetyNet = new Promise((resolve) => setTimeout(resolve, 12000));

  if (reduced) {
    /* Static: one frame, title visible, brief hold, then out. */
    gsap.set(frames[0], { opacity: 1 });
    gsap.set([titleMain, titleRed, titleBlue], { opacity: 1 });
    gsap.set(fill, { scaleX: 1 });
    if (count) count.textContent = "100";
    Promise.race([pageReady, safetyNet]).then(() => setTimeout(finish, 500));
  } else {
    /* ================================================================
       THE CUT SEQUENCE
       Frame durations shorten as the sequence builds — this acceleration
       is what gives the ident its rhythm. Hand-tuned rather than eased,
       because a smooth ramp doesn't feel like film cuts.
       ================================================================ */
    const HOLDS = [
      /* SLOW — each composition gets long enough to actually read */
      0.5, 0.4, 0.33, 0.27,
      /* BUILD — tightening */
      0.22, 0.19, 0.16, 0.13, 0.11,
      /* BURST — individual frames now subliminal, which is the point */
      0.09, 0.08, 0.07, 0.06, 0.055, 0.05, 0.045,
    ];

    const tl = gsap.timeline();
    let at = 0;

    frames.forEach((frame, i) => {
      const hold = HOLDS[i] ?? 0.06;
      const prev = frames[i - 1];

      /* Hard cut: previous frame off, this one on, same instant. */
      tl.set(frame, { opacity: 1 }, at);
      if (prev) tl.set(prev, { opacity: 0 }, at);

      /* Each frame enters slightly scaled/rotated and settles — subtle, but
         it stops the stack from feeling like a slideshow. */
      tl.fromTo(
        frame,
        {
          scale: 1.14,
          rotateZ: i % 2 ? 0.8 : -0.8,
          xPercent: i % 3 === 0 ? 1.2 : -1.2,
        },
        {
          scale: 1,
          rotateZ: 0,
          xPercent: 0,
          duration: hold * 1.6,
          ease: "power2.out",
        },
        at
      );

      at += hold;
    });

    const CUT_END = at; /* ≈2.4s */

    /* --- Camera push-in: one continuous move across the whole cut run.
       Accelerating, so the zoom tightens as the cuts speed up. */
    tl.fromTo(
      reel,
      { scale: 1.0, z: 0 },
      /* power1.in rather than power2.in: over a 3.3s run the steeper curve
         left the first half with almost no visible camera movement. */
      { scale: 1.5, z: 200, duration: CUT_END, ease: "power1.in" },
      0
    );

    /* --- Burst flicker over the last third of the cuts. */
    tl.to(
      flicker,
      {
        keyframes: [
          { opacity: 0.5, duration: 0.04 },
          { opacity: 0, duration: 0.04 },
          { opacity: 0.35, duration: 0.03 },
          { opacity: 0, duration: 0.05 },
          { opacity: 0.6, duration: 0.03 },
          { opacity: 0, duration: 0.06 },
        ],
      },
      CUT_END - 0.45
    );

    /* ================================================================
       SETTLE — frames slam to a stop, title crashes in
       ================================================================ */
    const SETTLE = CUT_END;

    /* Last frame holds and the camera snaps back slightly — the "impact". */
    tl.to(
      reel,
      { scale: 1.08, z: 0, duration: 0.5, ease: "power4.out" },
      SETTLE
    ).to(
      frames[frames.length - 1],
      /* Kept at 0.7: dropping to 0.4 left the title floating on near-black
         instead of sitting on the final comic panel. */
      { opacity: 0.7, duration: 0.5, ease: "power2.out" },
      SETTLE
    );

    /* Title slams in from oversized, the chromatic layers trailing. */
    const titleIn = { duration: 0.55, ease: "power4.out" };

    tl.fromTo(
      titleMain,
      { opacity: 0, scale: 2.6, filter: "blur(22px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", ...titleIn },
      SETTLE + 0.06
    );

    [
      [titleRed, -1],
      [titleBlue, 1],
    ].forEach(([layer, dir]) => {
      tl.fromTo(
        layer,
        { opacity: 0, scale: 2.6, x: dir * 90, filter: "blur(22px)" },
        {
          opacity: 1,
          scale: 1,
          x: dir * 14,
          filter: "blur(0px)",
          ...titleIn,
        },
        SETTLE + 0.06
      )
        /* Converge, leaving a thin permanent misregistration. */
        .to(
          layer,
          { x: dir * 5, duration: 0.5, ease: "power2.inOut" },
          SETTLE + 0.65
        );
    });

    /* Glitch jitter on the hold — dimensional-bleed flavour. */
    tl.to(
      [titleRed, titleBlue],
      {
        keyframes: [
          { x: (i) => (i === 0 ? -22 : 22), duration: 0.05 },
          { x: (i) => (i === 0 ? -5 : 5), duration: 0.07 },
          { x: (i) => (i === 0 ? -16 : 16), duration: 0.04 },
          { x: (i) => (i === 0 ? -5 : 5), duration: 0.09 },
        ],
      },
      SETTLE + 1.0
    ).to(
      flicker,
      {
        keyframes: [
          { opacity: 0.4, duration: 0.04 },
          { opacity: 0, duration: 0.05 },
        ],
      },
      SETTLE + 1.02
    );

    /* --- Progress readout, independent of the cut choreography. */
    const progress = { value: 0 };
    gsap.to(progress, {
      value: 1,
      duration: CUT_END + 0.9,
      ease: "power1.inOut",
      onUpdate: () => {
        const pct = Math.round(progress.value * 100);
        if (count) count.textContent = String(pct).padStart(2, "0");
        if (fill) gsap.set(fill, { scaleX: progress.value });
      },
    });

    /* ================================================================
       EXIT — held long enough for the title to land, then shutter out
       ================================================================ */
    /* Hold the title on screen after the glitch resolves, then exit.
       This is added to the intro timeline itself rather than run off a
       setTimeout: a wall-clock timer drifts out of sync whenever the main
       thread stalls (font decode, style recalc, the panel-video 404s), and
       the wipe would then start while the title was still crashing in —
       which is what cut the word in half on some loads. */
    /* Starts at +1.25, where the glitch keyframes finish. Overlapping them let
       the exit begin mid-glitch, freezing the red/blue layers at their thrown
       apart offsets instead of the converged ±5px. */
    tl.to({}, { duration: 0.4 }, SETTLE + 1.25);

    /* Timeline finished => the title has definitely landed and held. */
    const introPlayed = new Promise((resolve) => {
      tl.eventCallback("onComplete", resolve);
    });

    Promise.race([Promise.all([pageReady, introPlayed]), safetyNet]).then(() => {
      gsap
        .timeline({ onComplete: finish })
        /* Normalise the chromatic offsets first: if the safety net fires
           mid-glitch the layers would otherwise freeze tens of pixels apart
           and read as three misaligned words. */
        .set(titleRed, { x: -5 })
        .set(titleBlue, { x: 5 })
        /* Title and reel punch away together. */
        .to([titleMain, titleRed, titleBlue], {
          scale: 1.3,
          opacity: 0,
          filter: "blur(14px)",
          duration: 0.45,
          ease: "power2.in",
          stagger: 0.03,
        })
        .to(reel, { scale: 1.6, opacity: 0, duration: 0.6, ease: "power2.in" }, 0)
        .to(loader.querySelector(".loader-hud"), { opacity: 0, duration: 0.3 }, 0)
        /* Release the hero one beat BEFORE the shutter parts.

           The hero intro takes ~0.5s to fade its backdrop up from black and
           begin the quote. Releasing it at teardown meant the shutter opened
           onto an empty black stage and the page only started animating
           afterwards — a visible dead gap. Starting it here means the suit is
           already lit and the first characters are rising as the shutter
           opens, so the two sequences overlap instead of queueing. */
        .call(
          () => {
            /* Resolving twice is harmless — a settled promise ignores it —
               but the scroll lock has to lift here too, otherwise the page
               is unscrollable for the length of the wipe. */
            document.body.style.overflow = "";
            signalDone();
          },
          null,
          0.2
        )
        /* Shutter parts to reveal the hero. */
        .set(wipes, { opacity: 1 }, 0.25)
        .to(
          wipes,
          {
            yPercent: (i) => (i === 0 ? -100 : 100),
            duration: 0.95,
            ease: "power4.inOut",
          },
          0.3
        )
        .to(loader, { backgroundColor: "rgba(0,0,0,0)", duration: 0.6 }, 0.3);
    });
  }
}
