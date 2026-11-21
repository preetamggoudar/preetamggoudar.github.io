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
