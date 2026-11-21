/* =========================================================
   PREETAM_OS — shell logic
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PROMPT = "preetam@portfolio:~$";

  /* ---------- boot sequence ---------- */
  const boot = document.getElementById("boot");
  const skip = document.getElementById("boot-skip");
  const hideBoot = () => boot && boot.classList.add("hidden");
  if (skip) skip.addEventListener("click", hideBoot);
  if (boot && !reduceMotion) window.setTimeout(hideBoot, 3350);
  else hideBoot();

  /* ---------- live clock ---------- */
  const clock = document.getElementById("clock");
  const tickClock = () => {
    if (!clock) return;
    clock.textContent = new Date().toLocaleTimeString("en-IN", { hour12: false });
  };
  tickClock();
  window.setInterval(tickClock, 1000);

  /* ---------- scroll progress + active nav ---------- */
  const progress = document.getElementById("scroll-pct");
  const navLinks = document.querySelectorAll("#primary-nav a");
  const sections = document.querySelectorAll("main section[id]");
  let scrollTicking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
    if (progress) progress.textContent = String(pct).padStart(3, "0") + "%";
    let current = "";
    sections.forEach((s) => {
      if (s.getBoundingClientRect().top <= 160) current = s.id;
    });
    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
    scrollTicking = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
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

  /* ---------- scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    reveals.forEach((el, i) => { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  }

  /* ---------- terminal ---------- */
  const output = document.getElementById("term-output");
  const form = document.getElementById("term-form");
  const input = document.getElementById("term-input");
  if (!output || !form || !input) return;

  const addLine = (text, cls) => {
    const div = document.createElement("div");
    div.className = "term-line" + (cls ? " " + cls : "");
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  };

  const addEcho = (cmd) => {
    const div = document.createElement("div");
    div.className = "term-line";
    const p = document.createElement("span");
    p.className = "prompt";
    p.textContent = PROMPT + " ";
    div.appendChild(p);
    div.appendChild(document.createTextNode(cmd));
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  };

  const addLinks = (items) => {
    items.forEach(({ label, url }) => {
      const div = document.createElement("div");
      div.className = "term-line";
      div.appendChild(document.createTextNode(label + " "));
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "accent";
      a.textContent = url;
      div.appendChild(a);
      output.appendChild(div);
    });
    output.scrollTop = output.scrollHeight;
  };

  const HELP = [
    "AVAILABLE COMMANDS",
    "  help              show this list",
    "  whoami            who I am",
    "  about             short intro",
    "  skills            skill list",
    "  experience        recent activity",
    "  education         where I studied",
    "  projects          things I've built",
    "  contact           ways to reach me",
    "  ls                list sections",
    "  open <section>    jump to a section",
    "  theme <name>      green | amber | cyan",
    "  date              system date",
    "  clear             clear the screen",
    "  sudo              try it. I dare you."
  ];

  const SECTIONS = ["home", "about", "skills", "experience", "education", "projects", "contact"];

  const commands = {
    help: () => HELP.forEach((l, i) => addLine(l, i === 0 ? "accent" : "dim")),
    whoami: () => {
      addLine("Preetam Goudar", "accent");
      addLine("CSE (AI & ML) student · Google Student Ambassador 2026", "dim");
      addLine("Location: Bengaluru, India · Status: building things that help people.", "dim");
    },
    about: () => {
      addLine("I'm Preetam — a Computer Science student specialising in AI & ML at", "dim");
      addLine("upGrad School of Technology (Batch 2026–2030), Bengaluru.", "dim");
      addLine("I learn by building, care about community, and play guitar when offline.", "dim");
    },
    skills: () => {
      addLine("ai_ml        : Generative AI, Machine Learning, Deep Learning, Prompt Engineering, RAG, Computer Vision", "dim");
      addLine("models_tools : Gemma, Gemini, LoRA Fine-tuning, Hugging Face, Gradio, Google AI Studio, Git & GitHub", "dim");
      addLine("web_build    : AI Web Development, Web Development, HTML/CSS, JavaScript, Python, SQL, Open Source", "dim");
      addLine("core_cs      : Data Structures, Algorithms, OOP, DBMS, Problem Solving", "dim");
      addLine("leadership   : Leadership, Entrepreneurship, Community Building, Public Speaking, Mentoring, Teamwork, Communication");
    },
    experience: () => {
      addLine("[2026.11] Google Student Ambassador — Google Student Ambassadors (India)", "dim");
      addLine("[2026.10] 1st place, Hack Day — Team SnakeByte, ₹7,000 prize", "accent");
      addLine("[2026.09] Smart India Hackathon 2026 — upGrad School of Technology", "dim");
      addLine("[2026.09] 'Vision Meets Execution' with Ronnie Screwvala", "dim");
      addLine("Tip: run `open experience` for the full log.", "dim");
    },
    education: () => {
      addLine("B.E. Computer Science (AI & ML) — upGrad School of Technology, 2026–2030", "dim");
      addLine("Class XII / JEE Preparation — PW Vidyapeeth, Karnataka", "dim");
    },
    projects: () => {
      addLine("~/projects/campusclaim   [FEATURED]", "accent");
      addLine("  Receipt-to-reimbursement assistant using Gemma 4 vision fine-tuning.", "dim");
      addLine("~/projects/experiments   [ONGOING]", "accent");
      addLine("  Open-source experiments and AI web apps.");
      addLine("Tip: run `open projects` to browse the directory.", "dim");
    },
    contact: () => {
      addLine("Reach me here:");
      addLinks([
        { label: "LinkedIn →", url: "https://www.linkedin.com/in/preetam-goudar-181174324" },
        { label: "GitHub   →", url: "https://github.com/preetamggoudar" }
      ]);
    },
    ls: () => {
      addLine(SECTIONS.map((s) => s + "/").join("   "), "accent");
      addLine("Use `open <name>` to navigate.", "dim");
    },
    date: () => addLine(new Date().toString(), "dim"),
    echo: (args) => addLine(args.join(" ")),
    sudo: () => {
      addLine("preetam is not in the sudoers file.", "dim");
      addLine("This incident has been reported. (Just kidding — but no root access.)", "accent");
    },
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
        addLine("Opening " + target + "/ ...", "accent");
        document.getElementById(target)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      } else {
        addLine("open: no such section: " + (args[0] || "(missing)"), "dim");
        addLine("Valid sections: " + SECTIONS.join(", "), "dim");
      }
      return;
    }

    if (key === "theme") {
      const theme = (args[0] || "").toLowerCase();
      if (["green", "amber", "cyan"].includes(theme)) {
        document.documentElement.dataset.theme = theme;
        addLine("Phosphor set to " + theme.toUpperCase() + ".", "accent");
      } else {
        addLine("Usage: theme green | amber | cyan", "dim");
      }
      return;
    }

    if (Object.prototype.hasOwnProperty.call(commands, key)) {
      commands[key](args);
    } else {
      addLine(name + ": command not found", "dim");
      addLine("Type `help` to see available commands.", "dim");
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
    if (e.key === "ArrowUp" && historyIndex > 0) {
      e.preventDefault();
      input.value = history[--historyIndex];
    } else if (e.key === "ArrowDown" && historyIndex < history.length) {
      e.preventDefault();
      input.value = history[++historyIndex] || "";
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      output.textContent = "";
    }
  });

  document.querySelectorAll(".quick-commands button").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = btn.dataset.cmd;
      form.requestSubmit();
      input.focus();
    });
  });

  /* ---------- footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
