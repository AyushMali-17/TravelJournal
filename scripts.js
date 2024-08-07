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
  
        saveEntry(entry);
        displayEntries();
      };
      reader.readAsDataURL(photo);
    }
  });
  
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
  
    entries.forEach(entry => {
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
      
      entriesDiv.appendChild(entryDiv);
    });
  }
  
  displayEntries();
  
  // Initialize map
  const map = L.map('map').setView([51.505, -0.09], 2);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  