export type OutboxEnqueueCall = {
  schema: "commercial";
  fn: "enqueue";
  args: {
    p_event_name: string;
    p_payload: Record<string, unknown>;
    p_correlation_id: string;
  };
};

export function buildOutboxEnqueueCall(input: {
  eventName: string;
  payload: Record<string, unknown>;
  correlationId: string;
}): OutboxEnqueueCall {
  return {
    schema: "commercial",
    fn: "enqueue",
    args: {
      p_event_name: input.eventName,
      p_payload: input.payload,
      p_correlation_id: input.correlationId
    }
  };
}
