import os
import io
import time
import schedule
from datetime import datetime, timedelta
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
light_state = False
last_motion_at = datetime.now(timezone.utc).isoformat()
MOTION_IDLE_THRESHOLD = 30 # Sekunder innan fågeln räknas som inaktiv

# --- AUTOMATIONS-SETTINGS ---
TID_UPP = "08:00"      # Senaste tid för morgonöppning
TID_NER = "17:30"      # Senaste tid för kvällsstängning
STILL_MINUTER = 5      # Inaktivitet innan stängning i kvällsfönstret
LUX_THRESHOLD = 30.0   # Gräns för när LED-strippen ska tändas

# Variabler för att hålla koll på tillstånd
last_motion_time = time.time()
auto_light_active = False

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
    import light
    
    IS_PI = True
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    
    PIR_PIN = 6
    LED_PIN = 18
    BUTTON_UP = 16
    BUTTON_DOWN = 20
    LEDSTRIP_BUTTON = 21
    
    GPIO.setup(PIR_PIN, GPIO.IN)
    GPIO.setup(LED_PIN, GPIO.OUT)
    GPIO.setup(LEDSTRIP_BUTTON, GPIO.OUT)
    GPIO.setup(BUTTON_UP, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(BUTTON_DOWN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(LEDSTRIP_BUTTON, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    dht_device = adafruit_dht.DHT11(board.D25)
    i2c = board.I2C()
    tsl_sensor = adafruit_tsl2591.TSL2591(i2c)
    motor.setup_motors()
    
    print("--- System Ready on Raspberry Pi ---")
except Exception as e:
    IS_PI = False
    print(f"--- Running on PC (Mock Mode) --- Error: {e}")

def move_curtain_gradually(target_percent):
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
    global curtain_state, is_moving, light_state
    print("Knapp-kontroll startad.")
    
    needs_saving = False 
    
    while True:
        if not IS_PI:
            time.sleep(0.5)
            continue

        # --- LJUSKONTROLL (Kolla denna först, den ska alltid gå att trycka på) ---
        if GPIO.input(LEDSTRIP_BUTTON) == GPIO.LOW:
            light_state = not light_state
            
            def run_light():
                light.set_light(light_state)
            
            threading.Thread(target=run_light).start()
            
            while GPIO.input(LEDSTRIP_BUTTON) == GPIO.LOW:
                time.sleep(0.1)

        # --- GARDINKONTROLL ---
        # Vi låter knapparna fungera även om is_moving är True (så man kan avbryta/justera)
        # men om du vill ha den helt låst under API-körning, behåll "if is_moving: continue"
        if is_moving:
            time.sleep(0.1)
            continue

        up_pressed = GPIO.input(BUTTON_UP) == GPIO.LOW
        down_pressed = GPIO.input(BUTTON_DOWN) == GPIO.LOW

        if up_pressed and curtain_state < 100:
            motor.kor_gardin(0.05, -1)
            curtain_state = min(100, curtain_state + 2)
            needs_saving = True
            
        elif down_pressed and curtain_state > 0:
            motor.kor_gardin(0.05, 1)
            curtain_state = max(0, curtain_state - 2)
            needs_saving = True
        
        else:
            if needs_saving:
                save_state()
                print(f"Position låst vid: {curtain_state}%")
                needs_saving = False
            
            time.sleep(0.05)

def automation_routine_thread():
    """Huvudrutin för fågelns biorytm: Gardiner (PIR + Tid) och Ljus (Lux + Tid)"""
    global last_motion_time, auto_light_active, curtain_state, is_moving
    
    if not IS_PI:
        print("Automation: Mock mode - thread exiting")
        return

    print(f"Automation: Biorythm active. Window: {TID_UPP} - {TID_NER}")

    # Schemalägg fasta tider som backup (använder dina gradvisa funktioner)
    schedule.every().day.at(TID_UPP).do(lambda: start_curtain_thread(100, "Fixed morning time"))
    schedule.every().day.at(TID_NER).do(lambda: start_curtain_thread(0, "Fixed evening time"))

    while True:
        try:
            nu = datetime.now()
            schedule.run_pending()

            # --- 1. BERÄKNA TIDSFÖNSTER ---
            # Skapa datetime-objekt för dagens tider
            upp_obj = datetime.strptime(TID_UPP, "%H:%M").replace(year=nu.year, month=nu.month, day=nu.day)
            ner_obj = datetime.strptime(TID_NER, "%H:%M").replace(year=nu.year, month=nu.month, day=nu.day)
            
            morgon_start = upp_obj - timedelta(hours=1)
            kvall_start = ner_obj - timedelta(hours=1)

            # Läs sensorer
            rorelse_detekterad = GPIO.input(PIR_PIN)
            lux = tsl_sensor.lux

            # --- 2. GARDIN-LOGIK (PIR-BASERAD) ---
            if not is_moving:
                # MORGON: Om rörelse detekteras 1h innan TID_UPP
                if morgon_start <= nu <= upp_obj and curtain_state < 100:
                    if rorelse_detekterad:
                        print("Automation: Morning motion! Bird is awake. Opening...")
                        start_curtain_thread(100, "Morning motion")

                # KVÄLL: Om fågeln är stilla i 5 min 1h innan TID_NER
                elif kvall_start <= nu <= ner_obj and curtain_state > 0:
                    if rorelse_detekterad:
                        last_motion_time = time.time() # Nollställ timer
                    
                    sekunder_stilla = time.time() - last_motion_time
                    if sekunder_stilla >= (STILL_MINUTER * 60):
                        print(f"Automation: Bird still for {STILL_MINUTER} min. Closing early...")
                        start_curtain_thread(0, "Evening stillness")

            # --- 3. LJUS-LOGIK (LUX + AKTIVT FÖNSTER) ---
            # Ljussensorn ska bara vara aktiv när gardinen "bör" vara uppe (fågelns dag)
            if upp_obj <= nu <= ner_obj:
                if lux < LUX_THRESHOLD and not auto_light_active:
                    print(f"Automation: Dark in cage ({lux:.2f} lux). Fading in light.")
                    light.set_light(True)
                    auto_light_active = True
                elif lux >= LUX_THRESHOLD and auto_light_active:
                    print(f"Automation: Sufficient light ({lux:.2f} lux). Fading out.")
                    light.set_light(False)
                    auto_light_active = False
            else:
                # Nattetid: Tvinga lampan att vara släckt
                if auto_light_active:
                    print("Automation: Night time, forcing light off.")
                    light.set_light(False)
                    auto_light_active = False

        except Exception as e:
            print(f"Automation loop error: {e}")
        
        time.sleep(0.5) # Snabbare loop för att fånga upp rörelse (PIR)

def start_curtain_thread(target, reason):
    """Hjälpfunktion för att starta gradvis flytt i en egen tråd"""
    global is_moving
    if not is_moving:
        print(f"Trigger: {reason} -> Moving to {target}%")
        threading.Thread(target=move_curtain_gradually, args=(target,), daemon=True).start()

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
    
    global last_motion_at
    if motion_now:
        from datetime import datetime
        last_motion_at = datetime.now().isoformat()

    return jsonify({
        "ok": True,
        "isPi": IS_PI,
        "deviceOnline": True,
        "stateFileExists": STATE_FILE.exists(),
        "temperature": 22.0,
        "curtainState": curtain_state, 
        "birdStatus": get_bird_status(motion_now),
        "lastMotionAt": last_motion_at,
        "light": round(lux, 2),
        "tempSensor": "ok" if IS_PI else "mock",
        "motorControl": "OK" if IS_PI else "mock",
        # --- NYA FÄLT HÄR ---
        "lightOn": light_state,
        "isMoving": is_moving
    })

@app.route('/curtain/open', methods=['POST'])
def curtain_open():
    if is_moving:
        return jsonify({"ok": False, "error": "Already moving"}), 400
    
    # Starta en engångs-tråd för denna specifika körning
    threading.Thread(target=move_curtain_gradually, args=(100,)).start()
    return jsonify({"ok": True, "curtainState": curtain_state})

@app.route('/curtain/close', methods=['POST'])
def curtain_close():
    if is_moving:
        return jsonify({"ok": False, "error": "Already moving"}), 400
    
    threading.Thread(target=move_curtain_gradually, args=(0,)).start()
    return jsonify({"ok": True, "curtainState": curtain_state})

@app.route('/light/toggle', methods=['POST'])
def light_toggle():
    global light_state
    light_state = not light_state
    
    # Kör faden i bakgrunden
    threading.Thread(target=light.set_light, args=(light_state,)).start()
    
    return jsonify({
        "ok": True, 
        "lightOn": light_state
    })

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
        t1 = threading.Thread(target=button_control_thread, daemon=True)
        t1.start()

        t2 = threading.Thread(target=automation_routine_thread, daemon=True)
        t2.start()

        # Körs på port 5000 för att matcha hans frontend-anrop
        app.run(host='0.0.0.0', port=5000, debug=False)
    finally:
        if IS_PI:
            GPIO.cleanup()