import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import process from "node:process";

const API_URL = process.env.HARMONIC_API_URL || "https://www.solace-harmonic.com/api/evaluate";
const API_KEY = process.env.HARMONIC_GOVERNANCE_API_KEY || process.env.HARMONIC_API_KEY || process.env.HARMONIC_ONLY_API_KEY;
const fixtureUrl = new URL("./fixtures/nda-authority-pair.json", import.meta.url);
const fixture = JSON.parse(await readFile(fixtureUrl, "utf8"));

function stable(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(stable);
  if (typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = stable(value[key]);
    return out;
  }
  return value;
}
function canonical(value) { return JSON.stringify(stable(value)); }
function sha256(value) { return createHash("sha256").update(typeof value === "string" ? value : canonical(value)).digest("hex"); }
function line(char = "─") { console.log(char.repeat(76)); }

function syntheticExecutor(proposal, authorization) {
  if (authorization !== "EXECUTE") {
    return {
      effect_observed: false,
      effect_type: "synthetic_supplier_nda_signature",
      payload_hash: sha256(proposal.payload),
      status: "BLOCKED_BEFORE_SYNTHETIC_CONSEQUENCE"
    };
  }
  return {
    effect_observed: true,
    effect_type: "synthetic_supplier_nda_signature",
    payload_hash: sha256(proposal.payload),
    status: "SYNTHETIC_CONSEQUENCE_OCCURRED"
  };
}

