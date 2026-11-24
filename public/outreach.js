import {
  b,
  badge,
  card,
  e,
  field,
  grid,
  link,
  row,
  stats,
  table,
} from "./ui.js";

const run = (label, op, available = true) =>
  available
    ? b(label, "liveop", op)
    : "<button disabled>" + e(label) + "</button>";
const dashboard = "https://app.instantly.ai/app";
const record = (text, fallback) => {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};
const footer = (cfg) =>
  [cfg.name, cfg.business, cfg.address, "Reply no and I will stop."]
    .filter(Boolean)
    .join("\n");
const templates = {
  "Free sample":
    "Would you like to see a sample of my product before deciding whether it fits your audience?",
  "Problem and solution":
    "I put together a practical resource for this problem. Would a sample help you judge the fit?",
  "Show the product":
    "I can share a finished page so you can see exactly what your audience would receive. Interested?",
  "Ask a question":
    "What would make a resource like this useful to your audience?",
  "Last follow-up":
    "One last check about the sample. If it is useful, I can send it over. Otherwise I’ll leave it here.",
};
export function useTemplate(name) {
  const follow = document.querySelector("#mail-second").checked;
  document.getElementById(follow ? "follow-body" : "live-body").value =
    templates[name];
}
function inboxRows(t, service) {
  const saved = record(t.results?.[service ? "clients-0" : "outreach-2"], []);
  return t.inboxes || (Array.isArray(saved) ? saved : []);
}
function accounts(t, service, live) {
  const list = inboxRows(t, service);
  const domains = new Set(
    list.map((a) => a.email?.split("@")[1]).filter(Boolean),
  );
  return (
    grid([
      card(
        "1. Load existing inboxes",
        badge(live.keys.Instantly?.status || "Key needed") +
          "<p>Load the sending accounts already connected to your Instantly workspace.</p>" +
          row(
            b("Manage Instantly key", "key", "Instantly"),
            run("Load my inboxes", "inboxes"),
          ),
      ),
      card(
        "2. Choose a sender",
        "<p>Select an active account for this product. You can review it again when you write the emails.</p>" +
          badge(t.mailDraft?.sender || t.sender || "No sender selected"),
      ),
    ]) +
    stats([
      [domains.size, "Domains loaded"],
      [list.length, "Inboxes loaded"],
      [list.filter((a) => a.warmup_status === 1).length, "Warmup on"],
    ]) +
    card(
      "Your inboxes",
      list.length
        ? table(
            ["Account", "Status", "Warmup", "Daily limit", "Sender"],
            list.map((a) => [
              e(a.email),
              badge(
                a.status === 1 ? "Active" : "Check in Instantly",
                a.status === 1 ? "green" : "",
              ),
              e(
                a.warmup_status === 1
                  ? "On"
                  : a.warmup_status === 0
                    ? "Off"
                    : "Check status",
              ),
              e(a.daily_limit ?? "—"),
              (t.sender || t.mailDraft?.sender) === a.email
                ? badge("Selected", "green")
                : a.status === 1 && !t.campaignId
                  ? b("Use sender", "usesender", a.email)
                  : "—",
            ]),
          )
        : "<p>Load your inboxes to see their current status.</p>",
    ) +
    link("Manage accounts in Instantly", dashboard + "/accounts")
  );
}
function composer(t, service, live) {
  const draft = t.campaignId ? t : t.mailDraft || t;
  const recipients = t.verified || [];
  const contacts = recipients.length
    ? e(recipients[0]) +
      (recipients.length > 1 ? " + " + (recipients.length - 1) + " more" : "")
    : "No verified leads yet";
  const list = inboxRows(t, service);
  const sender =
    field("From", "sender", draft.sender || "", "email").replace(
      'id="sender"',
      'id="sender" list="sending-accounts"',
    ) +
    '<datalist id="sending-accounts">' +
    list
      .filter((a) => a.status === 1)
      .map((a) => "<option>" + e(a.email) + "</option>")
      .join("") +
    "</datalist>";
  const editor =
    '<div class="sequence"><input type="radio" name="sequence" id="mail-first" checked><label for="mail-first">Email 1 · Day 0</label>' +
    '<input type="radio" name="sequence" id="mail-second"><label for="mail-second">Email 2 · Day 3</label>' +
    '<div class="letter letter-first">' +
    field("Subject", "live-subject", draft.subject || "") +
    field("Message", "live-body", draft.body || "", "area") +
    "</div>" +
    '<div class="letter letter-second">' +
    field("Follow-up subject", "follow-subject", draft.followSubject || "") +
    field("Follow-up message", "follow-body", draft.followBody || "", "area") +
    "</div></div>";
  const previous = t.results?.[service ? "clients-1" : "outreach-3"];
  return (
    grid([
      card(
        "Email preview",
        sender +
          "<p>To · " +
          contacts +
          "</p>" +
          editor +
          '<div class="pre small">' +
          e(footer(live.config)) +
          "</div>" +
          (!t.campaignId
            ? row(b("Save edits", "savedraft"), run("Write again", "write"))
            : "<p>Edit the created sequence in Instantly.</p>"),
      ),
      card(
        "Campaign setup",
        stats([
          [recipients.length, "Verified leads"],
          [t.campaignStatus || "Local draft", "Status"],
        ]) +
          row(
            run("1. Create paused draft", "campaign", !t.campaignId),
            run(
              "2. Add verified leads",
              "leads",
              !!t.campaignId && !!recipients.length,
            ),
            run(
              "3. Start sending",
              "activate",
              !!t.leadsAdded && t.campaignStatus !== "Sending",
            ),
          ) +
          field("Test recipient", "test-to", "", "email") +
          run("Review test email", "test"),
      ),
    ]) +
    (!t.campaignId
      ? card(
          "Starter templates",
          row(...Object.keys(templates).map((k) => b(k, "usetemplate", k))),
        )
      : "") +
    (!t.mailDraft && !t.campaignId && previous
      ? '<details class="card"><summary>Earlier saved draft</summary><p class="pre">' +
        e(previous) +
        "</p></details>"
      : "")
  );
}
function tracker(t, service, live) {
  const old = record(t.results?.[service ? "clients-2" : "outreach-4"], {});
  const metrics = t.analytics || (Array.isArray(old) ? old[0] : old) || {};
  const sender = inboxRows(t, service).find((a) => a.email === t.sender);
  const events = t.timeline || [];
  const goal = metrics.leads_count ?? null,
    contacted = metrics.contacted_count ?? null;
  const progress =
    goal > 0 && contacted != null
      ? "<p>" +
        e(contacted) +
        " of " +
        e(goal) +
        ' leads contacted</p><progress max="' +
        Number(goal) +
        '" value="' +
        Number(contacted) +
        '"></progress>'
      : "";
  return (
    card(
      t.title || "Campaign",
      row(
        badge(t.campaignStatus || "Local draft"),
        badge("Weekdays · 9–5 Eastern"),
        link("Open in Instantly", dashboard + "/campaigns"),
        run("Refresh activity", "analytics", !!t.campaignId),
        t.campaignStatus === "Sending"
          ? run("Pause sending", "pause")
          : run("Start sending", "activate", !!t.leadsAdded),
      ) + progress,
    ) +
    stats(
      [
        ["emails_sent_count", "Sent"],
        ["delivered_count", "Delivered"],
        ["open_count", "Opened"],
        ["reply_count", "Replied"],
        ["bounced_count", "Bounced"],
      ].map(([k, label]) => [metrics[k] ?? "—", label]),
    ) +
    grid([
      card(
        "Campaign activity",
        events.length
          ? table(
              ["Time", "Event", "Lead", "Inbox"],
              events.map((r) => [
                e(r.timestamp_email || "—"),
                e(
                  {
                    1: "Campaign send",
                    2: "Received",
                    3: "Sent",
                    4: "Scheduled",
                  }[r.ue_type] || "Email",
                ),
                e(r.lead || "—"),
                e(r.eaccount || "—"),
              ]),
            )
          : "<p>Refresh an existing campaign to load recent email activity.</p>",
      ),
      card(
        "Sending inbox",
        e(t.sender || "No campaign sender yet") +
          "<p>" +
          e(t.senderUsage?.sent ?? "—") +
          " sent / " +
          e(sender?.daily_limit ?? "—") +
          " account limit · " +
          e(t.senderUsage?.date || "Today") +
          " UTC</p>" +
          (sender?.daily_limit && t.senderUsage?.sent != null
            ? '<progress max="' +
              Number(sender.daily_limit) +
              '" value="' +
              Number(t.senderUsage.sent) +
              '"></progress>'
            : ""),
      ) +
        card(
          "Email they receive",
          "<strong>" +
            e(t.subject || t.mailDraft?.subject || "No saved subject") +
            "</strong><p class='pre'>" +
            e(t.body || t.mailDraft?.body || "") +
            "</p><p class='pre small'>" +
            e(footer(live.config)) +
            "</p>",
        ),
    ]) +
    (t.activityWarnings || []).map((w) => "<p>" + e(w) + "</p>").join("") +
    '<p class="fine">A dash means Instantly has not supplied that figure.</p>'
  );
}
export function outreachPage(C, t, live) {
  const service = C.s === "clients";
  if (!service && C.s !== "outreach") return "";
  const index = service ? C.i : C.i - 2;
  const view = [accounts, composer, tracker][index];
  if (!view) return "";
  return (
    '<div class="stepshead"><span class="eyebrow">Outreach · Step ' +
    (C.i + 1) +
    "</span><h1>" +
    ["Set up sending inboxes", "Write the emails", "Send and track"][index] +
    "</h1>" +
    row(
      b(
        ["Write the emails", "Send and track", "Review replies"][index],
        "next",
        "",
        "primary",
        "arrow",
      ),
    ) +
    '</div><div class="stack">' +
    view(t, service, live) +
    "</div>"
  );
}
