import os
import json
from pathlib import Path
from flask import Flask, request, send_file, redirect, jsonify
from datetime import datetime, timezone
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

STATE_FILE = Path("state.json")

# ----------------------------
# Config
# ----------------------------
MOTION_IDLE_THRESHOLD = 30
TEMP_ALERT_THRESHOLD = 30.0

# ----------------------------
# API helpers
# ----------------------------
def api_success(data, status=200):
    return jsonify({
        "ok": True,
        "data": data,
        "error": None
    }), status


def api_error(message, status=200):
    return jsonify({
        "ok": False,
        "data": None,
        "error": message
    }), status


# ----------------------------
# App state
# ----------------------------
curtain_state = 0
last_motion_at = datetime.now(timezone.utc).isoformat()


def curtain_state_str():
    return "open" if curtain_state == 100 else "closed"


def load_state():
    global curtain_state, last_motion_at

    if not STATE_FILE.exists():
        return

    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        curtain_state = data.get("curtainState", 0)
        last_motion_at = data.get(
            "lastMotionAt",
            datetime.now(timezone.utc).isoformat()
        )
    except Exception as e:
        print(f"Failed to load state: {e}")


def save_state():
    try:
        data = {
            "curtainState": curtain_state,
            "lastMotionAt": last_motion_at
        }

        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Failed to save state: {e}")


load_state()

# ----------------------------
# Setup / hardware detection
# ----------------------------
LED_PIN = 18

try:
    import RPi.GPIO as GPIO
    import board
    import adafruit_dht
    import adafruit_tsl2591
    import neopixel
    import motor

    IS_PI = True

    dht_device = adafruit_dht.DHT11(board.D26)
    i2c = board.I2C()
    tsl_sensor = adafruit_tsl2591.TSL2591(i2c)
    pixels = neopixel.NeoPixel(board.D12, 8, brightness=0.2, auto_write=False)

    motor.setup_motors()

    GPIO.setmode(GPIO.BCM)
    GPIO.setup(LED_PIN, GPIO.OUT)

    print("--- Running on Raspberry Pi ---")

except (ImportError, RuntimeError) as e:
    IS_PI = False
    print(f"--- Running on PC (Mock Mode) --- Error: {e}")

# ----------------------------
# Helpers
# ----------------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


def get_temperature():
    if IS_PI:
        try:
            temp = dht_device.temperature
            return float(temp) if temp is not None else 0.0
        except Exception:
            return 0.0
    return 35.0


def get_bird_status():
    try:
        last_motion = datetime.fromisoformat(last_motion_at)
        idle_seconds = (datetime.now(timezone.utc) - last_motion).total_seconds()
        return "active" if idle_seconds < MOTION_IDLE_THRESHOLD else "inactive"
    except Exception:
        return "inactive"


def set_led(on: bool):
    if IS_PI:
        try:
            GPIO.output(LED_PIN, 1 if on else 0)
            return True
        except Exception as e:
            print(f"LED error: {e}")
            return False
    return True


def build_alerts(temperature, bird_status):
    alerts = []

    if temperature >= TEMP_ALERT_THRESHOLD:
        alerts.append({
            "id": "temp-high",
            "type": "temperature",
            "message": f"High temperature detected ({int(temperature)}°C)",
            "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H")
        })

    try:
        last_motion = datetime.fromisoformat(last_motion_at)
        idle_seconds = (datetime.now(timezone.utc) - last_motion).total_seconds()

        if idle_seconds >= MOTION_IDLE_THRESHOLD:
            idle_minutes = int(idle_seconds // 60)

            message = (
                "No movement detected"
                if idle_minutes < 1
                else f"No activity for {idle_minutes} min. Check the camera."
            )

            alerts.append({
                "id": "motion-inactive",
                "type": "motion",
                "message": message,
                "createdAt": last_motion_at
            })
    except Exception:
        pass

    return alerts


def move_curtain_open():
    global curtain_state

    if IS_PI:
        try:
            motor.kor_gardin(2.8, -1)
        except Exception as e:
            print(f"Curtain open error: {e}")
            return False

    curtain_state = 100
    save_state()
    return True


def move_curtain_close():
    global curtain_state

    if IS_PI:
        try:
            motor.kor_gardin(2.8, 1)
        except Exception as e:
            print(f"Curtain close error: {e}")
            return False

    curtain_state = 0
    save_state()
    return True


# ----------------------------
# Routes
# ----------------------------
@app.route('/status', methods=['GET'])
def status():
    try:
        temperature = get_temperature()
        bird_status = get_bird_status()
        alerts = build_alerts(temperature, bird_status)

        return api_success({
            "deviceOnline": True,
            "isPi": IS_PI,
            "temperature": temperature,
            "curtainState": curtain_state_str(),
            "birdStatus": bird_status,
            "lastMotionAt": last_motion_at,
            "alerts": alerts,
            "version": "1.0.0"
        })
    except Exception as e:
        print(e)
        return api_error("Status unavailable")


@app.route('/curtain/open', methods=['POST'])
def curtain_open():
    if not move_curtain_open():
        return api_error("Failed to open curtain")

    return api_success({
        "curtainState": curtain_state_str()
    })


@app.route('/curtain/close', methods=['POST'])
def curtain_close():
    if not move_curtain_close():
        return api_error("Failed to close curtain")

    return api_success({
        "curtainState": curtain_state_str()
    })


@app.route('/mock/motion', methods=['POST'])
def mock_motion():
    global last_motion_at

    last_motion_at = now_iso()
    save_state()

    return api_success({
        "lastMotionAt": last_motion_at,
        "birdStatus": get_bird_status()
    })


@app.route('/diagnostics', methods=['GET'])
def diagnostics():
    return api_success({
        "deviceOnline": True,
        "isPi": IS_PI,
        "stateFileExists": STATE_FILE.exists(),
        "curtainState": curtain_state_str(),
        "lastMotionAt": last_motion_at,
        "temperatureSensor": "ok" if IS_PI else "mock",
        "motorControl": "ok" if IS_PI else "mock",
        "ledControl": "ok" if IS_PI else "mock"
    })


@app.route('/camera/snapshot', methods=['GET'])
def camera_snapshot():
    try:
        if IS_PI:
            from picamera2 import Picamera2
            import time

            file_path = "snapshot.jpg"

            picam2 = Picamera2()
            picam2.start()
            time.sleep(1)
            picam2.capture_file(file_path)
            picam2.close()

            return send_file(file_path, mimetype='image/jpeg')

        return redirect("https://placehold.co/600x400?text=Camera+Mock")

    except Exception as e:
        print(f"Camera error: {e}")
        return api_error("Camera error")


# ----------------------------
# Run
# ----------------------------
if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000)
    finally:
        if IS_PI:
            GPIO.cleanup()