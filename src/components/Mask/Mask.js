import { gsap, SplitText, ScrollTrigger, ScrollToPlugin } from "../../lib/gsap.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const mask = document.querySelector("[data-mask]");

if (mask) {
  const line = mask.querySelector("[data-mask-line]");
  const eyebrow = mask.querySelector("[data-mask-eyebrow]");
  const cta = mask.querySelector("[data-mask-cta]");
  const glow = mask.querySelector("[data-mask-glow]");

  if (reduced) {
    gsap.set([eyebrow, cta], { opacity: 1 });
    gsap.set(glow, { opacity: 1 });
  } else {
    const split = SplitText.create(line.querySelector("span"), {
      type: "chars,words",
      charsClass: "char",
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: mask,
        start: "top 65%",
        toggleActions: "play none none reverse",
      },
    });

    /* Glow blooms first so the text resolves out of light rather than black. */
    tl.to(glow, { opacity: 1, duration: 2.2, ease: "power2.out" }, 0)
      .from(
        split.chars,
        {
          yPercent: 100,
          opacity: 0,
          filter: "blur(16px)",
          duration: 1.4,
          ease: "power3.out",
          stagger: 0.055, /* slower than the hero — this is the closing beat */
        },
        0.15
      )
      .to(eyebrow, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0.5)
      .to(cta, { opacity: 1, duration: 0.9, ease: "power2.out" }, 1.6);

    /* Glow drifts continuously once revealed. */
    gsap.to(glow, {
      scale: 1.18,
      xPercent: 4,
      duration: 14,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }

  /* --- Replay link -------------------------------------------------------
     ScrollSmoother intercepts anchor jumps, so scroll explicitly. */
  cta?.addEventListener("click", (event) => {
    event.preventDefault();
    gsap.to(window, {
      scrollTo: { y: 0 },
      duration: reduced ? 0 : 1.8,
      ease: "power3.inOut",
    });
  });
}

/* Every trigger is registered by now — recompute once fonts and images have
   settled so start/end positions match the final layout. */
window.addEventListener("load", () => ScrollTrigger.refresh());
