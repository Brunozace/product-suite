export const formats = ["Ebook", "Course", "Coaching"];
export const hustles = ["Airbnb Photos", "Ad Remakes", "YouTube Shorts"];
export const product = "The Small Appetite Protein Plan";
export const offers = {
  Ebook: product,
  Course: "Small Plates Cooking Course",
  Coaching: "Small Plates Coaching",
  "Airbnb Photos": "Airbnb Photo Pack",
  "Ad Remakes": "Ad Remakes",
  "YouTube Shorts": "YouTube Shorts",
};
export const prices = {
  Ebook: 37,
  Course: 79,
  Coaching: 149,
  "Airbnb Photos": 49,
  "Ad Remakes": 200,
  "YouTube Shorts": 150,
};
export const channels = {
  OpenAI: [
    "Writes plans, products and drafts",
    "https://platform.openai.com/api-keys",
  ],
  Apify: [
    "Finds public research, listings and verified work emails",
    "https://www.apify.com?fpr=dopaminedigital",
  ],
  Higgsfield: [
    "Makes photos and short clips",
    "https://higgsfield.ai?fpr=jordan-a7ae0b",
  ],
  Instantly: [
    "Manages inboxes and campaigns",
    "https://refer.instantly.ai/ty0wj6t5f0pi",
  ],
  Whop: ["Hosts your store and checkout", "https://whop.com/sell"],
};
const step = (name, action, desc, tool, job, cost, time) => ({
  name,
  action,
  desc,
  tools: tool ? tool.split("|") : [],
  job,
  cost,
  time,
});
export const sections = {
  build: [
    "Build it",
    "Digital product",
    [
      step(
        "Your idea",
        "Save idea",
        "Start with a topic, a group of people, or something you know well.",
        "",
        "Idea workshop",
        "$0",
        "1 min",
      ),
      step(
        "See what sells",
        "Research the market",
        "Read buyer questions alongside products they already buy.",
        "Apify",
        "Market research",
        "$0.62 est.",
        "3 min",
      ),
      step(
        "Pick your buyers",
        "Score buyer groups",
        "Pick one clear problem for one specific group of people.",
        "OpenAI",
        "Buyer scoring",
        "$0.31 est.",
        "3 min",
      ),
      step(
        "Product plan",
        "Build the plan",
        "Give your reader a clear starting point, a small win and a path forward.",
        "OpenAI",
        "Product planning",
        "$0.18 est.",
        "1 min",
      ),
      step(
        "Build the ebook",
        "Build the ebook",
        "Read, edit and export the product you will share with buyers.",
        "OpenAI",
        "Research and writing",
        "$0.50 est.",
        "6 min",
      ),
      step(
        "Creator's voice",
        "Read creator posts",
        "Adapt the writing to a creator using details from their public posts.",
        "Apify|OpenAI",
        "Voice research",
        "$0.41 est.",
        "4 min",
      ),
      step(
        "Ready to sell",
        "Prepare the offer",
        "Review the cover, price, store copy and creator invitation.",
        "OpenAI",
        "Sales copy",
        "$0.23 est.",
        "1 min",
      ),
    ],
  ],
  outreach: [
    "Find buyers & send",
    "Digital product",
    [
      step(
        "Find creators",
        "Find buyers",
        "Choose a platform and keep the creators who fit your offer.",
        "Apify",
        "List search",
        "Under $1 est.",
        "7 min",
      ),
      step(
        "Get their emails",
        "Check emails",
        "Keep only verified business addresses.",
        "Apify",
        "Email lookup",
        "$0.30 est.",
        "2 min",
      ),
      step(
        "Set up inboxes",
        "Review inbox setup",
        "Check the sending accounts and warmup status in your Instantly workspace.",
        "Instantly",
        "Inbox setup",
        "Instantly subscription",
        "Account check",
      ),
      step(
        "Write the emails",
        "Make the draft",
        "Review the first email and a single follow up before sending.",
        "OpenAI|Instantly",
        "Email writing",
        "$0.05 est.",
        "2 min",
      ),
      step(
        "Send and track",
        "Review sending",
        "Watch deliveries, replies and bounces for this campaign.",
        "Instantly",
        "Manual sending",
        "Instantly plan",
        "Weekdays",
      ),
      step(
        "Replies",
        "Review drafts",
        "Read each reply and choose a kind, short answer.",
        "OpenAI|Instantly",
        "Reply writing",
        "$0.01 est.",
        "Per draft",
      ),
    ],
  ],
  launch: [
    "Launch",
    "Digital product",
    [
      step(
        "Your offer",
        "Build the offer",
        "Choose a promise you can keep and a price you can explain.",
        "Apify|OpenAI",
        "Offer research",
        "$0.05 est.",
        "1 min",
      ),
      step(
        "Store page",
        "Review store page",
        "Create a hidden listing first. Make it visible when the files are ready.",
        "Whop",
        "Store setup",
        "$0",
        "7 min",
      ),
      step(
        "Launch posts",
        "Write launch kit",
        "Prepare a week of posts, stories and emails in one place.",
        "OpenAI",
        "Launch writing",
        "$0.44 est.",
        "92 sec",
      ),
    ],
  ],
  paid: [
    "Get paid",
    "AI side hustles",
    [
      step(
        "Set your price",
        "Save package",
        "Choose a sample, a package or a monthly plan.",
        "",
        "Pricing worksheet",
        "$0",
        "1 min",
      ),
      step(
        "Make the Whop page",
        "Review store page",
        "Set up your package and review the hidden checkout.",
        "Whop",
        "Store setup",
        "$0",
        "7 min",
      ),
      step(
        "Send the pay link",
        "Review pay link",
        "Prepare one short note for a client who asked to buy.",
        "Instantly",
        "Payment email",
        "Instantly plan",
        "1 min",
      ),
      step(
        "Deliver and get a review",
        "Prepare delivery",
        "Package the finished files and prepare a review request.",
        "",
        "Manual delivery",
        "$0",
        "2 min",
      ),
    ],
  ],
};
sections.clients = [
  "Find clients & send",
  "AI side hustles",
  sections.outreach[2].slice(2),
];
const worksets = {
  "Airbnb Photos": [
    ["Find hosts", "Spot weak photos", "Fix one photo", "Message the host"],
    ["Find listings", "Score photos", "Fix the photo", "Prepare the pitch"],
    [
      "Read public listings in a city and pick a host.",
      "Compare light, contrast and detail in the original image.",
      "Fix light and color. Keep the room and everything in it.",
      "Offer one sample photo before discussing a package.",
    ],
  ],
  "Ad Remakes": [
    ["Find weak ads", "Write ad ideas", "Make the ads", "Pitch the owner"],
    ["Find ads", "Write three ideas", "Make the pictures", "Prepare the pitch"],
    [
      "Look for active local ads that could be clearer.",
      "Build a pain, proof and offer angle from the business brief.",
      "Review the original and three remakes with sharp text overlays.",
      "Share the free ideas and let the owner choose.",
    ],
  ],
  "YouTube Shorts": [
    ["Find outliers", "Write the script", "Make the clips", "Offer a sample"],
    ["Find videos", "Write a script", "Make the clips", "Prepare the pitch"],
    [
      "Find a video with more views than the channel usually gets.",
      "Use the format of a strong video and write your own words.",
      "Review eight short scenes in script order.",
      "Offer a short original sample to a channel in your niche.",
    ],
  ],
};
export function steps(section, format, hustle) {
  if (section === "work") {
    let [names, actions, desc] = worksets[hustle];
    return names.map((n, i) =>
      step(
        n,
        actions[i],
        desc[i],
        [
          "Apify",
          hustle === "Airbnb Photos" ? "" : "OpenAI",
          "Higgsfield",
          "OpenAI|Apify",
        ][i],
        [
          "Client research",
          "Manual review",
          "Sample production",
          "Pitch writing",
        ][i],
        ["$0.20 est.", "$0.05 est.", "$1 est.", "$0.01 est."][i],
        ["3 min", "1 min", "4 min", "1 min"][i],
      ),
    );
  }
  return sections[section][2].map((s, i) =>
    section === "build" && i === 4
      ? {
          ...s,
          name: "Build the " + format.toLowerCase(),
          action: "Build the " + format.toLowerCase(),
        }
      : s,
  );
}
export const labels = {
  build: "Build it",
  outreach: "Find buyers & send",
  launch: "Launch",
  work: "Do the work",
  clients: "Find clients & send",
  paid: "Get paid",
};
export const groups = Object.keys(labels);
export const pockets = [
  [
    "Small plates for adults on GLP-1 medicines",
    [5, 5, 4, 4, 5],
    "Plan a meal when a full plate feels like too much.",
    "A small meal journal with questions for the care team.",
  ],
  [
    "A bedtime journal for perimenopause",
    [5, 4, 4, 3, 4],
    "Keep track of interrupted nights before an appointment.",
    "A bedside page that takes a minute to fill.",
  ],
  [
    "An entryway reset for adults with ADHD",
    [5, 4, 4, 3, 4],
    "Find keys and shoes when leaving in a rush.",
    "A picture checklist with one home for each item.",
  ],
  [
    "A first crochet pattern for Etsy sellers",
    [4, 4, 3, 4, 3],
    "Turn a finished design into clear written directions.",
    "A pattern layout and reader test sheet.",
  ],
  [
    "Lunch prep for nurses on long shifts",
    [4, 4, 3, 4, 3],
    "Pack a lunch that fits an unpredictable break.",
    "A shopping list with short prep notes.",
  ],
];
export const quotes = [
  "I buy ingredients with a plan, then the bowl feels too big.",
  "I would like a list I can take to my appointment.",
  "What can I pack when lunch is only a short break?",
  "I keep forgetting which foods felt comfortable last week.",
  "A plain printable page would be easier than another app.",
  "I need a backup lunch for days I cannot face cooking.",
];
export const script = [
  "What happens to $100 if you leave it alone for 30 years?",
  "Start with one coin stack. Label it your starting amount.",
  "Imagine a jar with room for more coins.",
  "A return can add to what is already in the jar.",
  "A loss can shrink the stack instead.",
  "Fees can take coins out along the way.",
  "Time changes the picture. The outcome is uncertain.",
  "Before you invest, understand the risk. Not financial advice.",
];
export const names = {
  Ebook: [
    "Mira Lane",
    "Jo Ellis",
    "Kai Bell",
    "Nia Ray",
    "Alex West",
    "Sam Hill",
    "Kim Reed",
  ],
  Course: [
    "June Vale",
    "Tess Ward",
    "Ali Lake",
    "Bo Vale",
    "Sky Moss",
    "Drew Ash",
    "Cam Day",
  ],
  Coaching: [
    "Fin Reed",
    "Liv Ward",
    "Max Park",
    "Tia Rowe",
    "Dee Moon",
    "Lee Park",
    "Sol Hayes",
  ],
  "Airbnb Photos": [
    "Lena Brooks",
    "Ben West",
    "Isla Ray",
    "Tom Hill",
    "Mia Vale",
    "Ash Park",
    "Rae Oaks",
  ],
  "Ad Remakes": [
    "Rick Stone",
    "Ada Moss",
    "Omar Reed",
    "Jon Dale",
    "Bea Hayes",
    "Ren West",
    "Jay Banks",
  ],
  "YouTube Shorts": [
    "June Hart",
    "Leo Marsh",
    "Kit Frost",
    "Ari Grove",
    "Sol Brooks",
    "Eli West",
    "Cal Winters",
  ],
};
export const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
export function replies(track) {
  const labels =
    track === "Ad Remakes"
      ? [
          "Pricing question",
          "Interested",
          "Question",
          "Out of office",
          "Not now",
          "Wrong person",
        ]
      : [
          "Interested",
          "Question",
          "Pricing question",
          "Out of office",
          "Not now",
          "Wrong person",
        ];
  return labels.map((label, i) => ({
    id: slug(track) + i,
    track,
    label,
    name: names[track][i] + " (demo)",
    time: ["9:42 AM", "9:31 AM", "Yesterday", "Yesterday", "Monday", "Monday"][
      i
    ],
    message: {
      Interested: "That sounds useful. Could I see the sample first?",
      Question: "What would you need from me to get started?",
      "Pricing question":
        track === "Ad Remakes"
          ? "What does it cost each month?"
          : "How does the pricing work?",
      "Not now": "Thanks for thinking of me. Please leave it here for now.",
      "Out of office":
        "I am away this week and will check my inbox when I return.",
      "Wrong person":
        "I do not look after this. You may want the person who handles partnerships.",
    }[label],
    draft: {
      Interested:
        "Thanks for taking a look. I can share the sample here. Would Tuesday morning or Thursday afternoon suit you for a quick chat?",
      Question:
        "Just a short brief and permission to use the material you choose. You can review the sample before deciding.",
      "Pricing question": formats.includes(track)
        ? "There is no upfront fee for the creator. The proposed split is 50/50 per sale. Would a short call help?"
        : `The main package is $${prices[track]}${track === "Ad Remakes" ? " per month for three ads" : ""}. Would you like to see a free sample first?`,
      "Not now": "",
      "Out of office": "",
      "Wrong person":
        "Thank you for letting me know. If someone else handles this, would you be comfortable pointing me their way?",
    }[label],
  }));
}
export function pitch(track, i = 0) {
  let first = names[track][0].split(" ")[0];
  let details = {
    "Airbnb Photos": [
      "One free photo for your listing",
      "I made a light and color edit of your living room photo. The furniture and view are exactly as before. May I send it over? The full pack is $49 if you like the sample.",
    ],
    "Ad Remakes": [
      "3 free ad ideas for Stone Roof Care",
      "I drafted three ways to show the roof checks you already offer. Would you like to see the free ad?",
    ],
    "YouTube Shorts": [
      "A free video for your channel",
      "Your short explainers use a clear opening question. I wrote an original sample in that format. May I send you the clip?",
    ],
  }[track] || [
    "Quick idea: a protein guide built from your reels",
    "Your lunch reel starts with one small bowl. I write and design guides, set up the store and leave every word for your review. Would you like to see a sample? The proposed split is 50/50 with no upfront cost to you.",
  ];
  return [
    i ? "One quick follow up" : details[0],
    `Hi ${first},\n\n${i ? "Would you like the free sample? Just reply yes. I will leave it here after this note." : details[1]}\n\nAlex Vale (demo)\nField Studio (demo), 10 Sample Lane, Example City (demo)\nReply no and I will stop.`,
  ];
}
