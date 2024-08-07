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
    loadEntries();
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
  const description = document.getElementById('description').value;
  const photo = document.getElementById('photo').files[0];
  const username = localStorage.getItem('username');

  if (photo) {
    const reader = new FileReader();
    reader.onloadend = function() {
      const entry = {
        location,
        description,
        photo: reader.result,
        username
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

  const desc = document.createElement('p');
  desc.textContent = `Description: ${entry.description}`;
  entryDiv.appendChild(desc);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.onclick = () => deleteEntry(entry);
  entryDiv.appendChild(deleteButton);

  entriesDiv.appendChild(entryDiv);
}

function deleteEntry(entryToDelete) {
  let entries = JSON.parse(localStorage.getItem('entries')) || [];
  entries = entries.filter(entry => entry !== entryToDelete);
  localStorage.setItem('entries', JSON.stringify(entries));
  loadEntries();
}

// Initialize map
const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

function addMarker(coords) {
  const marker = L.marker(coords).addTo(map);
}

// Load entries on page load if user is logged in
document.addEventListener('DOMContentLoaded', function() {
  const username = localStorage.getItem('username');
  if (username) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('journalForm').style.display = 'block';
    document.getElementById('logout').style.display = 'block';
    loadEntries();
  }
});
