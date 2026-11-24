import {
  e,
  b,
  card,
  field,
  row,
  grid,
  badge,
  table,
  list,
  stats,
  select,
  link,
} from "./ui.js";
import {
  names,
  slug,
  offers,
  prices,
  pitch,
  replies,
  formats,
} from "./catalog.js";
export const domain = (t, i) =>
  ["get", "team", "hello", "try", "use", "with"][i] +
  slug(t).replaceAll("-", "") +
  ".example";
export function lead(t, i) {
  return {
    name:
      names[t][i % 7] +
      (i >= 7 ? " " + (Math.floor(i / 7) + 1) : "") +
      " (demo)",
    email: "contact" + (i + 1) + "@" + slug(t) + ".example",
    followers: 12000 + i * 7400,
    views: 54000 + i * 6400,
    score: 96 - i * 3,
  };
}
const starters = [
  "Free sample",
  "A problem to solve",
  "Show your work",
  "One question",
  "Polite last email",
];
export function mail(C) {
  const { d, t } = C,
    i = d.mailTab || 0;
  return d.mails?.[i] || pitch(t, i);
}
export function campaignView(C) {
  let { d, t, s } = C,
    i = s === "clients" ? C.i + 2 : C.i;
  if (i === 0) {
    let blur = d.blur !== false,
      rows = Array.from({ length: 9 }, (_, j) => {
        let l = lead(t, j),
          followers = j === 8 ? 130000 : l.followers,
          views = j === 7 ? 22000 : l.views,
          pass =
            followers >= (d.minFollowers ?? 10000) &&
            followers <= (d.maxFollowers ?? 100000) &&
            views >= (d.minViews ?? 50000);
        return [
          `<span class="${blur ? "blur" : ""}">${e(l.name)}</span>`,
          e(d.platform || "Instagram"),
          followers.toLocaleString(),
          views.toLocaleString(),
          badge(pass ? "Fits" : "Skipped", pass ? "green" : ""),
          pass ? "Business email, no product" : "Outside filters",
        ];
      });
    return (
      card(
        "Creator filters",
        select(
          "platform",
          ["Instagram", "TikTok", "YouTube", "LinkedIn"],
          d.platform || "Instagram",
        ) +
          field("Niche", "niche", d.niche || "Small plates and meal prep") +
          `<div class="formgrid">${field("Minimum top views", "minViews", d.minViews ?? 50000, "number")}${field("Minimum followers", "minFollowers", d.minFollowers ?? 10000, "number")}${field("Maximum followers", "maxFollowers", d.maxFollowers ?? 100000, "number")}</div><label><input type="checkbox" id="camera" ${blur ? "checked" : ""}> Hide names for camera</label>`,
      ) +
      stats([
        [58, "Posts (demo)"],
        [32, "Profiles read"],
        [9, "Profiles reviewed"],
        [rows.filter((r) => r[4].includes("Fits")).length, "Passed"],
      ]) +
      table(
        ["Creator", "Platform", "Followers", "Top views", "Status", "Why"],
        rows,
      )
    );
  }
  if (i === 1)
    return card(
      "Business email checks (demo)",
      table(
        ["Lead", "Address", "Check", "Source"],
        Array.from({ length: 9 }, (_, j) => [
          e(lead(t, j).name),
          j < 7 ? e(lead(t, j).email) : "No usable email",
          badge(
            j < 7 ? "Verified" : j === 7 ? "Risky and skipped" : "Not found",
            j < 7 ? "green" : "",
          ),
          "Apify (demo)",
        ]),
      ),
    );
  if (i === 2)
    return card(
      "Instantly AirMail inboxes (demo)",
      table(["Sender", "Account", "Warmup"], ["alex", "sam"].map(name => [
        name + "@" + domain(t, 0), "Active (demo)", "On (demo)",
      ])),
    );
  if (i === 3) {
    const [sub, body] = mail(C);
    return (
      card(
        "Two emails. One follow up.",
        row(
          ...["Email 1 · Day 0", "Email 2 · Day 3"].map((x, j) =>
            b(x, "mailtab", j, (d.mailTab || 0) === j ? "chosen" : ""),
          ),
        ) +
          `<div class="paper"><div class="mailhead"><span class="label">Email preview (demo)</span><p>From: Alex (demo) &lt;alex@${domain(t, 0)}&gt;</p><p>To: ${e(lead(t, 0).name)} &lt;${e(lead(t, 0).email)}&gt;</p></div>${field("Subject", "subject", sub)}${field("Message", "body", body, "area")}</div>` +
          row(b("Save edits", "savemail"), b("Write again", "template", 3)),
      ) +
      card(
        "Starter templates",
        row(...starters.map((x, j) => b(x, "template", j))),
      ) +
      card(
        "Campaign controls",
        badge(d.campaign || "Draft", "violet") +
          row(
            b("Make the draft", "mailflow", "draft"),
            b("Add leads", "mailflow", "leads"),
            b("Start sending", "mailflow", "start"),
          ) +
          field("One test address", "testaddress", "", "email") +
          b("Send a test email", "mailflow", "test"),
      )
    );
  }
  if (i === 4) {
    const n = d.sent ?? 18;
    return (
      card(
        "Selling: " + offers[t],
        row(
          badge(d.campaign || "Paused", "violet"),
          badge("Weekdays · 9 AM to 5 PM"),
          b(d.campaign === "Sending" ? "Pause" : "Resume", "boardtoggle"),
        ) +
          `<p class="statusline">${n} of 30 sent · cap 300/day (demo)</p><div class="bar"><i style="width:${(n / 30) * 100}%"></i></div>`,
      ) +
      stats([
        [n, "Sent"],
        [n - (n > 13 ? 1 : 0), "Delivered"],
        [Math.floor(n * 0.56), "Opened"],
        [Math.floor(n * 0.2), "Replied"],
        [n > 13 ? 1 : 0, "Bounced"],
      ]) +
      card(
        "Send timeline",
        table(
          ["Event", "Recipient", "Sending inbox"],
          Array.from({ length: Math.min(n, 6) }, (_, j) => {
            let k = n - j - 1;
            return [
              k === 13
                ? "Bounced, skipped"
                : k % 5 === 0
                  ? "Reply received"
                  : "Sent (demo)",
              e(lead(t, k).name),
              "sam@" + domain(t, k % 6),
            ];
          }),
        ),
      ) +
      card(
        "Inbox meters",
        table(
          ["Account", "Sent today", "Limit"],
          Array.from({ length: 12 }, (_, j) => [
            (j % 2 ? "sam" : "alex") + "@" + domain(t, Math.floor(j / 2)),
            Math.floor((n + 11 - j) / 12),
            25,
          ]),
        ),
      )
    );
  }
  return replyView(C, false);
}
export function replyView(C, all) {
  const tracks = [C.f, "Airbnb Photos", "Ad Remakes", "YouTube Shorts"],
    filter = all ? C.filter : C.t,
    items = (all ? tracks : [C.t]).flatMap(replies),
    filtered = items.filter(
      (r) => !filter || filter === "All" || r.track === filter,
    ),
    r = filtered.find((r) => r.id === C.selected) || filtered[0];
  return (
    (all
      ? stats([
          [items.filter((x) => x.label === "Interested").length, "Interested"],
          [
            items.filter((x) => x.label.includes("uestion")).length,
            "Questions",
          ],
          [items.filter((x) => !x.draft).length, "Not now or away"],
          [items.filter((x) => x.draft).length, "AI drafts"],
        ]) +
        `<div class="chips">${["All", ...tracks].map((x) => b(x === "All" ? x : "Selling: " + offers[x], "filter", x, x === filter ? "chosen" : "")).join("")}</div>`
      : badge("Draft assistant on (demo)", "green")) +
    grid([
      card(
        "Replies",
        filtered
          .map(
            (x) =>
              `<button class="replyrow ${x.id === r.id ? "chosen" : ""}" data-act="reply" data-v="${e(x.id)}"><span class="spread"><b>${C.read[x.id] ? "" : "● "}${e(x.name)}</b><small>${x.time}</small></span>${badge(x.label)}<small>Selling: ${e(offers[x.track])}</small><small>${e(x.message)}</small></button>`,
          )
          .join(""),
      ),
      card(
        r.name,
        badge(r.track, "violet") +
          `<p class="statusline">${e(r.message)}</p><div class="boxnote"><b>${r.draft ? "AI reply draft (not sent)" : "Leave this reply alone"}</b><p>${e(r.draft ? (C.alt === r.id ? "Thanks for your note. " + r.draft : r.draft) : "Respect their time. No follow up is queued.")}</p></div>` +
          row(
            ...(r.draft
              ? [
                  b(
                    "Copy reply",
                    "copy",
                    (C.alt === r.id ? "Thanks for your note. " : "") + r.draft,
                  ),
                  b("Use the other idea", "alt", r.id),
                ]
              : []),
            ...(all ? [b("Open in " + r.track, "opencampaign", r.id)] : []),
          ),
      ),
    ]) +
    card(
      "How to answer",
      list([
        "Interested: share the sample.",
        "Questions: answer briefly and clearly.",
        "Not now or away: leave it there.",
        "Read every draft before replying.",
      ]),
    )
  );
}
