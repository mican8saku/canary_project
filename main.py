import os
import time
import subprocess # För att köra systemkommandon som libcamera
from flask import Flask, render_template, jsonify, send_from_directory

app = Flask(__name__)

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
    import motor  # Kräver att motor.py finns i samma mapp
    
    IS_PI = True
    # Initiera hårdvara
    dht_device = adafruit_dht.DHT11(board.D26)
    i2c = board.I2C()
    tsl_sensor = adafruit_tsl2591.TSL2591(i2c)
    pixels = neopixel.NeoPixel(board.D12, 8, brightness=0.2, auto_write=False)
    motor.setup_motors()
    
    LED_PIN = 18
    GPIO.setup(LED_PIN, GPIO.OUT)
    print("--- Running on Raspberry Pi ---")
except (ImportError, RuntimeError):
    IS_PI = False
    print("--- Running on PC (Mock Mode) ---")

# --- KAMERAFUNKTION ---
def take_photo(filename):
    filepath = os.path.join(IMAGE_FOLDER, filename)
    
    if IS_PI:
        # På Pi 4 använder vi oftast 'libcamera-still'
        try:
            subprocess.run(['libcamera-still', '-o', filepath, '--immediate'], check=True)
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
    if IS_PI:
        try:
            temp = dht_device.temperature
            hum = dht_device.humidity
            lux = tsl_sensor.lux
        except:
            temp, hum, lux = 0, 0, 0
    else:
        temp, hum, lux = 22.0, 40, 550.0 # Fake data
        
    return jsonify({
        "temperature": temp,
        "humidity": hum,
        "light": lux,
        "is_pi": IS_PI
    })

# --- KONTROLL ROUTES ---
@app.route('/action/<cmd>')
def control(cmd):
    if cmd == "upp":
        if IS_PI: motor.kor_gardin(2.8, -1)
        return jsonify({"msg": "Rullar upp"})
    elif cmd == "ner":
        if IS_PI: motor.kor_gardin(2.8, 1)
        return jsonify({"msg": "Rullar ner"})
    elif cmd == "led_on":
        if IS_PI: GPIO.output(LED_PIN, 1)
        return jsonify({"msg": "Lampa tänd"})
    elif cmd == "led_off":
        if IS_PI: GPIO.output(LED_PIN, 0)
        return jsonify({"msg": "Lampa släckt"})
    return jsonify({"error": "Okänt kommando"}), 400

@app.route('/api/camera/capture')
def capture():
    filename = f"photo_{int(time.time())}.jpg"
    success = take_photo(filename)
    
    if success:
        return jsonify({
            "status": "success",
            "filename": filename,
            "url": f"/static/gallery/{filename}"
        })
    else:
        return jsonify({"status": "error", "message": "Kunde inte ta bild"}), 500

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