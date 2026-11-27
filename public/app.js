import { readerAction } from "./page-reader.js";
import { demoTrack, pathView, practice, fillExample, launchPage } from "./walkthrough.js";
import {
  formats,
  hustles,
  offers,
  prices,
  channels,
  sections,
  steps,
  labels,
  groups,
  product,
  replies,
  names,
  pitch,
  slug,
} from "./catalog.js";
import {
  e,
  b,
  icon,
  book,
  card,
  row,
  grid,
  badge,
  stats,
  field,
  table,
  select,
  link,
  list,
  val,
  read,
  download,
  modal,
  close,
  toast,
  copy,
} from "./ui.js";
import { sources, units } from "./book.js";
import { productView, chapterText, kit, kitTabs } from "./product.js";
import { campaignView, replyView } from "./campaign.js";
import { planningView } from "./planning.js";
import { studio, selectChapter, upgradeReader } from "./studio.js";
import { outreachPage, useTemplate } from "./outreach.js";
import { serviceView, pkg, filesFor } from "./services.js";
import {
  live,
  api,
  refresh,
  liveView,
  settingsView,
  keyFields,
  configFields,
  opNames,
  primaryOp,
} from "./live.js";
import {
  moviePreview,
  compositionForm,
  composeAd,
  compareForm,
  compareFiles,
} from "./preview.js";
const root = document.querySelector("#app"),
  dialog = document.querySelector("#modal");
const base = () => ({
  f: "Ebook",
  h: "Airbnb Photos",
  tracks: {},
  read: {},
  log: [],
  done: {},
});
let data = read("ps-demo-3", base()),
  demo = true,
  screen = "home",
  idx = 0,
  filter = "All",
  selected = "",
  alt = "",
  navOpen = false,
  railOpen = false,
  pending = null,
  tour = null,
  timer = 0,
  metrics = { before: [76, 35], after: [148, 68], changed: 96 },
  helper = true,
  working = false;
const seedEvents = [
  [
    "book",
    "Product draft ready",
    "10 chapters with public source notes",
    "9:42 AM",
  ],
  ["users", "Buyer list checked", "7 matching creator profiles", "9:38 AM"],
  [
    "mail",
    "Email sequence drafted",
    "First email and one follow up",
    "9:33 AM",
  ],
  ["image", "Sample photo edited", "Airbnb Photo Pack", "9:24 AM"],
  ["store", "Store page prepared", "Hidden listing with stock 0", "9:19 AM"],
];
const state = () => {
  let { f, h } = data,
    t = ["work", "clients", "paid"].includes(screen) ? h : f;
  if (!data.tracks[t]) data.tracks[t] = {};
  return {
    s: screen,
    i: idx,
    f,
    h,
    t,
    d: data.tracks[t],
    demo,
    filter,
    selected,
    alt,
    read: data.read,
    metrics,
  };
};
function save() {
  localStorage.setItem("ps-demo-3", JSON.stringify(data));
}
function log(title, detail = "", glyph = "check") {
  if (demo) {
    data.log.unshift([
      glyph,
      title,
      detail,
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ]);
    data.log = data.log.slice(0, 60);
    save();
  }
}
const nextStep = () => {
  let { s, i, f, h } = state(),
    ss = steps(s, f, h);
  if (i + 1 < ss.length) return [s, i + 1];
  let next = {
    build: "outreach",
    outreach: "launch",
    launch: "home",
    work: "clients",
    clients: "paid",
    paid: "home",
  }[s];
  return [next, 0];
};
function go(s, i = 0) {
  screen = s;
  idx = Number(i);
  navOpen = false;
  railOpen = false;
  const hash = `#${s}${groups.includes(s) ? "/" + (idx + 1) : ""}`;
  if (location.hash !== hash) history.pushState(null, "", hash);
  render();
  document.querySelector("main")?.scrollTo(0, 0);
}
function route() {
  const [s, n] = location.hash.slice(1).split("/");
  screen = [
    ...groups,
    "home",
    "unibox",
    "settings",
    "hustles",
    "summary",
  ].includes(s)
    ? s
    : "home";
  idx = groups.includes(screen)
    ? Math.max(
        0,
        Math.min(
          steps(screen, data.f, data.h).length - 1,
          (Number(n) || 1) - 1,
        ),
      )
    : 0;
  render();
}
function milestones() {
  const t = (demo ? data.tracks[data.f]?.practice : live.tracks[data.f]) || {};
  return [t.completedSteps?.length === 7 && t.completedSteps.every(Boolean), Boolean(t.verified?.length),
    t.campaignStatus === "Sending", Boolean(t.visible)];
}
const progress = () => milestones().filter(Boolean).length;
function nav() {
  let C = state(),
    unread = [C.f, ...hustles]
      .flatMap(replies)
      .filter((r) => !data.read[r.id]).length;
  const navTop = (s, n, g, x = "") =>
    `<button class="navitem ${s === screen ? "active" : ""}" data-act="nav" data-v="${s}">${icon(g)}${n}${x}</button>`;
  const group = (s, j) =>
    `<button class="navitem ${screen === s ? "active" : ""}" data-act="step" data-v="${s}/0"><span class="ordinal">${(j % 3) + 1}</span>${e(labels[s])}</button>${
      screen === s
        ? '<div class="subnav">' +
          steps(s, C.f, C.h)
            .map((a, i) =>
              b(
                (s === "build" && (demo ? C.d.practice : live.tracks[C.t])?.completedSteps?.[i] ? "✓ " : "") + a.name,
                "step",
                s + "/" + i,
                "navitem " + (i === idx ? "active" : ""),
              ),
            )
            .join("") +
          "</div>"
        : ""
    }`;
  return `<aside class="nav ${navOpen ? "open" : ""}"><div class="brand"><img src="/mark.svg" alt=""><div><strong>Dearwork</strong><small>Make it, sell it, get clients</small></div>${b("×", "menu", "", "mobile quiet")}</div><div class="navscroll">${navTop("home", "Home", "home")}${navTop("unibox", "Unibox", "mail", demo ? '<span class="count">' + unread + "</span>" : "")}${navTop("settings", "Settings", "settings")}<span class="label">Digital product</span><div class="pick">${icon("book")}${select("format", formats, C.f)}</div>${groups.slice(0, 3).map(group).join("")}<span class="label">AI side hustles</span><div class="pick">${icon("layers")}${select("hustle", hustles, C.h)}</div>${groups.slice(3).map(group).join("")}</div><div class="navfoot"><div class="seg">${b("Demo", "mode", "demo", demo ? "sel" : "")}${b("Live", "mode", "live", !demo ? "sel" : "")}</div>${demo ? b("Run live demo", "tour", "", "money", "play") + '<div class="footlinks">' + b("Load finished example", "loadall", "", "quiet", "layers") + b("Saved", "saved", "", "quiet", "folder") + "</div>" : ""}<div class="costline"><span>${demo ? "Demo, nothing spent" : "Session budget reserved"}</span><b class="mono">$${demo ? "0.00" : Number(live.reserved || 0).toFixed(2)}${demo ? "" : " / $" + Number(live.config.cap).toFixed(2)}</b></div></div></aside>`;
}
function rail() {
  let events = demo
    ? [...data.log, ...seedEvents].slice(0, 6)
    : (live.events || []).slice(0, 6);
  let words = demo
    ? units("Ebook").map(chapterText).join(" ").split(/\s+/).length
    : Object.values(live.tracks)
        .flatMap((t) => Object.values(t.results || {}))
        .join(" ")
        .split(/\s+/)
        .filter(Boolean).length;
  return `<aside class="rail ${railOpen ? "open" : ""}">${b("Close", "rail", "", "quiet railclose")}<span class="eyebrow">Activity</span><div class="spread"><h2>What the app did</h2>${badge(demo ? "Demo" : "Live", "green")}</div><div class="sectionhead"><span class="label">Workspace totals</span></div>${stats(
    [
      [words.toLocaleString(), "Workspace draft words"],
      [
        demo
          ? 18 + data.log.filter((x) => x[0] === "search").length
          : live.runs || 0,
        "Searches and runs",
      ],
    ],
  )}<div class="sectionhead"><span class="label">Recent activity</span>${icon("clock")}</div>${events.length ? events.map(([g, n, desc, time], i) => `<div class="event"><span class="ibox ${["", "greenbox", "", "orangebox"][i % 4]}">${icon(g)}</span><div><b>${e(n)}</b><small>${e(desc)}</small><time>${e(time)}</time></div></div>`).join("") : '<p class="small">Your first confirmed action will appear here.</p>'}<details><summary>Tools connected <small class="dim">${demo ? Object.keys(channels).length : Object.keys(channels).filter((k) => live.keys[k]?.status === "Connected").length} / ${Object.keys(channels).length}</small></summary>${Object.keys(
    channels,
  )
    .map(
      (k) =>
        '<div class="listline small">' +
        e(k) +
        " · " +
        (demo ? "Demo" : e(live.keys[k]?.status || "Not added")) +
        "</div>",
    )
    .join(
      "",
    )}</details><div class="safety"><span class="label">Workspace safeguards</span>${["Nothing sends without your yes", "Review every cost first", "Keys stay on this computer"].map((s) => "<p>" + icon("shield") + s + "</p>").join("")}</div></aside>`;
}
const thumb = (type) =>
  ({
    shelf: book(),
    leads:
      '<div class="minilist"><b>CREATOR SHORTLIST</b>' +
      ["Mira (demo)", "Jo (demo)", "Kai (demo)"]
        .map(
          (n) =>
            "<div><i>" + n[0] + "</i>" + n + "<span>✓ Verified</span></div>",
        )
        .join("") +
      "</div>",
    hustle: "",
    launch:
      '<div class="mockpost"><small>LAUNCH WEEK · DAY 01</small><b>Small plates,<br>big ideas.</b></div>',
  })[type];
