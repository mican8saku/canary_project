import time
import board
import adafruit_dht
from flask import Flask, render_template_string

# Initiera DHT11 på GPIO 19
dht_device = adafruit_dht.DHT11(board.D25)

app = Flask(__name__)

# HTML-mall som visas i webbläsaren
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Sensorstation</title>
    <meta http-equiv="refresh" content="5"> <style>
        body { font-family: sans-serif; text-align: center; margin-top: 50px; }
        .data { font-size: 2em; color: #2c3e50; }
    </style>
</head>
<body>
    <h1>Klimat i rummet</h1>
    <div class="data">
        <p>Temperatur: {{ temp }} °C</p>
        <p>Luftfuktighet: {{ hum }} %</p>
    </div>
    <p>Sidan uppdateras automatiskt var 5:e sekund.</p>
</body>
</html>
"""

@app.route('/')
def index():
    try:
        # Läs av sensorn
        temperature = dht_device.temperature
        humidity = dht_device.humidity
        
        if humidity is not None and temperature is not None:
            return render_template_string(HTML_TEMPLATE, temp=temperature, hum=humidity)
        else:
            return "Kunde inte läsa data, försök igen."
            
    except RuntimeError as error:
        # DHT-sensorer är krångliga, vi returnerar förra försöket eller ett felmeddelande
        return f"Ett fel uppstod: {error.args[0]}"

if __name__ == '__main__':
    # Kör servern på din Raspberry Pis IP-adress
    app.run(host='0.0.0.0', port=5000)
