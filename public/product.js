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
  book,
  select,
} from "./ui.js";
import {
  formats,
  pockets,
  quotes,
  product,
  offers,
  prices,
} from "./catalog.js";
import { chapters, sources, units } from "./book.js";
export const kitTabs = [
  "Reels",
  "Captions",
  "Emails",
  "Stories",
  "FAQs",
  "7-day plan",
  "Disclosure",
  "Final check",
];
export function kit(photo = false) {
  const topic = photo
      ? "the Airbnb Photo Pack"
      : "the Small Appetite Protein Plan",
    disclose = `I earn from each sale of ${topic}.`;
  const tips = photo
    ? [
        "Compare the window light in both versions.",
        "Check the corners for consistent color.",
        "Show the whole room with the original framing.",
      ]
    : [
        "Write down one meal you already enjoy.",
        "Keep a short list for low-effort days.",
        "Bring your meal questions to your care team.",
      ];
  return [
    tips.map(
      (tip, i) =>
        `${disclose}\n${["What changed between these two pictures?", "What would you keep on your list?", "Can one small detail make this easier?"][i]}\n${tip} Open the sample. Look at one page together. Link in my bio.\nScreen: question, detail, sample. Shot: film the sample on a table with your phone.`,
    ),
    [
      "A look inside",
      "One thing to try",
      "How it works",
      "A reader question",
      "Launch week wrap",
    ].map(
      (x, i) =>
        `${disclose}\n${x}. ${tips[i % 3]} You can look through the sample before you decide. Link in my bio.`,
    ),
    [
      "Launch: take a look inside",
      "A small tip for today",
      "One last note about the guide",
    ].map(
      (x, i) =>
        `${x}\n\n${disclose} ${tips[i]} If it looks useful, the sample and package details are on the store page.`,
    ),
    [
      "Poll: which sample would you open?",
      "You asked: what comes in the pack?",
      "Peek inside: show the first page.",
      "Price and link: open the store.",
      "Disclosure: show how I earn.",
      "Question box: what is unclear?",
      "Reply: share only with permission.",
      "Thank you: show the link once more.",
    ].map((x) => disclose + "\n" + x),
    [
      "What does it cost? " +
        (photo ? "The demo photo pack is $49." : "The demo ebook is $37."),
      "What is included? " +
        (photo
          ? "Up to ten light and color edits."
          : "Ten chapters, a planning worksheet and source notes."),
      "Can I see a sample? Yes, review it before buying.",
      "Is this medical advice? It is general information. Ask a qualified clinician about your care.",
      "What about refunds? Review the seller’s posted terms before checkout.",
      "Who created it? Disclose who drafted and reviewed the finished work.",
    ],
    [
      "Introduce the sample | Poll | Launch email | Awareness",
      "Share one tip | Behind the scenes | No email | Teach",
      "Show the process | Question box | Tip email | Explain",
      "Answer a question | Sample | No email | Clarify",
      "Show what is included | Link | No email | Inform",
      "Share a permitted reply | Poll | No email | Listen",
      "Wrap up | Thank you | Final note | Close the week",
    ],
    [
      disclose,
      "Put the disclosure beside the endorsement, where the reader can see it.",
      "FTC guidance: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers",
    ],
    [
      "Check all facts",
      "Review source links",
      "Read the full product",
      "Verify the price",
      "Check seller details",
      "Confirm file access",
      "Review refund terms",
      "Read every caption",
      "Include disclosures",
      "Check link destinations",
      "Preview on a phone",
      "Approve each post",
    ],
  ];
}
const cite = (t) =>
  e(t).replace(/\[(\d+)\]/g, (_, n) => b("[" + n + "]", "source", n, "src"));
export const chapterText = (c) =>
  [
    c.short,
    ...c.sections.map(([s, p]) => s + "\n" + p),
    "Try tonight\n" + c.tryIt,
    "Remember\n" + c.remember.join("\n"),
  ].join("\n\n");
