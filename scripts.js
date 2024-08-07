// Simple Authentication
document.getElementById('login').addEventListener('click', login);
document.getElementById('logout').addEventListener('click', logout);

function login() {
  const username = document.getElementById('username').value;
  if (username) {
    localStorage.setItem('username', username);
    document.getElementById('auth').style.display = 'none';
    document.getElementById('journalForm').style.display = 'block';
    document.getElementById('logout').style.display = 'block';
    document.getElementById('commentForm').style.display = 'block';
    loadEntries();
    loadComments();
  } else {
    alert('Please enter a username.');
  }
}

function logout() {
  localStorage.removeItem('username');
  document.getElementById('auth').style.display = 'flex';
  document.getElementById('journalForm').style.display = 'none';
  document.getElementById('logout').style.display = 'none';
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
document.getElementById('journalForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const location = document.getElementById('location').value;
  const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
  const description = document.getElementById('description').value;
  const photo = document.getElementById('photo').files[0];
  const username = localStorage.getItem('username');

  if (photo) {
    const reader = new FileReader();
    reader.onloadend = function() {
      const entry = {
        location,
        tags,
        description,
        photo: reader.result,
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
  const existingEntryIndex = entries.findIndex(e => e.id === entry.id);
  if (existingEntryIndex > -1) {
    entries[existingEntryIndex] = entry;
  } else {
    entries.push(entry);
  }
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
  entryDiv.setAttribute('data-id', entry.id);

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

  // Edit and Delete buttons
  const editButtons = document.createElement('div');
  editButtons.classList.add('edit-buttons');

  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => editEntry(entry.id));
  editButtons.appendChild(editButton);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this entry?')) {
      deleteEntry(entry.id);
    }
  });
  editButtons.appendChild(deleteButton);

  entryDiv.appendChild(editButtons);
  entriesDiv.appendChild(entryDiv);
}

function deleteEntry(id) {
  let entries = JSON.parse(localStorage.getItem('entries')) || [];
  entries = entries.filter(entry => entry.id !== id);
  localStorage.setItem('entries', JSON.stringify(entries));
  loadEntries();
}

function editEntry(id) {
  let entries = JSON.parse(localStorage.getItem('entries')) || [];
  const entryToEdit = entries.find(entry => entry.id === id);
  if (entryToEdit) {
    document.getElementById('location').value = entryToEdit.location;
    document.getElementById('tags').value = entryToEdit.tags.join(', ');
    document.getElementById('description').value = entryToEdit.description;
    document.getElementById('photo').value = ''; // Clear file input
    document.getElementById('journalForm').onsubmit = function(e) {
      e.preventDefault();
      updateEntry(id);
    };
  }
}

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
}

// Load entries and comments on page load if user is logged in
document.addEventListener('DOMContentLoaded', function() {
  const username = localStorage.getItem('username');
  if (username) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('journalForm').style.display = 'block';
    document.getElementById('logout').style.display = 'block';
    document.getElementById('commentForm').style.display = 'block';
    loadEntries();
    loadComments();
  }
});

