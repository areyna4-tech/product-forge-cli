import { ok, equal } from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/routes/index.tsx", "utf8");

for (const eventName of [
  "paid_export_gate_viewed",
  "paid_export_interest_yes",
  "paid_export_interest_maybe",
  "paid_export_interest_no",
  "paid_export_email_submitted",
]) {
  ok(source.includes(eventName), `Expected passive paid-export event ${eventName}`);
}

for (const phrase of [
  "send us your file",
  "manual cleanup",
  "done-for-you",
  "we’ll fix",
  "we'll fix",
  "email your csv",
]) {
  equal(
    source.toLowerCase().includes(phrase),
    false,
    `Passive Option A should not include manual-service phrase: ${phrase}`,
  );
}

ok(
  source.includes("self-serve paid exports") || source.includes("paid self-serve exports"),
  "Expected copy to frame monetization as self-serve paid exports",
);

console.log("Passive paid-export gate assertions passed");
