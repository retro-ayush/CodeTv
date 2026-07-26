import { gsap, SplitText, DrawSVGPlugin, ScrollTrigger } from "../../lib/gsap.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const hero = document.querySelector("[data-hero]");
if (hero) {
  const quote = hero.querySelector("[data-quote]");
  const strands = hero.querySelectorAll("[data-strand]");
  const suit = hero.querySelector("[data-suit]");
  const suitWeave = hero.querySelector("[data-suit-weave]");

  /* --- Reduced motion: show the final composition, skip the choreography --- */
  if (reduced) {
    gsap.set([hero.querySelector("[data-eyebrow]"), hero.querySelector("[data-cue]")], {
      opacity: 1,
    });
    gsap.set(hero.querySelector("[data-rule]"), { scaleX: 1 });
    gsap.set(suit, { opacity: 0.85 });
  } else {
    /* --- Split the three stacked copies into characters ------------------
       Each copy is split independently so the ghosts can be offset per-char
       without re-measuring the real text. */
    const splitMain = SplitText.create(quote.querySelector("[data-quote-text]"), {
      type: "chars,words",
      charsClass: "char",
    });
    const ghosts = [...quote.querySelectorAll(".hero-quote-ghost")].map((el) =>
      SplitText.create(el, { type: "chars,words", charsClass: "char" })
    );

    /* Paused until the loader's wipe clears — Loader.js resolves
       window.__introDone on that exact frame. The fallback keeps the hero
       working if the loader is ever removed from the page. */
    const tl = gsap.timeline({ paused: true });
    (window.__introDone ?? Promise.resolve()).then(() => tl.play());

    /* 0. Suit backdrop resolves first, so the quote lands onto it rather
          than appearing over empty black. Held below full opacity — it is a
          backdrop, and the quote has to stay the brightest thing on screen. */
    /* immediateRender:false so this does not stamp opacity 0 over the scroll
       tween's start value while the timeline is still paused. */
    tl.fromTo(
      suit,
      { opacity: 0, scale: 1.12 },
      {
        opacity: 0.85,
        scale: 1,
        duration: 2.4,
        ease: "power2.out",
        immediateRender: false,
      },
      0
    );

    /* 1. Web strands trace themselves in behind the quote. */
    tl.fromTo(
      strands,
      { drawSVG: "0%" },
      {
        drawSVG: "100%",
        duration: 2.6,
        ease: "power2.inOut",
        stagger: { each: 0.09, from: "random" },
      },
      0
    );

    /* 2. Characters rise letter-by-letter out of blur.
          Long stagger + long duration is what makes it read as "slow reveal"
          rather than a standard stagger-in. */
    tl.fromTo(
      splitMain.chars,
      { yPercent: 115, opacity: 0, filter: "blur(14px)" },
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.15,
        ease: "power3.out",
        stagger: 0.045,
      },
      0.5
    );

    /* 3. Ghost copies follow the same path but land offset, then converge —
          the misregistration "settles" like a print plate lining up. */
    ghosts.forEach((ghost, i) => {
      const dir = i === 0 ? -1 : 1;
      tl.fromTo(
        ghost.chars,
        {
          yPercent: 115,
          opacity: 0,
          x: dir * 18,
          filter: "blur(14px)",
        },
        {
          yPercent: 0,
          opacity: 0.85,
          x: dir * 6,
          filter: "blur(0px)",
          duration: 1.15,
          ease: "power3.out",
          stagger: 0.045,
        },
        0.5
      ).to(
        ghost.chars,
        {
          x: 0,
          opacity: 0,
          duration: 1.1,
          ease: "power2.inOut",
          stagger: 0.02,
        },
        2.15
      );
    });

    /* 4. Rule, attribution, and cue arrive after the line has landed. */
    tl.to(hero.querySelector("[data-rule]"), {
      scaleX: 1,
      duration: 1.2,
      ease: "power3.inOut",
    }, 2.5)
      .to(hero.querySelector("[data-eyebrow]"), {
        opacity: 1,
        duration: 0.9,
        ease: "power2.out",
      }, 2.7)
      .to(hero.querySelector("[data-cue]"), {
        opacity: 1,
        duration: 0.9,
        ease: "power2.out",
      }, 3.1);

    /* --- Ambient drift: the web keeps breathing after the intro --------- */
    const drift = gsap.to(hero.querySelector("[data-web]"), {
      rotation: 8,
      scale: 1.06,
      duration: 32,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      transformOrigin: "50% 50%",
      paused: true,
    });
    (window.__introDone ?? Promise.resolve()).then(() => drift.play());
  }

  /* --- Scroll handoff ---------------------------------------------------
     The quote scales up and blurs out as the hero leaves, so the collage
     feels like it emerges *through* the hero rather than after it. */
  if (!reduced) {
    gsap.to(hero.querySelector(".hero-inner"), {
      scale: 1.35,
      opacity: 0,
      filter: "blur(18px)",
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    });

    /* Suit fades on the same scrub as the quote but scales less — the smaller
       move reads as distance behind the text. It clears just before the hero
       fully leaves, so it never bleeds into the collage. */
    /* fromTo, not to: this tween is built at module load, when the suit is
       still at its CSS opacity of 0 because the intro has not run yet. A
       plain `to` would capture 0 as the start and animate 0 → 0, so the
       backdrop appeared to vanish the instant you scrolled. Pinning the
       start value explicitly decouples it from creation order. */
    gsap.fromTo(
      suit,
      { scale: 1, opacity: 0.85, filter: "blur(0px)" },
      {
        scale: 1.15,
        opacity: 0,
        filter: "blur(10px)",
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "85% top",
          scrub: 0.6,
        },
      }
    );

    /* Artwork drifts up behind its own container — parallax within the suit
       layer, so the image and its vignette don't move as one flat plane. */
    gsap.to(suitWeave, {
      yPercent: -8,
      scale: 1.08,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    gsap.to(hero.querySelector("[data-cue]"), {
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "15% top",
        scrub: true,
      },
    });
  }
}
