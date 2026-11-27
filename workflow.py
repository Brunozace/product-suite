"""Dependencies for the guided product builder. Older work remains available for review."""

from providers import require


LABELS = ("Choose an idea", "Research the market", "Pick a buyer group", "Create the product plan",
          "Build the manuscript", "Research a creator’s voice", "Prepare the offer")


def completed(track):
    results = track.get("results", {})
    book = track.get("book", {})
    market = track.get("research", {}).get("build-1", {})
    flags = [bool(results.get("build-0")), any(r.get("rows") for r in market.values()),
             bool(track.get("buyer")), bool(results.get("build-3")),
             bool(book.get("titles")) and len(book.get("units", {})) == len(book["titles"]),
             bool(track.get("voiceReport")), bool(results.get("build-6"))]
    if "pages" in book:
        from page_builder import quality
        flags[4]=quality(book)["ready"]
    elif book:
        flags[4]=bool(book.get("titles")) and all(str(book.get("units",{}).get(str(i),"")).strip() for i in range(len(book.get("titles",[]))))
    return [ok and i not in track.get("staleSteps", []) for i, ok in enumerate(flags)]


def changed(track, index):
    stale = set(track.get("staleSteps", []))
    if index < 5:
        track["voiceResearchCurrent"]=False
    stale.discard(index)
    stale.update(range(index + 1, len(LABELS)))
    track["staleSteps"] = sorted(stale)


def prepare(p, track):
    index = int(p["step"].split("-")[1])
    # Cover artwork is independent of manuscript generation.
    if p["op"] in ("discover", "cover", "coverStatus","pageArt","pageArtStatus"):
        return
    for earlier, ok in enumerate(completed(track)[:index]):
        if not ok:
            require(False, LABELS[earlier] + " first, then return to this step.")
    if index == 1 and p["op"] == "batch" and 1 in track.get("staleSteps", []):
        require(not p.get("retry"), "Research the selected idea before retrying a single source.")
    if index == 1 and p["op"] == "write":
        require(completed(track)[1], "Run market research for this idea first.")
    if index == 4:
        references = []
        for batch in track.get("research", {}).get("build-1", {}).values():
            for hit in batch.get("rows", [])[:4]:
                if not isinstance(hit, dict):
                    continue
                url = next((hit[k] for k in ("url", "webUrl", "productUrl", "listingUrl", "webVideoUrl", "videoUrl")
                            if isinstance(hit.get(k), str) and hit[k].startswith("https://")), "")
                if url:
                    references.append(str(hit.get("title") or hit.get("name") or hit.get("caption") or "")[:180] + " " + url)
        p["bookContext"] = ("\nSelected buyer: " + track["buyer"] +
                            "\nSelected idea: " + track["results"]["build-0"][:1800] +
                            "\nMarket observations (evidence of demand):\n" + "\n".join(references))
    if index in (2, 3, 6) and p["op"] == "write":
        p["instruction"] += "\nSelected idea: " + track["results"]["build-0"][:1800]
        if index >= 3:
            p["instruction"] += "\nSelected buyer: " + track["buyer"]
        if index == 6:
            p["instruction"] += "\nCreator research: " + track.get("voiceReport", "")[:3200]
