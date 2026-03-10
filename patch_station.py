import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the API fetch to include hidebroken=true, increase limit
content = content.replace(
    '`https://de1.api.radio-browser.info/json/stations/search?tag=${encodeURIComponent(genre.toLowerCase())}&limit=10&order=clickcount&reverse=true`',
    '`https://de1.api.radio-browser.info/json/stations/search?tag=${encodeURIComponent(genre.toLowerCase())}&limit=30&order=clickcount&reverse=true&hidebroken=true`'
)

# Update the station selection logic to filter for MP3/AAC
new_logic = """
        if (stations && stations.length > 0) {
            // Filter for widely supported codecs if possible
            let validStations = stations.filter(s => s.codec === 'MP3' || s.codec === 'AAC' || s.codec === 'AAC+');

            // Fallback to any station if no MP3/AAC found
            if (validStations.length === 0) validStations = stations;

            // Pick the first reliable station from the filtered list
            const station = validStations[0];
"""

content = re.sub(
    r'if \(stations && stations\.length > 0\) \{\s+// Pick the first reliable station\s+const station = stations\[0\];',
    new_logic.strip(),
    content
)

# Catch the error from play() properly if it happens after dispatchEvent
new_play_logic = """            // Oculta o modal
            musicSearchModal.classList.add('hidden');
            musicSearchModal.classList.remove('flex');

            // Tenta forçar o play e pega erros
            try {
                const playPromise = localAudioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.error("Erro ao tocar rádio (provável codec incompatível ou erro de rede):", e);
                        alert(`A rádio selecionada ("${station.name}") não pôde ser tocada neste navegador ou está offline. Tente pesquisar novamente para encontrar outra.`);
                    });
                }
            } catch (e) {
                console.error("Erro síncrono no play:", e);
            }
"""

content = re.sub(
    r'// Oculta o modal\s+musicSearchModal\.classList\.add\(\'hidden\'\);\s+musicSearchModal\.classList\.remove\(\'flex\'\);',
    new_play_logic.strip(),
    content
)


with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
