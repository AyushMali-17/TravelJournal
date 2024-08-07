// Simple Authentication
document.getElementById('login').addEventListener('click', login);
document.getElementById('register').addEventListener('click', register);
document.getElementById('logout').addEventListener('click', logout);
document.getElementById('editProfile').addEventListener('click', editProfile);
document.getElementById('searchButton').addEventListener('click', searchEntries);
document.getElementById('filterButton').addEventListener('click', filterEntries);
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
document.getElementById('journalForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const location = document.getElementById('location').value;
  const description = document.getElementById('description').value;
  const photo = document.getElementById('photo').files[0];
  const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
  const username = localStorage.getItem('username');

  if (photo) {
    const reader = new FileReader();
    reader.onloadend = function() {
      const entry = {
        location,
        description,
        photo: reader.result,
        tags,
        username,
        id: Date.now()
      };

      getCoordinates(location).then(coords => {
        entry.coords = coords;
        saveEntry(entry);
      });
    };
    reader.readAsDataURL(photo);
  }
});

function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  if (username && password) {
    // Dummy authentication
    localStorage.setItem('username', username);
    document.getElementById('auth').style.display = 'none';
    document.getElementById('journalForm').style.display = 'block';
    document.getElementById('logout').style.display = 'block';
    document.getElementById('profile').style.display = 'block';
    document.getElementById('commentForm').style.display = 'block';
    document.getElementById('profileName').textContent = `Name: ${username}`;
    loadEntries();
    loadComments();
  } else {
    alert('Please enter username and password.');
  }
}

function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  if (username && password) {
    // Dummy registration
    localStorage.setItem('username', username);
    alert('Registration successful! You can now log in.');
  } else {
    alert('Please enter username and password.');
  }
}

function logout() {
  localStorage.removeItem('username');
  document.getElementById('auth').style.display = 'flex';
  document.getElementById('journalForm').style.display = 'none';
  document.getElementById('logout').style.display = 'none';
  document.getElementById('profile').style.display = 'none';
  document.getElementById('commentForm').style.display = 'none';
  document.getElementById('entries').innerHTML = '';
  document.getElementById('comments').innerHTML = '';
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
}

// Journal Entries
function getCoordinates(location) {
  return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        return [data[0].lat, data[0].lon];
      }
      return [0, 0]; // Default coordinates if location not found
    });
}

function saveEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('entries')) || [];
  entries.push(entry);
  localStorage.setItem('entries', JSON.stringify(entries));
  loadEntries();
}

function loadEntries() {
  const entriesDiv = document.getElementById('entries');
  entriesDiv.innerHTML = '';
  const username = localStorage.getItem('username');
  let entries = JSON.parse(localStorage.getItem('entries')) || [];
  entries = entries.filter(entry => entry.username === username);

  entries.forEach(entry => {
    displayEntry(entry);
    addMarker(entry.coords);
  });
}

function displayEntry(entry) {
  const entriesDiv = document.getElementById('entries');

  const entryDiv = document.createElement('div');
  entryDiv.classList.add('entry');

  const img = document.createElement('img');
  img.src = entry.photo;
  entryDiv.appendChild(img);

  const loc = document.createElement('p');
  loc.textContent = `Location: ${entry.location}`;
  entryDiv.appendChild(loc);

  const tags = document.createElement('p');
  tags.textContent = `Tags: ${entry.tags.join(', ')}`;
  entryDiv.appendChild(tags);

  const desc = document.createElement('p');
  desc.textContent = `Description: ${entry.description}`;
  entryDiv.appendChild(desc);

  const editButtons = document.createElement('div');
  editButtons.classList.add('edit-buttons');

  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => editEntry(entry.id));
  editButtons.appendChild(editButton);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.classList.add('delete-button');
  deleteButton.addEventListener('click', () => deleteEntry(entry.id));
  editButtons.appendChild(deleteButton);

  entryDiv.appendChild(editButtons);

  entriesDiv.appendChild(entryDiv);
}

function editEntry(id) {
  // Implement edit functionality
}

function deleteEntry(id) {
  let entries = JSON.parse(localStorage.getItem('entries')) || [];
  entries = entries.filter(entry => entry.id !== id);
  localStorage.setItem('entries', JSON.stringify(entries));
  loadEntries();
}

function addMarker(coords) {
  const marker = L.marker([coords[0], coords[1]]).addTo(map);
}

const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

// Comments
function saveComment(comment) {
  let comments = JSON.parse(localStorage.getItem('comments')) || [];
  comments.push(comment);
  localStorage.setItem('comments', JSON.stringify(comments));
  loadComments();
}

function loadComments() {
  const commentsDiv = document.getElementById('comments');
  commentsDiv.innerHTML = '';
  let comments = JSON.parse(localStorage.getItem('comments')) || [];
  comments.forEach(comment => {
    displayComment(comment);
  });
}

function displayComment(comment) {
  const commentsDiv = document.getElementById('comments');
  const commentDiv = document.createElement('div');
  commentDiv.classList.add('comment');
  commentDiv.textContent = `${comment.username}: ${comment.text}`;
  
  // Add reply functionality if needed
  const replyButton = document.createElement('button');
  replyButton.textContent = 'Reply';
  replyButton.addEventListener('click', () => replyToComment(comment.id));
  commentDiv.appendChild(replyButton);
  
  commentsDiv.appendChild(commentDiv);
}

function replyToComment(id) {
  // Implement reply functionality if needed
}

// Search and Filter Entries
function searchEntries() {
  const searchLocation = document.getElementById('searchLocation').value.toLowerCase();
  const entries = JSON.parse(localStorage.getItem('entries')) || [];
  const filteredEntries = entries.filter(entry => entry.location.toLowerCase().includes(searchLocation));
  displayEntries(filteredEntries);
}

function filterEntries() {
  const searchTags = document.getElementById('searchTags').value.toLowerCase().split(',').map(tag => tag.trim());
  const entries = JSON.parse(localStorage.getItem('entries')) || [];
  const filteredEntries = entries.filter(entry => 
    searchTags.every(tag => entry.tags.map(t => t.toLowerCase()).includes(tag))
  );
  displayEntries(filteredEntries);
}

function displayEntries(entries) {
  const entriesDiv = document.getElementById('entries');
  entriesDiv.innerHTML = '';
  entries.forEach(entry => {
    displayEntry(entry);
    addMarker(entry.coords);
  });
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  if (username) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('journalForm').style.display = 'block';
    document.getElementById('logout').style.display = 'block';
    document.getElementById('profile').style.display = 'block';
    document.getElementById('commentForm').style.display = 'block';
    document.getElementById('profileName').textContent = `Name: ${username}`;
    loadEntries();
    loadComments();
  }
});
