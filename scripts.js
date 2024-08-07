let currentUser = null;
let map = null;

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authSection = document.getElementById('authSection');
const journalSection = document.getElementById('journalSection');
const commentSection = document.getElementById('commentSection');
const authForm = document.getElementById('authForm');
const journalForm = document.getElementById('journalForm');
const searchBtn = document.getElementById('searchBtn');
const entriesDiv = document.getElementById('entries');
const commentForm = document.getElementById('commentForm');
const commentsDiv = document.getElementById('comments');
const themeToggle = document.getElementById('themeToggle');

// Event Listeners
loginBtn.addEventListener('click', showAuthForm);
logoutBtn.addEventListener('click', logout);
authForm.addEventListener('submit', handleAuth);
journalForm.addEventListener('submit', handleJournalSubmit);
searchBtn.addEventListener('click', handleSearch);
commentForm.addEventListener('submit', handleCommentSubmit);
themeToggle.addEventListener('click', toggleTheme);

function init() {
    const savedUser = JSON.parse(localStorage.getItem('currentUser'));
    if (savedUser) {
        currentUser = savedUser;
        updateUIOnLogin();
    }
    initMap();
    loadEntries();
    loadComments();
    setInitialTheme();
}

// Theme functions
function setInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Authentication functions
function showAuthForm() {
    authSection.style.display = 'block';
    loginBtn.style.display = 'none';
}

function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    // In a real app, you'd hash the password and verify against a server
    currentUser = { username, password };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUIOnLogin();
}

function updateUIOnLogin() {
    authSection.style.display = 'none';
    journalSection.style.display = 'block';
    commentSection.style.display = 'block';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    loadEntries();
    loadComments();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    authSection.style.display = 'block';
    journalSection.style.display = 'none';
    commentSection.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    entriesDiv.innerHTML = '';
    commentsDiv.innerHTML = '';
}

// Journal functions
function handleJournalSubmit(e) {
    e.preventDefault();
    const location = document.getElementById('location').value;
    const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
    const description = document.getElementById('description').value;
    const photoInput = document.getElementById('photo');
    const photo = photoInput.files[0];

    const entry = {
        id: Date.now(),
        location,
        tags,
        description,
        photo: photo ? URL.createObjectURL(photo) : null,
        username: currentUser.username
    };

    saveEntry(entry);
    journalForm.reset();
    loadEntries();
}

function saveEntry(entry) {
    let entries = JSON.parse(localStorage.getItem('entries')) || [];
    entries.push(entry);
    localStorage.setItem('entries', JSON.stringify(entries));
}

function loadEntries() {
    if (!currentUser) return;
    const entries = JSON.parse(localStorage.getItem('entries')) || [];
    entriesDiv.innerHTML = '';
    entries.filter(entry => entry.username === currentUser.username).forEach(displayEntry);
}

function displayEntry(entry) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'entry';
    entryDiv.innerHTML = `
        <h3><i class="fas fa-map-marker-alt"></i> ${entry.location}</h3>
        <p>${entry.description}</p>
        <p><i class="fas fa-tags"></i> ${entry.tags.join(', ')}</p>
        ${entry.photo ? `<img src="${entry.photo}" alt="Travel photo">` : ''}
        <div class="entry-actions">
            <button onclick="editEntry(${entry.id})"><i class="fas fa-edit"></i> Edit</button>
            <button onclick="deleteEntry(${entry.id})"><i class="fas fa-trash-alt"></i> Delete</button>
        </div>
    `;
    entriesDiv.appendChild(entryDiv);
    if (map) {
        addMarkerToMap(entry.location);
    }
}

function editEntry(id) {
    const entries = JSON.parse(localStorage.getItem('entries')) || [];
    const entry = entries.find(e => e.id === id);
    if (entry) {
        document.getElementById('location').value = entry.location;
        document.getElementById('tags').value = entry.tags.join(', ');
        document.getElementById('description').value = entry.description;
        // Remove the old entry and add the updated one on form submit
        deleteEntry(id);
    }
}

function deleteEntry(id) {
    let entries = JSON.parse(localStorage.getItem('entries')) || [];
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('entries', JSON.stringify(entries));
    loadEntries();
}

function handleSearch() {
    const searchLocation = document.getElementById('searchLocation').value.toLowerCase();
    const searchTags = document.getElementById('searchTags').value.toLowerCase().split(',').map(tag => tag.trim());
    const entries = JSON.parse(localStorage.getItem('entries')) || [];
    const filteredEntries = entries.filter(entry => 
        entry.username === currentUser.username &&
        (searchLocation === '' || entry.location.toLowerCase().includes(searchLocation)) &&
        (searchTags.length === 0 || searchTags.every(tag => entry.tags.map(t => t.toLowerCase()).includes(tag)))
    );
    entriesDiv.innerHTML = '';
    filteredEntries.forEach(displayEntry);
}

// Map functions
function initMap() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function addMarkerToMap(location) {
    // In a real app, you'd use a geocoding service to get coordinates
    const randomLat = Math.random() * 180 - 90;
    const randomLng = Math.random() * 360 - 180;
    L.marker([randomLat, randomLng]).addTo(map)
        .bindPopup(location)
        .openPopup();
}

// Comment functions
function handleCommentSubmit(e) {
    e.preventDefault();
    const commentText = document.getElementById('commentText').value;
    const comment = {
        id: Date.now(),
        text: commentText,
        username: currentUser.username
    };
    saveComment(comment);
    commentForm.reset();
    loadComments();
}

function saveComment(comment) {
    let comments = JSON.parse(localStorage.getItem('comments')) || [];
    comments.push(comment);
    localStorage.setItem('comments', JSON.stringify(comments));
}

function loadComments() {
    const comments = JSON.parse(localStorage.getItem('comments')) || [];
    commentsDiv.innerHTML = '';
    comments.forEach(displayComment);
}

function displayComment(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.innerHTML = `
        <p>${comment.text}</p>
        <p><i class="fas fa-user"></i> ${comment.username}</p>
        ${currentUser && comment.username === currentUser.username ? 
            `<button onclick="deleteComment(${comment.id})"><i class="fas fa-trash-alt"></i> Delete</button>` : ''}
    `;
    commentsDiv.appendChild(commentDiv);
}

function deleteComment(id) {
    let comments = JSON.parse(localStorage.getItem('comments')) || [];
    comments = comments.filter(comment => comment.id !== id);
    localStorage.setItem('comments', JSON.stringify(comments));
    loadComments();
}

// Initialize the app
init();
