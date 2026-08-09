/*
 * ============================================================================
 *  SUNFLOWER — Rastreador Solar Biaxial (ESP32 — WiFi + MQTT Nativo)
 * ============================================================================
 *  Plataforma : ESP32 DevKit V1
 *  Status     : ✅ ATIVO — Código descomentado e pronto para uso
 *
 *  Setup:
 *    1. Preencha suas credenciais WiFi (SSID e PASSWORD)
 *    2. Preencha o IP do broker Mosquitto
 *    3. Instale as bibliotecas necessárias no Arduino IDE:
 *       - ESP32Servo (por Kevin Harrington)
 *       - PubSubClient (por Nick O'Leary)
 *    4. Selecione a placa "ESP32 Dev Module" no Arduino IDE
 *    5. Grave e pronto — a ESP32 publica diretamente no MQTT
 *       sem precisar do bridge Node.js
 *
 *  Pinagem recomendada (ESP32 DevKit V1):
 *    Servo Horizontal → GPIO 13
 *    Servo Vertical   → GPIO 12
 *    LDR Cima Esq     → GPIO 34 (ADC1_CH6)
 *    LDR Baixo Esq    → GPIO 35 (ADC1_CH7)
 *    LDR Baixo Dir    → GPIO 32 (ADC1_CH4)
 *    LDR Cima Dir     → GPIO 33 (ADC1_CH5)
 *    Placa Solar (V)  → GPIO 36 (VP / ADC1_CH0)
 *
 *  ⚠️  IMPORTANTE: Usar apenas pinos ADC1 (GPIOs 32-39).
 *      ADC2 não funciona quando o WiFi está ativo na ESP32.
 *
 *  Tópicos MQTT (mesmos do Arduino):
 *    sunflower/tracker/data     → Publica JSON de telemetria
 *    sunflower/tracker/status   → LWT (online/offline)
 *    sunflower/tracker/command  → Recebe comandos (reset, calibrate)
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

// ═══════════════════════════════════════════════════════════════════════════
//  ██  CONFIGURAÇÕES — PREENCHA COM SEUS DADOS  ██
// ═══════════════════════════════════════════════════════════════════════════

// ┌──────────────────────────────────────────────┐
// │  ⚡ WiFi — Insira suas credenciais aqui      │
// └──────────────────────────────────────────────┘
const char* WIFI_SSID     = "YOUR_SSID";       // ← Seu nome de rede WiFi
const char* WIFI_PASSWORD = "YOUR_PASSWORD";   // ← Sua senha WiFi

// ┌──────────────────────────────────────────────┐
// │  ⚡ MQTT Broker — Configuração LOCAL         │
// └──────────────────────────────────────────────┘
const char* MQTT_SERVER = "192.168.1.100";     // ← IP do computador com Mosquitto
const int   MQTT_PORT   = 1883;               // Porta TCP padrão do Mosquitto

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  ⚡ MQTT Broker — Configuração para SERVIDOR REMOTO (futuro)            │
// │     Descomente as linhas abaixo e comente as de cima quando migrar     │
// └──────────────────────────────────────────────────────────────────────────┘
// const char* MQTT_SERVER   = "seu-servidor.com";  // ← Endereço do servidor remoto
// const int   MQTT_PORT     = 1883;                // Porta TCP do Mosquitto remoto
// const char* MQTT_USER     = "sunflower";         // ← Usuário MQTT (se autenticação ativa)
// const char* MQTT_PASSWORD = "sua_senha_mqtt";    // ← Senha MQTT (se autenticação ativa)

// ─── Tópicos MQTT ──────────────────────────────────────────────────────────
const char* TOPIC_DATA    = "sunflower/tracker/data";
const char* TOPIC_STATUS  = "sunflower/tracker/status";
const char* TOPIC_COMMAND = "sunflower/tracker/command";

// ─── ID do dispositivo ─────────────────────────────────────────────────────
const char* CLIENT_ID = "sunflower-esp32-tracker";

// ═══════════════════════════════════════════════════════════════════════════
//  SERVOS
// ═══════════════════════════════════════════════════════════════════════════
Servo servoHorizontal;
Servo servoVertical;

int anguloHorizontal     = 180;
int limiteHorizontalMax  = 175;
int limiteHorizontalMin  = 5;

int anguloVertical       = 45;
int limiteVerticalMax    = 100;
int limiteVerticalMin    = 1;

// ─── Pinos dos servos (ESP32) ──────────────────────────────────────────────
const int PINO_SERVO_H = 13;
const int PINO_SERVO_V = 12;

// ═══════════════════════════════════════════════════════════════════════════
//  LDRs — Usar apenas pinos ADC1 (WiFi desabilita ADC2)
// ═══════════════════════════════════════════════════════════════════════════
const int LDR_CIMA_ESQ  = 34;  // ADC1_CH6
const int LDR_BAIXO_ESQ = 35;  // ADC1_CH7
const int LDR_BAIXO_DIR = 32;  // ADC1_CH4
const int LDR_CIMA_DIR  = 33;  // ADC1_CH5
const int PINO_PLACA    = 36;  // VP — ADC1_CH0

// ═══════════════════════════════════════════════════════════════════════════
//  RASTREAMENTO DO MELHOR ÂNGULO
// ═══════════════════════════════════════════════════════════════════════════
int melhorAzimute   = 180;
int melhorPolar     = 45;
int melhorTensaoMv  = 0;

// ═══════════════════════════════════════════════════════════════════════════
//  CONTROLE DE TEMPO
// ═══════════════════════════════════════════════════════════════════════════
unsigned long ultimoEnvioMqtt  = 0;
const unsigned long INTERVALO_MQTT_MS = 500; // Publica a cada 500ms

unsigned long ultimoReconnect  = 0;
const unsigned long INTERVALO_RECONNECT_MS = 5000;

// ═══════════════════════════════════════════════════════════════════════════
//  OBJETOS WiFi + MQTT
// ═══════════════════════════════════════════════════════════════════════════
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ─── Buffer JSON (ampliado para novos campos uptime_ms e wifi_rssi) ──────
char jsonBuffer[512];

// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

// Conecta ao WiFi com reconexão automática
void conectarWiFi()
{
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("[WiFi] Conectando a ");
  Serial.print(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  WiFi.setSleep(false); // Desabilita power-save para conexão estável

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 40)
  {
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println();
    Serial.print("[WiFi] Conectado! IP: ");
    Serial.println(WiFi.localIP());
  }
  else
  {
    Serial.println();
    Serial.println("[WiFi] ⚠️  Falha na conexão. Tentando novamente em breve...");
  }
}

// Conecta ao broker MQTT com LWT (Last Will and Testament)
void conectarMQTT()
{
  if (mqttClient.connected()) return;

  unsigned long agora = millis();
  if (agora - ultimoReconnect < INTERVALO_RECONNECT_MS) return;
  ultimoReconnect = agora;

  Serial.print("[MQTT] Conectando ao broker ");
  Serial.print(MQTT_SERVER);
  Serial.print(":");
  Serial.println(MQTT_PORT);

  // LWT: se a ESP32 desconectar, o broker publica "offline" automaticamente
  bool conectado;

  // ── Conexão LOCAL (sem autenticação) ──
  conectado = mqttClient.connect(
    CLIENT_ID,
    NULL,                     // sem usuário
    NULL,                     // sem senha
    TOPIC_STATUS,             // tópico do LWT
    0,                        // QoS 0
    true,                     // retain = true
    "offline"                 // mensagem LWT
  );

  // ── Conexão SERVIDOR REMOTO (com autenticação) ──
  // Descomente o bloco abaixo e comente o de cima quando migrar para servidor
  //
  // conectado = mqttClient.connect(
  //   CLIENT_ID,
  //   MQTT_USER,               // usuário
  //   MQTT_PASSWORD,           // senha
  //   TOPIC_STATUS,            // tópico do LWT
  //   0,                       // QoS 0
  //   true,                    // retain = true
  //   "offline"                // mensagem LWT
  // );

  if (conectado)
  {
    Serial.println("[MQTT] ✅ Conectado!");
    mqttClient.publish(TOPIC_STATUS, "online", true); // retain = true
    mqttClient.subscribe(TOPIC_COMMAND); // Inscreve para receber comandos
  }
  else
  {
    Serial.print("[MQTT] ❌ Falha. Estado: ");
    Serial.println(mqttClient.state());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  CALLBACK MQTT — Handler de Comandos Recebidos
// ═══════════════════════════════════════════════════════════════════════════
void callbackMQTT(char* topic, byte* payload, unsigned int length)
{
  Serial.print("[MQTT] Mensagem recebida no tópico: ");
  Serial.println(topic);

  // Converte payload para string
  char msg[length + 1];
  memcpy(msg, payload, length);
  msg[length] = '\0';

  Serial.print("[MQTT] Payload: ");
  Serial.println(msg);

  // ── Handler de comandos ────────────────────────────────────────────────
  if (strcmp(msg, "reset") == 0)
  {
    // Reset do melhor ângulo — zera o recorde e recomeça a busca
    melhorTensaoMv = 0;
    melhorAzimute = anguloHorizontal;
    melhorPolar = anguloVertical;
    Serial.println("[CMD] ✅ Melhor ângulo resetado!");

    // Publica confirmação no tópico de dados para feedback imediato
    snprintf(jsonBuffer, sizeof(jsonBuffer),
      "{\"cmd_response\":\"reset_ok\",\"melhor_azimute\":%d,\"melhor_polar\":%d,\"melhor_tensao_mv\":%d}",
      melhorAzimute, melhorPolar, melhorTensaoMv
    );
    mqttClient.publish(TOPIC_DATA, jsonBuffer);
  }
  else if (strcmp(msg, "calibrate") == 0)
  {
    // Calibração — move servos para posição central (90°/45°)
    anguloHorizontal = 90;
    anguloVertical = 45;
    servoHorizontal.write(anguloHorizontal);
    servoVertical.write(anguloVertical);
    Serial.println("[CMD] ✅ Servos calibrados para posição central!");

    snprintf(jsonBuffer, sizeof(jsonBuffer),
      "{\"cmd_response\":\"calibrate_ok\",\"azimute\":%d,\"polar\":%d}",
      anguloHorizontal, anguloVertical
    );
    mqttClient.publish(TOPIC_DATA, jsonBuffer);
  }
  else if (strcmp(msg, "status") == 0)
  {
    // Responde com status atual (útil para diagnóstico remoto)
    snprintf(jsonBuffer, sizeof(jsonBuffer),
      "{\"cmd_response\":\"status_ok\",\"uptime_ms\":%lu,\"wifi_rssi\":%d,\"free_heap\":%u}",
      millis(), WiFi.RSSI(), ESP.getFreeHeap()
    );
    mqttClient.publish(TOPIC_DATA, jsonBuffer);
    Serial.println("[CMD] ✅ Status enviado!");
  }
  else
  {
    Serial.print("[CMD] ⚠️ Comando desconhecido: ");
    Serial.println(msg);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════════════════════
void setup()
{
  Serial.begin(115200);
  Serial.println();
  Serial.println("╔══════════════════════════════════════╗");
  Serial.println("║  SUNFLOWER — ESP32 Solar Tracker     ║");
  Serial.println("║  WiFi + MQTT Nativo                  ║");
  Serial.println("╚══════════════════════════════════════╝");

  // ─── Servos ──────────────────────────────────────────
  // Aloca timers PWM para os servos (ESP32 precisa disso)
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);

  servoHorizontal.setPeriodHertz(50);
  servoVertical.setPeriodHertz(50);
  servoHorizontal.attach(PINO_SERVO_H, 500, 2400);
  servoVertical.attach(PINO_SERVO_V, 500, 2400);

  servoHorizontal.write(anguloHorizontal);
  servoVertical.write(anguloVertical);

  // ─── WiFi ────────────────────────────────────────────
  conectarWiFi();

  // ─── MQTT ────────────────────────────────────────────
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(callbackMQTT);
  mqttClient.setBufferSize(512); // Buffer maior para o JSON

  conectarMQTT();

  delay(1000);
}

// ═══════════════════════════════════════════════════════════════════════════
//  LOOP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
void loop()
{
  // ─── Garante conexões ativa ──────────────────────────────────────────────
  conectarWiFi();
  conectarMQTT();
  mqttClient.loop(); // Processa mensagens MQTT recebidas

  // ─── Leitura da tensão da placa solar ───────────────────────────────────
  // ESP32 ADC: 12 bits (0-4095), referência 3.3V
  int leituraPlaca = analogRead(PINO_PLACA);
  int tensaoMv = map(leituraPlaca, 0, 4095, 0, 3300);

  // ─── Leituras dos LDRs ─────────────────────────────────────────────────
  int cimaEsq  = analogRead(LDR_CIMA_ESQ);
  int cimaDir  = analogRead(LDR_CIMA_DIR);
  int baixoEsq = analogRead(LDR_BAIXO_ESQ);
  int baixoDir = analogRead(LDR_BAIXO_DIR);

  // Normaliza LDRs de 12 bits (0-4095) para 10 bits (0-1023) — compatibilidade
  cimaEsq  = cimaEsq  >> 2;
  cimaDir  = cimaDir  >> 2;
  baixoEsq = baixoEsq >> 2;
  baixoDir = baixoDir >> 2;

  int tempoAjuste = 10;
  int tolerancia  = 90;

  // ─── Médias ────────────────────────────────────────────────────────────
  int mediaCima  = (cimaEsq + cimaDir) / 2;
  int mediaBaixo = (baixoEsq + baixoDir) / 2;
  int mediaEsq   = (cimaEsq + baixoEsq) / 2;
  int mediaDir   = (cimaDir + baixoDir) / 2;

  // ─── Diferenças ────────────────────────────────────────────────────────
  int diferencaVertical   = mediaCima - mediaBaixo;
  int diferencaHorizontal = mediaEsq - mediaDir;

  // ─── Ajuste Vertical ──────────────────────────────────────────────────
  if (diferencaVertical < -tolerancia || diferencaVertical > tolerancia)
  {
    if (mediaCima > mediaBaixo)
    {
      anguloVertical++;
      if (anguloVertical > limiteVerticalMax)
        anguloVertical = limiteVerticalMax;
    }
    else
    {
      anguloVertical--;
      if (anguloVertical < limiteVerticalMin)
        anguloVertical = limiteVerticalMin;
    }
    servoVertical.write(anguloVertical);
  }

  // ─── Ajuste Horizontal ────────────────────────────────────────────────
  if (diferencaHorizontal < -tolerancia || diferencaHorizontal > tolerancia)
  {
    if (mediaEsq > mediaDir)
    {
      anguloHorizontal--;
      if (anguloHorizontal < limiteHorizontalMin)
        anguloHorizontal = limiteHorizontalMin;
    }
    else
    {
      anguloHorizontal++;
      if (anguloHorizontal > limiteHorizontalMax)
        anguloHorizontal = limiteHorizontalMax;
    }
    servoHorizontal.write(anguloHorizontal);
  }

  // ─── Atualiza melhor ângulo ───────────────────────────────────────────
  if (tensaoMv > melhorTensaoMv)
  {
    melhorTensaoMv = tensaoMv;
    melhorAzimute  = anguloHorizontal;
    melhorPolar    = anguloVertical;
  }

  // ─── Publica no MQTT (throttled) ──────────────────────────────────────
  unsigned long agora = millis();
  if (agora - ultimoEnvioMqtt >= INTERVALO_MQTT_MS)
  {
    ultimoEnvioMqtt = agora;

    // Coleta dados extras para monitoramento
    unsigned long uptime_ms = millis();
    int wifi_rssi = WiFi.RSSI();

    snprintf(jsonBuffer, sizeof(jsonBuffer),
      "{\"azimute\":%d,\"polar\":%d,\"tensao_mv\":%d,"
      "\"melhor_azimute\":%d,\"melhor_polar\":%d,\"melhor_tensao_mv\":%d,"
      "\"ldr_cima_esq\":%d,\"ldr_cima_dir\":%d,"
      "\"ldr_baixo_esq\":%d,\"ldr_baixo_dir\":%d,"
      "\"uptime_ms\":%lu,\"wifi_rssi\":%d}",
      anguloHorizontal, anguloVertical, tensaoMv,
      melhorAzimute, melhorPolar, melhorTensaoMv,
      cimaEsq, cimaDir, baixoEsq, baixoDir,
      uptime_ms, wifi_rssi
    );

    mqttClient.publish(TOPIC_DATA, jsonBuffer);

    // Debug serial
    Serial.print("[MQTT] Publicado: ");
    Serial.println(jsonBuffer);
  }

  delay(tempoAjuste);
}
