// Main Dashboard Controller
document.addEventListener('DOMContentLoaded', () => {
    // Add hidden input for trade type if not exists
    if (!document.getElementById('tradeType')) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'tradeType';
        hiddenInput.value = 'CALL';
        document.body.appendChild(hiddenInput);
    }
    
    // Mobile sidebar toggle (for responsive)
    const createMobileToggle = () => {
        const topBar = document.querySelector('.top-bar');
        if (topBar && window.innerWidth <= 768) {
            const toggleBtn = document.createElement('button');
            toggleBtn.innerHTML = '☰';
            toggleBtn.style.background = 'none';
            toggleBtn.style.border = 'none';
            toggleBtn.style.color = '#fff';
            toggleBtn.style.fontSize = '1.5rem';
            toggleBtn.style.cursor = 'pointer';
            toggleBtn.onclick = () => {
                document.querySelector('.sidebar').classList.toggle('open');
            };
            topBar.insertBefore(toggleBtn, topBar.firstChild);
        }
    };
    
    createMobileToggle();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.querySelector('.sidebar')?.classList.remove('open');
        }
    });
});
