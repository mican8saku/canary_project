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
from flask import Flask, jsonify, send_file, request, Response, send_from_directory
from flask_cors import CORS

BASE_DIR = Path(__file__).parent.absolute()
STATE_FILE = BASE_DIR / "state.json"
HISTORY_FILE = BASE_DIR / "sensor_history.json"

app = Flask(__name__)
# Krävs för att Webbapp ska kunna prata med Pien
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# --- KONFIGURATION & FILER ---
UPLOAD_FOLDER = Path("static/gallery")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# --- APP STATE (Minne vid omstart) ---
curtain_state = 0  # 0 = stängd, 100 = öppen
is_moving = False
light_state = False
last_motion_at = datetime.now(timezone.utc).isoformat()
MOTION_IDLE_THRESHOLD = 30 # Sekunder innan fågeln räknas som inaktiv
camera_process = None

# --- AUTOMATIONS-INSTÄLLNINGAR (Default-värden) ---
auto_settings = {
    "led_routine_active": True,       # Övergripande LED-automation
    "curtain_routine_active": True,   # Övergripande gardin-automation
    "use_pir_adjustment": True,       # Specifikt PIR-fönstret (1h innan)
    "window_hours": 1,                # Hur långt innan PIR ska börja vaktas
    "lux_threshold": 30.0,            # LUX värde borderline för att sätta igång ljus
    "still_minutes": 5,                # Hur länge PIR 
    "time_up": "08:00",         
    "time_down": "21:30"    
}

# Variabler för att hålla koll på tillstånd
last_motion_time = time.time()
auto_light_active = False
manual_override_until = 0  # Timestamp för när automationen får starta igen

latest_sensor_data = {
    "temp": 22.2,
    "lux": 0.0,
    "last_updated": None
}

# --- GLOBAL HISTORIK FÖR GRAFER ---
sensor_history = {
    "temperature": [],
    "light": [],
    "pir": []
}
MAX_POINTS = 1440  # Sparar t.ex. de senaste 2 timmarna om du mäter var 5:e minut

def save_state():
    try:
        data = {
            "curtainState": curtain_state,
            "lastMotionAt": last_motion_at,
            "autoSettings": auto_settings  # Spara även inställningarna
        }
        with open(STATE_FILE, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Save error: {e}")

def load_state():
    global curtain_state, last_motion_at, auto_settings
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r") as f:
                data = json.load(f)
                curtain_state = data.get("curtainState", 0)
                last_motion_at = data.get("lastMotionAt", last_motion_at)
                # Läs in sparade inställningar om de finns
                if "autoSettings" in data:
                    auto_settings.update(data["autoSettings"])
        except Exception as e:
            print(f"Load error: {e}")

load_state()

def save_history():
    try:
        with open(HISTORY_FILE, 'w') as f:
            json.dump(sensor_history, f)
    except Exception as e:
        print(f"Error saving history: {e}")

def load_history():
    global sensor_history
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, 'r') as f:
                data = json.load(f)
                # Säkerställ att alla nycklar finns
                for key in ["temperature", "light", "pir"]:
                    if key in data:
                        sensor_history[key] = data[key]
            print("History loaded from disk.")
        except Exception as e:
            print(f"Error loading history: {e}")

