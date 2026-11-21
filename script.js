/* =========================================================
   Portfolio interactions + interactive shell
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    const CAM = 3.4;

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
      tilt: (Math.random() - 0.5) * 0.16,
      flip: Math.random() * Math.PI * 2,
      flipSpeed: 0.25 + Math.random() * 0.45,
      tint: i % 3
    }));

    // translucent code-editor panels, slowly turning in perspective
    const panels = [
      { x: -0.98, y: -0.62, z: -0.55, w: 0.30, h: 0.21, rx: 0.18, ry: -0.55, rz: -0.06, spin: 0.16, tint: 0, phase: 0.0 },
      { x:  1.02, y: -0.30, z: -0.20, w: 0.27, h: 0.19, rx: -0.12, ry: 0.60, rz: 0.05, spin: -0.13, tint: 1, phase: 1.9 },
      { x: -0.92, y:  0.78, z: -0.75, w: 0.32, h: 0.22, rx: 0.10, ry: 0.35, rz: 0.08, spin: 0.11, tint: 2, phase: 3.4 },
      { x:  0.96, y:  0.86, z: -0.95, w: 0.26, h: 0.18, rx: -0.08, ry: -0.42, rz: -0.04, spin: 0.14, tint: 0, phase: 5.1 }
    ];
    panels.forEach((p, pi) => {
      p.lines = [];
      for (let k = 0; k < 6; k++) {
        p.lines.push(0.35 + ((k * 7 + pi * 3) % 10) / 14);
      }
    });

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

    const palette = () => [[79, 209, 165], [91, 156, 255], [192, 132, 252]];
    const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";

    const rotate = (p, rx, ry, rz) => {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const y1 = p[1] * cx - p[2] * sx, z1 = p[1] * sx + p[2] * cx;
      const cy = Math.cos(ry), sy = Math.sin(ry);
      const x2 = p[0] * cy + z1 * sy, z2 = -p[0] * sy + z1 * cy;
      const cz = Math.cos(rz), sz = Math.sin(rz);
      return [x2 * cz - y1 * sz, x2 * sz + y1 * cz, z2];
    };

    let cx = 1, cy = 1, spread = 1;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const pal = palette();
      spread = Math.min(w, h) * 0.58;
      cx = w / 2;
      cy = h / 2;
      const project = (wx, wy, wz) => {
        const s = CAM / (CAM - wz);
        return { x: cx + wx * spread * s, y: cy + wy * spread * s, s: s, z: wz };
      };

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
          ctx.fillStyle = rgba(col, 0.022 + (k / st.len) * 0.04);
          ctx.fillText(ch, st.x * w, y);
        }
      }

      // rotating code-editor panels in perspective
      for (let i = 0; i < panels.length; i++) {
        const p = panels[i];
        const depth = (p.z + 1.2) / 1.8;
        const par = 0.4 + depth * 0.85;
        const baseX = p.x + ptr.x * 0.05 * par;
        const baseY = p.y + ptr.y * 0.035 * par;
        const pw = p.w, ph = p.h;
        const rx = p.rx + Math.sin(elapsed * 0.28 + p.phase) * 0.14;
        const ry = p.ry + elapsed * p.spin;
        const rz = p.rz;
        const col = pal[p.tint];

        const corner = (lx, ly) => {
          const r = rotate([lx, ly, 0], rx, ry, rz);
          return project(baseX + r[0], baseY + r[1], p.z + r[2]);
        };
        const tl = corner(-pw, -ph), tr = corner(pw, -ph);
        const br = corner(pw, ph), bl = corner(-pw, ph);

        // front/back facing from projected winding
        const area = (tr.x - tl.x) * (bl.y - tl.y) - (bl.x - tl.x) * (tr.y - tl.y);
        const facing = area > 0 ? 1 : 0.55;

        // panel body
        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(bl.x, bl.y);
        ctx.closePath();
        ctx.fillStyle = rgba(col, 0.030 * facing + depth * 0.018);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(col, 0.10 * facing + depth * 0.05);
        ctx.stroke();

        // title bar
        const barH = ph * 0.28;
        const btl = corner(-pw, -ph), btr = corner(pw, -ph);
        const bbr = corner(pw, -ph + barH), bbl = corner(-pw, -ph + barH);
        ctx.beginPath();
        ctx.moveTo(btl.x, btl.y); ctx.lineTo(btr.x, btr.y);
        ctx.lineTo(bbr.x, bbr.y); ctx.lineTo(bbl.x, bbl.y); ctx.closePath();
        ctx.fillStyle = rgba(col, 0.07 * facing);
        ctx.fill();

        // window dots
        for (let d = 0; d < 3; d++) {
          const dot = corner(-pw + pw * 0.18 + d * pw * 0.16, -ph + barH * 0.5);
          ctx.fillStyle = rgba(pal[(p.tint + d) % 3], 0.22 * facing);
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 1.1 + depth, 0, Math.PI * 2);
          ctx.fill();
        }

        // code lines inside the panel
        ctx.lineWidth = Math.max(1, (0.8 + depth) * ((tl.s + tr.s) * 0.5));
        for (let k = 0; k < p.lines.length; k++) {
          const ly = -ph + barH + (ph * 0.62) * (k / (p.lines.length - 1));
          const indent = (k % 3) * pw * 0.12;
          const a = corner(-pw + pw * 0.1 + indent, ly);
          const b = corner(-pw + pw * 0.1 + indent + pw * 1.55 * p.lines[k], ly);
          ctx.strokeStyle = rgba(pal[(p.tint + k) % 3], 0.10 * facing + depth * 0.06);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // floating syntax tokens, each flipping in 3D around its vertical axis
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const wy = t.y - elapsed * 0.012 + Math.sin(elapsed * 0.3 + t.phase) * 0.035;
        const y = wy < -1.3 ? 1.3 : wy;
        const depth = (t.z + 1.2) / 1.8;
        const persp = CAM / (CAM - t.z);
        const x = cx + t.x * spread * persp + ptr.x * (18 + depth * 42);
        const py = cy + y * spread * persp + ptr.y * (12 + depth * 30);
        const size = Math.max(11, (11 + depth * 14) * persp);
        const flip = Math.abs(Math.cos(elapsed * t.flipSpeed + t.flip));
        ctx.save();
        ctx.translate(x, py);
        ctx.scale(Math.max(0.06, flip), 1);
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
      ptr.x += (ptr.tx - ptr.x) * 0.045;
      ptr.y += (ptr.ty - ptr.y) * 0.045;
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
    else draw();
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
      addLine("ai_models    — Claude, ChatGPT / GPT, Gemini, Gemma, Llama, Mistral, DeepSeek, Qwen", true);
      addLine("models_tools — LoRA Fine-tuning, Hugging Face, Gradio, Google AI Studio, Git & GitHub", true);
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
