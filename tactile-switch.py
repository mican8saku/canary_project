import RPi.GPIO as GPIO
import time

# --- Inställningar ---
LED_PIN = 18
BUTTON_PIN = 21

# Variabel för att hålla koll på om lampan ska vara på eller av
led_state = False

def setup():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(LED_PIN, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    time.sleep(0.1) # Ge hårdvaran en millisekund att landa!


def toggle(channel):
    global led_state
    led_state = not led_state # Skifta läge (True blir False, False blir True)
    
    if led_state:
        GPIO.output(LED_PIN, GPIO.HIGH)
        print("Lampan är TÄND")
    else:
        GPIO.output(LED_PIN, GPIO.LOW)
        print("Lampan är SLÄCKT")

try:
    setup()
    print("Testar knappen med 'Polling' istället...")
    
    last_button_state = GPIO.input(BUTTON_PIN)

    while True:
        current_state = GPIO.input(BUTTON_PIN)
        
        # Om knappen trycks ner (går från 1 till 0 pga PULL_UP)
        if current_state == GPIO.LOW and last_button_state == GPIO.HIGH:
            toggle(BUTTON_PIN) # Anropa din toggle-funktion
            time.sleep(0.3)    # Enkel debounce
            
        last_button_state = current_state
        time.sleep(0.01) # Spara på processorn

except KeyboardInterrupt:
    print("Avslutar...")
finally:
    GPIO.cleanup()