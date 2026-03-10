import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_logic = """
    let currentStationKey = getCurrentStation();
    let station = musicStations[currentStationKey];

    // If the station was custom and the page reloaded, it won't exist in the list anymore
    if (!station) {
        currentStationKey = 'lofi';
        station = musicStations['lofi'];
        localStorage.setItem('pomodoroMusicStation', 'lofi');
    }

    localAudioPlayer.src = station.url;
    playerCurrentTrackName.textContent = station.name;
    musicCategorySelect.value = currentStationKey;
}
"""

content = re.sub(
    r'const currentStationKey = getCurrentStation\(\);\s+const station = musicStations\[currentStationKey\];\s+localAudioPlayer\.src = station\.url;\s+playerCurrentTrackName\.textContent = station\.name;\s+musicCategorySelect\.value = currentStationKey;\s+\}',
    new_logic.strip() + '\n}',
    content
)


with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
