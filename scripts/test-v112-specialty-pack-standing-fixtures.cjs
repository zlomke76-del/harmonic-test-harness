const fs=require('fs');
const crypto=require('crypto');
const path=require('path');
const root='fixtures/v112-specialty-pack-standing';
const read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const assert=(v,m)=>{if(!v)throw new Error(m);};
const banned=/\b(standing|admissible|inadmissible|revalidat(?:e|ed|es|ing|ion|required)|supersed(?:e|ed|es|ing)|invalidat(?:e|ed|es|ing|ion)|permit(?:ted)?|deny|denied|allow(?:ed)?|block(?:ed)?)\b/i;
function derive(input){
 const a=input.authoritative_facts.authority_a.execution_region;
 const b=input.authoritative_facts.authority_b.accepted_execution_region;
 return a===b?'execution_region_alignment':'execution_region_misalignment';
}
for(const which of ['dn1','dn2']){
 const input=read(`${which}-specialty-input.json`);
 const output=read(`${which}-specialty-output.json`);
 const packet=read(`${which}-harmonic-packet.json`);
 assert(output.relationship===derive(input),`${which}: Specialty Pack relationship is not derived from frozen authoritative facts`);
 assert(!banned.test(JSON.stringify(output)),`${which}: Specialty Pack output carries constitutional meaning`);
 assert(output.constitutional_interpretation_supplied===false,`${which}: constitutional interpretation flag must be false`);
 assert(packet.state_transition.relationship===output.relationship,`${which}: Harmonic packet relationship differs from Specialty Pack output`);
 assert(JSON.stringify(packet.specialty_pack_evidence)===JSON.stringify(output),`${which}: preserved Specialty Pack evidence differs from output`);
}
const a=read('dn1-harmonic-packet.json'), b=read('dn2-harmonic-packet.json');
for(const k of ['requested_action','authority_chain','revocation_state','consequence_profile','safeguards','relational_rule']) assert(JSON.stringify(a[k])===JSON.stringify(b[k]),`${k} differs across pair`);
assert(a.state_transition.relationship!==b.state_transition.relationship,'domain relationship did not change across pair');
assert(a.packet_id!==b.packet_id,'packet IDs must be unique');
for(const f of fs.readdirSync(root).filter(x=>x.endsWith('.json')).sort()){
 const raw=fs.readFileSync(path.join(root,f)); console.log(`${f} sha256=${crypto.createHash('sha256').update(raw).digest('hex')}`);
}
console.log('V112 Specialty Pack standing successor fixtures: PASS');
