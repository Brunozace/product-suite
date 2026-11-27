# Dearwork

A local dashboard for building a digital product, finding buyers, running outreach and preparing a launch. Three service workspaces cover Airbnb photo edits, local ad remakes and original YouTube Shorts.

## Start

On Windows, double-click **Start Dearwork.cmd**. On Windows, macOS or Linux with Python 3.10 or newer, open a terminal in this folder and run:

```sh
python app.py
```

The launcher opens **http://127.0.0.1:8765** in your browser. If your computer names Python 3 `python3`, use `python3 app.py`. No package installation, Node build, API key or internet connection is needed for Demo. Press Ctrl+C in the terminal to stop the helper. To choose another port, run `python app.py --port 8766`.

For the Live page reader and print export, install the print dependencies once with `python -m pip install -r requirements.txt`. In **Build the ebook**, review the suggested print format and outline before approving a build. Preschool tracing sheets use local vector artwork. Other structured pages use the selected writing model and show a provider estimate. With a saved Higgsfield key, a full Live ebook build estimates writing, a missing cover, and one illustration for each interior page. One build confirmation starts generation, status checks and image downloads. Resume the build after an interruption to collect pending images. To replace a single illustration later, select its page and choose **Illustrate page**. **Check illustration job** imports the finished image into that page and the PDF. Subsequent pages reuse your art direction. Completed pages survive a failed run. Use **Regenerate page** for one sheet, or **Build manuscript** to resume missing pages. Open **Download PDF** after the page review passes. Existing text manuscripts retain their reader and export, with an option to create a printable edition.

## Try the demo

1. Open **Build it**, select **Build the ebook**, edit a chapter and download the updated 6 × 9 inch PDF. The ebook includes ten chapters and 24 public source links. The format switch also provides a six-lesson course and a four-week coaching plan.
2. Open **Unibox**, choose **Ad Remakes**, and open Rick’s pricing question in its campaign. Each track has its own leads, email drafts, replies and send board.
3. Choose **Airbnb Photos → Do the work → Fix one photo**. Drag the comparison or use the arrow keys. The brightness, contrast and change measurements are computed from the two bundled photographs.
4. Open **Ad Remakes** for ad copy and four downloadable square images. Open **YouTube Shorts** for an original eight-scene script and eight playable MP4 clips.
5. Open **Launch posts** for reels, captions, emails, stories, FAQs, a weekly calendar, disclosures and a checklist. Download the kit as text.
6. **Run live demo** plays 28 saved steps in about three minutes at normal speed. Pause, skip, change speed or stop at any point. **Saved** stores named demo runs in this browser.

Demo is fictional and uses reserved email domains. Sample business names, counts, prices, engagement and campaign activity illustrate the workflow. The same sample photograph may appear on multiple example listings. The health workbook is general information and should receive clinical and editorial review before commercial use.

## Live workspace

Start at **Build it → Your idea**. Choose an idea, research demand, pick a scored buyer group, and review the generated product plan. The manuscript uses that plan and buyer. Research a creator, compare the adapted opening and apply it to the manuscript and PDF if you like it. Then prepare the offer and launch kit. Changing an upstream choice marks later build steps for review. In Demo, follow the same screens with sample data or choose **Load finished example** to inspect a completed project. Live keeps its own project and provider confirmations.