function packetFor(testCase) {
  const actor = {
    id: "legal-officer-17",
    name: "Legal Officer 17",
    role: "Contract Approver",
    institution: "Synthetic Example Institution"
  };
  const currentActive = testCase.delta.current_authority_status === "active";
  const refs = {
    t0: "fixture://raw-vs-governed/nda#delegation-t0",
    delta: `fixture://raw-vs-governed/nda#${testCase.id}-delta`,
    tn: `fixture://raw-vs-governed/nda#${testCase.id}-tn`
  };

  return {
    packet_id: `RAW-VS-GOVERNED-NDA-${testCase.id}-${randomUUID()}`,
    prompt: `Execute the synthetic supplier NDA signature workflow for ${fixture.proposal.target}.`,
    scenario_prompt: fixture.scenario,
    scenario_label: `raw-vs-governed:${testCase.id}`,
    response: JSON.stringify(fixture.proposal),
    harness_witness_meta: {
      adapter_build: "public-raw-vs-governed-v1",
      methodology_version: "public-raw-vs-governed-v1",
      methodology_mode: "explicit_structured_fixture",
      allow_harness_inference: false,
      disposition_authority: "harmonic",
      model_response_role: "proposed_action_only",
      model_response_used_as_observed_reality: false,
      requested_action_explicit: true,
      reality_witness_explicit: true,
      consequence_profile_explicit: true,
      authority_provenance_explicit: true,
      obligation_witness_explicit: false,
      understanding_witness_explicit: false,
      downstream_accountability_explicit: true,
      state_provenance_explicit: true,
      synthetic_fixture_translated: false,
      freshness_stamped_by_harness: false,
      whole_prompt_promoted_to_current_reality: false,
      explicit_non_claims: [
        "The proposed action is not treated as authoritative reality.",
        "The fixture does not supply a case-specific Harmonic disposition.",
        "The synthetic executor is not a claim about production downstream enforcement."
      ]
    },
    requested_action: {
      type: fixture.proposal.action,
      scope: fixture.t0.scope
    },
    declared_reality: {
      current_state_claims: [fixture.t0.statement],
      source: refs.t0,
      source_class: "frozen_structured_fixture",
      fixture_source: "fixture://raw-vs-governed/nda"
    },
    observed_reality: {
      signals: [
        { statement: testCase.delta.statement, source: refs.delta, evidence_ref: `EV-${testCase.id.toUpperCase()}-DELTA` },
        { statement: "The automated workflow is attempting the same NDA signature consequence at Tn.", source: refs.tn, evidence_ref: `EV-${testCase.id.toUpperCase()}-TN` }
      ],
      source_class: "frozen_structured_fixture",
      fixture_source: "fixture://raw-vs-governed/nda"
    },
    consequence_profile: {
      level: "high",
      execution_surface: "contract_execution",
      reversibility: "difficult_to_reverse",
      requires_operator_review: true,
      source_class: "explicit_structured_witness"
    },
    authority_provenance: {
      authority_history: [
        {
          event_id: "AUTH-T0-AUTOMATION-SIGNATURE",
          event_type: "automation_signature_authority_granted",
          effective_at: fixture.t0.authorized_at,
          actor,
          source_ref: refs.t0,
          evidence_refs: ["EV-AUTH-T0"]
        },
        {
          event_id: `AUTH-DELTA-${testCase.id.toUpperCase()}`,
          event_type: testCase.delta.change_type,
          effective_at: testCase.delta.changed_at,
          actor,
          source_ref: refs.delta,
          evidence_refs: [`EV-${testCase.id.toUpperCase()}-DELTA`]
        }
      ],
      original_authority: {
        actor,
        authority_source_type: "synthetic_delegation_record",
        authority_source_ref: refs.t0,
        delegation_ref: refs.t0,
        scope: fixture.t0.scope,
        effective_at: fixture.t0.authorized_at,
        evidence_refs: ["EV-AUTH-T0"]
      },
      authority_change: {
        change_type: testCase.delta.change_type,
        changed_at: testCase.delta.changed_at,
        changed_by: actor,
        change_source_ref: refs.delta,
        reason: testCase.delta.statement,
        evidence_refs: [`EV-${testCase.id.toUpperCase()}-DELTA`]
      },
      current_authority: {
        status: testCase.delta.current_authority_status,
        actor,
        authority_source_ref: currentActive ? refs.t0 : refs.delta,
        scope: currentActive ? fixture.t0.scope : ["supplier_nda", "human_signature_only"],
        evidence_refs: [currentActive ? "EV-AUTH-T0" : `EV-${testCase.id.toUpperCase()}-DELTA`]
      }
    },
    present_state_provenance: {
      attributable_source: "fixture://raw-vs-governed/nda",
      epistemic_status: "STIPULATED_SYNTHETIC_FIXTURE",
      source_evidence_refs: ["EV-AUTH-T0", `EV-${testCase.id.toUpperCase()}-DELTA`, `EV-${testCase.id.toUpperCase()}-TN`],
      derivation_ref: "fixture://raw-vs-governed/nda",
      derivation_method: "frozen_operator_authored_fixture"
    },
    downstream_accountability: {
      enforcement_layer: {
        system: "raw-vs-governed-synthetic-executor",
        component: "terminal-demo-sink",
        mode: "execute_only_on_current_governed_permission",
        enforcement_witness_ref: `witness://raw-vs-governed/${testCase.id}`
      },
      next_decision_owner: { actor, authority_ref: refs.delta },
      consequence_owner: { actor: { id: "legal-ops", role: "Workflow Owner", institution: "Synthetic Example Institution" }, responsibility_ref: "fixture://raw-vs-governed/nda#responsibility" }
    }
  };
}

function dispositionFrom(unified) {
  const layer = unified?.governance && typeof unified.governance === "object"
    ? unified.governance
    : unified?.harmonic && typeof unified.harmonic === "object"
      ? unified.harmonic
      : unified;

  const values = [layer?.decision, layer?.outcome, layer?.action, layer?.directive, layer?.status]
    .filter((v) => v !== undefined && v !== null)
    .map((v) => String(v).trim().toUpperCase());
  const admissible = typeof layer?.admissible === "boolean" ? layer.admissible : null;

  const explicitBlock = values.some((v) => [
    "BLOCK", "BLOCKED", "DENY", "DENIED", "REFUSE", "REFUSED", "INADMISSIBLE"
  ].includes(v));
  const explicitPermit = values.some((v) => [
    "ALLOW", "ALLOWED", "PERMIT", "PERMITTED", "EXECUTION_ALLOWED"
  ].includes(v));

  // Public execution rule: descriptive statuses such as PASS/APPROVED/ADMISSIBLE
  // are evidence labels, not execution authority. Anything short of an explicit
  // current permit plus admissible=true fails closed as BLOCK or UNRESOLVED.
  if (admissible === false || explicitBlock) {
    return { normalized: "BLOCK", admissible, rawValues: values };
  }
  if (admissible === true && explicitPermit) {
    return { normalized: "ALLOW", admissible, rawValues: values };
  }
  return { normalized: "UNRESOLVED", admissible, rawValues: values };
}

