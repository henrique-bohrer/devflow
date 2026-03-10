import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure event listeners for search modal are only added once
# Check if they exist
if "playerSearchBtn?.addEventListener('click'" not in content:
    init_logic = """
    // Pesquisa de Música
    playerSearchBtn?.addEventListener('click', () => {
        musicSearchModal.classList.remove('hidden');
        musicSearchModal.classList.add('flex');
        genreSearchInput.value = '';
        excludeArtistInput.value = '';
        aiArtistsContainer.classList.add('hidden');
        excludeArtistContainer.classList.add('hidden');
        confirmGenreContainer.classList.add('hidden');
        confirmGenreContainer.classList.remove('flex');
    });

    closeMusicSearchBtn?.addEventListener('click', () => {
        musicSearchModal.classList.add('hidden');
        musicSearchModal.classList.remove('flex');
    });

    searchGenreBtn?.addEventListener('click', () => searchArtistsByGenre(genreSearchInput.value.trim()));
    genreSearchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchArtistsByGenre(genreSearchInput.value.trim());
    });

    confirmGenreBtn?.addEventListener('click', startRadioByGenre);
"""

    content = re.sub(
        r'(// Player)',
        init_logic + r'\n    // Player',
        content
    )

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