Switch to **Live**, open **Settings**, and save the keys for the providers you intend to use. Use OpenAI for writing, Apify for research and business email lookup, Whop for checkout, and Instantly for outreach. Higgsfield is optional for generated media. Product creation and drafting can start during warmup. Before activating outreach, confirm the sending domain meets the one-month minimum in the [Instantly sending policy](https://instantly.ai/instantly-sending-policy). The app opens in Demo whenever the page is reloaded. Real project results remain in the helper.

| Workflow | Available in Live |
| --- | --- |
| Ebook artwork | In **Build the ebook → Cover artwork**, review a Higgsfield estimate and confirm generation. Use **Check cover job** to load the completed illustration into the reader and PDF. Cover image processing uses Pillow (`python -m pip install Pillow`). |
| Outreach review | Load Instantly accounts, choose a sender, edit the initial email and day-three follow-up, and save the sequence locally. Campaign creation, adding verified leads, test emails and activation are separate reviewed actions. Refresh the tracking screen to load campaign totals, recent email activity and sender usage. |
| Product and creator review | Read and edit individual manuscript units, preview the live PDF, and review linked market evidence. The Instagram shortlist compares profiles with observed views, follower counts, bio offers and public contact details. Pick a creator, read their recent posts and review an evidence-linked voice analysis alongside a sample rewrite. Save the offer price before opening the Whop setup. |
| Idea discovery | Start in **Build it → Your idea → Find me an idea** with an empty workspace. Review one quote for an Apify search across six sites and an OpenAI ranking. Inspect the linked evidence, then choose **Use this idea** to carry it into market research. You can also enter an idea yourself for free. |
| Market research | Preconfigured public-source research for Reddit, Amazon, Etsy, TikTok and YouTube. Each pay-per-event actor gets a separate hard cap. Independent jobs run concurrently and successful results survive individual failures. Inspect source records before using them. |
| Products | Use reviewed research to draft the plan. Review or enter an outline and source material, generate units sequentially, edit the saved text and export a PDF. Generation checkpoints each unit. Use linked sources you have actually read. |
| Discovery and email | Instagram research can chain hashtag reels, public profiles and recent reels. Other platforms use their own searches. The Apify LinkedIn Email Finder accepts public business LinkedIn URLs, skips risky results and records verified addresses for that track. Review identity, fit and business purpose before adding leads. |
| Sending inboxes | Use the Instantly key to inspect existing AirMail inboxes and warmup status. Manage the main domain at its registrar. |
| Outreach | Review and edit a first email and optional day-three follow up. Create a paused Instantly campaign, add verified leads, send a single test and activate separately. Activation checks the sending account’s status and warmup age. |
| Replies | Read the campaign’s received messages and local template drafts. Minute checks are opt-in and run while the app is open. Request a separately quoted AI rewrite when needed. Real messages are available in Instantly. |
| Service samples | Review public listings, ads or videos. Request a Higgsfield estimate for a selected model and its parameters, generate after confirmation and check the resulting job. Compare two local photo files or compose a downloadable 1080 px ad from an approved image and headline. |
| Store | Create a hidden Whop product and hidden variant with zero stock. Set positive stock and visibility with a separate confirmation. Send a payment reply only in an existing campaign conversation. |
| Launch and delivery | Draft launch assets for human review. Attach finished files and set access, refund terms and affiliate splits in Whop before making the offer visible. Publish or schedule social posts in your chosen service. |

### Account setup and boundaries

- The default session cap is $10 and the default Apify cap is $1 per actor. A market scan shares the available session budget across its actors. Enter a smaller batch maximum to leave room for later steps. Confirmations report the reserved ceiling. The session conservatively retains reservations after ambiguous failures. Provider invoices determine final charges. Restarting the helper starts a new spending session. A confirmed subscription renews in the provider account until cancelled there.
- Live writing uses the OpenAI Responses API. In **Settings → OpenAI → Manage**, save your [OpenAI API key](https://platform.openai.com/api-keys) and select **Test (free)**. Under **Writing model**, choose GPT-5.4 mini (default), GPT-5.4 nano, GPT-6.2 Sol or GPT-6.2 Astra and save. The OpenAI chip on a workflow step lets you override the default for that track. Fable remains available for local writing. Existing Claude selections migrate to the new workspace default. Provider keys are kept separate. The helper counts input tokens and reserves up to 4,096 output tokens per draft at [standard OpenAI rates](https://developers.openai.com/api/docs/pricing). Available models, actor billing, provider permissions, taxes and account subscription terms can vary.
- Email lookup uses the saved Apify key and the actor’s current price per confirmed address. Submit up to 25 new profiles per run. Cached checks are free. Enter a real sender name, business and mailing address before creating or sending email. New campaigns use Eastern business hours.
- Live workflows need real accounts and suitable scopes. Review returned data and any provider error before retrying. No production purchases, campaign sends, media jobs or publications were performed during project verification.
- A provider may require a dashboard step for mailbox authorization, DKIM issuance or file fulfillment. Public DNS propagation and delivery must be verified before sending. The application does not calculate payouts, process payments itself, schedule social posts or silently fulfill a paid order.
- Live results are organized into one workspace for each of the three product formats and three services. For multiple independent businesses of the same type, start a separate instance using a separate data folder and port, for example `python app.py --data-dir ./private-business-two --port 8766`. Keep private folders out of source archives.
- The Demo includes designed results. Live returns the actual data supplied by the provider. Record shapes and media output differ by actor and model. A creator’s business email, permission to use their work, verified claims and actual product delivery require human review.

### Keys and local data

The helper binds only to IPv4 loopback, checks Host and Origin, rejects cross-site requests, and requires a session token for private operations. A pasted credential is transiently present in the password input while saving. The helper returns only a masked value. LocalStorage contains theme and demo data.

On Windows the private file is under `%LOCALAPPDATA%\ProductSuite\workspace.json`; an owner-only NTFS ACL is applied to its directory. Other platforms use `~/.local/share/ProductSuite/workspace.json` with private directory and file permissions. The file is access-controlled, not encrypted. Protect it like other local credentials. Keys travel over HTTPS only to the selected providers. No private data file is included in this distribution.

Each external action uses a short-lived, single-use confirmation ticket bound to its reviewed payload. The helper checks the session cap again before execution and serializes writes. Always reconcile an interrupted paid or external action in the provider dashboard before retrying.

## Project layout

- `app.py` serves the browser application, stores private state and enforces confirmations.
- `providers.py`, `research.py`, `live_book.py` and `reply_drafts.py` handle provider requests, research, manuscript generation and reply triage.
- `book_pdf.py` generates PDFs with embedded photography using Python’s standard library.
- `public/` contains the interface, source-linked manuscript, fictional fixtures and offline media.
- `tests/` contains provider-mocked contract tests. Run `python -m unittest discover -s tests -v`.

## Sources and assets

The ebook lists 24 linked MedlinePlus references in its reader and PDF. Partner signup links are identified in Settings. The health sources and partner links open only when you choose them.

Bundled sample photography is from Unsplash image IDs `photo-1512621776951-a57141f2eefd` (food), `photo-1600210492486-724fe5c67fb0` (living room), `photo-1600596542815-ffad4c1539a9` (house), and `photo-1497366811353-6870744d04b2` (workspace). The darker room example and roofing ad layouts are local derivatives. The eight animated coin scenes were rendered locally for this demo.

Provider references: [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create), [Apify](https://docs.apify.com/api/v2), [LinkedIn Email Finder](https://apify.com/memo23/linkedin-email-finder), [Instantly](https://developer.instantly.ai/), [Whop](https://docs.whop.com/api-reference/overview), [Higgsfield](https://docs.higgsfield.ai/docs).

