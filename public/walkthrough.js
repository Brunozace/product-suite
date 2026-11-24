import { b, card, e, row, field, grid, badge } from "./ui.js";
import { units, sources } from "./book.js";
import { chapterText } from "./product.js";
import { buyerGroups, planOutline } from "./planning.js";

const school = "Preschool Pencil Practice";
const sampleIdeas = [school, "The Small Appetite Protein Plan"];
const schoolUnits = [
  "First trail",
  "Straight lines",
  "Curves and corners",
  "Simple shapes",
  "My first letter",
  "Uppercase letters",
  "Lowercase letters",
  "Numbers one to five",
  "Count to ten",
  "Choose a review page",
];
const stages = [
  "Choose an idea",
  "Research demand",
  "Choose a buyer",
  "Plan the product",
  "Build the product",
  "Study a creator",
  "Prepare the offer",
];
const complete = (t, i) => {
  t.completedSteps[i] = true;
  t.completedSteps.fill(false, i + 1);
  t.staleSteps = [
    ...new Set([
      ...(t.staleSteps || []).filter((j) => j < i),
      ...stages.map((_, j) => j).filter((j) => j > i),
    ]),
  ];
};
export function pathView(C, t) {
  const done = t.completedSteps || Array(7).fill(false);
  const previous = done.slice(0, C.i).findIndex((ok) => !ok);
  const target = previous >= 0 ? previous : C.i;
  const stale = t.staleSteps?.includes(C.i);
  const label =
    previous >= 0
      ? "Continue at " + stages[target]
      : stale
        ? "Update this step with your latest choices"
        : done[C.i]
          ? "Saved · " + stages[C.i]
          : stages[C.i];
  return (
    '<section class="journey" aria-label="Product workflow"><div class="spread"><strong>' +
    (C.demo ? "Practice project" : "Your project") +
    "</strong><span>" +
    e(label) +
    '</span></div><div class="journey-steps">' +
    stages
      .map((s, i) =>
        b(
          (done[i] ? "✓ " : String(i + 1) + ". ") + s,
          "step",
          "build/" + i,
          i === C.i ? "chosen" : "",
        ),
      )
      .join("") +
    '</div><div class="journey-context">' +
    [t.title, t.buyer].filter(Boolean).map(e).join(" · ") +
    "</div></section>"
  );
}
export function demoTrack(C) {
  if (!C.d.practice) {
    C.d.practice = {
      title: "",
      results: {},
      notes: {},
      research: {},
      completedSteps: Array(7).fill(false),
      ideas: [],
    };
  }
  return C.d.practice;
}
export function practice(C, op, p = {}, value = "") {
  const t = demoTrack(C),
    id = C.s + "-" + C.i;
  const preschool = t.title === school,
    food = t.title === sampleIdeas[1];
  const cohort = preschool
    ? [
        "Homeschool caregivers",
        "Preschool teachers",
        "Home daycare providers",
        "After-school caregivers",
        "Kindergarten families",
      ]
    : food
      ? [
          "Adults planning small meals",
          "Family meal planners",
          "Shift workers",
          "First-time meal preppers",
          "Busy caregivers",
        ]
      : [
          "First-time learners",
          "Group instructors",
          "Independent practitioners",
          "Busy households",
          "Workshop leaders",
        ];
  const buyer = t.buyer || cohort[0],
    offer = t.title || school;
  const unitNames = food
    ? units(C.f).map((x) => x.title)
    : preschool
      ? schoolUnits
      : [
          "Getting started",
          "Choose your goal",
          "Practice the basics",
          "Try a worked example",
          "Review your work",
          "Make it a routine",
        ];
  const proposed = p.outline?.trim()
    ? p.outline
        .split(/\n/)
        .map((x) => x.trim())
        .filter(Boolean)
    : planOutline(t.results["build-3"] || "");
  const titles =
    op === "book" && proposed.length
      ? proposed
      : unitNames.slice(0, C.f === "Course" ? 6 : C.f === "Coaching" ? 4 : 10);
  const contact = "partnerships@creator.example",
    sender = "studio@dearwork.example";
  if (op === "discover") {
    t.ideas = sampleIdeas.map((title) => ({
      title,
      reason: "Sample demand signal for " + title + ".",
      sources: [],
    }));
    return;
  }
  if (op === "note" || op === "useidea") {
    const title =
      op === "useidea" ? t.ideas[Number(value)]?.title : p.title || p.notes;
    if (!title) throw Error("Choose or enter an idea first.");
    if (title !== t.title) {
      const ideas = t.ideas;
      Object.assign(C.d, {
        practice: {
          title,
          ideas,
          results: { "build-0": title },
          notes: { "build-0": title },
          research: {},
          completedSteps: [true, false, false, false, false, false, false],
        },
      });
    }
    return;
  }
  if (C.s === "build" && !["cover", "coverStatus"].includes(op)) {
    const missing = t.completedSteps.slice(0, C.i).indexOf(false);
    if (missing >= 0) throw Error(stages[missing] + " first.");
  }
  if (C.s === "launch" && !t.completedSteps.every(Boolean) && op !== "hide")
    throw Error("Finish Ready to sell before preparing the launch.");
  switch (op) {
    case "batch":
      if (id === "build-1") {
        t.research[id] = Object.fromEntries(
          ["Reddit", "Etsy", "Amazon", "TikTok", "YouTube"].map((site, i) => [
            site,
            {
              status: "Done",
              count: 1,
              rows: [
                {
                  title: [
                    `How do I get started with ${offer}?`,
                    `Printable activity pack for ${offer}`,
                    `Beginner workbook on ${offer}`,
                    `A short practice routine for ${offer}`,
                    `Walkthrough: first session of ${offer}`,
                  ][i],
                },
              ],
            },
          ]),
        );
        t.results[id] =
          "Practice evidence for " +
          offer +
          ". Discussion and marketplace examples suggest a need for clear instructions and repeatable activities.";
        complete(t, 1);
        t.needsBuyerScores = true;
      } else if (id === "outreach-0") {
        const profile = {
          username: "everyday.studio",
          followersCount: 18400,
          biography: "Activity ideas. Partnerships: " + contact,
        };
        t.research[id] = {
          Creators: { status: "Done", count: 1, rows: [profile] },
          "Topic reels": {
            status: "Done",
            count: 1,
            rows: [{ ownerUsername: profile.username, videoPlayCount: 8200 }],
          },
        };
      } else if (id === "launch-0") {
        t.results[id] =
          "Sample competitor review for " +
          offer +
          ". Compare the first activity, price and format.";
      } else if (id === "build-5") {
        t.voiceHandle = p.notes || t.creator || "everyday.studio";
        t.research[id] = {
          Profile: {
            status: "Done",
            count: 1,
            rows: [
              {
                username: t.voiceHandle,
                biography: "Practical activities, one step at a time.",
              },
            ],
          },
          "Recent reels": {
            status: "Done",
            count: 1,
            rows: [{ caption: "Start small. Try one activity today." }],
          },
        };
      }
      break;
    case "pickbuyer":
      if (
        !buyerGroups(t.results["build-2"] || "").some(
          (group) => group.name === value,
        )
      )
        throw Error("Score the groups and choose a buyer.");
      if (value !== t.buyer || !t.completedSteps[2]) {
        t.buyer = value;
        complete(t, 2);
      }
      break;
    case "pickcreator":
      t.creator = value;
      break;
    case "write":
      if (id === "build-2") {
        t.completedSteps.fill(false, 2);
        t.buyer = "";
        t.needsBuyerScores = false;
        t.results[id] = cohort
          .map(
            (g, i) =>
              `| ${g} | ${5 - (i % 3)} | 4 | 4 | 3 | 3 | ${19 - (i % 3)} | Sample fit for ${offer}: ${g} can reuse a short guided activity. |`,
          )
          .join("\n");
      } else if (id === "build-3") {
        t.results[id] =
          `## Promise\nHelp ${buyer.toLowerCase()} put ${offer} into practice, one activity at a time.\n\n## Outline\n` +
          titles.map((v, i) => i + 1 + ". " + v).join("\n");
        t.planBuyer = buyer;
        complete(t, 3);
      } else if (id === "build-5") {
        if (!t.voiceHandle) throw Error("Read public posts first.");
        t.voiceApplied = false;
        t.voiceOriginal = t.book.units[0].split("\n\n")[0];
        t.voiceReport =
          "## Voice and audience\nShort, practical instructions. The sample post invites readers to try one activity.\n\n## Adapted excerpt\nStart small. " +
          t.voiceOriginal;
        complete(t, 5);
      } else if (id === "build-6") {
        t.results[id] =
          `## ${offer}\nMade for ${buyer.toLowerCase()}. Follow ${t.book.titles.length} guided activities, starting with ${t.book.titles[0]}.\n\n## Try a sample\nReview the first activity together with @${t.voiceHandle}.`;
        complete(t, 6);
      } else if (id === "outreach-3") {
        t.mailDraft = {
          sender: t.mailDraft?.sender || sender,
          subject: "A sample of " + offer,
          body: `Would a sample of ${offer} be useful to your audience? I made it for ${buyer.toLowerCase()}.`,
          followSubject: "Following up on the sample",
          followBody: "Would you like to see the first activity?",
        };
      } else if (id === "launch-2") {
        const first = t.book?.titles[0] || "the first activity";
        const example = {
          Reels:
            "Show the first page of " +
            offer +
            ". Demonstrate “" +
            first +
            "” in three shots: the materials, the first move, and the finished example.",
          Captions:
            "Made for " +
            buyer.toLowerCase() +
            ". Start with “" +
            first +
            "”, then repeat at your own pace. See the sample before you decide.",
          Stories:
            "Frame 1: Ask what makes getting started difficult. Frame 2: Share the first activity. Frame 3: Invite a reply with a question.",
          Email:
            "Subject: A look inside " +
            offer +
            "\n\nHere is the starting activity, “" +
            first +
            "”. It shows the level of detail you can expect in the rest of the product.",
          "Seven-day calendar": [
            "Introduce the problem",
            "Share the sample page",
            "Demonstrate one activity",
            "Answer a reader question",
            "Show the outline",
            "Invite feedback",
            "Share the offer",
          ]
            .map((v, i) => "Day " + (i + 1) + " · " + v)
            .join("\n"),
          Checklist:
            "Review the sample PDF, price and listing. Test the checkout. Confirm partner attribution before posting.",
        };
        t.results[id] = Object.entries(example)
          .map(([heading, text]) => "## " + heading + "\n" + text)
          .join("\n\n");
      } else if (id === "launch-0")
        t.results[id] =
          "Help " +
          buyer.toLowerCase() +
          " get started with " +
          offer +
          ". Offer a preview of the first activity, then invite them to review the full product.";
      break;
    case "book":
      t.book = {
        title: offer,
        titles,
        sources: food ? sources : [],
        units: Object.fromEntries(
          titles.map((v, i) => [
            i,
            `For ${buyer.toLowerCase()} · ${offer}\n\n` +
              (food && units(C.f)[i]
                ? chapterText(units(C.f)[i])
                : `## ${v}\nChoose a starting point. Model the activity once, then invite the learner to try.\n\n${preschool ? "[TRACE: " + (i === 3 ? "circle" : i > 3 ? "A" : "line") + "]" : "[WRITE]"}\n\nReview what worked before starting the next activity.`),
          ]),
        ),
      };
      complete(t, 4);
      break;
    case "offerprice":
      if (!p.price || Number(p.price) <= 0)
        throw Error("Enter a positive price.");
      t.price = Number(p.price);
      break;
    case "verify":
      t.verified = [contact];
      t.checks = {
        sample: { verified: [contact], result: "Verified (sample)" },
      };
      break;
    case "inboxes":
      t.inboxes = [
        { email: sender, status: 1, warmup_status: 1, daily_limit: 20 },
      ];
      break;
    case "savedraft":
      t.mailDraft = { ...p };
      break;
    case "usesender":
      t.mailDraft = { ...t.mailDraft, sender: value };
      break;
    case "campaign":
      for (const key of [
        "sender",
        "subject",
        "body",
        "followSubject",
        "followBody",
      ])
        t[key] = p[key] || t.mailDraft?.[key] || "";
      t.campaignId = "practice";
      t.campaignStatus = "Paused";
      break;
    case "leads":
      t.leadsAdded = true;
      break;
    case "activate":
    case "pause":
      t.campaignStatus = op === "pause" ? "Paused" : "Sending";
      break;
    case "analytics":
      t.analytics = {
        emails_sent_count: 1,
        contacted_count: 1,
        leads_count: 1,
        reply_count: 1,
      };
      t.timeline = [
        {
          ue_type: 2,
          lead: contact,
          eaccount: sender,
          subject: "Please send a sample",
        },
      ];
      break;
    case "cover":
    case "coverStatus":
      t.coverState = "Sample cover preview";
      break;
    case "hidden":
      t.productId = "practice";
      t.visible = false;
      break;
    case "publish":
    case "hide":
      t.visible = op === "publish";
      break;
    case "test":
      break;
    default:
      throw Error("This action uses a connected account in Live.");
  }
}

