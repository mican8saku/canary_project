# light.py
import board
import neopixel
import time

PIXEL_PIN = board.D12  # Se till att denna matchar din fysiska koppling
NUM_PIXELS = 8

# Initiera strippen
pixels = neopixel.NeoPixel(PIXEL_PIN, NUM_PIXELS, brightness=0.0, auto_write=True)

def set_light(state, color=(255, 147, 41), duration=1.5):
    """
    state: True (tänd) eller False (släck)
    color: (R, G, B)
    duration: tid i sekunder för fade
    """
    steps = 30
    wait = duration / steps
    
    if state:
        # TÄND / FADE IN
        pixels.fill(color)
        target = 0.8 # Vi kör på 80% som max för att spara ström/ögon
        current_b = pixels.brightness
        step_size = (target - current_b) / steps
        
        for _ in range(steps):
            current_b += step_size
            pixels.brightness = max(0, min(1.0, current_b))
            time.sleep(wait)
    else:
        # SLÄCK / FADE OUT
        current_b = pixels.brightness
        step_size = current_b / steps
        
        for _ in range(steps):
            current_b -= step_size
            pixels.brightness = max(0, min(1.0, current_b))
            time.sleep(wait)
        pixels.fill((0, 0, 0))
        pixels.brightness = 0

def get_brightness():
    return pixels.brightness