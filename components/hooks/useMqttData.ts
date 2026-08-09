// ═══════════════════════════════════════════════════════════════════════════════
//  SUNFLOWER — Hook React: useMqttData
// ═══════════════════════════════════════════════════════════════════════════════
//
//  Hook customizado que conecta o frontend ao backend MQTT via SSE.
//
//  Responsabilidades:
//    1. Abre EventSource para /api/mqtt (Server-Sent Events)
//    2. Parseia eventos SSE e atualiza o estado React
//    3. Reconexão automática com backoff exponencial
//    4. Fetch inicial em /api/mqtt/status para estado ao carregar
//    5. Expõe sendCommand() para enviar comandos ao ESP32
//    6. Mantém histórico de tensão para sparkline
//
// ═══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

export interface MqttConnectionStatus {
  brokerConnected: boolean;
  espOnline: boolean;
  lastDataAt: number | null;
}

interface UseMqttDataReturn {
  /** Último dado recebido do ESP32 */
  data: SolarData | null;
  /** Histórico de tensão (para sparkline) */
  history: number[];
  /** Status da conexão MQTT (broker + ESP32) */
  mqttStatus: MqttConnectionStatus;
  /** Se o SSE está conectado ao servidor Next.js */
  sseConnected: boolean;
  /** Log de eventos de conexão */
  log: string[];
  /** Envia um comando ao ESP32 via MQTT */
  sendCommand: (command: string) => Promise<boolean>;
  /** Limpa o histórico local */
  resetHistory: () => void;
}

const HISTORY_MAX = 60;
const MAX_LOG_LINES = 8;
const SSE_RECONNECT_BASE_MS = 1000;
const SSE_RECONNECT_MAX_MS = 30000;

// ═══════════════════════════════════════════════════════════════════════════════
//  Hook
// ═══════════════════════════════════════════════════════════════════════════════
export function useMqttData(): UseMqttDataReturn {
  const [data, setData] = useState<SolarData | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [mqttStatus, setMqttStatus] = useState<MqttConnectionStatus>({
    brokerConnected: false,
    espOnline: false,
    lastDataAt: null,
  });
  const [sseConnected, setSseConnected] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const mountedRef = useRef(true);

  // ── Helper: adicionar linha ao log ──
  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-(MAX_LOG_LINES - 1)), msg]);
  }, []);

  // ── Ref para a função de conexão (evita referência circular no useCallback) ──
  const connectSSERef = useRef<() => void>(() => {});

  // ── Efeito principal: configura connectSSE, inicia SSE + fetch status ──
  useEffect(() => {
    mountedRef.current = true;

    // Definir a função de conexão SSE dentro do useEffect (evita atualizar ref durante render)
    const connectSSE = () => {
      // Evita múltiplas conexões
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource("/api/mqtt");
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!mountedRef.current) return;
        setSseConnected(true);
        reconnectAttemptRef.current = 0;
        addLog("✅ Conectado ao servidor MQTT (SSE)");
      };

      // ── Evento: dados do ESP32 ──
      es.addEventListener("data", (event) => {
        if (!mountedRef.current) return;
        try {
          const entry = JSON.parse(event.data) as SolarData;
          setData(entry);
          setHistory((prev) => {
            const next = [...prev, entry.tensao_mv];
            return next.length > HISTORY_MAX ? next.slice(-HISTORY_MAX) : next;
          });
        } catch {
          // JSON inválido — ignora
        }
      });

      // ── Evento: status do broker/ESP32 ──
      es.addEventListener("status", (event) => {
        if (!mountedRef.current) return;
        try {
          const status = JSON.parse(event.data) as MqttConnectionStatus;
          setMqttStatus(status);
        } catch {
          // ignora
        }
      });

      // ── Evento: ESP32 online/offline ──
      es.addEventListener("espStatus", (event) => {
        if (!mountedRef.current) return;
        try {
          const { online } = JSON.parse(event.data);
          setMqttStatus((prev) => ({ ...prev, espOnline: online }));
          addLog(online ? "🟢 ESP32 ficou online" : "🔴 ESP32 ficou offline");
        } catch {
          // ignora
        }
      });

      // ── Erro / desconexão ──
      es.onerror = () => {
        if (!mountedRef.current) return;

        es.close();
        eventSourceRef.current = null;
        setSseConnected(false);

        // Reconexão com backoff exponencial
        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(
          SSE_RECONNECT_BASE_MS * Math.pow(2, attempt),
          SSE_RECONNECT_MAX_MS
        );
        reconnectAttemptRef.current = attempt + 1;

        addLog(`🔄 SSE desconectado. Reconectando em ${(delay / 1000).toFixed(0)}s...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectSSERef.current();
          }
        }, delay);
      };
    };

    // Atribuir ao ref para que a reconexão funcione
    connectSSERef.current = connectSSE;

    // Fetch status inicial (assíncrono — setState em callback é OK)
    const fetchInitialStatus = async () => {
      try {
        const res = await fetch("/api/mqtt/status");
        if (!res.ok) return;

        const json = await res.json();

        if (json.broker) {
          setMqttStatus({
            brokerConnected: json.broker.connected ?? false,
            espOnline: json.esp32?.online ?? false,
            lastDataAt: json.esp32?.lastDataAt ?? null,
          });
        }

        if (json.lastData) {
          setData(json.lastData);
          setHistory((prev) => {
            const next = [...prev, json.lastData.tensao_mv];
            return next.length > HISTORY_MAX ? next.slice(-HISTORY_MAX) : next;
          });
        }

        addLog(
          json.broker?.connected
            ? "📡 Broker MQTT conectado"
            : "⚠️ Broker MQTT desconectado"
        );

        if (json.esp32?.online) {
          addLog("🟢 ESP32 online (dados anteriores carregados)");
        }
      } catch {
        addLog("⚠️ Não foi possível obter status inicial do MQTT");
      }
    };

    fetchInitialStatus();
    connectSSE();

    return () => {
      mountedRef.current = false;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [addLog]);

  // ── Enviar comando ao ESP32 ──
  const sendCommand = useCallback(
    async (command: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/mqtt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        });

        const json = await res.json();

        if (json.success) {
          addLog(`📤 Comando enviado: "${command}"`);
          return true;
        } else {
          addLog(`❌ Falha ao enviar comando: ${json.error}`);
          return false;
        }
      } catch {
        addLog("❌ Erro de rede ao enviar comando");
        return false;
      }
    },
    [addLog]
  );

  // ── Limpar histórico ──
  const resetHistory = useCallback(() => {
    setHistory([]);
    setData(null);
    addLog("🔄 Histórico local limpo — ESP32 continua operando.");
  }, [addLog]);

  return {
    data,
    history,
    mqttStatus,
    sseConnected,
    log,
    sendCommand,
    resetHistory,
  };
}