export function fillExample(C) {
  let t = demoTrack(C);
  const run = (s, i, op, p = {}, v = "") => practice({ ...C, s, i }, op, p, v);
  if (!t.title) {
    run("build", 0, "discover");
    run("build", 0, "useidea", {}, 1);
    t = demoTrack(C);
  }
  if (!t.completedSteps[1]) run("build", 1, "batch");
  if (!t.completedSteps[2]) {
    run("build", 2, "write");
    run("build", 2, "pickbuyer", {}, buyerGroups(t.results["build-2"])[0].name);
  }
  if (!t.completedSteps[3]) run("build", 3, "write");
  if (!t.completedSteps[4]) run("build", 4, "book");
  if (!t.completedSteps[5]) {
    run("build", 5, "batch");
    run("build", 5, "write");
  }
  if (!t.completedSteps[6]) run("build", 6, "write");
  for (const [i, op] of [
    [0, "batch"],
    [1, "verify"],
    [2, "inboxes"],
    [3, "write"],
    [4, "campaign"],
    [4, "leads"],
    [4, "activate"],
    [4, "analytics"],
  ])
    run("outreach", i, op);
  run("launch", 0, "write");
  run("launch", 1, "hidden");
  run("launch", 1, "publish");
  run("launch", 2, "write");
}
export function launchPage(C, t) {
  const id = "launch-" + C.i,
    report = t.results?.[id] || "";
  const op = (label, action) => b(label, "liveop", action);
  const brief =
    field("Product title", "live-title", t.title || "") +
    field(
      "Launch brief",
      "live-notes",
      t.notes?.[id] || t.results?.["build-6"] || "",
      "area",
    );
  const sections = report
    .split(/(?=^##\s+)/m)
    .filter((s) => s.trim())
    .map((s) => {
      const lines = s.trim().split("\n"),
        hasHeading = /^##\s+/.test(lines[0]),
        heading = hasHeading
          ? lines.shift().replace(/^##\s+/, "")
          : "Launch notes";
      const copy = lines.join("\n").trim();
      return card(
        heading,
        '<p class="pre">' +
          e(copy) +
          "</p>" +
          b("Copy " + heading, "copy", copy),
      );
    });
  const contents = [
    () =>
      card(
        "Offer brief",
        brief +
          row(
            op("Research competitors", "batch"),
            op("Prepare launch brief", "write"),
          ),
      ) +
      (report
        ? card("Saved offer research", '<p class="pre">' + e(report) + "</p>")
        : ""),
    () =>
      grid([
        card(
          "Store preview",
          brief +
            (t.book?.titles?.length
              ? "<p>Download the reviewed product and attach it in Whop before opening checkout.</p>" +
                b("Download product PDF", "livepdfdown")
              : ""),
        ),
        card(
          "Whop listing",
          badge(t.productId ? (t.visible ? "Visible" : "Hidden") : "Draft") +
            field("Price in USD", "live-price", t.price ?? "", "number") +
            field("Quantity when visible", "live-stock", 1, "number") +
            row(
              op("Create hidden listing", "hidden"),
              ...(t.productId
                ? [
                    op(
                      t.visible ? "Hide listing" : "Review publication",
                      t.visible ? "hide" : "publish",
                    ),
                  ]
                : []),
            ),
        ),
      ]),
    () =>
      card(
        "Campaign brief",
        brief +
          op(report ? "Regenerate launch kit" : "Create launch kit", "write"),
      ) + grid(sections),
  ];
  return (
    '<div class="stepshead"><span class="eyebrow">Launch · Step ' +
    (C.i + 1) +
    " of 3</span><h1>" +
    ["Prepare the offer", "Your storefront", "Everything for launch week"][
      C.i
    ] +
    "</h1>" +
    row(
      b(
        C.i === 0
          ? "Review storefront"
          : C.i === 1
            ? "Open launch kit"
            : "Continue",
        "next",
        "",
        "primary",
        "arrow",
      ),
    ) +
    '</div><div class="stack">' +
    contents[C.i]() +
    "</div>"
  );
}
