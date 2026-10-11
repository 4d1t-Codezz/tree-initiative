(() => {
  "use strict";

  const CFG = window.TREE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Config-driven content ---------- */
  const orgCount = (CFG.partners || []).length || 8;
  $$('[data-from-config="orgCount"]').forEach((el) => {
    el.textContent = orgCount;
    if (el.hasAttribute("data-count")) el.dataset.count = orgCount;
  });

  const students = Number.isFinite(CFG.schoolStudents) ? CFG.schoolStudents : null;
  $$('[data-from-config="schoolStudents"]').forEach((el) => {
    if (students === null) { el.textContent = "—"; return; }
    el.textContent = fmt(students);
    el.dataset.count = students;
  });

  // Next event card
  const ev = CFG.nextEvent;
  const evCard = $(".join__card--event");
  if (ev === null && evCard) {
    evCard.remove();
  } else if (ev && evCard) {
    const d = new Date(ev.date + "T12:00:00");
    if (!isNaN(d)) {
      $("#evMonth").textContent = d.toLocaleString("en-US", { month: "short" });
      $("#evDay").textContent = d.getDate();
      const weekday = d.toLocaleString("en-US", { weekday: "long" });
      $("#evPlace").textContent = `${weekday} · ${ev.place}`;
    }
    $("#evTitle").textContent = ev.title;
    if (ev.rsvp) $("#evRsvp").href = ev.rsvp;
  }

  /* ---------- Live visitor counter ---------- */
  const visitorEl = $("#visitorCount");
  (async () => {
    const base = Number(CFG.visitorBaseline) || 0;
    const ns = encodeURIComponent(CFG.counterNamespace || "treeinitiative-net");
    const key = encodeURIComponent(CFG.counterKey || "visits");
    let counted = false;
    try { counted = sessionStorage.getItem("tree-counted") === "1"; } catch (_) {}
    const url = `https://abacus.jasoncameron.dev/${counted ? "get" : "hit"}/${ns}/${key}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const { value } = await res.json();
      if (typeof value !== "number") throw new Error("bad value");
      try { sessionStorage.setItem("tree-counted", "1"); } catch (_) {}
      const total = base + value;
      visitorEl.dataset.count = total;
      if (window.gsap && !reduceMotion && visitorEl.dataset.seen) {
        countUp(visitorEl, total);
      } else {
        visitorEl.textContent = fmt(total);
      }
    } catch (_) {
      visitorEl.textContent = base ? fmt(base) : "—";
    }
  })();

  /* ---------- Nav ---------- */
  const nav = $("#nav");
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-solid", y > 40);
    const menuOpen = toggle.getAttribute("aria-expanded") === "true";
    nav.classList.toggle("is-hidden", !menuOpen && y > lastY && y > 500);
    lastY = y;
  };
  const toggle = $("#navToggle");
  const menu = $("#mobileMenu");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenu(false); closeLightbox(); } });
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Active section highlighting
  const navLinks = $$(".nav__links a[href^='#']");
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["glance", "impact", "founder", "projects", "partners", "join"].forEach((id) => { const s = document.getElementById(id); if (s) sectionObs.observe(s); });

  /* ---------- Background videos: play only while visible ---------- */
  const videoObs = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (v.preload === "none") { v.preload = "auto"; v.load(); }
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { rootMargin: "200px 0px" });
  $$(".vbg__video").forEach((v) => {
    if (reduceMotion) { v.removeAttribute("autoplay"); v.pause(); return; }
    videoObs.observe(v);
  });

  /* ---------- Gallery ---------- */
  const photos = [
    ["ev02", "Volunteers gathered at the Columbia Tap Trail"], ["ev05", "Volunteer carrying a tree to plant", 1],
    ["ev08", "Volunteers at Alief Planting #1"], ["ev13", "Digging in at Alief", 1], ["ev21", "Planting a sapling along the trail", 1],
    ["ev09", "Rows of newly mulched trees"], ["ev24", "Breaking ground for a new tree", 1], ["ev31", "Volunteers at Columbia Tap Planting #3", 1],
    ["ev14", "Tree Care Day on the Columbia Tap Trail"], ["ev12", "A newly planted tree along the trail", 1],
    ["ws4", "AliefVotes presenting at the workshop", 1], ["ev33", "New trees on S. Dairy Ashford", 1], ["ev19", "Tree Care Day volunteers"],
    ["ev28", "A freshly planted tree", 1], ["ev18", "Planting along the trail"], ["ev11", "Native saplings ready for planting", 1],
    ["ev35", "Volunteers on the Alief esplanade", 1], ["ws3", "Ed Pettitt of Friends of Columbia Tap speaking", 1], ["ev06", "A young tree, planted and mulched", 1],
    ["ev22", "Hands in the soil", 1], ["ev30", "Planting together", 1], ["home", "Houston trees at dusk"],
  ];
  const gallery = $("#gallery");
  if (gallery) {
    const half = Math.ceil(photos.length / 2);
    [photos.slice(0, half), photos.slice(half)].forEach((set, i) => {
      const row = document.createElement("div");
      row.className = "gallery__row" + (i ? " gallery__row--rev" : "");
      // duplicate for a seamless loop
      [...set, ...set].forEach(([name, alt, tall], j) => {
        const b = document.createElement("button");
        b.type = "button";
        if (j >= set.length) { b.tabIndex = -1; b.setAttribute("aria-hidden", "true"); }
        b.setAttribute("aria-label", `View photo: ${alt}`);
        b.innerHTML = `<img src="assets/img/${name}.jpg" alt="${alt}" loading="lazy" class="${tall ? "tall" : ""}">`;
        row.appendChild(b);
      });
      gallery.appendChild(row);
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox");
  const lbImg = $("img", lb);
  let lastFocus = null;
  function openLightbox(src, alt) {
    lastFocus = document.activeElement;
    lbImg.src = src; lbImg.alt = alt || "";
    lb.hidden = false;
    $(".lightbox__close", lb).focus();
    if (window.__lenis) window.__lenis.stop();
  }
  function closeLightbox() {
    if (lb.hidden) return;
    lb.hidden = true;
    if (window.__lenis) window.__lenis.start();
    if (lastFocus) lastFocus.focus();
  }
  lb.addEventListener("click", (e) => { if (e.target !== lbImg) closeLightbox(); });
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".gallery__row img, .event__media img") || (e.target.closest(".gallery__row button") && $("img", e.target.closest("button")));
    if (img) openLightbox(img.currentSrc || img.src, img.alt);
  });

  /* ---------- Animation (GSAP) ---------- */
  function countUp(el, to) {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: to, duration: to > 100 ? 2.2 : 1.6, ease: "power3.out",
      onUpdate: () => { el.textContent = fmt(obj.v); },
    });
  }

  function initMotion() {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger || reduceMotion) return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("has-motion");

    // Smooth scroll
    if (window.Lenis && !matchMedia("(pointer: coarse)").matches) {
      const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        const target = id.length > 1 && document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: id === "#top" ? 0 : -10, duration: 1.4 });
      }));
    }

    // Hero intro
    const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
    intro
      .from(".hero .vbg__video", { scale: 1.25, duration: 2.6, ease: "power2.out" }, 0)
      .from("[data-hero-line]", { yPercent: 115, duration: 1.4, stagger: 0.12 }, 0.2)
      .from("[data-hero]", { y: 28, autoAlpha: 0, duration: 1.2, stagger: 0.1 }, 0.55)
      .from(".hero__ticker", { yPercent: 100, duration: 1.2 }, 0.9)
      .from(".nav", { y: -30, autoAlpha: 0, duration: 1 }, 0.6);

    // Hero parallax on scroll
    gsap.to(".hero__inner", {
      yPercent: -18, autoAlpha: 0.15, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero .vbg__video", {
      yPercent: 12, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    // Reveal on scroll
    gsap.set("[data-reveal]", { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.09, overwrite: true }),
    });

    // Count-up numbers
    $$("[data-count]").forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: () => {
          el.dataset.seen = "1";
          const to = Number(el.dataset.count);
          if (Number.isFinite(to)) countUp(el, to);
        },
      });
    });

    // Progress + bar chart
    gsap.from(".goal__fill", {
      scaleX: 0, duration: 2, ease: "power3.out",
      scrollTrigger: { trigger: ".goal", start: "top 85%", once: true },
    });
    gsap.from(".bars__fill", {
      scaleX: 0, duration: 1.4, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: ".bars", start: "top 85%", once: true },
    });

    // Recognition number punch-in
    gsap.from(".recognition__big", {
      scale: 0.85, autoAlpha: 0, duration: 1.6, ease: "expo.out",
      scrollTrigger: { trigger: ".recognition", start: "top 70%", once: true },
    });

    // Timeline progress line + active dots
    const tl = $(".timeline");
    if (tl) {
      ScrollTrigger.create({
        trigger: tl, start: "top 60%", end: "bottom 60%", scrub: true,
        onUpdate: (self) => tl.style.setProperty("--tl", self.progress.toFixed(4)),
      });
      $$(".event").forEach((evEl) => {
        ScrollTrigger.create({ trigger: evEl, start: "top 60%", onEnter: () => evEl.classList.add("is-in"), onLeaveBack: () => evEl.classList.remove("is-in") });
        const imgs = $$(".event__media img", evEl);
        gsap.from(imgs[1], { yPercent: 25, ease: "none", scrollTrigger: { trigger: evEl, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }

    // Image parallax
    $$("[data-parallax]").forEach((img) => {
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 0, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // Section video drift
    $$("section:not(.hero) .vbg__video").forEach((v) => {
      gsap.fromTo(v, { yPercent: -4 }, {
        yPercent: 4, ease: "none",
        scrollTrigger: { trigger: v.closest("section"), start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // Magnetic buttons (fine pointers only)
    if (matchMedia("(pointer: fine)").matches) {
      $$(".magnetic").forEach((btn) => {
        const xTo = gsap.quickTo(btn, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
        const yTo = gsap.quickTo(btn, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
        btn.addEventListener("mousemove", (e) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.25);
          yTo((e.clientY - r.top - r.height / 2) * 0.35);
        });
        btn.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
      });
    }

    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  initMotion();
})();
