document.addEventListener('DOMContentLoaded', function() {
    const bibtexBoxes = document.querySelectorAll('.bibtex-box');
    
    bibtexBoxes.forEach(box => {
        const src = box.getAttribute('data-bibtex-src');
        if (!src) return;
        
        fetch(src)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load BibTeX');
                return response.text();
            })
            .then(bibtexText => {
                const pre = document.createElement('pre');
                pre.textContent = bibtexText.trim();
                box.appendChild(pre);
                
                box.addEventListener('click', function() {
                    navigator.clipboard.writeText(bibtexText.trim())
                        .then(() => {
                            const message = document.createElement('div');
                            message.textContent = 'Copied to clipboard';
                            message.style.cssText = `
                                position: absolute;
                                top: 0;
                                left: 50%;
                                transform: translateX(-50%);
                                background-color: rgba(0, 0, 0, 0.8);
                                color: white;
                                padding: 0.5rem 1rem;
                                border-radius: 4px;
                                font-size: 0.9rem;
                                pointer-events: none;
                                z-index: 1000;
                            `;
                            box.style.position = 'relative';
                            box.appendChild(message);
                            
                            setTimeout(() => {
                                message.remove();
                            }, 1500);
                        })
                        .catch(err => {
                            console.error('Failed to copy to clipboard:', err);
                        });
                });
            })
            .catch(error => {
                console.error('Error loading BibTeX:', error);
                box.textContent = 'Error loading citation';
            });
    });
});
