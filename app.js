/* Site da Luísa Cotrim.
   Todo o texto vem de content/site.json, o ficheiro que o painel de edição altera.
   Não é preciso mexer neste ficheiro para mudar conteúdos. */

const root = document.documentElement;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const imgSrc = p => (p || "").replace(/^\//, "");
let D = null;
let wa = t => "#";

/* ---------- Desenhar o conteúdo ---------- */
function render(data) {
  D = data;
  const c = data.contactos || {};
  const num = String(c.whatsapp || "").replace(/\D/g, "");
  wa = t => `https://wa.me/${num}` + (t ? `?text=${encodeURIComponent(t)}` : "");

  document.querySelectorAll("[data-c]").forEach(el => { el.textContent = get(data, el.dataset.c) ?? ""; });
  const nome = c.nome || "";
  const [first, ...rest] = nome.split(" ");
  document.querySelectorAll("[data-logo]").forEach(el => { el.innerHTML = `${esc(first)} <i>${esc(rest.join(" "))}</i>`; });
  document.querySelectorAll("[data-firstname]").forEach(el => { el.textContent = first; });
  document.title = `${nome} · Massagens e terapias holísticas`;
  document.querySelectorAll("[data-wa-link]").forEach(a => { a.href = wa(); });
  document.querySelectorAll("[data-wa-hello]").forEach(a => { a.href = wa(`Olá ${first}! Gostava de marcar uma sessão.`); });
  document.querySelectorAll("[data-mail]").forEach(a => { a.href = `mailto:${c.email || ""}`; });
  const telDigits = String(c.telefone || "").replace(/\D/g, "");
  document.querySelectorAll("[data-tel-link]").forEach(a => { a.href = `tel:+351${telDigits}`; a.setAttribute("aria-label", `Ligar para ${c.telefone || ""}`); });

  const moradaTxt = [c.morada, c.complemento, `${c.codigo_postal || ""} ${c.localidade || ""}`.trim()].filter(Boolean).join(" · ");
  document.getElementById("morada").textContent = moradaTxt;
  document.getElementById("maps").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${c.morada || ""}, ${c.codigo_postal || ""} ${c.localidade || ""}`);
  document.getElementById("googleReviews").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${nome} Massagens ${c.localidade || ""}`);
  const insta = document.getElementById("insta"), fb = document.getElementById("fb");
  insta.hidden = !c.instagram; if (c.instagram) insta.href = c.instagram;
  fb.hidden = !c.facebook; if (c.facebook) fb.href = c.facebook;
  document.getElementById("ano").textContent = new Date().getFullYear();
  document.getElementById("emailRow").hidden = !c.email;
  document.getElementById("nifWrap").hidden = !c.nif;
  const hp = document.getElementById("heroPhoto"), heroImg = data.inicio && data.inicio.foto;
  hp.hidden = !heroImg;
  document.getElementById("topo").classList.toggle("has-photo", !!heroImg);
  if (heroImg) { const im = hp.querySelector("img"); im.src = imgSrc(heroImg); im.alt = `${nome} a fazer uma massagem`; }
  const nc = document.getElementById("nCert"); if (nc) nc.textContent = ((data.sobre && data.sobre.formacao) || []).filter(f => f && f.curso).length;
  renderHorario(data.horario);
  renderDays();

  renderMassagens(data.massagens || []);
  renderSobre(data.sobre || {});
  renderGaleria(data.galeria || []);
  document.getElementById("frase").textContent = `“${(data.frase && data.frase.texto) || ""}”`;
  renderVales((data.vales && data.vales.opcoes) || []);
  renderFaq(data.perguntas || []);
  renderLd(data);
  pick(current);
}

/* Cada terapia tem uma ou mais opções: { opcao, minutos, preco }.
   Sem preço = "sob consulta". Sem opção nem minutos = só o preço. */
const optLabel = x => [x.opcao, x.minutos ? `${x.minutos} min` : ""].filter(Boolean).join(", ");
const optsOf = m => (m.duracoes || []).filter(x => x && (x.opcao || x.minutos || x.preco != null));
const selValues = m => { const o = optsOf(m); return o.length > 1 ? o.map(x => `${m.nome} · ${optLabel(x)}`) : [m.nome]; };

