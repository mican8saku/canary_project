import os
import time
import subprocess # För att köra systemkommandon som libcamera
from flask import Flask, render_template, jsonify, send_from_directory

app = Flask(__name__)

# Definiera var bilderna ska sparas
# Vi lägger dem i static/gallery så att webbläsaren kan hitta dem sen
UPLOAD_FOLDER = os.path.join('static', 'gallery')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Skapa mappen automatiskt om den inte finns, annars kraschar rpicam-still
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Inställningar för galleri
IMAGE_FOLDER = 'static/gallery'
if not os.path.exists(IMAGE_FOLDER):
    os.makedirs(IMAGE_FOLDER)

# --- MOCKING & SETUP ---
try:
    import RPi.GPIO as GPIO
    import board
    import adafruit_dht
    import adafruit_tsl2591
    import neopixel
    import motor 
    
    IS_PI = True
    
    # 1. Grundinställningar för GPIO
    GPIO.setmode(GPIO.BCM)
    
    # 2. Definiera pinnar
    PIR_PIN = 6
    LED_PIN = 18
    
    # 3. Setup av pinnar (Här låg felet!)
    GPIO.setup(PIR_PIN, GPIO.IN)   # Berätta att pin 6 är en sensor (ingång)
    GPIO.setup(LED_PIN, GPIO.OUT)  # Berätta att pin 18 är en lampa (utgång)

    # 4. Initiera övrig hårdvara
    dht_device = adafruit_dht.DHT11(board.D25)
    i2c = board.I2C()
    tsl_sensor = adafruit_tsl2591.TSL2591(i2c)
    pixels = neopixel.NeoPixel(board.D12, 8, brightness=0.2, auto_write=False)
    motor.setup_motors()
    
    print("--- Running on Raspberry Pi ---")
except Exception as e:
    IS_PI = False
    print(f"--- Running on PC (Mock Mode) --- Error: {e}")

# --- KAMERAFUNKTION ---
def take_photo(filename):
    filepath = os.path.join(IMAGE_FOLDER, filename)
    
    if IS_PI:
        # På Pi 4 använder vi oftast 'libcamera-still'
        try:
            subprocess.run(['rpicam-still', 
                '-o', filepath, 
                '-t', '200', 
                '--nopreview',
                '--vflip', 
                '--hflip'], check=True)
            return True
        except Exception as e:
            print(f"Kamerafel: {e}")
            return False
    else:
        # På PC: Skapa en enkel textfil eller kopiera en dummy-bild
        with open(filepath, 'w') as f:
            f.write(f"Simulerad bild tagen vid {time.ctime()}")
        print(f"Mock-bild skapad: {filename}")
        return True

# --- ROUTES ---
@app.route('/')
def index():
    return render_template('index.html', status="System online")

# --- API ENDPOINTS (För framtida Lovable-app) ---
@app.route('/api/status')
def get_status():
    temp, hum = None, None
    lux = 0.0
    motion = False

    if IS_PI:
        try:
            lux = tsl_sensor.lux
        except:
            lux = 0.0
            
        motion = GPIO.input(6) == 1
            
        for _ in range(3):
            try:
                temp = dht_device.temperature
                hum = dht_device.humidity
                if temp is not None: break 
            except Exception:
                time.sleep(0.1)
                continue
    
    # Denna rad måste vara längst ut (ett steg in från 'def')
    return jsonify({
        "temperature": temp if temp is not None else "N/A",
        "humidity": hum if hum is not None else "N/A",
        "light": round(lux, 2) if lux else 0.0,
        "motion": motion,
        "is_pi": IS_PI,
        "timestamp": time.strftime("%H:%M:%S")
    })

# --- KONTROLL ROUTES ---
@app.route('/api/action/<cmd>')
def control(cmd):
    if not IS_PI: return jsonify({"msg": "PC Mode"})
    
    if cmd == "upp":
        motor.kor_gardin(2.8, -1)
        return jsonify({"msg": "Rullar upp"})
    elif cmd == "ner":
        motor.kor_gardin(2.8, 1)
        return jsonify({"msg": "Rullar ner"})
    elif cmd == "led_on":
        GPIO.output(LED_PIN, 1)
        return jsonify({"msg": "Lampa tänd"})
    elif cmd == "led_off":
        GPIO.output(LED_PIN, 0)
        return jsonify({"msg": "Lampa släckt"})
    return jsonify({"error": "Okänt"}), 400

@app.route('/api/camera/capture')
def capture_image():
    if not IS_PI:
        return jsonify({"status": "error", "message": "Inte på en Pi"})

    filename = f"capture_{int(time.time())}.jpg"
    # Se till att mappen static/gallery finns!
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    try:
        # Vi använder rpicam-still som fungerade i terminalen
        # -t 100 ger kameran 100ms att ställa in ljuset (snabbare än standard)
        # --nopreview gör att inget fönster poppar upp på Pien
        subprocess.run(['rpicam-still', '-o', filepath, '-t', '100', '--nopreview'], check=True)
        
        print(f"Bild sparad: {filepath}")
        return jsonify({
            "status": "success",
            "filename": filename,
            "url": f"/static/gallery/{filename}"
        })
    except subprocess.CalledProcessError as e:
        print(f"Kamerafel (process): {e}")
        return jsonify({"status": "error", "message": "Kameran svarade inte"})
    except Exception as e:
        print(f"Allmänt fel: {e}")
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/camera/gallery')
def get_gallery():
    # Listar alla filer i galleri-mappen, sorterade med nyaste först
    try:
        images = os.listdir(IMAGE_FOLDER)
        images.sort(reverse=True) 
        image_urls = [f"/static/gallery/{img}" for img in images if img.endswith(('.jpg', '.jpeg', '.png'))]
        return jsonify({"images": image_urls})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route för att servera de faktiska bildfilerna
@app.route('/static/gallery/<filename>')
def serve_image(filename):
    return send_from_directory(IMAGE_FOLDER, filename)

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    finally:
        if IS_PI:
            GPIO.cleanup()