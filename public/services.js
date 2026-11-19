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
  link,
} from "./ui.js";
import { hustles, pitch, prices, offers, script } from "./catalog.js";
import { storeView } from "./product.js";
export const adAngles = ["Pain", "Proof", "Offer"];
const headlines = [
  ["A drip after the storm?", "See the roof up close", "Request a roof check"],
  [
    "Water mark on the ceiling?",
    "Look at the inspection notes",
    "Ask about a roof visit",
  ],
  [
    "Wondering about a loose tile?",
    "See what the roofer saw",
    "Book a roof check",
  ],
];
export const adParts = (d, j) => [
  headlines[(d.adSet || 0) % 3][j],
  [
    "Have a roofer inspect the spot before choosing a repair.",
    "Ask to see photos and notes from the inspection.",
    "Stone Roof Care (demo) offers roof checks in Austin.",
  ][j],
  "Roof inspections in Austin.",
  "Request a check",
  [
    "A roof after rain.",
    "A close view of roof tiles.",
    "A daylight view of the property.",
  ][j],
];
export const pkg = (t) =>
  t === "Airbnb Photos"
    ? [
        ["Free sample", 0, "One corrected photo"],
        ["Photo pack", 49, "Up to 10 photos in 2 days"],
        ["Monthly refresh", 99, "A new pack each month"],
      ]
    : t === "Ad Remakes"
      ? [
          ["First ad", 0, "One free concept"],
          ["Local Ad Plan", 200, "Three ads each month"],
          ["Studio plan", 350, "Six ads each month"],
        ]
      : [
          ["Single video", 45, "One original Short"],
          ["Shorts package", 150, "Four original Shorts"],
          ["Weekly video", 200, "One video a week"],
        ];
const listingName = (j) =>
  [
    "Garden",
    "Courtyard",
    "Terrace",
    "Orchard",
    "Park",
    "Hill",
    "Lake",
    "Birch",
  ][j % 8] +
  " " +
  ["Loft", "Studio", "Cottage", "Flat", "Suite"][Math.floor(j / 8)] +
  " (demo)";
export const filesFor = (t) =>
  t === "Airbnb Photos"
    ? [
        ["Original photo", "room-before.jpg"],
        ["Edited photo", "room.jpg"],
      ]
    : t === "Ad Remakes"
      ? [0, 1, 2, 3].map((n) => [
          n ? adAngles[n - 1] + " ad" : "Original ad",
          "roof-ad-" + n + ".jpg",
        ])
      : script.map((_, n) => ["Scene " + (n + 1), "short-" + (n + 1) + ".mp4"]);
const fileBtn = ([name, file]) =>
  `<a class="btn" href="/media/${file}" download="${file}">${e(name)} ↓</a>`;
