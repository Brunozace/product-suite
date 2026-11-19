"""Conservative, local reply triage. All outputs are reviewable drafts."""

import re
from html import unescape


def triage(messages):
    result = []
    for r in messages:
        body = r.get("body") or ""
        if isinstance(body, dict):
            body = body.get("text") or body.get("html") or ""
        text = unescape(re.sub(r"<[^>]+>", " ", str(body))).strip()
        current = re.split(r"\n(?:On .+ wrote:|From:|>)", text, maxsplit=1)[0]
        s = (str(r.get("subject", "")) + " " + current).lower()
        if re.search(r"out of (the )?office|automatic reply|on vacation|away until", s):
            label = "Out of office"
            draft = ""
        elif re.search(
            r"unsubscribe|not interested|remove me|stop|no thanks|not now|do not contact|no thank you",
            s,
        ):
            label = "Not now"
            draft = ""
        elif re.search(r"wrong person|wrong contact|not responsible", s):
            label = "Wrong person"
            draft = "Thank you for letting me know. I will leave it here."
        elif re.search(r"price|pricing|cost|how much|per month", s):
            label = "Pricing question"
            draft = "Thanks for asking. May I send the package details so you can check exactly what is included?"
        elif "?" in current:
            label = "Question"
            draft = (
                "Thanks for the question. I will check the details and get back to you."
            )
        elif re.search(r"interested|send (it|the sample)|sounds good|yes", s):
            label = "Interested"
            draft = "Thanks for your interest. I can share the sample here for you to review."
        else:
            label = "Needs review"
            draft = ""
        result.append(
            {
                "id": r.get("id"),
                "from": r.get("from_address_email"),
                "subject": r.get("subject"),
                "message": current[:6000],
                "label": label,
                "draft": draft,
            }
        )
    return result
