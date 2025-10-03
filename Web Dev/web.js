// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDnDBIzPi2oqnONsyLer7j1HzwBQsHaYn0",
    authDomain: "web-dev-db625.firebaseapp.com",
    projectId: "web-dev-db625",
    storageBucket: "web-dev-db625.firebasestorage.app",
    messagingSenderId: "434839404809",
    appId: "1:434839404809:web:c94fb67a13d96f44e693d8",
    measurementId: "G-L28JT7TZDG"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Get elements
const registrationForm = document.getElementById('registrationForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const errorMessage = document.getElementById('errorMessage');
const loginLink = document.getElementById('loginLink');

// Function to show a notification
function showNotification(message, isSuccess = true) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-md text-white ${
        isSuccess ? 'bg-green-500' : 'bg-red-500'
    }`;
    notification.textContent = message;

    // Add the notification to the body
    document.body.appendChild(notification);

    // Remove the notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Registration form submission
registrationForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent form from submitting the traditional way

    // Get input values
    const email = emailInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate if passwords match
    if (password !== confirmPassword) {
        errorMessage.textContent = "Passwords do not match!";
        showNotification("Passwords do not match!", false); // Show error notification
        return; // Stop execution if passwords don't match
    }

    // Create user with Firebase
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Successful registration
            const user = userCredential.user;
            showNotification("Registration Successful!", true); // Show success notification
            // Optionally, redirect to a dashboard or login page
            // window.location.href = '/dashboard.html';
        })
        .catch((error) => {
            // Handle Errors here
            const errorCode = error.code;
            const errorMessageText = error.message;
            errorMessage.textContent = errorMessageText;
            showNotification(errorMessageText, false); // Show error notification
        });
});

// Login link click handler
loginLink.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default link behavior
    alert('Redirect to Login Page');
    // Optionally, redirect to the login page
    // window.location.href = '/login.html';
});