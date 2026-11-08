// ===== EDIT THIS SECTION =====
const CONFIG = {
  email: "northwebstudio.ca@gmail.com",
  phones: ["+1 343 558 827", "+1 613 581 3901"], // first number looks one digit short, fix it here
  // Messages are sent through FormSubmit (free). See the setup note in the instructions.
  endpoint: "https://formsubmit.co/ajax/northwebstudio.ca@gmail.com"
};
// =============================

const $ = (s, el = document) => el.querySelector(s);
const fmt = n => "$" + n.toLocaleString("en-CA");

document.querySelectorAll("[data-phone]").forEach(a => {
  const p = CONFIG.phones[a.dataset.phone];
  a.textContent = p;
  a.href = "tel:" + p.replace(/[^\d+]/g, "");
});

/* Sending: tries the form service first, falls back to the visitor's email app */
async function deliver(subject, fields, auto) {
  try {
    const r = await fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...fields, _subject: subject, _template: "table", _captcha: "false", _autoresponse: auto })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.success !== "false" && d.success !== false) return true;
  } catch (err) { /* fall through to email app */ }
  const body = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("\n");
  location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return false;
}
async function submit(form, statusEl, subject, fields, done, hours = 48) {
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true; const label = btn.textContent; btn.textContent = "Sending...";
  const ok = await deliver(subject, fields, `Thanks for contacting Northweb Studio. We have your request and will email you back within ${hours} hours. Every website is delivered in 7 days max, with a full refund within 24 hours if you are not happy.`);
  btn.disabled = false; btn.textContent = label;
  statusEl.textContent = ok
    ? `Sent. We will email you back within ${hours} hours.`
    : "We could not send that automatically, so your email app has opened. You can also email " + CONFIG.email + ".";
  if (ok) { form.reset(); if (done) done(); }
}

/* Mobile menu */
const nav = $(".nav"), menuBtn = $(".menu");
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});
nav.querySelectorAll("nav a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); }));

/* Work carousel */
const track = $("#track"), slides = [...track.children], dots = $("#dots");
slides.forEach((_, i) => {
  const b = document.createElement("button");
  b.type = "button"; b.setAttribute("aria-label", "Show website " + (i + 1));
  b.onclick = () => go(i); dots.append(b);
});
function index() { return Math.round(track.scrollLeft / (slides[0].offsetWidth + 32)); }
function go(i) { i = (i + slides.length) % slides.length; track.scrollTo({ left: i * (slides[0].offsetWidth + 32), behavior: "smooth" }); }
function mark() { [...dots.children].forEach((d, i) => d.classList.toggle("on", i === index())); }
$("#prev").onclick = () => go(index() - 1);
$("#next").onclick = () => go(index() + 1);
track.addEventListener("scroll", mark, { passive: true });
track.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(index() + 1); if (e.key === "ArrowLeft") go(index() - 1); });
mark();

/* Scale website previews to fit (phones get a phone sized preview) */
function fitThumbs() {
  const narrow = innerWidth < 700, base = narrow ? 420 : 1280, h = narrow ? 560 : 800;
  document.querySelectorAll(".tview").forEach(v => {
    v.style.aspectRatio = narrow ? "3 / 4" : "16 / 10";
    const f = v.querySelector("iframe");
    f.style.width = base + "px"; f.style.height = h + "px";
    v.style.setProperty("--s", v.clientWidth / base);
  });
}
fitThumbs(); addEventListener("resize", fitThumbs); addEventListener("load", fitThumbs);

/* Custom quote estimator */
const quote = $("#quote");
function estimate() {
  const f = new FormData(quote), pages = +f.get("pages");
  $("#pagesOut").textContent = pages;
  const extras = [...quote.querySelectorAll("[name=x]:checked")].reduce((s, c) => s + +c.value, 0);
  const total = (150 + pages * 175 + +f.get("anim") + extras) * +f.get("type") * +f.get("days");
  const r = Math.round(total / 50) * 50;
  $("#est").textContent = fmt(r);
  return r;
}
quote.addEventListener("input", estimate); estimate();
quote.addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(quote), sel = n => quote.elements[n].selectedOptions[0].textContent;
  const extras = [...quote.querySelectorAll("[name=x]:checked")].map(c => c.dataset.n).join(", ") || "None";
  submit(quote, $("#quoteStatus"), "Custom quote request from " + f.get("name"), {
    name: f.get("name"), email: f.get("email"), business_type: sel("type"), pages: f.get("pages"),
    delivery: sel("days"), animations: sel("anim"), extras, estimate: fmt(estimate()) + " CAD", notes: f.get("notes")
  }, estimate);
});

/* Package request dialog */
const dlg = $("#order"), orderForm = $("#orderForm");
let current = null;
document.querySelectorAll("[data-plan]").forEach(b => b.addEventListener("click", () => {
  current = { plan: b.dataset.plan, price: +b.dataset.price };
  $("#orderTitle").textContent = `${current.plan} package, ${fmt(current.price)} CAD`;
  $("#orderStatus").textContent = "";
  dlg.showModal();
}));
$("#orderClose").addEventListener("click", () => dlg.close());
orderForm.addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(orderForm);
  submit(orderForm, $("#orderStatus"), `New ${current.plan} package request from ${f.get("name")}`, {
    package: `${current.plan} (${fmt(current.price)} CAD)`, name: f.get("name"), email: f.get("email"), business: f.get("biz"), about: f.get("about"), needs: f.get("needs")
  }, () => setTimeout(() => dlg.close(), 3000), 24);
});

/* Contact form */
const cf = $("#contactForm");
cf.addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(cf);
  submit(cf, $("#contactStatus"), "Message from " + f.get("name"), { name: f.get("name"), email: f.get("email"), message: f.get("message") }, null, 24);
});
