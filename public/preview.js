import { e, field, row, b, modal, toast, download } from "./ui.js";
import { script } from "./catalog.js";
export function moviePreview(C, progress) {
  if (C.s === "build" && C.i === 4) {
    let lines = [
      "The short version",
      "Start with a meal you already enjoy. Write down one ingredient, one backup and one question for your care team.",
    ];
    return (
      '<div class="moviepaper"><b>' +
      lines[0] +
      "</b><p>" +
      e(
        lines[1].slice(0, Math.max(2, Math.floor(progress * lines[1].length))),
      ) +
      "</p></div>"
    );
  }
  if (C.s === "work" && C.i === 2) {
    if (C.t === "Airbnb Photos")
      return (
        '<div class="moviephoto"><img src="/media/room-before.jpg" alt="Original sample"><img src="/media/room.jpg" alt="Corrected sample" style="opacity:' +
        progress +
        '"></div>'
      );
    if (C.t === "Ad Remakes")
      return (
        '<img class="moviemedia" src="/media/roof-ad-' +
        Math.min(3, Math.floor(progress * 4)) +
        '.jpg" alt="Sample ad">'
      );
    return (
      '<div class="moviepaper"><b>Scene ' +
      (Math.floor(progress * 7) + 1) +
      "</b><p>" +
      e(script[Math.floor(progress * 7)]) +
      "</p></div>"
    );
  }
  let rows =
    C.s === "build" && C.i === 1
      ? [
          "Read public questions",
          "Collect listing examples",
          "Compare prices",
          "Review video titles",
          "Save source notes",
        ]
      : C.s === "outreach" || C.s === "clients"
        ? [
            "Load dedicated inboxes",
            "Check campaign records",
            "Prepare timeline",
            "Review reply tags",
          ]
        : ["Open the saved brief", "Load the work", "Prepare the result"];
  return (
    '<div class="movierows">' +
    rows
      .slice(0, Math.max(1, Math.ceil(progress * rows.length)))
      .map((s) => "<div>✓ " + e(s) + "</div>")
      .join("") +
    "</div>"
  );
}
export function compositionForm() {
  modal(
    "Design an ad picture",
    field("Business name", "ad-business") +
      field("Headline", "ad-headline") +
      field("Button text", "ad-cta", "Learn more") +
      '<label class="field">Approved photo<input id="ad-upload" type="file" accept="image/*"></label><p>Use an image you own or have permission to use.</p>' +
      b("Download 1080 px ad", "finishad", "", "primary"),
  );
}
export async function composeAd() {
  const file = document.querySelector("#ad-upload").files[0],
    get = (id) => document.querySelector("#" + id).value.trim(),
    head = get("ad-headline"),
    business = get("ad-business"),
    cta = get("ad-cta");
  if (!file || !head || !business || !cta)
    throw Error("Add the photo, business name, headline and button text.");
  const im = await createImageBitmap(file),
    c = document.createElement("canvas");
  c.width = c.height = 1080;
  let ctx = c.getContext("2d"),
    scale = Math.max(1080 / im.width, 1080 / im.height);
  ctx.drawImage(
    im,
    (1080 - im.width * scale) / 2,
    (1080 - im.height * scale) / 2,
    im.width * scale,
    im.height * scale,
  );
  let grad = ctx.createLinearGradient(0, 200, 0, 1080);
  grad.addColorStop(0, "#0000");
  grad.addColorStop(1, "#14121ce8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = "white";
  ctx.font = "bold 32px Arial";
  ctx.fillText(business, 48, 74, 975);
  ctx.font = "bold 74px Arial";
  let lines = [""];
  for (const word of head.split(/\s+/)) {
    let i = lines.length - 1,
      t = (lines[i] + " " + word).trim();
    if (ctx.measureText(t).width > 970 && lines[i]) lines.push(word);
    else lines[i] = t;
  }
  if (lines.length > 5) throw Error("Shorten the headline to five lines.");
  lines.forEach((line, i) =>
    ctx.fillText(line, 48, 835 - (lines.length - i - 1) * 83, 980),
  );
  ctx.font = "bold 38px Arial";
  ctx.fillStyle = "#ff8748";
  ctx.fillRect(48, 890, Math.min(990, ctx.measureText(cta).width + 72), 90);
  ctx.fillStyle = "#28190e";
  ctx.fillText(cta, 80, 949, 925);
  let blob = await new Promise((resolve) => c.toBlob(resolve, "image/png"));
  download(business.replace(/[^\w-]/g, "-") + "-ad.png", blob, "image/png");
  toast("Ad picture exported.");
}
export function compareForm() {
  modal(
    "Compare photo files",
    '<label class="field">Original photo<input type="file" accept="image/*" id="compare-old"></label><label class="field">Edited photo<input type="file" accept="image/*" id="compare-new"></label>' +
      b("Measure the change", "measurepair", "", "primary"),
  );
}
export async function compareFiles() {
  const files = ["compare-old", "compare-new"].map(
    (k) => document.querySelector("#" + k).files[0],
  );
  if (!files.every(Boolean)) throw Error("Choose both images.");
  const im = await Promise.all(files.map((f) => createImageBitmap(f)));
  if (Math.abs(im[0].width / im[0].height - im[1].width / im[1].height) > 0.02)
    throw Error("The framing changed. Use images with the same aspect ratio.");
  let c = document.createElement("canvas");
  c.width = 256;
  c.height = Math.max(1, Math.round((256 * im[0].height) / im[0].width));
  let ctx = c.getContext("2d", { willReadFrequently: true }),
    a = im.map((x) => {
      ctx.drawImage(x, 0, 0, c.width, c.height);
      let p = ctx.getImageData(0, 0, c.width, c.height).data;
      return Array.from(
        { length: p.length / 4 },
        (_, j) =>
          0.299 * p[j * 4] + 0.587 * p[j * 4 + 1] + 0.114 * p[j * 4 + 2],
      );
    });
  const mean = (x) => x.reduce((n, v) => n + v, 0) / x.length,
    avg = a.map(mean),
    std = a.map((x, i) => Math.sqrt(mean(x.map((v) => (v - avg[i]) ** 2)))),
    pct =
      (100 * a[0].filter((v, i) => Math.abs(v - a[1][i]) >= 8).length) /
      a[0].length;
  let urls = files.map((f) => URL.createObjectURL(f));
  modal(
    "Photo comparison",
    '<div class="compare" style="--split:50%"><img src="' +
      urls[1] +
      '" alt="Edited photo"><img class="before" src="' +
      urls[0] +
      '" alt="Original photo"><i></i><span>Before</span><span class="aftertag">After</span><input id="split" type="range" value="50" aria-label="Before and after split"></div><p>' +
      Math.round(pct) +
      "% changed. Brightness " +
      avg.map(Math.round).join(" to ") +
      ". Contrast " +
      std.map(Math.round).join(" to ") +
      ".</p><b>" +
      (pct < 8
        ? "The change is too small to sell. Try again."
        : "Review the furniture, framing and view before delivery.") +
      "</b>",
  );
  document
    .querySelector("dialog")
    .addEventListener(
      "close",
      () => urls.forEach((u) => URL.revokeObjectURL(u)),
      { once: true },
    );
}
