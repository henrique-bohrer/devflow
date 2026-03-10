import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add search button to footer
search_button_html = """          <button id="player-search-btn"
            class="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="Pesquisar Gênero">
            <i class="fa-solid fa-magnifying-glass fa-lg"></i></button>"""

content = re.sub(
    r'(<select id="music-category-select"[\s\S]*?</select>)',
    r'\1\n' + search_button_html,
    content
)

# 2. Add search modal
modal_html = """
  <!-- Music Search Modal -->
  <div id="music-search-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] items-center justify-center hidden">
    <div class="bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700 flex flex-col max-h-[90vh]">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-2xl font-bold text-white">Pesquisar Gênero Musical</h3>
        <button id="close-music-search-btn" class="text-gray-400 hover:text-white">
          <i class="fa-solid fa-times fa-2x"></i>
        </button>
      </div>

      <div class="mb-4">
        <label for="genre-search-input" class="block text-sm font-medium text-slate-300 mb-2">Gênero de Música</label>
        <div class="flex gap-2">
          <input type="text" id="genre-search-input" placeholder="Ex: Rock, Jazz, Lo-Fi" class="flex-grow p-3 bg-slate-700 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white">
          <button id="search-genre-btn" class="btn bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4"><i class="fa-solid fa-search"></i></button>
        </div>
      </div>

      <div id="ai-artists-container" class="mb-4 hidden flex-grow overflow-y-auto custom-scrollbar">
        <p class="text-sm text-indigo-400 mb-2 font-semibold">Cantores/Bandas sugeridos (IA):</p>
        <ul id="ai-artists-list" class="space-y-2 text-slate-300">
        </ul>
      </div>

      <div id="exclude-artist-container" class="mb-6 hidden">
        <label for="exclude-artist-input" class="block text-sm font-medium text-slate-300 mb-2">Restrições</label>
        <input type="text" id="exclude-artist-input" placeholder="Quer incluir um cantor/banda que não queira escutar?" class="w-full p-3 bg-slate-700 rounded-lg border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white">
      </div>

      <div class="flex justify-end mt-auto pt-4 border-t border-slate-700 hidden" id="confirm-genre-container">
        <button id="confirm-genre-btn" class="btn py-2 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg w-full">Tocar Rádio deste Gênero</button>
      </div>
    </div>
  </div>
"""

content = re.sub(
    r'(<script src="i18n.js"></script>)',
    modal_html + r'\n  \1',
    content
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