export function serviceView(C) {
  const { s, t, i, d } = C;
  let idx = hustles.indexOf(t),
    brief = [
      "One free photo, then an edited pack.",
      "A free ad concept, then a monthly plan.",
      "An original sample, then four Shorts.",
    ][idx];
  if (s === "paid") {
    if (i === 0) {
      let picked = d.packageId ?? 1,
        price = d.price ?? prices[t],
        fee = d.fee ?? 3,
        cost = d.toolCost ?? [1.5, 1, 3][idx];
      return (
        grid(
          pkg(t).map(([n, pr, info], j) =>
            card(
              n,
              badge(j === 1 ? "Most pick this" : "Package") +
                "<h2>$" +
                pr +
                "</h2><p>" +
                info +
                "</p>" +
                b(
                  j === picked ? "Selected" : "Choose package",
                  "package",
                  j,
                  j === picked ? "chosen" : "",
                ),
            ),
          ),
          "three",
        ) +
        card(
          "What you take home",
          `<div class="formgrid">${field("Your price ($)", "price", price, "number")}${field("Whop fee in dollars (est.)", "fee", fee, "number")}${field("Tool cost in dollars (est.)", "toolCost", cost, "number")}</div><h2 class="peach">$${(price - fee - cost).toFixed(2)} est.</h2><p>Before tax. Prices are a starting point. Ask your first clients.</p>`,
        )
      );
    }
    if (i === 1) return storeView(C);
    if (i === 2) {
      let note = `Thanks for checking the sample. Here is your ${offers[t]} checkout: https://checkout.example/${t.split(" ")[0].toLowerCase()}. I can start once you confirm the brief.`;
      return card(
        "Pay link email",
        '<div class="paper pre">' +
          e(note) +
          "</div>" +
          row(
            b("Copy email", "copy", note),
            b("Review demo send", "payconfirm"),
          ) +
          badge("Reserved example link · demo"),
      );
    }
    return (
      card(
        "Your delivery",
        row(...filesFor(t).map(fileBtn)) +
          "<p>Review the files before attaching them to your Whop product.</p>",
      ) +
      card(
        "Delivery message",
        "<p>Thank you for the brief. Your finished files are ready in your purchase. Please tell me if you have a question about any file.</p>",
      ) +
      card(
        "Review request · 3 days later",
        "<p>How did the " +
          e(t.toLowerCase()) +
          " turn out? I would love to hear what worked for you.</p>" +
          row(
            b("Pick another hustle", "nav", "hustles"),
            b("Back to Home", "nav", "home"),
          ),
      )
    );
  }
  if (i === 3) {
    let [sub, body] = pitch(t);
    return (
      card(
        "A free sample first",
        `<p>${e(brief)}</p><div class="paper stack"><span class="label">Email 1 · demo</span><h3>${e(sub)}</h3><p class="pre">${e(body)}</p></div>` +
          row(
            b("Copy pitch", "copy", sub + "\n\n" + body),
            b("Load into outreach", "loadpitch"),
          ),
      ) +
      card(
        "Day 3 · one follow up",
        e(pitch(t, 1)[1]) + b("Copy follow up", "copy", pitch(t, 1)[1]),
      )
    );
  }
  if (idx === 0) {
    if (i === 0)
      return (
        card(
          "Listing search",
          field("City", "city", d.city || "Portland, Oregon") +
            badge("40 example listings", "violet"),
        ) +
        grid(
          Array.from({ length: 40 }, (_, j) =>
            card(
              listingName(j),
              `<img class="samplepic" loading="lazy" src="/media/room-before.jpg" alt="Example living room"><p>Entire place · ${(4.5 + (j % 5) / 10).toFixed(1)} stars · ${12 + j} reviews</p><p>$${80 + j}/night · ${6 + (j % 9)} photos</p>${badge("Weak photo score " + (9.8 - j * 0.1).toFixed(1))} ${b(d.listing === j ? "Selected" : "Choose listing", "listing", j)}`,
            ),
          ),
        )
      );
    if (i === 1)
      return (
        card(
          "Original photo assessment",
          '<img class="photo" src="/media/room-before.jpg" alt="Dim sample room">' +
            table(
              ["File", "Brightness /255", "Contrast", "Issue"],
              [
                [
                  "Original room",
                  C.metrics.before[0],
                  C.metrics.before[1],
                  "Dark, warm cast",
                ],
                [
                  "Corrected room",
                  C.metrics.after[0],
                  C.metrics.after[1],
                  "Brighter whites",
                ],
              ],
            ) +
            "<p>Brightness is the mean grayscale level. Contrast is its standard deviation. These figures come from the bundled files.</p>",
        ) +
        card(
          "Weakest listings",
          list(
            Array.from(
              { length: 5 },
              (_, j) => listingName(j) + " · check exposure first",
            ),
          ),
        )
      );
    return (
      card(
        listingName(d.listing ?? 0),
        `<div class="compare" style="--split:50%"><img src="/media/room.jpg" alt="Corrected living room"><img class="before" src="/media/room-before.jpg" alt="Dark original living room"><i></i><span>Before</span><span class="aftertag">After</span><input type="range" id="split" min="0" max="100" value="50" aria-label="Before and after split"></div><p>Drag, click or use the arrow keys to compare the same room.</p>`,
      ) +
      stats([
        [C.metrics.changed + "%", "Pixels changed by 8+ levels"],
        [C.metrics.before[0] + " to " + C.metrics.after[0], "Brightness"],
        [C.metrics.before[1] + " to " + C.metrics.after[1], "Contrast"],
      ]) +
      row(...filesFor(t).map(fileBtn))
    );
  }
  if (idx === 1) {
    if (i === 0)
      return (
        card(
          "Local ad search",
          field("Business type", "business", d.business || "Roofers") +
            field("City", "city", d.city || "Austin, TX") +
            table(
              ["Page (demo)", "Started", "Channel", "Weakness", ""],
              Array.from({ length: 12 }, (_, j) => [
                [
                  "Stone",
                  "Oak",
                  "Elm",
                  "River",
                  "Sun",
                  "Field",
                  "Blue",
                  "West",
                  "North",
                  "East",
                  "Pine",
                  "Peak",
                ][j] + " Roof Care (demo)",
                "2025-" + String(j + 1).padStart(2, "0") + "-01",
                "Facebook",
                ["Short headline", "No call to action", "Same creative"][j % 3],
                b("View ad", "adselect", j),
              ]),
            ),
        ) +
        card(
          "Selected original",
          '<img class="photo" src="/media/roof-ad-0.jpg" alt="Original sample roofing ad">',
        )
      );
    if (i === 1)
      return (
        grid(
          adAngles.map((angle, j) =>
            card(
              angle,
              badge("Demo brief · " + [4, 5, 4][j] + "/5") +
                adParts(d, j)
                  .map(
                    (s, k) =>
                      `<div class="listline"><span class="label">${["Headline", "Primary text", "Description", "Button", "Picture idea"][k]}</span><p>${e(s)}</p>${b("Copy", "copy", s, "quiet")}</div>`,
                  )
                  .join("") +
                b("Copy whole ad", "copy", adParts(d, j).join("\n")),
            ),
          ),
          "three",
        ) + b("Write again", "rewriteads")
      );
    return (
      grid(
        filesFor(t).map(([n, file], j) =>
          card(
            n,
            `<img class="photo" src="/media/${file}" alt="${e(n)}">${fileBtn([n, file])}`,
          ),
        ),
      ) + b("Download all", "assetzip")
    );
  }
  if (i === 0)
    return card(
      "Video search",
      field("Niche", "niche", d.niche || "Animated personal finance") +
        table(
          ["Channel (demo)", "Subscribers", "Views", "Outlier", "Video"],
          [
            "Jar Notes",
            "Pocket Picture",
            "Penny Paper",
            "The Coin Desk",
            "Quiet Ledger",
          ].map((n, j) => [
            n + " (demo)",
            7 + j + "k",
            144 - j * 18 + "k",
            12 - j + "x",
            [
              "A coin left alone",
              "The price of waiting",
              "Fees in pictures",
              "What is a budget?",
              "Two saving jars",
            ][j],
          ]),
        ),
    );
  if (i === 1)
    return (
      card(
        "Eight lines, under a minute",
        script
          .map(
            (s, j) =>
              `<div class="listline"><span class="label">${j === 0 ? "Hook" : j === 7 ? "End card" : "Scene " + j}</span>${e(s)}</div>`,
          )
          .join(""),
      ) +
      card(
        "Original work",
        "<p>Borrow the pacing and visual structure. Write original words and scenes. Repetitive material may be ineligible for monetization. Not financial advice.</p>",
      )
    );
  return (
    grid(
      script.map((line, j) =>
        card(
          "Scene " + (j + 1),
          `<video class="clip" muted controls playsinline preload="metadata" src="/media/short-${j + 1}.mp4"></video><p>${e(line)}</p>`,
        ),
      ),
      "four",
    ) + b("Download video pack", "assetzip")
  );
}
