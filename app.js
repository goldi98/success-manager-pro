// State management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let priorities = JSON.parse(localStorage.getItem('priorities')) || [];
let journals = JSON.parse(localStorage.getItem('journals')) || [];
let currentCalendarDate = new Date();

// DOM Elements
const navLinks = document.querySelectorAll('.nav-links li');
const sections = document.querySelectorAll('.section');
const taskList = document.getElementById('taskList');
const notesList = document.getElementById('notesList');
const goalsList = document.getElementById('goalsList');
const calendarDays = document.getElementById('calendarDays');
const currentMonthDisplay = document.getElementById('currentMonth');
const dayDetailsContent = document.getElementById('dayDetailsContent');
const taskForm = document.getElementById('taskForm');
const goalForm = document.getElementById('goalForm');
const noteForm = document.getElementById('noteForm');
const priorityFilter = document.getElementById('priorityFilter');
const statusFilter = document.getElementById('statusFilter');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    renderAll();
});

function initializeApp() {
    // Set default date for new tasks and goals
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // Set default dates in forms
    const taskDueDate = document.querySelector('#taskForm #dueDate');
    const goalDueDate = document.querySelector('#goalForm #dueDate');
    
    if (taskDueDate) taskDueDate.value = formattedDate;
    if (goalDueDate) goalDueDate.value = formattedDate;
    
    // Initialize calendar
    updateCalendar();
}

function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetSection = link.getAttribute('data-section');
            switchSection(targetSection);
        });
    });

    // Task Form
    taskForm.addEventListener('submit', handleTaskSubmit);

    // Goal Form
    goalForm.addEventListener('submit', handleGoalSubmit);

    // Note Form
    noteForm.addEventListener('submit', handleNoteSubmit);

    // Filters
    priorityFilter.addEventListener('change', renderTasks);
    statusFilter.addEventListener('change', renderTasks);

    // Calendar Navigation
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Priority Form
    const priorityForm = document.getElementById('priorityForm');
    if (priorityForm) {
        priorityForm.addEventListener('submit', handlePrioritySubmit);
    }

    // Journal Form
    const journalForm = document.getElementById('journalForm');
    if (journalForm) {
        journalForm.addEventListener('submit', handleJournalSubmit);
    }

    // Notes/Journal Tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

// Section Switching
function switchSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    // If switching to calendar, update it
    if (sectionId === 'calendar') {
        updateCalendar();
    }
}

// Modal Management
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Task Management
function handleTaskSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const task = {
        id: Date.now(),
        title: form.title.value,
        description: form.description.value,
        priority: form.priority.value,
        dueDate: form.dueDate.value,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    tasks.push(task);
    saveTasks();
    renderTasks();
    updateCalendar();
    closeModal();
    form.reset();
    
    // Show success message
    showNotification('Task added successfully!');
}

function updateTaskStatus(taskId, status) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = status;
        saveTasks();
        renderTasks();
        updateCalendar();
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    updateCalendar();
    showNotification('Task deleted successfully!');
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const form = document.getElementById('taskForm');
        form.title.value = task.title;
        form.description.value = task.description;
        form.priority.value = task.priority;
        form.dueDate.value = task.dueDate;
        
        // Remove the old task
        deleteTask(taskId);
        
        showModal('taskModal');
    }
}

// Goal Management
function handleGoalSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Check if we already have 5 goals
    if (goals.length >= 5) {
        showNotification('Maximum of 5 goals allowed. Please complete or delete existing goals first.', 'error');
        return;
    }
    
    const goal = {
        id: Date.now(),
        title: form.title.value,
        description: form.description.value,
        priority: form.priority.value,
        dueDate: form.dueDate.value,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    goals.push(goal);
    saveGoals();
    renderGoals();
    updateCalendar();
    closeModal();
    form.reset();
    
    // Show success message
    showNotification('Goal added successfully!');
}

function updateGoalStatus(goalId, status) {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        goal.status = status;
        saveGoals();
        renderGoals();
        updateCalendar();
    }
}

function deleteGoal(goalId) {
    goals = goals.filter(g => g.id !== goalId);
    saveGoals();
    renderGoals();
    updateCalendar();
    showNotification('Goal deleted successfully!');
}

function editGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        const form = document.getElementById('goalForm');
        form.title.value = goal.title;
        form.description.value = goal.description;
        form.priority.value = goal.priority;
        form.dueDate.value = goal.dueDate;
        
        // Remove the old goal
        deleteGoal(goalId);
        
        showModal('goalModal');
    }
}

// Note Management
function handleNoteSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const note = {
        id: Date.now(),
        title: form.title.value,
        content: form.content.value,
        createdAt: new Date().toISOString()
    };
    
    notes.push(note);
    saveNotes();
    renderNotes();
    updateCalendar();
    closeModal();
    form.reset();
    
    // Show success message
    showNotification('Note added successfully!');
}

