import RPi.GPIO as GPIO
import time

PIR_PIN = 6  # GPIO17

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIR_PIN, GPIO.IN)

print("Startar PIR-sensor...")

try:
    while True:
        if GPIO.input(PIR_PIN):
            print("Rörelse upptäckt!")
            time.sleep(1)
        else:
            print("Ingen rörelse")
            time.sleep(1)

except KeyboardInterrupt:
    print("Avslutar...")
    GPIO.cleanup()