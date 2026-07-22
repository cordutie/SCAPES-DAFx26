/**
 * SCAPES Demo - Audio Explorer
 * Loads class-emoji CSVs and manages interactive audio playback.
 */

const SCAPES = (() => {
    const AUDIO_BASE = 'assets/audio';

    const SECTIONS = {
        resynthesis: {
            csv: 'assets/data/classes_resynthesis.csv',
            audioDir: `${AUDIO_BASE}/resynthesis`,
            originalDir: `${AUDIO_BASE}/original`,
            labelOriginal: 'Original',
            labelProcessed: 'Resynthesized',
        },
        generation: {
            csv: 'assets/data/classes_generation.csv',
            audioDir: `${AUDIO_BASE}/semantic_generation`,
            originalDir: `${AUDIO_BASE}/original`,
            labelOriginal: 'Original',
            labelProcessed: 'Generated',
        },
        interpolation: {
            csv: 'assets/data/classes_interpolation.csv',
            audioDir: `${AUDIO_BASE}/semantic_interpolation`,
            label: 'Interpolation',
        },
    };

    // --- CSV Parser ---
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((h, i) => { obj[h.trim()] = values[i].trim(); });
            return obj;
        });
    }

    async function loadClasses(csvPath) {
        const resp = await fetch(csvPath);
        const text = await resp.text();
        return parseCSV(text);
    }

    // --- Audio Path Helpers ---
    function origPath(cls) {
        return `${SECTIONS.resynthesis.originalDir}/${cls}.mp3`;
    }

    function resynthPath(cls) {
        return `${SECTIONS.resynthesis.audioDir}/${cls}.mp3`;
    }

    function genPath(cls) {
        return `${SECTIONS.generation.audioDir}/${cls}.mp3`;
    }

    function interpPath(src, tgt) {
        return `${SECTIONS.interpolation.audioDir}/interpolation_${src}_to_${tgt}.mp3`;
    }

    // --- Section Builders ---

    function buildSingleSection(sectionId, classes, config) {
        const container = document.getElementById(sectionId);
        if (!container) return;

        // Prevent audio click events from bubbling to emoji-btn
        container.querySelectorAll('.audio-slot audio').forEach(a => {
            a.addEventListener('click', e => e.stopPropagation());
        });

        // Emoji selector bar
        const selectorBar = container.querySelector('.emoji-selector');
        let currentClass = null;
        classes.forEach(cls => {
            const btn = document.createElement('button');
            btn.className = 'emoji-btn';
            btn.dataset.class = cls.class;
            btn.innerHTML = `<span class="emoji">${cls.emoji}</span><span class="emoji-label">${cls.class}</span>`;
            btn.addEventListener('click', () => {
                if (currentClass === cls.class) return;
                currentClass = cls.class;
                selectorBar.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateSinglePlayers(sectionId, cls.class, config);
            });
            selectorBar.appendChild(btn);
        });

        // Set first as active by default
        const firstBtn = selectorBar.querySelector('.emoji-btn');
        if (firstBtn) {
            firstBtn.classList.add('active');
            updateSinglePlayers(sectionId, classes[0].class, config);
        }
    }

    function updateSinglePlayers(sectionId, cls, config) {
        const container = document.getElementById(sectionId);

        // Original
        const origAudio = container.querySelector('.audio-original audio');
        const origLabel = container.querySelector('.audio-original .audio-label');
        if (origAudio) {
            origAudio.src = config.originalDir ? `${config.originalDir}/${cls}.mp3` : origPath(cls);
            origAudio.load();
        }
        if (origLabel) origLabel.textContent = `${config.labelOriginal}: ${cls}`;

        // Processed
        const procAudio = container.querySelector('.audio-processed audio');
        const procLabel = container.querySelector('.audio-processed .audio-label');
        if (procAudio) {
            procAudio.src = `${config.audioDir}/${cls}.mp3`;
            procAudio.load();
        }
        if (procLabel) procLabel.textContent = `${config.labelProcessed}: ${cls}`;
    }

    function buildInterpolationSection(sectionId, classes) {
        const container = document.getElementById(sectionId);
        if (!container) return;

        // Prevent audio click events from bubbling to emoji-btn
        const interpAudio = container.querySelector('.interp-player audio');
        interpAudio.addEventListener('click', e => e.stopPropagation());

        const fromSelector = container.querySelector('.emoji-selector-from');
        const toSelector = container.querySelector('.emoji-selector-to');
        const interpLabel = container.querySelector('.interp-player .audio-label');
        let currentFrom = null;
        let currentTo = null;

        function buildSelector(parent, attr) {
            classes.forEach(cls => {
                const btn = document.createElement('button');
                btn.className = 'emoji-btn';
                btn.dataset.class = cls.class;
                btn.innerHTML = `<span class="emoji">${cls.emoji}</span><span class="emoji-label">${cls.class}</span>`;
                btn.addEventListener('click', () => {
                    parent.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (attr === 'from') currentFrom = cls.class;
                    else currentTo = cls.class;
                    onInterpolationUpdate();
                    highlightPairs(container);
                });
                parent.appendChild(btn);
            });
        }

        function onInterpolationUpdate() {
            if (!currentFrom || !currentTo || currentFrom === currentTo) {
                interpAudio.src = '';
                interpLabel.textContent = 'Select two different classes';
                return;
            }
            const path = interpPath(currentFrom, currentTo);
            interpAudio.src = path;
            interpAudio.load();
            interpLabel.textContent = `${currentFrom} → ${currentTo}`;
        }

        buildSelector(fromSelector, 'from');
        buildSelector(toSelector, 'to');

        // Disable matching buttons in opposite selector on hover
        // (visual hint that same-to-same is not allowed)
    }

    function highlightPairs(container) {
        const fromBar = container.querySelector('.emoji-selector-from');
        const toBar = container.querySelector('.emoji-selector-to');
        const fromActive = fromBar?.querySelector('.emoji-btn.active')?.dataset.class;
        const toActive = toBar?.querySelector('.emoji-btn.active')?.dataset.class;

        if (fromActive && toActive && fromActive === toActive) {
            container.querySelector('.interp-player')?.classList.add('invalid');
        } else {
            container.querySelector('.interp-player')?.classList.remove('invalid');
        }
    }

    // --- Init ---
    async function init() {
        // Load all CSVs
        const [resynthClasses, genClasses, interpClasses] = await Promise.all([
            loadClasses(SECTIONS.resynthesis.csv),
            loadClasses(SECTIONS.generation.csv),
            loadClasses(SECTIONS.interpolation.csv),
        ]);

        buildSingleSection('demo-resynthesis', resynthClasses, SECTIONS.resynthesis);
        buildSingleSection('demo-generation', genClasses, SECTIONS.generation);
        buildInterpolationSection('demo-interpolation', interpClasses);
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => SCAPES.init());
