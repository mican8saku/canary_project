import board
import adafruit_tsl2591

# Skapa I2C-buss
i2c = board.I2C()

# Initialisera sensorn
sensor = adafruit_tsl2591.TSL2591(i2c)

while True:
    # Läs av lux (ljusstyrka)
    lux = sensor.lux
    print(f"Ljusstyrka: {lux:.2f} lux")
    
    # Läs av infrarött och synligt ljus separat om ni vill
    visible = sensor.visible
    infrared = sensor.infrared
    print(f"Synligt: {visible}, IR: {infrared}")
    
    import time
    time.sleep(1.0)
