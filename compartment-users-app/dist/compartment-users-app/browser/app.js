let compartments = [];
let forms = [];
let formIdCounter = 0;

const formsContainer = document.getElementById('forms-container');
const addFormBtn = document.getElementById('add-form-btn');
const syncSection = document.getElementById('sync-section');
const syncButton = document.getElementById('sync-button');
const syncMessage = document.getElementById('sync-message');

async function loadCompartments() {
    try {
        const response = await fetch('/api/compartments');
        compartments = await response.json();
    } catch (error) {
        console.error('Eroare la încărcarea compartimentelor:', error);
    }
}

function addForm() {
    const formId = ++formIdCounter;
    const form = {
        id: formId,
        compartment: '',
        users: [],
        selectedUsers: [],
        userSearchTerm: ''
    };
    forms.push(form);
    renderForm(form);
    updateSyncVisibility();
}

function deleteForm(formId) {
    forms = forms.filter(f => f.id !== formId);
    const formEl = document.getElementById(`form-${formId}`);
    if (formEl) formEl.remove();
    updateFormNumbers();
    updateSyncVisibility();
}

function updateFormNumbers() {
    forms.forEach((form, index) => {
        const titleEl = document.querySelector(`#form-${form.id} .form-card-title`);
        if (titleEl) {
            titleEl.textContent = `Formular #${index + 1}`;
        }
    });
}

function renderForm(form) {
    const formCard = document.createElement('div');
    formCard.className = 'form-card';
    formCard.id = `form-${form.id}`;
    
    const formIndex = forms.findIndex(f => f.id === form.id) + 1;
    
    formCard.innerHTML = `
        <div class="form-card-header">
            <span class="form-card-title">Formular #${formIndex}</span>
            <button class="btn-delete" onclick="deleteForm(${form.id})">Șterge</button>
        </div>
        
        <div class="form-group">
            <label>Selectează Compartimentul:</label>
            <div class="autocomplete-wrapper">
                <input type="text" 
                    id="compartment-input-${form.id}" 
                    class="form-control" 
                    placeholder="Caută compartiment..."
                    autocomplete="off">
                <div id="compartment-list-${form.id}" class="autocomplete-list"></div>
            </div>
        </div>
        
        <div class="form-group" id="users-group-${form.id}" style="display: none;">
            <label>Selectează Utilizatori:</label>
            <div class="dropdown-wrapper">
                <div class="dropdown-input-wrapper">
                    <input type="text" 
                        id="users-input-${form.id}" 
                        class="form-control" 
                        placeholder="Caută și selectează utilizatori..."
                        autocomplete="off"
                        readonly>
                    <span class="dropdown-arrow">▼</span>
                </div>
                <div id="users-list-${form.id}" class="dropdown-list">
                    <div class="dropdown-search">
                        <input type="text" 
                            id="users-search-${form.id}" 
                            placeholder="Caută utilizator...">
                    </div>
                    <div id="users-options-${form.id}"></div>
                </div>
            </div>
        </div>
        
        <div class="chips-section" id="chips-section-${form.id}" style="display: none;">
            <h4>Utilizatori Selectați (<span id="selected-count-${form.id}">0</span>)</h4>
            <div id="chips-container-${form.id}" class="chips-container">
                <span class="no-selection">Niciun utilizator selectat</span>
            </div>
        </div>
    `;
    
    formsContainer.appendChild(formCard);
    
    setupCompartmentAutocomplete(form);
    setupUsersDropdown(form);
}

function setupCompartmentAutocomplete(form) {
    const input = document.getElementById(`compartment-input-${form.id}`);
    const list = document.getElementById(`compartment-list-${form.id}`);
    let highlightedIndex = -1;
    
    input.addEventListener('input', () => {
        const value = input.value.toLowerCase();
        const filtered = compartments.filter(c => 
            c.toLowerCase().includes(value)
        );
        
        renderAutocompleteList(filtered, list, form);
        highlightedIndex = -1;
    });
    
    input.addEventListener('focus', () => {
        const value = input.value.toLowerCase();
        const filtered = value 
            ? compartments.filter(c => c.toLowerCase().includes(value))
            : compartments;
        renderAutocompleteList(filtered, list, form);
    });
    
    input.addEventListener('keydown', (e) => {
        const items = list.querySelectorAll('.autocomplete-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
            updateHighlight(items, highlightedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = Math.max(highlightedIndex - 1, 0);
            updateHighlight(items, highlightedIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && items[highlightedIndex]) {
                selectCompartment(form, items[highlightedIndex].dataset.value);
            }
        } else if (e.key === 'Escape') {
            list.classList.remove('active');
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest(`#form-${form.id} .autocomplete-wrapper`)) {
            list.classList.remove('active');
        }
    });
}

function updateHighlight(items, index) {
    items.forEach((item, i) => {
        item.classList.toggle('highlighted', i === index);
    });
}

function renderAutocompleteList(filtered, list, form) {
    if (filtered.length === 0) {
        list.innerHTML = '<div class="no-results">Niciun rezultat găsit</div>';
    } else {
        list.innerHTML = filtered.map(comp => 
            `<div class="autocomplete-item" data-value="${comp}">${comp}</div>`
        ).join('');
        
        list.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                selectCompartment(form, item.dataset.value);
            });
        });
    }
    list.classList.add('active');
}

