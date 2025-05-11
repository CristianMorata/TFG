// URL de tu función helloWorld
const url = 'https://us-central1-[tu-proyecto].cloudfunctions.net/helloWorld';

// Realizamos una solicitud GET
fetch(url)
  .then(response => response.text()) // O response.json() si la respuesta es JSON
  .then(data => {
    console.log('Respuesta de la función:', data); // Aquí verás "Hello from Firebase!"
  })
  .catch(error => {
    console.error('Error al comunicarse con la función:', error);
  });