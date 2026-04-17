import RPi.GPIO as GPIO
import time

PIR_PIN = 6
LED_PIN = 18
LIGHT_TIME = 5 # Hur många sekunder lampan ska lysa efter rörelse

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN)
GPIO.setup(LED_PIN, GPIO.OUT)

print("Rörelsedetektor med timer startad...")

try:
    while True:
        if GPIO.input(PIR_PIN):
            print("Rörelse! Tänder lampan.")
            GPIO.output(LED_PIN, GPIO.HIGH)
            
            # Håll lampan tänd så länge det rör sig + LIGHT_TIME
            while GPIO.input(PIR_PIN):
                time.sleep(0.1) # Vänta medan det rör sig
            
            print(f"Väntar {LIGHT_TIME} sekunder innan jag släcker...")
            time.sleep(LIGHT_TIME)
            GPIO.output(LED_PIN, GPIO.LOW)
            print("Släckt.")
            
        time.sleep(0.1)

except KeyboardInterrupt:
    GPIO.cleanup()