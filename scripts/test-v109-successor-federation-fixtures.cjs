const fs=require('fs');
const crypto=require('crypto');
const path=require('path');
const root='fixtures/v109-successor-federation';
const a=JSON.parse(fs.readFileSync(path.join(root,'dn1.json'),'utf8'));
const b=JSON.parse(fs.readFileSync(path.join(root,'dn2.json'),'utf8'));
const freeze=JSON.parse(fs.readFileSync(path.join(root,'freeze.json'),'utf8'));
const assert=(v,m)=>{if(!v)throw new Error(m);};
const bannedFields=new Set(['revalidation_required','prior_state_status','standing_status','standing_preserved','standing_defeated','admissibility_status','expected_decision','expected_outcome']);
const bannedValues=[/\bstanding\b/i,/\brevalidat(?:e|ed|es|ing|ion|required)\b/i,/\bsupersed(?:e|ed|es|ing)\b/i,/\bmaterial(?:ly)?\s+contradict(?:ion|ory|s|ed|ing)?\b/i,/\b(?:preserv(?:e|ed|es|ing)|defeat(?:ed|s|ing)?)\b[\s_-]*(?:the\s+)?\bstanding\b/i,/\binvalidat(?:e|ed|es|ing|ion)\b[\s\S]{0,80}\breliance\b/i,/\b(?:non[_ -]?current|not[_ -]?current)\b[\s\S]{0,80}\b(?:prior\s+)?state\b/i];
function audit(node,p='packet',out=[]){if(Array.isArray(node)){node.forEach((x,i)=>audit(x,`${p}[${i}]`,out));return out;} if(node&&typeof node==='object'){for(const [k,v] of Object.entries(node)){assert(!bannedFields.has(k.toLowerCase()),`semantic preload field ${p}.${k}`);audit(v,`${p}.${k}`,out);}return out;} if(typeof node==='string'){for(const r of bannedValues)assert(!r.test(node),`semantic preload value at ${p}: ${node}`);} return out;}
audit(a); audit(b);
for(const k of ['requested_action','authority_chain','revocation_state','consequence_profile','safeguards','relational_rule']) assert(JSON.stringify(a[k])===JSON.stringify(b[k]),`${k} differs across pair`);
assert(a.observed_reality.signals[0].statement===b.observed_reality.signals[0].statement,'Authority A changed across pair');
assert(a.observed_reality.signals[1].statement!==b.observed_reality.signals[1].statement,'Authority B relation-bearing fact did not change');
assert(a.packet_id!==b.packet_id,'packet IDs must be unique');
assert(freeze.implementation.includes('Harmonic production runtime unchanged'),'freeze does not preserve stable core');
for(const f of ['dn1.json','dn2.json']){const raw=fs.readFileSync(path.join(root,f));console.log(`${f} sha256=${crypto.createHash('sha256').update(raw).digest('hex')}`)}
console.log('V109 successor federation fixtures: PASS');