function renderMassagens(list) {
  const bento = document.getElementById("bento");
  const spans = list.map((_, i) => (i === 0 ? "big" : i <= 2 ? "" : null));
  for (let i = 3, left = list.length - 3; i < list.length; ) {
    const row = left >= 3 && left !== 4 ? 3 : left >= 2 ? 2 : 1;
    for (let k = 0; k < row; k++) spans[i + k] = row === 3 ? "third" : row === 2 ? "wide" : "full";
    i += row; left -= row;
  }
  bento.innerHTML = list.map((m, i) => {
    const o = optsOf(m);
    const priced = o.filter(x => x.preco != null && x.preco !== "" && Number(x.preco) > 0);
    const min = priced.length ? Math.min(...priced.map(x => Number(x.preco))) : null;
    const energy = /energ/i.test(m.categoria || "");
    const cls = ["card", spans[i], energy ? "energy" : ""].filter(Boolean).join(" ");
    const tag = `${String(i + 1).padStart(2, "0")}${m.destaque ? " · " + esc(m.destaque).toUpperCase() : ""}`;
    const cat = m.categoria ? `<span class="cat">${esc(m.categoria)}</span>` : "";
    const chips = o.length > 1
      ? `<div class="durs">${o.map(x => `<span${x.preco == null || Number(x.preco) === 0 ? ' class="soft"' : ""}>${esc(optLabel(x))} · ${x.preco == null || x.preco === "" ? "sob consulta" : Number(x.preco) === 0 ? "oferta" : x.preco + " €"}</span>`).join("")}</div>`
      : "";
    const single = o.length === 1 ? optLabel(o[0]) : "";
    const price = min == null
      ? `<div class="price soft">Sob consulta</div>`
      : `<div class="price">${min} €<small>${new Set(priced.map(x => Number(x.preco))).size > 1 ? "desde" : o.length > 1 ? "cada" : esc(single)}</small></div>`;
    const cta = `<a class="card-cta" href="#marcar" data-book data-pick="${esc(selValues(m)[0])}">Marcar <span aria-hidden="true">→</span></a>`;
    return `<article class="${cls}">
      <div class="top"><span class="num">${tag}</span>${cat}</div>
      <h3>${esc(m.nome)}</h3>
      <p${i === 0 ? ' style="max-width:28em"' : ""}>${esc(m.descricao)}</p>
      ${chips}
      <div class="foot">${price}</div>
      ${cta}
    </article>`;
  }).join("");
  bento.querySelectorAll("[data-book]").forEach(a => a.addEventListener("click", () => setTimeout(() => document.getElementById("nome").focus({ preventScroll: true }), 600)));
  document.getElementById("nTec").textContent = list.length;
  const corpo = list.filter(m => !/energ/i.test(m.categoria || "")).flatMap(m => optsOf(m).map(x => Number(x.preco))).filter(v => v > 0);
  const hf = document.getElementById("heroFrom");
  if (hf) { hf.hidden = !corpo.length; hf.textContent = `Massagens desde ${Math.min(...corpo)} €`; }

  const sel = document.getElementById("serv");
  const keep = sel.value;
  sel.innerHTML = list.flatMap(selValues).map(v => `<option>${esc(v)}</option>`).join("")
    + "<option>Vale-oferta</option><option>Ainda não sei, quero ajuda a escolher</option>";
  if (keep && [...sel.options].some(o => o.value === keep)) sel.value = keep;
}

function setPhoto(el, foto, alt) {
  el.querySelectorAll("img").forEach(i => i.remove());
  const svg = el.querySelector(".illus");
  if (foto) {
    const img = new Image();
    img.src = imgSrc(foto); img.alt = alt || ""; img.loading = "lazy";
    el.prepend(img);
    if (svg) svg.style.display = "none";
    el.classList.add("has-img");
  } else {
    if (svg) svg.style.display = "";
    el.classList.remove("has-img");
  }
}