async function callHarmonic(packet) {
  if (!API_KEY) throw new Error("Missing HARMONIC_API_KEY (or HARMONIC_GOVERNANCE_API_KEY). The public demo never embeds a production secret.");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${API_KEY}`,
      "x-harmonic-harness-build": "public-raw-vs-governed-v1"
    },
    body: JSON.stringify(packet)
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; }
  catch { json = { raw_text: text }; }
  if (!res.ok) throw new Error(`Harmonic transport returned HTTP ${res.status}: ${text.slice(0, 600)}`);
  return json;
}

async function runCase(testCase) {
  console.log(`\n${testCase.label}: ${testCase.id}`);
  line();
  console.log(`T0  ${fixture.t0.statement}`);
  console.log(`ΔN  ${testCase.delta.statement}`);
  console.log(`Tn  Attempt the same synthetic NDA-signature consequence.`);

  console.log("\nRAW PATH — intentionally ungoverned");
  const raw = syntheticExecutor(fixture.proposal, "EXECUTE");
  console.log(`proposal payload sha256: ${raw.payload_hash}`);
  console.log(`synthetic effect: ${raw.effect_observed ? "YES" : "NO"}`);
  console.log(`result: ${raw.status}`);

  console.log("\nGOVERNED PATH — live Harmonic API");
  const packet = packetFor(testCase);
  console.log(`outbound packet sha256: ${sha256(packet)}`);
  const unified = await callHarmonic(packet);
  const disposition = dispositionFrom(unified);
  console.log(`Harmonic normalized disposition: ${disposition.normalized}`);
  console.log(`Harmonic admissible: ${String(disposition.admissible)}`);
  console.log(`Harmonic returned signals: ${disposition.rawValues.join(" / ") || "none recognized"}`);

  const governed = syntheticExecutor(
    fixture.proposal,
    disposition.normalized === "ALLOW" ? "EXECUTE" : "BLOCK"
  );
  console.log(`synthetic effect: ${governed.effect_observed ? "YES" : "NO"}`);
  console.log(`result: ${governed.status}`);

  return { id: testCase.id, raw, governed, disposition };
}

console.log("RAW vs GOVERNED — Temporal Standing terminal contrast");
line("═");
console.log("Same proposed consequence; explicit structured authority state; live Harmonic determination.");
console.log("The raw lane is intentionally unsafe and synthetic. The governed lane fails closed on an unrecognized disposition.");
console.log(`Harmonic endpoint: ${API_URL}`);

const results = [];
for (const testCase of fixture.cases) results.push(await runCase(testCase));

line("═");
console.log("CLAIM BOUNDARY");
console.log(fixture.claim_boundary);
console.log("A Harmonic BLOCK/REFUSE demonstrates a governance determination. The synthetic sink demonstrates this demo's local enforcement behavior only.");

const defeated = results.find((r) => r.id === "standing-defeated");
const preserved = results.find((r) => r.id === "standing-preserved");
if (!defeated || !preserved) process.exitCode = 2;
else if (defeated.disposition.normalized === "UNRESOLVED" || preserved.disposition.normalized === "UNRESOLVED") {
  console.error("\nDEMO STATUS: UNRESOLVED — live response could not be mapped to a bounded ALLOW/BLOCK disposition.");
  process.exitCode = 2;
} else if (defeated.governed.effect_observed || !preserved.governed.effect_observed) {
  console.error("\nDEMO STATUS: FALSIFIER TRIGGERED — preserving/defeating pair did not discriminate as expected.");
  process.exitCode = 1;
} else {
  console.log("\nDEMO STATUS: PAIRED CONTRAST OBSERVED — preserving change continued; defeating change was blocked in the synthetic sink.");
}
