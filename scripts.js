document.getElementById('journalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;
    const photo = document.getElementById('photo').files[0];
    
    console.log({ location, description, photo });
  
    alert('Entry submitted!');
  
    // Reset form
    document.getElementById('journalForm').reset();
  });
  
  // Placeholder for map functionality
  document.getElementById('map').innerHTML = "Map will be displayed here.";
  