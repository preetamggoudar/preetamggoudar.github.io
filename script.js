/* ---------------------------------------------
   Portfolio interactions
--------------------------------------------- */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- rotating role text --- */
  const typed = document.getElementById("typed");
  const roles = [
    "aspiring AI engineer",
    "generative AI builder",
    "AI web developer",
    "community leader"
  ];

  if (typed && !reduceMotion) {
    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      const current = roles[roleIndex];
      charIndex += deleting ? -1 : 1;
      typed.textContent = current.slice(0, charIndex);

      let delay = deleting ? 45 : 85;
      if (!deleting && charIndex === current.length) {
        deleting = true;
        delay = 1900;
      } else if (deleting && charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        delay = 350;
      }
      window.setTimeout(tick, delay);
    };
    window.setTimeout(tick, 900);
  }

  /* --- scroll reveal --- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      observer.observe(el);
    });
  }

  /* --- mobile menu --- */
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("primary-nav");
  const closeMenu = () => {
    if (!nav || !toggle) return;
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  };
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("open");
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }

  /* --- active nav link on scroll --- */
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = nav ? nav.querySelectorAll('a[href^="#"]') : [];
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* --- stat count-up --- */
  if (!reduceMotion) {
    const counters = document.querySelectorAll("[data-count]");
    if ("IntersectionObserver" in window && counters.length) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || "";
            if (Number.isNaN(target)) return;
            const start = performance.now();
            const duration = 1200;
            const animate = (now) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              el.textContent = Math.round(target * eased).toLocaleString("en-IN") + suffix;
              if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
            counterObserver.unobserve(el);
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => counterObserver.observe(el));
    }
  }

  /* --- footer year --- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
