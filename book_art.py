"""Estimate, submit and collect artwork as part of a confirmed printable build."""

from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from time import sleep
from urllib.parse import quote
from uuid import uuid4

from cover_art import image_tools, save_cover
from providers import amount, request, require

MODEL = "higgsfield-ai/soul/v2/standard"
FAILED = {"failed", "nsfw", "canceled", "cancelled"}


def plan_art(p, track, book, slots, keys):
    image_tools()
    require(
        keys.get("Higgsfield", {}).get("key"),
        "Add your Higgsfield key first. It opens below.",
    )
    style = (
        p.get("artDirection")
        or book.get("artDirection")
        or (
            "A cohesive illustrated field guide: warm paper, restrained teal and ochre, clear silhouettes, soft natural texture."
        )
    )
    tasks = []
    owner = track.get("coverIdea") or track.get("book", {}).get("title")
    current_cover = owner in (None, track.get("title"))
    for i in range(-1, len(slots)):
        front = i == -1
        state = (
            book.get("frontArt", {})
            if front
            else book.get("artwork", {}).get(str(i), {})
        )
        if state.get("file") or (front and current_cover and track.get("coverVersion")):
            continue
        label = "cover" if front else f"page {i + 1}"
        detail = (
            p["title"] if front else slots[i]["section"] + " / " + slots[i]["title"]
        )
        prompt = (
            f"Create a {'front cover' if front else 'page illustration'} for {p['title']}. "
            f"Subject: {detail}. Reader: {track.get('buyer', '')}. {style} "
            "One distinctive focal subject with generous margins. No words, lettering, numbers, or instructional diagrams."
        )
        if not front:
            detail_text = " ".join(
                str(b["value"])
                for b in book.get("pages", {}).get(str(i), {}).get("blocks", [])
                if b["type"] == "paragraph"
            )
            if detail_text:
                prompt += " Page context: " + detail_text[:500]
        existing_id = state.get("id") if state.get("status") not in FAILED else None
        if (
            front
            and not existing_id
            and current_cover
            and track.get("coverState") not in FAILED
        ):
            existing_id = track.get("coverId")
        tasks.append(
            dict(
                index=i,
                label=label,
                direction=style,
                id=existing_id,
                payload=state.get("pendingInput") or {"prompt": prompt[:4000]},
            )
        )

    def estimate(task):
        if task["id"]:
            return 0.0
        price = request(
            keys, "Higgsfield", "/estimate/" + MODEL, "POST", task["payload"]
        )["usd"]
        return amount(price, 0.00001)

    with ThreadPoolExecutor(max_workers=3) as pool:
        for task, price in zip(tasks, pool.map(estimate, tasks)):
            task["price"] = price
    return tasks


def build_art(tasks, book, keys, folder, persist):
    for task in tasks:
        i = task["index"]
        job = (
            book.setdefault("frontArt", {})
            if i == -1
            else book.setdefault("artwork", {}).setdefault(str(i), {})
        )
        if job.get("file"):
            continue
        try:
            if task["id"]:
                job.update(id=task["id"])
            else:
                job.setdefault("submissionKey", str(uuid4()))
                job.update(pendingInput=task["payload"], direction=task["direction"])
                persist()
                task["attempted"] = True
                ans = request(
                    keys,
                    "Higgsfield",
                    "/" + MODEL,
                    "POST",
                    task["payload"],
                    {"Idempotency-Key": job["submissionKey"]},
                )
                require(ans.get("request_id"), "Provider did not return a request ID.")
                job.update(id=str(ans["request_id"]), status="queued")
                persist()
            for attempt in range(100):
                status = request(
                    keys,
                    "Higgsfield",
                    "/requests/" + quote(job["id"], safe="") + "/status",
                )
                job["status"] = status.get("status", "unknown")
                if job["status"] == "completed":
                    images = status.get("images") or []
                    require(
                        images and images[0].get("url"),
                        "The finished image is still unavailable.",
                    )
                    filename = (
                        "illustration-"
                        + sha256(job["id"].encode()).hexdigest()
                        + ".jpg"
                    )
                    save_cover(images[0]["url"], folder / filename, interior=i != -1)
                    job.update(
                        file=filename, savedId=job["id"], direction=task["direction"]
                    )
                    job.pop("pendingInput", None)
                    persist()
                    break
                if job["status"] in FAILED:
                    job.pop("submissionKey", None)
                    job.pop("pendingInput", None)
                    raise ValueError(
                        "Higgsfield marked the image " + job["status"] + "."
                    )
                sleep(3)
            else:
                raise ValueError("Higgsfield is still processing this request.")
        except (ValueError, OSError) as err:
            persist()
            raise ValueError(
                f"Artwork for {task['label']}: {err} Resume the build to continue with saved work."
            ) from err