function deleteNote(noteId) {
    notes = notes.filter(n => n.id !== noteId);
    saveNotes();
    renderNotes();
    updateCalendar();
    showNotification('Note deleted successfully!');
}

function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        const form = document.getElementById('noteForm');
        form.title.value = note.title;
        form.content.value = note.content;
        
        // Remove the old note
        deleteNote(noteId);
        
        showModal('noteModal');
    }
}

// Calendar Management
function navigateMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    updateCalendar();
}

function updateCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Update month display
    currentMonthDisplay.textContent = new Date(year, month).toLocaleDateString('default', { 
        month: 'long', 
        year: 'numeric' 
    });

    // Clear previous calendar
    calendarDays.innerHTML = '';

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        
        // Check if it's today
        if (isToday(date)) {
            dayElement.classList.add('today');
        }

        // Check for events
        const hasTasks = tasks.some(t => t.dueDate === dateString);
        const hasNotes = notes.some(n => n.createdAt.startsWith(dateString));
        const hasGoals = goals.some(g => g.dueDate === dateString);
        const hasJournal = journals.some(j => j.date === dateString);

        if (hasTasks || hasNotes || hasGoals || hasJournal) {
            dayElement.classList.add('has-events');
            
            const indicators = document.createElement('div');
            indicators.className = 'event-indicators';
            
            if (hasTasks) {
                const taskIndicator = document.createElement('div');
                taskIndicator.className = 'event-indicator task';
                indicators.appendChild(taskIndicator);
            }
            if (hasNotes) {
                const noteIndicator = document.createElement('div');
                noteIndicator.className = 'event-indicator note';
                indicators.appendChild(noteIndicator);
            }
            if (hasGoals) {
                const goalIndicator = document.createElement('div');
                goalIndicator.className = 'event-indicator goal';
                indicators.appendChild(goalIndicator);
            }
            if (hasJournal) {
                const journalIndicator = document.createElement('div');
                journalIndicator.className = 'event-indicator journal';
                journalIndicator.style.background = '#9b59b6';
                indicators.appendChild(journalIndicator);
            }
            
            dayElement.appendChild(indicators);
        }

        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        dateSpan.textContent = day;
        dayElement.insertBefore(dateSpan, dayElement.firstChild);

        dayElement.addEventListener('click', () => showDayDetails(date));
        calendarDays.appendChild(dayElement);
    }
}

function showDayDetails(date) {
    const dateString = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.dueDate === dateString);
    const dayNotes = notes.filter(n => n.createdAt.startsWith(dateString));
    const dayGoals = goals.filter(g => g.dueDate === dateString);
    const dayJournals = journals.filter(j => j.date === dateString);

    let content = `<h3>${date.toLocaleDateString('default', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}</h3>`;

    // Journal Section
    if (dayJournals.length > 0) {
        content += `
            <div class="day-details-section">
                <h4>Journal Entry</h4>
                ${dayJournals.map(journal => `
                    <div class="day-details-item">
                        <div class="journal-section">
                            <h4>What went well:</h4>
                            <p>${journal.goodThings}</p>
                        </div>
                        <div class="journal-section">
                            <h4>Learnings:</h4>
                            <p>${journal.learnings}</p>
                        </div>
                        <div class="journal-section">
                            <h4>Areas for improvement:</h4>
                            <p>${journal.improvements}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Tasks Section
    if (dayTasks.length > 0) {
        content += `
            <div class="day-details-section">
                <h4>Tasks</h4>
                ${dayTasks.map(task => `
                    <div class="day-details-item ${task.priority}">
                        <div class="title">${task.title}</div>
                        <div class="description">${task.description}</div>
                        <div class="meta">
                            <span>Priority: ${task.priority}</span>
                            <span>Status: ${task.status}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Notes Section
    if (dayNotes.length > 0) {
        content += `
            <div class="day-details-section">
                <h4>Notes</h4>
                ${dayNotes.map(note => `
                    <div class="day-details-item">
                        <div class="title">${note.title}</div>
                        <div class="description">${note.content}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Goals Section
    if (dayGoals.length > 0) {
        content += `
            <div class="day-details-section">
                <h4>Goals</h4>
                ${dayGoals.map(goal => `
                    <div class="day-details-item ${goal.priority}">
                        <div class="title">${goal.title}</div>
                        <div class="description">${goal.description}</div>
                        <div class="meta">
                            <span>Priority: ${goal.priority}</span>
                            <span>Status: ${goal.status}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (dayTasks.length === 0 && dayNotes.length === 0 && dayGoals.length === 0 && dayJournals.length === 0) {
        content += '<p>No events for this day.</p>';
    }

    dayDetailsContent.innerHTML = content;
    showModal('dayDetailsModal');
}

// Helper Functions
function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function saveGoals() {
    localStorage.setItem('goals', JSON.stringify(goals));
}

function savePriorities() {
    localStorage.setItem('priorities', JSON.stringify(priorities));
}

function saveJournals() {
    localStorage.setItem('journals', JSON.stringify(journals));
}

// Notification system
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Rendering Functions
function renderTasks() {
    const priorityValue = priorityFilter.value;
    const statusValue = statusFilter.value;
    
    let filteredTasks = tasks;
    
    if (priorityValue !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === priorityValue);
    }
    
    if (statusValue !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.status === statusValue);
    }
    
    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.priority}">
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="task-actions">
                    <button onclick="editTask(${task.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTask(${task.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="task-description">${task.description}</div>
            <div class="task-meta">
                <span>Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
                <span>Priority: ${task.priority}</span>
                <span>Status: ${task.status}</span>
            </div>
        </div>
    `).join('');
}

function renderNotes() {
    notesList.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-header">
                <div class="note-title">${note.title}</div>
                <div class="note-actions">
                    <button onclick="editNote(${note.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteNote(${note.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="note-date">${new Date(note.createdAt).toLocaleDateString()}</div>
            <div class="note-content">${note.content}</div>
        </div>
    `).join('');
}

