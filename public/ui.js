export const e = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paths = {
  home: "m3 10 9-7 9 7v10h-6v-6H9v6H3z",
  mail: "M3 5h18v14H3z M3 6l9 7 9-7",
  settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
  book: "M3 4c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2zM12 6v14",
  layers: "m3 8 9-5 9 5-9 5z M3 12l9 5 9-5 M3 16l9 5 9-5",
  image: "M3 4h18v16H3z M4 17l6-6 4 4 3-3 4 5 M16 8h1",
  arrow: "M4 12h15m-6-6 6 6-6 6",
  up: "M6 18 18 6M7 6h11v11",
  check: "m4 12 5 5L20 6",
  shield: "m12 2 8 4v6c0 5-5 8-8 10-3-2-8-5-8-10V6z M8 12l3 3 5-6",
  sun: "M12 8a4 4 0 1 0 .01 0M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
  play: "m7 4 13 8-13 8z",
  menu: "M3 6h18M3 12h18M3 18h18",
  wave: "M2 13h5l3-8 4 15 3-8h5",
  bolt: "m14 2-9 12h7l-2 8 9-13h-7z",
  send: "m3 4 19 8-19 8 4-8zM7 12h15",
  key: "M4 10a5 5 0 1 1 9 3l7 6-2 2-3-1-1-3-3-2a5 5 0 0 1-7-5z",
  users:
    "M9 4a3 3 0 1 0 .01 0M2 20v-3c0-5 14-5 14 0v3M17 5a3 3 0 0 1 0 6M18 14c3 0 4 2 4 5",
  store: "M3 9l2-5h14l2 5-2 3-3-2-4 2-4-2-3 2zM5 12v8h14v-8",
  folder: "M3 5h7l2 3h9v12H3z",
  clock: "M12 3a9 9 0 1 0 .01 0M12 7v5l4 2",
  copy: "M8 8h12v13H8zM5 16H3V3h13v2",
  close: "M5 5l14 14M5 19 19 5",
  film: "M3 4h18v16H3zM7 4v16M17 4v16",
  lock: "M5 10h14v11H5zM8 10V7a4 4 0 1 1 8 0v3",
  chev: "m8 5 7 7-7 7",
  search: "M10 3a7 7 0 1 0 .01 0M15 15l6 6",
  wallet: "M3 5h17v15H3zM14 10h7v5h-7z",
  save: "M4 3h12l4 4v14H4zM8 3v6h8V3M8 21v-8h8v8",
};
export const icon = (n) =>
  `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[n] || paths.layers}"/></svg>`;
export const b = (label, action, value = "", cls = "", glyph = "") =>
  `<button type="button" class="${cls}" data-act="${action}" data-v="${e(value)}">${glyph ? icon(glyph) : ""}${e(label)}</button>`;
export const link = (label, url) =>
  `<a class="btn" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a>`;
export const card = (title, body, cls = "") =>
  `<section class="card ${cls}"><h3>${e(title)}</h3>${body}</section>`;
export const field = (title, id, val = "", type = "text") =>
  `<label class="field">${e(title)}${type === "area" ? `<textarea id="${id}">${e(val)}</textarea>` : `<input id="${id}" type="${type}" value="${e(val)}" autocomplete="off">`}</label>`;
export const select = (id, options, val) =>
  `<select id="${id}" aria-label="${e(id)}">${options.map((o) => `<option ${o === val ? "selected" : ""}>${e(o)}</option>`).join("")}</select>`;
export const row = (...parts) => `<div class="actions">${parts.join("")}</div>`;
export const grid = (parts, cls = "") =>
  `<div class="grid ${cls}">${parts.join("")}</div>`;
export const badge = (s, c = "") => `<span class="badge ${c}">${e(s)}</span>`;
export const table = (headers, rows) =>
  `<div class="scrolltable"><table><thead><tr>${headers.map((h) => `<th>${e(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => "<tr>" + r.map((c) => `<td>${c}</td>`).join("") + "</tr>").join("")}</tbody></table></div>`;
export const list = (items) =>
  "<ul>" + items.map((x) => "<li>" + e(x) + "</li>").join("") + "</ul>";
export const stats = (items) =>
  '<div class="stats">' +
  items
    .map(
      ([n, l]) =>
        `<div class="stat"><strong>${e(n)}</strong><small>${e(l)}</small></div>`,
    )
    .join("") +
  "</div>";
export const book = () =>
  '<div class="book"><small>The kitchen field guide</small><b>The Small<br>Appetite<br><i>Protein Plan</i></b><img src="/media/plate.jpg" alt=""><em>SMALL PLATES SERIES • VOL. 01</em></div>';
export const val = (id) => document.getElementById(id)?.value?.trim() ?? "";
export function download(name, content, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type: mime })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export function modal(title, body) {
  const d = document.querySelector("#modal");
  d.innerHTML = `<div class="spread"><h2>${e(title)}</h2>${b("Close", "close", "", "quiet", "close")}</div><div class="stack">${body}</div>`;
  if (!d.open) d.showModal();
}
export function close() {
  document.querySelector("#modal").close();
}
let timeout;
export function toast(msg) {
  let t = document.querySelector("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(timeout);
  timeout = setTimeout(() => t.classList.remove("show"), 3400);
}
export const read = (k, def) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? def;
  } catch {
    return def;
  }
};
export async function copy(s) {
  await navigator.clipboard.writeText(s);
  toast("Copied to clipboard.");
}
