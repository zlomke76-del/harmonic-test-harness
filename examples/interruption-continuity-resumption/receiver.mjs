// Single-process reference receiver. Authority changes and ledger writes are
// ordered in synchronous sections of the same event loop.
export function createReceiver(delegations) {
  const authority = new Map(Object.entries(delegations).map(([id, team]) =>
    [id, { team, revision: 0, challenge: null }]));
  const attempts = new Set();
  const actions = new Map();
  const journal = [];
  const ledger = new Map();

  function record(event) {
    const entry = Object.freeze({ ...event, position: journal.length + 1 });
    journal.push(entry);
    return entry;
  }

  function challenge(delegation) {
    const state = authority.get(delegation);
    if (!state || state.challenge) throw new Error("Expected an undisputed delegation");
    const event = record({ type: "challenge-effective", delegation });
    authority.set(delegation, { ...state, revision: event.position, challenge: event.position });
    return event;
  }

  // The examination supplies the competent authority's adjudication as an input.
  function adjudicate(delegation, team) {
    const state = authority.get(delegation);
    if (!state?.challenge) throw new Error("Expected an effective challenge");
    const event = record({ type: "adjudication-effective", delegation, team, challenge: state.challenge });
    authority.set(delegation, { team, revision: event.position, challenge: null });
    return event;
  }

  function evaluate(attempt) {
    const { id: approvalId, delegation, team } = attempt.approval;
    const state = authority.get(delegation);
    const standing = !state || state.challenge ? "Unresolved"
      : state.team === team ? "Preserved" : "Defeated";
    return record({
      type: "standing", actionId: attempt.actionId, attemptId: attempt.attemptId,
      standing, approvalId, delegation, team, revision: state?.revision, challenge: state?.challenge
    });
  }

  async function execute({ actionId, attemptId, payload, approval }, beforeCommit = () => {}) {
    if (attempts.has(attemptId)) throw new Error("Attempt ID must be distinct");
    const fixedPayload = JSON.stringify(payload);
    if (actions.has(actionId) && actions.get(actionId) !== fixedPayload) {
      throw new Error("Action payload must remain fixed");
    }
    attempts.add(attemptId);
    actions.set(actionId, fixedPayload);
    const identity = { actionId, attemptId };
    const attempt = { ...identity, approval: { ...approval } };
    const initial = evaluate(attempt);
    if (initial.standing === "Preserved") await beforeCommit();

    // The final evaluation and commit have no yield between them.
    const current = evaluate(attempt);
    const outcome = (result, details = {}) => record({
      type: "receiver-outcome", ...identity, result, standingPosition: current.position, ...details
    });
    if (current.standing === "Unresolved") {
      if (initial.standing === "Preserved" && current.challenge) {
        return outcome("Abort", { cause: current.challenge });
      }
      return outcome("Hold");
    }
    if (current.standing === "Defeated") return outcome("Deny");
    if (ledger.has(actionId)) return outcome("Already committed");

    const write = record({
      type: "ledger-write", ...identity, payload: fixedPayload, standingPosition: current.position
    });
    ledger.set(actionId, write);
    return outcome("Commit", { writePosition: write.position });
  }

  return {
    challenge, adjudicate, execute,
    journal: () => [...journal],
    ledger: () => [...ledger.values()]
  };
}
