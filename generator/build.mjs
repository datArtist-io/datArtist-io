// Rebuilds every SVG in ../assets. With GITHUB_TOKEN set (the daily workflow), it first refreshes
// ../data.json from GitHub: repositories, languages, followers and the contribution calendar.
import fs from "node:fs";
import { card, contrib, button, hero } from "./profile.mjs";
import { write } from "./lib.mjs";

const LOGIN = "datArtist-io";
const DATA = new URL("../data.json", import.meta.url);
const OUT = new URL("../assets", import.meta.url).pathname;
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

async function refresh() {
  const query = `query($login:String!){user(login:$login){followers{totalCount}
    repositories(ownerAffiliations:OWNER,privacy:PUBLIC,first:100,isFork:false){totalCount nodes{primaryLanguage{name}}}
    contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json", "User-Agent": LOGIN },
    body: JSON.stringify({ query, variables: { login: LOGIN } }),
  });
  const j = await r.json();
  if (!j.data?.user) throw new Error(JSON.stringify(j.errors ?? j));
  const u = j.data.user;
  const cal = u.contributionsCollection.contributionCalendar;
  const data = {
    updated: new Date().toISOString(),
    stats: {
      repos: u.repositories.totalCount,
      contributions: cal.totalContributions,
      languages: new Set(u.repositories.nodes.map((n) => n.primaryLanguage?.name).filter(Boolean)).size,
      followers: u.followers.totalCount,
    },
    days: cal.weeks.flatMap((w) => w.contributionDays.map((d) => [d.date, LEVEL[d.contributionLevel] ?? 0, d.contributionCount])),
  };
  fs.writeFileSync(DATA, JSON.stringify(data, null, 1));
  return data;
}

const data = process.env.GITHUB_TOKEN ? await refresh() : JSON.parse(fs.readFileSync(DATA, "utf8"));
const out = [];
for (const k of ["dark", "light"]) {
  out.push(write(`${OUT}/hero-${k}.svg`, hero(k)));
  out.push(write(`${OUT}/card-${k}.svg`, card(k, data.stats)));
  out.push(write(`${OUT}/contributions-${k}.svg`, contrib(k, data.days)));
  for (const [name, label, opt] of [
    ["btn-work", "Work with me", { icon: "arrow", primary: true }],
    ["btn-x", "@datartist_io", { icon: "x" }],
    ["btn-links", "linktr.ee/datArtist", { icon: "link" }],
    ["btn-mail", "Email me", { icon: "mail" }],
  ])
    out.push(write(`${OUT}/${name}-${k}.svg`, button(k, label, opt).svg));
}
console.log(out.join("\n"));
