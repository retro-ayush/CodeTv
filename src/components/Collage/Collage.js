import { gsap, ScrollTrigger, SplitText } from "../../lib/gsap.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 768px)").matches;

const collage = document.querySelector("[data-collage]");

if (collage) {
  /* --- Section heading --------------------------------------------------- */
  const title = collage.querySelector("[data-collage-title]");
  if (title && !reduced) {
    const split = SplitText.create(title, { type: "chars", charsClass: "char" });
    gsap.from(split.chars, {
      yPercent: 100,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.03,
      scrollTrigger: { trigger: title, start: "top 85%" },
    });
  }

  gsap.from(collage.querySelector(".collage-head .eyebrow"), {
    opacity: 0,
    y: 16,
    duration: 0.8,
    ease: "power2.out",
    scrollTrigger: { trigger: collage.querySelector("[data-collage-head]"), start: "top 85%" },
  });

  /* --- Panels ------------------------------------------------------------ */
  const panels = collage.querySelectorAll("[data-panel]");

  panels.forEach((panel, i) => {
    const video = panel.querySelector("[data-panel-video]");
    const tilt = parseFloat(panel.dataset.tilt) || 0;
    const drift = parseFloat(panel.dataset.drift) || 0;

    /* Reveal — alternating entry direction keeps consecutive panels from
       feeling like a single repeated move. */
    if (!reduced) {
      const fromLeft = i % 2 === 0;

      gsap.from(panel, {
        opacity: 0,
        scale: 0.82,
        yPercent: 14,
        xPercent: fromLeft ? -6 : 6,
        rotation: tilt + (fromLeft ? -7 : 7),
        filter: "blur(12px)",
        duration: 1.3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: panel,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });

      /* Parallax — panels drift against the scroll at differing rates.
         Damped on mobile where the single column makes big offsets feel
         like layout bugs rather than depth. */
      gsap.to(panel, {
        y: isMobile ? drift * 0.25 : drift,
        ease: "none",
        scrollTrigger: {
          trigger: panel,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }

    /* --- Video lifecycle -------------------------------------------------
       Load lazily as the panel approaches, play only while on screen. Six
       simultaneously-decoding videos would stall scrolling on mobile. */
    if (video) {
      let loaded = false;

      const markLive = () => video.classList.add("is-live");

      /* readyState >= 2 means we have real frame data — a missing file never
         reaches this, so the CSS fill correctly stays visible. */
      video.addEventListener("loadeddata", markLive);
      video.addEventListener("error", () => video.classList.remove("is-live"));

      ScrollTrigger.create({
        trigger: panel,
        start: "top bottom+=20%",
        end: "bottom top-=20%",
        onEnter: () => {
          if (!loaded) {
            loaded = true;
            video.preload = "auto";
            video.load();
          }
          video.play().catch(() => {});
        },
        onEnterBack: () => video.play().catch(() => {}),
        onLeave: () => video.pause(),
        onLeaveBack: () => video.pause(),
      });
    }
  });
}