# Kalla på denna i början av programmet (t.ex. efter load_state())
load_history()

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
    
    PIR_PIN = 14
    LED_PIN = 13
    BUTTON_UP = 16
    BUTTON_DOWN = 20
    LEDSTRIP_BUTTON = 21
    
    GPIO.setup(PIR_PIN, GPIO.IN)
    GPIO.setup(LED_PIN, GPIO.OUT)
    GPIO.setup(BUTTON_UP, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(BUTTON_DOWN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(LEDSTRIP_BUTTON, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    dht_device = adafruit_dht.DHT11(board.D26)
    i2c = board.I2C()
    tsl_sensor = adafruit_tsl2591.TSL2591(i2c)
    motor.setup_motors()
    
    print("--- System Ready on Raspberry Pi ---")
except Exception as e:
    IS_PI = False
    print(f"--- Running on PC (Mock Mode) --- Error: {e}")

# --- STYRNING AV RULLGARDIN ---

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

# --- TRÅDAR ---

def button_control_thread():
    global curtain_state, is_moving, light_state, manual_override_until
    print("Knapp-kontroll startad.")
    
    needs_saving = False 
    
    while True:
        if not IS_PI:
            time.sleep(0.5)
            continue

        # --- LJUSKONTROLL ---
        if GPIO.input(LEDSTRIP_BUTTON) == GPIO.LOW:
            light_state = not light_state
            
            def run_light():
                light.set_light(light_state)
            
            threading.Thread(target=run_light).start()
            
            while GPIO.input(LEDSTRIP_BUTTON) == GPIO.LOW:
                time.sleep(0.1)

        # --- GARDINKONTROLL ---
        if is_moving:
            time.sleep(0.1)
            continue

        up_pressed = GPIO.input(BUTTON_UP) == GPIO.LOW
        down_pressed = GPIO.input(BUTTON_DOWN) == GPIO.LOW

        if up_pressed and curtain_state < 100:
            motor.kor_gardin(0.05, -1)
            curtain_state = min(100, curtain_state + 2)
            needs_saving = True
            manual_override_until = time.time() + (1 * 60)
            
        elif down_pressed and curtain_state > 0:
            motor.kor_gardin(0.05, 1)
            curtain_state = max(0, curtain_state - 2)
            needs_saving = True
            manual_override_until = time.time() + (1 * 60)
        
        else:
            if needs_saving:
                save_state()
                print(f"Position låst vid: {curtain_state}%")
                needs_saving = False
            
            time.sleep(0.05)

def automation_routine_thread():
    global last_motion_time, auto_light_active, curtain_state, is_moving, manual_override_until
    
    if not IS_PI: return

    while True:
        try:
            # 1. Hämta senaste datan från history_collector (som körs 2 ggr/sek)
            motion_now = latest_sensor_data.get("motion_now", False)
            current_lux = latest_sensor_data.get("lux", 350.0)
            
            current_time_ts = time.time()
            nu = datetime.now()
            
            # Uppdatera rörelsetid oavsett override
            if motion_now:
                last_motion_time = current_time_ts
                GPIO.output(LED_PIN, GPIO.HIGH)
            else:
                GPIO.output(LED_PIN, GPIO.LOW)
            
            # 2. CHECK: MANUAL OVERRIDE (Här räcker det med 1 min som du sätter i API:et)
            if current_time_ts < manual_override_until:
                time.sleep(1) 
                continue
            
            # --- TIDSBERÄKNING ---
            upp_obj = datetime.strptime(auto_settings["time_up"], "%H:%M").replace(
                year=nu.year, month=nu.month, day=nu.day)
            ner_obj = datetime.strptime(auto_settings["time_down"], "%H:%M").replace(
                year=nu.year, month=nu.month, day=nu.day)
            
            morgon_start = upp_obj - timedelta(hours=auto_settings["window_hours"])
            kvall_start = ner_obj - timedelta(hours=auto_settings["window_hours"])

            # --- GARDIN AUTOMATION ---
            if auto_settings["curtain_routine_active"] and not is_moving:
                # Använd motion_now variabeln vi redan har istället för ny GPIO-läsning
                
                # 1. DJUP NATT
                if nu >= ner_obj or nu < morgon_start:
                    if curtain_state > 0:
                        start_curtain_thread(0, "Night-time: Strict close")

                # 2. MORGON-FÖNSTER
                elif morgon_start <= nu < upp_obj:
                    if motion_now and curtain_state < 100:
                        start_curtain_thread(100, "Morning: Bird is awake")

                # 3. STANDARD DAGTID
                elif upp_obj <= nu < kvall_start:
                    if curtain_state < 100:
                        start_curtain_thread(100, "Daytime: Open")

                # 4. KVÄLLS-FÖNSTER
                elif kvall_start <= nu < ner_obj:
                    idle_seconds = current_time_ts - last_motion_time
                    if idle_seconds >= (auto_settings["still_minutes"] * 60):
                        if curtain_state > 0:
                            start_curtain_thread(0, "Evening: Bird is sleeping")

            # --- LED AUTOMATION ---
            if auto_settings["led_routine_active"]:
                if upp_obj <= nu < ner_obj:
                    if curtain_state > 50:
                        if current_lux < auto_settings["lux_threshold"] and not auto_light_active:
                            light.set_light(True)
                            auto_light_active = True
                        elif current_lux >= auto_settings["lux_threshold"] and auto_light_active:
                            light.set_light(False)
                            auto_light_active = False
                    else:
                        if auto_light_active:
                            light.set_light(False)
                            auto_light_active = False
                else:
                    if auto_light_active:
                        light.set_light(False)
                        auto_light_active = False

        except Exception as e:
            print(f"Automation error: {e}")
        
        time.sleep(1)

def start_curtain_thread(target, reason):
    """Hjälpfunktion för att starta gradvis flytt i en egen tråd"""
    global is_moving
    if not is_moving:
        print(f"Trigger: {reason} -> Moving to {target}%")
        threading.Thread(target=move_curtain_gradually, args=(target,), daemon=True).start()

def history_collector_thread():
    global sensor_history, latest_sensor_data, last_motion_at
    print("Starting History Collector & Sensor Monitor...")
    
    motion_accumulator = 0
    loop_count = 0

    while True: 
        try:
            # --- 1. LÄS SENSORER (Varje sekund) --
            current_temp = latest_sensor_data["temp"] # Behåll gammalt värde som fallback
            current_lux = 350.0
            motion_now = False

            if IS_PI:
                # Läs Ljus
                try:
                    current_lux = round(tsl_sensor.lux, 1)
                except: pass

                # Läs Rörelse
                motion_now = (GPIO.input(PIR_PIN) == 1)
                if motion_now:
                    last_motion_at = datetime.now().isoformat()
                    motion_accumulator += 1 # För compounding-grafen

                # Läs Temperatur (DHT11 är petig, läs var 10:e sek är lagom)
                try:
                    t = dht_device.temperature
                    if t is not None:
                        current_temp = t
                except:
                    pass # Behåll senaste lyckade läsningen
            else:
                # Mock-data för testmiljö
                current_lux = 350.0
                motion_now = False

            # Uppdatera globala variabler för blixtsnabb /status
            latest_sensor_data["temp"] = current_temp
            latest_sensor_data["lux"] = current_lux
            latest_sensor_data["motion_now"] = motion_now
            latest_sensor_data["last_updated"] = datetime.now().strftime("%H:%M:%S")

            # --- 2. LOGGA TILL HISTORIK (Varje minut: loop_count 6 * 10s) ---
            loop_count += 1
            if loop_count >= 120:
                timestamp = datetime.now().strftime("%H:%M")

                # Spara till minnet
                sensor_history["temperature"].append({"time": timestamp, "value": current_temp})
                sensor_history["light"].append({"time": timestamp, "value": current_lux})
                sensor_history["pir"].append({"time": timestamp, "value": motion_accumulator})

                # Håll 24h historik (1440 punkter)
                for key in sensor_history:
                    if len(sensor_history[key]) > 1440:
                        sensor_history[key].pop(0)

                # Spara till fil (sensor_history.json)
                save_history()

                # Nollställ för nästa minut
                motion_accumulator = 0
                loop_count = 0

        except Exception as e:
            print(f"Critical error in history thread: {e}")

        time.sleep(0.5)

# --- HJÄLPFUNKTIONER ---
def get_curtain_str():
    return "open" if curtain_state == 100 else "closed"

def get_bird_status(motion_now):
    global last_motion_at
    # Skapa nuvarande tid med UTC-aware objekt
    now = datetime.now(timezone.utc)
    
    if motion_now:
        last_motion_at = now.isoformat()
        save_state()
        return "active"
    
    # Gör om den sparade strängen till ett objekt
    last_motion = datetime.fromisoformat(last_motion_at)
    
    # VIKTIGT: Om det sparade objektet saknar tidszon, lägg till UTC
    if last_motion.tzinfo is None:
        last_motion = last_motion.replace(tzinfo=timezone.utc)
    
    # Nu kan vi subtrahera dem utan krasch
    idle_time = (now - last_motion).total_seconds()
    
    return "active" if idle_time < MOTION_IDLE_THRESHOLD else "inactive"

# --- INTEGRATION ROUTES (För Webbapp gränssnitt) ---

@app.route('/api/sensors', methods=['GET'])
def get_sensor_history():
    """Returnerar insamlad historik till DataPage"""
    return jsonify(sensor_history)

@app.route('/status', methods=['GET'])
def status():
    global last_motion_at
    
    # Beräkna override-tid för säkerhets skull
    time_left_override = max(0, int(manual_override_until - time.time()))
    
    return jsonify({
        "ok": True,
        "isPi": IS_PI,
        "deviceOnline": True,
        "stateFileExists": STATE_FILE.exists(),
        "temperature": latest_sensor_data["temp"],  # Från tråden
        "curtainState": curtain_state, 
        "birdStatus": get_bird_status(latest_sensor_data["motion_now"]),
        "lastMotionAt": last_motion_at,
        "light": latest_sensor_data["lux"],        # Från tråden
        "tempSensor": "ok" if IS_PI else "mock",
        "motorControl": "OK" if IS_PI else "mock",
        "lightOn": light_state,
        "isMoving": is_moving,
        "manual_override": time_left_override > 0,
        "lastUpdate": latest_sensor_data["last_updated"]
    })

@app.route('/settings/automation', methods=['POST', 'GET'])
def update_automation_settings():
    global auto_settings
    if request.method == 'POST':
        new_data = request.get_json()
        # Uppdatera bara de fält som skickas in
        auto_settings.update(new_data)
        save_state()
        return jsonify({"ok": True, "settings": auto_settings})
    
    # Om GET, returnera nuvarande inställningar
    return jsonify({"ok": True, "settings": auto_settings})

@app.route('/curtain/open', methods=['POST'])
def curtain_open():
    global manual_override_until
    if is_moving:
        return jsonify({"ok": False, "error": "Already moving"}), 400
    
    manual_override_until = time.time() + (1 * 60)
    # Starta en engångs-tråd för denna specifika körning
    threading.Thread(target=move_curtain_gradually, args=(100,)).start()
    return jsonify({"ok": True, "curtainState": curtain_state})

@app.route('/curtain/close', methods=['POST'])
def curtain_close():
    global manual_override_until
    if is_moving:
        return jsonify({"ok": False, "error": "Already moving"}), 400

    manual_override_until = time.time() + (1 * 60)
    
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
    global camera_process
    filename = f"capture_{int(time.time())}.jpg"
    filepath = UPLOAD_FOLDER / filename
    
    try:
        # 1. Stoppa stream-processen om den körs
        # Detta frigör kamerahårdvaran (imx708)
        subprocess.run(['pkill', 'rpicam-vid'], check=False)
        time.sleep(0.5) # Ge hårdvaran ett ögonblick att släppa taget

        # 2. Ta bilden
        print(f"Tar snapshot: {filename}")
        subprocess.run([
            'rpicam-still', 
            '-o', str(filepath), 
            '-t', '1000', 
            '--width', '1536',  # Snapshots kan vara högupplösta
            '--height', '2048', # Matchar 3:4 formatet stående
            '--vflip', '1',
            '--hflip', '1',
            '--nopreview',
            '--immediate'
        ], check=True)

        # 3. Starta om stream-processen i bakgrunden (valfritt om din stream-loop gör det själv)
        # Om din stream sköts via en route, kommer den starta om vid nästa request.
        
        return jsonify({
            "ok": True, 
            "filename": filename,
            "url": f"/static/gallery/{filename}"
        })

    except subprocess.CalledProcessError as e:
        print(f"Kamera-fel: {e}")
        return jsonify({"ok": False, "error": "Kameran upptagen"}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route('/api/gallery', methods=['GET'])
def get_gallery():
    """Returnerar en lista på alla sparade bilder i galleriet"""
    try:
        # Lista alla .jpg och .png filer i mappen
        images = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith(('.jpg', '.jpeg', '.png'))]
        # Sortera så nyaste bilderna kommer först (baserat på filnamn eller datum)
        images.sort(reverse=True)
        return jsonify({"ok": True, "images": images})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

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
        '--width', '480',
        '--height', '640',
        '--vflip', '1',
        '--hflip', '1',
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
    
# --- Default route om filen inte hittas (Catch All)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # Kolla om filen faktiskt finns i din build-mapp (t.ex. bilder eller css)
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        # Annars skicka index.html så att React Router kan ta över
        return send_from_directory(app.static_folder, 'index.html')



# --- STARTA SERVER ---
if __name__ == '__main__':
    try:

        # Starta tråden som "daemon" så den dör när huvudprogrammet dör
        # Tråd för knappar
        t1 = threading.Thread(target=button_control_thread, daemon=True)
        t1.start()

        # Tråd för automatiska rutiner
        t2 = threading.Thread(target=automation_routine_thread, daemon=True)
        t2.start()

        # Tråd för data insamling och visualisering i grafer 
        t3 = threading.Thread(target=history_collector_thread, daemon=True)
        t3.start()

        # Körs på port 5000 för att matcha hans frontend-anrop
        app.run(host='0.0.0.0', port=5000, debug=False)
    finally:
        if IS_PI:
            GPIO.cleanup()