function renderSobre(s) {
  setPhoto(document.getElementById("portrait"), s.foto, D.contactos && D.contactos.nome);
  document.getElementById("creds").innerHTML = (s.formacao || []).filter(f => f && f.curso).map(f => `<li>${esc(f.curso)}</li>`).join("");
}

function renderGaleria(list) {
  const tpl = document.getElementById("illus").content.querySelectorAll("svg");
  const g = document.getElementById("gallery");
  g.innerHTML = "";
  list.forEach((item, i) => {
    const fig = document.createElement("figure");
    fig.className = "photo";
    if (tpl.length) fig.appendChild(tpl[i % tpl.length].cloneNode(true));
    const cap = document.createElement("figcaption");
    cap.className = "ph"; cap.textContent = item.legenda || "";
    fig.appendChild(cap);
    setPhoto(fig, item.foto, item.legenda);
    g.appendChild(fig);
  });
}

function renderVales(list) {
  const box = document.getElementById("vouchers");
  box.innerHTML = list.map((v, i) => `<button class="voucher" type="button" data-v="${esc(v.valor)}" data-s="${esc(v.descricao)}" aria-pressed="${i === Math.min(1, list.length - 1)}"><small>Vale</small><b>${esc(v.valor)} €</b><span>${esc(v.descricao)}</span></button>`).join("");
  box.querySelectorAll(".voucher").forEach(b => b.addEventListener("click", () => pickVoucher(b)));
  const sel = box.querySelector('[aria-pressed="true"]');
  if (sel) pickVoucher(sel);
}

function pickVoucher(b) {
  document.querySelectorAll(".voucher").forEach(v => v.setAttribute("aria-pressed", v === b));
  const btn = document.getElementById("giftBtn");
  btn.firstChild.textContent = `Pedir vale de ${b.dataset.v} € `;
  btn.href = wa(`Olá ${firstName()}! Gostava de oferecer um vale de ${b.dataset.v} € (${b.dataset.s}). Pode ser para o nome: `);
}

function renderFaq(list) {
  document.getElementById("faq").innerHTML = list.map((q, i) =>
    `<details${i === 0 ? " open" : ""}><summary>${esc(q.pergunta)}<span class="plus">+</span></summary><p>${esc(q.resposta)}</p></details>`).join("");
}

function renderLd(d) {
  const c = d.contactos || {}, h = d.horario || {};
  const precos = (d.massagens || []).flatMap(m => (m.duracoes || []).map(x => Number(x.preco) || 0)).filter(Boolean);
  const rua = [c.morada, c.complemento].filter(Boolean).join(", ");
  const hrs = s => { const m = String(s || "").match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/); return m ? [m[1].padStart(5, "0"), m[2].padStart(5, "0")] : null; };
  const spec = [];
  const EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (let dia = 0; dia < 7; dia++) { const x = hrs(horaDe(h, dia)); if (x) spec.push({ "@type": "OpeningHoursSpecification", dayOfWeek: EN[dia], opens: x[0], closes: x[1] }); }
  const ld = {
    "@context": "https://schema.org", "@type": "HealthAndBeautyBusiness",
    name: `${c.nome || ""} Massagens`,
    description: `Massagens em ${c.localidade || ""}: ${(d.massagens || []).map(m => m.nome).join(", ")}.`,
    telephone: "+351" + String(c.telefone || "").replace(/\D/g, ""),
    email: c.email || undefined,
    priceRange: precos.length ? `${Math.min(...precos)}€–${Math.max(...precos)}€` : undefined,
    address: { "@type": "PostalAddress", streetAddress: rua, postalCode: c.codigo_postal, addressLocality: c.localidade, addressCountry: "PT" },
    openingHoursSpecification: spec,
    sameAs: [c.instagram, c.facebook].filter(Boolean)
  };
  document.getElementById("ld").textContent = JSON.stringify(ld);
}