async function selectCompartment(form, compartment) {
    form.compartment = compartment;
    form.users = [];
    form.selectedUsers = [];
    
    const input = document.getElementById(`compartment-input-${form.id}`);
    const list = document.getElementById(`compartment-list-${form.id}`);
    const usersGroup = document.getElementById(`users-group-${form.id}`);
    const chipsSection = document.getElementById(`chips-section-${form.id}`);
    
    input.value = compartment;
    list.classList.remove('active');
    
    usersGroup.style.display = 'block';
    chipsSection.style.display = 'block';
    
    await loadUsers(form);
    renderChips(form);
    updateSyncVisibility();
}

async function loadUsers(form) {
    try {
        const response = await fetch(`/api/users?compartment=${encodeURIComponent(form.compartment)}`);
        form.users = await response.json();
        renderUsersDropdown(form);
    } catch (error) {
        console.error('Eroare la încărcarea utilizatorilor:', error);
    }
}

function setupUsersDropdown(form) {
    const input = document.getElementById(`users-input-${form.id}`);
    const list = document.getElementById(`users-list-${form.id}`);
    const searchInput = document.getElementById(`users-search-${form.id}`);
    
    input.addEventListener('click', () => {
        list.classList.toggle('active');
        if (list.classList.contains('active')) {
            searchInput.focus();
        }
    });
    
    searchInput.addEventListener('input', () => {
        form.userSearchTerm = searchInput.value;
        renderUsersDropdown(form);
    });
    
    searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest(`#form-${form.id} .dropdown-wrapper`)) {
            list.classList.remove('active');
        }
    });
}

function renderUsersDropdown(form) {
    const optionsContainer = document.getElementById(`users-options-${form.id}`);
    const searchTerm = form.userSearchTerm.toLowerCase();
    
    const filtered = form.users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        optionsContainer.innerHTML = '<div class="no-results">Niciun utilizator găsit</div>';
        return;
    }
    
    optionsContainer.innerHTML = filtered.map(user => {
        const isSelected = form.selectedUsers.some(u => u.id === user.id);
        return `
            <div class="dropdown-item ${isSelected ? 'selected' : ''}" data-user-id="${user.id}">
                <div class="dropdown-item-checkbox">${isSelected ? '✓' : ''}</div>
                <div class="dropdown-item-info">
                    <div class="dropdown-item-name">${user.name}</div>
                    <div class="dropdown-item-email">${user.email}</div>
                </div>
                <span class="dropdown-item-badge">${user.isGroup ? 'Grup' : 'Utilizator'}</span>
            </div>
        `;
    }).join('');
    
    optionsContainer.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = item.dataset.userId;
            toggleUserSelection(form, userId);
        });
    });
}

function toggleUserSelection(form, userId) {
    const user = form.users.find(u => u.id === userId);
    if (!user) return;
    
    const index = form.selectedUsers.findIndex(u => u.id === userId);
    
    if (index > -1) {
        form.selectedUsers.splice(index, 1);
    } else {
        form.selectedUsers.push(user);
    }
    
    renderUsersDropdown(form);
    renderChips(form);
    updateSyncVisibility();
}

function removeUser(formId, userId) {
    const form = forms.find(f => f.id === formId);
    if (!form) return;
    
    form.selectedUsers = form.selectedUsers.filter(u => u.id !== userId);
    renderUsersDropdown(form);
    renderChips(form);
    updateSyncVisibility();
}

function renderChips(form) {
    const container = document.getElementById(`chips-container-${form.id}`);
    const countEl = document.getElementById(`selected-count-${form.id}`);
    
    countEl.textContent = form.selectedUsers.length;
    
    if (form.selectedUsers.length === 0) {
        container.innerHTML = '<span class="no-selection">Niciun utilizator selectat</span>';
    } else {
        container.innerHTML = form.selectedUsers.map(user => `
            <div class="chip">
                <span>${user.name}</span>
                <button class="chip-remove" onclick="removeUser(${form.id}, '${user.id}')">×</button>
            </div>
        `).join('');
    }
}

function updateSyncVisibility() {
    const hasSelectedUsers = forms.some(form => form.selectedUsers.length > 0);
    syncSection.style.display = hasSelectedUsers ? 'block' : 'none';
}

async function syncFormState() {
    const formStates = forms.map(form => ({
        compartment: form.compartment,
        selectedUsers: form.selectedUsers
    })).filter(f => f.compartment && f.selectedUsers.length > 0);
    
    const payload = {
        timestamp: new Date().toISOString(),
        forms: formStates,
        totalForms: formStates.length,
        totalSelectedUsers: formStates.reduce((sum, f) => sum + f.selectedUsers.length, 0)
    };
    
    try {
        syncButton.disabled = true;
        syncButton.textContent = 'Se sincronizează...';
        syncMessage.className = 'message';
        syncMessage.style.display = 'none';
        
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            syncMessage.className = 'message success';
            syncMessage.textContent = 'Formularele au fost sincronizate cu succes!';
        } else {
            syncMessage.className = 'message error';
            syncMessage.textContent = result.message || 'Eroare la sincronizare';
        }
        
        syncButton.disabled = false;
        syncButton.textContent = 'Sincronizează Toate Formularele';
    } catch (error) {
        console.error('Eroare la sincronizare:', error);
        syncMessage.className = 'message error';
        syncMessage.textContent = 'Eroare de rețea. Vă rugăm să încercați din nou.';
        syncButton.disabled = false;
        syncButton.textContent = 'Sincronizează Toate Formularele';
    }
}

window.deleteForm = deleteForm;
window.removeUser = removeUser;

addFormBtn.addEventListener('click', addForm);
syncButton.addEventListener('click', syncFormState);

loadCompartments().then(() => {
    addForm();
});
