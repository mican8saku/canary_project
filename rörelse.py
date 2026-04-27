import time
import schedule
import motor
import RPi.GPIO as GPIO
from datetime import datetime, timedelta

# --- KONFIGURATION ---
TID_UPP = "13:42"   # Senaste tid gardinen dras upp
TID_NER = "21:30"   # Senaste tid gardinen dras ner (om fågeln inte varit stilla)
KORTID = 2.8 

PIR_PIN = 14        # Din pin för rörelsesensorn
STILL_MINUTER = 5   # Hur länge fågeln ska vara stilla för kvällsstängning

# --- SETUP GPIO ---
GPIO.setwarnings(False) 
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN)

# --- VARIABLER FÖR LOGIK ---
last_motion_time = time.time()
gardin_nere_idag = False  # Startar som False (vi antar att det är dag)

def gardin_upp():
    global gardin_nere_idag
    if gardin_nere_idag:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Kör gardin UPP...")
        motor.setup_motors()
        motor.kor_gardin(KORTID, -1)
        gardin_nere_idag = False

def gardin_ner():
    global gardin_nere_idag, last_motion_time
    if not gardin_nere_idag:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Kör gardin NER...")
        motor.setup_motors()
        motor.kor_gardin(KORTID, 1)
        gardin_nere_idag = True
        # Nollställ timern så den är redo för nästa fönster
        last_motion_time = time.time()

# Schemaläggning (Fasta tider som backup)
schedule.every().day.at(TID_UPP).do(gardin_upp)
schedule.every().day.at(TID_NER).do(gardin_ner)

print(f"System startat!")
print(f"Morgon-koll: 1h innan {TID_UPP} (Öppnar vid rörelse)")
print(f"Kvälls-koll: 1h innan {TID_NER} (Stänger efter {STILL_MINUTER} min stillhet)")

try:
    while True:
        schedule.run_pending()
        nu = datetime.now()
        
        # --- BERÄKNA TIDSFÖNSTER ---
        # Kvällsfönster (1h innan TID_NER)
        ner_obj = datetime.strptime(TID_NER, "%H:%M").replace(year=nu.year, month=nu.month, day=nu.day)
        kvall_start = ner_obj - timedelta(hours=1)
        
        # Morgonfönster (1h innan TID_UPP)
        upp_obj = datetime.strptime(TID_UPP, "%H:%M").replace(year=nu.year, month=nu.month, day=nu.day)
        morgon_start = upp_obj - timedelta(hours=1)

        # Läs av rörelse
        rorelse_detekterad = GPIO.input(PIR_PIN)

        # --- MORGON-LOGIK ---
        # Om vi är i morgonfönstret, gardinen är nere, och vi ser rörelse -> Öppna direkt
        if morgon_start <= nu <= upp_obj and gardin_nere_idag:
            if rorelse_detekterad:
                print("Morgonrörelse! Fågeln är vaken. Öppnar gardinen...")
                gardin_upp()

        # --- KVÄLLS-LOGIK ---
        # Om vi är i kvällsfönstret och gardinen är uppe -> Kolla inaktivitet
        if kvall_start <= nu <= ner_obj and not gardin_nere_idag:
            if rorelse_detekterad:
                last_motion_time = time.time() # Nollställ timer vid rörelse
            
            sekunder_stilla = time.time() - last_motion_time
            
            if sekunder_stilla >= (STILL_MINUTER * 60):
                print(f"Fågeln har varit stilla i {STILL_MINUTER} min. Stänger i förväg...")
                gardin_ner()

        time.sleep(0.5) # Lite snabbare loop för att inte missa morgonrörelsen

except KeyboardInterrupt:
    print("\nAvslutat.")
    GPIO.cleanup()