export function bookView(C) {
  const { f, d } = C,
    all = units(f),
    i = Math.min(d.unit || 0, all.length - 1),
    c = all[i],
    word = f === "Ebook" ? "Chapter" : f === "Course" ? "Lesson" : "Week",
    texts = all.map((a, j) => d.edits?.[j] ?? chapterText(a));
  return `${stats([
    [all.length, word + "s"],
    [sources.length, "Source notes"],
    [texts.join(" ").split(/\s+/).length.toLocaleString(), "Words"],
  ])}<div class="actions">${b("Open the PDF", "pdf")}${b("Download PDF", "pdfdown")}${b("Edit this " + word.toLowerCase(), "editbook")}${b("Undo my edits", "undobook", "", "quiet")}</div>${card("Contents", '<div class="chips">' + all.map((a, j) => b(j + 1 + ". " + a.title, "unit", j, i === j ? "chosen" : "")).join("") + "</div>")}<article class="paper stack"><span class="label">${word} ${i + 1} of ${all.length}</span><h2>${e(c.title)}</h2>${d.edits?.[i] !== undefined ? '<p class="pre">' + cite(texts[i]) + "</p>" : `<div class="boxnote"><b>The short version</b><p>${cite(c.short)}</p></div>${c.sections.map(([s, p]) => "<h3>" + e(s) + "</h3><p>" + cite(p) + "</p>").join("")}<div class="boxnote"><b>Try tonight</b><p>${cite(c.tryIt)}</p></div><h3>Remember</h3>${list(c.remember)}`}<small>General information, not medical advice.</small></article><details class="card sources" id="sources"><summary>Source notes · ${sources.length} public references</summary><ol>${sources.map(([s, u], j) => `<li id="source-${j + 1}" class="sourcejump"><a href="${u}" target="_blank" rel="noopener">${e(s)}</a> · MedlinePlus</li>`).join("")}</ol></details>`;
}
export function productView(C) {
  let { s, i, f, d } = C,
    offer = offers[f];
  if (s === "build") {
    if (i === 0)
      return (
        card(
          "What would you like to make?",
          select(
            "idea-kind",
            ["A topic", "A group of people", "Something I know well"],
            d.kind || "A topic",
          ) +
            field(
              "Your starting idea",
              "idea",
              d.idea ||
                "Small, practical protein meals for adults taking GLP-1 medicines.",
              "area",
            ) +
            card("Five sample ideas (demo)", pockets.map(([title, , need], index) =>
              row(b((index + 1) + ". " + title, "example", title), e(need))
            ).join("")),
        ) +
        card(
          "What happens next",
          list([
            "Read what buyers say and what they already pay for.",
            "Score five buyer groups and choose one.",
            "Build your outline and review the draft.",
          ]),
        )
      );
    if (i === 1)
      return (
        card(
          "What buyers say",
          badge("Illustrative quotes (demo)", "violet") +
            grid(
              quotes.map(
                (q, j) =>
                  `<blockquote>“${e(q)}”<br><small>Research note ${j + 1} (demo)</small></blockquote>`,
              ),
            ),
        ) +
        card(
          "What they already pay for",
          table(
            ["Listing (demo)", "Platform", "Price", "Reviews"],
            [
              ["Small meal workbook", "Etsy", "$8", "34"],
              ["A gentle kitchen journal", "Amazon", "$16", "61"],
              ["Lunch prep cards", "Etsy", "$6", "22"],
            ],
          ),
        ) +
        card(
          "Where we looked",
          table(
            ["Search", "Query (demo)", "Results (demo)"],
            ["Reddit", "Amazon", "Etsy", "TikTok", "YouTube"].map((n, j) => [
              n,
              e(d.idea || "GLP-1 protein") + " small meals",
              [18, 12, 14, 22, 16][j],
            ]),
          ) +
            "<p>Demo finding: planning sheets recur. A sourced guide could address unanswered questions.</p>",
        )
      );
    if (i === 2)
      return pockets
        .map(([n, sc, pain, proof], j) =>
          card(
            n,
            `<div class="spread"><div class="ring">${sc.reduce((a, b) => a + b, 0)}</div>${badge(j === (d.pocket ?? 0) ? "Selected" : "Score out of 25", j === (d.pocket ?? 0) ? "green" : "")}</div><p>${e(pain)}</p>${["Lasts", "Easy to make", "Runs itself", "Buys again", "Room to win"].map((l, k) => `<div class="spread small">${l}<span>${sc[k]} / 5</span></div><div class="bar"><i style="width:${sc[k] * 20}%"></i></div>`).join("")}<details><summary>See the proof (demo)</summary><p>${e(proof)} Example buyer note: “${e(j === 0 ? quotes[0] : pain)}”</p><p>Audience size: unmeasured. Research channel: niche discussion groups.</p></details>${b("Pick this one", "pocket", j)}`,
          ),
        )
        .join("");
    if (i === 3)
      return (
        card(
          "Your " + f.toLowerCase() + " plan",
          `${select("format-plan", formats, f)}<h2>${e(offer)}</h2><p>A practical guide to planning meals and bringing useful questions to a care visit.</p>`,
        ) +
        grid([
          card(
            "Before",
            list([
              "Have: an unfinished shopping list",
              "Do: decide what to cook at the last minute",
              "Feel: unsure what to ask",
            ]),
          ),
          card(
            "After",
            list([
              "Have: a usable meal notebook",
              "Do: prepare a familiar backup",
              "Feel: ready for a care conversation",
            ]),
          ),
        ]) +
        card(
          "The outline",
          "<ol>" +
            units(f)
              .map((u) => "<li>" + e(u.title) + "</li>")
              .join("") +
            "</ol>",
        ) +
        card(
          "Milestones and bonuses",
          list([
            "Notice: complete a meal note.",
            "Plan: write a backup meal.",
            "Try: use the shopping list.",
            "Review: take questions to a clinician.",
            "Bonus sheets: tracker, shopping list, swaps and visit questions.",
          ]) + badge("$" + prices[f] + " suggested demo price", "orange"),
        )
      );
    if (i === 4) return bookView(C);
    if (i === 5)
      return (
        card(
          "Creator profile",
          field(
            "Public handle",
            "handle",
            d.handle || "@miraslittlekitchen (demo)",
          ) +
            stats([
              ["Mira (demo)", "Creator"],
              ["24.8k", "Followers (demo)"],
              ["9", "Saved posts"],
            ]),
        ) +
        grid(
          chapters
            .slice(0, 9)
            .map(
              (c, j) =>
                `<button class="toolcard" data-act="post" data-v="${j}"><img class="samplepic" src="/media/plate.jpg" alt="Sample meal"><div class="toolinfo">${e(c.voice)}</div></button>`,
            ),
          "three",
        ) +
        card(
          "Voice profile",
          list([
            "Practical: begins with a kitchen object. See post 1.",
            "Warm: invites the reader to try one thing. See post 4.",
            "Meal prep 50%, everyday routines 30%, questions 20% (demo).",
            "Audience: home cooks who want a manageable first step.",
          ]) +
            select(
              "voice-unit",
              units(f).map((c) => c.title),
              units(f)[d.voiceUnit || 0]?.title,
            ),
        ) +
        grid([
          card("Original", e(units(f)[d.voiceUnit || 0].short)),
          card(
            "From Mira’s kitchen (demo)",
            e(units(f)[d.voiceUnit || 0].voice) +
              " " +
              e(units(f)[d.voiceUnit || 0].short) +
              "<details><summary>Read the creator edition</summary>" +
              units(f)
                .map(
                  (c) =>
                    "<h3>" +
                    e(c.title) +
                    "</h3><p>" +
                    e(c.voice) +
                    "</p>" +
                    c.sections
                      .map(
                        ([sub, txt]) =>
                          "<h4>" + e(sub) + "</h4><p>" + cite(txt) + "</p>",
                      )
                      .join("") +
                    '<div class="boxnote">From Mira’s kitchen (demo): ' +
                    e(c.voice) +
                    "</div>",
                )
                .join("") +
              "</details>",
          ),
        ])
      );
    return (
      card(
        "Strong on Small Plates",
        `<div class="spread"><div><h2>${e(offer)}</h2><p>Creator edition with Mira Lane (demo)</p>${badge("$" + (d.price ?? prices[f]) + " one time", "orange")}</div>${book()}</div>`,
      ) +
      card(
        "Store copy",
        list([
          "A meal-planning notebook",
          "An ingredient map",
          "Low-effort lunch ideas",
          "Questions for a care visit",
          "A two-week practice plan",
          "Public source notes",
        ]) +
          "<p>Review the sample and seller terms before buying. Optional recipe pack: $19 (demo).</p>",
      ) +
      card(
        "Invite the creator",
        "<p>I put together a sample based on your small-bowl reel. Would you like to review the guide and talk about sharing each sale?</p>" +
          b(
            "Copy invitation",
            "copy",
            "Would you like to review the guide and talk about sharing each sale?",
          ),
      )
    );
  }
  if (s === "launch" && i === 0)
    return (
      card(
        "Your offer",
        `<h2>${e(offer)}</h2><p>For adults who need a practical way to plan a small meal and organize questions for their clinician.</p>${field("One-time price ($)", "offer-price", d.price ?? prices[f], "number")}${list(["A compact guide and a printable tracker", "Before: a pile of scattered meal ideas. After: one usable notebook.", "Previous attempts: a long meal schedule that did not fit a shift."])}`,
      ) +
      card(
        "Three pitches",
        list([
          "You keep asking me what I put in a small bowl. So I made a kitchen guide.",
          "You keep asking me how I plan a busy week. So I made a printable tracker.",
          "You keep asking me what to bring to a visit. So I made a question sheet.",
        ]),
      ) +
      card("Questions before buying", list(kit()[4].slice(0, 5))) +
      card(
        "Comparable offers (demo)",
        table(
          ["Product", "Price", "Includes"],
          [
            ["Meal planner", "$5", "Weekly pages"],
            ["Kitchen journal", "$16", "Blank templates"],
          ],
        ),
      )
    );
  if (s === "launch" && i === 2) return kitView(C);
  return storeView(C);
}
export function storeView(C) {
  let { d, t } = C,
    price = d.price ?? prices[t];
  return (
    card(
      "Store preview",
      `<div class="spread"><div><span class="eyebrow">Whop · demo listing</span><h2>${e(offers[t])}</h2><p>${e(d.package || "Digital download and sample files")}</p><h3>$${e(price)} · ${t === "Ad Remakes" ? "monthly" : "one time"}</h3>${b("Get instant access", "checkout", "", "primary")}</div>${t === "Airbnb Photos" ? '<img class="samplepic" style="width:35%" src="/media/room.jpg" alt="Living room">' : book()}</div>`,
    ) +
    card(
      "Publishing controls",
      row(
        badge(
          d.visible ? "Visible (demo)" : "Hidden (demo)",
          d.visible ? "green" : "violet",
        ),
        badge("Stock " + (d.visible ? 1 : 0)),
        badge("ID: demo_" + t.toLowerCase().replaceAll(" ", "_")),
      ) +
        row(
          b("Publish hidden", "publish", "hidden"),
          b(
            d.visible ? "Hide listing" : "Make it visible",
            "publish",
            d.visible ? "hide" : "visible",
          ),
        ) +
        `<details><summary>More options</summary><pre>${e(JSON.stringify({ name: offers[t], price, stock: d.visible ? 1 : 0, visibility: d.visible ? "visible" : "hidden" }, null, 2))}</pre>${b("Download listing", "listingdown")}</details>`,
    )
  );
}
export function kitView(C) {
  const tab = C.d.kitTab || 0,
    photo = !!C.d.photoKit,
    data = kit(photo);
  return (
    card(
      "Launch week kit",
      row(
        b("Product kit", "kitmode", "product", photo ? "" : "chosen"),
        b("Photo pack kit", "kitmode", "photo", photo ? "chosen" : ""),
      ) +
        `<div class="chips">${kitTabs.map((n, i) => b(n, "kittab", i, i === tab ? "chosen" : "")).join("")}</div>`,
    ) +
    (tab === 5
      ? card(
          "Seven days",
          table(
            ["Day", "Post", "Story", "Email", "Goal"],
            data[5].map((x, i) => [i + 1, ...x.split(" | ").map(e)]),
          ),
        )
      : tab === 7
        ? card(
            "Before posting",
            data[7]
              .map(
                (x, i) =>
                  `<label class="listline" style="display:block"><input type="checkbox" data-check="${i}" ${C.d.checks?.[i] ? "checked" : ""}> ${x}</label>`,
              )
              .join(""),
          )
        : data[tab]
            .map((x, i) =>
              card(
                kitTabs[tab] + " " + (i + 1),
                '<p class="pre">' + e(x) + "</p>" + b("Copy", "copy", x),
              ),
            )
            .join("")) +
    card(
      "How to post these",
      "<p>Choose a draft, check the facts and disclosure, preview it on your phone, then publish it yourself.</p>" +
        b("Download the whole kit", "kitdown"),
    )
  );
}
