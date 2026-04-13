from flask import Flask, render_template
import RPi.GPIO as GPIO
import motor  # Importerar din motor.py

app = Flask(__name__)

# --- INSTÄLLNINGAR ---
LED_PIN = 18  # Ändra till 12 om du flyttat lampan dit

# --- SETUP ---
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(LED_PIN, GPIO.OUT)
motor.setup_motors() # Initierar motor-pinnarna från din andra fil

@app.route('/')
def index():
    return render_template('index.html', status="Redo")

# --- MOTOR ROUTES ---
@app.route('/ner')
def ner():
    motor.kor_gardin(2.8, 1)
    return render_template('index.html', status="Rullade ner")

@app.route('/upp')
def upp():
    motor.kor_gardin(2.8, -1)
    return render_template('index.html', status="Rullade upp")

# --- LED ROUTES ---
@app.route('/on')
def led_on():
    GPIO.output(LED_PIN, GPIO.HIGH)
    return render_template('index.html', status="Lampa tänd")

@app.route('/off')
def led_off():
    GPIO.output(LED_PIN, GPIO.LOW)
    return render_template('index.html', status="Lampa släckt")

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000)
    finally:
        GPIO.cleanup()