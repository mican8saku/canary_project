import time
import schedule
import motor # Förutsätter att motor.py ligger i samma mapp

# --- KONFIGURATION ---
# Justera tiderna här
TID_UPP = "13:42"
TID_NER = "21:30"

# Hur länge motorn ska snurra (samma värde som i din main)
KORTID = 2.8 

def gardin_upp():
    print(f"[{time.strftime('%H:%M:%S')}] Klockan är {TID_UPP}: Kör gardin UPP...")
    try:
        motor.setup_motors() # Säkerställ att pinnarna är redo
        motor.kor_gardin(KORTID, -1)
        print("Klar.")
    except Exception as e:
        print(f"Ett fel uppstod: {e}")

def gardin_ner():
    print(f"[{time.strftime('%H:%M:%S')}] Klockan är {TID_NER}: Kör gardin NER...")
    try:
        motor.setup_motors()
        motor.kor_gardin(KORTID, 1)
        print("Klar.")
    except Exception as e:
        print(f"Ett fel uppstod: {e}")

# --- SCHEMALÄGGNING ---
schedule.every().day.at(TID_UPP).do(gardin_upp)
schedule.every().day.at(TID_NER).do(gardin_ner)

print(f"Timer startad!")
print(f"Gardinen går UPP kl {TID_UPP} och NER kl {TID_NER}.")
print("Tryck Ctrl+C för att avsluta skriptet.")

# --- HUVUDLOOP ---
try:
    while True:
        schedule.run_pending()
        time.sleep(10) # Kolla klockan var 10:e sekund
except KeyboardInterrupt:
    print("\nSkriptet avslutat av användaren.")