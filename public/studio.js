import {e, b, badge, card, field, grid, link, row, select, stats, table} from "./ui.js";
import {planOutline} from "./planning.js";

const op = (label, name, primary = false) => b(label, "liveop", name, primary ? "primary" : "");
const go = (label, path) => b(label, "step", path, "", "arrow");
const safe = u => typeof u === "string" && /^https:\/\//i.test(u);
const source = r => [r.url, r.webUrl, r.webVideoUrl, r.postUrl, r.productUrl, r.listingUrl, r.videoUrl].find(safe);
const rows = (research, name) => research?.[name]?.rows || [];
const priceField = t => field("One-time price (USD)", "live-price", t.price ?? "", "number");
const pdf = t => Object.keys(t.book?.units || {}).length ? row(b("Preview PDF","livepdf"), b("Download PDF","livepdfdown")) : "";
const chapter = new Map();
export function selectChapter(track, index) { chapter.set(track, index); }

function prose(text = "") {
  return text.split(/\n\s*\n/).filter(Boolean).map(block => {
    const html = block.split(/(\[[^\]]+\]\(https:\/\/[^\s)]+\))/g).map(s => {
      const m = s.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
      return m ? link(m[1], m[2]) : e(s).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
    }).join("").replace(/^\[(?:TRACE: ([^\[\]\n]{1,24})|WRITE)\]$/gm, (_,v) =>
      '<span class="practice-row">'+({circle:"◯　◯　◯",square:"□　□　□",triangle:"△　△　△",line:"╱　╱　╱"}[v] || v || "&nbsp;")+"</span>");
    return /^#{1,6} /.test(block) && !block.includes("\n")
      ? "<h3>" + html.replace(/^#+ /,"") + "</h3>" : '<p class="pre">' + html + "</p>";
  }).join("");
}
function stages(research) {
  return row(...Object.entries(research).map(([name,r]) => badge(name + " · " + (r.status === "Done" ? r.count + " records" : r.error || r.status))));
}
function market(t) {
  const research=t.research?.["build-1"] || {};
  const report=t.results?.["build-1"] || "";
  return card("Research question",field("Product or audience","live-notes",t.notes?.["build-1"] || t.title || "")+
    op("Summarize market evidence","write")) +
    (report && !report.trimStart().startsWith("{") ? card("Market findings",prose(report)) : "") +
    grid(Object.entries(research).map(([name,r])=>card(name,
      badge(r.status==="Done"?r.count+" records":r.status)+
      (r.error ? "<p>"+e(r.error)+"</p>"+b("Retry this source","researchretry",name):"")+
      (r.rows || []).slice(0,8).map(hit=> {
        const title=hit.title || hit.name || hit.text || hit.caption || hit.description;
        return '<div class="listline">'+(source(hit)?link(String(title || "View record").slice(0,100),source(hit)):e(String(title || "Source record").slice(0,160)))+
          (hit.price!=null?"<p>Listed price · "+e(hit.price)+"</p>":"")+"</div>";
      }).join(""))));
}
function reader(C,t) {
  const titles = t.book?.titles || planOutline(t.results?.["build-3"] || "");
  const units = t.book?.units || {};
  const i = Math.min(chapter.get(C.t) || 0, Math.max(0,titles.length-1));
  const art=t.coverVersion?'<img class="cover-art" alt="Generated cover artwork" src="/covers/'+encodeURIComponent(C.t)+'?v='+encodeURIComponent(t.coverVersion)+'">':"";
  const cover=card("Cover artwork · Higgsfield",field("Art direction","cover-prompt",t.coverPrompt ||
    "Create a polished editorial cover illustration for "+(t.title || C.t)+". Use a single clear subject, a portrait composition and no lettering.","area")+
    row(op("Review cover estimate","cover"),t.coverId?op("Check cover job","coverStatus"):"",t.coverState?badge(t.coverState):""));
  return stats([[Object.keys(units).length,"Units written"],[(t.book?.sources || []).length,"Sources"],
    [Object.values(units).join(" ").split(/\s+/).filter(Boolean).length,"Manuscript words"]])+
    '<div class="reader-layout"><aside>' + '<div class="studio-cover">'+art+'<small>' + e(C.t) + '</small><strong>' + e(t.title || "Your product") + '</strong></div>' +
    '<nav aria-label="Contents">' + titles.map((title,j) => b((j+1)+". "+title,"readchapter",j,i===j?"chosen":"")).join("") + "</nav></aside>" +
    '<article class="studio-paper">' + badge(titles.length ? "Unit " + (i+1) + " of " + titles.length : "Manuscript") +
    "<h2>" + e(titles[i] || "Build from your plan") + "</h2>" + (units[i] ? prose(units[i]) + row(b("Edit this unit","editliveunit",i),
      t.book?.originalUnits?.[i]!==undefined?b("Undo edits","undoliveunit",i):"") :
    "<p>Review the outline and source material below, then build the manuscript.</p>") + "</article></div>" +
    pdf(t) + cover + (t.book?.sources?.length?card("Sources",row(...t.book.sources.map(([name,url],j)=>safe(url)?link("["+ (j+1) +"] "+name,url):e(name)))):"") +
    '<details class="card"' + (titles.length ? "" : " open") + '><summary>Outline and source material</summary>' +
    field("Product title","live-title",t.title || "") + field("Outline, one title per line","book-outline",titles.join("\n"),"area") +
    field("Reviewed brief and sources","live-notes",t.notes?.["build-4"] || t.results?.["build-3"] || "","area") + "</details>";
}
function creatorSearch(t) {
  const research=t.research?.["outreach-0"] || {};
  const profiles=rows(research,"Creators"), reels=[...rows(research,"Topic reels"),...rows(research,"Recent work")];
  const needle = t.notes?.["outreach-0"] || "";
  const matches=profiles.map(p => {
    const posts=reels.filter(r => r.ownerUsername?.toLowerCase() === p.username?.toLowerCase());
    const views=posts.map(r=>r.videoPlayCount ?? r.videoViewCount).filter(v=>v!=null && Number.isFinite(Number(v))).map(Number);
    const best=views.length ? Math.max(...views) : null;
    const count=p.followersCount, bio=p.biography || "";
    const email=bio.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || p.businessEmail;
    const size=count==null ? null : count>=10000 && count<=100000;
    const checks=[size,best==null?null:best>=5000,Boolean(email)];
    return {p,best,email,size,guide:/\b(?:ebook|workbook|guide|course)\b/i.test(bio),score:checks.filter(Boolean).length};
  }).sort((a,b)=>b.score-a.score);
  const shortlist=matches.length ? table(["Creator","Followers","Top views","Email","Competing guide",""],matches.map(({p,best,email,guide})=>[
    link("@"+p.username,"https://www.instagram.com/"+encodeURIComponent(p.username)+"/"),e(p.followersCount ?? "Unknown"),e(best ?? "Unknown"),
    e(email || "Unlisted"),guide?"Mentioned in bio":"Review profile",t.creator===p.username?badge("Selected","green"):b("Pick","pickcreator",p.username)
  ])) : "";
  const other=Object.entries(research).filter(([k])=>!["Creators","Recent work","Topic reels"].includes(k)).flatMap(([,v])=>v.rows || []);
  return card("Search public profiles",field("Niche or Instagram hashtag","live-notes",needle) +
    select("live-platform",["Instagram","TikTok","YouTube","LinkedIn"],t.searchPlatform || "Instagram") +
    "<p>Instagram checks recent reels, follower range (10K–100K), views (5K+) and public contact details. Review each profile for an existing guide.</p>") +
    stats([[rows(research,"Topic reels").length,"Topic reels"],[profiles.length,"Profiles read"],[rows(research,"Recent work").length,"Recent posts"],[matches.filter(m=>m.score===3).length,"Meet audience, views and email checks"]]) +
    card("Creator shortlist",stages(research)+shortlist+other.map(r=>source(r)?link(r.title || r.text?.slice(0,80) || "Open source",source(r)):"").join("")+
      (!matches.length && !other.length?"<p>Search your niche to populate the shortlist.</p>":"")) +
    (t.creator?row(go("Research @"+t.creator,"build/5"),go("Review contact details","outreach/1")):"");
}
function voice(t) {
  const research=t.research?.["build-5"] || {}, profile=rows(research,"Profile")[0] || {}, posts=rows(research,"Recent reels");
  const handle=t.creator || t.voiceHandle || profile.username || t.notes?.["build-5"] || "";
  const researched=t.voiceHandle || profile.username || t.notes?.["build-5"];
  const report=t.voiceReport || (t.results?.["build-5"]?.trimStart().startsWith("{") ? "" : t.results?.["build-5"]);
  const parts=(report || "").split(/^##\s+Adapted excerpt\s*$/im);
  return card("Creator profile",field("Instagram handle","live-notes",handle)+go("Find a creator","outreach/0")+
    (profile.username? "<h3>@"+e(profile.username)+"</h3><p>"+e(profile.biography || "")+"</p>":"")+stages(research))+
    card("Public posts",posts.length ? grid(posts.map(p=>card(p.timestamp?.slice(0,10) || "Post",
      "<p>"+e((p.caption || "").slice(0,320))+"</p>"+(source(p)?link("View post",source(p)):"")))) :
      "<p>Read the creator’s posts to collect evidence for the voice analysis.</p>")+
    card(researched ? "Voice and audience · @"+researched.replace(/^@/,"") : "Voice and audience",
      op("Analyze voice and adapt excerpt","write") + prose(parts[0]))+
    grid([card("Original excerpt",prose((t.voiceOriginal || t.book?.units?.[0] || "").slice(0,1600))),
      card("Adapted excerpt",parts[1]?prose(parts[1])+b("Copy adapted excerpt","copy",parts[1].trim()):"<p>The analysis will add a side-by-side sample here.</p>")]);
}
function contacts(t) {
  const checks=Object.values(t.checks || {});
  const selected=rows(t.research?.["outreach-0"],"Creators").find(p=>p.username===t.creator) || t.creatorProfile;
  const profiles=selected ? [selected] : [];
  const hits=rows(t.research?.["outreach-0"],"Public profiles");
  const urls=hits.map(source).filter(u=>/^https:\/\/(?:[a-z]+\.)?linkedin\.com\/in\//i.test(u));
  return stats([[checks.length,"Profiles checked"],[checks.filter(x=>x.verified?.length).length,"Verified"],[checks.filter(x=>!x.verified?.length).length,"Skipped"]]) +
    card("Lead review",table(["Source","Address","Status"],[
      ...profiles.map(p=>[e("@"+p.username),e(p.businessEmail || p.biography?.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || "Unlisted"),"Profile review"]),
      ...checks.map(c=>[safe(c.source)?link("Profile",c.source):"Profile",e(c.verified?.join(", ") || "—"),e(c.result)])])) +
    card("Verify business emails with Apify",field("Public LinkedIn profile URLs","lookup",urls.join("\n"),"area")+
      "<p>Use the matching LinkedIn profile for each creator. The lookup saves confirmed business addresses for your campaign.</p>");
}
export function studio(C,t) {
  const id=C.s+"-"+C.i;
  const pages={
    "build-1":["See what sells","Research this market","batch",()=>market(t)],
    "build-4":["Build the "+C.t.toLowerCase(),"Build manuscript","book",reader],
    "build-5":["Add a creator’s voice","Read public posts","batch",()=>voice(t)],
    "build-6":["Ready to sell","Prepare store copy","write",()=>grid([card(t.title || "Your offer",
      pdf(t)+prose(t.results?.["build-6"] || "Prepare the headline, benefits and invitation from your product and buyer research.")+
      (t.results?.["build-6"]?b("Copy store copy","copy",t.results["build-6"]):"")),
      card("Offer settings",priceField(t)+row(b("Save price","offerprice"),go("Prepare Whop listing","launch/1"))+
        "<h4>Inside the product</h4><ol>"+(t.book?.titles || planOutline(t.results?.["build-3"] || "")).map(v=>"<li>"+e(v)+"</li>").join("")+"</ol>")])],
    "outreach-0":["Find a creator to partner with","Search creators","batch",()=>creatorSearch(t)],
    "outreach-1":["Get their emails","Check business emails","verify",()=>contacts(t)],
  };
  const entry=pages[id];
  if (!entry) return "";
  const [heading,label,action,view]=entry;
  const advanced=action==="batch" ? '<details class="card"><summary>Custom Apify research</summary>'+
    field("Apify actor ID","actor",t.actor || "")+field("Actor input JSON","actor-input",t.actorInput || "{}","area")+
    op("Run custom research","robot")+
    (t.results?.[id]?.trimStart().startsWith("[")?'<pre>'+e(t.results[id])+'</pre>':"")+"</details>" : "";
  return '<div class="stepshead studio-head"><span class="eyebrow">'+e(C.s==="build"?"Build it":"Find buyers & send")+" · Step "+(C.i+1)+
    "</span><h1>"+e(heading)+"</h1>"+row(op(label,action,true),b("Next step","next","","","arrow"))+'</div><div class="stack">'+view(C,t)+advanced+"</div>";
}
