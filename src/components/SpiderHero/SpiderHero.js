import { gsap, SplitText, DrawSVGPlugin, ScrollTrigger } from "../../lib/gsap.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const hero = document.querySelector("[data-hero]");
if (hero) {
  const quote = hero.querySelector("[data-quote]");
  const strands = hero.querySelectorAll("[data-strand]");

  /* --- Reduced motion: show the final composition, skip the choreography --- */
  if (reduced) {
    gsap.set([hero.querySelector("[data-eyebrow]"), hero.querySelector("[data-cue]")], {
      opacity: 1,
    });
    gsap.set(hero.querySelector("[data-rule]"), { scaleX: 1 });
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
