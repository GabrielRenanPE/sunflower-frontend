// ═══════════════════════════════════════════════════════════════════════════════
//  SUNFLOWER — Cliente MQTT Singleton (Server-side)
// ═══════════════════════════════════════════════════════════════════════════════
//
//  Este módulo mantém UMA única conexão MQTT com o broker Mosquitto.
//  Ele roda APENAS no servidor Node.js (API Routes / server components).
//
//  Responsabilidades:
//    1. Conecta ao Mosquitto e reconecta automaticamente
//    2. Subscribe em sunflower/tracker/data e sunflower/tracker/status
//    3. Armazena o último dado e status em memória
//    4. Notifica listeners via EventEmitter quando novos dados chegam
//    5. Publica comandos no tópico sunflower/tracker/command
//
// ═══════════════════════════════════════════════════════════════════════════════

import mqtt, { type MqttClient } from "mqtt";
import { EventEmitter } from "events";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface SolarData {
  azimute: number;
  polar: number;
  tensao_mv: number;
  melhor_azimute: number;
  melhor_polar: number;
  melhor_tensao_mv: number;
  ldr_cima_esq: number;
  ldr_cima_dir: number;
  ldr_baixo_esq: number;
  ldr_baixo_dir: number;
  timestamp: number;
}

export interface MqttStatus {
  brokerConnected: boolean;
  espOnline: boolean;
  lastDataAt: number | null;
}

// ─── Configuração via .env.local ──────────────────────────────────────────────
const BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const TOPIC_DATA = process.env.MQTT_TOPIC_DATA || "sunflower/tracker/data";
const TOPIC_STATUS =
  process.env.MQTT_TOPIC_STATUS || "sunflower/tracker/status";
const TOPIC_COMMAND =
  process.env.MQTT_TOPIC_COMMAND || "sunflower/tracker/command";

// ─── Classe Singleton ─────────────────────────────────────────────────────────
class SunflowerMqttClient {
  private client: MqttClient | null = null;
  public emitter: EventEmitter;

  // Estado em memória
  public lastData: SolarData | null = null;
  public status: MqttStatus = {
    brokerConnected: false,
    espOnline: false,
    lastDataAt: null,
  };

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50); // Suporta múltiplas conexões SSE simultâneas
    this.connect();
  }

  // ─── Conexão ao broker ────────────────────────────────────────────────────
  private connect(): void {
    console.log(`[MQTT] Conectando ao broker: ${BROKER_URL}`);

    this.client = mqtt.connect(BROKER_URL, {
      clientId: `sunflower-nextjs-${Date.now()}`,
      clean: true,
      reconnectPeriod: 5000, // Reconecta a cada 5s se cair
      connectTimeout: 10000,
    });

    // ── Conectado ──
    this.client.on("connect", () => {
      console.log("[MQTT] ✅ Conectado ao broker Mosquitto");
      this.status.brokerConnected = true;
      this.emitter.emit("status", { ...this.status });

      // Subscribe nos tópicos da ESP32
      this.client!.subscribe(
        [TOPIC_DATA, TOPIC_STATUS],
        { qos: 0 },
        (err) => {
          if (err) {
            console.error("[MQTT] ❌ Erro ao se inscrever nos tópicos:", err);
          } else {
            console.log(`[MQTT] 📡 Inscrito em: ${TOPIC_DATA}, ${TOPIC_STATUS}`);
          }
        }
      );
    });

    // ── Mensagem recebida ──
    this.client.on("message", (topic: string, payload: Buffer) => {
      const message = payload.toString();

      if (topic === TOPIC_DATA) {
        try {
          const parsed = JSON.parse(message);
          const entry: SolarData = {
            azimute: parsed.azimute ?? 0,
            polar: parsed.polar ?? 0,
            tensao_mv: parsed.tensao_mv ?? 0,
            melhor_azimute: parsed.melhor_azimute ?? 0,
            melhor_polar: parsed.melhor_polar ?? 0,
            melhor_tensao_mv: parsed.melhor_tensao_mv ?? 0,
            ldr_cima_esq: parsed.ldr_cima_esq ?? 0,
            ldr_cima_dir: parsed.ldr_cima_dir ?? 0,
            ldr_baixo_esq: parsed.ldr_baixo_esq ?? 0,
            ldr_baixo_dir: parsed.ldr_baixo_dir ?? 0,
            timestamp: Date.now(),
          };

          this.lastData = entry;
          this.status.lastDataAt = entry.timestamp;
          this.emitter.emit("data", entry);
        } catch {
          console.warn("[MQTT] ⚠️ JSON inválido recebido:", message);
        }
      }

      if (topic === TOPIC_STATUS) {
        const online = message.trim().toLowerCase() === "online";
        this.status.espOnline = online;
        console.log(`[MQTT] ESP32 status: ${online ? "🟢 online" : "🔴 offline"}`);
        this.emitter.emit("espStatus", online);
        this.emitter.emit("status", { ...this.status });
      }
    });

    // ── Desconectado ──
    this.client.on("close", () => {
      this.status.brokerConnected = false;
      this.emitter.emit("status", { ...this.status });
    });

    // ── Erro ──
    this.client.on("error", (err) => {
      console.error("[MQTT] ❌ Erro:", err.message);
      this.status.brokerConnected = false;
    });

    // ── Reconexão ──
    this.client.on("reconnect", () => {
      console.log("[MQTT] 🔄 Tentando reconectar ao broker...");
    });
  }

  // ─── Publicar comando para a ESP32 ────────────────────────────────────────
  public publish(command: string): boolean {
    if (!this.client || !this.client.connected) {
      console.warn("[MQTT] ⚠️ Não conectado ao broker. Comando não enviado.");
      return false;
    }

    this.client.publish(TOPIC_COMMAND, command, { qos: 0 }, (err) => {
      if (err) {
        console.error("[MQTT] ❌ Erro ao publicar comando:", err);
      } else {
        console.log(`[MQTT] 📤 Comando enviado: ${command}`);
      }
    });

    return true;
  }

  // ─── Getters ──────────────────────────────────────────────────────────────
  public getLastData(): SolarData | null {
    return this.lastData;
  }

  public getStatus(): MqttStatus {
    return { ...this.status };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Singleton Global — Sobrevive ao hot-reload do Next.js em dev
// ═══════════════════════════════════════════════════════════════════════════════
const globalForMqtt = globalThis as unknown as {
  sunflowerMqtt: SunflowerMqttClient;
};

export const mqttClient =
  globalForMqtt.sunflowerMqtt ?? new SunflowerMqttClient();

if (process.env.NODE_ENV !== "production") {
  globalForMqtt.sunflowerMqtt = mqttClient;
}
