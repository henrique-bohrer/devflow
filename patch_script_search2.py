import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace duplicate search logic
content = re.sub(r'// --- LÓGICA DE PESQUISA DE RÁDIO E ARTISTAS ---[\s\S]*?// --- INICIALIZAÇÃO GERAL ---', '// --- INICIALIZAÇÃO GERAL ---', content)
content = re.sub(r'// --- LÓGICA DE PESQUISA DE RÁDIO E ARTISTAS ---[\s\S]*?// --- INICIALIZAÇÃO GERAL ---', '// --- INICIALIZAÇÃO GERAL ---', content)

search_logic = """
// --- LÓGICA DE PESQUISA DE RÁDIO E ARTISTAS ---
async function searchArtistsByGenre(genre) {
    if (!genre) return;
    searchGenreBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    searchGenreBtn.disabled = true;

    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(genre)}&entity=allArtist&limit=5`);
        const data = await response.json();

        aiArtistsList.innerHTML = '';
        if (data.results && data.results.length > 0) {
            data.results.forEach(artist => {
                const li = document.createElement('li');
                li.className = 'flex items-center gap-2 p-2 bg-slate-700 rounded-lg';
                li.innerHTML = `<i class="fa-solid fa-music text-indigo-400"></i> <span>${artist.artistName}</span>`;
                aiArtistsList.appendChild(li);
            });
            aiArtistsContainer.classList.remove('hidden');
            excludeArtistContainer.classList.remove('hidden');
            confirmGenreContainer.classList.remove('hidden');
            confirmGenreContainer.classList.add('flex');
        } else {
            aiArtistsList.innerHTML = '<li class="text-slate-400">Nenhum artista encontrado para este gênero.</li>';
            aiArtistsContainer.classList.remove('hidden');
            excludeArtistContainer.classList.remove('hidden');
            confirmGenreContainer.classList.remove('hidden');
            confirmGenreContainer.classList.add('flex');
        }
    } catch (error) {
        console.error("Erro ao buscar artistas:", error);
        aiArtistsList.innerHTML = '<li class="text-red-400">Erro ao carregar artistas.</li>';
        aiArtistsContainer.classList.remove('hidden');
    } finally {
        searchGenreBtn.innerHTML = '<i class="fa-solid fa-search"></i>';
        searchGenreBtn.disabled = false;
    }
}

async function startRadioByGenre() {
    const genre = genreSearchInput.value.trim();
    if (!genre) return;

    confirmGenreBtn.innerHTML = 'Buscando rádio <i class="fa-solid fa-spinner fa-spin ml-2"></i>';
    confirmGenreBtn.disabled = true;

    try {
        const response = await fetch(`https://de1.api.radio-browser.info/json/stations/bytag/${encodeURIComponent(genre)}?limit=10&order=clickcount&reverse=true`);
        const stations = await response.json();

        if (stations && stations.length > 0) {
            // Pick the first reliable station
            const station = stations[0];
            const newStationKey = `custom_${Date.now()}`;

            // Adiciona a nova estação à lista e seleciona
            musicStations[newStationKey] = {
                name: station.name || `Rádio ${genre}`,
                url: station.url_resolved || station.url
            };

            setupRadioPlayer(); // Re-render select

            const musicCategorySelect = document.getElementById('music-category-select');
            musicCategorySelect.value = newStationKey;

            // Dispatch change event to play
            musicCategorySelect.dispatchEvent(new Event('change'));

            // Oculta o modal
            musicSearchModal.classList.add('hidden');
            musicSearchModal.classList.remove('flex');

        } else {
            alert(`Nenhuma rádio encontrada para o gênero "${genre}".`);
        }
    } catch (error) {
        console.error("Erro ao buscar rádio:", error);
        alert("Erro ao buscar rádio. Tente novamente.");
    } finally {
        confirmGenreBtn.innerHTML = 'Tocar Rádio deste Gênero';
        confirmGenreBtn.disabled = false;
    }
}

// --- INICIALIZAÇÃO GERAL ---"""

content = content.replace('// --- INICIALIZAÇÃO GERAL ---', search_logic)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
