// ==========================================================================
// Personal website — shared behaviour
// ==========================================================================

// Paste your Formspree form ID here (e.g. "xyzabcd") to make the contact
// form actually send emails. Sign up free at https://formspree.io
const FORMSPREE_ID = "xzeepnnd";

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupReveal();
  setupFilters();
  setupContactForm();

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

function setupNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");

  // Links use clean URLs ("projects", "/") which GitHub Pages resolves to
  // the .html files. When previewing locally, point them at the files instead.
  const isLocal =
    location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);
  const pageName = (href) => href.replace(/\.html$/, "").replace(/^\/$/, "") || "index";

  if (isLocal) {
    document.querySelectorAll('a[href]:not([href*=":"]):not([href^="#"])').forEach((link) => {
      const href = link.getAttribute("href");
      if (!/\.\w+$/.test(href)) link.setAttribute("href", pageName(href) + ".html");
    });
  }

  // Highlight the link for the current page
  const page = pageName(location.pathname.split("/").pop());
  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (pageName(link.getAttribute("href")) === page) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => observer.observe(el));
}

// Filter buttons: <div class="filters" data-target="#grid"> with
// <button data-filter="web">. Items need data-type="web python ...".
function setupFilters() {
  document.querySelectorAll(".filters[data-target]").forEach((group) => {
    const target = document.querySelector(group.dataset.target);
    if (!target) return;

    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;

      group.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      target.querySelectorAll("[data-type]").forEach((item) => {
        const types = item.dataset.type.split(" ");
        item.classList.toggle("hidden", filter !== "all" && !types.includes(filter));
      });
    });
  });
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const status = document.getElementById("form-status");
  const submit = form.querySelector('button[type="submit"]');

  const validators = {
    name: (v) => (v.trim() ? "" : "Please enter your name."),
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Please enter a valid email address.",
    message: (v) =>
      v.trim().length >= 10 ? "" : "Please write a message (at least 10 characters).",
  };

  const validateField = (name) => {
    const input = form.elements[name];
    const error = validators[name](input.value);
    const field = input.closest(".field");
    field.classList.toggle("invalid", Boolean(error));
    field.querySelector(".field-error").textContent = error;
    return !error;
  };

  Object.keys(validators).forEach((name) => {
    form.elements[name].addEventListener("blur", () => validateField(name));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form-status";

    const valid = Object.keys(validators).map(validateField).every(Boolean);
    if (!valid) return;

    // Demo mode until a Formspree ID is added above
    if (!FORMSPREE_ID) {
      status.textContent =
        "Thanks! (Demo mode: add your Formspree ID in js/main.js to receive messages.)";
      status.classList.add("success");
      form.reset();
      return;
    }

    submit.disabled = true;
    submit.textContent = "Sending…";

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error();
      status.textContent = "Thanks for getting in touch! I'll reply as soon as I can.";
      status.classList.add("success");
      form.reset();
    } catch {
      status.textContent = "Sorry, something went wrong. Please try again or email me directly.";
      status.classList.add("error");
    } finally {
      submit.disabled = false;
      submit.textContent = "Send message";
    }
  });
}
