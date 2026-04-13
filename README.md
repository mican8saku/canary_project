# 🐦 Canary Project (Temporärt Namn) - Smart Fågelövervakning

Detta projekt är en smart övervakningsstation för en fågelbur, byggd på en **Raspberry Pi 4**. Systemet kombinerar sensorer för miljöövervakning, rörelsedetektion, reglering av ljusmängd med rullgardiner (styrda med stegmotorer) och RGB-ledstrip som är tänkt att simulera användning av en starkare UV lampa. Allt styrs och visas via ett webbgränssnitt byggt i **Flask**.

## 🚀 Funktioner
* **Temperatur & Luftfuktighet:** Mäts i realtid med en DHT11-sensor.
* **Rörelsedetektion:** En HC-SR501 PIR-sensor känner av när fågeln är aktiv.
* **Ljussensor:** TSL2591 (I2C) mäter exakt ljusstyrka i lux för att avgöra dag/natt.
* **RGB-belysning:** WS2812B (Neopixels) används för att simulera solljus tillförsel med UV-Lampa.
* **Automatiska rullgardiner:** Fyra stycken 28BYJ-48 stegmotorer med ULN2003-drivkort. Motorerna är parallellkopplade och styrs gemensamt från samma GPIO-pinnar.
* **Kamera:** Raspberry Pi Camera Module 3 används för att ta bilder och streama video.
* **Webbserver:** En Flask-applikation som samlar all data och möjliggör fjärrstyrning.

## 🛠 Hårdvarukonfiguration (Pinout)

| Komponent | Anslutning | GPIO-pinnar (BCM) |
| :--- | :--- | :--- |
| **DHT11** | Data | GPIO 26 |
| **HC-SR501 PIR** | Digital ut | GPIO 13 |
| **WS2812B LED** | Data | GPIO 12 |
| **TSL2591** | I2C SDA / SCL | GPIO 2 (SDA), GPIO 3 (SCL) |
| **Kamera Module 3** | CSI-port | – (ingen GPIO) |
| **Stegmotor 1–4 (28BYJ-48)** | ULN2003 IN1–IN4 (parallellkopplade) | GPIO 22, 27, 17, 4 |

Alla fyra stegmotorer delar samma styrpinnar (22, 27, 17, 4). De rör sig alltså synkront.

## 📦 Installation och Förberedelser

### 1. Klona projektet
```
git clone https://github.com/DITT_ANVÄNDARNAMN/canary_project.git
cd canary_project
```

### 2. Sätt upp den virtuella miljön (venv)
- **Mac / Linux / Raspberry Pi:**
```
python3 -m venv env --system-site-packages
source env/bin/activate
```
- **Windows (PowerShell):**
```
.\env\Scripts\activate
```
- **Windows (Git Bash / Command Prompt):**
```
source env/Scripts/activate
```

### 3. Installera dependencies
När miljön är aktiverad (du bör se (env) i terminalen), installera nödvändiga paket.

**På Raspberry Pi (för hårdvarustöd):**
```
pip install -r requirements.txt --break-system-packages
```

**På Mac/Windows/Linux (för lokal utveckling/mocking):**
```
pip install flask flask-cors
```

## 🏃‍♂️ Köra Projektet
Eftersom LED-strippen kräver DMA-rättigheter körs programmet med `sudo -E`:
```
sudo -E ./env/bin/python main.py
```

- Webbgränssnittet nås på: `http://<din-pi-ip>:5000`

- Lokalt via mocking på: `http://localhost:5000/`
