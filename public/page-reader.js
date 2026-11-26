import { b, badge, card, e, field, row, select, stats, val } from "./ui.js";
import { planOutline } from "./planning.js";

const types = [
  "Ebook",
  "Educational workbook",
  "Children's activity book",
  "Practical guide",
  "Cookbook",
  "Planner",
  "Journal",
  "Checklist",
  "Template collection",
];
let number = 0,
  zoom = 100,
  editing = null;
const button = (label, action, value = "") =>
  b(label, "press-" + action, value);
const op = (label, action) => b(label, "liveop", action);
function proofImage(index, alt, cls = "") {
  return (
    '<img class="' +
    cls +
    '" src="/document/Ebook/' +
    index +
    '.png" alt="' +
    e(alt) +
    '">'
  );
}
export function pageReader(t) {
  const bk = t.book || {},
    generated = bk.pages || {},
    q = t.pageQuality || { missing: [], issues: {} };
  const stale = t.staleSteps?.includes(4);
  const outline =
    (!stale && bk.outline) ||
    planOutline(t.results?.["build-3"] || "").join("\n");
  const names = bk.pages ? bk.titles : [],
    count = Object.keys(generated).length;
  const kind = bk.subtype || t.suggestedSubtype || "Ebook";
  number = Math.min(number, names.length);
  const key = String(number - 1),
    page = generated[key],
    complete = q.ready && !stale;
  const manuscript = Object.values(generated)
    .flatMap((p) => p.blocks)
    .filter((b) => ["paragraph", "heading", "callout"].includes(b.type))
    .map((b) => b.value)
    .join(" ")
    .trim();
  const setup = card(
    "Print format",
    select("book-subtype", types, kind) +
      "<details><summary>Reviewed plan and source material</summary>" +
      field("Title", "live-title", t.title || "") +
      field("Outline, one section per line", "book-outline", outline, "area") +
      field(
        "Source material",
        "live-notes",
        (!stale && bk.brief) || t.results?.["build-3"] || "",
        "area",
      ) +
      "</details>",
  );
  const cover = card(
    "Cover artwork · Higgsfield",
    field(
      "Art direction",
      "cover-prompt",
      t.coverPrompt ||
        "Portrait editorial artwork for " +
          (t.title || "this product") +
          ". Leave lettering to the book designer.",
      "area",
    ) +
      row(
        op("Review artwork estimate", "cover"),
        t.coverId ? op("Check cover job", "coverStatus") : "",
        t.coverState ? badge(t.coverState) : "",
      ),
  );
  const review = Object.entries({
    ...bk.failures,
    ...Object.fromEntries(
      Object.entries(q.issues).map(([k, v]) => [k, v.join(" ")]),
    ),
  });
  const sections = [...new Set((bk.slots || []).map((s) => s.section))];
  const chapters = sections.filter((section) =>
    bk.slots.every((s, i) => s.section !== section || generated[i]),
  ).length;
  const metrics = stats([
    [count, "Pages saved"],
    ...(kind === "Ebook"
      ? [
          [manuscript ? manuscript.split(/\s+/).length : 0, "Manuscript words"],
          [chapters + " / " + sections.length, "Chapters complete"],
        ]
      : [
          [q.exercises || 0, "Exercises"],
          [q.illustrations || 0, "Illustrations"],
        ]),
    [review.length, "Need review"],
    [q.missing.length, "Remaining in build"],
  ]);
  const findings =
    (q.coverError ? card("Cover needs attention", e(q.coverError)) : "") +
    (review.length
      ? card(
          "Pages needing attention",
          review
            .map(([k, msg]) =>
              row(
                button("Page " + (Number(k) + 1), "page", Number(k) + 1),
                e(msg),
              ),
            )
            .join(""),
        )
      : "");
  if (!count && !names.length)
    return (
      setup +
      card(
        "Ready to build",
        "<p>Your outline has " +
          outline.split("\n").filter(Boolean).length +
          " sections. Review the format, then build the printable pages.</p>" +
          op("Review build estimate", "book"),
      ) +
      cover
    );
  const controls = row(
    number ? button("Previous", "page", number - 1) : "",
    badge(number + 1 + " / " + (names.length + 1)),
    number < names.length ? button("Next page", "page", number + 1) : "",
    button("−", "zoom", -25),
    badge(zoom + "%"),
    button("+", "zoom", 25),
    button("Fullscreen", "full"),
  );
  const aside =
    '<aside class="press-contents">' +
    (count ? proofImage(0, "Book cover", "press-thumb") : "") +
    '<nav aria-label="Book contents">' +
    b("Front cover", "press-page", 0, number === 0 ? "chosen" : "") +
    names
      .map((title, i) =>
        b(
          i + 1 + ". " + title + (generated[i] ? "" : " · pending"),
          "press-page",
          i + 1,
          number === i + 1 ? "chosen" : "",
        ),
      )
      .join("") +
    "</nav></aside>";
  const preview =
    '<section class="press-proof" id="press-proof">' +
    controls +
    '<div class="press-scroll"><div class="press-sheet" style="width:' +
    zoom +
    '%">' +
    ((number === 0 && count) || page
      ? proofImage(number, page?.title || "Front cover")
      : "<p>This page is pending. Resume the build or regenerate this page.</p>") +
    "</div></div>" +
    row(
      page ? button("Edit page", "edit", key) : "",
      page ? button("Illustrate page", "show-art") : "",
      number ? button("Regenerate page", "regen", key) : "",
      complete ? b("Download PDF", "livepdfdown") : "",
    ) +
    "</section>";
  return (
    metrics +
    (stale
      ? card(
          "Previous edition",
          "Your plan has changed. Review the new outline and build it to update this edition.",
        )
      : "") +
    '<div class="press-reader">' +
    aside +
    preview +
    "</div>" +
    (page
      ? card(
          "Page illustration · Higgsfield",
          field(
            "Illustration style",
            "page-art-direction",
            bk.artwork?.[key]?.direction ||
              bk.artDirection ||
              (kind.includes("workbook") || kind.includes("activity")
                ? "Playful cut-paper illustration, warm cream paper, teal and ochre, simple shapes and a quiet background"
                : "Editorial illustration, warm natural light, restrained colors and a simple background"),
            "area",
          ) +
            row(
              button("Review illustration estimate", "art", key),
              bk.artwork?.[key]?.id
                ? button("Check illustration job", "art-status", key)
                : "",
              bk.artwork?.[key]?.status ? badge(bk.artwork[key].status) : "",
            ),
        )
      : "") +
    findings +
    (!complete
      ? card(
          "Export review",
          "Finish pending pages and resolve the listed findings to unlock the final PDF.",
        )
      : "") +
    setup +
    cover
  );
}
export async function readerAction(
  a,
  v,
  t,
  { api, refresh, render, modal, close, liveAction },
) {
  if (a === "press-full") {
    const el = document.querySelector("#press-proof");
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
    return;
  }
  if (a === "press-page" || a === "press-zoom") {
    if (a === "press-page") number = Number(v);
    else zoom = Math.min(200, Math.max(50, zoom + Number(v)));
    if (document.fullscreenElement) {
      const tmp = document.createElement("div");
      tmp.innerHTML = pageReader(t);
      document.fullscreenElement.innerHTML =
        tmp.querySelector("#press-proof").innerHTML;
    } else render();
    return;
  }
  if (a === "press-show-art") {
    if (document.fullscreenElement) await document.exitFullscreen();
    document.getElementById("page-art-direction")?.focus();
    return;
  }
  if (a === "press-art" || a === "press-art-status")
    return liveAction(
      a === "press-art" ? "pageArt" : "pageArtStatus",
      "",
      Number(v),
    );
  if (a === "press-regen") return liveAction("book", "", Number(v));
  if (a === "press-edit") {
    editing = t.book.pages[v];
    const inputs = editing.blocks
      .map((block, i) => {
        const label = i + 1 + ". " + block.type.replaceAll("_", " ");
        const choices = {
          illustration: ["pencil", "stars", "leaf", "shapes"],
          tracing_path: [
            "straight",
            "vertical",
            "diagonal",
            "curve",
            "wave",
            "zigzag",
          ],
          shape_practice: ["circle", "square", "triangle", "rectangle"],
        };
        if (choices[block.type])
          return (
            "<label>" +
            e(label) +
            select("block-" + i, choices[block.type], block.value) +
            "</label>"
          );
        const value =
          block.type === "table"
            ? block.value.map((r) => r.join(" | ")).join("\n")
            : Array.isArray(block.value)
              ? block.value.join("\n")
              : String(block.value);
        return field(
          label + (block.type === "table" ? " (columns separated by |)" : ""),
          "block-" + i,
          value,
          typeof block.value === "number"
            ? "number"
            : ["letter_practice", "number_practice"].includes(block.type)
              ? "text"
              : "area",
        );
      })
      .join("");
    modal(
      "Edit printable page",
      field("Page title", "press-title", editing.title) +
        inputs +
        '<details id="press-advanced"><summary>Edit block structure</summary>' +
        field(
          "Content blocks � JSON",
          "press-blocks",
          JSON.stringify(editing.blocks, null, 2),
          "area",
        ) +
        "</details>" +
        b("Save and proof page", "press-save", v, "primary"),
    );
    return;
  }
  if (a === "press-save") {
    let blocks;
    if (document.querySelector("#press-advanced").open) {
      try {
        blocks = JSON.parse(val("press-blocks"));
      } catch {
        throw Error("Check the content blocks for invalid JSON.");
      }
    } else
      blocks = editing.blocks.map((block, i) => {
        const value = val("block-" + i);
        return {
          type: block.type,
          value:
            block.type === "table"
              ? value
                  .split("\n")
                  .map((row) => row.split("|").map((s) => s.trim()))
              : Array.isArray(block.value)
                ? value.split("\n")
                : typeof block.value === "number"
                  ? Number(value)
                  : value,
        };
      });
    await api("editpage", {
      track: "Ebook",
      step: "build-4",
      unit: v,
      original: editing,
      page: { title: val("press-title"), blocks },
    });
    await refresh();
    close();
    render();
  }
}
