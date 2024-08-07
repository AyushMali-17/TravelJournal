// Simple Authentication
document.getElementById('login').addEventListener('click', login);
document.getElementById('logout').addEventListener('click', logout);

function login() {
  const username = document.getElementById('username').value;
  if (username) {
    localStorage.setItem('username', username);
    document.getElementById('auth').style.display = 'none';
    document.getElementById('journalForm').style.display = 'flex';
    document.getElementById('logout').style.display = 'block';
    document.getElementById('commentSection').style.display = 'block';
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
  document.getElementById('entries').innerHTML = '';
  document.getElementById('comments').innerHTML = '';
  map.eachLayer(layer => {
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
    if (entry.coords) {
      addMarker(entry.coords);
    }
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
    
    const user = document.createElement('p');
    user.textContent = `User: ${comment.username}`;
    commentDiv.appendChild(user);
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-button');
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
  marker.bindPopup(`<b>${coords[0]}, ${coords[1]}</b>`).openPopup();
}

// Example function to demonstrate map animation
function animateMarker(coords) {
  const marker = L.marker(coords).addTo(map);
  marker.bindPopup(`<b>${coords[0]}, ${coords[1]}</b>`).openPopup();

  // Add animation
  marker.setOpacity(0.5);
  marker.on('mouseover', () => {
    marker.setOpacity(1);
    marker.openPopup();
  });
  marker.on('mouseout', () => {
    marker.setOpacity(0.5);
    marker.closePopup();
  });
}

function getCoordinates(location) {
  return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`)
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
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
    if (entry.coords) {
      animateMarker(entry.coords); // Use animateMarker for interactive effect
    }
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

  const desc = document.createElement('p');
  desc.textContent = `Description: ${entry.description}`;
  entryDiv.appendChild(desc);

  const tags = document.createElement('p');
  tags.textContent = `Tags: ${entry.tags.join(', ')}`;
  entryDiv.appendChild(tags);

  const editButtons = document.createElement('div');
  editButtons.classList.add('edit-buttons');

  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.onclick = () => editEntry(entry);
  editButtons.appendChild(editButton);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.classList.add('delete-button');
  deleteButton.onclick = () => deleteEntry(entry);
  editButtons.appendChild(deleteButton);

  entryDiv.appendChild(editButtons);

  entriesDiv.appendChild(entryDiv);
}

function deleteEntry(entryToDelete) {
  let entries = JSON.parse(localStorage.getItem('entries')) || [];
  entries = entries.filter(entry => entry.id !== entryToDelete.id);
  localStorage.setItem('entries', JSON.stringify(entries));
  loadEntries();
}

function editEntry(entryToEdit) {
  const location = prompt('Update location:', entryToEdit.location);
  const description = prompt('Update description:', entryToEdit.description);
  const tags = prompt('Update tags (comma-separated):', entryToEdit.tags.join(', '));
  if (location && description) {
    let entries = JSON.parse(localStorage.getItem('entries')) || [];
    const entryIndex = entries.findIndex(entry => entry.id === entryToEdit.id);
    if (entryIndex > -1) {
      entries[entryIndex].location = location;
      entries[entryIndex].description = description
            entries[entryIndex].tags = tags.split(',').map(tag => tag.trim());
      localStorage.setItem('entries', JSON.stringify(entries));
      loadEntries();
    }
  }
}

// Initialize map
const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Example function to demonstrate map animation
function animateMarker(coords) {
  const marker = L.marker(coords).addTo(map);
  marker.bindPopup(`<b>${coords[0]}, ${coords[1]}</b>`).openPopup();

  // Add animation
  marker.setOpacity(0.5);
  marker.on('mouseover', () => {
    marker.setOpacity(1);
    marker.openPopup();
  });
  marker.on('mouseout', () => {
    marker.setOpacity(0.5);
    marker.closePopup();
  });
}

// Load entries on page load if user is logged in
document.addEventListener('DOMContentLoaded', function() {
  const username = localStorage.getItem('username');
  if (username) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('journalForm').style.display = 'flex';
    document.getElementById('logout').style.display = 'block';
    document.getElementById('commentSection').style.display = 'block';
    loadEntries();
    loadComments();
  }
});

// Function to validate photo input before submission
function validatePhoto(photo) {
  return new Promise((resolve, reject) => {
    if (photo && photo.size <= 5000000) { // 5MB limit
      resolve();
    } else {
      reject('Photo size exceeds 5MB or is not selected.');
    }
  });
}

document.getElementById('journalForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const photo = document.getElementById('photo').files[0];
  
  validatePhoto(photo).then(() => {
    updateEntry(Date.now());
  }).catch(error => {
    alert(error);
  });
});

// Search functionality with additional filters
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
    if (entry.coords) {
      animateMarker(entry.coords); // Use animateMarker for interactive effect
    }
  });
}

// New feature: Add comments to entries
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
    
    const user = document.createElement('p');
    user.textContent = `User: ${comment.username}`;
    commentDiv.appendChild(user);
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-button');
    deleteButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this comment?')) {
        deleteComment(comment.id);
      }
    });
    commentDiv.appendChild(deleteButton);
    
    commentsDiv.appendChild(commentDiv);
  });
}

function deleteComment(id) {
  let comments = JSON.parse(localStorage.getItem('comments')) || [];
  comments = comments.filter(comment => comment.id !== id);
  localStorage.setItem('comments', JSON.stringify(comments));
  loadComments();
}

