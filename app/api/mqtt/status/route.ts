// ═══════════════════════════════════════════════════════════════════════════════
//  SUNFLOWER — API Route MQTT Status (Consulta instantânea)
// ═══════════════════════════════════════════════════════════════════════════════
//
//  GET → Retorna o status atual do broker, ESP32 e último dado recebido.
//        Usado pelo frontend no carregamento inicial da página,
//        antes de o SSE começar a enviar dados.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { mqttClient } from "@/lib/mqttClient";

// Desabilita cache — status é sempre dinâmico
export const dynamic = "force-dynamic";

export async function GET() {
  const status = mqttClient.getStatus();
  const lastData = mqttClient.getLastData();

  return Response.json({
    broker: {
      connected: status.brokerConnected,
      url: process.env.MQTT_BROKER_URL || "mqtt://localhost:1883",
    },
    esp32: {
      online: status.espOnline,
      lastDataAt: status.lastDataAt,
    },
    lastData,
    serverTime: Date.now(),
  });
}
