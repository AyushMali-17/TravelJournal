document.getElementById('journalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;
    const photo = document.getElementById('photo').files[0];
  
    if (photo) {
      const reader = new FileReader();
      reader.onloadend = function() {
        const entry = {
          location,
          description,
          photo: reader.result
        };
  
        getCoordinates(location).then(coords => {
          entry.coords = coords;
          saveEntry(entry);
          displayEntries();
          addMarker(coords);
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
    const entries = getEntries();
    entries.push(entry);
    localStorage.setItem('entries', JSON.stringify(entries));
  }
  
  function getEntries() {
    const entries = localStorage.getItem('entries');
    return entries ? JSON.parse(entries) : [];
  }
  
  function displayEntries() {
    const entries = getEntries();
    const entriesDiv = document.getElementById('entries');
    entriesDiv.innerHTML = '';
  
    entries.forEach((entry, index) => {
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
      deleteButton.onclick = () => deleteEntry(index);
      entryDiv.appendChild(deleteButton);
      
      entriesDiv.appendChild(entryDiv);
    });
  }
  
  function deleteEntry(index) {
    const entries = getEntries();
    entries.splice(index, 1);
    localStorage.setItem('entries', JSON.stringify(entries));
    displayEntries();
    updateMarkers();
  }
  
  displayEntries();
  
  // Initialize map
  const map = L.map('map').setView([0, 0], 2);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  const markers = [];
  
  function addMarker(coords) {
    const marker = L.marker(coords).addTo(map);
    markers.push(marker);
  }
  
  function updateMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers.length = 0;
    
    const entries = getEntries();
    entries.forEach(entry => {
      addMarker(entry.coords);
    });
  }
  
  updateMarkers();
  