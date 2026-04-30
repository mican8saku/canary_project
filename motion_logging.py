LOG_FILE = Path("motion_log.json")
motion_data = [] # Vi håller datan här för att spara på SD-kortet

def load_motion_data():
    global motion_data
    if LOG_FILE.exists():
        try:
            with open(LOG_FILE, "r") as f:
                motion_data = json.load(f)
        except: motion_data = []

load_motion_data()
def log_motion():
    global motion_data
    now = datetime.now()
    motion_data.append(now.strftime("%Y-%m-%d %H:%M:%S"))

    # Behåll bara senaste 7 dagarna
    one_week_ago = now - timedelta(days=7)
    motion_data = [
        entry for entry in motion_data 
        if datetime.strptime(entry, "%Y-%m-%d %H:%M:%S") > one_week_ago
    ]

    # Spara till fil (du kan anropa denna mer sällan om du vill optimera mer)
    try:
        with open(LOG_FILE, "w") as f:
            json.dump(motion_data, f)
    except Exception as e:
        print(f"Kunde inte spara logg: {e}")


@app.route('/api/motion-stats', methods=['GET'])
def get_motion_stats():
    # Gruppera dagens rörelser i 20-minuters block
    stats = {}
    today_str = datetime.now().strftime("%Y-%m-%d")

    for entry in motion_data:
        dt = datetime.strptime(entry, "%Y-%m-%d %H:%M:%S")
        
        # Visa bara data för idag i 20-minutersgrafen
        if dt.strftime("%Y-%m-%d") == today_str:
            # Avrunda minuter neråt till 0, 20 eller 40
            minute = (dt.minute // 20) * 20
            key = dt.replace(minute=minute, second=0).strftime("%H:%M")
            stats[key] = stats.get(key, 0) + 1

    # Sortera tiderna så grafen går framåt
    sorted_labels = sorted(stats.keys())
    return jsonify({
        "labels": sorted_labels,
        "values": [stats[k] for k in sorted_labels]
    })