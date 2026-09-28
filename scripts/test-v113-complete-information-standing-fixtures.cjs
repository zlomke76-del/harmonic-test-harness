const fs=require('fs');
const crypto=require('crypto');
const path=require('path');
const root='fixtures/v113-complete-information-standing';
const read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const assert=(v,m)=>{if(!v)throw new Error(m);};
const bannedFields=new Set(['revalidation_required','prior_state_status','standing_status','standing_preserved','standing_defeated','admissibility_status','expected_decision','expected_outcome']);
const bannedValues=/\b(standing\s+(preserved|defeated)|admissible|inadmissible|revalidation required|permitted|denied|allowed|blocked)\b/i;
function audit(node,path='packet'){
 if(Array.isArray(node)){node.forEach((v,i)=>audit(v,`${path}[${i}]`));return;}
 if(node&&typeof node==='object'){for(const [k,v] of Object.entries(node)){assert(!bannedFields.has(k.toLowerCase()),`${path}.${k}: case-specific constitutional answer field supplied`);audit(v,`${path}.${k}`);}return;}
 if(typeof node==='string')assert(!bannedValues.test(node),`${path}: case-specific constitutional answer supplied in value`);
}
function derive(input){
 const a=input.authoritative_facts.authority_a.execution_region;
 const b=input.authoritative_facts.authority_b.accepted_execution_region;
 return a===b?'consistent_with_prior_state':'material_contradiction';
}
for(const which of ['dn1','dn2']){
 const input=read(`${which}-specialty-input.json`), output=read(`${which}-specialty-output.json`), packet=read(`${which}-harmonic-packet.json`);
 assert(output.relationship===derive(input),`${which}: transition classification not derived from frozen facts/rule`);
 assert(output.constitutional_answer_supplied===false,`${which}: constitutional answer flag must be false`);
 assert(packet.state_transition.relationship===output.relationship,`${which}: Harmonic transition differs from Specialty Pack output`);
 assert(JSON.stringify(packet.specialty_pack_evidence)===JSON.stringify(output),`${which}: Specialty Pack evidence not preserved exactly`);
 assert(packet.governing_basis.case_specific_constitutional_answer_supplied===false,`${which}: governing basis answer flag must be false`);
 audit(packet);
}
const a=read('dn1-harmonic-packet.json'), b=read('dn2-harmonic-packet.json');
for(const k of ['requested_action','authority_chain','revocation_state','consequence_profile','safeguards','relational_rule','governing_basis']) assert(JSON.stringify(a[k])===JSON.stringify(b[k]),`${k} differs across pair`);
assert(a.state_transition.relationship==='consistent_with_prior_state','dn1 transition class wrong');
assert(b.state_transition.relationship==='material_contradiction','dn2 transition class wrong');
for(const f of fs.readdirSync(root).filter(x=>x.endsWith('.json')).sort()){
 const raw=fs.readFileSync(path.join(root,f)); console.log(`${f} sha256=${crypto.createHash('sha256').update(raw).digest('hex')}`);
}
console.log('V113 complete-information standing successor fixtures: PASS');
