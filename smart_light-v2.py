import board
import adafruit_tsl2591
import neopixel
import time

# --- Inställningar ---
LUX_THRESHOLD = 10.0
PIXEL_PIN = board.D12
NUM_PIXELS = 8 

i2c = board.I2C()
sensor = adafruit_tsl2591.TSL2591(i2c)

# Vi startar med brightness på 0
pixels = neopixel.NeoPixel(PIXEL_PIN, NUM_PIXELS, brightness=0.0, auto_write=True)

def fade_in(target_brightness, duration=2):
    """Dimrar upp ljuset till target_brightness under duration sekunder"""
    steps = 50 # Hur mjuk dimringen ska vara
    wait = duration / steps
    
    # Sätt färgen först (medan brightness är 0)
    pixels.fill((255, 255, 255)) 
    
    current_b = pixels.brightness
    step_size = (target_brightness - current_b) / steps
    
    print("Dimrar upp...")
    for _ in range(steps):
        current_b += step_size
        pixels.brightness = max(0, min(1.0, current_b))
        time.sleep(wait)

def fade_out(duration=2):
    """Dimrar ner ljuset helt"""
    steps = 50
    wait = duration / steps
    
    current_b = pixels.brightness
    step_size = current_b / steps
    
    print("Dimrar ner...")
    for _ in range(steps):
        current_b -= step_size
        pixels.brightness = max(0, min(1.0, current_b))
        time.sleep(wait)

# Huvudloop
is_on = False

try:
    while True:
        lux = sensor.lux
        print(f"Ljusstyrka: {lux:.2f} lux")

        if lux < LUX_THRESHOLD and not is_on:
            fade_in(1.0) # Dimra upp till 100%
            is_on = True
        elif lux >= LUX_THRESHOLD and is_on:
            fade_out()
            is_on = False

        time.sleep(0.5)

except KeyboardInterrupt:
    pixels.brightness = 0
    pixels.fill((0,0,0))