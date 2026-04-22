import os
import time
import json
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS

app = Flask(__name__)
# Krävs för att hans Base44-app ska kunna prata med din Pi
CORS(app, resources={r"/*": {"origins": "*"}})

# --- KONFIGURATION & FILER ---
UPLOAD_FOLDER = Path("static/gallery")
STATE_FILE = Path("state.json")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# --- APP STATE (Minne vid omstart) ---
curtain_state = 0  # 0 = stängd, 100 = öppen
last_motion_at = datetime.now(timezone.utc).isoformat()
MOTION_IDLE_THRESHOLD = 30 # Sekunder innan fågeln räknas som inaktiv

def save_state():
    try:
        with os.fdopen(os.open(STATE_FILE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), 'w') as f:
            json.dump({
                "curtainState": curtain_state,
                "lastMotionAt": last_motion_at
            }, f, indent=2)
    except Exception as e:
        print(f"Kunde inte spara state: {e}")

def load_state():
    global curtain_state, last_motion_at
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r") as f:
                data = json.load(f)
                curtain_state = data.get("curtainState", 0)
                last_motion_at = data.get("lastMotionAt", last_motion_at)
        except: pass

load_state()

# --- HÅRDVARA SETUP ---
try:
    import RPi.GPIO as GPIO
    import board
    import adafruit_dht
    import adafruit_tsl2591
    import motor 
    
    IS_PI = True
    GPIO.setmode(GPIO.BCM)
    
    PIR_PIN = 6
    LED_PIN = 18
    
    GPIO.setup(PIR_PIN, GPIO.IN)
    GPIO.setup(LED_PIN, GPIO.OUT)

    dht_device = adafruit_dht.DHT11(board.D25)
    i2c = board.I2C()
    tsl_sensor = adafruit_tsl2591.TSL2591(i2c)
    motor.setup_motors()
    
    print("--- System Ready on Raspberry Pi ---")
except Exception as e:
    IS_PI = False
    print(f"--- Running on PC (Mock Mode) --- Error: {e}")

# --- HJÄLPFUNKTIONER ---
def get_curtain_str():
    return "open" if curtain_state == 100 else "closed"

def get_bird_status(motion_now):
    global last_motion_at
    if motion_now:
        last_motion_at = datetime.now(timezone.utc).isoformat()
        save_state()
        return "active"
    
    last_motion = datetime.fromisoformat(last_motion_at)
    idle_time = (datetime.now(timezone.utc) - last_motion).total_seconds()
    return "active" if idle_time < MOTION_IDLE_THRESHOLD else "inactive"

# --- INTEGRATION ROUTES (För Base44 gränssnitt) ---

@app.route('/status', methods=['GET'])
def status():
    """Huvudstatus för appen"""
    lux = tsl_sensor.lux if IS_PI else 350.0
    motion_now = GPIO.input(PIR_PIN) == 1 if IS_PI else False
    
    # Mockad temperatur tills DHT11 är 100% stabil
    temp = 22.0 
    
    return jsonify({
        "ok": True,
        "data": {
            "deviceOnline": True,
            "isPi": IS_PI,
            "temperature": temp,
            "curtainState": get_curtain_str(),
            "birdStatus": get_bird_status(motion_now),
            "lastMotionAt": last_motion_at,
            "light": round(lux, 2)
        }
    })

@app.route('/curtain/open', methods=['POST'])
def curtain_open():
    global curtain_state
    if IS_PI:
        motor.kor_gardin(2.8, -1)
    curtain_state = 100
    save_state()
    return jsonify({"ok": True, "data": {"curtainState": "open"}})

@app.route('/curtain/close', methods=['POST'])
def curtain_close():
    global curtain_state
    if IS_PI:
        motor.kor_gardin(2.8, 1)
    curtain_state = 0
    save_state()
    return jsonify({"ok": True, "data": {"curtainState": "closed"}})

@app.route('/camera/snapshot', methods=['GET'])
def camera_snapshot():
    """Tar en bild och skickar direkt till appen"""
    filename = "snapshot.jpg"
    filepath = UPLOAD_FOLDER / filename
    
    if IS_PI:
        try:
            # Använder rpicam-still (standard för Camera Module 3)
            subprocess.run(['rpicam-still', '-o', str(filepath), '-t', '500', '--nopreview'], check=True)
            return send_file(filepath, mimetype='image/jpeg')
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 500
    
    # Om vi är på PC, skicka en placeholder
    return jsonify({"ok": True, "mock_url": "https://placehold.co/600x400?text=Kamera+Mock"})

@app.route('/led', methods=['POST'])
def control_led():
    """Tänder/släcker lampan baserat på JSON-data: {"on": true/false}"""
    data = request.get_json()
    turn_on = data.get('on', False)
    
    if IS_PI:
        GPIO.output(LED_PIN, 1 if turn_on else 0)
    
    return jsonify({"ok": True, "led_on": turn_on})

# --- STARTA SERVER ---
if __name__ == '__main__':
    try:
        # Körs på port 5000 för att matcha hans frontend-anrop
        app.run(host='0.0.0.0', port=5000, debug=True)
    finally:
        if IS_PI:
            GPIO.cleanup()