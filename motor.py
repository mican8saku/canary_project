import RPi.GPIO as GPIO
import time

motor_pins = [22, 27, 17, 4]
step_seq = [
    [1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0],
    [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 1]
]

def setup_motors():
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    for pin in motor_pins:
        GPIO.setup(pin, GPIO.OUT)
        GPIO.output(pin, 0)

def kor_gardin(varv, riktning):
    steg_per_varv = 4096
    totala_steg = int(steg_per_varv * varv)
    sekvens = step_seq if riktning == 1 else step_seq[::-1]
    
    for _ in range(int(totala_steg / 8)):
        for step in sekvens:
            for i in range(4):
                GPIO.output(motor_pins[i], step[i])
            time.sleep(0.0015)
            
    # Stäng av strömmen (viktigt!)
    for pin in motor_pins:
        GPIO.output(pin, 0)