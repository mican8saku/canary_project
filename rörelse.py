import time
import schedule
import motor
import RPi.GPIO as GPIO
from datetime import datetime, timedelta

# --- KONFIGURATION ---
TID_UPP = "13:42"
TID_NER = "21:30"  # Senaste tid gardinen dras ner (om fågeln inte varit stilla)
KORTID = 2.8 

PIR_PIN = 6  # Din pin för rörelsesensorn
STILL_MINUTER = 5 # Hur länge fågeln ska vara stilla (0 aktivitet)

# --- SETUP GPIO ---
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN)

# --- VARIABLER FÖR LOGIK ---
last_motion_time = time.time()
gardin_nere_idag = False

def gardin_upp():
    global gardin_nere_idag
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Kör gardin UPP...")
    motor.setup_motors()
    motor.kor_gardin(KORTID, -1)
    gardin_nere_idag = False

def gardin_ner():
    global gardin_nere_idag
    if not gardin_nere_idag:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Kör gardin NER...")
        motor.setup_motors()
        motor.kor_gardin(KORTID, 1)
        gardin_nere_idag = True

# Schemalägg morgonen och den fasta kvällstiden (som backup)
schedule.every().day.at(TID_UPP).do(gardin_upp)
schedule.every().day.at(TID_NER).do(gardin_ner)

print(f"System startat! UPP: {TID_UPP}, Senast NER: {TID_NER}")

try:
    while True:
        schedule.run_pending()
        
        nu = datetime.now()
        
        # Räkna ut när "fönstret" börjar (1 timme innan läggdags)
        stopp_tid = datetime.strptime(TID_NER, "%H:%M").replace(
            year=nu.year, month=nu.month, day=nu.day
        )
        start_tid = stopp_tid - timedelta(hours=1)

        # Logik för PIR-sensor inom tidsfönstret
        if start_tid <= nu <= stopp_tid and not gardin_nere_idag:
            
            # Kolla om sensorn ser rörelse
            if GPIO.input(PIR_PIN):
                last_motion_time = time.time() # Uppdatera tiden vid rörelse
            
            # Räkna ut sekunder av stillhet
            sekunder_stilla = time.time() - last_motion_time
            
            if sekunder_stilla >= (STILL_MINUTER * 60):
                print(f"Fågeln har varit stilla i {STILL_MINUTER} min. Stänger i förväg...")
                gardin_ner()

        time.sleep(1) # Tätare koll för att inte missa korta rörelser

except KeyboardInterrupt:
    print("\nAvslutat.")
    GPIO.cleanup()