/* Horário: um campo por dia. Dias seguidos com o mesmo horário juntam-se numa linha. */
const DIAS_KEYS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const DIAS_NOMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const horaDe = (h, dia) => String((h || {})[DIAS_KEYS[dia]] || "").trim();
const isClosed = v => !v || /encerrad|fechad/i.test(v);
function renderHorario(h) {
  const ordem = [1, 2, 3, 4, 5, 6, 0], rows = [];
  ordem.forEach(dia => {
    const v = horaDe(h, dia) || "Encerrado", last = rows[rows.length - 1];
    if (last && last.v === v) last.dias.push(dia); else rows.push({ v, dias: [dia] });
  });
  const nome = ds => ds.length === 1 ? DIAS_NOMES[ds[0]] : ds.length === 2 ? `${DIAS_NOMES[ds[0]]} e ${DIAS_NOMES[ds[1]].toLowerCase()}` : `${DIAS_NOMES[ds[0]]} a ${DIAS_NOMES[ds[ds.length - 1]].toLowerCase()}`;
  const hoje = new Date().getDay();
  document.getElementById("hours").innerHTML = rows.map(r => `<tr${r.dias.includes(hoje) ? ' class="today"' : ""}><td>${esc(nome(r.dias))}</td><td>${esc(r.v)}</td></tr>`).join("");
}

const firstName = () => String((D && D.contactos && D.contactos.nome) || "").split(" ")[0];

/* ---------- Modo claro / escuro ---------- */
const modeBtn = document.getElementById("mode");
function setMode(dark) {
  root.classList.toggle("dark", dark);
  modeBtn.setAttribute("aria-label", dark ? "Mudar para modo claro" : "Mudar para modo escuro");
  try { localStorage.setItem("fc-mode", dark ? "dark" : "light"); } catch (e) {}
  readOrbs();
}
modeBtn.addEventListener("click", () => setMode(!root.classList.contains("dark")));

/* ---------- Luz que respira: 4 s a inspirar, 6 s a expirar ---------- */
const cv = document.getElementById("breath"), ctx = cv.getContext("2d");
const word = document.getElementById("breathWord");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let W, H, orbs = [], running = false, raf = 0, heroVisible = true;
function readOrbs() { const s = getComputedStyle(root); orbs = ["--orb1", "--orb2", "--orb3"].map(v => s.getPropertyValue(v).trim()); if (!running) draw(performance.now()); }
function size() { const d = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
function blob(x, y, r, col) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function draw(t) {
  const cyc = (t / 1000) % 10, inhale = cyc < 4;
  const p = inhale ? cyc / 4 : 1 - (cyc - 4) / 6, e = .5 - Math.cos(p * Math.PI) / 2;
  if (!reduce) word.textContent = inhale ? "Inspire" : "Expire";
  ctx.clearRect(0, 0, W, H);
  const base = Math.max(W, H) * .32, cx = W * .72, cy = H * .42;
  ctx.globalCompositeOperation = "screen";
  blob(cx + Math.sin(t / 4000) * 30, cy + Math.cos(t / 5000) * 20, base * (.75 + .35 * e), orbs[0]);
  blob(cx - base * .35, cy + base * .25, base * (.55 + .25 * e), orbs[1]);
  blob(cx + base * .3, cy - base * .3, base * (.4 + .2 * e), orbs[2]);
  ctx.globalCompositeOperation = "source-over";
  if (!reduce && running) raf = requestAnimationFrame(draw);
}
function start() { if (reduce || running || !heroVisible || document.hidden) return; running = true; raf = requestAnimationFrame(draw); }
function stop() { running = false; cancelAnimationFrame(raf); }
size(); addEventListener("resize", () => { size(); if (!running) draw(performance.now()); });
let saved = null; try { saved = localStorage.getItem("fc-mode"); } catch (e) {}
setMode(saved === "dark");
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; heroVisible ? start() : stop(); }).observe(document.getElementById("topo"));
}
document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
start();

/* ---------- Menu do telemóvel ---------- */
const nav = document.querySelector(".nav"), burger = document.getElementById("burger");
const closeMenu = () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menu"); };
burger.addEventListener("click", () => {
  const open = !nav.classList.contains("open");
  nav.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
});
document.querySelectorAll("#menu a").forEach(a => a.addEventListener("click", closeMenu));

