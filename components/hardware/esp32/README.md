# 🌻 Sunflower — Firmware ESP32

> ✅ **Firmware ATIVO.** Pronto para uso com ESP32 DevKit V1.

## Setup

1. **Preencha** suas credenciais WiFi (`YOUR_SSID` e `YOUR_PASSWORD`) no `.ino`
2. **Preencha** o IP do broker Mosquitto (`MQTT_SERVER`)
3. **Instale** as bibliotecas no Arduino IDE (ver abaixo)
4. **Selecione** a placa "ESP32 Dev Module" no Arduino IDE
5. **Grave** o firmware — a ESP32 publica diretamente no MQTT via WiFi

## Comandos MQTT

O firmware aceita comandos via tópico `sunflower/tracker/command`:

| Comando | Efeito |
|---------|--------|
| `reset` | Zera o melhor ângulo registrado |
| `calibrate` | Move servos para posição central (90°/45°) |
| `status` | Responde com uptime, RSSI WiFi e memória livre |

## Migração Arduino Uno → ESP32

### O que muda vs. Arduino Uno

| Aspecto | Arduino Uno | ESP32 |
|---------|------------|-------|
| Comunicação | Serial USB → Bridge → MQTT | WiFi → MQTT direto |
| Bridge necessário? | ✅ Sim | ❌ Não |
| ADC | 10 bits (0-1023) | 12 bits (0-4095) — normalizado para 0-1023 |
| Tensão ref. ADC | 5V | 3.3V |
| Biblioteca Servo | `Servo.h` | `ESP32Servo.h` |
| Pinos ADC com WiFi | Todos OK | Apenas ADC1 (GPIOs 32-39) |

## Bibliotecas Necessárias

Instale via **Arduino IDE → Gerenciador de Bibliotecas**:

1. **ESP32Servo** por Kevin Harrington (v3.x+)
2. **PubSubClient** por Nick O'Leary (v2.8+)
3. **WiFi.h** — já incluída no core ESP32

## Pinagem Recomendada (ESP32 DevKit V1)

| Componente | GPIO | Nota |
|------------|------|------|
| Servo Horizontal | 13 | PWM |
| Servo Vertical | 12 | PWM |
| LDR Cima Esquerdo | 34 | ADC1_CH6 (input only) |
| LDR Baixo Esquerdo | 35 | ADC1_CH7 (input only) |
| LDR Baixo Direito | 32 | ADC1_CH4 |
| LDR Cima Direito | 33 | ADC1_CH5 |
| Placa Solar (Tensão) | 36 (VP) | ADC1_CH0 (input only) |

> ⚠️ **GPIOs 34-39 são input-only** na ESP32. Não tente usar como saída.

> ⚠️ **ADC2 (GPIOs 0, 2, 4, 15, 25-27)** não funciona quando o WiFi está ativo. Use apenas ADC1.

## Tópicos MQTT

Os mesmos do Arduino — compatibilidade total:

| Tópico | Direção | Descrição |
|--------|---------|-----------|
| `sunflower/tracker/data` | ESP32 → Frontend | Telemetria JSON |
| `sunflower/tracker/status` | ESP32 → Frontend | `online` / `offline` (LWT) |
| `sunflower/tracker/command` | Frontend → ESP32 | Comandos futuros |
