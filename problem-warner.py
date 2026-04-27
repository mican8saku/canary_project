import time
import subprocess
from pathlib import Path
from datetime import datetime
import RPi.GPIO as GPIO

# --- KONFIGURATION ---
PIR_PIN = 14
PHOTO_THRESHOLD = 3600  # 1 timme i sekunder
# Vi använder samma mappstruktur som Flask-appen
UPLOAD_FOLDER = Path("static/gallery")
ALERTS_FOLDER = UPLOAD_FOLDER / "alerts"
ALERTS_FOLDER.mkdir(parents=True, exist_ok=True)

# Tider då övervakningen ska vara aktiv
AKTIV_FRAN = "13:42"
AKTIV_TILL = "21:30"

# --- SETUP ---
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(PIR_PIN, GPIO.IN)

def is_daytime():
    """Kollar om klockan är mellan de valda tiderna."""
    nu = datetime.now().time()
    try:
        start = datetime.strptime(AKTIV_FRAN, "%H:%M").time()
        stopp = datetime.strptime(AKTIV_TILL, "%H:%M").time()
        return start <= nu <= stopp
    except ValueError:
        return False

def camera_snapshot():
    """Tar en bild vid inaktivitet - matchar Flask-appens funktion"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    # Sparar i alerts-mappen med unikt namn
    filename = f"bird_still_{timestamp}.jpg"
    filepath = ALERTS_FOLDER / filename
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Inaktivitet upptäckt. Tar bild...")
    
    if True: # Simulerar IS_PI check
        try:
            # Använder samma kommando som i Flask-appen
            subprocess.run([
                'rpicam-still', 
                '-o', str(filepath), 
                '-t', '500', 
                '--nopreview'
            ], check=True)
            print(f"Bild sparad: {filepath}")
            return True
        except Exception as e:
            print(f"Kamerafel: {e}")
            return False

# --- HUVUDLOOP ---
last_motion_time = time.time()
alert_triggered = False

print(f"--- Övervakning Startad ---")
print(f"Aktiv fönster: {AKTIV_FRAN} - {AKTIV_TILL}")
print(f"Tröskel: {PHOTO_THRESHOLD/60} minuter stillhet")

try:
    while True:
        # 1. Kolla om vi är inom dagtid-fönstret
        if is_daytime():
            
            # 2. Kolla rörelse via PIR
            if GPIO.input(PIR_PIN):
                last_motion_time = time.time()
                # Om vi ser rörelse återställer vi triggern så en ny bild kan tas efter nästa timme
                if alert_triggered:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Rörelse upptäckt! Återställer timer.")
                    alert_triggered = False 
            
            # 3. Beräkna hur länge det varit stilla
            idle_time = time.time() - last_motion_time
            
            # 4. Om stilla > 1h och vi inte redan tagit en bild för denna period
            if idle_time >= PHOTO_THRESHOLD and not alert_triggered:
                success = camera_snapshot()
                if success:
                    alert_triggered = True 
        else:
            # Under natten/utanför fönstret:
            # Vi håller timern uppdaterad så den börjar räkna prick vid AKTIV_FRAN
            last_motion_time = time.time()
            alert_triggered = False

        time.sleep(1) # Paus för att inte stressa CPU:n

except KeyboardInterrupt:
    print("\nAvslutat av användaren.")
finally:
    GPIO.cleanup()