function home() {
  const tools = [
    [
      "Digital Product",
      "Build an ebook, course or coaching offer.",
      "shelf",
      "build",
      "Product studio",
    ],
    [
      "Leads & Outreach",
      "Find buyers and prepare your campaign.",
      "leads",
      "outreach",
      "Buyer list",
    ],
    [
      "AI Side Hustles",
      "Make a client sample in one of three services.",
      "hustle",
      "hustles",
      "Photo sample",
    ],
    [
      "Launch",
      "Prepare your store page and launch week.",
      "launch",
      "launch",
      "Launch kit",
    ],
  ];
  return `<div class="crumb">Workspace &nbsp;/&nbsp; <b>Home</b></div><div class="titleline"><h1>Workspace overview</h1>${badge(demo ? "●  Demo mode" : "●  Live mode", demo ? "violet" : "green")}</div><section class="hero"><div class="herotext"><span class="eyebrow">Digital product studio</span><h2>Make a product.<br>Bring it to market.</h2><p>Make a digital product, find buyers, email them, and launch it.</p><div class="actions">${b("Start here: make a product", "step", "build/0", "primary", "arrow")}${b("Add your keys", "nav", "settings", "quiet", "key")}</div></div><div class="still"><i class="orbit"></i><i class="orbit o2"></i>${book()}<span class="sticker">EBOOK<br>EDITION</span></div></section><div class="sectionhead"><h2>Your path</h2><small>${progress()} of 4 done</small></div><div class="stagebar">${[
    ["Make it", "Build a product", "book", "build/0"],
    ["Find buyers", "Find a good fit", "users", "outreach/0"],
    ["Send", "Start a campaign", "send", "outreach/3"],
    ["Launch", "Open your store", "store", "launch/0"],
  ]
    .map(
      ([n, sub, g, v], i) =>
        `<button data-act="step" data-v="${v}"><span class="ibox ${milestones()[i] ? "greenbox" : i === 2 ? "orangebox" : ""}">${icon(g)}</span><span><strong>${n}</strong><small>${sub}</small></span></button>`,
    )
    .join(
      "",
    )}</div><div class="sectionhead"><h2>Your tools</h2><small>4 workspaces</small></div>${grid(tools.map(([n, desc, ty, v, tag]) => `<button class="toolcard" data-act="nav" data-v="${v}"><div class="thumb ${ty}">${thumb(ty)}<span class="chiptag">${tag.toUpperCase()}</span></div><div class="toolinfo"><h3>${n}</h3><span class="go">${icon("up")}</span><p>${desc}</p></div></button>`))}<div class="safefoot"><span>${icon("shield")} ${demo ? "Saved examples. Nothing spent or sent." : "Live mode uses your own provider accounts."}</span><span>${icon("key")} Keys stay here</span></div>`;
}
function services() {
  return (
    '<div class="stepshead"><span class="eyebrow">AI side hustles</span><h1>Pick a side hustle</h1><p>Make one useful sample and offer it to a client.</p></div>' +
    grid(
      hustles.map((n, i) =>
        card(
          n,
          `<img class="photo" src="/media/${["room.jpg", "roof-ad-1.jpg", "desk.jpg"][i]}" alt="${e(n)} sample"><p>${["Fix dark listing photos for hosts.", "Remake local ads with clearer copy.", "Make original short videos for channels."][i]}</p><h3>$${prices[n]} ${i === 1 ? "per month" : "per pack"}</h3><small>Tool cost $${[1.5, 1, 3][i]} est. · ${i + 1} hr est.</small><div>${b("Start this hustle", "starthustle", n, "primary")}</div>`,
        ),
      ),
      "three",
    )
  );
}
function stepPage() {
  const ctx = state();
  const project = demo ? demoTrack(ctx) : live.tracks[ctx.t] || {};
  const source = demo ? {keys:{Instantly:{status:"Simulated"}},config:{name:"Alex",business:"Dearwork sample",address:"Example mailing address"}} : live;
  const trail = screen === "build" ? pathView(ctx,project) : demo ? '<div class="crumb">Practice project · simulated data</div>' : "";
  let shared = "";
  if (screen === "build" && idx === 0) {
    shared = '<div class="stepshead"><span class="eyebrow">Build it · Step 1 of 7</span><h1>Your idea</h1><p>Compare demand signals, then choose the idea to research.</p>' +
      row(b("Find me an idea","liveop","discover","primary"),b("See what sells","next","","","arrow")) +
      '</div><div class="stack">'+liveView(ctx,project)+'</div>';
  } else if (screen === "build" && [2,3].includes(idx)) shared = planningView(ctx,project);
  else if (screen === "launch") shared = launchPage(ctx,project);
  else if (!demo || ["build","outreach"].includes(screen)) shared = studio(ctx,project) || outreachPage(ctx,project,source);
  if (shared) return trail + shared;
  let C = state(),
    all = steps(screen, C.f, C.h),
    st = all[idx],
    [ns, ni] = nextStep(),
    next = ns === "home" ? "Home" : steps(ns, C.f, C.h)[ni].name,
    side = groups.indexOf(screen) > 2;
  return `<div class="crumb">${side ? e(C.h) : e(C.f)} &nbsp;/&nbsp; <b>${e(labels[screen])}</b></div>${side ? '<div class="strip">' + ["Do the work", "Reach out", "Get paid"].map((v, j) => b(v, "step", ["work/0", "clients/0", "paid/0"][j])).join("") + "</div>" : ""}<div class="stepshead"><span class="eyebrow">${e(labels[screen])} · Step ${idx + 1} of ${all.length}</span><h1>${e(st.name)}</h1><p>${e(st.desc)}</p>${row(b(demo ? st.action : opNames[primaryOp(C)], "main", "", "primary", "arrow"), ...(demo ? [b("Demo this step", "movie", "", "", "play")] : []))}<div class="stagemsg">Do this now: ${e(demo ? st.action : opNames[primaryOp(C)])}.</div></div><div class="info"><div><span class="label">Replaces</span>${e(st.job)}</div><div><span class="label">Saves</span><span class="peach">${e({ build: "Drafting time", outreach: "List research", launch: "Launch prep", work: "Client prep", clients: "Outreach prep", paid: "Admin time" }[screen])}</span></div><div><span class="label">Costs · ${e(st.time)}</span>${demo ? "$0 in Demo" : e(st.cost)}</div></div><div class="toolrow">Uses ${st.tools.map((n) => b((demo ? "● " : "") + n, "key", n)).join("") || "Local workspace"}</div><div class="stack">${!demo ? liveView(C) : screen === "outreach" || screen === "clients" ? campaignView(C) : side ? serviceView(C) : productView(C)}</div><div class="nextline">${badge(demo ? "✓ Done · saved example" : live.tracks[C.t]?.results?.[screen + "-" + idx] ? "Saved result" : "Ready", "green")}${b("Next: " + next, "next", "", "primary", "arrow")}</div>`;
}
function summary() {
  return (
    '<div class="stepshead"><span class="eyebrow">Demo summary</span><h1>Everything this app just did</h1><p>A saved walkthrough of the digital product and Airbnb Photo Pack workflows.</p></div>' +
    stats([
      [
        units("Ebook").map(chapterText).join(" ").split(/\s+/).length,
        "Book words",
      ],
      [18, "Searches and runs"],
      [30, "Emails sent (demo)"],
      [24, "Replies"],
      [4, "Whop pages"],
      ["$0.00", "Spent"],
    ]) +
    card(
      "Walkthrough",
      table(
        ["Step", "Replaces", "Demo cost"],
        sequence().map(([s, i]) => {
          let st = steps(s, data.f, "Airbnb Photos")[i];
          return [e(st.name), e(st.job), "$0"];
        }),
      ),
    ) +
    b("Back to Home", "nav", "home")
  );
}
function render() {
  let scroll = document.querySelector("main")?.scrollTop || 0,
    ns = document.querySelector(".navscroll")?.scrollTop || 0;
  const content =
    screen === "home"
      ? home()
      : screen === "settings"
        ? settingsView(state())
        : screen === "hustles"
          ? services()
          : screen === "summary"
            ? summary()
            : screen === "unibox"
              ? '<div class="stepshead"><span class="eyebrow">Campaign inbox</span><h1>Unibox</h1><p>Every reply from every campaign. Open a reply to review its draft.</p></div><div class="stack">' +
                (demo
                  ? replyView(state(), true)
                  : card(
                      "Your live inbox",
                      "<p>Read real replies in Instantly, then open the campaign’s Replies step to draft an answer.</p>" +
                        link(
                          "Open Instantly inbox",
                          "https://app.instantly.ai/app/unibox",
                        ),
                    )) +
                "</div>"
              : stepPage();
  root.innerHTML = `<div class="app">${nav()}<header class="topbar">${b("Menu", "menu", "", "mobile", "menu")}<span class="small"><b>Your path</b> <span class="dim">· ${progress()} of 4 done</span></span><div class="pathmini">${["Make it", "Find buyers", "Send", "Launch"].map((x, i) => (i ? "<i></i>" : "") + '<span class="dot ' + (milestones()[i] ? "" : i === milestones().indexOf(false) ? "now" : "later") + '"></span>' + x).join("")}</div><div class="toptools">${b("3 side hustles", "nav", "hustles", "hidephone", "layers")}${b(document.documentElement.dataset.theme === "dark" ? "Light" : "Dark", "theme", "", "", "sun")}${b("Activity", "rail", "", "mobile railbtn", "wave")}</div></header><main id="main"><div class="canvas">${helper ? "" : '<div class="notice">Local helper is offline. Run <code>python app.py</code> from the project folder.</div>'}${content}</div></main>${rail()}</div>`;
  document.querySelector("main").scrollTop = scroll;
  document.querySelector(".navscroll").scrollTop = ns;
  document.title =
    (labels[screen] || screen[0].toUpperCase() + screen.slice(1)) +
    " | Dearwork";
}
function confirmBox(title, desc, price, fn) {
  pending = fn;
  modal(
    title,
    `<p class="pre">${e(desc)}</p><h2 class="peach mono">${e(price)}</h2>${row(b("Confirm", "confirm", "", "primary"), b("Cancel", "cancel"))}`,
  );
}
async function setMode(m) {
  stopMovie();
  if (m === "live") {
    await refresh();
    demo = false;
  } else {
    for (const track of live.polling || [])
      await api("pollstop", {
        track,
        step: hustles.includes(track) ? "clients-3" : "outreach-5",
      });
    demo = true;
  }
  render();
}
function mainAction() {
  let C = state(),
    { s, i, d } = C;
  if (!demo) return liveAction(primaryOp(C));
  if (s === "build" && i === 0) {
    if (!val("idea")) throw Error("Add an idea first.");
    d.idea = val("idea");
    d.kind = val("idea-kind");
  } else if (s === "build" && i === 5) d.handle = val("handle");
  else if (s === "paid" && i === 0) {
    for (let k of ["price", "fee", "toolCost"]) {
      let n = Number(val(k));
      if (!Number.isFinite(n) || n < 0) throw Error("Enter a valid amount.");
      d[k] = n;
    }
  } else if (s === "launch" && i === 0)
    d.price = Math.max(0, Number(val("offer-price")));
  else if (s === "outreach" && i === 0) {
    for (let k of ["niche", "platform"]) d[k] = val(k);
    for (let k of ["minFollowers", "maxFollowers", "minViews"])
      d[k] = Math.max(0, Number(val(k)));
  } else if ((s === "outreach" && i === 3) || (s === "clients" && i === 1))
    return mailFlow("draft");
  else if ((s === "outreach" && i === 4) || (s === "clients" && i === 2))
    return boardToggle();
  else if ((s === "launch" || s === "paid") && i === 1)
    return publish("hidden");
  else if (s === "paid" && i === 2) return payConfirm();
  else if (s === "work" && i === 0) {
    for (let k of ["city", "niche", "business"]) if (val(k)) d[k] = val(k);
  } else return movie(false);
  log(steps(s, C.f, C.h)[i].name + " saved", offers[C.t]);
  save();
  render();
  toast("Saved to this demo workspace.");
}
function saveMail() {
  let { d } = state();
  d.mails ??= {};
  d.mails[d.mailTab || 0] = [val("subject"), val("body")];
  save();
}
function mailFlow(v) {
  let { d, t } = state();
  if (v === "test" && !/^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/.test(val("testaddress")))
    throw Error("Enter one test address.");
  if (v === "leads" && !d.drafted) throw Error("Make the paused draft first.");
  if (v === "start" && !d.added) throw Error("Add checked leads first.");
  saveMail();
  confirmBox(
    "Review " +
      { draft: "draft", leads: "leads", start: "sending", test: "test email" }[
        v
      ],
    v === "test"
      ? "Simulate a single test to " + val("testaddress")
      : `Selling: ${offers[t]}. ${v === "start" ? "Start the demo send board." : v === "draft" ? "Create a paused campaign." : "Add checked demo leads."}`,
    "$0 · demo",
    () => {
      if (v === "draft") {
        d.drafted = true;
        d.campaign = "Paused";
      }
      if (v === "leads") d.added = true;
      if (v === "start") {
        d.sent = 0;
        d.campaign = "Sending";
        go(screen, idx + 1);
      }
      log("Campaign updated", offers[t], "mail");
      save();
      render();
    },
  );
}
function boardToggle() {
  let { d, t } = state(),
    on = d.campaign === "Sending";
  confirmBox(
    on ? "Pause campaign" : "Resume campaign",
    "Selling: " +
      offers[t] +
      " (demo). " +
      (on
        ? "Counters will hold here."
        : "The demo send timeline will continue."),
    "$0 · demo",
    () => {
      if (!on && d.sent === 30) d.sent = 0;
      d.campaign = on ? "Paused" : "Sending";
      log(d.campaign, offers[t], "send");
      save();
      render();
    },
  );
}
function publish(v) {
  const { d, t } = state();
  confirmBox(
    v === "visible" ? "Make it visible?" : "Create or keep a hidden listing",
    offers[t] +
      (v === "visible"
        ? " will have one available demo unit."
        : " will have zero stock."),
    "$0 · demo",
    () => {
      d.visible = v === "visible";
      log("Store visibility saved", offers[t], "store");
      save();
      render();
    },
  );
}
function payConfirm() {
  confirmBox(
    "Send the pay link?",
    "Simulate one payment email to the interested demo client.",
    "$0 · demo",
    () => {
      log("Pay link reviewed", "Demo payment email", "mail");
      render();
    },
  );
}
function sequence() {
  return groups.flatMap((s) =>
    steps(s, data.f, "Airbnb Photos").map((_, i) => [s, i]),
  );
}
function movie(full) {
  stopMovie();
  if (full) {
    data.h = "Airbnb Photos";
    save();
  }
  const seq = full ? sequence() : [[screen, idx]];
  tour = { seq, pos: 0, elapsed: 0, speed: 1, paused: false, full };
  if (full) fillExample({...state(), t:data.f, d:data.tracks[data.f] ||= {}});
  go(...seq[0]);
  drawMovie();
  timer = setInterval(() => {
    if (!tour || tour.paused) return;
    tour.elapsed += 0.2 * tour.speed;
    if (tour.elapsed >= 6.4) {
      advanceMovie();
      return;
    }
    drawMovie();
  }, 200);
}
function advanceMovie() {
  if (!tour) return;
  let { s, i, f, h } = state();
  if (s === "outreach" && i === 4)
    data.done[f] = Math.max(3, data.done[f] || 2);
  if (s === "launch" && i === 2) data.done[f] = 4;
  log(steps(s, f, h)[i].name + " complete", "Saved demo run", "search");
  if (tour.pos + 1 >= tour.seq.length) {
    let full = tour.full;
    stopMovie();
    if (full) go("summary");
    else
      modal(
        "Done. Your result is ready.",
        row(
          b("See the results", "close"),
          b("Next", "movieNext", "", "primary"),
        ),
      );
    return;
  }
  tour.pos++;
  tour.elapsed = 0;
  go(...tour.seq[tour.pos]);
  drawMovie();
}
function stopMovie() {
  clearInterval(timer);
  tour = null;
  document.querySelector("#player").innerHTML = "";
}
function drawMovie() {
  if (!tour) return;
  let C = state(),
    st = steps(screen, C.f, C.h)[idx],
    p = tour.elapsed / 6.4,
    lines =
      screen === "build" && idx === 4
        ? units(C.f).map((c) => "Writing: " + c.title)
        : screen === "work" && idx === 2
          ? [
              "Reading original media",
              "Comparing the sample",
              "Preparing finished files",
            ]
          : screen === "outreach" && idx === 4
            ? [
                "Checking dedicated inbox",
                "Simulating deliveries",
                "Reading saved replies",
              ]
            : [
                "Opening " + (st.tools.join(" and ") || "local workspace"),
                "Reviewing " + st.name.toLowerCase(),
                "Loading saved results",
              ];
  let shown = lines[Math.min(lines.length - 1, Math.floor(p * lines.length))];
  document.querySelector("#player").innerHTML =
    `<section class="player"><span class="label">Demo run · saved results</span><div class="spread"><b>Step ${tour.pos + 1} of ${tour.seq.length} · ${e(st.name)}</b><span class="mono peach">$0 spent</span></div>${moviePreview(C, p)}<p class="line">${e(shown)} · ${tour.elapsed.toFixed(1)}s</p><div class="bar"><i style="width:${p * 100}%"></i></div>${row(b(tour.speed + "x", "speed"), b(tour.paused ? "Resume" : "Pause", "pausemovie"), b("Skip", "skipmovie"), b("Stop", "stopmovie"))}</section>`;
}
function saved() {
  let all = read("ps-snapshots", []);
  modal(
    "Saved demo runs",
    field("Run name", "runname", "My demo run") +
      b("Save current run", "savesnap", "", "primary") +
      all
        .map((x, j) =>
          card(
            x.name,
            row(
              b("Load", "loadsnap", j),
              b("Rename", "renamesnap", j),
              b("Delete", "deletesnap", j),
            ),
          ),
        )
        .join(""),
  );
}
const specs = {
  "build-1":
    "Return buyer quotations with source URLs, listings with prices, review counts and a market summary. Separate unavailable data.",
  "build-2":
    "Return five narrow groups in a Markdown table with these columns in order: Buyer group, Lasting need, Ease, Repeatability, Repeat purchases, Room to compete, Total, Evidence. Use integers from 1 to 5 (higher is better), total out of 25, and a source-linked rationale per row.",
  "build-3":
    "Provide title, subtitle, a ## Promise section, a Before | After Markdown table, four milestones, bonuses and price rationale. Include a ## Outline section with numbered titles, one per line, for ten ebook chapters, six course lessons or four coaching weeks depending on format.",
  "build-5":
    "Ground voice traits in exact public posts and links. Rewrite only reviewed content and preserve source numbers.",
  "build-6":
    "Draft a headline, subheadline, six honest bullets, price line, terms for seller review and a creator invitation.",
  "launch-0":
    "Provide audience, problem, promise, price, bonuses, three pitches, five objections and competitor comparison with evidence.",
  "launch-2":
    "Write three reels, five captions, three emails, eight story frames, FAQs, a seven-day schedule, disclosure and a 12-item checklist. Use separate Markdown headings for Reels, Captions, Emails, Stories, FAQs, Seven-day calendar and Checklist. Include I earn from each sale on every promotional asset.",
  "work-1":
    "For Ad Remakes give Pain, Proof and Offer ads with primary text, headline, description, CTA, image idea and score. For YouTube Shorts give eight original scenes under 60 seconds. Never invent prices or testimonials.",
  "work-3":
    "Draft a brief service-specific pitch beginning with a free sample and one day-three follow up.",
  "outreach-3":
    "Draft a personalized first message and one day-three follow up. Use an honest offer, a specific detail and an easy opt out.",
  "clients-1":
    "Write a short service-specific first message and one follow up. Offer a free sample.",
};
function capture() {
  let C = state();
  return {
    guided: true,
    subtype: val("book-subtype"),
    followSubject: val("follow-subject"),
    followBody: val("follow-body"),
    outline: val("book-outline"),
    platform: val("live-platform"),
    track: C.t,
    step: screen + "-" + idx,
    instruction:
      steps(screen, C.f, C.h)[idx].name +
      ". " +
      steps(screen, C.f, C.h)[idx].desc +
      " " +
      (specs[screen + "-" + idx] || ""),
    title: val("live-title"),
    notes: val("live-notes"),
    batchLimit: val("batch-limit"),
    actor: val("actor"),
    actorInput: val("actor-input"),
    lookup: val("lookup"),
    sender: val("sender"),
    subject: val("live-subject"),
    body: val("live-body"),
    testTo: val("test-to"),
    price: val("live-price"),
    stock: val("live-stock"),
    modelPath: val("media-model"),
    mediaInput: val("media-input"),
    coverPrompt: val("cover-prompt"),
    artDirection: val("page-art-direction"),
    edition: live.tracks[C.t]?.book?.signature,
    mediaPrice: val("media-price"),
    replyId: val("reply-id"),
    checkout: val("checkout-url"),
  };
}
async function liveAction(op, retry = "", pageIndex = null) {
  let p = capture();
  const onOriginalStep = () => !demo && state().t === p.track && screen + "-" + idx === p.step;
  p.retry = retry;
  if(pageIndex!==null)p.pageIndex=pageIndex;
  if (op === "localphoto") {
    let file = document.querySelector("#photo-input")?.files[0];
    if (!file) throw Error("Choose a photo first.");
    let im = await createImageBitmap(file),
      c = document.createElement("canvas");
    c.width = 150;
    c.height = Math.max(1, Math.round((im.height / im.width) * 150));
    let ctx = c.getContext("2d");
    ctx.drawImage(im, 0, 0, c.width, c.height);
    let pix = ctx.getImageData(0, 0, c.width, c.height).data,
      lum = [];
    for (let i = 0; i < pix.length; i += 4)
      lum.push(0.299 * pix[i] + 0.587 * pix[i + 1] + 0.114 * pix[i + 2]);
    let mean = lum.reduce((a, b) => a + b) / lum.length;
    p.notes =
      "Brightness: " +
      mean.toFixed(1) +
      "/255. Contrast: " +
      Math.sqrt(
        lum.reduce((a, b) => a + (b - mean) ** 2, 0) / lum.length,
      ).toFixed(1) +
      ".";
    op = "note";
  }
  if (op === "note") {
    if (p.step === "build-0") {
      if (!p.title.trim() && !p.notes.trim()) throw Error("Enter an idea or choose Find me an idea.");
      p.title ||= p.notes.split("\n")[0].slice(0,200);
      p.notes = p.notes.trim() || p.title.trim();
    }
    await api("note", p);
    await refresh();
    render();
    toast("Saved locally.");
    return;
  }
  const status = document.querySelector("#request-status");
  status.textContent = "Preparing the cost estimate for " + opNames[op] + "…";
  if (["outreach-3", "clients-1"].includes(p.step)) {
    p.title ||= live.tracks[p.track]?.title || p.track;
    if (op === "write") p.notes = "Offer: " + p.title + "\nExisting subject and body: " + p.subject + "\n" + p.body;
  }
  let q;
  try {
    q = await api("quote", { ...p, op });
  } finally {
    status.textContent = "";
  }
  if (!onOriginalStep()) return;
  confirmBox(opNames[op], q.description, q.price, async () => {
    status.textContent = op === "discover"
      ? "Finding and ranking product ideas. You can browse other steps while this runs."
      : opNames[op] + " is running. You can browse other steps.";
    const meter=op==="book" && p.subtype ? setInterval(async()=>{
      try {
        const r=await fetch("/document/Ebook/progress");const m=await r.json();
        if(m.total && onOriginalStep())status.textContent=m.saved+" of "+m.total+" pages saved.";
      } catch {}
    },900):null;
    try {
      try {
        const result=await api("run", { ticket: q.ticket, confirmed: true });
        if(result.message) q.resultMessage=result.message;
      } catch (error) {
        await refresh(); if(onOriginalStep()) render(); throw error;
      }
      await refresh();
      if (onOriginalStep()) render();
      toast(q.resultMessage || (op === "discover" ? "Ideas saved in " + p.track + " → Your idea." : "Result saved."));
    } finally {
      clearInterval(meter);
      status.textContent = "";
    }
  });
}
async function pdf(down, liveBook = false) {
  let C = state();
  let body = {
    title: offers[C.f],
    format: C.f,
    units: units(C.f).map((c, i) => ({
      title: c.title,
      text: C.d.edits?.[i] ?? chapterText(c),
    })),
    sources,
  };
  if (liveBook && !demo && live.tracks[C.t]?.book?.pages) {
    if(!live.tracks[C.t].pageQuality?.ready || live.tracks[C.t].staleSteps?.includes(4)) throw Error("Resolve the page review before export.");
    const a=document.createElement("a");a.href="/document/Ebook/final.pdf";
    if(down)a.download=slug(live.tracks[C.t].book.title)+".pdf";else a.target="_blank";
    a.click();return;
  }
  if (liveBook) {
    let bk = (demo ? demoTrack(C) : live.tracks[C.t]).book;
    body = {
      format: C.f,
      title: bk.title,
      liveProduct: true,
      coverTrack: demo ? "" : C.t,
      sources: bk.sources,
      units: Object.entries(bk.units).map(([i, text]) => ({
        title: bk.titles[i],
        text,
      })),
    };
  }
  let r = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Product-Export": "book" },
    body: JSON.stringify(body),
  });
  if (!r.ok)
    throw Error(
      "The PDF could not be built. Start the helper with python app.py.",
    );
  let u = URL.createObjectURL(await r.blob()),
    a = document.createElement("a");
  a.href = u;
  if (down) a.download = slug(body.title) + ".pdf";
  else a.target = "_blank";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 120000);
}
function missingKey(n) {
  modal(
    n + " connection",
    demo
      ? "<p>This is a simulated connection. Switch to Live to save a real key on this computer.</p>" +
          b("Switch to Live", "realkey", n, "primary")
      : keyFields(
          n,
          state().t,
          groups.includes(screen) ? screen + "-" + idx : null,
        ),
  );
}
async function action(a, v, el) {
  let C = state(),
    d = C.d,
    j = Number(v);
  if (
    ["nav", "step", "next", "mode", "starthustle", "menu"].includes(a) &&
    tour
  )
    stopMovie();
  if (demo && ["build","outreach","launch"].includes(C.s)) {
    const t = demoTrack(C);
    if (["liveop","researchretry","useidea","pickbuyer","pickcreator","offerprice","usesender","savedraft"].includes(a)) {
      const op = a === "liveop" ? v : a === "researchretry" ? "batch" : a;
      practice(C,op,capture(),v);
      log(steps(C.s,C.f,C.h)[C.i].name, "Practice project updated");
      save(); render(); toast("Practice project updated."); return;
    }
    if (a === "saveliveunit" || a === "undoliveunit") {
      const bk = t.book;
      bk.originalUnits ||= {};
      bk.originalUnits[v] ??= bk.units[v];
      bk.units[v] = a === "undoliveunit" ? bk.originalUnits[v] : val("live-unit-text");
      t.completedSteps.fill(false,5);
      close(); save(); render(); return;
    }
  }
  if (!demo && C.s==="build" && C.i===4 && a.startsWith("press-")) {
    await readerAction(a,v,live.tracks[C.t] || {},{api,refresh,render,modal,close,liveAction});return;
  }
  switch (a) {
    case "nav":
      go(v);
      break;
    case "step":
      go(...v.split("/"));
      break;
    case "next":
      go(...nextStep());
      break;
    case "menu":
      navOpen = !navOpen;
      render();
      break;
    case "rail":
      railOpen = !railOpen;
      render();
      break;
    case "theme":
      document.documentElement.dataset.theme =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem("ps-theme", document.documentElement.dataset.theme);
      render();
      break;
    case "mode":
      await setMode(v);
      break;
    case "starthustle":
      data.h = v;
      save();
      go("work");
      break;
    case "main":
      return mainAction();
    case "movie":
      return movie(false);
    case "tour":
      return movie(true);
    case "skipmovie":
      advanceMovie();
      break;
    case "stopmovie":
      stopMovie();
      break;
    case "pausemovie":
      tour.paused = !tour.paused;
      drawMovie();
      break;
    case "speed":
      tour.speed = tour.speed === 4 ? 1 : tour.speed * 2;
      drawMovie();
      break;
    case "movieNext":
      close();
      go(...nextStep());
      break;
    case "close":
      pending = null;
      close();
      break;
    case "cancel":
      pending = null;
      close();
      toast("Cancelled. Nothing was spent.");
      break;
    case "confirm": {
      let fn = pending;
      pending = null;
      close();
      if (fn) await fn();
      break;
    }
    case "key":
      missingKey(v);
      break;
    case "realkey":
      await setMode("live");
      missingKey(v);
      break;
    case "savekey": {
      await api("key", { name: v, key: val("secret") });
      await refresh();
      missingKey(v);
      render();
      toast("Key saved privately.");
      break;
    }
    case "testkey":
      if (v === "Higgsfield") {
        const key = val("secret");
        if (key || !live.keys[v]) {
          if (!key) {
            document.querySelector("#higgsfield-key-status").textContent =
              "Paste the full API key from Higgsfield to test this connection.";
            document.getElementById("secret").focus();
            break;
          }
          await api("key", { name: v, key });
          await refresh();
          missingKey(v);
          render();
        }
      }
      await api("test", { name: v });
      await refresh();
      missingKey(v);
      render();
      break;
    case "removekey":
      confirmBox(
        "Remove this key?",
        v + " will need a new key to make live calls.",
        "$0",
        async () => {
          await api("key", { name: v, remove: true });
          await refresh();
          render();
        },
      );
      break;
    case "saveconfig": {
      if (demo) {
        toast("Switch to Live to save account settings.");
        break;
      }
      let c = Object.fromEntries(
        Object.keys(configFields).map((k) => [k, val("cfg-" + k)]),
      );
      await api("config", { ...c, model: val("cfg-model") });
      await refresh();
      render();
      toast("Settings saved.");
      break;
    }
    case "savemodel":
      if (demo) {
        toast("Switch to Live to save the writing model.");
        break;
      }
      await api("config", { model: val("cfg-model") });
      await refresh();
      render();
      toast("Writing model saved.");
      break;
    case "stepmodel":
      if (!groups.includes(screen))
        throw Error("Open the OpenAI chip on a workflow step.");
      await api("stepmodel", {
        track: C.t,
        step: screen + "-" + idx,
        model: val("step-model"),
      });
      close();
      await refresh();
      render();
      break;
    case "applyvoice": {
      if (demo) {
        const t=demoTrack(C);
        const before=t.book?.units?.[0], original=t.voiceOriginal;
        const revised=t.voiceReport?.split(/^##\s+Adapted excerpt\s*$/im)[1]?.trim();
        if (!t.completedSteps[5] || !original || !before?.startsWith(original) || !revised || t.voiceApplied)
          throw Error("Review a fresh adaptation for the current opening.");
        t.book.originalUnits ||= {};
        t.book.originalUnits[0] ??= before;
        t.book.units[0]=revised+before.slice(original.length);
        t.voiceApplied=true; t.completedSteps[6]=false; save();
      } else {
        await api("applyvoice",{track:C.t,step:"build-5"}); await refresh();
      }
      render();toast("Opening updated in the manuscript and PDF.");break;
    }
    case "upgradereader":upgradeReader();render();break;
    case "editliveunit":
      modal(
        "Edit product unit",
        field(
          "Draft",
          "live-unit-text",
          (demo ? demoTrack(C) : live.tracks[C.t]).book.units[v],
          "area",
        ) + b("Save unit", "saveliveunit", v),
      );
      break;
    case "undoliveunit":
    case "saveliveunit":
      await api("editunit", {
        track: C.t,
        step: screen + "-" + idx,
        unit: v,
        undo: a === "undoliveunit",
        text: val("live-unit-text"),
      });
      await refresh();
      close();
      render();
      break;
    case "livepdf":
      return pdf(false, true);
    case "livepdfdown":
      return pdf(true, true);
    case "researchretry":
      await liveAction("batch", v);
      break;
    case "composead":
      compositionForm();
      break;
    case "finishad":
      await composeAd();
      break;
    case "comparephotos":
      compareForm();
      break;
    case "measurepair":
      await compareFiles();
      break;
    case "replybrief":
      document.querySelector("#live-notes").value = v;
      toast("Review the brief, then generate a draft.");
      break;
    case "polltoggle": {
      let opts = { track: C.t, step: screen + "-" + idx };
      if (live.polling.includes(C.t)) {
        await api("pollstop", opts);
        await refresh();
        render();
      } else
        confirmBox(
          "Check replies every minute?",
          "Read replies for this campaign while the workspace is open. Prepare local template drafts. Each AI rewrite needs a separate confirmation.",
          "$0 additional API fee",
          async () => {
            await api("pollstart", { ...opts, confirmed: true });
            await api("poll", opts);
            await refresh();
            render();
          },
        );
      break;
    }
    case "usetemplate":
      useTemplate(v);
      break;
    case "usesender":
    case "savedraft": {
      const payload = capture();
      if (a === "usesender") Object.assign(payload, live.tracks[C.t]?.mailDraft || {}, {sender:v});
      await api("savedraft", payload);
      await refresh();
      render();
      toast(a === "usesender" ? "Sender selected." : "Email draft saved.");
      break;
    }
    case "readchapter":
      selectChapter(C.t, j);
      render();
      break;
    case "pickcreator":
    case "offerprice":
      await api(a, {track:C.t, step:screen+"-"+idx, creator:v, price:val("live-price")});
      await refresh();
      render();
      toast(a === "pickcreator" ? "Creator selected for research." : "Offer price saved.");
      break;
    case "saveplan":
      await api("saveplan",{track:C.t,step:"build-3",title:live.tracks[C.t].title,buyer:live.tracks[C.t].buyer,report:val("reviewed-plan")});
      await refresh();render();toast("Product plan saved.");break;
    case "pickbuyer":
      await api("pickbuyer", {track: C.t, step: "build-2", buyer: v, guided: true});
      await refresh();
      render();
      toast("Buyer selected for your product plan.");
      break;
    case "useidea": {
      const idea = live.tracks[C.t]?.ideas?.[j];
      if (!idea) throw Error("Choose a saved idea.");
      await api("note", { ...capture(), title: idea.title, ideaIndex: j });
      await refresh();
      render();
      toast("Idea saved. Open See what sells to research it.");
      break;
    }
    case "liveop":
      await liveAction(v);
      break;
    case "livedown":
      download("workspace-result.txt", v);
      break;
    case "example":
      document.querySelector("#idea").value = v;
      break;
    case "pocket":
      d.pocket = j;
      save();
      render();
      toast("Buyer group selected.");
      break;
    case "unit":
      d.unit = j;
      save();
      render();
      break;
    case "editbook": {
      let n = d.unit || 0,
        c = units(C.f)[n];
      modal(
        "Edit " + c.title,
        field(
          "Chapter text",
          "chapter-edit",
          d.edits?.[n] ?? chapterText(c),
          "area",
        ) + b("Save and update the PDF", "savebook", "", "primary"),
      );
      document.querySelector("#chapter-edit").style.minHeight = "42vh";
      break;
    }
    case "savebook": {
      let txt = val("chapter-edit");
      if (!txt) throw Error("Keep some text in this chapter.");
      d.edits ??= {};
      d.edits[d.unit || 0] = txt;
      save();
      close();
      render();
      toast("Saved. The PDF uses this version.");
      break;
    }
    case "undobook":
      confirmBox(
        "Undo edits to this chapter?",
        "Restore the original saved text.",
        "$0",
        () => {
          delete (d.edits || {})[d.unit || 0];
          save();
          render();
        },
      );
      break;
    case "pdf":
      return pdf(false);
    case "pdfdown":
      return pdf(true);
    case "source": {
      if (!document.querySelector("#sources")) {
        modal("Source " + v, link(sources[j - 1][0], sources[j - 1][1]));
        break;
      }
      document.querySelector("#sources").open = true;
      let n = document.querySelector("#source-" + v);
      n.scrollIntoView({ block: "center" });
      n.classList.remove("flash");
      void n.offsetWidth;
      n.classList.add("flash");
      break;
    }
    case "post":
      modal(
        "Post " + (j + 1) + " (demo)",
        card(
          "Mira’s kitchen",
          e(units("Ebook")[j].voice) +
            "<p>" +
            ((j + 2) * 3100).toLocaleString() +
            " views (demo)</p>",
        ),
      );
      break;
    case "copy":
      await copy(v);
      break;
    case "kittab":
      d.kitTab = j;
      save();
      render();
      break;
    case "kitmode":
      d.photoKit = v === "photo";
      save();
      render();
      break;
    case "kitdown":
      download(
        "launch-week-kit.txt",
        kit(d.photoKit)
          .map((a, i) => kitTabs[i].toUpperCase() + "\n\n" + a.join("\n\n"))
          .join("\n\n----------------\n\n"),
      );
      break;
    case "checkout":
      modal(
        "Demo checkout",
        e(
          d.visible
            ? "The listing is visible in Demo mode. No payment is collected."
            : "This listing is hidden with zero stock.",
        ),
      );
      break;
    case "publish":
      publish(v);
      break;
    case "listingdown":
      download(
        "store-listing.json",
        JSON.stringify(
          {
            title: offers[C.t],
            price: d.price ?? prices[C.t],
            stock: d.visible ? 1 : 0,
            visibility: d.visible ? "visible" : "hidden",
            demo: true,
          },
          null,
          2,
        ),
        "application/json",
      );
      break;
    case "mailtab":
      saveMail();
      d.mailTab = j;
      save();
      render();
      break;
    case "savemail":
      saveMail();
      toast("Draft saved.");
      break;
    case "template": {
      let n = d.mailTab || 0,
        base = pitch(C.t, n);
      d.mails ??= {};
      d.mails[n] = [
        base[0],
        base[1].replace(
          "\n\n",
          "\n\n" +
            [
              "May I share a free sample?",
              "Could a ready-made sample help with your next project?",
              "I prepared an example you can inspect.",
              "Would you like to see the sample?",
              "One last note before I leave this here.",
            ][j] +
            " ",
        ),
      ];
      save();
      render();
      break;
    }
    case "mailflow":
      mailFlow(v);
      break;
    case "boardtoggle":
      boardToggle();
      break;
    case "reply":
      selected = v;
      data.read[v] = true;
      save();
      render();
      break;
    case "filter":
      filter = v;
      selected = "";
      render();
      break;
    case "alt":
      alt = alt === v ? "" : v;
      render();
      break;
    case "opencampaign": {
      let r = [C.f, ...hustles].flatMap(replies).find((r) => r.id === v);
      selected = v;
      data.read[v] = true;
      if (hustles.includes(r.track)) {
        data.h = r.track;
        go("clients", 3);
      } else {
        data.f = r.track;
        go("outreach", 5);
      }
      save();
      break;
    }
    case "package": {
      let p = pkg(C.t)[j];
      d.packageId = j;
      d.package = p[0];
      d.price = p[1];
      save();
      render();
      break;
    }
    case "payconfirm":
      payConfirm();
      break;
    case "listing":
      d.listing = j;
      save();
      render();
      toast("Listing selected.");
      break;
    case "adselect":
      d.ad = j;
      save();
      modal(
        "Local ad " + (j + 1) + " (demo)",
        '<img class="photo" src="/media/roof-ad-0.jpg" alt="Example roofing ad">' +
          b("Remake this ad", "startad", "", "primary"),
      );
      break;
    case "startad":
      close();
      go("work", 1);
      break;
    case "rewriteads":
      d.adSet = ((d.adSet || 0) + 1) % 3;
      save();
      render();
      break;
    case "assetzip": {
      let a = document.createElement("a");
      a.href =
        "/media/" + (C.t === "Ad Remakes" ? "ad-pack" : "shorts-pack") + ".zip";
      a.download = "";
      a.click();
      break;
    }
    case "loadpitch":
      d.mails = { 0: pitch(C.t), 1: pitch(C.t, 1) };
      save();
      go("clients", 1);
      break;
    case "saved":
      saved();
      break;
    case "savesnap": {
      let a = read("ps-snapshots", []),
        name = val("runname");
      if (!name) throw Error("Name this run.");
      a.push({ name, data: structuredClone(data) });
      localStorage.setItem("ps-snapshots", JSON.stringify(a));
      saved();
      break;
    }
    case "loadsnap": {
      let x = read("ps-snapshots", [])[j];
      if (x) {
        data = structuredClone(x.data);
        save();
        close();
        go("home");
      }
      break;
    }
    case "renamesnap":
      modal(
        "Rename demo run",
        field("Name", "newname", read("ps-snapshots", [])[j].name) +
          b("Save name", "saverename", j),
      );
      break;
    case "saverename": {
      let a = read("ps-snapshots", []);
      if (!val("newname")) throw Error("Enter a name.");
      a[j].name = val("newname");
      localStorage.setItem("ps-snapshots", JSON.stringify(a));
      saved();
      break;
    }
    case "deletesnap":
      confirmBox(
        "Delete saved demo?",
        read("ps-snapshots", [])[j].name,
        "Local copy",
        () => {
          let a = read("ps-snapshots", []);
          a.splice(j, 1);
          localStorage.setItem("ps-snapshots", JSON.stringify(a));
          saved();
        },
      );
      break;
    case "loadall":
      fillExample({...C,t:C.f,d:data.tracks[C.f] ||= {}});
      log("All examples loaded", "Product and three service tracks", "layers");
      render();
      toast("All saved examples are ready.");
      break;
    case "resetdemo":
      confirmBox(
        "Reset the demo?",
        "Restore the original examples and clear edits in the current demo. Saved runs remain available.",
        "$0",
        () => {
          data = base();
          save();
          render();
        },
      );
      break;
  }
}
document.addEventListener("click", async (ev) => {
  let el = ev.target.closest("[data-act]");
  if (!el) return;
  const navigation = ["nav", "step", "next", "menu", "rail", "theme"].includes(el.dataset.act);
  if (working && !navigation) {
    toast("An action is already in progress. You can still browse the workspace.");
    return;
  }
  if (!navigation) working = true;
  el.disabled = true;
  try {
    await action(el.dataset.act, el.dataset.v, el);
  } catch (err) {
    const msg = String(err.message || err);
    if (msg.startsWith("Add your ") && msg.includes(" key first")) {
      let n = msg.slice(9, msg.indexOf(" key first"));
      if (channels[n]) missingKey(n);
    }
    toast(msg);
    if (msg.includes("key did not work")) {
      await refresh();
      missingKey(el.dataset.v);
      render();
    }
  } finally {
    if (!navigation) working = false;
    el.disabled = false;
  }
});
document.addEventListener("input", (ev) => {
  if (ev.target.id === "split")
    ev.target.parentNode.style.setProperty("--split", ev.target.value + "%");
});
document.addEventListener("change", async (ev) => {
  let el = ev.target,
    { d } = state();
  if (el.id === "format" || el.id === "format-plan") {
    data.f = el.value;
    filter = "All";
    save();
    render();
  }
  if (el.id === "hustle") {
    data.h = el.value;
    save();
    go("work");
  }
  if (el.id === "voice-unit") {
    d.voiceUnit = el.selectedIndex;
    save();
    render();
  }
  if (el.id === "camera") {
    d.blur = el.checked;
    save();
    render();
  }
  if (el.dataset.check !== undefined) {
    d.checks ??= {};
    d.checks[el.dataset.check] = el.checked;
    save();
  }
});
document.addEventListener("pointerover", (ev) => {
  if (ev.target.matches("video.clip") && ev.pointerType === "mouse")
    ev.target.play().catch(() => {});
});
document.addEventListener("pointerout", (ev) => {
  if (ev.target.matches("video.clip")) ev.target.pause();
});
setInterval(() => {
  if (!demo || tour) return;
  let changed = false;
  for (let d of Object.values(data.tracks)) {
    if (d.campaign === "Sending") {
      d.sent = Math.min(30, (d.sent ?? 18) + 1);
      if (d.sent === 30) d.campaign = "Done";
      changed = true;
    }
  }
  if (changed) {
    save();
    if (
      (screen === "outreach" && idx === 4) ||
      (screen === "clients" && idx === 2)
    )
      render();
  }
}, 500);
setInterval(async () => {
  if (demo || working || !live.polling?.length) return;
  try {
    for (const track of live.polling)
      await api("poll", {
        track,
        step: hustles.includes(track) ? "clients-3" : "outreach-5",
      });
    await refresh();
    if (!dialog.open && !document.activeElement?.matches("textarea,input"))
      render();
  } catch (err) {
    toast(err.message);
  }
}, 60000);
window.addEventListener("popstate", () => {
  stopMovie();
  route();
});
dialog.addEventListener("cancel", () => {
  pending = null;
});
route();
fetch("/media/photo-metrics.json")
  .then((r) => r.json())
  .then((x) => {
    metrics = x;
  })
  .catch(() => {});
fetch("/health")
  .then((r) => {
    if (!r.ok) throw Error();
  })
  .catch(() => {
    helper = false;
    render();
  });
