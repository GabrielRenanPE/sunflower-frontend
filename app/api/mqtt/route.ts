// ═══════════════════════════════════════════════════════════════════════════════
//  SUNFLOWER — API Route MQTT (SSE + Comandos)
// ═══════════════════════════════════════════════════════════════════════════════

import { mqttClient, type SolarData, type MqttStatus } from "@/lib/mqttClient";

export const dynamic = "force-dynamic";

// ─── GET — Server-Sent Events ─────────────────────────────────────────────────
export async function GET() {
  const encoder = new TextEncoder();

  // Funções de cleanup guardadas fora do ReadableStream
  // para que cancel() consiga acessá-las sem depender de `stream`
  let cleanupFn: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream já fechada pelo cliente — ignora
        }
      };

      // ── Estado inicial ao abrir conexão SSE ──
      send("status", mqttClient.getStatus());

      const initialData = mqttClient.getLastData();
      if (initialData) send("data", initialData);

      // ── Listeners MQTT ──
      const onData     = (entry: SolarData)  => send("data", entry);
      const onStatus   = (status: MqttStatus) => send("status", status);
      const onEspStatus = (online: boolean)  => send("espStatus", { online });

      mqttClient.emitter.on("data",      onData);
      mqttClient.emitter.on("status",    onStatus);
      mqttClient.emitter.on("espStatus", onEspStatus);

      // ── Heartbeat a cada 15s ──
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // ── Registra cleanup para cancel() usar ──
      cleanupFn = () => {
        mqttClient.emitter.off("data",      onData);
        mqttClient.emitter.off("status",    onStatus);
        mqttClient.emitter.off("espStatus", onEspStatus);
        clearInterval(heartbeat);
      };
    },

    cancel() {
      // Chamado automaticamente quando o browser fecha a conexão SSE
      console.log("[SSE] Cliente desconectou do stream MQTT");
      cleanupFn?.();
      cleanupFn = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":    "text/event-stream",
      "Cache-Control":   "no-cache, no-transform",
      "Connection":      "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ─── POST — Enviar comando ao ESP32 via MQTT ──────────────────────────────────
export async function POST(request: Request) {
  try {
    const body    = await request.json();
    const command = body?.command;

    if (!command || typeof command !== "string") {
      return Response.json(
        { error: "Campo 'command' é obrigatório e deve ser uma string." },
        { status: 400 }
      );
    }

    const sent = mqttClient.publish(command);

    if (!sent) {
      return Response.json(
        { error: "Broker MQTT não conectado. Comando não enviado." },
        { status: 503 }
      );
    }

    return Response.json({ success: true, command, timestamp: Date.now() });
  } catch {
    return Response.json(
      { error: 'Body inválido. Envie JSON: { "command": "reset" }' },
      { status: 400 }
    );
  }
}