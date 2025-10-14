import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail  // Add this import
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAaTzs6OS_iBSQG1iv4eLvMWkj-HSw6aJE",
    authDomain: "test-debt-63eb7.firebaseapp.com",
    databaseURL: "https://test-debt-63eb7-default-rtdb.firebaseio.com",
    projectId: "test-debt-63eb7",
    storageBucket: "test-debt-63eb7.firebasestorage.app",
    messagingSenderId: "883380644849",
    appId: "1:883380644849:web:06e70d9514645bc1947250",
    measurementId: "G-C76YMPCB5E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


async function handleForgotPassword(email) {
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent! Please check your inbox (and spam folder).');
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send password reset email. ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No account found with this email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Too many requests. Please try again later.';
                break;
            default:
                errorMessage += 'Please try again.';
        }
        
        alert(errorMessage);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt('Please enter your email address to reset your password:');
            if (email) {
                await handleForgotPassword(email);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!isValidEmail(email)) {
                alert('Please enter a valid email address');
                return;
            }

            try {
                await signInWithEmailAndPassword(auth, email, password);
                localStorage.setItem('currentUser', email);
                window.location.href = 'debt.html';
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'An unexpected error occurred. Please try again.';
                
                switch (error.code) {
                    case 'auth/invalid-credential':
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        errorMessage = 'Invalid email or password. Please try again.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed login attempts. Please try again later.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your internet connection.';
                        break;
                }
                
                alert(errorMessage);
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');

    eyeIcon.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text'; // Show password
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password'; // Hide password
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    });
});