import { TraceEventType } from '@lobechat/types';
import { after } from 'next/server';

import { TraceClient } from '@/libs/traces';
import { TraceEventBasePayload, TraceEventPayloads } from '@/types/trace';

// SPRINT-AN 2026-05-20: edge runtime — Langfuse v3 es ESM edge-compatible.
// after() está soportado en edge desde Next 15.
export const runtime = 'edge';

export const POST = async (req: Request) => {
  type RequestData = TraceEventPayloads & TraceEventBasePayload;
  const data = (await req.json()) as RequestData;
  const { traceId, eventType } = data;

  const traceClient = new TraceClient();

  const eventClient = traceClient.createEvent(traceId);

  switch (eventType) {
    case TraceEventType.ModifyMessage: {
      eventClient?.modifyMessage(data);
      break;
    }

    case TraceEventType.DeleteAndRegenerateMessage: {
      eventClient?.deleteAndRegenerateMessage(data);
      break;
    }

    case TraceEventType.RegenerateMessage: {
      eventClient?.regenerateMessage(data);
      break;
    }

    case TraceEventType.CopyMessage: {
      eventClient?.copyMessage(data);
      break;
    }
  }

  after(async () => {
    await traceClient.shutdownAsync();
  });

  return new Response(undefined, { status: 201 });
};
