export const MOBBEX_FIXTURE_CHECKOUT_CENTS = 29_000_000;
export const MOBBEX_FIXTURE_SUBSCRIPTION_CENTS = 5_500_000;
export const MOBBEX_FIXTURE_CHECKOUT_ID = "fixture-checkout-290000";
export const MOBBEX_FIXTURE_SUBSCRIPTION_ID = "fixture-subscription-55000";

export type MobbexSyntheticFixture =
  | {
      kind: "checkout_created";
      result: true;
      currency: "ARS";
      totalCents: typeof MOBBEX_FIXTURE_CHECKOUT_CENTS;
      checkoutId: string;
      test: true;
    }
  | {
      kind: "subscription_created";
      result: true;
      currency: "ARS";
      totalCents: typeof MOBBEX_FIXTURE_SUBSCRIPTION_CENTS;
      subscriptionUid: string;
      interval: "1m";
      trial: 1;
      limit: 12;
      noRetry: true;
      embed: true;
      test: true;
    }
  | { kind: "empty_coupons"; result: true; coupons: [] }
  | { kind: "operation_absent" }
  | { kind: "missing_identifier"; result: true }
  | { kind: "transport_error" }
  | { kind: "ambiguous"; result: true };

export type MobbexSyntheticCommand =
  | {
      action: "complete_created";
      purpose: "setup_checkout";
      checkoutId: string;
      expectedAmountCents: typeof MOBBEX_FIXTURE_CHECKOUT_CENTS;
      currency: "ARS";
      economicRecognition: false;
    }
  | {
      action: "complete_created";
      purpose: "subscription";
      subscriptionId: string;
      expectedAmountCents: typeof MOBBEX_FIXTURE_SUBSCRIPTION_CENTS;
      currency: "ARS";
      economicRecognition: false;
    }
  | { action: "mark_ambiguous"; economicRecognition: false }
  | { action: "ignore"; reason: "empty_coupons" | "operation_absent"; economicRecognition: false };

export function observeMobbexFixture(fixture: MobbexSyntheticFixture): MobbexSyntheticCommand {
  if (fixture.kind === "checkout_created") {
    return {
      action: "complete_created",
      purpose: "setup_checkout",
      checkoutId: fixture.checkoutId,
      expectedAmountCents: fixture.totalCents,
      currency: "ARS",
      economicRecognition: false
    };
  }
  if (fixture.kind === "subscription_created") {
    return {
      action: "complete_created",
      purpose: "subscription",
      subscriptionId: fixture.subscriptionUid,
      expectedAmountCents: fixture.totalCents,
      currency: "ARS",
      economicRecognition: false
    };
  }
  if (fixture.kind === "empty_coupons") {
    return { action: "ignore", reason: "empty_coupons", economicRecognition: false };
  }
  if (fixture.kind === "operation_absent") {
    return { action: "ignore", reason: "operation_absent", economicRecognition: false };
  }
  return { action: "mark_ambiguous", economicRecognition: false };
}

export type SyntheticPaymentEventInput = {
  delivery: "browser_return" | "webhook_body";
  logicalName: string;
  commercialReference: string | null;
  purpose: "setup_checkout" | "subscription" | null;
  cancellation: boolean;
};

export type SyntheticPaymentEventCommand =
  | {
      action: "record";
      eventKey: string;
      delivery: "browser_return" | "webhook_body";
      commercialReference: string | null;
      purpose: "setup_checkout" | "subscription" | null;
      cancellation: boolean;
      status: "pending_unverified";
      economicRecognition: false;
    }
  | { action: "reject"; reason: "invalid_payload"; economicRecognition: false };

const logicalNamePattern = /^[a-z0-9_-]{1,120}$/;

export function normalizeSyntheticPaymentEvent(input: SyntheticPaymentEventInput): SyntheticPaymentEventCommand {
  if (
    (input.delivery !== "browser_return" && input.delivery !== "webhook_body")
    || !logicalNamePattern.test(input.logicalName)
    || (input.commercialReference !== null && input.purpose !== "setup_checkout" && input.purpose !== "subscription")
  ) {
    return { action: "reject", reason: "invalid_payload", economicRecognition: false };
  }
  return {
    action: "record",
    eventKey: `synthetic:${input.delivery}:${input.logicalName}`,
    delivery: input.delivery,
    commercialReference: input.commercialReference,
    purpose: input.purpose,
    cancellation: input.cancellation,
    status: "pending_unverified",
    economicRecognition: false
  };
}
