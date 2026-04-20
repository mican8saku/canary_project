import RPi.GPIO as GPIO
import time

# --- Inställningar ---
MOTOR_PINS = [22, 27, 17, 4]
BUTTON_UP = 16
BUTTON_DOWN = 20

# Stegsekvens för 28BYJ-48 motor
STEP_SEQ = [
    [1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0],
    [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 1]
]

def setup():
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    
    # Setup Motor
    for pin in MOTOR_PINS:
        GPIO.setup(pin, GPIO.OUT)
        GPIO.output(pin, 0)
    
    # Setup Knappar (med inbyggt pull-up motstånd)
    GPIO.setup(BUTTON_UP, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    GPIO.setup(BUTTON_DOWN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

def stang_av_motor():
    for pin in MOTOR_PINS:
        GPIO.output(pin, 0)

def ta_ett_steg(sekvens_index):
    # Utför ett av de 8 stegen i sekvensen
    steg = STEP_SEQ[sekvens_index]
    for i in range(4):
        GPIO.output(MOTOR_PINS[i], steg[i])

try:
    setup()
    print("Systemet redo! Håll inne knapparna för att styra gardinen.")
    
    step_counter = 0

    while True:
        # Läs av knapparna (LOW betyder att de är nedtryckta)
        up_pressed = GPIO.input(BUTTON_UP) == GPIO.LOW
        down_pressed = GPIO.input(BUTTON_DOWN) == GPIO.LOW

        if up_pressed:
            # Rulla upp (Kör sekvensen framåt)
            step_counter = (step_counter + 1) % 8
            ta_ett_steg(step_counter)
            time.sleep(0.0015) # Hastighet
            
        elif down_pressed:
            # Rulla ner (Kör sekvensen bakåt)
            step_counter = (step_counter - 1) % 8
            ta_ett_steg(step_counter)
            time.sleep(0.0015) # Hastighet
            
        else:
            # Ingen knapp tryckt -> se till att motorn inte drar ström
            stang_av_motor()
            time.sleep(0.05) # Liten paus för att inte stressa processorn

except KeyboardInterrupt:
    print("\nAvbryter...")
finally:
    stang_av_motor()
    GPIO.cleanup()