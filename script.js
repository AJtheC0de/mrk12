(() => {
  const root = document.documentElement;
  const header = document.querySelector("[data-nav]");
  const navToggle = document.querySelector(".nav-toggle");
  const progressBar = document.querySelector(".progress span");
  const faqItems = document.querySelectorAll(".faq-list details");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let lenis = null;

  if (window.location.pathname.endsWith("/index.html")) {
    const cleanPath = window.location.pathname.replace(/index\.html$/, "");
    window.history.replaceState(null, "", `${cleanPath}${window.location.search}${window.location.hash}`);
  }

  /* ------------------------------------------------------------------------
     Navigation
     ------------------------------------------------------------------------ */

  const setMenu = (isOpen) => {
    document.body.classList.toggle("menu-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    if (isOpen) header.classList.remove("hide");
    if (lenis) isOpen ? lenis.stop() : lenis.start();
  };

  navToggle.addEventListener("click", () => {
    setMenu(!document.body.classList.contains("menu-open"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
      setMenu(false);
      navToggle.focus();
    }
  });

  window.matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });

  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => other !== item && other.removeAttribute("open"));
    });
  });

  // Header hides while scrolling down and returns when scrolling up.
  let lastY = window.scrollY;
  const darkSections = document.querySelectorAll(".problem, .final");
  const onScroll = (y) => {
    const probe = 40;
    header.classList.toggle(
      "on-dark",
      [...darkSections].some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= probe && rect.bottom >= probe;
      })
    );

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

    if (!document.body.classList.contains("menu-open")) {
      header.classList.toggle("hide", y > lastY && y > 480);
    }
    lastY = y;
  };

  /* ------------------------------------------------------------------------
     Static mode: reduced motion, or the animation libraries failed to load.
     Everything is visible by default in CSS, so nothing else is needed.
     ------------------------------------------------------------------------ */

  const hasGsap = window.gsap && window.ScrollTrigger;

  if (reduceMotion || !hasGsap) {
    root.classList.add("static");
    window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
    onScroll(window.scrollY);
    return;
  }

  /* ------------------------------------------------------------------------
     Motion mode
     ------------------------------------------------------------------------ */

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add("motion");

  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on("scroll", ({ scroll }) => {
      ScrollTrigger.update();
      onScroll(scroll);
    });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
  }

  // Anchor links: pinned sections start exactly at their top, others get header room.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const target = href.length > 1 && document.querySelector(href);
      setMenu(false);
      if (!target) return;

      event.preventDefault();
      const pinned = target.matches(".scene, .gallery");
      const offset = href === "#top" || pinned ? 0 : 88;
      const y = href === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY - offset;

      if (lenis) lenis.scrollTo(y, { duration: 1.4 });
      else window.scrollTo({ top: y, behavior: "smooth" });
      window.history.pushState(null, "", href);
    });
  });

  const mm = gsap.matchMedia();

  /* Hero intro ------------------------------------------------------------ */

  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  gsap.set(".hero-title .hl", { "--sweep": 0 });
  intro
    .from("[data-intro-line]", { yPercent: 110, duration: 1.2, stagger: 0.1 })
    .from(".pill", { y: 16, autoAlpha: 0, duration: 0.9 }, 0.1)
    .to(".hero-title .hl", { "--sweep": 1, duration: 0.9, ease: "power2.inOut" }, 0.65)
    .from(".hero .lead, .hero-actions, .hero .download-meta", { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0.45)
    .from(".device", { y: 140, autoAlpha: 0, duration: 1.4, stagger: { each: 0.1, from: "center" } }, 0.5)
    .from(".chip", { scale: 0.6, autoAlpha: 0, duration: 0.8, ease: "back.out(2)", stagger: 0.15 }, 1.2);

  gsap.to(".chip-left", { y: -12, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true });
  gsap.to(".chip-right", { y: 10, duration: 3, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 0.4 });

  // Phones start tilted back and straighten and spread as you scroll.
  gsap.fromTo(
    ".devices-rig",
    { rotationX: 24, scale: 0.94, transformPerspective: 1400 },
    {
      rotationX: 0,
      scale: 1,
      ease: "none",
      scrollTrigger: { trigger: ".devices", start: "top 90%", end: "center 45%", scrub: 0.6 },
    }
  );
  gsap.to(".device-left", {
    xPercent: -14,
    ease: "none",
    scrollTrigger: { trigger: ".devices", start: "top 70%", end: "bottom top", scrub: 0.6 },
  });
  gsap.to(".device-right", {
    xPercent: 14,
    ease: "none",
    scrollTrigger: { trigger: ".devices", start: "top 70%", end: "bottom top", scrub: 0.6 },
  });
  gsap.to(".hero-copy", {
    y: -80,
    autoAlpha: 0.2,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "45% top", scrub: true },
  });

  if (finePointer) {
    const rig = document.querySelector(".devices-rig");
    const tiltY = gsap.quickTo(rig, "rotationY", { duration: 0.8, ease: "power3.out" });
    document.querySelector(".hero").addEventListener("pointermove", (event) => {
      tiltY(((event.clientX / window.innerWidth) - 0.5) * 10);
    });
  }

  /* Marquee: endless loop that speeds up with scroll velocity ------------- */

  const track = document.querySelector(".marquee-track");
  track.innerHTML += track.innerHTML;
  const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
  const skew = gsap.quickTo(track, "skewX", { duration: 0.4, ease: "power3.out" });
  ScrollTrigger.create({
    trigger: ".marquee",
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      const velocity = self.getVelocity();
      const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(velocity) / 500);
      gsap.to(loop, { timeScale: boost * (self.direction || 1), duration: 0.2, overwrite: true });
      gsap.to(loop, { timeScale: self.direction || 1, duration: 1.2, delay: 0.2 });
      skew(gsap.utils.clamp(-8, 8, velocity / -300));
    },
    onLeave: () => skew(0),
  });

  /* Problem: words light up with scroll, then the key word "fades" -------- */

  const statement = document.querySelector("[data-split]");
  const words = [];
  [...statement.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.append(" ");
        } else {
          const span = document.createElement("span");
          span.className = "w";
          span.textContent = part;
          fragment.append(span);
          words.push(span);
        }
      });
      node.replaceWith(fragment);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      words.push(node);
    }
  });

  gsap.fromTo(
    words,
    { opacity: 0.14 },
    {
      opacity: 1,
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 50%", scrub: true },
    }
  );
  gsap.to(".forget > span", {
    opacity: 0.35,
    filter: "blur(5px)",
    ease: "none",
    scrollTrigger: { trigger: statement, start: "bottom 48%", end: "bottom 15%", scrub: true },
  });
  gsap.from(".pain", {
    y: 48,
    autoAlpha: 0,
    duration: 1.1,
    ease: "expo.out",
    stagger: 0.12,
    scrollTrigger: { trigger: ".pains", start: "top 85%", once: true },
  });

  /* Scroll story: highlight → scan → card → library ------------------------ */

  const canvas = document.querySelector(".scene-canvas");
  const book = canvas.querySelector(".book");
  const card = canvas.querySelector(".xcard");
  const stack = canvas.querySelector(".stack");
  const caps = gsap.utils.toArray(".cap");
  const fills = gsap.utils.toArray(".scene-progress i");

  const toStack = () => {
    const c = { x: card.offsetLeft + card.offsetWidth / 2, y: card.offsetTop + card.offsetHeight / 2 };
    const s = { x: stack.offsetLeft + stack.offsetWidth / 2, y: stack.offsetTop + stack.offsetHeight / 2 };
    return { x: s.x - c.x, y: s.y - c.y, scale: (stack.offsetWidth * 1.05) / card.offsetWidth };
  };

  gsap.set(caps.slice(1), { autoAlpha: 0, y: 24 });
  gsap.set(".sweep", { "--sweep": 0 });

  const story = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".scene",
      start: "top top",
      end: () => `+=${window.innerHeight * 3.2}`,
      pin: true,
      scrub: 0.7,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  story
    // 01 Scan: the page settles, the marker draws, the scanner locks on.
    .fromTo(
      book,
      { rotationX: 26, rotationZ: -4, scale: 0.9, y: 40, transformPerspective: 1200, transformOrigin: "50% 100%" },
      { rotationX: 0, rotationZ: 0, scale: 1, y: 0, duration: 1.6, ease: "power2.out" },
      0
    )
    .to(".sweep", { "--sweep": 1, duration: 1.4, ease: "power1.inOut" }, 1.1)
    .fromTo(".frame", { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, 2.5)
    .fromTo(".scanline", { autoAlpha: 0, top: "0%" }, { autoAlpha: 1, duration: 0.1 }, 2.8)
    .to(".scanline", { top: "100%", duration: 1, ease: "power1.inOut" }, 2.8)
    .to(".scanline", { autoAlpha: 0, duration: 0.2 }, 3.8)
    .fromTo(fills[0], { scaleX: 0 }, { scaleX: 1, duration: 4 }, 0)

    // 02 Understand: the passage lifts out of the page as a card with an explanation.
    .to(caps[0], { autoAlpha: 0, y: -24, duration: 0.5 }, 4)
    .to(caps[1], { autoAlpha: 1, y: 0, duration: 0.5 }, 4.3)
    .to(".frame", { autoAlpha: 0, duration: 0.4 }, 4)
    .to(book, { autoAlpha: 0.28, scale: 0.94, y: -12, duration: 1 }, 4)
    .fromTo(card, { autoAlpha: 0, y: 80, scale: 0.86, rotation: -3 }, { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 1.2, ease: "power2.out" }, 4.2)
    .fromTo(".xcard-explain", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }, 5.2)
    .fromTo(".xcard-save", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 5.8)
    .fromTo(fills[1], { scaleX: 0 }, { scaleX: 1, duration: 3 }, 4)

    // 03 Remember: the card is saved and files itself into the library stack.
    .to(caps[1], { autoAlpha: 0, y: -24, duration: 0.5 }, 7)
    .to(caps[2], { autoAlpha: 1, y: 0, duration: 0.5 }, 7.3)
    .fromTo(stack, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }, 6.9)
    .to(".xcard-save", { backgroundColor: "#1f9d55", duration: 0.3 }, 7)
    .to(card, { x: () => toStack().x, y: () => toStack().y, scale: () => toStack().scale, rotation: 4, duration: 1.6, ease: "power2.inOut" }, 7.3)
    .to(book, { autoAlpha: 0.12, duration: 1 }, 7.3)
    .fromTo(".saved-chip", { autoAlpha: 0, y: 14, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(2)" }, 8.6)
    .fromTo(fills[2], { scaleX: 0 }, { scaleX: 1, duration: 2.5 }, 7)
    .to({}, { duration: 0.6 });

  /* Gallery: horizontal scroll on desktop, native swipe on touch ------------ */

  mm.add("(min-width: 900px)", () => {
    const galleryTrack = document.querySelector(".gallery-track");
    const viewport = document.querySelector(".gallery-viewport");
    const distance = () => Math.max(0, galleryTrack.scrollWidth - viewport.clientWidth);

    const tween = gsap.to(galleryTrack, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".gallery",
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.7,
        invalidateOnRefresh: true,
      },
    });

    gsap.utils.toArray(".shot-media img").forEach((img) => {
      gsap.fromTo(
        img,
        { rotation: -4, yPercent: 6 },
        {
          rotation: 4,
          yPercent: -6,
          ease: "none",
          scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
        }
      );
    });
  });

  gsap.from(".gallery-head > *", {
    y: 40,
    autoAlpha: 0,
    duration: 1,
    ease: "expo.out",
    stagger: 0.1,
    scrollTrigger: { trigger: ".gallery", start: "top 75%", once: true },
  });

  /* Reveals + final CTA ------------------------------------------------------ */

  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 40,
      autoAlpha: 0,
      duration: 0.9,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 94%", once: true },
    });
  });

  gsap.set(".hl-final", { "--sweep": 0 });
  gsap.to(".hl-final", {
    "--sweep": 1,
    duration: 1,
    ease: "power2.inOut",
    delay: 0.35,
    scrollTrigger: { trigger: ".final-title", start: "top 80%", once: true },
  });

  gsap.from(".final-icon", {
    rotation: -18,
    scale: 0.6,
    duration: 1.4,
    ease: "elastic.out(1, 0.6)",
    scrollTrigger: { trigger: ".final-icon", start: "top 88%", once: true },
  });

  if (finePointer) {
    const final = document.querySelector(".final");
    const glow = document.querySelector(".final-glow");
    const glowX = gsap.quickTo(glow, "x", { duration: 1.2, ease: "power3.out" });
    const glowY = gsap.quickTo(glow, "y", { duration: 1.2, ease: "power3.out" });
    final.addEventListener("pointermove", (event) => {
      const rect = final.getBoundingClientRect();
      glowX(event.clientX - rect.left);
      glowY(event.clientY - rect.top);
    });

    // Magnetic download buttons.
    document.querySelectorAll(".magnetic").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const my = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        mx((event.clientX - rect.left - rect.width / 2) * 0.3);
        my((event.clientY - rect.top - rect.height / 2) * 0.4);
      });
      el.addEventListener("pointerleave", () => {
        mx(0);
        my(0);
      });
    });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());

  // Deep links (e.g. /#faq) land after pins have been measured.
  if (window.location.hash.length > 1) {
    window.addEventListener("load", () => {
      const target = document.querySelector(window.location.hash);
      if (!target) return;
      const pinned = target.matches(".scene, .gallery");
      const y = target.getBoundingClientRect().top + window.scrollY - (pinned ? 0 : 88);
      lenis ? lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
    });
  }

  onScroll(window.scrollY);
})();
