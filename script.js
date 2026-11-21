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

  /* ---------------- coding-themed 3D background ---------------- */
  (function initCode3D() {
    const canvas = document.getElementById("bg-3d");
    if (!canvas) return;
    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;

    let w = 1, h = 1, dpr = 1;
    let rafId = 0, last = 0, elapsed = 0;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

    const TOKENS = [
      "{ }", "</>", "=>", "const", "AI", "101", "λ", ";", "()", "[]",
      "!=", "&&", "return", "import", "git", "0x", "#", "class", "async",
      "</div>", "fn", "01", "->", "true", "while", "null"
    ];
    const tokens = TOKENS.map((text, i) => ({
      text: text,
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 1.8 - 1.2,
      phase: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 0.18,
      tint: i % 3
    }));

    // very faint character streams deep in the background
    const GLYPHS = "01{}<>/[]=;+*#";
    const streams = [];
    for (let i = 0; i < 5; i++) {
      streams.push({
        x: (i + 0.5) / 5 + (Math.random() - 0.5) * 0.08,
        speed: 22 + Math.random() * 20,
        len: 7 + Math.floor(Math.random() * 6),
        offset: Math.random() * 600
      });
    }

    const palette = () => root.dataset.theme === "light"
      ? [[12, 140, 105], [37, 99, 235], [147, 51, 234]]
      : [[79, 209, 165], [91, 156, 255], [192, 132, 252]];
    const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const pal = palette();
      const spread = Math.min(w, h) * 0.58;
      const cx = w / 2, cy = h / 2;

      // deep code streams
      ctx.font = "500 12px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < streams.length; i++) {
        const st = streams[i];
        const col = pal[i % 2];
        for (let k = 0; k < st.len; k++) {
          const y = ((st.offset + elapsed * st.speed + k * 24) % (h + 240)) - 120;
          const ch = GLYPHS[(k + i * 3 + Math.floor(elapsed * 1.5)) % GLYPHS.length];
          ctx.fillStyle = rgba(col, 0.025 + (k / st.len) * 0.045);
          ctx.fillText(ch, st.x * w, y);
        }
      }

      // floating syntax tokens at different depths
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const wy = t.y - elapsed * 0.012 + Math.sin(elapsed * 0.3 + t.phase) * 0.035;
        const y = wy < -1.3 ? 1.3 : wy;
        const depth = (t.z + 1.2) / 1.8;
        const persp = 3.4 / (3.4 - t.z);
        const x = cx + t.x * spread * persp + ptr.x * (12 + depth * 22);
        const py = cy + y * spread * persp + ptr.y * (8 + depth * 16);
        const size = Math.max(11, (11 + depth * 14) * persp);
        ctx.save();
        ctx.translate(x, py);
        ctx.rotate(t.tilt + Math.sin(elapsed * 0.5 + t.phase) * 0.06);
        ctx.font = "500 " + size.toFixed(1) + "px 'JetBrains Mono', ui-monospace, monospace";
        ctx.fillStyle = rgba(pal[t.tint], 0.08 + depth * 0.24);
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
      }
    };

    const frame = (time) => {
      if (!rafId) return;
      const dt = last ? Math.min((time - last) / 1000, 0.05) : 0.016;
      last = time;
      elapsed += dt;
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        t.z += dt * 0.02;
        if (t.z > 0.6) {
          t.z = -1.2;
          t.x = Math.random() * 2 - 1;
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
    if (!reduceMotion) { draw(); start(); }
    else if ("MutationObserver" in window) {
      new MutationObserver(() => draw()).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    }
  })();

  /* ---------------- subtle 3D tilt on cards ---------------- */
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
