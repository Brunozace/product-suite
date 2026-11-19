import { exercises } from "./workbook.js";
export const sources = [
  ["Semaglutide injection", "druginfo/meds/a618008.html"],
  ["Protein in diet", "ency/article/002467.htm"],
  ["Tirzepatide injection", "druginfo/meds/a622044.html"],
  ["Liraglutide injection", "druginfo/meds/a611003.html"],
  ["Nutrition", "nutrition.html"],
  ["Diabetes diet", "diabeticdiet.html"],
  ["Dietary proteins", "dietaryproteins.html"],
  ["Kidney disease and diet", "ency/article/002442.htm"],
  ["Food labeling", "foodlabeling.html"],
  ["Dietary fiber", "dietaryfiber.html"],
  ["Carbohydrates", "carbohydrates.html"],
  ["Dietary fats", "dietaryfats.html"],
  ["Food safety", "foodsafety.html"],
  ["Food allergy", "foodallergy.html"],
  ["Vegetarian diet", "vegetariandiet.html"],
  ["Nausea and vomiting", "nauseaandvomiting.html"],
  ["Dehydration", "dehydration.html"],
  ["Constipation", "constipation.html"],
  ["Water in diet", "ency/article/002471.htm"],
  ["Exercise and physical fitness", "exerciseandphysicalfitness.html"],
  ["Exercise for seniors", "exerciseforseniors.html"],
  ["Talking with your doctor", "talkingwithyourdoctor.html"],
  ["Taking medicines safely", "medicines.html"],
  ["Low blood glucose", "hypoglycemia.html"],
].map(([name, path]) => [name, "https://medlineplus.gov/" + path]);
const chapter = (title, short, sections, tryIt, remember, voice) => ({
  title,
  short,
  sections,
  tryIt,
  remember,
  voice,
});
export const chapters = [
  chapter(
    "Start Here: Why Your Appetite Changed",
    "Use this book to prepare meals and questions for your own care team. General information, not medical advice.",
    [
      [
        "Start with your own day",
        "Picture this: a familiar lunch is on the table, but it looks like too much food. Before making a new shopping list, describe the moment. Was the meal difficult to prepare? Was the portion unappealing? Did you feel unwell? Those are different questions. Leave space for the answer to change tomorrow.",
      ],
      [
        "Know what you take",
        "Semaglutide affects appetite and slows movement of food through the stomach. Its patient information describes nausea, vomiting and other possible side effects. Your medicine has its own instructions. Read the leaflet for the medicine on your prescription and take questions to your pharmacist. [1] [3] [4]",
      ],
      [
        "Make a starting page",
        "Write the name of a meal you felt comfortable eating, one you left unfinished and one you would like help with. Add the time and the setting. Ordinary words are enough. “I came home late and did not want to cook” tells a different story from “I felt sick before dinner.”",
      ],
      [
        "Choose your first question",
        "A useful question might be, “What should I do if I regularly struggle to eat lunch?” Bring the page to your next conversation. Ask how to contact the team sooner if symptoms make eating or drinking difficult. You can use this notebook without weighing food or giving yourself a score. [22]",
      ],
    ],
    "Set out a notebook next to the place you usually prepare food. Give the first page a date and leave room for questions.",
    [
      "Name the medicine.",
      "Describe one ordinary meal.",
      "Keep the contact details handy.",
    ],
    "Start with the bowl you already own.",
  ),
  chapter(
    "Why Protein Matters Now",
    "Protein helps the body make and repair cells. Many familiar foods can supply it. [2]",
    [
      [
        "Find it on your shelves",
        "Eggs, milk, fish, beans, soy foods and nut butters are examples of protein sources. Start with foods you actually enjoy and can afford. Look in the freezer and pantry before building a shopping list. Write down the food itself, not the brand or a promise on its label. [2] [7]",
      ],
      [
        "Keep the rest of the meal",
        "A meal can include protein along with foods that provide carbohydrates, fat and fiber. Think of the protein choice as one part of the plate. A care team can help adapt that mix to your needs, especially if you already follow a specific eating plan. [5] [6] [10] [11] [12]",
      ],
      [
        "Draw a kitchen map",
        "Make three small lists headed fridge, cupboard and freezer. Under each heading put something you would willingly make on a quiet day. Circle a choice that also works on a tired day. Notice any missing step, such as needing a tin opener at work or a safe way to keep food cold.",
      ],
      [
        "Ask a practical question",
        "Picture this: you enjoy beans in a soup but dislike them in a salad. Record the soup as an option. The point of this page is to learn which meals you might repeat. If allergies change your choices, check the ingredients and ask your clinician about substitutes. [14]",
      ],
    ],
    "Write one breakfast, one lunch and one evening meal you already like. Underline the protein food in each.",
    [
      "Start with familiar foods.",
      "Include the rest of the plate.",
      "Ask about personal restrictions.",
    ],
    "Put the ingredients on the counter before picking a recipe.",
  ),
  chapter(
    "Your Protein Number",
    "Ask your clinician or registered dietitian for a personal target. This workbook supplies a place to record it.",
    [
      [
        "Bring context",
        "Take a typical day of meals to your appointment. Include work breaks, foods you avoid, your questions and any plan you already follow. If kidney disease is part of your history, ask specifically about protein. Kidney nutrition advice can differ according to your treatment and needs. [8]",
      ],
      [
        "Read the serving first",
        "A food label gives amounts for a stated serving. Compare the amount you ate with the serving on the package before using the protein line in a food record. A serving on a label is information about the product. Your own eating plan comes from your care team. [9]",
      ],
      [
        "Make an appointment card",
        "Copy the target exactly as your clinician gives it. Ask what the units mean, whether it applies per meal or per day, and when to review it. Leave the space empty if you have not been given a target. A clear question is more useful than a guessed number.",
      ],
      [
        "Practice with your own label",
        "Pick a food you buy often. Copy its serving description into your notebook. On the next line describe what you actually ate in ordinary language. Take a photo of the package for your appointment if that is easier than doing arithmetic.",
      ],
    ],
    "Put a blank card in your notebook with spaces for a target, the person who set it and the review date.",
    [
      "Use your own plan.",
      "Check the serving on the label.",
      "Leave uncertain values blank.",
    ],
    "Keep the label beside the bowl for a moment.",
  ),
  chapter(
    "Protein First",
    "Choose a protein food as a starting point for meal planning, then add the rest of the meal.",
    [
      [
        "Choose an anchor",
        "A planning anchor is simply the first ingredient you write down. It might be tofu for lunch, lentils for soup or an egg for breakfast. It does not set a rule about which bite to eat first. Animal and plant foods both offer protein. [2] [15]",
      ],
      [
        "Build a pair",
        "Open your food list. Next to an ingredient you enjoy, write a food you already serve with it. Lentils and rice could become lunch. Yogurt and fruit could become breakfast. Choose the combination that suits your needs and the preparation time you actually have.",
      ],
      [
        "Practice a swap",
        "Picture this: you planned a bean salad but forgot the beans. What else in your kitchen would make a meal you want? Write a backup next to the original plan. It can be a different dish entirely. A useful backup fits both your budget and your day.",
      ],
      [
        "Leave room for preference",
        "Mark anything that relies on equipment you do not have at work. Add a note about storage and reheating. Follow food safety instructions for perishable ingredients. If you need a different eating pattern because of a health condition, ask how these ideas fit your plan. [13] [6]",
      ],
    ],
    "Make a two-column shopping note headed “meal idea” and “backup.” Fill just the first row.",
    [
      "Choose one familiar ingredient.",
      "Add a food you enjoy beside it.",
      "Write a workable backup.",
    ],
    "My first question is what is already in the fridge.",
  ),
  chapter(
    "Small Plates",
    "Use a smaller serving dish if it makes a meal easier to approach. You can take more when you want it.",
    [
      [
        "Use a familiar dish",
        "Choose a bowl or plate you enjoy using. Set it on the counter while you plan. Think about color, texture and temperature. This exercise changes how you present a meal. It does not prescribe how much food is enough for you.",
      ],
      [
        "Separate the components",
        "Try serving the parts of a familiar meal separately. A spoonful of a topping can sit beside the main dish until you decide whether you want it. The extra choice may be useful if a mixed meal has become unappealing. Record your own experience in plain language.",
      ],
      [
        "Make a lunch box sketch",
        "Draw the container you actually take to work. Label the spaces with foods you want to pack. Write “keep cold” or “reheat” where relevant and check how that will happen. A lunch plan that relies on a fridge you cannot access needs a different arrangement. [13]",
      ],
      [
        "Notice what works",
        "After the meal, write one sentence about the setup. “I liked keeping the toast separate” is specific enough to reuse. If you repeatedly cannot eat enough, let your clinician know about the pattern and bring the notes. [1] [22]",
      ],
    ],
    "Try your usual food in a different dish and write down one thing about the experience.",
    [
      "Use the dish you have.",
      "Keep preferences visible.",
      "Share ongoing difficulties.",
    ],
    "One small bowl and a separate topping are plenty to set the table.",
  ),
  chapter(
    "Easy Wins for Low Days",
    "Prepare a short list for days when shopping or cooking feels difficult.",
    [
      [
        "Write a low-effort list",
        "Imagine walking into the kitchen after a demanding day. Pick a meal that requires little thought, one utensil and ingredients you tend to have around. List the practical steps. If the list starts with defrosting something overnight, write a second option for right now.",
      ],
      [
        "Sort by effort",
        "Use the headings open, assemble and cook. Put a familiar food under each. This is a planning exercise about effort, not a ranking of foods. Add a note if an ingredient needs refrigeration after opening. Follow package directions and safe storage advice. [13]",
      ],
      [
        "Tell discomfort apart",
        "Feeling too tired to prepare a meal and being too nauseated to eat are different experiences. Write down the words that describe yours. Nausea and vomiting can occur with semaglutide. Contact your clinician if symptoms are severe or persist, and follow the instructions for your medicine. [1] [16]",
      ],
      [
        "Arrange help",
        "Choose one task someone could do if you asked. It might be picking up a familiar food, washing a container or sitting with you while you call the clinic. Write a sentence you could send. A precise request makes it easier for the other person to understand what would help.",
      ],
    ],
    "Put a list of three low-effort options where you can read it without opening an app.",
    [
      "Plan for actual energy.",
      "Read storage directions.",
      "Report persistent symptoms.",
    ],
    "Put one backup lunch on the shopping list.",
  ),
  chapter(
    "Drinks, Water and Fiber",
    "Use your own care plan for fluids and fiber. Ask before changing a prescribed fluid limit. [8] [19]",
    [
      [
        "Map your routine",
        "Draw a simple line from getting up to going to bed. Mark the times water is easy to reach and the times it is difficult. A long shift, a commute or an inaccessible kitchen can change what is practical. Bring these details to a conversation about fluids.",
      ],
      [
        "Read a drink label",
        "Select a drink you use regularly. Check the serving description and the ingredients. If your care plan includes guidance on particular nutrients, ask which lines matter for you. Water needs vary. This workbook does not assign a universal amount. [9] [19]",
      ],
      [
        "Learn about fiber",
        "Fiber occurs in plant foods such as beans, whole grains, fruits and vegetables. Adding it gradually can help avoid discomfort. Ask your care team about constipation that persists or worries you, especially if it began after a medication change. [10] [18]",
      ],
      [
        "Know when to call",
        "Vomiting or diarrhea can lead to fluid loss. Very little urine, confusion or fainting can signal serious dehydration. Seek urgent medical help for severe symptoms. If you cannot keep fluids down, contact a health professional promptly. [16] [17]",
      ],
    ],
    "Write down your usual drink, where it is kept and a question for your care team.",
    [
      "Record your usual routine.",
      "Make changes with your care plan.",
      "Act on signs of dehydration.",
    ],
    "Keep the cup where you can reach it.",
  ),
  chapter(
    "Move to Keep Muscle",
    "Ask about activity that fits your health, ability and current treatment. [20] [21]",
    [
      [
        "Start with context",
        "Write down the movement already in your day. It might be walking to a bus, taking care of a garden or doing a task seated. Add anything that makes movement uncomfortable or difficult. The goal of this page is to provide an honest starting point for a discussion.",
      ],
      [
        "Ask about strength",
        "Muscle-strengthening activity is one part of physical fitness. Ask a qualified professional which activities fit your situation and how to start. If you have a health condition or are new to activity, discuss a suitable plan with your clinician. [20] [21]",
      ],
      [
        "Plan the setting",
        "Picture this: you have a movement plan from your clinician but nowhere comfortable to try it. Write down the space, time or support that would make it possible. It is fine to bring a question about access or cost to the next appointment.",
      ],
      [
        "Keep a useful note",
        "Instead of awarding points for completing a session, record what you did and how it felt. If you take diabetes medication, ask how activity fits with your glucose monitoring and low blood glucose plan. Keep the instructions you receive somewhere easy to find. [6] [24]",
      ],
    ],
    "Write a question about one activity you would like to do comfortably.",
    [
      "Describe your starting point.",
      "Ask about suitable movement.",
      "Record the advice you receive.",
    ],
    "Choose a time that suits the rest of your day.",
  ),
  chapter(
    "When to Call Your Doctor",
    "Keep the instructions for your specific medicine nearby. Seek emergency help for severe breathing trouble or a serious allergic reaction. [1] [3] [4]",
    [
      [
        "Read the warning section",
        "Find the serious side effects section in your medicine information. For semaglutide, persistent severe stomach pain, sometimes spreading to the back, requires urgent medical attention. Use the directions for the medicine you take. Do not use this notebook to diagnose the cause. [1]",
      ],
      [
        "Describe the change",
        "Before a call, write when the problem started and how it is affecting eating, drinking or normal activity. Include your medicine name and recent changes to the prescription. If the situation is urgent, seek help immediately. Finishing a worksheet can wait. [1] [22]",
      ],
      [
        "Prepare a contact card",
        "Keep separate spaces for the prescribing clinic, your pharmacist and the after-hours number. Ask the clinic where to go for urgent problems outside its opening hours. If you have an existing emergency plan, keep the card next to it.",
      ],
      [
        "Read back the next step",
        "At the end of a call, repeat the plan in your own words. Ask what changes should prompt another call and when to check in. Take medicines as directed by your prescriber. Keep an up-to-date list so the person helping you can see the whole picture. [22] [23]",
      ],
    ],
    "Fill in the three contact spaces. Put a copy somewhere another person could find it if you asked for help.",
    [
      "Use your medicine leaflet.",
      "Seek urgent help for serious symptoms.",
      "Read back the advice.",
    ],
    "Keep a pen next to the contact card.",
  ),
  chapter(
    "The 14-Day Protein Plan",
    "Use these two weeks as a set of optional planning prompts. Adjust the pace to your circumstances.",
    [
      [
        "Days 1 to 3: notice",
        "Day 1: describe one ordinary meal in a sentence. Day 2: list a protein food you like and the dish you use it in. Day 3: look at the label of a food you already buy. Copy the serving description and bring any questions to your care team. [2] [9]",
      ],
      [
        "Days 4 to 7: prepare",
        "Day 4: choose one familiar breakfast. Day 5: write a backup for a day when cooking feels difficult. Day 6: sketch a lunch you could pack with the equipment you have. Day 7: review the week and circle one idea you would willingly try again.",
      ],
      [
        "Days 8 to 11: adapt",
        "Day 8: try serving a familiar food in a different dish. Day 9: put your drink where you can reach it. Day 10: ask a question about your individual nutrition plan. Day 11: make a list of ingredients you can use in more than one meal.",
      ],
      [
        "Days 12 to 14: review",
        "Day 12: look at your contact card and fill any gaps. Day 13: plan a meal for an ordinary busy day. Day 14: choose one thing to keep, one thing to change and one question for your next appointment. The useful outcome is a plan you can explain in your own words.",
      ],
    ],
    "Write tomorrow’s activity on a small card. Leave a blank line for what actually happened.",
    [
      "Choose a manageable pace.",
      "Keep what worked.",
      "Share unanswered questions.",
    ],
    "At the end of the week I keep the meals I would make again.",
  ),
];
chapters.forEach((c, i) => c.sections.push(exercises[i]));
export const lessons = [
  "Read your own routine",
  "Find a protein anchor",
  "Build a small plate",
  "Plan a low-effort lunch",
  "Prepare for a care visit",
  "Design your next two weeks",
];
export const weeks = [
  "Map your meals",
  "Build your kitchen list",
  "Try and adapt",
  "Review and carry forward",
];
export function units(format) {
  if (format === "Ebook") return chapters;
  return (format === "Course" ? lessons : weeks).map((title, i) => {
    const c =
      chapters[(format === "Course" ? [0, 1, 4, 5, 8, 9] : [0, 3, 5, 9])[i]];
    return {
      ...c,
      title,
      sections: [
        [format === "Course" ? "Opening script" : "Call opening", c.short],
        ...c.sections.slice(0, 2),
        [
          format === "Course" ? "Practice worksheet" : "Weekly check in",
          `What did you try? What did you notice? What question would you bring back? Write a specific example for “${title}”.`,
        ],
      ],
      tryIt: c.tryIt,
    };
  });
}
