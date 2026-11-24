import { e, b, badge, card, grid, link, row, stats } from "./ui.js";

const clean = text => text.replace(/\*\*|__/g, "").trim();
const cells = line => line.trim().replace(/^\||\|$/g, "").split("|").map(clean);
function evidence(text) {
  return text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map(part => {
    const match = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    return match ? link(match[1], match[2]) : e(clean(part));
  }).join("");
}
export function buyerGroups(report) {
  return report.split("\n").filter(line => line.trim().startsWith("|")).map(cells)
    .filter(cols => cols.length >= 7 && cols.slice(1, 6).every(v => /^[0-5](?:\s*\/\s*5)?$/.test(v)))
    .map(([name, ...cols]) => {
      const scores = cols.slice(0, 5).map(v => parseInt(v, 10));
      return {name, scores, total: scores.reduce((a, b) => a + b, 0), reason: cols.slice(6).join(" | ")};
    }).sort((a, b) => b.total - a.total);
}
export function planOutline(report) {
  const sections = report.split(/^#{1,6}\s+/m);
  const section = sections.find(s => /outline|chapters|lessons|weeks/i.test(s.split("\n")[0]) && /^\s*1[.)]\s+/m.test(s));
  return (section || report).split("\n").flatMap(line => {
    const match = line.match(/^\s*(?:(?:chapter|lesson|week)\s+)?\d+[.):]\s+(.+)$/i);
    if (!match) return [];
    const title = match[1].match(/^\*\*(.+?)\*\*/)?.[1] || match[1];
    return [clean(title).replace(/[.:]$/, "")];
  });
}
export function planningView(C, track) {
  const buyers = C.i === 2;
  const report = track.results?.["build-" + C.i] || "";
  const chosen = track.buyer || "";
  const action = buyers ? "Score buyer groups" : "Create product plan";
  const full = report ? '<details class="card"><summary>Read full saved ' +
    (buyers ? "buyer analysis" : "plan") + '</summary><div class="pre">' + evidence(report) + "</div></details>" : "";
  let body = "";
  if (buyers) {
    const labels = ["Lasting need", "Ease", "Repeatability", "Repeat purchases", "Room to compete"];
    const groups = buyerGroups(report);
    body = groups.map((g, i) => card(g.name,
      '<div class="buyer-layout"><div>' + row(badge(g.total + " / 25"), i === 0 ? badge("Top score") : "",
        chosen === g.name ? badge("Selected", "green") : b("Pick this group", "pickbuyer", g.name)) +
      "<p>" + evidence(g.reason) + "</p></div><div>" + labels.map((label, j) =>
        '<div class="spread small">' + label + "<b>" + g.scores[j] + '/5</b></div><div class="bar"><i style="width:' +
        g.scores[j] * 20 + '%"></i></div>').join("") + "</div></div>", chosen === g.name ? "buyer-selected" : "")).join("");
    if (!body) body = card("Compare buyer groups", report ? "<p>Your earlier analysis is below. Score again for selectable groups.</p>" :
      "<p>Use your saved idea and research to score five groups. Choose the audience you want the plan to serve.</p>");
  } else if (report) {
    const outline = planOutline(report);
    const promise = report.match(/^#+\s+(?:The )?Promise[^\n]*\n+([^\n|#]+)/im)?.[1];
    const change = report.match(/^\|\s*Before\s*\|\s*After\s*\|[^\n]*\n[^\n]+\n(\|[^\n]+)/im);
    const links = new Set(report.match(/https?:\/\/[^\s)]+/g) || []);
    body = stats([[outline.length, {Ebook:"Chapters", Course:"Lessons", Coaching:"Weeks"}[C.t]], [links.size, "Sources linked in plan"], [C.t, "Format"]]) +
      grid([card("The promise", (promise ? "<p>" + evidence(promise) + "</p>" : "<p>See the saved plan for the product promise.</p>") +
        (change ? cells(change[1]).slice(0, 2).map((v, i) => "<h4>" + ["Before", "After"][i] + "</h4><p>" + evidence(v) + "</p>").join("") : "")),
        card("Outline", outline.length ? "<ol>" + outline.map(x => "<li>" + e(x) + "</li>").join("") + "</ol>" : "<p>Review the outline in the full plan.</p>")]);
  }
  const audience = !buyers && chosen ? card("Chosen buyer", "<p>" + e(chosen) + "</p>" +
    (report && track.planBuyer !== chosen ? "<p>Regenerate the plan to apply this buyer choice.</p>" : "")) : "";
  return '<div class="stepshead"><span class="eyebrow">Build it · Step ' + (C.i + 1) + ' of 7</span><h1>' +
    e(buyers ? "Pick your buyers" : track.title || "Product plan") + "</h1><p>" +
    (buyers ? "Compare the research and choose who you want to build for." : "Review the promise and outline before building your product.") +
    "</p>" + row(b(report ? buyers ? "Score again" : "Regenerate plan" : action, "liveop", "write", report ? "" : "primary"),
      b(buyers ? "Open product plan" : "Build the " + C.t.toLowerCase(), "next", "", "primary", "arrow")) +
    '</div><div class="stack">' + audience + body + full + "</div>";
}
