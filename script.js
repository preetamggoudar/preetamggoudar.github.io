/* =========================================================
   Portfolio interactions + interactive shell
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  /* ---------------- theme ---------------- */
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeLabel = document.getElementById("theme-label");
  let savedTheme = "dark";
  try { savedTheme = localStorage.getItem("portfolio-theme") || "dark"; } catch (e) {}
  if (savedTheme !== "light" && savedTheme !== "dark") savedTheme = "dark";

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (themeIcon) themeIcon.textContent = theme === "dark" ? "☾" : "☀";
    if (themeLabel) themeLabel.textContent = theme === "dark" ? "Dark" : "Light";
    if (themeToggle) themeToggle.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " theme");
    try { localStorage.setItem("portfolio-theme", theme); } catch (e) {}
  };
  applyTheme(savedTheme);
  if (themeToggle) {
    themeToggle.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark"));
  }

  /* ---------------- scroll progress + active nav ---------------- */
  const progress = document.getElementById("scroll-progress");
  const navLinks = document.querySelectorAll("#primary-nav a");
  const sections = document.querySelectorAll("main section[id]");
  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    let current = "";
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= 170) current = s.id; });
    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------------- mobile nav ---------------- */
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("primary-nav");
  const closeNav = () => {
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
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
  }

  /* ---------------- reveal ---------------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    reveals.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 70 + "ms"; io.observe(el); });
  }

  /* ---------------- animated 3D particle background ---------------- */
  (function initBackground3D() {
    const canvas = document.getElementById("bg-3d");
    if (!canvas) return;
    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;

    let w = 1, h = 1, dpr = 1;
    let rafId = 0, last = 0, elapsed = 0;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

    const COUNT = 82, LINK = 0.52, CAM = 3.4;
    const particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2.6 - 1.3,
        tint: Math.random(),
        phase: Math.random() * Math.PI * 2
      });
    }

    const palette = () => root.dataset.theme === "light"
      ? [[12, 140, 105], [37, 99, 235], [147, 51, 234]]
      : [[79, 209, 165], [91, 156, 255], [192, 132, 252]];
    const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const pal = palette();
      const cx = w * 0.5 + ptr.x * 26;
      const cy = h * 0.5 + ptr.y * 18;
      const spread = Math.max(w, h) * 0.4;
      const pts = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const s = CAM / (CAM - p.z);
        const wy = p.y + Math.sin(elapsed * 0.5 + p.phase) * 0.035;
        pts.push({
          x: cx + p.x * spread * s,
          y: cy + wy * spread * s,
          wx: p.x, wy: wy, wz: p.z,
          c: pal[p.tint < 0.55 ? 0 : p.tint < 0.85 ? 1 : 2]
        });
      }

      // constellation links in 3D space
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.wx - b.wx, dy = a.wy - b.wy, dz = a.wz - b.wz;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > LINK * LINK) continue;
          const depth = (a.wz + b.wz + 2.6) / 5.2;
          const alpha = (1 - Math.sqrt(d2) / LINK) * (0.05 + depth * 0.13);
          ctx.strokeStyle = rgba(a.c, alpha);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // depth-scaled points
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const depth = (p.wz + 1.3) / 2.6;
        ctx.fillStyle = rgba(p.c, 0.14 + depth * 0.42);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.7 + depth * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (time) => {
      if (!rafId) return;
      const dt = last ? Math.min((time - last) / 1000, 0.05) : 0.016;
      last = time;
      elapsed += dt;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.z += dt * 0.1;
        if (p.z > 1.3) {
          p.z = -1.3;
          p.x = Math.random() * 2 - 1;
          p.y = Math.random() * 2 - 1;
          p.phase = Math.random() * Math.PI * 2;
        }
      }
      ptr.x += (ptr.tx - ptr.x) * 0.04;
      ptr.y += (ptr.ty - ptr.y) * 0.04;
      draw();
      rafId = requestAnimationFrame(frame);
    };
    const start = () => { if (!rafId && !reduceMotion) { last = 0; rafId = requestAnimationFrame(frame); } };
    const stop = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0; };

    const resize = () => {
      w = Math.max(window.innerWidth, 1);
      h = Math.max(window.innerHeight, 1);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduceMotion) draw();
    };

    window.addEventListener("pointermove", (e) => {
      ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });

    resize();
    if (!reduceMotion) {
      draw();
      start();
    } else if ("MutationObserver" in window) {
      new MutationObserver(() => draw()).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    }
  })();

  /* ---------------- animated 3D hero core ---------------- */
  (function initHero3D() {
    const canvas = document.getElementById("hero-3d");
    const hero = document.getElementById("home");
    if (!canvas || !hero) return;
    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;

    let width = 1, height = 1, dpr = 1;
    let running = false, rafId = 0, last = 0, spin = 0;
    let visible = true;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

    // build a unit sphere: latitude rings + meridians + intersection nodes
    const LAT = 7, LON = 14, SEG = 32;
    const lines = [];
    const nodes = [];
    for (let i = 1; i < LAT; i++) {
      const phi = -Math.PI / 2 + (Math.PI * i) / LAT;
      const cp = Math.cos(phi), y = Math.sin(phi);
      const ring = [];
      for (let j = 0; j <= SEG; j++) {
        const th = (Math.PI * 2 * j) / SEG;
        ring.push([cp * Math.cos(th), y, cp * Math.sin(th)]);
      }
      lines.push(ring);
      for (let j = 0; j < LON; j++) {
        const th = (Math.PI * 2 * j) / LON;
        nodes.push([cp * Math.cos(th), y, cp * Math.sin(th)]);
      }
    }
    for (let i = 0; i < LON; i++) {
      const th = (Math.PI * 2 * i) / LON;
      const ring = [];
      for (let j = 0; j <= SEG; j++) {
        const phi = -Math.PI / 2 + (Math.PI * j) / SEG;
        const cp = Math.cos(phi);
        ring.push([cp * Math.cos(th), Math.sin(phi), cp * Math.sin(th)]);
      }
      lines.push(ring);
    }

    const rotate = (p, ax, ay) => {
      const cy = Math.cos(ay), sy = Math.sin(ay);
      const x1 = p[0] * cy + p[2] * sy;
      const z1 = -p[0] * sy + p[2] * cy;
      const cx = Math.cos(ax), sx = Math.sin(ax);
      return [x1, p[1] * cx - z1 * sx, p[1] * sx + z1 * cx];
    };

    const colors = () => root.dataset.theme === "light"
      ? { a: [12, 140, 105], b: [37, 99, 235], c: [147, 51, 234] }
      : { a: [79, 209, 165], b: [91, 156, 255], c: [192, 132, 252] };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width * 0.5;
      const cy = height * 0.44;
      const r = Math.min(width * 0.36, height * 0.52, 400);
      const camZ = r * 3.2;
      const ax = 0.35 + ptr.y * 0.35 + Math.sin(spin * 0.6) * 0.08;
      const ay = spin + ptr.x * 0.5;
      const pal = colors();
      const light = root.dataset.theme === "light";
      const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";
      const proj = (p) => {
        const q = rotate(p, ax, ay);
        const s = camZ / (camZ - q[2] * r);
        return { x: cx + q[0] * r * s, y: cy + q[1] * r * s, z: q[2] };
      };

      // soft halo behind the core
      const halo = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.35);
      halo.addColorStop(0, rgba(pal.b, light ? 0.06 : 0.10));
      halo.addColorStop(0.6, rgba(pal.a, 0.035));
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // wireframe with depth-based opacity
      ctx.lineWidth = 1;
      for (let li = 0; li < lines.length; li++) {
        const ring = lines[li];
        const col = li < LAT - 1 ? pal.a : pal.b;
        let prev = proj(ring[0]);
        for (let k = 1; k < ring.length; k++) {
          const cur = proj(ring[k]);
          const t = ((prev.z + cur.z) * 0.5 + 1) * 0.5;
          ctx.strokeStyle = rgba(col, 0.05 + t * t * 0.20);
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(cur.x, cur.y);
          ctx.stroke();
          prev = cur;
        }
      }

      // intersection nodes on the visible half
      for (let i = 0; i < nodes.length; i++) {
        const p = proj(nodes[i]);
        if (p.z < -0.35) continue;
        const t = (p.z + 1) * 0.5;
        ctx.fillStyle = rgba(pal.c, 0.08 + t * 0.28);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.7 + t * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // a glowing particle orbiting the sphere
      const oa = spin * 1.5;
      const orbit = proj([Math.cos(oa) * 1.18, Math.sin(oa * 1.3) * 0.42, Math.sin(oa) * 1.18]);
      const glow = ctx.createRadialGradient(orbit.x, orbit.y, 0, orbit.x, orbit.y, 16);
      glow.addColorStop(0, rgba(pal.c, 0.9));
      glow.addColorStop(0.35, rgba(pal.c, 0.35));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(orbit.x, orbit.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(pal.c, 0.95);
      ctx.beginPath();
      ctx.arc(orbit.x, orbit.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (time) => {
      if (!running) return;
      const dt = last ? Math.min((time - last) / 1000, 0.05) : 0.016;
      last = time;
      spin += dt * 0.32;
      ptr.x += (ptr.tx - ptr.x) * 0.05;
      ptr.y += (ptr.ty - ptr.y) * 0.05;
      draw();
      rafId = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || reduceMotion) return;
      running = true; last = 0;
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduceMotion) draw();
    };

    hero.addEventListener("pointermove", (e) => {
      const rect = hero.getBoundingClientRect();
      ptr.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ptr.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { ptr.tx = 0; ptr.ty = 0; });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (visible) start();
    });

    resize();
    if (!reduceMotion) {
      // paint an immediate first frame, then animate; the observer only pauses when scrolled away
      draw();
      start();
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          visible = entries[0].isIntersecting;
          if (visible && !document.hidden) start(); else stop();
        }, { threshold: 0 });
        io.observe(hero);
      }
    } else if ("MutationObserver" in window) {
      // keep the static frame in sync when the theme changes
      new MutationObserver(() => draw()).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    }

    /* subtle 3D tilt on cards */
    if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll(".skill-card, .project-card, .fact-card, .education-card").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transition = "transform .1s ease-out";
          card.style.transform = "perspective(800px) rotateX(" + (-py * 7).toFixed(2) + "deg) rotateY(" + (px * 9).toFixed(2) + "deg) translateY(-3px)";
        });
        card.addEventListener("pointerleave", () => {
          card.style.transition = "";
          card.style.transform = "";
        });
      });
    }
  })();

  /* ---------------- terminal ---------------- */
  const output = document.getElementById("term-output");
  const form = document.getElementById("term-form");
  const input = document.getElementById("term-input");
  if (!output || !form || !input) return;

  const addLine = (text, muted) => {
    const div = document.createElement("div");
    div.className = "line" + (muted ? " muted" : "");
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  };

  const addEcho = (cmd) => {
    const div = document.createElement("div");
    div.className = "line";
    const p = document.createElement("span");
    p.className = "prompt";
    p.textContent = "$ ";
    div.appendChild(p);
    div.appendChild(document.createTextNode(cmd));
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  };

  const addLink = (label, url) => {
    const div = document.createElement("div");
    div.className = "line";
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "prompt";
    a.textContent = label + " → " + url;
    div.appendChild(a);
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  };

  const HELP = [
    "about       — short introduction",
    "skills      — skill groups",
    "experience  — recent roles and achievements",
    "education   — academic background",
    "projects    — selected work",
    "contact     — ways to reach me",
    "open <name> — jump to a section",
    "ls          — list sections",
    "theme dark|light — switch appearance",
    "date        — current date",
    "clear       — clear this output"
  ];

  const SECTIONS = ["home", "about", "skills", "experience", "education", "projects", "contact"];

  const commands = {
    help: () => { addLine("Available commands:"); HELP.forEach((l) => addLine("  " + l, true)); },
    whoami: () => {
      addLine("Preetam Goudar");
      addLine("Computer Science (AI & ML) student · Google Student Ambassador 2026", true);
      addLine("Bengaluru, India · Building practical AI systems.", true);
    },
    about: () => {
      addLine("I'm Preetam, a CS student specialising in AI & ML at Shri Siddhartha");
      addLine("Institute of Technology in collaboration with upGrad School of Technology", true);
      addLine("(Batch 2026–2030). I learn by shipping, care about community, and enjoy", true);
      addLine("turning model experiments into things people can actually use.", true);
    },
    skills: () => {
      addLine("ai_ml        — Generative AI, Machine Learning, Deep Learning, Prompt Engineering, RAG, Computer Vision", true);
      addLine("models_tools — Gemma, Gemini, LoRA Fine-tuning, Hugging Face, Gradio, Google AI Studio, Git & GitHub", true);
      addLine("web_build    — AI Web Development, Web Development, HTML/CSS, JavaScript, Python, SQL, Open Source", true);
      addLine("core_cs      — Data Structures, Algorithms, OOP, DBMS, Problem Solving", true);
      addLine("leadership   — Leadership, Entrepreneurship, Community Building, Public Speaking, Mentoring, Teamwork");
    },
    experience: () => {
      addLine("Google Student Ambassador — Google Student Ambassadors (India), 2026–Present", true);
      addLine("1st place, Hack Day — Team SnakeByte, ₹7,000 prize, Oct 2026");
      addLine("Smart India Hackathon 2026 — upGrad School of Technology", true);
      addLine("Run `open experience` for the full timeline.", true);
    },
    education: () => {
      addLine("B.E. Computer Science (AI & ML), 2026–2030");
      addLine("Shri Siddhartha Institute of Technology", true);
      addLine("In collaboration with upGrad School of Technology", true);
    },
    projects: () => {
      addLine("campusclaim/ — featured team project", true);
      addLine("Receipt-to-reimbursement assistant with Gemma 4 vision fine-tuning.");
      addLine("experiments/ — ongoing open-source work", true);
      addLine("Run `open projects` to browse the projects section.", true);
    },
    contact: () => {
      addLine("Reach me here:");
      addLink("LinkedIn", "https://www.linkedin.com/in/preetam-goudar-181174324");
      addLink("GitHub", "https://github.com/preetamggoudar");
    },
    ls: () => {
      addLine(SECTIONS.map((s) => s + "/").join("   "));
      addLine("Use `open <name>` to navigate.", true);
    },
    date: () => addLine(new Date().toString(), true),
    echo: (args) => addLine(args.join(" ")),
    clear: () => { output.textContent = ""; }
  };

  const run = (raw) => {
    const cmd = raw.trim();
    if (!cmd) return;
    addEcho(cmd);
    const [name, ...args] = cmd.split(/\s+/);
    const key = name.toLowerCase();

    if (key === "open") {
      const target = (args[0] || "").toLowerCase();
      if (SECTIONS.includes(target)) {
        addLine("Opening " + target + " …");
        document.getElementById(target)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      } else {
        addLine("open: no such section: " + (args[0] || "(missing)"), true);
        addLine("Valid sections: " + SECTIONS.join(", "), true);
      }
      return;
    }

    if (key === "theme") {
      const theme = (args[0] || "").toLowerCase();
      if (theme === "dark" || theme === "light") {
        applyTheme(theme);
        addLine("Appearance set to " + theme + ".");
      } else {
        addLine("Usage: theme dark | light", true);
      }
      return;
    }

    if (Object.prototype.hasOwnProperty.call(commands, key)) {
      commands[key](args);
    } else {
      addLine(name + ": command not found", true);
      addLine("Type `help` to see available commands.", true);
    }
  };

  const history = [];
  let historyIndex = 0;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value;
    if (!value.trim()) return;
    history.push(value.trim());
    historyIndex = history.length;
    run(value);
    input.value = "";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && historyIndex > 0) { e.preventDefault(); input.value = history[--historyIndex]; }
    else if (e.key === "ArrowDown" && historyIndex < history.length) { e.preventDefault(); input.value = history[++historyIndex] || ""; }
    else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); output.textContent = ""; }
  });
  document.querySelectorAll(".console-quick button").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = btn.dataset.cmd;
      form.requestSubmit();
      input.focus();
    });
  });

  /* ---------------- footer year ---------------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
