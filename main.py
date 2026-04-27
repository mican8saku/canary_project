import os
import io
import time
import json
import subprocess
import threading
from pathlib import Path
from datetime import datetime, timezone
from flask import Flask, jsonify, send_file, request, Response
from flask_cors import CORS
from pathlib import Path
BASE_DIR = Path(__file__).parent.absolute()
STATE_FILE = BASE_DIR / "state.json"

app = Flask(__name__)
# Krävs för att hans Base44-app ska kunna prata med din Pi
CORS(app, resources={r"/*": {"origins": "*"}})

# --- KONFIGURATION & FILER ---
UPLOAD_FOLDER = Path("static/gallery")
STATE_FILE = Path("state.json")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# --- APP STATE (Minne vid omstart) ---
curtain_state = 0  # 0 = stängd, 100 = öppen
is_moving = False
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
        except Exception as e:
            print(f"Error loading state: {e}")

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
    GPIO.setwarnings(False)
    
    PIR_PIN = 6
    LED_PIN = 18
    BUTTON_UP = 16
    BUTTON_DOWN = 20
    
    GPIO.setup(PIR_PIN, GPIO.IN)
    GPIO.setup(LED_PIN, GPIO.OUT)
    GPIO.setup(BUTTON_UP, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(BUTTON_DOWN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    dht_device = adafruit_dht.DHT11(board.D25)
    i2c = board.I2C()
    tsl_sensor = adafruit_tsl2591.TSL2591(i2c)
    motor.setup_motors()
    
    print("--- System Ready on Raspberry Pi ---")
except Exception as e:
    IS_PI = False
    print(f"--- Running on PC (Mock Mode) --- Error: {e}")

def flytta_gardin_gradvis(target_percent):
    global curtain_state, is_moving
    is_moving = True
    
    # Bestäm riktning baserat på din motor-logik
    # Om vi ska till 100% (öppna), kör riktning -1
    direction = -1 if target_percent > curtain_state else 1
    
    try:
        while curtain_state != target_percent:
            # Om någon fysisk knapp trycks in kan vi välja att avbryta här
            # men vi börjar med att köra 5% steg
            diff = abs(target_percent - curtain_state)
            step = min(5, diff)
            
            varv = (2.8 / 100) * step
            if IS_PI:
                motor.kor_gardin(varv, direction)
            
            if direction == -1:
                curtain_state = min(100, curtain_state + step)
            else:
                curtain_state = max(0, curtain_state - step)
            
            save_state()
            print(f"API Flytt: {curtain_state}%")
    finally:
        is_moving = False

def button_control_thread():
    global curtain_state, is_moving
    print("Knapp-kontroll startad (Mjuk med stopp-skydd).")
    
    needs_saving = False 
    
    while True:
        if not IS_PI or is_moving:
            time.sleep(0.1)
            continue
            
        up_pressed = GPIO.input(BUTTON_UP) == GPIO.LOW
        down_pressed = GPIO.input(BUTTON_DOWN) == GPIO.LOW

        if up_pressed and curtain_state < 100:
            # Vi kör 0.05 varv (~1.8%)
            motor.kor_gardin(0.05, -1)
            # Vi ökar med 2% men ser till att aldrig gå över 100
            curtain_state = min(100, curtain_state + 2)
            needs_saving = True
            
        elif down_pressed and curtain_state > 0:
            motor.kor_gardin(0.05, 1)
            # Vi minskar med 2% men ser till att aldrig gå under 0
            curtain_state = max(0, curtain_state - 2)
            needs_saving = True
        
        else:
            if needs_saving:
                save_state()
                print(f"Position låst vid: {curtain_state}%")
                needs_saving = False
            
            # Lite längre vila här (0.05) för att ge processorn andrum 
            # och undvika att den "dubbel-läser" precis i slutet
            time.sleep(0.05)

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
    """Huvudstatus som servar både Dashboard och Diagnostics"""
    lux = tsl_sensor.lux if IS_PI else 350.0
    motion_now = GPIO.input(PIR_PIN) == 1 if IS_PI else False
    
    # Uppdatera last_motion_at om vi ser en fågel nu
    global last_motion_at
    if motion_now:
        from datetime import datetime
        last_motion_at = datetime.now().isoformat()

    # Denna JSON matchar nu både Diagnostics-vyn och Dashboarden
    return jsonify({
        "ok": True,
        "isPi": IS_PI,
        "deviceOnline": True,
        "stateFileExists": STATE_FILE.exists(),
        "temperature": 22.0,
        "curtainState": curtain_state,  # Skicka siffran (t.ex. 100) istället för "open"
        "birdStatus": get_bird_status(motion_now),
        "lastMotionAt": last_motion_at,
        "light": round(lux, 2),
        "tempSensor": "ok" if IS_PI else "mock",
        "motorControl": "OK" if IS_PI else "mock"
    })

@app.route('/curtain/open', methods=['POST'])
def curtain_open():
    if is_moving:
        return jsonify({"ok": False, "error": "Already moving"}), 400
    
    # Starta en engångs-tråd för denna specifika körning
    threading.Thread(target=flytta_gardin_gradvis, args=(100,)).start()
    return jsonify({"ok": True, "curtainState": curtain_state})

@app.route('/curtain/close', methods=['POST'])
def curtain_close():
    if is_moving:
        return jsonify({"ok": False, "error": "Already moving"}), 400
    
    threading.Thread(target=flytta_gardin_gradvis, args=(0,)).start()
    return jsonify({"ok": True, "curtainState": curtain_state})

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

def generate_frames():
    """Generator som strömmar video med tydligare bild-gränser"""
    if not IS_PI:
        while True:
            time.sleep(0.5)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + b'FAKE_DATA' + b'\r\n')
        return

    # Vi använder -n för att slippa preview-fönstret på Pi:n
    cmd = [
        'rpicam-vid',
        '-t', '0',
        '--inline',
        '--width', '640',
        '--height', '480',
        '--framerate', '15',
        '--codec', 'mjpeg',
        '-n', 
        '-o', '-'
    ]
    
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=0)
    
    try:
        # MJPEG skickar bilder som börjar med 0xff 0xd8 och slutar med 0xff 0xd9
        # Vi läser dataströmmen och letar efter dessa markörer
        buffer = b""
        while True:
            chunk = process.stdout.read(4096)
            if not chunk:
                break
            buffer += chunk
            
            # Leta efter start och slut på en JPEG-bild
            start = buffer.find(b'\xff\xd8')
            end = buffer.find(b'\xff\xd9')
            
            if start != -1 and end != -1 and end > start:
                jpg = buffer[start:end+2]
                buffer = buffer[end+2:]
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + jpg + b'\r\n')
    finally:
        process.terminate()

@app.route('/camera/stream')
def camera_stream():
    """Video stream route"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# --- STARTA SERVER ---
if __name__ == '__main__':
    try:

        # Starta tråden som "daemon" så den dör när huvudprogrammet dör
        t = threading.Thread(target=button_control_thread, daemon=True)
        t.start()

        # Körs på port 5000 för att matcha hans frontend-anrop
        app.run(host='0.0.0.0', port=5000, debug=False)
    finally:
        if IS_PI:
            GPIO.cleanup()