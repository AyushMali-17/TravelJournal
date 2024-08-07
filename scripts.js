// Simple Authentication
document.getElementById('login').addEventListener('click', login);
document.getElementById('logout').addEventListener('click', logout);

function login() {
  const username = document.getElementById('username').value;
  if (username) {
    localStorage.setItem('username', username);
    document.getElementById('auth').classList.remove('fade-in');
    document.getElementById('journalForm').classList.add('fade-in');
    document.getElementById('logout').style.display = 'block';
    loadEntries();
    loadComments();
  } else {
    alert('Please enter a username.');
  }
}

function logout() {
  localStorage.removeItem('username');
  document.getElementById('auth').classList.add('fade-in');
  document.getElementById('journalForm').classList.remove('fade-in');
  document.getElementById('logout').style.display = 'none';
  document.getElementById('entries').innerHTML = '';
  document.getElementById('comments').innerHTML = '';
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
}

// Journal Entries
document.getElementById('journalForm').addEventListener('submit', function(e) {
  e.preventDefault();
  updateEntry(Date.now());
});

function updateEntry(id) {
  const location = document.getElementById('location').value;
  const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
  const description = document.getElementById('description').value;
  const photo = document.getElementById('photo').files[0];
  const username = localStorage.getItem('username');

  const entry = {
    location,
    tags,
    description,
    photo: photo ? URL.createObjectURL(photo) : '',
    username,
    id
  };

  getCoordinates(location).then(coords => {
    entry.coords = coords;
    saveEntry(entry);
  });
}

document.getElementById('search').addEventListener('click', () => {
  const searchLocation = document.getElementById('searchLocation').value;
  const searchTags = document.getElementById('searchTags').value.split(',').map(tag => tag.trim());
  filterEntries(searchLocation, searchTags);
});

function filterEntries(location, tags) {
  const entriesDiv = document.getElementById('entries');
  entriesDiv.innerHTML = '';
  const username = localStorage.getItem('username');
  let entries = JSON.parse(localStorage.getItem('entries')) || [];
  entries = entries.filter(entry => entry.username === username);

  if (location) {
    entries = entries.filter(entry => entry.location.toLowerCase().includes(location.toLowerCase()));
  }
  
  if (tags.length > 0) {
    entries = entries.filter(entry => tags.every(tag => entry.tags.includes(tag)));
  }

  entries.forEach(entry => {
    displayEntry(entry);
    addMarker(entry.coords);
  });
}

function loadComments() {
  const commentsDiv = document.getElementById('comments');
  commentsDiv.innerHTML = '';
  const comments = JSON.parse(localStorage.getItem('comments')) || [];
  comments.forEach(comment => {
    const commentDiv = document.createElement('div');
    commentDiv.classList.add('comment');
    
    const text = document.createElement('p');
    text.textContent = comment.text;
    commentDiv.appendChild(text);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this comment?')) {
        deleteComment(comment.id);
      }
    });
    commentDiv.appendChild(deleteButton);

    commentsDiv.appendChild(commentDiv);
  });
}

document.getElementById('commentForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const commentText = document.getElementById('commentText').value;
  const username = localStorage.getItem('username');

  if (commentText) {
    const comment = {
      text: commentText,
      username,
      id: Date.now()
    };

    saveComment(comment);
  }
});

function saveComment(comment) {
  let comments = JSON.parse(localStorage.getItem('comments')) || [];
  comments.push(comment);
  localStorage.setItem('comments', JSON.stringify(comments));
  loadComments();
}

function deleteComment(id) {
  let comments = JSON.parse(localStorage.getItem('comments')) || [];
  comments = comments.filter(comment => comment.id !== id);
  localStorage.setItem('comments', JSON.stringify(comments));
  loadComments();
}

// Initialize map
const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

function addMarker(coords) {
  const marker = L.marker(coords).addTo(map);
  marker.bindPopup(`<b>${coords.lat}, ${coords.lng}</b>`).openPopup();
}

// Load entries and comments on page load if user is logged in
document.addEventListener('DOMContentLoaded', function() {
  const username = localStorage.getItem('username');
  if (username) {
    document.getElementById('auth').classList.add('fade-in');
    document.getElementById('journalForm').classList.add('fade-in');
    document.getElementById('logout').style.display = 'block';
    document.getElementById('commentForm').classList.add('fade-in');
    loadEntries();
    loadComments();
  }
});
