// Efeito de marcador de texto (highlight) que anima suavemente da esquerda 
// para a direita quando o trecho entra na visualização (scroll):
function animateHighlight() {
    const highlights = document.querySelectorAll('.highlight');

    highlights.forEach(span => {
        // Primeiro, remove as camadas de destaque existentes para lidar com o redimensionamento.
        span.querySelectorAll('.highlight-layer').forEach(layer => layer.remove());

        // Cria as novas camadas com base nas dimensões atuais.
        const range = document.createRange();
        range.selectNodeContents(span);
        const rects = Array.from(range.getClientRects());

        rects.forEach((rect, index) => {
            const marker = document.createElement('div');
            marker.classList.add('highlight-layer');

            // Posicionamento absoluto relativo ao container
            const containerRect = span.getBoundingClientRect();
            marker.style.top = `${rect.top - containerRect.top}px`;
            marker.style.left = `${rect.left - containerRect.left}px`;
            marker.style.height = `${rect.height}px`;

            // delay animado por linha
            marker.style.transitionDelay = `${index * 600}ms`;

            span.appendChild(marker);

            // força reflow antes de ativar animação
            requestAnimationFrame(() => {
                marker.style.width = `${rect.width}px`;
            });
        });
    });
}

// Função "debounce" para otimizar a execução no redimensionamento da janela.
// Evita que a função seja chamada excessivamente enquanto o usuário redimensiona.
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// A animação de destaque agora é chamada dentro de updateUI()
// sempre que uma página é carregada, tornando o IntersectionObserver
// desnecessário para este caso de uso.

// Recalcula o destaque ao redimensionar a janela, usando o debounce.
window.addEventListener('resize', debounce(animateHighlight, 250));


/* --------------------------------------------------------------------------------------- */

/* ---------------- FLIPBOOK 3D ---------------- */
function initializeFlipbook() {
    const flipbookContainer = document.querySelector('.high-fidelity-3d-flipbook');
    if (!flipbookContainer) return; // Sai se o flipbook não estiver na página atual

    const prevBtn = document.getElementById('flipbook-prev-btn');
    const nextBtn = document.getElementById('flipbook-next-btn');
    const book = document.getElementById('book');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const pages = book.querySelectorAll('.page');

    // Previne erro se os elementos não forem encontrados
    if (!prevBtn || !nextBtn || !book || !fullscreenBtn || !pages || pages.length === 0) {
        console.error("Um ou mais elementos do flipbook não foram encontrados. A inicialização falhou.", { prevBtn, nextBtn, book, fullscreenBtn, pages });
        return;
    }

    const originalParent = flipbookContainer.parentElement;
    const placeholder = document.getElementById('flipbook-placeholder');

    let currentLocation = 1;
    const numOfPages = pages.length;
    const maxLocation = numOfPages + 1;

    // Adiciona event listeners para navegação por clique na página
    pages.forEach((page, index) => {
        page.style.zIndex = numOfPages - index;

        page.addEventListener('click', (event) => {
            const pageRect = page.getBoundingClientRect();
            const clickX = event.clientX - pageRect.left; // Posição X relativa à página

            if (clickX < pageRect.width / 2) {
                goPrevPage(); // Clicou na metade esquerda
            } else {
                goNextPage(); // Clicou na metade direita
            }
        });
    });

    function openBook() {
        book.style.transform = "translateX(50%)";
        prevBtn.style.transform = "translateX(-120px)";
        nextBtn.style.transform = "translateX(120px)";
    }

    function closeBook(isAtBeginning) {
        if (isAtBeginning) {
            book.style.transform = "translateX(0%)";
        } else {
            book.style.transform = "translateX(100%)";
        }
        prevBtn.style.transform = "translateX(0)";
        nextBtn.style.transform = "translateX(0)";
    }

    function goNextPage() {
        if (currentLocation < maxLocation) {
            if (currentLocation === 1) {
                openBook();
            }
            const pageToFlip = pages[currentLocation - 1];
            pageToFlip.classList.add('flipped');
            pageToFlip.style.zIndex = currentLocation;
            if (currentLocation === numOfPages) {
                closeBook(false);
            }
            currentLocation++;
            updateButtons();
        }
    }

    function goPrevPage() {
        if (currentLocation > 1) {
            if (currentLocation === 2) {
                closeBook(true);
            } else if (currentLocation === maxLocation) {
                openBook();
            }
            const pageToUnflip = pages[currentLocation - 2];
            pageToUnflip.classList.remove('flipped');
            const originalZIndex = numOfPages - (currentLocation - 2);
            setTimeout(() => {
                pageToUnflip.style.zIndex = originalZIndex;
            }, 300);
            currentLocation--;
            updateButtons();
        }
    }

    function updateButtons() {
        prevBtn.disabled = currentLocation === 1;
        nextBtn.disabled = currentLocation === maxLocation;
    }

    function toggleFullscreen() {
        const isFullscreen = flipbookContainer.classList.toggle('fullscreen-mode');
        if (isFullscreen) {
            // Move o flipbook para o body para escapar do container pai
            document.body.appendChild(flipbookContainer);
        } else {
            // Devolve o flipbook para seu local original
            placeholder.parentElement.insertBefore(flipbookContainer, placeholder.nextSibling);
        }
    }

    function closeFullscreen(event) {
        // Fecha se o clique for no próprio container (fundo) e não nos seus filhos (livro, botões)
        if (event.target === flipbookContainer) {
            flipbookContainer.classList.remove('fullscreen-mode');
        }
    }

    // Limpa listeners antigos para evitar duplicação em re-renderizações
    nextBtn.onclick = goNextPage;
    prevBtn.onclick = goPrevPage;
    fullscreenBtn.onclick = toggleFullscreen;
    closeBtn.onclick = () => flipbookContainer.classList.remove('fullscreen-mode');
    // Adiciona listener para fechar ao clicar no fundo
    flipbookContainer.addEventListener('click', closeFullscreen);

    // Atualiza o estado inicial dos botões
    updateButtons();
}

document.addEventListener('keydown', (event) => {
    if (event.key === "Escape" && document.querySelector('.high-fidelity-3d-flipbook.fullscreen-mode')) {
        const flipbook = document.querySelector('.high-fidelity-3d-flipbook.fullscreen-mode');
        if (flipbook) { // Garante que o flipbook ainda existe
            flipbook.classList.remove('fullscreen-mode');
            document.getElementById('flipbook-placeholder').parentElement.insertBefore(flipbook, document.getElementById('flipbook-placeholder').nextSibling);
        }
    }
});