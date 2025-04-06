// Add to the top of the file with other state variables
let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
let lastTouchY = 0;
let pullToRefreshThreshold = 60;
let isRefreshing = false;

// Add to setupEventListeners function
function setupEventListeners() {
    // ... existing event listeners ...

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Handle mobile scrolling in matrix cells
    document.querySelectorAll('.matrix-cell').forEach(cell => {
        let touchStartY;
        
        cell.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        cell.addEventListener('touchmove', (e) => {
            if (!touchStartY) return;
            
            const touchY = e.touches[0].clientY;
            const scrollTop = cell.scrollTop;
            const scrollHeight = cell.scrollHeight;
            const clientHeight = cell.clientHeight;
            
            // Allow scrolling if not at the top or bottom
            if ((scrollTop > 0 && touchY > touchStartY) || 
                (scrollTop < scrollHeight - clientHeight && touchY < touchStartY)) {
                e.stopPropagation();
            }
        }, { passive: true });
    });

    // Pull to refresh
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.addEventListener('touchstart', handleTouchStart, { passive: true });
        mainContent.addEventListener('touchmove', handleTouchMove, { passive: true });
        mainContent.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Swipe to delete
    document.querySelectorAll('.priority-item, .note-item').forEach(item => {
        setupSwipeToDelete(item);
    });
}

// Add pull to refresh handlers
function handleTouchStart(e) {
    if (document.querySelector('.main-content').scrollTop === 0) {
        lastTouchY = e.touches[0].clientY;
    }
}

function handleTouchMove(e) {
    if (!lastTouchY) return;

    const touchY = e.touches[0].clientY;
    const diff = touchY - lastTouchY;
    
    if (diff > 0 && !isRefreshing) {
        const pullToRefresh = document.querySelector('.pull-to-refresh');
        if (pullToRefresh) {
            const progress = Math.min(diff / pullToRefreshThreshold, 1);
            pullToRefresh.style.transform = `translateY(${diff}px)`;
            
            if (progress >= 1) {
                pullToRefresh.classList.add('ready');
            } else {
                pullToRefresh.classList.remove('ready');
            }
        }
    }
}

function handleTouchEnd(e) {
    if (!lastTouchY) return;

    const touchY = e.changedTouches[0].clientY;
    const diff = touchY - lastTouchY;
    
    if (diff >= pullToRefreshThreshold) {
        refreshContent();
    } else {
        const pullToRefresh = document.querySelector('.pull-to-refresh');
        if (pullToRefresh) {
            pullToRefresh.style.transform = '';
            pullToRefresh.classList.remove('ready');
        }
    }
    
    lastTouchY = 0;
}

// Add refresh content function
async function refreshContent() {
    const pullToRefresh = document.querySelector('.pull-to-refresh');
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    if (pullToRefresh && loadingOverlay) {
        isRefreshing = true;
        pullToRefresh.classList.add('active');
        loadingOverlay.classList.add('active');
        
        try {
            // Refresh data
            await Promise.all([
                loadTasks(),
                loadNotes(),
                loadGoals(),
                updateCalendar()
            ]);
            
            // Show success notification
            showNotification('Content refreshed successfully', 'success');
        } catch (error) {
            showNotification('Failed to refresh content', 'error');
        } finally {
            setTimeout(() => {
                pullToRefresh.style.transform = '';
                pullToRefresh.classList.remove('active', 'ready');
                loadingOverlay.classList.remove('active');
                isRefreshing = false;
            }, 500);
        }
    }
}

// Add swipe to delete setup
function setupSwipeToDelete(element) {
    let touchStartX = 0;
    let touchStartY = 0;
    let currentX = 0;
    let initialX = 0;
    let xDiff = 0;
    let yDiff = 0;
    let isHorizontalSwipe = false;

    element.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        initialX = element.getBoundingClientRect().x;
        isHorizontalSwipe = false;
    }, { passive: true });

    element.addEventListener('touchmove', e => {
        if (!touchStartX || !touchStartY) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;

        xDiff = touchStartX - touchX;
        yDiff = touchStartY - touchY;

        // Determine if horizontal swipe
        if (!isHorizontalSwipe && Math.abs(xDiff) > Math.abs(yDiff)) {
            isHorizontalSwipe = true;
        }

        if (isHorizontalSwipe) {
            currentX = touchX - touchStartX;
            
            // Limit swipe to left only and max of 100px
            currentX = Math.max(-100, Math.min(0, currentX));
            
            element.style.transform = `translateX(${currentX}px)`;
            e.preventDefault();
        }
    });

    element.addEventListener('touchend', e => {
        if (currentX < -50) {
            // Show delete confirmation
            element.style.transform = 'translateX(-100px)';
            
            const id = element.dataset.id;
            const type = element.dataset.type;
            
            if (id && type) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'swipe-delete';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.onclick = () => deleteItem(id, type);
                
                const actions = document.createElement('div');
                actions.className = 'swipe-actions';
                actions.appendChild(deleteBtn);
                
                element.appendChild(actions);
                setTimeout(() => actions.style.transform = 'translateX(0)', 0);
            }
        } else {
            // Reset position
            element.style.transform = '';
        }
        
        touchStartX = 0;
        touchStartY = 0;
        currentX = 0;
        xDiff = 0;
        yDiff = 0;
        isHorizontalSwipe = false;
    });
}

// Add delete item function
async function deleteItem(id, type) {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.add('active');
    
    try {
        switch(type) {
            case 'task':
                await deleteTask(id);
                break;
            case 'note':
                await deleteNote(id);
                break;
            case 'goal':
                await deleteGoal(id);
                break;
        }
        
        // Remove element from DOM
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.style.height = '0';
            element.style.opacity = '0';
            element.style.margin = '0';
            element.style.padding = '0';
            setTimeout(() => element.remove(), 300);
        }
        
        showNotification('Item deleted successfully', 'success');
    } catch (error) {
        showNotification('Failed to delete item', 'error');
        // Reset element position
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.style.transform = '';
            const actions = element.querySelector('.swipe-actions');
            if (actions) actions.remove();
        }
    } finally {
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
}

// Add notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('active'), 0);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add theme toggle function
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    localStorage.setItem('darkMode', isDarkMode);
}

// Add to initializeApp function
function initializeApp() {
    // ... existing initialization code ...

    // Initialize theme
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
        isDarkMode = savedDarkMode === 'true';
        document.body.classList.toggle('dark-mode', isDarkMode);
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Update showModal function to handle mobile better
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        
        // Focus first input in modal
        const firstInput = modal.querySelector('input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
        
        // Handle mobile keyboard
        const form = modal.querySelector('form');
        if (form) {
            form.addEventListener('focusin', (e) => {
                if (/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    modal.scrollTop = e.target.offsetTop - 100;
                }
            });
        }
    }
}

// ... rest of existing code ... 