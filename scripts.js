// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // Authentication
  document.getElementById('login').addEventListener('click', login);
  document.getElementById('register').addEventListener('click', register);
  document.getElementById('logout').addEventListener('click', logout);
  
  function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password).then(() => {
      document.getElementById('auth').style.display = 'none';
      document.getElementById('journalForm').style.display = 'block';
      document.getElementById('logout').style.display = 'block';
      loadEntries();
    }).catch(err => alert(err.message));
  }
  
  function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password).then(() => {
      login();
    }).catch(err => alert(err.message));
  }
  
  function logout() {
    auth.signOut().then(() => {
      document.getElementById('auth').style.display = 'flex';
      document.getElementById('journalForm').style.display = 'none';
      document.getElementById('logout').style.display = 'none';
      document.getElementById('entries').innerHTML = '';
      map.eachLayer((layer) => {
        if(layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
    }).catch(err => alert(err.message));
  }
  
  // Journal Entries
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
          photo: reader.result,
          uid: auth.currentUser.uid
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
    db.collection('entries').add(entry).then(() => {
      loadEntries();
    }).catch(err => alert(err.message));
  }
  
  function loadEntries() {
    const entriesDiv = document.getElementById('entries');
    entriesDiv.innerHTML = '';
    
    db.collection('entries').where('uid', '==', auth.currentUser.uid).get().then(snapshot => {
      snapshot.forEach(doc => {
        const entry = doc.data();
        displayEntry(entry, doc.id);
        addMarker(entry.coords);
      });
    }).catch(err => alert(err.message));
  }
  
  function displayEntry(entry, id) {
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
    deleteButton.onclick = () => deleteEntry(id);
    entryDiv.appendChild(deleteButton);
    
    entriesDiv.appendChild(entryDiv);
  }
  
  function deleteEntry(id) {
    db.collection('entries').doc(id).delete().then(() => {
      loadEntries();
    }).catch(err => alert(err.message));
  }
  
  // Initialize map
  const map = L.map('map').setView([0, 0], 2);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  function addMarker(coords) {
    const marker = L.marker(coords).addTo(map);
  }
  