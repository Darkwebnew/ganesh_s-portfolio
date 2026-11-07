(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  function startPage() {
    root.classList.add("ready");
    body.classList.remove("is-loading");
    var pre = document.getElementById("preloader");
    if (pre) pre.classList.add("done");
    try { sessionStorage.setItem("gs-seen", "1"); } catch (e) {}
  }

  if (root.classList.contains("no-preload") || reduceMotion) {
    startPage();
  } else {
    body.classList.add("is-loading");
    var started = false;
    var go = function () { if (!started) { started = true; startPage(); } };
    var minTime = new Promise(function (r) { setTimeout(r, 800); });
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([minTime, fonts]).then(go);
    setTimeout(go, 1600);
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Theme ---------- */
  var themeToggle = document.getElementById("themeToggle");
  function applyThemeIcon() {
    if (!themeToggle) return;
    var light = root.getAttribute("data-theme") === "light";
    themeToggle.innerHTML = light
      ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
    themeToggle.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", light ? "#FAFAFB" : "#08080A");
  }
  applyThemeIcon();
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("portfolio-theme", next); } catch (e) {}
      applyThemeIcon();
    });
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");
  function setMenu(open) {
    if (!navToggle || !navMenu) return;
    navMenu.classList.toggle("open", open);
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  }
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () { setMenu(!navMenu.classList.contains("open")); });
    navMenu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    document.addEventListener("click", function (e) {
      if (navMenu.classList.contains("open") && !e.target.closest(".navbar")) setMenu(false);
    });
  }

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  window.addEventListener("load", function () {
    if (!window.Lenis || reduceMotion || !finePointer) return;
    lenis = new window.Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    lenis.on("scroll", onScroll);
  });

  /* ---------- Anchor Links (Works on Desktop & Mobile) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href");
      
      // Handle Back to Top specifically
      if (href === "#top" || href === "#home" || href === "#" || a.classList.contains("back-to-top")) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }

      // Handle section links
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -80, duration: 1.2 });
        } else {
          target.scrollIntoView({ behavior: "smooth" });
        }
        history.replaceState(null, "", href);
      }
    });
  });

  /* ---------- Scroll progress + header ---------- */
  var header = document.querySelector(".site-header");
  var fill = document.getElementById("scrollFill");
  var ticking = false;
  function updateScroll() {
    ticking = false;
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (fill) fill.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    if (header) header.classList.toggle("scrolled", y > 30);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateScroll();

  /* ---------- Reveal ---------- */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal").forEach(function (el) {
    var siblings = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains("reveal"); }) : [el];
    var i = siblings.indexOf(el);
    el.style.setProperty("--d", Math.min(i, 4) * 80 + "ms");
    revealObs.observe(el);
  });

  /* ---------- Active nav link ---------- */
  var links = document.querySelectorAll(".nav-menu a");
  var sectionObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      links.forEach(function (l) { l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id); });
    });
  }, { rootMargin: "-40% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach(function (s) { sectionObs.observe(s); });

  /* ---------- Counters ---------- */
  function runCounter(el) {
    var target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    var start = performance.now();
    var duration = 1500;
    (function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  var counters = document.querySelectorAll("[data-count]");
  counters.forEach(function (el) { if (!reduceMotion) el.textContent = "0"; });
  var statsBox = document.querySelector(".hero-stats");
  if (statsBox && counters.length) {
    var counterObs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      counterObs.disconnect();
      setTimeout(function () { counters.forEach(runCounter); }, 400);
    }, { threshold: 0.2 });
    counterObs.observe(statsBox);
  }

  /* ---------- Marquee clone ---------- */
  document.querySelectorAll("[data-marquee]").forEach(function (track) {
    var original = Array.prototype.slice.call(track.children);
    if (!original.length) return;
    var guard = 0;
    while (track.scrollWidth < window.innerWidth * 1.2 && guard < 6) {
      original.forEach(function (n) { track.appendChild(n.cloneNode(true)); });
      guard++;
    }
    Array.prototype.slice.call(track.children).forEach(function (n) {
      track.appendChild(n.cloneNode(true));
    });
  });

  /* ---------- Cursor ring + magnet buttons ---------- */
  if (finePointer && !reduceMotion) {
    var ring = document.getElementById("cursorRing");
    if (ring) {
      var mx = -100, my = -100, rx = -100, ry = -100;
      document.addEventListener("mousemove", function (e) {
        mx = e.clientX; my = e.clientY;
        ring.classList.add("visible");
      }, { passive: true });
      document.addEventListener("mouseleave", function () { ring.classList.remove("visible"); });
      (function loop() {
        rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
        ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
        requestAnimationFrame(loop);
      })();
      document.querySelectorAll("a, button, summary, select, .project-card, .flip-card").forEach(function (el) {
        el.addEventListener("mouseenter", function () { ring.classList.add("hover"); });
        el.addEventListener("mouseleave", function () { ring.classList.remove("hover"); });
      });
    }

    document.querySelectorAll(".magnet").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + x * 0.1 + "px," + y * 0.1 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Flip cards: tap-to-flip on touch devices ---------- */
  if (coarsePointer) {
    document.querySelectorAll(".flip-card").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        card.classList.toggle("flipped");
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.classList.toggle("flipped");
        }
      });
    });
  }

  /* ---------- Smooth open/close for FAQ + experience details ---------- */
  if (!reduceMotion && Element.prototype.animate) {
    document.querySelectorAll(".faq-item, .exp-details").forEach(function (d) {
      var summary = d.querySelector("summary");
      if (!summary) return;
      var busy = false;
      summary.addEventListener("click", function (e) {
        e.preventDefault();
        if (busy) return;
        busy = true;
        var start = d.offsetHeight;
        d.style.overflow = "hidden";
        if (d.open) {
          var end = summary.offsetHeight + (d.offsetHeight - d.clientHeight);
          var a = d.animate({ height: [start + "px", end + "px"] }, { duration: 280, easing: "cubic-bezier(.16,1,.3,1)" });
          a.onfinish = function () { d.open = false; d.style.overflow = ""; busy = false; };
        } else {
          d.open = true;
          var full = d.offsetHeight;
          var b = d.animate({ height: [start + "px", full + "px"] }, { duration: 340, easing: "cubic-bezier(.16,1,.3,1)" });
          b.onfinish = function () { d.style.overflow = ""; busy = false; };
        }
      });
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");
  if (form && status) {
    if (form.fullName) {
      form.fullName.addEventListener("input", function () {
        this.value = this.value.replace(/[^A-Za-z\s\-']/g, "");
      });
    }

    var emailReady = false;
    function initEmail() {
      if (!emailReady && window.emailjs) {
        window.emailjs.init({ publicKey: "_IlupnzGymWLN63Oe" });
        emailReady = true;
      }
    }
    window.addEventListener("load", initEmail);

    function setStatus(text, kind) {
      status.textContent = text;
      status.className = "form-status" + (kind ? " " + kind : "");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fullName = form.fullName.value.trim();
      var workEmail = form.workEmail.value.trim();
      var reason = form.reason.value.trim();
      var message = form.message.value.trim();

      var nameRegex = /^[A-Za-z\s\-']{2,}$/;
      if (!fullName || !nameRegex.test(fullName)) {
        setStatus("Please enter a valid full name (letters only).", "err");
        form.fullName.focus();
        return;
      }

      var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!workEmail || !emailRegex.test(workEmail)) {
        setStatus("Please enter a valid email address.", "err");
        form.workEmail.focus();
        return;
      }

      if (!reason || !message) {
        setStatus("Please fill out all fields.", "err");
        return;
      }

      initEmail();
      if (!window.emailjs) {
        setStatus("The form couldn't load. Email directly instead.", "err");
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn.querySelector("span");
      btn.disabled = true;
      if (label) label.textContent = "Sending…";
      setStatus("");

      window.emailjs.sendForm("service_dol2vxp", "template_jketii5", form)
        .then(function () {
          form.reset();
          setStatus("Message sent. I'll reply soon.", "ok");
          if (label) label.textContent = "Message sent";
          setTimeout(function () { if (label) label.textContent = "Send Message"; }, 3000);
        })
        .catch(function (err) {
          console.error(err);
          setStatus("Message not sent. Please try again.", "err");
          if (label) label.textContent = "Send Message";
        })
        .finally(function () { btn.disabled = false; });
    });
  }
})();