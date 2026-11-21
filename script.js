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

  /* ---------------- floating 3D shapes background ---------------- */
  (function initShapes3D() {
    const canvas = document.getElementById("bg-3d");
    if (!canvas) return;
    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;

    let w = 1, h = 1, dpr = 1;
    let rafId = 0, last = 0, elapsed = 0;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

    // flat-edged wireframe solids — deliberately no spheres or globes
    const cubeV = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
    const cubeE = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    const octV = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    const octE = [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]];
    const tetV = [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];
    const tetE = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
    const ringV = [], ringE = [];
    for (let i = 0; i < 40; i++) {
      const a = (Math.PI * 2 * i) / 40;
      ringV.push([Math.cos(a), Math.sin(a), 0]);
      ringE.push([i, (i + 1) % 40]);
    }
    const GEOM = {
      cube: { v: cubeV, e: cubeE },
      octa: { v: octV, e: octE },
      tetra: { v: tetV, e: tetE },
      ring: { v: ringV, e: ringE }
    };

    const shapes = [
      { g: "ring",  x: -0.82, y: -0.62, z: -0.85, s: 0.30, spin: [0.10, 0.16, 0.04], tint: 0, phase: 0.0 },
      { g: "cube",  x:  0.86, y: -0.45, z: -0.35, s: 0.26, spin: [0.08, 0.13, 0.05], tint: 1, phase: 1.3 },
      { g: "octa",  x: -0.88, y:  0.58, z:  0.15, s: 0.30, spin: [0.15, 0.09, 0.03], tint: 2, phase: 2.6 },
      { g: "ring",  x:  0.78, y:  0.66, z: -0.70, s: 0.36, spin: [0.07, 0.14, 0.05], tint: 0, phase: 3.8 },
      { g: "tetra", x:  0.10, y: -0.92, z: -1.00, s: 0.24, spin: [0.12, 0.19, 0.04], tint: 1, phase: 5.0 },
      { g: "cube",  x:  0.02, y:  0.94, z: -0.90, s: 0.22, spin: [0.09, 0.11, 0.06], tint: 2, phase: 0.7 }
    ];
    shapes.forEach((sh) => { sh.rx = sh.phase; sh.ry = sh.phase * 0.7; sh.rz = 0; });

    const palette = () => root.dataset.theme === "light"
      ? [[12, 140, 105], [37, 99, 235], [147, 51, 234]]
      : [[79, 209, 165], [91, 156, 255], [192, 132, 252]];
    const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";

    const rotate = (p, rx, ry, rz) => {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const y1 = p[1] * cx - p[2] * sx, z1 = p[1] * sx + p[2] * cx;
      const cy = Math.cos(ry), sy = Math.sin(ry);
      const x2 = p[0] * cy + z1 * sy, z2 = -p[0] * sy + z1 * cy;
      const cz = Math.cos(rz), sz = Math.sin(rz);
      return [x2 * cz - y1 * sz, x2 * sz + y1 * cz, z2];
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const pal = palette();
      const spread = Math.min(w, h) * 0.6;
      const light = root.dataset.theme === "light";

      for (let i = 0; i < shapes.length; i++) {
        const sh = shapes[i];
        const depth = (sh.z + 1) / 2;
        const baseAlpha = light ? 0.08 + depth * 0.13 : 0.09 + depth * 0.15;
        const px = sh.x + Math.sin(elapsed * 0.16 + sh.phase) * 0.035;
        const py = sh.y + Math.cos(elapsed * 0.13 + sh.phase) * 0.045;
        const par = 0.35 + depth * 0.65;
        const ox = ptr.x * 22 * par;
        const oy = ptr.y * 16 * par;
        const geom = GEOM[sh.g];
        const projected = [];

        for (let k = 0; k < geom.v.length; k++) {
          const q = rotate(geom.v[k], sh.rx, sh.ry, sh.rz);
          const wx = px + q[0] * sh.s;
          const wy = py + q[1] * sh.s;
          const wz = sh.z + q[2] * sh.s * 0.5;
          const persp = 4 / (4 - wz);
          projected.push({
            x: w / 2 + wx * spread * persp + ox,
            y: h / 2 + wy * spread * persp + oy,
            d: (q[2] + 1) / 2
          });
        }

        const col = pal[sh.tint];
        ctx.lineWidth = 1;
        for (let k = 0; k < geom.e.length; k++) {
          const a = projected[geom.e[k][0]], b = projected[geom.e[k][1]];
          ctx.strokeStyle = rgba(col, baseAlpha * (0.55 + a.d * 0.65));
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        if (depth > 0.25) {
          ctx.fillStyle = rgba(col, baseAlpha * 1.4);
          for (let k = 0; k < projected.length; k += 2) {
            const v = projected[k];
            ctx.beginPath();
            ctx.arc(v.x, v.y, 1 + v.d, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };

    const frame = (time) => {
      if (!rafId) return;
      const dt = last ? Math.min((time - last) / 1000, 0.05) : 0.016;
      last = time;
      elapsed += dt;
      for (let i = 0; i < shapes.length; i++) {
        const sh = shapes[i];
        sh.rx += dt * sh.spin[0];
        sh.ry += dt * sh.spin[1];
        sh.rz += dt * sh.spin[2];
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
