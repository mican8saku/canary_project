import os
import time
from flask import Flask, render_template, jsonify

app = Flask(__name__)

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

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    finally:
        if IS_PI:
            GPIO.cleanup()