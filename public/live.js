import { e, b, row, field, card, grid, select, link, badge } from "./ui.js";
import { channels, offers } from "./catalog.js";
export let live = { keys: {}, config: {}, tracks: {}, reserved: 0 };
let token = "";
export async function api(route, body) {
  if (!token) {
    const r = await fetch("/api/session");
    if (!r.ok) throw Error("Start the local helper with python app.py.");
    token = (await r.json()).token;
  }
  const r = await fetch("/api/" + route, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Product-Session": token },
    body: JSON.stringify(body ?? {}),
  });
  let ans = await r.json();
  if (!r.ok) throw Error(ans.error || "The local helper could not finish.");
  return ans;
}
export async function refresh() {
  live = await api("status");
}
export const configFields = {
  cap: "Session spending cap ($)",
  robotCap: "Cap per robot run ($)",
  fable: "Fable / Hermes loopback address",
  company: "Whop account ID",
  workspace: "ScaledMail workspace",
  owner: "Spaceship contact ID",
  name: "Your full sender name",
  business: "Business name",
  address: "Business mailing address",
};
const catalog = await fetch("/writing-models.json").then((response) =>
  response.json(),
);
function modelSelect(id, current, inherit = false) {
  const choices = Object.entries(catalog.models).map(([model, info]) => [
    model,
    info.label,
  ]);
  choices.push(["fable", "Fable (local)"]);
  if (inherit) choices.unshift(["", "Use workspace default"]);
  return (
    '<label class="field">' +
    (inherit ? "Model for this step" : "Default writing model") +
    '<select id="' +
    id +
    '">' +
    choices
      .map(
        ([value, label]) =>
          '<option value="' +
          e(value) +
          '"' +
          (value === current ? " selected" : "") +
          ">" +
          e(label) +
          "</option>",
      )
      .join("") +
    "</select></label>"
  );
}
export function keyFields(n, track, step) {
  let item = live.keys[n] || {},
    dual = ["Higgsfield", "Spaceship"].includes(n);
  return card(
    n,
    row(
      badge(
        item.status || "Not added",
        item.status === "Connected" ? "green" : "",
      ),
      e(item.mask || ""),
    ) +
      field(dual ? "Key ID" : "New API key", "secret", "", "password") +
      (dual ? field("Secret", "secret2", "", "password") : "") +
      row(
        b("Save key", "savekey", n, "primary"),
        b("Test (free)", "testkey", n),
        b("Remove", "removekey", n),
      ) +
      link("Get a key", channels[n][1]) +
      (n === "OpenAI" && step
        ? modelSelect(
            "step-model",
            live.tracks[track]?.models?.[step] || "",
            true,
          ) + b("Save step model", "stepmodel")
        : "") +
      '<p class="fine">Copy a key from your account’s developer or API settings.</p>',
  );
}
export function settingsView(C) {
  return (
    `<div class="stepshead"><span class="eyebrow">Workspace settings</span><h1>Settings and keys</h1><p>Paste a key once. Every step can use it through your local helper.</p></div>` +
    card(
      "Connections",
      Object.entries(channels)
        .map(
          ([n, [desc]]) =>
            `<div class="listline spread"><div><b>${n}</b><p>${e(desc)}</p><small class="mono">${C.demo ? "demo••••" + n.slice(0, 2).toLowerCase() : e(live.keys[n]?.mask || "")}</small></div><div>${badge(C.demo ? "Demo connection" : live.keys[n]?.status || "Not added", C.demo ? "violet" : "")} ${b(C.demo ? "Use my real key" : "Manage", "key", n)}</div></div>`,
        )
        .join(""),
    ) +
    card(
      "Writing model",
      modelSelect("cfg-model", live.config.model || catalog.default) +
        '<p class="fine">OpenAI models use your API key. Choose Fable to write through your local Hermes server.</p>' +
        b("Save writing model", "savemodel"),
    ) +
    card(
      "Limits and accounts",
      `<div class="formgrid">${Object.entries(configFields)
        .map(([k, l]) =>
          field(
            l,
            "cfg-" + k,
            live.config[k] ?? { cap: 10, robotCap: 1 }[k] ?? "",
            ["cap", "robotCap"].includes(k) ? "number" : "text",
          ),
        )
        .join("")}</div>${b("Save settings", "saveconfig")}`,
    ) +
    card(
      "Private registrar login",
      "<p>Only used in a ScaledMail order you confirm. Stored with your other credentials.</p>" +
        b("Manage registrar login", "registrar"),
    ) +
    card(
      "Tools and partners",
      row(
        ...Object.entries(channels).map(([n, a]) => link(n, a[1])),
        link("Zernio", "https://zernio.link/jordan-rafealov"),
        link("Wispr Flow", "https://ref.wisprflow.ai/jordan-rafealov-tvka"),
      ) +
        "<p>Partner links may pay the person who shared this app. Same price for you. Apify code: 25JORDAN.</p>",
    ) +
    card(
      "Research robots",
      "<p>Live runs use the current pricing model returned by Apify. Enter the pay-per-event actor and input on the research step. The helper reserves the full run cap.</p>",
    ) +
    card("Demo workspace", b("Reset the demo", "resetdemo"))
  );
}
const operations = (C) => {
  let { s, i, t } = C;
  let n = s === "clients" ? i + 2 : i;
  if (s === "build" && i === 0) return ["note"];
  if (s === "outreach" || s === "clients")
    return [
      ["batch", "robot"],
      ["verify"],
      [
        "availability",
        "register",
        "orderMail",
        "writeDNS",
        "readDNS",
        "connectMail",
        "inboxes",
        "domains",
        "workspaces",
      ],
      ["write", "campaign", "leads", "test", "activate"],
      ["analytics", "pause", "activate"],
      ["replies", "write"],
    ][n];
  if ((s === "launch" || s === "paid") && i === 1)
    return ["hidden", "publish", "hide"];
  if (s === "work")
    return i === 0
      ? ["batch", "robot"]
      : i === 2
        ? ["media", "mediaStatus"]
        : i === 1 && t === "Airbnb Photos"
          ? ["localphoto"]
          : ["write"];
  if (s === "build" && i === 4) return ["book"];
  if (s === "build" && i === 1) return ["batch", "write", "robot"];
  if ((s === "build" && i === 5) || (s === "launch" && i === 0))
    return ["batch", "write", "robot"];
  if (s === "paid") return i === 2 ? ["payreply"] : ["note"];
  return ["write"];
};
export const opNames = {
  batch: "Research public sources",
  book: "Write the product",
  availability: "Check six domain names",
  register: "Review domain purchase",
  orderMail: "Review inbox subscription",
  writeDNS: "Review DNS changes",
  readDNS: "Check DNS records",
  connectMail: "Connect and warm inboxes",
  mediaStatus: "Check media job",
  note: "Save workspace notes",
  write: "Generate draft",
  robot: "Run research actor",
  verify: "Find verified email",
  hidden: "Create hidden listing",
  publish: "Make visible",
  hide: "Hide listing",
  campaign: "Create paused campaign",
  leads: "Add verified leads",
  activate: "Start sending",
  test: "Send one test email",
  analytics: "Read campaign totals",
  pause: "Pause sending",
  replies: "Read campaign replies",
  inboxes: "List sending inboxes",
  domains: "List sending domains",
  workspaces: "List mail workspaces",
  media: "Create sample media",
  payreply: "Send payment reply",
  localphoto: "Measure photo",
};
export function liveView(C) {
  let track = live.tracks[C.t] || {},
    o = operations(C),
    id = C.s + "-" + C.i,
    result = track.results?.[id],
    output = result
      ? card(
          "Saved result",
          `<div class="pre">${e(result)}</div>` +
            row(b("Copy", "copy", result), b("Download", "livedown", result)),
        )
      : '<div class="hiddenlive"><b>Your result will appear here.</b><p>Review the inputs, then choose the action above.</p></div>';
  const forms = [
    field(
      "Product or service name",
      "live-title",
      track.title ||
        (["Ebook", "Course", "Coaching"].includes(C.t) ? "" : offers[C.t]),
    ),
    field(
      "Brief, source notes or reply to draft",
      "live-notes",
      track.notes?.[id] ||
        (C.s === "build" && C.i === 1 ? track.notes?.["build-0"] : "") ||
        "",
      "area",
    ),
  ];
  if (o.includes("book"))
    forms.push(
      field(
        "Outline, one title per line",
        "book-outline",
        (
          track.book?.titles ||
          (
            (track.results?.["build-3"] || "").match(
              /^\s*(?:\d+[.)]|(?:Chapter|Lesson|Week) \d+[:.])\s+.+$/gim,
            ) || []
          ).slice(0, 20)
        ).join("\n"),
        "area",
      ),
    );
  if (o.includes("batch") && C.s === "outreach")
    forms.push(
      select(
        "live-platform",
        ["Instagram", "TikTok", "YouTube", "LinkedIn"],
        "Instagram",
      ),
    );
  if (o.includes("robot"))
    forms.push(
      field(
        "Pay-per-event Apify actor ID (owner~actor)",
        "actor",
        track.actor || "",
      ),
      field(
        "Actor input JSON",
        "actor-input",
        track.actorInput || "{}",
        "area",
      ),
    );
  if (o.includes("verify"))
    forms.push(
      field(
        "Public business LinkedIn profile URLs, one per line (up to 25 new profiles)",
        "lookup",
        "",
        "area",
      ),
    );
  if (o.includes("campaign") || o.includes("payreply"))
    forms.push(
      field("Dedicated sending inbox", "sender", track.sender || "", "email"),
      field("Email subject", "live-subject", track.subject || ""),
      field("Reviewed email body", "live-body", track.body || "", "area"),
    );
  if (o.includes("campaign"))
    forms.push(
      field(
        "Optional follow up subject, day 3",
        "follow-subject",
        track.followSubject || "",
      ),
      field(
        "Optional follow up body, day 3",
        "follow-body",
        track.followBody || "",
        "area",
      ),
    );
  if (o.includes("test"))
    forms.push(field("One test recipient", "test-to", "", "email"));
  if (o.includes("payreply"))
    forms.push(
      field("Reply ID from the interested client", "reply-id"),
      field("Whop checkout URL", "checkout-url", track.checkout || ""),
    );
  if (o.includes("hidden"))
    forms.push(
      field("Price in USD", "live-price", track.price ?? 37, "number"),
      field("Quantity when visible", "live-stock", 1, "number"),
    );
  if (o.includes("media"))
    forms.push(
      field("Higgsfield model path", "media-model", ""),
      field(
        "Model input JSON (prompt and media URLs)",
        "media-input",
        "{}",
        "area",
      ),
      "<p>The helper requests a provider estimate for these exact settings before confirmation.</p>",
    );
  if (o.includes("inboxes"))
    forms.push(
      field(
        "Business name for six suggestions",
        "domain-brand",
        live.config.business || "Dearwork",
      ),
      field(
        "Dedicated domain to check or order",
        "dedicated-domain",
        track.domain || "",
      ),
      field("Sender first name", "first-name"),
      field("Sender last name", "last-name"),
      field(
        "MX and TXT records from your provider (JSON array)",
        "mail-dns",
        "[]",
        "area",
      ),
    );
  if (o.includes("localphoto"))
    forms.push(
      '<label class="field">Photo to measure<input type="file" accept="image/*" id="photo-input"></label>',
    );
  const research = track.research?.[id] || {};
  const safeLinks = (rows) =>
    [
      ...new Set(
        rows
          .flatMap((r) => [
            r.url,
            r.webUrl,
            r.productUrl,
            r.listingUrl,
            r.videoUrl,
            r.postUrl,
          ])
          .filter((u) => typeof u === "string" && /^https:\/\//.test(u)),
      ),
    ].slice(0, 8);
  const researchRows = Object.entries(research)
    .map(([platform, r]) =>
      card(
        platform,
        badge(r.status, r.status === "Done" ? "green" : "orange") +
          "<p>" +
          e(r.error || (r.count || 0) + " public records") +
          "</p>" +
          (r.status === "Failed"
            ? b("Retry this source", "researchretry", platform)
            : "") +
          (r.rows?.length
            ? "<details><summary>Inspect source records</summary><pre>" +
              e(JSON.stringify(r.rows, null, 2)) +
              "</pre></details>" +
              row(
                ...safeLinks(r.rows).map((u, i) =>
                  link("Source " + (i + 1), u),
                ),
              )
            : ""),
      ),
    )
    .join("");
  const bk = track.book;
  const built =
    o.includes("book") && bk
      ? card(
          "Product manuscript",
          Object.entries(bk.units)
            .map(
              ([k, txt]) =>
                '<details class="listline"><summary>' +
                e(bk.titles[k]) +
                '</summary><div class="pre">' +
                e(txt) +
                "</div>" +
                b("Edit unit", "editliveunit", k) +
                "</details>",
            )
            .join("") +
            row(b("Open PDF", "livepdf"), b("Download PDF", "livepdfdown")),
        )
      : "";
  const inbox = o.includes("replies")
    ? card(
        "Reply assistant",
        b(
          (live.polling || []).includes(C.t)
            ? "Turn off minute checks"
            : "Check for replies every minute",
          "polltoggle",
        ) +
          (track.replies || [])
            .map((r) =>
              card(
                r.from || "Received message",
                badge(r.label) +
                  '<p class="pre">' +
                  e(r.message) +
                  "</p>" +
                  (r.draft
                    ? '<div class="boxnote"><b>Local template draft, not sent</b><p>' +
                      e(r.draft) +
                      "</p>" +
                      b("Copy draft", "copy", r.draft) +
                      b("Use in writing brief", "replybrief", r.message) +
                      "</div>"
                    : "<p>Left for human review.</p>"),
              ),
            )
            .join(""),
      )
    : "";
  const extras = o.includes("inboxes")
    ? card(
        "Domain and mailbox setup",
        "<p>Check six names, review one purchase, then order two inboxes for that domain. Add the DNS records from your mail provider and check them before enabling warmup.</p>" +
          row(
            link("Spaceship", channels.Spaceship[1]),
            link("ScaledMail", channels.ScaledMail[1]),
            link("Instantly", channels.Instantly[1]),
          ),
      )
    : "";
  return (
    card(
      "Live inputs",
      forms.join("") +
        row(
          ...o.map((n, j) =>
            b(opNames[n], "liveop", n, j === 0 ? "primary" : ""),
          ),
        ),
    ) +
    extras +
    inbox +
    researchRows +
    built +
    output +
    (C.s === "work" && C.i === 2 && C.t === "Ad Remakes"
      ? b("Design an ad picture", "composead")
      : C.s === "work" && C.i === 2 && C.t === "Airbnb Photos"
        ? b("Compare original and edited photos", "comparephotos")
        : "")
  );
}
export function primaryOp(C) {
  return operations(C)[0];
}
