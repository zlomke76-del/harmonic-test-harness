import assert from "node:assert/strict";
import { createReceiver } from "./receiver.mjs";

const target = {
  actionId: "REF-1047",
  payload: { amountMinor: 4200, currency: "USD" },
  approval: { id: "approval-a", delegation: "refunds", team: "Team A" }
};

function verify(receiver, attemptId, result, standing) {
  const journal = receiver.journal();
  const outcome = journal.find(entry => entry.type === "receiver-outcome" && entry.attemptId === attemptId);
  assert.equal(outcome?.result, result);
  const determination = journal.find(entry => entry.position === outcome.standingPosition);
  assert.equal(determination.actionId, outcome.actionId);
  assert.equal(determination.attemptId, attemptId);
  assert.equal(determination.standing, standing);
  const writes = receiver.ledger().filter(entry => entry.attemptId === attemptId);
  assert.equal(writes.length, result === "Commit" ? 1 : 0);
  if (writes.length) {
    assert.equal(writes[0].position, outcome.writePosition);
    assert.equal(writes[0].standingPosition, determination.position);
    assert.equal(writes[0].actionId, outcome.actionId);
  }
  return determination;
}

async function challengeFirst(resolvingTeam) {
  const receiver = createReceiver({ refunds: "Team A", independent: "Team A" });
  let effective;
  const interrupted = await receiver.execute({ ...target, attemptId: "A" }, () => {
    const initial = receiver.journal().at(-1);
    assert.equal(initial.attemptId, "A");
    assert.equal(initial.standing, "Preserved");
    assert.equal(receiver.ledger().length, 0);
    effective = receiver.challenge("refunds");
    assert.ok(initial.position < effective.position);
  });
  assert.equal(interrupted.cause, effective.position);
  const interruptedStanding = verify(receiver, "A", "Abort", "Unresolved");
  assert.equal(interruptedStanding.challenge, effective.position);

  await receiver.execute({ ...target, attemptId: "B" });
  const retry = verify(receiver, "B", "Hold", "Unresolved");
  assert.equal(retry.revision, effective.position);
  assert.ok(interrupted.position < retry.position);

  await receiver.execute({
    ...target, actionId: "REF-CONTROL", attemptId: "control",
    approval: { id: "approval-control", delegation: "independent", team: "Team A" }
  });
  verify(receiver, "control", "Commit", "Preserved");

  const resolution = receiver.adjudicate("refunds", resolvingTeam);
  const transferred = resolvingTeam === "Team B";
  if (transferred) {
    await receiver.execute({ ...target, attemptId: "C1" });
    assert.equal(verify(receiver, "C1", "Deny", "Defeated").revision, resolution.position);
  }
  const finalAttempt = transferred ? "C2" : "C";
  await receiver.execute({
    ...target, attemptId: finalAttempt,
    approval: transferred ? { ...target.approval, id: "approval-b", team: "Team B" } : target.approval
  });
  assert.equal(verify(receiver, finalAttempt, "Commit", "Preserved").revision, resolution.position);
  const writes = receiver.ledger().filter(entry => entry.actionId === target.actionId);
  assert.deepEqual(writes.map(entry => entry.attemptId), [finalAttempt]);
  assert.deepEqual(JSON.parse(writes[0].payload), target.payload);
  return { journal: receiver.journal(), ledger: receiver.ledger() };
}

async function commitFirst() {
  const receiver = createReceiver({ refunds: "Team A" });
  const committed = await receiver.execute({ ...target, attemptId: "prior" });
  const effective = receiver.challenge("refunds");
  verify(receiver, "prior", "Commit", "Preserved");
  assert.ok(committed.writePosition < effective.position);
  await receiver.execute({ ...target, attemptId: "later" });
  assert.equal(verify(receiver, "later", "Hold", "Unresolved").revision, effective.position);
  assert.deepEqual(receiver.ledger().map(entry => entry.attemptId), ["prior"]);
  return { journal: receiver.journal(), ledger: receiver.ledger() };
}

const runs = {
  primary: await challengeFirst("Team A"),
  supersededAuthority: await challengeFirst("Team B"),
  commitFirst: await commitFirst()
};
console.log(JSON.stringify({ result: "PASS", scope: "synthetic reference receiver", runs }, null, 2));
