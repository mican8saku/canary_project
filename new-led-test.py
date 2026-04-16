import time
import board
import neopixel

PIXEL_PIN = board.D24      # GPIO18 (pin 12)
NUM_PIXELS = 60            # ändra till din längd
BRIGHTNESS = 0.2           # låg ljusstyrka = säkrare

pixels = neopixel.NeoPixel(
    PIXEL_PIN,
    NUM_PIXELS,
    brightness=BRIGHTNESS,
    auto_write=True
)

def test_color(color):
    pixels.fill(color)
    time.sleep(2)

while True:
    test_color((255, 0, 0))   # röd
    test_color((0, 255, 0))   # grön
    test_color((0, 0, 255))   # blå
    test_color((255, 255, 255)) # vit
    pixels.fill((0, 0, 0))    # av
    time.sleep(1)