/* ---------- Política de privacidade ---------- */
const priv = document.getElementById("priv");
const openPriv = () => { if (priv.showModal) priv.showModal(); else priv.setAttribute("open", ""); };
document.getElementById("openPriv").addEventListener("click", openPriv);
document.querySelectorAll(".privLink").forEach(b => b.addEventListener("click", openPriv));
document.getElementById("closePriv").addEventListener("click", () => priv.close ? priv.close() : priv.removeAttribute("open"));
priv.addEventListener("click", e => { if (e.target === priv && priv.close) priv.close(); });

/* ---------- Onde lhe dói? ---------- */
const SUG = {
  pescoco: ["Massagem localizada", "Tensão no pescoço e dores de cabeça de tensão aliviam com um trabalho focado nessa zona."],
  ombros: ["Massagem terapêutica", "Ombros presos costumam vir de horas ao computador. Uma massagem terapêutica solta a zona e devolve-te leveza."],
  lombar: ["Massagem terapêutica", "Para a zona lombar, uma massagem terapêutica alivia as tensões acumuladas e a carga do dia."],
  pernas: ["Drenagem linfática", "Pernas pesadas ou inchadas? A drenagem é suave e ajuda a aliviar a sensação de peso."],
  stress: ["Massagem de relaxamento", "Para acalmar a mente e dormir melhor, uma massagem de relaxamento faz toda a diferença."],
  energia: ["Radiestesia", "Sentes bloqueios ou falta de energia? A radiestesia ajuda a alinhar a energia, harmonizar os chakras e libertar bloqueios."],
  clareza: ["Tarot, oráculos e Registos Akáshicos", "Para ganhar clareza e orientação no teu momento de vida, uma leitura de tarot é um bom ponto de partida."],
  emocoes: ["Innerdance Kundalini", "Para libertar emoções e te ligares a ti, a Innerdance é uma viagem guiada pelo som e pelo movimento interior."]
};
let current = "ombros";
function pick(z) {
  current = z;
  document.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", b.dataset.zone === z));
  document.querySelectorAll(".zone").forEach(g => g.classList.toggle("active", g.dataset.zone === z));
  const r = document.getElementById("result");
  r.querySelector("h3").textContent = SUG[z][0];
  r.querySelector("p").textContent = SUG[z][1];
}
document.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => pick(b.dataset.zone)));
document.querySelectorAll(".zone").forEach(g => {
  g.addEventListener("click", () => pick(g.dataset.zone));
  g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(g.dataset.zone); } });
});
document.getElementById("useSug").addEventListener("click", () => {
  const sel = document.getElementById("serv"), opt = [...sel.options].find(o => o.value.startsWith(SUG[current][0]));
  if (opt) sel.value = opt.value;
  updateSend();
});