function renderGoals() {
    goalsList.innerHTML = goals.map(goal => `
        <div class="goal-item ${goal.priority}">
            <div class="goal-header">
                <div class="goal-title">${goal.title}</div>
                <div class="goal-actions">
                    <button onclick="editGoal(${goal.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteGoal(${goal.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="goal-description">${goal.description}</div>
            <div class="goal-meta">
                <span>Due: ${new Date(goal.dueDate).toLocaleDateString()}</span>
                <span>Priority: ${goal.priority}</span>
                <span>Status: ${goal.status}</span>
            </div>
        </div>
    `).join('');
}

function renderPriorities() {
    // Clear all matrix cells
    document.querySelectorAll('.matrix-items').forEach(cell => {
        cell.innerHTML = '';
    });
    
    // Sort priorities by creation date (newest first)
    priorities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Render priorities in their respective cells
    priorities.forEach(priority => {
        const cell = document.querySelector(`#${priority.type} .matrix-items`);
        if (cell) {
            cell.innerHTML += `
                <div class="priority-item">
                    <div class="title">${priority.title}</div>
                    <div class="description">${priority.description}</div>
                    <button class="btn-icon" onclick="deletePriority(${priority.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
    });
}

function renderJournals() {
    const journalList = document.getElementById('journalList');
    journalList.innerHTML = journals
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(journal => `
            <div class="journal-item">
                <div class="journal-header">
                    <div class="journal-date">${new Date(journal.date).toLocaleDateString('default', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric'
                    })}</div>
                    <div class="journal-actions">
                        <button onclick="editJournal(${journal.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteJournal(${journal.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="journal-section">
                    <h4>What went well:</h4>
                    <p>${journal.goodThings}</p>
                </div>
                <div class="journal-section">
                    <h4>Learnings:</h4>
                    <p>${journal.learnings}</p>
                </div>
                <div class="journal-section">
                    <h4>Areas for improvement:</h4>
                    <p>${journal.improvements}</p>
                </div>
            </div>
        `).join('');
}

function renderAll() {
    renderTasks();
    renderNotes();
    renderGoals();
    renderPriorities();
    renderJournals();
    updateCalendar();
}

// Priority Matrix Management
function handlePrioritySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const priority = {
        id: Date.now(),
        title: form.title.value,
        description: form.description.value,
        type: form.priorityType.value,
        createdAt: new Date().toISOString()
    };
    
    priorities.push(priority);
    savePriorities();
    renderPriorities();
    closeModal();
    form.reset();
    
    showNotification('Priority item added successfully!');
}

function deletePriority(priorityId) {
    priorities = priorities.filter(p => p.id !== priorityId);
    savePriorities();
    renderPriorities();
    showNotification('Priority item deleted successfully!');
}

// Journal Management
function handleJournalSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const journal = {
        id: Date.now(),
        date: form.date.value,
        goodThings: form.goodThings.value,
        learnings: form.learnings.value,
        improvements: form.improvements.value,
        createdAt: new Date().toISOString()
    };
    
    journals.push(journal);
    saveJournals();
    renderJournals();
    updateCalendar();
    closeModal();
    form.reset();
    
    showNotification('Journal entry added successfully!');
}

function deleteJournal(journalId) {
    journals = journals.filter(j => j.id !== journalId);
    saveJournals();
    renderJournals();
    updateCalendar();
    showNotification('Journal entry deleted successfully!');
}

function editJournal(journalId) {
    const journal = journals.find(j => j.id === journalId);
    if (journal) {
        const form = document.getElementById('journalForm');
        form.date.value = journal.date;
        form.goodThings.value = journal.goodThings;
        form.learnings.value = journal.learnings;
        form.improvements.value = journal.improvements;
        
        // Remove the old journal entry
        deleteJournal(journalId);
        
        showModal('journalModal');
    }
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    if (tabName === 'notes') {
        document.getElementById('notesList').classList.add('active');
    } else {
        document.getElementById('journalList').classList.add('active');
    }
} 