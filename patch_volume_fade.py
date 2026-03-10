import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

volume_fade_code = """
let volumeFadeInterval = null;

function setVolumeByMode(mode) {
    const targetVolume = (mode === 'focus') ? 0.2 : 0.05;

    if (volumeFadeInterval) {
        clearInterval(volumeFadeInterval);
    }

    // Se o player estiver pausado, apenas define o volume diretamente
    if (localAudioPlayer.paused) {
        localAudioPlayer.volume = targetVolume;
        playerVolumeSlider.value = targetVolume * 100;
        updateVolumeSlider();
        return;
    }

    const startVolume = localAudioPlayer.volume;
    const difference = targetVolume - startVolume;
    const duration = 2000; // 2 seconds fade
    const steps = 20; // 20 steps
    const stepTime = duration / steps;
    const stepChange = difference / steps;

    let currentStep = 0;

    volumeFadeInterval = setInterval(() => {
        currentStep++;
        let newVolume = startVolume + (stepChange * currentStep);

        // Clamp between 0 and 1
        newVolume = Math.max(0, Math.min(1, newVolume));

        localAudioPlayer.volume = newVolume;
        playerVolumeSlider.value = newVolume * 100;
        updateVolumeSlider();

        if (currentStep >= steps) {
            clearInterval(volumeFadeInterval);
            localAudioPlayer.volume = targetVolume;
            playerVolumeSlider.value = targetVolume * 100;
            updateVolumeSlider();
        }
    }, stepTime);
}
"""

content = re.sub(
    r'function setVolumeByMode\(mode\) \{[\s\S]*?\}',
    volume_fade_code.strip(),
    content
)

# Fix manual volume adjust canceling fade
content = re.sub(
    r'(playerVolumeSlider\?\.addEventListener\(\'input\', \(\) => \{)',
    r'\1\n        if (volumeFadeInterval) clearInterval(volumeFadeInterval);',
    content
)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