/* ---------- Dias e horas ---------- */
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const daysEl = document.getElementById("days"), slotsEl = document.getElementById("slots");
let selDay = null, selSlot = "";
/* Horas de início, de hora a hora, da abertura até uma hora antes do fecho (ex.: 10:00 – 19:00 dá 10:00 a 18:00) */
function horasDoDia(dia) {
  const v = D ? horaDe(D.horario, dia) : "";
  const m = v.match(/(\d{1,2}):?(\d{2})?\D+(\d{1,2}):?(\d{2})?/);
  const ini = m ? +m[1] : 10, fim = m ? +m[3] : 19;
  const out = [];
  for (let h = ini; h < fim; h++) out.push(`${String(h).padStart(2, "0")}:00`);
  return out;
}
function renderSlots() {
  const list = horasDoDia(selDay ? selDay.getDay() : 2);
  if (!list.includes(selSlot)) selSlot = list[0];
  slotsEl.innerHTML = "";
  list.forEach(h => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "slot"; b.textContent = h;
    b.setAttribute("aria-pressed", h === selSlot);
    b.addEventListener("click", () => { slotsEl.querySelectorAll(".slot").forEach(s => s.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); selSlot = h; });
    slotsEl.appendChild(b);
  });
}
function renderDays() {
  const fechado = dia => D && isClosed(horaDe(D.horario, dia)) && /\d/.test(Object.values(D.horario || {}).join(""));
  daysEl.innerHTML = "";
  // Mostra os dias abertos do próximo mês (30 dias a contar de amanhã)
  const d = new Date(); d.setHours(0, 0, 0, 0); let n = 0;
  for (let k = 0; k < 30; k++) {
    d.setDate(d.getDate() + 1);
    if (fechado(d.getDay())) continue;
    const day = new Date(d), b = document.createElement("button");
    b.type = "button"; b.className = "day";
    b.innerHTML = `<small>${DIAS[day.getDay()]}</small><b>${day.getDate()}</b><span class="mes">${day.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "")}</span>`;
    b.setAttribute("aria-label", day.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" }));
    b.setAttribute("aria-pressed", n === 0);
    b.addEventListener("click", () => { daysEl.querySelectorAll(".day").forEach(x => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); selDay = day; renderSlots(); });
    if (n === 0) selDay = day;
    daysEl.appendChild(b); n++;
  }
  renderSlots();
}
renderDays();

/* ---------- Enviar pedido ----------
   O botão é um link normal para o WhatsApp, atualizado a cada alteração do formulário.
   Assim, ao tocar, abre logo o WhatsApp com a mensagem escrita. */
const sendWa = document.getElementById("sendWa");
const field = id => document.getElementById(id).value.trim();
function pedido() {
  const dia = selDay ? selDay.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" }) : "";
  const quem = field("nome") ? `Sou ${field("nome")} e gostava` : "Gostava";
  return `Olá ${firstName()}! ${quem} de marcar ${field("serv")} para ${dia} às ${selSlot}.` + (field("obs") ? ` Notas: ${field("obs")}` : "");
}
function updateSend() {
  const ok = !!field("nome");
  sendWa.classList.toggle("locked", !ok);
  sendWa.setAttribute("aria-disabled", String(!ok));
  if (ok) {
    document.getElementById("nome").classList.remove("invalid");
    document.getElementById("needName").classList.remove("show");
  }
  sendWa.href = ok && D ? wa(pedido()) : "#marcar";
}
document.getElementById("f").addEventListener("input", updateSend);
document.getElementById("f").addEventListener("change", updateSend);
daysEl.addEventListener("click", () => setTimeout(updateSend));
slotsEl.addEventListener("click", () => setTimeout(updateSend));
sendWa.addEventListener("click", e => {
  const msg = document.getElementById("msg");
  if (!field("nome")) {
    e.preventDefault();
    const nome = document.getElementById("nome");
    nome.classList.remove("invalid"); void nome.offsetWidth; nome.classList.add("invalid");
    document.getElementById("needName").classList.add("show");
    msg.classList.remove("show");
    nome.focus();
    return;
  }
  updateSend();
  msg.innerHTML = `A abrir o WhatsApp… Se não abrir, liga para ${esc(D.contactos.telefone)}.`;
  msg.classList.add("show");
});
document.getElementById("f").addEventListener("submit", e => { e.preventDefault(); sendWa.click(); });

/* ---------- Carregar o conteúdo ---------- */
const fallback = () => JSON.parse(document.getElementById("fallback").textContent);
fetch("content/site.json", { cache: "no-cache" })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(render)
  .catch(() => render(fallback()))
  .then(updateSend);

/* Botão "Marcar" de cada terapia: escolhe-a logo no formulário */
document.getElementById("bento").addEventListener("click", e => {
  const a = e.target.closest(".card-cta"); if (!a) return;
  const sel = document.getElementById("serv");
  if ([...sel.options].some(o => o.value === a.dataset.pick)) sel.value = a.dataset.pick;
});

/* Todos os botões "Marcar" levam ao formulário e põem o cursor no nome */
document.querySelectorAll("[data-book]").forEach(a => a.addEventListener("click", () => {
  closeMenu();
  setTimeout(() => document.getElementById("nome").focus({ preventScroll: true }), 600);
}));
updateSend();

/* No telemóvel, a barra de baixo esconde-se na zona da marcação para não tapar o botão */
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([en]) => document.body.classList.toggle("at-form", en.isIntersecting), { threshold: 0.15 })
    .observe(document.getElementById("marcar"));
}
