(() => {
  "use strict";

  const CFG = window.TREE_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const navHeight = () => $("#nav").offsetHeight;

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

  const ev = CFG.nextEvent;
  const evCard = $(".join__card--event");
  if (ev === null && evCard) {
    evCard.remove();
  } else if (ev && evCard && new Date(ev.date + "T23:59:59") < new Date()) {
    evCard.remove();   // the event already happened; update nextEvent in config.js
  } else if (ev && evCard) {
    const d = new Date(ev.date + "T12:00:00");
    if (!isNaN(d)) {
      $("#evMonth").textContent = d.toLocaleString("en-US", { month: "short" });
      $("#evDay").textContent = d.getDate();
      $("#evPlace").textContent = `${d.toLocaleString("en-US", { weekday: "long" })} · ${ev.place}`;
    }
    $("#evTitle").textContent = ev.title;
    if (ev.rsvp) $("#evRsvp").href = ev.rsvp;
  }

  /* ---------- Donation form (same options as the old site) ---------- */
  const donateForm = $("#donateForm");
  if (donateForm) {
    const otherWrap = $("#donateOther");
    const otherInput = $('input[name="otherAmount"]', donateForm);
    const submit = $("#donateSubmit");
    const note = $("#donateNote");
    const comment = $('textarea[name="comment"]', donateForm);
    const read = () => {
      const fd = new FormData(donateForm);
      const pick = fd.get("amount");
      const amount = pick === "other" ? Math.floor(Number(fd.get("otherAmount"))) : Number(pick);
      return { monthly: fd.get("frequency") === "monthly", amount, other: pick === "other", comment: String(fd.get("comment") || "") };
    };
    const refresh = () => {
      const d = read();
      otherWrap.hidden = !d.other;
      const ok = Number.isFinite(d.amount) && d.amount >= 1;
      submit.textContent = ok ? `Donate $${d.amount.toLocaleString("en-US")}${d.monthly ? " monthly" : ""}` : "Donate";
      $("#donateCount").textContent = `${comment.value.length}/100`;
    };
    donateForm.addEventListener("input", refresh);
    donateForm.addEventListener("change", (e) => {
      if (e.target.name === "amount" && e.target.value === "other") otherInput.focus();
      refresh();
    });
    donateForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = read();
      if (!Number.isFinite(d.amount) || d.amount < 1) {
        note.textContent = "Please enter an amount of at least $1.";
        otherInput.focus();
        return;
      }
      const conf = CFG.donate || {};
      let url;
      if (conf.paypalMe) {
        // PayPal.me pre-fills the amount; it handles one-time payments only
        url = `https://paypal.me/${encodeURIComponent(conf.paypalMe)}/${d.amount}USD`;
        note.textContent = d.monthly
          ? "Opening PayPal for this month’s gift. PayPal.me can’t repeat payments automatically, so email us to set up a monthly donation."
          : "Opening PayPal in a new tab…";
      } else if (conf.paypalEmail) {
        const q = new URLSearchParams({
          business: conf.paypalEmail, amount: String(d.amount), currency_code: "USD",
          item_name: `Houston TREE Initiative${d.monthly ? " (monthly)" : ""}${d.comment ? ": " + d.comment : ""}`.slice(0, 127),
        });
        url = `https://www.paypal.com/donate/?${q}`;
        note.textContent = d.monthly ? "Opening PayPal. Tick “Make this a monthly donation” there to repeat it." : "Opening PayPal in a new tab…";
      } else if (conf.url) {
        url = conf.url;
        note.textContent = `Opening the secure donation page in a new tab. Choose $${d.amount}${d.monthly ? " monthly" : ""} there to finish.`;
      } else {
        url = `mailto:houstontreeinitiative@gmail.com?subject=${encodeURIComponent(`Donation: $${d.amount}${d.monthly ? " monthly" : ""}`)}&body=${encodeURIComponent(d.comment)}`;
      }
      // New tab if allowed; if a popup blocker stops it, go there in this tab instead.
      // (Not using the "noopener" feature string: it makes window.open always return null,
      // so a blocked popup would fail silently.)
      const w = window.open(url, "_blank");
      if (w) w.opener = null;
      else window.location.href = url;
    });
    refresh();
  }

  /* ---------- Live visitor counter ---------- */
  const visitorEl = $("#visitorCount");
  (async () => {
    const base = Number(CFG.visitorBaseline) || 0;
    const ns = encodeURIComponent(CFG.counterNamespace || "treeinitiative-net");
    const key = encodeURIComponent(CFG.counterKey || "visits");
    let counted = false;
    try { counted = sessionStorage.getItem("tree-counted") === "1"; } catch (_) {}
    try {
      const res = await fetch(`https://abacus.jasoncameron.dev/${counted ? "get" : "hit"}/${ns}/${key}`, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const { value } = await res.json();
      if (typeof value !== "number") throw new Error("bad value");
      try { sessionStorage.setItem("tree-counted", "1"); } catch (_) {}
      const total = base + value;
      visitorEl.dataset.count = total;
      if (window.gsap && !reduceMotion && visitorEl.dataset.seen) countUp(visitorEl, total);
      else visitorEl.textContent = fmt(total);
    } catch (_) {
      visitorEl.textContent = base ? fmt(base) : "—";
    }
  })();

  /* ---------- Mobile menu ---------- */
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

  // Active section in the nav
  const navLinks = $$(".nav__links a[href^='#']:not(.btn)");
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute("href")); if (s) sectionObs.observe(s); });

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

  /* ---------- Team tabs ---------- */
  const tabs = $$('[role="tab"]');
  const selectTab = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (window.gsap && !reduceMotion) {
      gsap.fromTo($(".person__photo img", panel), { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power3.out", clearProps: "transform" });
      gsap.fromTo($$(".person__body > *, .person__list li", panel), { autoAlpha: 0, x: 18 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out", stagger: 0.05, clearProps: "transform" });
    }
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (step) { e.preventDefault(); selectTab(tabs[(i + step + tabs.length) % tabs.length], true); }
      if (e.key === "Home") { e.preventDefault(); selectTab(tabs[0], true); }
      if (e.key === "End") { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
    });
  });

  /* ---------- Planting photos ---------- */
  const photos = [
    ["ct4-5", "Volunteers digging along the Columbia Tap Trail"], ["ct4-2", "Hauling mulch at Columbia Tap Planting #4"],
    ["ct4-7", "Volunteers potting and planting near the AIDS Memorial Garden"], ["ct4-3", "A newly planted tree on the trail"],
    ["ev02", "Volunteers gathered on the Columbia Tap Trail"], ["ev08", "Volunteers at Alief Planting #1"],
    ["ev10", "Planting a tree on an Alief esplanade"], ["ev05", "A volunteer carrying a tree to plant"],
    ["ev13", "Digging in at Alief"], ["ev01", "Rows of newly planted, mulched trees"],
    ["ev16", "Mulching young trees"], ["ev21", "Planting a sapling along the trail"],
    ["ev23", "Digging holes for new trees"], ["ev25", "Getting a tree ready to plant"],
    ["ev29", "Planting along a residential street"], ["ev31", "Volunteers at Columbia Tap Planting #3"],
    ["ev34", "Planting along S. Dairy Ashford"], ["ev37", "Volunteers in safety vests planting trees"],
    ["ev14", "Tree Care Day on the Columbia Tap Trail"], ["ev17", "Preparing planting beds"],
    ["ev09", "Newly mulched trees along the trail"], ["home2", "Planting a young tree"],
    ["ev03", "Saplings waiting to be planted"], ["ev04", "Watering a new tree"],
    ["ev06", "A young tree, planted and mulched"], ["ev07", "Juliette Oudinot at a planting"],
    ["ev11", "Native saplings ready for planting"], ["ev12", "A newly planted tree along the trail"],
    ["ev15", "Spreading mulch at the Tree Care Day"], ["ev18", "Planting along the trail"],
    ["ev19", "Tree Care Day volunteers"], ["ev20", "A new tree on the Columbia Tap Trail"],
    ["ev22", "Hands in the soil"], ["ev24", "Breaking ground for a new tree"],
    ["ev26", "Trees ready to be planted"], ["ev27", "Hauling mulch along the trail"],
    ["ev28", "A freshly planted tree"], ["ev30", "Planting together"],
    ["ev32", "Planting beside the trail"], ["ev33", "New trees on S. Dairy Ashford"],
    ["ev35", "Volunteers on the Alief esplanade"], ["ev36", "A newly shaded median in Alief"],
    ["ev40", "A tree freshly mulched"], ["home3", "New saplings, mulched and watered"],
    ["partnerbanner", "A row of newly planted trees"],
    ["ct4-1", "Digging a hole for a new tree"], ["ct4-6", "Volunteers digging in at the trail"],
    ["ct4-8", "Established trees ready to plant"], ["ct4-4", "The Columbia Tap Rail to Trail sign"],
  ];
  const photoButton = ([name, alt], duplicate) => {
    const b = document.createElement("button");
    b.type = "button";
    if (duplicate) { b.tabIndex = -1; b.setAttribute("aria-hidden", "true"); } // loop copy
    else b.setAttribute("aria-label", `View photo: ${alt}`);
    b.innerHTML = `<img src="assets/img/${name}.jpg" alt="${duplicate ? "" : alt}" data-alt="${alt}" loading="lazy">`;
    return b;
  };

  // Three strips sliding across the screen, alternating direction.
  // Each set is doubled so the loop is seamless.
  const strips = $("#photoStrips");
  if (strips) {
    const rows = 3;
    const per = Math.ceil(photos.length / rows);
    for (let i = 0; i < rows; i++) {
      const set = photos.slice(i * per, (i + 1) * per);
      const row = document.createElement("div");
      row.className = "strip" + (i % 2 ? " strip--rev" : "");
      row.style.animationDuration = `${70 + i * 12}s`;
      set.forEach((p) => row.appendChild(photoButton(p, false)));
      set.forEach((p) => row.appendChild(photoButton(p, true)));
      strips.appendChild(row);
    }
    // Load every strip photo once the section is near, so no blank tile slides into view
    const eager = new IntersectionObserver((entries, obs) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      $$("img", strips).forEach((img) => { img.loading = "eager"; });
      obs.disconnect();
    }, { rootMargin: "1200px 0px" });
    eager.observe(strips);
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
    const btn = e.target.closest(".strip button");
    const img = btn ? $("img", btn) : e.target.closest(".event__media img");
    if (img) openLightbox(img.currentSrc || img.src, img.dataset.alt || img.alt);
  });

  /* ---------- Animation (GSAP) ---------- */
  function countUp(el, to) {
    const obj = { v: 0 };
    gsap.to(obj, { v: to, duration: to > 100 ? 2 : 1.4, ease: "power3.out", onUpdate: () => { el.textContent = fmt(obj.v); } });
  }

  function initMotion() {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger || reduceMotion) return;
    gsap.registerPlugin(ScrollTrigger);

    // Smooth scroll (mouse/trackpad only)
    if (window.Lenis && !matchMedia("(pointer: coarse)").matches) {
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        const target = id.length > 1 && document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: id === "#top" ? 0 : -navHeight(), duration: 1.2 });
      }));
    }

    // Hero intro
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .from("[data-hero-line]", { yPercent: 115, duration: 1.3, stagger: 0.1 }, 0.15)
      .from("[data-hero]", { y: 20, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, 0.4);

    // Hero video slowly drifts as you scroll away
    // Hero video drifts down slightly as you scroll away. Translate only (no scale), and at most
    // 5% of its height: it is 112% tall with 6% overflow each side, so no gap can open at the top.
    gsap.to(".hero .vbg__video", { yPercent: 5, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.4 } });

    // Reveal on scroll. clearProps afterwards so CSS :hover transforms work again.
    gsap.set("[data-reveal]", { autoAlpha: 0, y: 36 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 90%", once: true,
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.1, overwrite: true, clearProps: "transform,opacity,visibility" }),
    });

    // Groups that come in one item at a time
    [[".logos", "li"], [".shelf", "li"], [".mini-stats", "li"], [".stats", ".stat"], [".person__list", "li"]].forEach(([parent, child]) => {
      $$(parent).forEach((p) => {
        gsap.from($$(child, p), {
          autoAlpha: 0, y: 26, duration: 0.8, ease: "power3.out", stagger: 0.07, clearProps: "transform,opacity,visibility",
          scrollTrigger: { trigger: p, start: "top 88%", once: true },
        });
      });
    });

    // Photos wipe open as they enter
    $$(".goal-item__img, .event__media img, .person__photo img, .source > img").forEach((el) => {
      gsap.from(el, {
        clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "expo.out", clearProps: "clipPath",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    // Gentle parallax inside the goal photos
    $$(".goal-item__img img").forEach((img) => {
      gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Background videos drift slightly slower than the page
    $$("section:not(.hero) .vbg__video").forEach((v) => {
      gsap.fromTo(v, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: v.closest("section"), start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Timeline: the line fills as you scroll and each dot lights up as its event arrives
    const tl = $(".timeline");
    if (tl) {
      ScrollTrigger.create({
        trigger: tl, start: "top 65%", end: "bottom 65%", scrub: true,
        onUpdate: (self) => tl.style.setProperty("--tl", self.progress.toFixed(4)),
      });
      $$(".event", tl).forEach((evEl) => {
        ScrollTrigger.create({ trigger: evEl, start: "top 65%", onEnter: () => evEl.classList.add("is-in"), onLeaveBack: () => evEl.classList.remove("is-in") });
        const small = $(".event__media img:last-child", evEl);
        // Parallax via a CSS variable so it combines with the CSS hover tilt
        gsap.fromTo(small, { "--py": "36px" }, { "--py": "-24px", ease: "none", scrollTrigger: { trigger: evEl, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }

    // Count-up numbers
    $$("[data-count]").forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: "top 92%", once: true,
        onEnter: () => {
          el.dataset.seen = "1";
          const to = Number(el.dataset.count);
          if (Number.isFinite(to)) countUp(el, to);
        },
      });
    });

    // Progress bars
    gsap.from(".target__fill", { scaleX: 0, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: ".target", start: "top 88%", once: true } });
    gsap.from(".bars__fill", { scaleX: 0, duration: 1.2, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: ".bars", start: "top 88%", once: true } });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  initMotion();
})();
