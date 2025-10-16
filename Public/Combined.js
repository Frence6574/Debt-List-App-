// ========================
// FIREBASE CONFIGURATION
// ========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import { getDatabase, ref, onValue, push, set, update, remove, get } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';
import { serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js';  // For createdAt

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

// ========================
// GLOBAL VARIABLES
// ========================
let debtors = [];
let selectedDebtorId = null;
let selectedProductIndex = null;
let selectedTransactionIndex = null;
let isLoadingData = false;
let archivedDebtors = [];
let sentReminders = [];
let debtChart = null;
let paymentsChart = null;
let debtDistributionChart = null;
let paymentTrendsChart = null;
let currentUser = null;
let openDebtorId = null;
let products = [];
let isSubmitting = false;
let editingDebtorId = null;
let isCheckingReminders = false;
let reminderLockTimeout = null;
let currentUserData = null;
let currentUserRole = null;
let allUsers = [];

// Constants
const USER_ROLES = {
    ADMIN: 'admin',
    SUB_ADMIN: 'sub_admin',
    SUPER_ADMIN: 'super_admin' // Add this new role
};

// API Base URL - dynamically set based on environment
const API_BASE = 'https://debt-list.onrender.com';

const SUPER_ADMIN_EMAIL = 'carbolidofrencejhon@gmail.com';

// Firebase instance
let app, analytics, database, auth;

// ========================
// UTILITY FUNCTIONS
// ========================
function capitalizeWords(str) {
    return str.replace(/\s+/g, ' ').trim().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function generateReferenceNumber() {
    const date = new Date();
    const dateString = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const timeString = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
    const randomComponent = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN-${dateString}-${timeString}-${randomComponent}`;
}

function updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function closeAllModals() {
    // Reset global variables
    selectedDebtorId = null;
    selectedProductIndex = null;
    selectedTransactionIndex = null;

    // Close all modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

    // Reset payment form specific elements
    const paymentAmount = document.getElementById('payment-amount');
    if (paymentAmount) paymentAmount.value = '';

    // Reset modal sections to initial state
    const productSelection = document.getElementById('product-selection');
    const paymentAmountInput = document.getElementById('payment-amount-input');
    if (productSelection) productSelection.style.display = 'none';
    if (paymentAmountInput) paymentAmountInput.style.display = 'none';

    // Clear product choices to ensure fresh generation
    const productChoices = document.getElementById('payment-product-choices');
    if (productChoices) productChoices.innerHTML = '';

    // Reset product form modal completely - CALL THE ENHANCED FUNCTION
    resetProductFormModal();
    
    // Reset debtor form
    const debtorForm = document.getElementById('debtor-form');
    if (debtorForm) {
        debtorForm.reset();
        // Reset form title and button text to default
        const modalTitle = document.querySelector('#debtor-form-modal h2');
        const submitButton = document.querySelector('#debtor-form button[type="submit"]');
        if (modalTitle) modalTitle.textContent = 'Add Debtor';
        if (submitButton) submitButton.textContent = 'Save';
    }
    
    // Reset checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.reset();
        // Reset checkout product list to single entry
        const checkoutProductList = document.getElementById('checkout-product-list');
        if (checkoutProductList) {
            while (checkoutProductList.children.length > 1) {
                checkoutProductList.removeChild(checkoutProductList.lastChild);
            }
            // Reset the remaining entry
            const remainingEntry = checkoutProductList.querySelector('.product-entry');
            if (remainingEntry) {
                const inputs = remainingEntry.querySelectorAll('input');
                inputs.forEach(input => input.value = '');
                const totalSpan = remainingEntry.querySelector('.product-total');
                if (totalSpan) totalSpan.textContent = 'Total: ₱0.00';
            }
        }
        // Reset grand total
        const checkoutGrandTotal = document.getElementById('checkout-grand-total');
        if (checkoutGrandTotal) checkoutGrandTotal.textContent = 'Grand Total: ₱0.00';
    }
    
    // Reset inventory product form
    const inventoryForm = document.getElementById('inventory-product-form');
    if (inventoryForm) {
        inventoryForm.reset();
        inventoryForm.dataset.mode = 'add';
        delete inventoryForm.dataset.productId;
        const title = document.getElementById('inventory-product-form-title');
        if (title) title.textContent = 'Add Product';
    }
    
    // Reset profile forms
    const profileForm = document.getElementById('profile-form');
    if (profileForm) profileForm.reset();
    
    const addAccountForm = document.getElementById('add-account-form');
    if (addAccountForm) addAccountForm.reset();
    
    // Reset due date settings form
    const dueDateForm = document.getElementById('due-date-settings-form');
    if (dueDateForm) dueDateForm.reset();
}

function isAdmin() {
    return currentUserRole === USER_ROLES.ADMIN;
}

function isSubAdmin() {
    return currentUserRole === USER_ROLES.SUB_ADMIN;
}

function isSuperAdmin() {
    return currentUserRole === USER_ROLES.SUPER_ADMIN;
}

function canCreateAccounts() {
    return isAdmin() || isSuperAdmin(); // Only super admin can create accounts
}

function canManageUsers() {
    return isAdmin() || isSuperAdmin(); // Both can manage users
}

function canDeleteUsers() {
    return isAdmin() || isSuperAdmin(); // Only super admin can permanently delete
}

function canManageProducts() {
    return isAdmin() || isSuperAdmin(); // Only Admin and Super Admin can manage products
}

function canViewProducts() {
    return isAdmin() || isSubAdmin() || isSuperAdmin(); // All roles can view products
}

function canEditSettings() {
    return isAdmin() || isSuperAdmin(); // Admin and Super Admin can edit settings
}

function canPermanentlyDelete() {
    return isAdmin() || isSuperAdmin(); // Admin and Super Admin can permanently delete
}

function canRestoreArchived() {
    return isAdmin() || isSuperAdmin(); // Admin and Super Admin can restore archived debtors
}

function canManageDebtors() {
    return isAdmin() || isSubAdmin() || isSuperAdmin(); // All roles can manage debtors
}

function canMakePayments() {
    return isAdmin() || isSubAdmin() || isSuperAdmin(); // All roles can make payments
}

function canCheckout() {
    return isAdmin() || isSubAdmin() || isSuperAdmin(); // All roles can checkout
}

function canManageTransactions() {
    return isAdmin() || isSubAdmin() || isSuperAdmin(); // All roles can manage transactions
}

async function loadUserRole() {
    if (!currentUser) return;
    
    try {
        // Check if this is the super admin email
        if (currentUser.email === SUPER_ADMIN_EMAIL) {
            currentUserRole = USER_ROLES.SUPER_ADMIN;
            currentUserData = {
                email: currentUser.email,
                role: USER_ROLES.SUPER_ADMIN,
                displayName: currentUser.displayName || 'Super Admin',
                createdAt: Date.now(),
                createdBy: currentUser.uid,
                active: true
            };
            
            // Ensure super admin record exists in database
            if (window.firebase) {
                const { database, ref, get, set } = window.firebase;
                const userRef = ref(database, `users/${currentUser.uid}`);
                const snapshot = await get(userRef);
                
                if (!snapshot.exists()) {
                    await set(userRef, currentUserData);
                    console.log('Created super admin user record');
                } else {
                    currentUserData = snapshot.val();
                }
            }
            
            // Check active status
            if (currentUserData.active === false) {
                auth.signOut();
                alert('Your account has been deactivated. Contact administrator.');
                return;
            }
            
            console.log(`Super Admin access granted for: ${currentUser.email}`);
            updateUIBasedOnRole();
            return;
        }

        // For non-super admin users, check database
        if (window.firebase) {
            const { database, ref, get } = window.firebase;
            const userRef = ref(database, `users/${currentUser.uid}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                currentUserData = snapshot.val();
                currentUserRole = currentUserData.role;
                // Check active status
                if (currentUserData.active === false) {
                    auth.signOut();
                    alert('Your account has been deactivated. Contact administrator.');
                    return;
                }
                console.log(`User role loaded: ${currentUserRole}`);
            } else {
                console.log('No user data found');
                auth.signOut();
                alert('No user profile found. Contact administrator.');
                return;
            }
        }
    } catch (error) {
        console.error('Error loading user role:', error);
    }
    
    updateUIBasedOnRole();
}

async function createUserRecord(uid, userData) {
    if (!window.firebase) return;
    
    try {
        userData.createdBy = currentUser.uid;  // Add this
        userData.active = true;  // Add this
        const { database, ref, set } = window.firebase;
        const userRef = ref(database, `users/${uid}`);
        await set(userRef, userData);
        console.log('User record created successfully with role:', userData.role);
    } catch (error) {
        console.error('Error creating user record:', error);
        throw error;
    }
}

function updateUIBasedOnRole() {
    // Update create account button visibility
    const createAccountBtn = document.getElementById('create-account-btn');
    if (createAccountBtn) {
        createAccountBtn.style.display = canCreateAccounts() ? 'block' : 'none';
    }
    
    // Update add product button visibility
    const addProductBtn = document.getElementById('add-product-inventory-btn');
    if (addProductBtn) {
        addProductBtn.style.display = canManageProducts() ? 'block' : 'none';
    }
    
    // Update account type options
    updateAccountTypeOptions();
    
    // Update profile info to show role
    updateProfileInfo();
    
    // Apply super admin specific UI updates
    if (isSuperAdmin()) {
        updateUIForSuperAdmin();
    }
}


function updateAccountTypeOptions() {
    const accountTypeSelect = document.getElementById('new-account-type');
    if (accountTypeSelect) {
        // Clear existing options
        accountTypeSelect.innerHTML = '<option value="" disabled selected>Select Account Type</option>';
        
        // Super Admin can create Super Admin, Admin, and Sub Admin accounts
        if (isSuperAdmin()) {
            const superAdminOption = document.createElement('option');
            superAdminOption.value = USER_ROLES.SUPER_ADMIN;
            superAdminOption.textContent = 'Super Admin';
            accountTypeSelect.appendChild(superAdminOption);
            
            const adminOption = document.createElement('option');
            adminOption.value = USER_ROLES.ADMIN;
            adminOption.textContent = 'Admin';
            accountTypeSelect.appendChild(adminOption);
            
            const subAdminOption = document.createElement('option');
            subAdminOption.value = USER_ROLES.SUB_ADMIN;
            subAdminOption.textContent = 'Sub Admin';
            accountTypeSelect.appendChild(subAdminOption);
        }
        // Admin can create Admin and Sub Admin accounts
        else if (isAdmin()) {
            const adminOption = document.createElement('option');
            adminOption.value = USER_ROLES.ADMIN;
            adminOption.textContent = 'Admin';
            accountTypeSelect.appendChild(adminOption);
            
            const subAdminOption = document.createElement('option');
            subAdminOption.value = USER_ROLES.SUB_ADMIN;
            subAdminOption.textContent = 'Sub Admin';
            accountTypeSelect.appendChild(subAdminOption);
        }
        // Sub-admins cannot create accounts
        else {
            const noPermissionOption = document.createElement('option');
            noPermissionOption.value = '';
            noPermissionOption.textContent = 'No permission to create accounts';
            noPermissionOption.disabled = true;
            accountTypeSelect.appendChild(noPermissionOption);
        }
    }
}

function getRoleDisplayName(role) {
    switch (role) {
        case USER_ROLES.SUPER_ADMIN:
            return 'Super Admin';
        case USER_ROLES.ADMIN:
            return 'Admin';
        case USER_ROLES.SUB_ADMIN:
            return 'Sub Admin';
        default:
            return 'User';
    }
}

// ========================
// FIREBASE INITIALIZATION
// ========================
async function initializeFirebase() {
    try {
        app = initializeApp(firebaseConfig);
        analytics = getAnalytics(app);
        database = getDatabase(app);
        auth = getAuth(app);
        
        window.firebase = { database, ref, onValue, push, set, update, remove, get };

        // Set up real-time listener
        const debtorsRef = ref(database, 'debtors');
        onValue(debtorsRef, (snapshot) => {
            console.log("Firebase update received:", snapshot.val());
            debtors = [];
            snapshot.forEach((childSnapshot) => {
                const debtor = childSnapshot.val();
                debtor.id = childSnapshot.key;
                debtor.payments = debtor.payments && !Array.isArray(debtor.payments) ? Object.values(debtor.payments) : debtor.payments || [];
                debtors.push(debtor);
            });
            debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            renderDebtors();
            if (document.getElementById('dashboard').style.display === 'block') {
                updateDashboard();
            }
            localStorage.setItem('debtors', JSON.stringify(debtors));
        });
        
        return true;
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        throw error;
    }
}

function getFirebaseInstance() {
    if (window.firebaseInstance) {
        return window.firebaseInstance;
    }
    
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not loaded - using localStorage fallback');
        return createLocalStorageInstance();
    }

    if (!firebase.apps || !Array.isArray(firebase.apps)) {
        console.warn('Firebase apps not initialized - using localStorage fallback');
        return createLocalStorageInstance();
    }

    try {
        const app = firebase.apps[0];
        if (!app) {
            console.warn('No Firebase app available - using localStorage fallback');
            return createLocalStorageInstance();
        }

        const db = app.database();
        if (!db) {
            throw new Error('Could not initialize Firebase database');
        }

        window.firebaseInstance = {
            database: db,
            ref: (path) => db.ref(path),
            get: (ref) => ref.once('value'),
            set: (ref, data) => ref.set(data),
            update: (ref, data) => ref.update(data),
            push: (ref, data) => ref.push(data),
            remove: (ref) => ref.remove()
        };
        
        return window.firebaseInstance;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return createLocalStorageInstance();
    }
}

function createLocalStorageInstance() {
    return {
        database: null,
        ref: (path) => ({ path }),
        get: async (ref) => {
            try {
                const data = localStorage.getItem(`debt_tracker_${ref.path}`);
                return {
                    exists: () => data !== null,
                    val: () => data ? JSON.parse(data) : null,
                    forEach: (callback) => {
                        if (!data) return;
                        const items = JSON.parse(data);
                        Object.keys(items || {}).forEach(key => {
                            callback({
                                key,
                                val: () => items[key],
                                exists: () => true
                            });
                        });
                    }
                };
            } catch (error) {
                console.error("Local storage error:", error);
                return { exists: () => false, val: () => null, forEach: () => {} };
            }
        },
        set: (ref, data) => {
            try {
                localStorage.setItem(`debt_tracker_${ref.path}`, JSON.stringify(data));
                return Promise.resolve();
            } catch (error) {
                console.error("Local storage error:", error);
                return Promise.reject(error);
            }
        },
        update: (ref, data) => {
            try {
                const existingData = localStorage.getItem(`debt_tracker_${ref.path}`);
                const parsedData = existingData ? JSON.parse(existingData) : {};
                const updatedData = { ...parsedData, ...data };
                localStorage.setItem(`debt_tracker_${ref.path}`, JSON.stringify(updatedData));
                return Promise.resolve();
            } catch (error) {
                console.error("Local storage error:", error);
                return Promise.reject(error);
            }
        },
        push: (ref, data) => {
            try {
                const existingData = localStorage.getItem(`debt_tracker_${ref.path}`);
                const parsedData = existingData ? JSON.parse(existingData) : {};
                const newKey = 'key_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                parsedData[newKey] = data;
                localStorage.setItem(`debt_tracker_${ref.path}`, JSON.stringify(parsedData));
                return { key: newKey };
            } catch (error) {
                console.error("Local storage error:", error);
                return { key: null };
            }
        },
        remove: (ref) => {
            try {
                localStorage.removeItem(`debt_tracker_${ref.path}`);
                return Promise.resolve();
            } catch (error) {
                console.error("Local storage error:", error);
                return Promise.reject(error);
            }
        }
    };
}

// ========================
// SMS FUNCTIONS
// ========================
async function sendSMS(phoneNumber, message) {
    try {
        const response = await fetch(`${API_BASE}/send-reminder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber,
                message
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send SMS');
        }
        console.log('SMS sent successfully:', data);
        return data;
    } catch (error) {
        console.error('SMS Sending Error:', error.message);
        throw error;
    }
}

async function sendNewTransactionSMS(phoneNumber, debtorName, transaction) {
    try {
        const response = await fetch(`${API_BASE}/send-new-transaction-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, debtorName, transaction })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send SMS');
        console.log('New transaction SMS sent successfully:', data);
    } catch (error) {
        console.error('Error sending new transaction SMS:', error);
        throw error;
    }
}

async function sendReminderSMS(phoneNumber, message) {
    try {
        const response = await fetch(`${API_BASE}/send-reminder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, message })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send SMS');
        console.log('Reminder SMS sent successfully:', data);
    } catch (error) {
        console.error('Error sending reminder SMS:', error);
        throw error;
    }
}

async function sendPaymentReceiptSMS(phoneNumber, debtorName, amount, remainingBalance) {
    try {
        console.log('Attempting to send SMS with:', { phoneNumber, debtorName, amount, remainingBalance });
        const response = await window.fetch(`${API_BASE}/send-payment-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, debtorName, amount, remainingBalance })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unknown error');
        console.log('SMS sent:', data);
        return data;
    } catch (error) {
        console.error('SMS Error:', error.message);
        throw error;
    }
}

// ========================
// DATA LOADING FUNCTIONS
// ========================
async function loadDebtors(forceRefresh = false) {
    if (isLoadingData && !forceRefresh) return;
    isLoadingData = true;

    try {
        if (window.firebase) {
            const { database, ref, get } = window.firebase;
            const debtorsRef = ref(database, 'debtors');
            const snapshot = await get(debtorsRef);
            
            debtors = [];
            snapshot.forEach((childSnapshot) => {
                const debtor = childSnapshot.val();
                debtor.id = childSnapshot.key;
                
                if (debtor.products && Array.isArray(debtor.products)) {
                    debtor.products.forEach(product => {
                        if (product.dueDate) {
                            product.dueDate = Number(product.dueDate);
                        }
                    });
                } else {
                    debtor.products = [];
                }
                
                debtors.push(debtor);
            });
            // Existing sort (kept as-is)
            debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

            localStorage.setItem('debtors', JSON.stringify(debtors));
        } else {
            const savedDebtors = localStorage.getItem('debtors');
            if (savedDebtors) {
                debtors = JSON.parse(savedDebtors);
                // Added: Sort after loading from localStorage
                debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            }
        }
    } catch (error) {
        console.error("Error loading debtors:", error);
        const savedDebtors = localStorage.getItem('debtors');
        if (savedDebtors) {
            debtors = JSON.parse(savedDebtors);
            // Added: Sort after loading from localStorage in error fallback
            debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
    } finally {
        isLoadingData = false;
        renderDebtors();
    }
}

async function loadDebtorsAndUpdateDashboard() {
    if (isLoadingData) {
        console.log("Already loading data, skipping...");
        return;
    }
    
    isLoadingData = true;
    try {
        const firebase = getFirebaseInstance();
        if (!firebase) {
            throw new Error("Could not get Firebase instance");
        }

        const debtorsRef = firebase.ref('debtors');
        const snapshot = await firebase.get(debtorsRef);
        
        let loadedDebtors = [];

        if (snapshot && snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const debtor = childSnapshot.val();
                if (debtor) {
                    debtor.id = childSnapshot.key;
                    loadedDebtors.push(debtor);
                }
            });
            console.log(`Loaded ${loadedDebtors.length} debtors`);
            
            if (loadedDebtors.length > 0) {
                debtors = loadedDebtors;
                // Added: Sort after loading
                debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                localStorage.setItem('debtors', JSON.stringify(debtors));
            }
        } else {
            console.log("No debtors found in database");
            tryLoadFromLocalStorage();
        }

        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof renderDebtors === 'function') renderDebtors();
        
    } catch (error) {
        console.error("Error loading debtors:", error);
        tryLoadFromLocalStorage();
    } finally {
        isLoadingData = false;
    }
}

async function loadProducts() {
    try {
        if (window.firebase) {
            const { database, ref, onValue } = window.firebase;
            const productsRef = ref(database, 'products');
            
            // Remove any existing listener first
            if (window.productsListener) {
                window.productsListener(); // Unsubscribe previous listener
            }
            
            window.productsListener = onValue(productsRef, (snapshot) => {
                products = [];
                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        const product = childSnapshot.val();
                        product.id = childSnapshot.key;
                        products.push(product);
                    });
                }
                products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
                localStorage.setItem('products', JSON.stringify(products));
                
                // Only render if products modal is visible
                if (document.getElementById('products-modal').style.display === 'block') {
                    renderProductsWithSearch();
                }
            });
        } else {
            // ... localStorage fallback code remains the same
        }
    } catch (error) {
        console.error("Error loading products:", error);
        products = [];
    }
}

async function loadCurrentUser() {
    try {
        const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js");
        const auth = getAuth();
        
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                console.log('User authenticated:', user.email);
                
                // Load user role from database
                await loadUserRole();
                
                // Update UI elements
                updateProfileInfo();
                const createAccountBtn = document.getElementById('create-account-btn');
                if (createAccountBtn) {
                    createAccountBtn.style.display = canCreateAccounts() ? 'block' : 'none';
                }
                
                // Update other UI elements based on role
                updateUIBasedOnRole();
                
            } else {
                currentUser = null;
                currentUserRole = null;
                currentUserData = null;
                console.log("No user signed in");
            }
        });
    } catch (error) {
        console.error("Error loading user:", error);
    }
}

async function loadPaymentHistory(debtorId) {
    const paymentHistoryList = document.getElementById('payment-history-list');
    paymentHistoryList.innerHTML = '<li>Loading payment history...</li>';
    
    try {
        const debtor = debtors.find(d => d.id === debtorId);
        if (!debtor) {
            paymentHistoryList.innerHTML = '<li>Debtor not found.</li>';
            return;
        }
        
        let payments = debtor.payments || [];
        
        if (window.firebase) {
            const { database, ref, get } = window.firebase;
            const debtorRef = ref(database, `debtors/${debtorId}`);
            const snapshot = await get(debtorRef);
            if (snapshot.exists()) {
                const firebaseDebtor = snapshot.val();
                if (firebaseDebtor.payments) {
                    if (typeof firebaseDebtor.payments === 'object' && !Array.isArray(firebaseDebtor.payments)) {
                        payments = Object.values(firebaseDebtor.payments);
                    } else {
                        payments = firebaseDebtor.payments;
                    }
                    debtor.payments = payments;
                    const index = debtors.findIndex(d => d.id === debtorId);
                    if (index !== -1) debtors[index] = debtor;
                    localStorage.setItem('debtors', JSON.stringify(debtors));
                }
            }
        }
        
        paymentHistoryList.innerHTML = '';
        
        if (payments && payments.length > 0) {
            payments.sort((a, b) => b.timestamp - a.timestamp);
            payments.forEach((payment, index) => {
                displayPaymentItem(payment, index, paymentHistoryList);
            });
        } else {
            paymentHistoryList.innerHTML = '<li>No payment history found.</li>';
        }
    } catch (error) {
        console.error("Error loading payment history:", error);
        paymentHistoryList.innerHTML = '<li>Error loading payment history: ' + error.message + '</li>';
    }
}

// ========================
// FIREBASE STORAGE FUNCTIONS FOR ARCHIVED DATA
// ========================

async function loadArchivedDebtors() {
    try {
        if (window.firebase) {
            const { database, ref, get } = window.firebase;
            const archivedRef = ref(database, 'archived_debtors');
            const snapshot = await get(archivedRef);
            
            archivedDebtors = []; // Clear existing array
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const archived = childSnapshot.val();
                    archived.id = childSnapshot.key;
                    archivedDebtors.push(archived);
                });
                archivedDebtors.sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
                console.log(`Loaded ${archivedDebtors.length} archived debtors from Firebase`);
            } else {
                console.log("No archived debtors found in Firebase");
            }
            
            // Sync with localStorage as backup
            localStorage.setItem('archivedDebtors', JSON.stringify(archivedDebtors));
        } else {
            // Fallback to localStorage
            const saved = localStorage.getItem('archivedDebtors');
            if (saved) {
                archivedDebtors = JSON.parse(saved);
                console.log(`Loaded ${archivedDebtors.length} archived debtors from localStorage`);
            }
        }
    } catch (error) {
        console.error("Error loading archived debtors:", error);
        // Fallback to localStorage on error
        const saved = localStorage.getItem('archivedDebtors');
        if (saved) {
            archivedDebtors = JSON.parse(saved);
            console.log(`Fallback: Loaded ${archivedDebtors.length} archived debtors from localStorage`);
        }
    }
}

async function saveArchivedDebtor(debtor) {
    try {
        // Add archived timestamp
        debtor.archivedAt = Date.now();
        
        if (window.firebase) {
            const { database, ref, push, set } = window.firebase;
            const archivedRef = ref(database, 'archived_debtors');
            const newArchivedRef = push(archivedRef);
            await set(newArchivedRef, debtor);
            
            // Update local array with Firebase ID
            debtor.id = newArchivedRef.key;
            archivedDebtors.push(debtor);
            console.log(`Saved archived debtor to Firebase with ID: ${debtor.id}`);
        } else {
            // Fallback: generate local ID
            debtor.id = 'archived_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            archivedDebtors.push(debtor);
            console.log(`Saved archived debtor to localStorage with ID: ${debtor.id}`);
        }
        
        // Always update localStorage as backup
        localStorage.setItem('archivedDebtors', JSON.stringify(archivedDebtors));
        return debtor.id;
    } catch (error) {
        console.error("Error saving archived debtor:", error);
        // Fallback to localStorage
        debtor.id = 'archived_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        archivedDebtors.push(debtor);
        localStorage.setItem('archivedDebtors', JSON.stringify(archivedDebtors));
        throw error; // Re-throw to handle in calling function
    }
}

async function removeArchivedDebtor(debtorId) {
    try {
        console.log(`Attempting to permanently delete archived debtor with ID: ${debtorId}`);
        
        if (window.firebase) {
            const { database, ref, remove } = window.firebase;
            const archivedRef = ref(database, `archived_debtors/${debtorId}`);
            await remove(archivedRef);
            console.log(`Removed archived debtor from Firebase: ${debtorId}`);
        }
        
        // Update local array
        const index = archivedDebtors.findIndex(d => d.id === debtorId);
        if (index !== -1) {
            const removedDebtor = archivedDebtors.splice(index, 1)[0];
            console.log(`Removed archived debtor from local array: ${removedDebtor.name}`);
        } else {
            console.warn(`Archived debtor not found in local array: ${debtorId}`);
        }
        
        // Update localStorage
        localStorage.setItem('archivedDebtors', JSON.stringify(archivedDebtors));
        return true;
    } catch (error) {
        console.error("Error removing archived debtor:", error);
        throw error;
    }
}

async function loadSentReminders() {
    try {
        if (window.firebase) {
            const { database, ref, get } = window.firebase;
            const remindersRef = ref(database, 'sent_reminders');
            const snapshot = await get(remindersRef);
            
            if (snapshot.exists()) {
                sentReminders = [];
                snapshot.forEach((childSnapshot) => {
                    const reminder = childSnapshot.val();
                    reminder.id = childSnapshot.key;
                    sentReminders.push(reminder);
                });
                sentReminders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            } else {
                sentReminders = [];
            }
            
            // Sync with localStorage as backup
            localStorage.setItem('sentReminders', JSON.stringify(sentReminders));
        } else {
            // Fallback to localStorage
            const saved = localStorage.getItem('sentReminders');
            if (saved) sentReminders = JSON.parse(saved);
        }
    } catch (error) {
        console.error("Error loading sent reminders:", error);
        // Fallback to localStorage on error
        const saved = localStorage.getItem('sentReminders');
        if (saved) sentReminders = JSON.parse(saved);
    }
}

async function saveSentReminder(reminder) {
    try {
        if (window.firebase) {
            const { database, ref, push, set } = window.firebase;
            const remindersRef = ref(database, 'sent_reminders');
            const newReminderRef = push(remindersRef);
            await set(newReminderRef, reminder);
            
            // Update local array
            reminder.id = newReminderRef.key;
            sentReminders.unshift(reminder);
        } else {
            sentReminders.unshift(reminder);
        }
        
        // Always update localStorage as backup
        localStorage.setItem('sentReminders', JSON.stringify(sentReminders));
    } catch (error) {
        console.error("Error saving sent reminder:", error);
        // Fallback to localStorage
        sentReminders.unshift(reminder);
        localStorage.setItem('sentReminders', JSON.stringify(sentReminders));
    }
}

async function removeSentReminder(reminderId) {
    try {
        if (window.firebase) {
            const { database, ref, remove } = window.firebase;
            const reminderRef = ref(database, `sent_reminders/${reminderId}`);
            await remove(reminderRef);
        }
        
        // Update local array
        const index = sentReminders.findIndex(r => r.id === reminderId);
        if (index !== -1) {
            sentReminders.splice(index, 1);
        }
        
        // Update localStorage
        localStorage.setItem('sentReminders', JSON.stringify(sentReminders));
    } catch (error) {
        console.error("Error removing sent reminder:", error);
        throw error;
    }
}

async function loadDueDateSettings() {
    try {
        if (window.firebase) {
            const { database, ref, get } = window.firebase;
            const settingsRef = ref(database, 'settings');
            const snapshot = await get(settingsRef);
            
            if (snapshot.exists()) {
                const settings = snapshot.val();
                if (settings.dueDateDuration !== undefined) {
                    localStorage.setItem('dueDateDuration', settings.dueDateDuration);
                }
                if (settings.reminderInterval !== undefined) {
                    localStorage.setItem('reminderInterval', settings.reminderInterval);
                }
            }
        }
    } catch (error) {
        console.error("Error loading due date settings:", error);
    }
}

async function saveDueDateSettings(dueDateDuration, reminderInterval) {
     if (!canEditSettings()) {
        throw new Error('You do not have permission to modify settings. Admin access required.');
    }
    try {
        if (window.firebase) {
            const { database, ref, set } = window.firebase;
            const settingsRef = ref(database, 'settings');
            await set(settingsRef, {
                dueDateDuration: dueDateDuration,
                reminderInterval: reminderInterval,
                updatedAt: Date.now()
            });
        }
        
        // Always update localStorage
        localStorage.setItem('dueDateDuration', dueDateDuration);
        localStorage.setItem('reminderInterval', reminderInterval);
    } catch (error) {
        console.error("Error saving due date settings:", error);
        // Fallback to localStorage only
        localStorage.setItem('dueDateDuration', dueDateDuration);
        localStorage.setItem('reminderInterval', reminderInterval);
    }
}

// ========================
// DEBTOR MANAGEMENT FUNCTIONS
// ========================
async function saveDebtor(newDebtor) {
    console.log("saveDebtor called with:", newDebtor);

    if (!newDebtor.id) {
        newDebtor.id = 'debtor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    newDebtor.payments = newDebtor.payments || [];
    newDebtor.transactions = newDebtor.transactions || [];

    if (window.firebase) {
        const { database, ref, push, set } = window.firebase;
        const debtorsRef = ref(database, 'debtors');
        const newDebtorRef = push(debtorsRef);
        const firebaseId = newDebtorRef.key;
        newDebtor.id = firebaseId;
        await set(newDebtorRef, newDebtor);
        console.log("Saved to Firebase with ID:", firebaseId);

        // Don't manually update debtors array or call renderDebtors()
        // The Firebase onValue listener will handle this automatically
        
    } else {
        // Fallback for offline mode - manual updates only
        debtors.push(newDebtor);
        localStorage.setItem('debtors', JSON.stringify(debtors));
        console.log("Saved to localStorage with ID:", newDebtor.id);
        renderDebtors();
    }
}

async function updateDebtor(updatedDebtor) {
    try {
        if (window.firebase) {
            const { database, ref, update } = window.firebase;
            const debtorRef = ref(database, 'debtors/' + updatedDebtor.id);
            await update(debtorRef, {
                name: updatedDebtor.name,
                contact: updatedDebtor.contact
            });
            console.log("Debtor updated in Firebase");
        }

        const index = debtors.findIndex(d => d.id === updatedDebtor.id);
        if (index !== -1) {
            debtors[index] = { ...debtors[index], name: updatedDebtor.name, contact: updatedDebtor.contact };
        }

        localStorage.setItem('debtors', JSON.stringify(debtors));
        renderDebtors();
        if (document.getElementById('dashboard').style.display === 'block') {
            updateDashboard();
        }
    } catch (error) {
        console.error('Error updating debtor:', error);
        alert('Failed to update debtor. Please try again.');
    }
}

async function deleteDebtor(debtorId) {
    const debtorIndex = debtors.findIndex(d => d.id === debtorId);
    if (debtorIndex === -1) {
        alert('Debtor not found');
        return;
    }

    const debtor = debtors[debtorIndex];
    if (confirm(`Are you sure you want to delete ${debtor.name}? This will move them to the archive.`)) {
        try {
            // Create a copy for archiving (don't modify original until successful)
            const debtorCopy = JSON.parse(JSON.stringify(debtor));
            
            // Archive the debtor first to Firebase
            await saveArchivedDebtor(debtorCopy);
            console.log(`Debtor ${debtor.name} archived successfully`);

            if (window.firebase) {
                // Only delete from Firebase after successful archiving
                const { database, ref, remove } = window.firebase;
                const debtorRef = ref(database, `debtors/${debtorId}`);
                await remove(debtorRef);
                console.log(`Debtor ${debtor.name} removed from active Firebase list`);
                
                // Don't manually update the debtors array or call renderDebtors()
                // The Firebase onValue listener will handle this automatically
            } else {
                // Only for offline mode - manually update arrays and render
                debtors.splice(debtorIndex, 1);
                localStorage.setItem('debtors', JSON.stringify(debtors));
                renderDebtors();
                updateDashboard();
            }
            
            alert(`${debtor.name} has been moved to archive`);
        } catch (error) {
            console.error("Error deleting/archiving debtor:", error);
            alert("Failed to archive debtor. Please try again.");
        }
    }
}

async function restoreDebtor(debtorId) {
    if (!canRestoreArchived()) {
        alert('You do not have permission to restore archived debtors. Admin access required.');
        return;
    }
    const index = archivedDebtors.findIndex(d => d.id === debtorId);
    if (index === -1) {
        alert('Archived debtor not found');
        return;
    }
    
    const debtorToRestore = archivedDebtors[index];
    if (confirm(`Are you sure you want to restore ${debtorToRestore.name}?`)) {
        try {
            // Prepare the debtor for restoration
            const restoredDebtor = JSON.parse(JSON.stringify(debtorToRestore));
            delete restoredDebtor.archivedAt;
            restoredDebtor.createdAt = Date.now();

            if (window.firebase) {
                // Add to Firebase active debtors
                const { database, ref, push, set } = window.firebase;
                const debtorsRef = ref(database, 'debtors');
                const newDebtorRef = push(debtorsRef);
                const newId = newDebtorRef.key;
                restoredDebtor.id = newId;
                await set(newDebtorRef, restoredDebtor);
                console.log(`Restored debtor to Firebase with new ID: ${newId}`);

                // Remove from archived list using the original archived ID
                await removeArchivedDebtor(debtorToRestore.id);

                // Don't manually update debtors array - Firebase listener handles this
                
                // Close the archive modal and show success message
                document.getElementById('archive-modal').style.display = 'none';
                alert(`${debtorToRestore.name} has been restored`);
                
            } else {
                // Offline mode - manual updates only
                debtors.push(restoredDebtor);
                debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                archivedDebtors.splice(index, 1);

                localStorage.setItem('archivedDebtors', JSON.stringify(archivedDebtors));
                localStorage.setItem('debtors', JSON.stringify(debtors));
                renderDebtors();
                document.getElementById('archive-modal').style.display = 'none';
                alert(`${debtorToRestore.name} has been restored`);
            }
        } catch (error) {
            console.error("Error restoring debtor:", error);
            alert("Failed to restore debtor. Please try again.");
        }
    }
}

async function deletePermanently(debtorId) {
    if (!canPermanentlyDelete()) {
         alert('You do not have permission to permanently delete archived debtors. Admin access required.');
         return;
    }
    const index = archivedDebtors.findIndex(d => d.id === debtorId);
    if (index === -1) {
        alert('Archived debtor not found');
        return;
    }
    
    const debtor = archivedDebtors[index];
    if (confirm(`Are you sure you want to PERMANENTLY delete ${debtor.name}? This action cannot be undone!`)) {
        try {
            await removeArchivedDebtor(debtorId);
            
            // Refresh the archive view immediately
            viewArchive();
            
            alert(`${debtor.name} has been permanently deleted`);
            console.log(`Permanently deleted debtor: ${debtor.name} (ID: ${debtorId})`);
        } catch (error) {
            console.error("Error permanently deleting debtor:", error);
            alert("Failed to delete debtor permanently. Please try again.");
        }
    }
}

// ========================
// PRODUCT MANAGEMENT FUNCTIONS
// ========================
async function saveProduct(product) {
    if (!canManageProducts()) {
        throw new Error('You do not have permission to manage products. Admin access required.');
    }
    try {
        product.name = capitalizeFirstLetter(product.name.trim());
        
        let firebaseId = null;
        if (window.firebase) {
            const { database, ref, push, set } = window.firebase;
            const productsRef = ref(database, 'products');
            const newProductRef = push(productsRef);
            firebaseId = newProductRef.key;
            product.id = firebaseId;
            await set(newProductRef, product);
        } else {
            product.id = 'product_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            products.push(product);
            products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
            localStorage.setItem('products', JSON.stringify(products));
            renderProductsWithSearch(); // Only render for offline mode
        }
        // Remove these lines for Firebase mode - the listener will handle it
        // products.push(product);
        // products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
        // localStorage.setItem('products', JSON.stringify(products));
        // renderProductsWithSearch();
    } catch (error) {
        console.error('Error saving product:', error);
        throw error;
    }
}

async function updateProduct(product) {
    if (!canManageProducts()) {
        throw new Error('You do not have permission to manage products. Admin access required.');
    }
    try {
        if (window.firebase) {
            const { database, ref, update } = window.firebase;
            const productRef = ref(database, `products/${product.id}`);
            await update(productRef, product);
            // Firebase listener will handle the rest
        } else {
            // Only do manual updates for offline mode
            const index = products.findIndex(p => p.id === product.id);
            if (index !== -1) {
                products[index] = product;
                products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
            }
            localStorage.setItem('products', JSON.stringify(products));
            renderProductsWithSearch();
        }
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

async function deleteProduct(productId) {
    if (!canManageProducts()) {
        alert('You do not have permission to manage products. Admin access required.');
        return;
    }
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
        return;
    }
    
    const product = products[productIndex];
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) {
        return;
    }
    
    try {
        // Remove from local array FIRST (optimistic update)
        products.splice(productIndex, 1);
        localStorage.setItem('products', JSON.stringify(products));
        renderProductsWithSearch(); // Update UI immediately
        
        // Then delete from Firebase
        if (window.firebase) {
            const { database, ref, remove } = window.firebase;
            const productRef = ref(database, `products/${productId}`);
            await remove(productRef);
            console.log("Product deleted from Firebase successfully");
        }
        
        alert('Product deleted successfully');
        console.log("Product deleted successfully");
        
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product: ' + error.message);
        
        // Rollback on error - re-add the product
        products.splice(productIndex, 0, product);
        localStorage.setItem('products', JSON.stringify(products));
        renderProductsWithSearch();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const productsList = document.getElementById('products-list');
    if (productsList) {
        // Remove any existing listeners first
        productsList.removeEventListener('click', handleProductsListClick);
        
        // Add the corrected event listener
        productsList.addEventListener('click', handleProductsListClick);
    }
});

function handleProductsListClick(e) {
    // Stop event propagation immediately
    e.stopPropagation();
    
    // Find the closest button that was clicked
    const editBtn = e.target.closest('.edit-product-btn');
    const deleteBtn = e.target.closest('.delete-product-btn');
    
    if (editBtn) {
        e.preventDefault();
        const productId = editBtn.dataset.productId;
        console.log("Edit button clicked for product ID:", productId);
        
        const product = products.find(p => p.id === productId);
        if (product) {
            openProductForm('edit', product);
        } else {
            console.error("Product not found for editing:", productId);
        }
        return;
    }
    
    if (deleteBtn) {
        e.preventDefault();
        const productId = deleteBtn.dataset.productId;
        console.log("Delete button clicked for product ID:", productId);
        
        // Immediately call delete function with the specific product ID
        deleteProduct(productId);
        return;
    }
}

// ========================
// TRANSACTION MANAGEMENT FUNCTIONS
// ========================
async function saveTransaction(debtor, transactionData) {
    const referenceNumber = generateReferenceNumber();
    const transaction = {
        id: 'transaction_' + Date.now(),
        referenceNumber: referenceNumber,
        dateAdded: Date.now(),
        dueDate: transactionData.dueDate,
        total: transactionData.total,
        paid: 0,
        products: transactionData.products
    };

    debtor.transactions = debtor.transactions || [];
    debtor.transactions.push(transaction);
    debtor.totalDebt = (debtor.totalDebt || 0) + transaction.total;

    try {
        if (window.firebase) {
            const { database, ref, update } = window.firebase;
            const debtorRef = ref(database, `debtors/${debtor.id}`);
            await update(debtorRef, { 
                transactions: debtor.transactions, 
                totalDebt: debtor.totalDebt 
            });
        }

        const debtorIndex = debtors.findIndex(d => d.id === debtor.id);
        if (debtorIndex !== -1) {
            debtors[debtorIndex] = { ...debtor };
        }

        localStorage.setItem('debtors', JSON.stringify(debtors));

        await sendNewTransactionSMS(debtor.contact, debtor.name, {
            referenceNumber: transaction.referenceNumber,
            dateAdded: transaction.dateAdded,
            dueDate: transaction.dueDate,
            transactionTotal: transaction.total,
            products: transaction.products,
            totalDebt: debtor.totalDebt
        });

        return transaction;
    } catch (error) {
        console.error('Error saving transaction or sending SMS:', error);
        throw error;
    }
}

async function processPayment(debtor, amount, transactionName, transactionIndex = null) {
    if (!debtor || !debtor.id) {
        throw new Error('Invalid debtor data');
    }

    try {
        const timestamp = Date.now();
        const date = new Date(timestamp);
        const randomComponent = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const reference = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}-${randomComponent}`;

        let transactionId = 'all';
        let transaction = null;
        let paymentHistory = [];
        let paymentDistribution = [];

        debtor.payments = debtor.payments || [];

        if (transactionIndex !== null) {
            transaction = debtor.transactions[transactionIndex];
            transactionId = transaction.id;
            paymentHistory = debtor.payments.filter(p => p.transactionId === transactionId);
        } else {
            paymentHistory = debtor.payments;
        }

        const payment = {
            amount: amount,
            transaction: transactionName,
            transactionId: transactionId,
            timestamp: timestamp,
            reference: reference
        };

        debtor.payments.push(payment);

        if (transactionIndex === null) {
            let remainingAmount = amount;
            for (let i = 0; i < debtor.transactions.length && remainingAmount > 0; i++) {
                const trans = debtor.transactions[i];
                const unpaid = trans.total - (trans.paid || 0);
                if (unpaid > 0) {
                    const paymentToApply = Math.min(remainingAmount, unpaid);
                    trans.paid = (trans.paid || 0) + paymentToApply;
                    remainingAmount -= paymentToApply;
                    paymentDistribution.push({ transaction: trans, amountApplied: paymentToApply });
                }
            }
            debtor.totalDebt -= amount;
            if (debtor.totalDebt < 0) debtor.totalDebt = 0;
        } else {
            transaction.paid = (transaction.paid || 0) + amount;
            debtor.totalDebt -= amount;
            if (debtor.totalDebt < 0) debtor.totalDebt = 0;
        }

        if (window.firebase) {
            const { database, ref, update } = window.firebase;
            const debtorRef = ref(database, `debtors/${debtor.id}`);
            await update(debtorRef, {
                totalDebt: debtor.totalDebt,
                transactions: debtor.transactions,
                payments: debtor.payments
            });
        } else {
            debtors = debtors.map(d => d.id === debtor.id ? debtor : d);
            localStorage.setItem('debtors', JSON.stringify(debtors));
        }

        printReceipt(debtor, amount, debtor.totalDebt, reference, transaction, paymentHistory, paymentDistribution);
        await sendPaymentReceiptSMS(debtor.contact, debtor.name, amount, debtor.totalDebt);

        return true;
    } catch (error) {
        console.error('Payment Processing Error:', error);
        throw error;
    }
}

// ========================
// REMINDER FUNCTIONS
// ========================
function getOverdueTransactions(debtor) {
    const currentDate = new Date().getTime();
    return debtor.transactions.filter(transaction => {
        const dueDate = transaction.dueDate;
        const remainingBalance = transaction.total - (transaction.paid || 0);
        return dueDate && dueDate < currentDate && remainingBalance > 0;
    });
}

function calculateTotalOverdue(transactions) {
    return transactions.reduce((sum, transaction) => {
        const remainingBalance = transaction.total - (transaction.paid || 0);
        return sum + remainingBalance;
    }, 0);
}

function hasOverdueTransactions(debtor) {
    return getOverdueTransactions(debtor).length > 0;
}

function constructReminderMessage(debtor, overdueTransactions, totalOverdue) {
    const header = "[K&J Store] Overdue Transactions Reminder\n";
    const greeting = `Hi ${debtor.name},\n`;
    const summary = `You have ${overdueTransactions.length} overdue transactions totaling ₱${totalOverdue.toFixed(2)}.\n`;
    let details = "Details:\n";

    overdueTransactions.forEach(transaction => {
        const reference = transaction.id;
        const dateAdded = new Date(transaction.dateAdded).toLocaleDateString('en-PH');
        const dueDate = transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString('en-PH') : 'Not Set';
        const total = transaction.total.toFixed(2);
        const paid = (transaction.paid || 0).toFixed(2);
        const remaining = (transaction.total - (transaction.paid || 0)).toFixed(2);

        details += `- Transaction: ${reference}, Added: ${dateAdded}, Due: ${dueDate}, Total: ₱${total}, Paid: ₱${paid}, Remaining: ₱${remaining}\n`;
        details += "  Products:\n";

        transaction.products.forEach(product => {
            const productTotal = (product.quantity * product.price).toFixed(2);
            details += `    - ${product.name}: ${product.quantity} x ₱${product.price.toFixed(2)} = ₱${productTotal}\n`;
        });
    });

    const totalDebt = `Your total debt is ₱${debtor.totalDebt.toFixed(2)}.\n`;
    const closing = "Please settle these payments as soon as possible. If you have already made payments, please disregard this message.";

    return header + greeting + summary + details + totalDebt + closing;
}

async function remindDebtor(debtor, automatic = false) {
    const currentDate = new Date().getTime();
    const overdueTransactions = debtor.transactions.filter(t => 
        t.dueDate && t.dueDate < currentDate && (t.total - (t.paid || 0)) > 0
    );
    
    if (overdueTransactions.length === 0) {
        if (!automatic) alert('No overdue transactions to remind about!');
        return;
    }

    // Double-check if we recently sent a reminder to this debtor
    const recentReminder = sentReminders
        .filter(r => r.debtorId === debtor.id)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (recentReminder && (currentDate - recentReminder.timestamp) < 60000) { // Less than 1 minute ago
        console.log(`Skipping duplicate reminder for ${debtor.name} - sent less than 1 minute ago`);
        return;
    }

    const totalOverdue = overdueTransactions.reduce((sum, t) => sum + (t.total - (t.paid || 0)), 0);
    
    const transactionDetails = overdueTransactions.map(t => {
        const productsList = t.products.map(product => 
            `  • ${product.name} (${product.quantity}x ₱${product.price.toFixed(2)} = ₱${product.total.toFixed(2)})`
        ).join('\n');
        
        return `- Ref: ${t.referenceNumber}
  Due: ${new Date(t.dueDate).toLocaleDateString('en-PH')}
  Remaining: ₱${(t.total - (t.paid || 0)).toFixed(2)}
  Products:
${productsList}`;
    }).join('\n\n');

    const message = `[K&J Store] Overdue Reminder
Hi ${debtor.name},
You have ${overdueTransactions.length} overdue transaction(s) totaling ₱${totalOverdue.toFixed(2)}:

${transactionDetails}

Your total debt is ₱${debtor.totalDebt.toFixed(2)}.
Please settle this soon. Contact us if needed.`;

    const reminder = {
        id: 'reminder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        debtorId: debtor.id,
        debtorName: debtor.name,
        contact: debtor.contact,
        amount: totalOverdue,
        message: message,
        timestamp: Date.now(),
        status: 'pending'
    };

    try {
        await sendReminderSMS(debtor.contact, message);
        reminder.status = 'success';
        if (!automatic) alert('Reminder sent successfully!');
        console.log(`Reminder sent successfully to ${debtor.name}`);
    } catch (error) {
        console.error('Error sending reminder:', error);
        reminder.status = 'failure';
        reminder.error = error.message;
        if (!automatic) alert('Failed to send reminder: ' + error.message);
    } finally {
        await saveSentReminder(reminder);
    }
}


function checkAndSendReminders() {
    // Prevent multiple simultaneous executions
    if (isCheckingReminders) {
        console.log("Reminder check already in progress, skipping...");
        return;
    }
    
    isCheckingReminders = true;
    
    // Set timeout to release lock after 30 seconds (safety measure)
    reminderLockTimeout = setTimeout(() => {
        isCheckingReminders = false;
        console.log("Reminder lock timeout reached, releasing lock");
    }, 30000);

    const now = Date.now();
    const reminderIntervalDays = parseInt(localStorage.getItem('reminderInterval') || '1', 10);
    const reminderIntervalMs = reminderIntervalDays * 24 * 60 * 60 * 1000;

    console.log(`Checking reminders for ${debtors.length} debtors`);
    
    let reminderPromises = [];

    debtors.forEach(debtor => {
        const overdueTransactions = debtor.transactions.filter(t => 
            t.dueDate && t.dueDate < now && (t.total - (t.paid || 0)) > 0
        );
        
        if (overdueTransactions.length > 0) {
            // Check last reminder for this specific debtor
            const lastReminder = sentReminders
                .filter(r => r.debtorId === debtor.id && r.status === 'success')
                .sort((a, b) => b.timestamp - a.timestamp)[0];

            const shouldSend = !lastReminder || (now - lastReminder.timestamp > reminderIntervalMs);
            
            if (shouldSend) {
                console.log(`Queuing reminder for ${debtor.name}`);
                reminderPromises.push(
                    remindDebtor(debtor, true).catch(error => {
                        console.error(`Failed to send reminder to ${debtor.name}:`, error);
                    })
                );
            } else {
                const timeUntilNext = reminderIntervalMs - (now - lastReminder.timestamp);
                const hoursUntilNext = Math.round(timeUntilNext / (1000 * 60 * 60));
                console.log(`Reminder for ${debtor.name} not due yet (${hoursUntilNext} hours remaining)`);
            }
        }
    });

    // Wait for all reminders to complete before releasing lock
    Promise.allSettled(reminderPromises).finally(() => {
        if (reminderLockTimeout) {
            clearTimeout(reminderLockTimeout);
        }
        isCheckingReminders = false;
        console.log("Reminder check completed");
    });
}

async function deleteReminder(id) {
    const index = sentReminders.findIndex(r => r.id === id);
    if (index === -1) {
        alert('Reminder not found');
        return;
    }
    if (confirm('Are you sure you want to delete this reminder?')) {
        try {
            await removeSentReminder(id);
            viewSentReminders(); // Refresh the view
        } catch (error) {
            console.error("Error deleting reminder:", error);
            alert("Failed to delete reminder. Please try again.");
        }
    }
}

// ========================
// RENDERING FUNCTIONS
// ========================
function renderDebtors(debtorsList = debtors) {
    const debtorsListElement = document.getElementById('debtors-list');
    const emptyState = document.getElementById('empty-state');
    if (!debtorsListElement) return;

    debtorsListElement.innerHTML = '';
    if (!debtorsList || debtorsList.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    const currentDate = new Date().getTime();
    
    debtorsList.forEach(debtor => {
        let overdueCount = 0;
        let overdueAmount = 0;
        
        if (debtor.transactions && debtor.transactions.length > 0) {
            debtor.transactions.forEach(transaction => {
                if (transaction.dueDate && transaction.dueDate < currentDate) {
                    const remainingBalance = transaction.total - (transaction.paid || 0);
                    if (remainingBalance > 0) {
                        overdueCount++;
                        overdueAmount += remainingBalance;
                    }
                }
            });
        }

        const overdueIndicator = overdueCount > 0 
            ? `<span class="overdue-indicator" title="₱${overdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Overdue">${overdueCount} Overdue</span>`
            : '';

        const li = document.createElement('li');
        li.setAttribute('data-debtor-id', debtor.id);
        li.classList.add('debtor-entry');
        li.innerHTML = `
            <div class="debtor-header">
                <span>
                    ${debtor.name} - ₱${(debtor.totalDebt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    ${overdueIndicator}
                </span>
                <button class="toggle-details">▼</button>
            </div>
            <div class="debtor-details" style="display: none;">
                <div>Contact: ${debtor.contact}</div>
                <h3>Transactions:</h3>
                <ul>
                    ${debtor.transactions ? debtor.transactions.map((transaction, index) => {
                        const isOverdue = transaction.dueDate && transaction.dueDate < currentDate && (transaction.total - (transaction.paid || 0)) > 0;
                        return `
                            <li class="${isOverdue ? 'overdue' : ''}">
                                <div class="transaction-header">
                                    <div class="columns-container">
                                        <div class="left-column">
                                             <span>Transaction ${index + 1}</span>
                                             <span>Ref: ${transaction.referenceNumber || 'N/A'}</span>
                                             <span>₱${transaction.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div class="right-column">
                                            <span>Date Added: ${new Date(transaction.dateAdded).toLocaleDateString()}</span>
                                            <span>Due: ${transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'Not Set'}</span>
                                            <span>Remaining: ₱${(transaction.total - (transaction.paid || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    <button class="toggle-transaction-details">▼</button>
                                </div>
                                <div class="transaction-details" style="display: none;">
                                    <ul>
                                        ${transaction.products.map(product => `
                                            <li>
                                                ${product.name} - ${product.quantity}x ₱${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ₱${product.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </li>
                        `;
                    }).join('') : '<li>No transactions</li>'}
                </ul>
                <div class="action-buttons">
                   ${canManageTransactions() ? '<button class="add-product-btn">Add Transaction</button>' : ''}
                   ${canMakePayments() ? '<button class="pay-btn">Make Payment</button>' : ''}
                   <button class="payment-history-btn">Payment History</button>
                   ${canManageDebtors() ? '<button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>' : ''}
                   ${canManageDebtors() ? '<button class="delete-btn">Delete</button>' : ''}
                  <button class="print-btn">Print Record</button>
                </div>
            </div>
        `;
        debtorsListElement.appendChild(li);
    });

    if (openDebtorId) {
        const debtorItem = document.querySelector(`li[data-debtor-id="${openDebtorId}"]`);
        if (debtorItem) {
            const details = debtorItem.querySelector('.debtor-details');
            const toggleBtn = debtorItem.querySelector('.toggle-details');
            if (details && toggleBtn) {
                details.style.display = 'block';
                toggleBtn.textContent = '▲';
            }
        }
    }

    document.querySelectorAll('.toggle-transaction-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const details = e.target.parentElement.nextElementSibling;
            const isOpen = details.style.display === 'block';
            details.style.display = isOpen ? 'none' : 'block';
            e.target.textContent = isOpen ? '▼' : '▲';
        });
    });

    document.querySelectorAll('.print-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const debtorId = e.target.closest('li').getAttribute('data-debtor-id');
            const debtor = debtors.find(d => d.id === debtorId);
            openPrintSelectionModal(debtor);
        });
    });

    attachDebtorSelectionListeners();
}

function renderProducts(productsToRender = products, isSearch = false) {
    const productsList = document.getElementById('products-list');
    if (!productsList) return;
    
    if (productsToRender.length === 0) {
        productsList.innerHTML = isSearch ? '<li>No products found</li>' : '<li>No products in inventory</li>';
        return;
    }
    
    // Clear the list first
    productsList.innerHTML = '';
    
    productsToRender.forEach(product => {
        const li = document.createElement('li');
        li.setAttribute('data-product-id', product.id);
        
        const stockClass = product.stock <= 5 ? 'low-stock' : '';
        const editDeleteButtons = canManageProducts() ? `
            <button class="edit-product-btn" data-product-id="${product.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-product-btn" data-product-id="${product.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        ` : '';
        
        li.innerHTML = `
            <span class="${stockClass}">
                ${product.name} - ₱${product.price.toFixed(2)} - Stock: ${product.stock || 0}
            </span>
            ${editDeleteButtons}
        `;
        productsList.appendChild(li);
    });
    
    console.log(`Rendered ${productsToRender.length} products`);
}

async function loadAllUsers() {
    if (!canCreateAccounts()) return;
    
    try {
        if (window.firebase) {
            const { database, ref, get } = window.firebase;
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);
            
            allUsers = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const userData = childSnapshot.val();
                    userData.uid = childSnapshot.key;
                    allUsers.push(userData);
                });
            }
            
            // Sort by createdAt descending
            allUsers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            console.log(`Loaded ${allUsers.length} users`);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Add this function to help debug product IDs
window.debugProductIds = function() {
    console.log("Current products array:", products);
    products.forEach((product, index) => {
        console.log(`Index ${index}: ID=${product.id}, Name=${product.name}`);
    });
    
    // Also check DOM elements
    const productItems = document.querySelectorAll('#products-list li');
    console.log("DOM product items:");
    productItems.forEach((item, index) => {
        const editBtn = item.querySelector('.edit-product-btn');
        const deleteBtn = item.querySelector('.delete-product-btn');
        console.log(`DOM Index ${index}: EditID=${editBtn?.dataset.productId}, DeleteID=${deleteBtn?.dataset.productId}`);
    });
};

// Add this function to manually test delete
window.testDelete = function(productId) {
    console.log("Testing delete for product ID:", productId);
    deleteProduct(productId);
};

function renderProductsWithSearch() {
    const searchTerm = document.getElementById('product-search').value.trim().toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name && typeof product.name === 'string' && product.name.toLowerCase().includes(searchTerm)
    );
    renderProducts(filteredProducts, searchTerm !== '');
}

function displayPaymentItem(payment, index, listElement) {
    if (!payment) return;
    
    const li = document.createElement('li');
    li.innerHTML = `
        <div class="payment-item">
            <span>Reference: ${payment.reference || 'N/A'}</span>
            <span>Payment For: ${payment.transaction || 'Unknown'}</span>
            <span>Amount: ₱${payment.amount ? payment.amount.toFixed(2) : '0.00'}</span>
            <span>Date: ${payment.timestamp ? new Date(payment.timestamp).toLocaleString() : 'Unknown'}</span>
        </div>
    `;
    listElement.appendChild(li);
}

// ========================
// DASHBOARD FUNCTIONS
// ========================
function updateDashboard() {
    console.log("Updating dashboard with", debtors.length, "debtors");

    const totals = debtors.reduce((acc, debtor) => {
        acc.totalDebt += (debtor.totalDebt || 0);
        if (debtor.payments && Array.isArray(debtor.payments)) {
            acc.totalPayments += debtor.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        }
        return acc;
    }, { totalDebt: 0, totalPayments: 0 });

    updateElement('total-debt', `₱${totals.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    updateElement('total-debtors', debtors.length);
    updateElement('total-payments', `₱${totals.totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    updateRecentTransactions();
    updateTopDebtors();

    if (document.getElementById('dashboard').style.display !== 'none') {
        updateDashboardCharts();
    }
}

function updateDashboardCharts() {
    const topDebtors = [...debtors]
        .sort((a, b) => (b.totalDebt || 0) - (a.totalDebt || 0))
        .slice(0, 5);
    const debtLabels = topDebtors.map(d => `${d.name} (₱${d.totalDebt.toFixed(2)})`);
    const debtData = topDebtors.map(d => d.totalDebt);

    if (debtDistributionChart) {
        debtDistributionChart.data.labels = debtLabels;
        debtDistributionChart.data.datasets[0].data = debtData;
        debtDistributionChart.update();
    } else {
        const ctx = document.getElementById('debt-distribution-chart').getContext('2d');
        debtDistributionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: debtLabels,
                datasets: [{
                    data: debtData,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' }, title: { display: true, text: 'Top 5 Debtors' } }
            }
        });
    }

    const paymentsByMonth = {};
    debtors.forEach(debtor => {
        if (debtor.payments && Array.isArray(debtor.payments)) {
            debtor.payments.forEach(payment => {
                const date = new Date(payment.timestamp);
                const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
                paymentsByMonth[monthYear] = (paymentsByMonth[monthYear] || 0) + (payment.amount || 0);
            });
        }
    });
    const months = Object.keys(paymentsByMonth).sort((a, b) => {
        const [ma, ya] = a.split('/').map(Number);
        const [mb, yb] = b.split('/').map(Number);
        return ya - yb || ma - mb;
    });
    const paymentValues = months.map(month => paymentsByMonth[month]);

    if (paymentTrendsChart) {
        paymentTrendsChart.data.labels = months;
        paymentTrendsChart.data.datasets[0].data = paymentValues;
        paymentTrendsChart.update();
    } else {
        const ctx = document.getElementById('payment-trends-chart').getContext('2d');
        paymentTrendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Payments Received',
                    data: paymentValues,
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { callback: v => `₱${v.toFixed(2)}` } } },
                plugins: { title: { display: true, text: 'Monthly Payment' } }
            }
        });
    }
}

function updateRecentTransactions() {
    const recentTransactionsList = document.getElementById('recent-transactions-list');
    if (!recentTransactionsList) return;

    const paymentTransactions = debtors.flatMap(debtor => 
        (debtor.payments || []).map(payment => ({
            type: 'Payment',
            debtorName: debtor.name,
            amount: payment.amount,
            timestamp: payment.timestamp
        }))
    );

    const reminderTransactions = sentReminders.map(reminder => ({
        type: 'Reminder',
        debtorName: reminder.debtorName,
        timestamp: reminder.timestamp
    }));

    const allTransactions = [...paymentTransactions, ...reminderTransactions]
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const recentTransactions = allTransactions.slice(0, 5);

    recentTransactionsList.innerHTML = recentTransactions.length ?
        recentTransactions.map(transaction => `
            <li>
                <div class="transaction-item">
                    <span>${transaction.type}: ${transaction.debtorName}</span>
                    ${transaction.amount ? `<span>₱${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>` : ''}
                    <span>${new Date(transaction.timestamp || Date.now()).toLocaleDateString()}</span>
                </div>
            </li>
        `).join('') :
        '<li>No recent transactions</li>';
}

function updateTopDebtors() {
    const topDebtorsList = document.getElementById('top-debtors-list');
    if (!topDebtorsList) return;

    const currentDate = new Date().getTime();

    const debtorsWithOverdue = debtors
        .map(debtor => {
            const overdueAmount = (debtor.transactions || []).reduce((sum, transaction) => {
                const remainingBalance = transaction.total - (transaction.paid || 0);
                if (transaction.dueDate && transaction.dueDate < currentDate && remainingBalance > 0) {
                    return sum + remainingBalance;
                }
                return sum;
            }, 0);
            return { name: debtor.name, overdueAmount };
        })
        .filter(debtor => debtor.overdueAmount > 0)
        .sort((a, b) => b.overdueAmount - a.overdueAmount)
        .slice(0, 5);

    topDebtorsList.innerHTML = debtorsWithOverdue.length ?
        debtorsWithOverdue.map(debtor => `
            <li>
                <div class="debtor-item">
                    <span>${debtor.name} - ₱${debtor.overdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} overdue</span>
                </div>
            </li>
        `).join('') :
        '<li>No debtors with overdue amounts</li>';
}

function openDashboard() {
    console.log("Opening dashboard...");
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('main-container').style.display = 'none';
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.remove('active');
    }
    
    updateDashboard();
}

function closeDashboard() {
    if (debtDistributionChart) {
        debtDistributionChart.destroy();
        debtDistributionChart = null;
    }
    if (paymentTrendsChart) {
        paymentTrendsChart.destroy();
        paymentTrendsChart = null;
    }
    
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';
}

// ========================
// ARCHIVE AND REMINDER FUNCTIONS
// ========================
async function viewArchive() {
    // Load archived debtors first to ensure we have the latest data
    await loadArchivedDebtors();
    
    const archiveList = document.getElementById('archive-list');
    archiveList.innerHTML = '';

    if (archivedDebtors.length === 0) {
        archiveList.innerHTML = '<li class="empty-state">No archived debtors</li>';
    } else {
        const sortedArchived = [...archivedDebtors].sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
        sortedArchived.forEach((debtor) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="archived-debtor">
                    <div class="debtor-header">
                        <strong>${debtor.name}</strong>
                        <div class="button-group">
                            <button class="restore-btn" data-debtor-id="${debtor.id}">
                                <i class="fas fa-undo"></i> Restore
                            </button>
                            <button class="delete-permanent-btn" data-debtor-id="${debtor.id}">
                                <i class="fas fa-trash"></i> Delete Permanently
                            </button>
                        </div>
                    </div>
                    <div>Contact: ${debtor.contact}</div>
                    <div>Total Debt: ₱${(debtor.totalDebt || 0).toFixed(2)}</div>
                    <div>Archived on: ${new Date(debtor.archivedAt || Date.now()).toLocaleString()}</div>
                </div>
            `;
            archiveList.appendChild(li);
        });
    }

    // Add event listeners with proper error handling
    document.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const debtorId = btn.getAttribute('data-debtor-id');
            console.log('Restore button clicked for debtor ID:', debtorId);
            await restoreDebtor(debtorId);
        });
    });

    document.querySelectorAll('.delete-permanent-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const debtorId = btn.getAttribute('data-debtor-id');
            console.log('Permanent delete button clicked for debtor ID:', debtorId);
            await deletePermanently(debtorId);
        });
    });

    // Show the modal
    document.getElementById('archive-modal').style.display = 'block';
}

function viewSentReminders() {
    const remindersList = document.getElementById('sent-reminders-list');
    remindersList.innerHTML = '';
    
    const savedReminders = localStorage.getItem('sentReminders');
    if (savedReminders) sentReminders = JSON.parse(savedReminders);
    
    sentReminders.forEach(reminder => {
        if (!reminder.id) {
            reminder.id = 'reminder_' + reminder.timestamp + '_' + Math.random().toString(36).substr(2, 9);
        }
    });
    
    if (sentReminders.length === 0) {
        remindersList.innerHTML = '<li class="empty-state">No sent reminders</li>';
    } else {
        sentReminders.forEach((reminder, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="reminder-item">
                    <div class="reminder-header">
                        <strong>To: ${reminder.debtorName}</strong>
                        <span class="reminder-status ${reminder.status}">
                            ${reminder.status.toUpperCase()}
                        </span>
                    </div>
                    <div>Contact: ${reminder.contact}</div>
                    <div>Amount: ₱${reminder.amount.toFixed(2)}</div>
                    <div>Sent: ${new Date(reminder.timestamp).toLocaleString()}</div>
                    <div class="reminder-message">${reminder.message}</div>
                    ${reminder.status === 'failure' ? 
                        `<div class="reminder-error">Error: ${reminder.error || 'Unknown error'}</div>` : ''}
                    <button class="delete-reminder-btn" data-id="${reminder.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            remindersList.appendChild(li);
        });
        
        document.querySelectorAll('.delete-reminder-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.delete-reminder-btn').getAttribute('data-id');
                deleteReminder(id);
            });
        });
    }
    
    document.getElementById('sent-reminders-modal').style.display = 'block';
}

// ========================
// PRINT FUNCTIONS
// ========================
function printReceipt(debtor, paymentAmount, remainingBalance, reference, transaction = null, paymentHistory = [], paymentDistribution = null) {
    const printWindow = window.open('receipt.html', '_blank');
    printWindow.onload = function() {
        const printDoc = printWindow.document;
        const receiptBody = printDoc.querySelector('.receipt');

        printDoc.getElementById('debtor-name').textContent = debtor.name;
        printDoc.getElementById('payment-amount').textContent = `₱${paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        printDoc.getElementById('remaining-balance').textContent = `₱${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        printDoc.getElementById('date').textContent = new Date().toLocaleString();
        printDoc.getElementById('ref-number').textContent = reference;
        printDoc.getElementById('pos-id').textContent = currentUser && currentUser.displayName ? currentUser.displayName : 'Unknown';

        if (transaction) {
            const previousPaid = transaction.paid - paymentAmount;
            const previousRemaining = transaction.total - previousPaid;

            const transactionDetails = printDoc.createElement('div');
            transactionDetails.innerHTML = `
                <h3>Transaction Details</h3>
                <p><strong>Transaction ID:</strong> ${transaction.id}</p>
                <p><strong>Reference Number:</strong> ${transaction.referenceNumber || 'N/A'}</p>
                <p><strong>Date Added:</strong> ${new Date(transaction.dateAdded).toLocaleString()}</p>
                <p><strong>Due Date:</strong> ${transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'Not Set'}</p>
                <p><strong>Transaction Total:</strong> ₱${transaction.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <h4>Before This Payment</h4>
                <p><strong>Previously Paid:</strong> ₱${previousPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p><strong>Previous Remaining Balance:</strong> ₱${previousRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <h4>This Payment</h4>
                <p><strong>Current Payment:</strong> ₱${paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <h4>After This Payment</h4>
                <p><strong>Total Paid to Date:</strong> ₱${transaction.paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p><strong>Remaining Balance:</strong> ₱${(transaction.total - transaction.paid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <h5>Products Purchased</h5>
                <ul>
                    ${transaction.products.map(product => `
                        <li>${product.name} - ${product.quantity}x ₱${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ₱${product.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
                    `).join('')}
                </ul>
            `;
            receiptBody.appendChild(transactionDetails);

            const paymentHistorySection = printDoc.createElement('div');
            paymentHistorySection.innerHTML = `
                <h3>Payment History for This Transaction</h3>
                <ul>
                    ${paymentHistory.map(payment => `
                        <li>${new Date(payment.timestamp).toLocaleString()} - ₱${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Ref: ${payment.reference})</li>
                    `).join('')}
                    <li>${new Date().toLocaleString()} - ₱${paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Ref: ${reference})</li>
                </ul>
            `;
            receiptBody.appendChild(paymentHistorySection);
        } else if (paymentDistribution) {
            const distributionSection = printDoc.createElement('div');
            distributionSection.innerHTML = '<h3>Payment Applied To:</h3>';
            paymentDistribution.forEach(dist => {
                const trans = dist.transaction;
                const amountApplied = dist.amountApplied;
                const remainingForTransaction = trans.total - trans.paid;
                const status = remainingForTransaction <= 0 ? ' (Fully Paid)' : '';
                distributionSection.innerHTML += `
                    <div>
                        <h4>Transaction: ${trans.id}${status}</h4>
                        <p><strong>Reference Number:</strong> ${trans.referenceNumber || 'N/A'}</p>
                        <p><strong>Date Added:</strong> ${new Date(trans.dateAdded).toLocaleString()}</p>
                        <p><strong>Due Date:</strong> ${trans.dueDate ? new Date(trans.dueDate).toLocaleDateString() : 'Not Set'}</p>
                        <p><strong>Transaction Total:</strong> ₱${trans.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p><strong>Amount Applied:</strong> ₱${amountApplied.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p><strong>Total Paid:</strong> ₱${trans.paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p><strong>Remaining:</strong> ₱${remainingForTransaction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <h5>Products</h5>
                        <ul>
                            ${trans.products.map(product => `
                                <li>${product.name} - ${product.quantity}x ₱${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ₱${product.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            });
            receiptBody.appendChild(distributionSection);

            const paymentSection = printDoc.createElement('div');
            paymentSection.innerHTML = `
                <h3>This Payment</h3>
                <ul>
                    <li>${new Date().toLocaleString()} - ₱${paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Ref: ${reference})</li>
                </ul>
            `;
            receiptBody.appendChild(paymentSection);
        }

        printWindow.print();
    };
}

function printDebtorRecord(debtor, transactionsToPrint = null) {
    if (!transactionsToPrint) {
        transactionsToPrint = debtor.transactions;
    }

    const printWindow = window.open('record.html', '_blank');
    printWindow.onload = function() {
        const printDoc = printWindow.document;

        printDoc.getElementById('debtor-name').textContent = debtor.name;
        printDoc.getElementById('debtor-contact').textContent = debtor.contact;
        printDoc.getElementById('total-debt').textContent = `₱${debtor.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        printDoc.getElementById('date').textContent = new Date().toLocaleDateString();
        printDoc.getElementById('ref-number').textContent = 'REF-' + Math.floor(Math.random() * 1000000);
        printDoc.getElementById('pos-id').textContent = currentUser && currentUser.displayName ? currentUser.displayName : 'Unknown';

        const transactionsList = printDoc.getElementById('transactions-list');
        if (transactionsToPrint && transactionsToPrint.length > 0) {
            transactionsToPrint.forEach((transaction, index) => {
                const remaining = transaction.total - (transaction.paid || 0);
                const remainingText = remaining > 0 
                    ? `₱${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                    : 'Fully Paid';

                const transactionDiv = printDoc.createElement('div');
                transactionDiv.innerHTML = `
                    <h4>Transaction ${index + 1}</h4>
                    <p>Date Added: ${new Date(transaction.dateAdded).toLocaleDateString()}</p>
                    <p>Due Date: ${transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'Not Set'}</p>
                    <p><strong>Total:</strong> ₱${transaction.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p><strong>Paid:</strong> ₱${(transaction.paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p><strong>Remaining:</strong> ${remainingText}</p>
                    <h5>Products</h5>
                    <ul>
                        ${transaction.products.map(product => `
                            <li>${product.name} - ${product.quantity}x ₱${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ₱${product.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
                        `).join('')}
                    </ul>
                    <h5>Payments for this Transaction</h5>
                    <ul>
                        ${debtor.payments.filter(p => p.transactionId === transaction.id).map(payment => `
                            <li>${new Date(payment.timestamp).toLocaleDateString()} - ₱${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Ref: ${payment.reference})</li>
                        `).join('') || '<li>No payments for this transaction</li>'}
                    </ul>
                `;
                transactionsList.appendChild(transactionDiv);
            });
        } else {
            transactionsList.innerHTML = '<p>No transactions to print</p>';
        }

        const generalPayments = printDoc.getElementById('general-payments');
        const allPayments = debtor.payments.filter(p => p.transactionId === 'all');
        if (allPayments.length > 0) {
            allPayments.forEach(payment => {
                const li = printDoc.createElement('li');
                li.textContent = `${new Date(payment.timestamp).toLocaleDateString()} - ₱${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Ref: ${payment.reference})`;
                generalPayments.appendChild(li);
            });
        } else {
            generalPayments.innerHTML = '<li>No general payments</li>';
        }

        printWindow.print();
    };
}

function openPrintSelectionModal(debtor) {
    const modal = document.getElementById('print-selection-modal');
    const selectionList = document.getElementById('transaction-selection-list');
    selectionList.innerHTML = '';

    if (debtor.transactions && debtor.transactions.length > 0) {
        debtor.transactions.forEach((transaction, index) => {
            const div = document.createElement('div');
            div.innerHTML = `
                <label>
                    <input type="checkbox" value="${index}">
                    Transaction ${index + 1} - ₱${transaction.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </label>
            `;
            selectionList.appendChild(div);
        });
    } else {
        selectionList.innerHTML = '<p>No transactions to select</p>';
    }

    modal.style.display = 'block';

    document.getElementById('print-selected-btn').onclick = () => {
        const checkedBoxes = selectionList.querySelectorAll('input[type="checkbox"]:checked');
        const selectedIndices = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
        const selectedTransactions = selectedIndices.map(index => debtor.transactions[index]);
        printDebtorRecord(debtor, selectedTransactions);
        closeAllModals();
    };

    document.getElementById('print-all-btn').onclick = () => {
        printDebtorRecord(debtor);
        closeAllModals();
    };

    document.querySelector('#print-selection-modal .cancel-btn').onclick = closeAllModals;
}

// ========================
// HAMBURGER MENU FIX
// ========================

// Remove the existing toggleSidebar function and replace with this simpler version
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        console.log('Sidebar toggled, active state:', sidebar.classList.contains('active'));
    }
}

// Updated initialization function
function initializeSidebar() {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidebar = document.querySelector('.sidebar');

    console.log('Initializing sidebar - hamburger:', hamburgerMenu, 'sidebar:', sidebar);

    if (hamburgerMenu && sidebar) {
        // Remove any existing listeners to prevent duplicates
        hamburgerMenu.removeEventListener('click', toggleSidebar);
        
        // Add the click event listener
        hamburgerMenu.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Hamburger menu clicked');
            toggleSidebar();
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', function(event) {
            // Check if click is outside both sidebar and hamburger menu
            if (!sidebar.contains(event.target) && !hamburgerMenu.contains(event.target)) {
                if (sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    console.log('Sidebar closed by clicking outside');
                }
            }
        });

        // Prevent sidebar clicks from closing the sidebar
        sidebar.addEventListener('click', function(event) {
            event.stopPropagation();
        });

    } else {
        console.error('Sidebar initialization failed - missing elements');
    }
}

// ========================
// UPDATED DOCUMENT READY EVENT
// ========================

// Replace the existing DOMContentLoaded event listener with this updated version
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded - initializing dashboard');
    
    // Initialize Firebase
    try {
        await initializeFirebase();
        console.log("Firebase initialized successfully");
        await loadDebtors();
    } catch (error) {
        console.error("Initialization error:", error);
        alert("Warning: Using offline mode. Some features may be limited.");
        
        // Load from localStorage as fallback
        const savedDebtors = localStorage.getItem('debtors');
        if (savedDebtors) {
            debtors = JSON.parse(savedDebtors);
            debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            renderDebtors();
        }
    }
    
    // Initialize sidebar - MOVED UP TO ENSURE IT RUNS EARLY
    initializeSidebar();
    
    // Initialize password toggles
    initializePasswordToggles();
    
    // Load current user and products
    loadCurrentUser();
    await loadProducts();
    
    // Load archived debtors, sent reminders, and settings from Firebase
    await loadArchivedDebtors();
    await loadSentReminders();
    await loadDueDateSettings();

    setTimeout(() => {
        console.log('Current user role:', currentUserRole);
        updateUIBasedOnRole();
        renderDebtors(); // Re-render with proper permissions
    }, 500);

    // Dashboard button listeners
    const dashboardBtn = document.getElementById('dashboard-btn');
    const dashboardBackBtn = document.getElementById('dashboard-back-btn');
    
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function() {
            openDashboard();
            checkAndSendReminders();
        });
    }
    
    if (dashboardBackBtn) {
        dashboardBackBtn.addEventListener('click', closeDashboard);
    }
    
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Add debtor button
    const addDebtorBtn = document.getElementById('add-debtor-btn');
    if (addDebtorBtn) {
        addDebtorBtn.addEventListener('click', () => {
            // This check should allow all roles
            if (!canManageDebtors()) {
                alert('You do not have permission to manage debtors.');
                return;
            }
            editingDebtorId = null;
            document.querySelector('#debtor-form-modal h2').textContent = 'Add Debtor';
            document.querySelector('#debtor-form button[type="submit"]').textContent = 'Save';
            document.getElementById('debtor-form').reset();
            document.getElementById('debtor-form-modal').style.display = 'block';
        });
    }

    // Modal close buttons
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Debtors list click delegation
    const debtorsList = document.getElementById('debtors-list');
    if (debtorsList) {
        debtorsList.addEventListener('click', handleDebtorActions);
    }

    // Users real-time listener (only load if user can create accounts)
  if (canCreateAccounts()) {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        allUsers = [];
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            user.uid = childSnapshot.key;
            allUsers.push(user);
        });
        // Sort by createdAt descending
        allUsers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        // If modal open, re-render
        if (document.getElementById('user-management-modal').style.display === 'block') {
            renderUsers();
        }
    });
  }

    // Search functionality
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', debounce((e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredDebtors = searchTerm ?
                debtors.filter(debtor => debtor.name.toLowerCase().includes(searchTerm)) :
                debtors;
            renderDebtors(filteredDebtors);
        }, 300));
    }

    // Archive and sent reminders buttons
    document.getElementById('archive-btn')?.addEventListener('click', viewArchive);
    document.getElementById('sent-reminders-btn')?.addEventListener('click', viewSentReminders);
    
    // Products button
    document.getElementById('products-btn')?.addEventListener('click', () => {
        const productSearch = document.getElementById('product-search');
        if (productSearch) productSearch.value = '';
        renderProductsWithSearch();
        document.getElementById('products-modal').style.display = 'block';
        const addProductBtn = document.getElementById('add-product-inventory-btn');
        if (addProductBtn) {
            addProductBtn.style.display = isAdmin() ? 'block' : 'none';
        }
    });

    // Add product inventory button
    document.getElementById('add-product-inventory-btn')?.addEventListener('click', () => {
        openProductForm('add');
    });

    // Products list event delegation
    document.getElementById('products-list')?.addEventListener('click', (e) => {
        if (e.target.closest('.edit-product-btn')) {
            const productId = e.target.closest('.edit-product-btn').dataset.productId;
            const product = products.find(p => p.id === productId);
            if (product) openProductForm('edit', product);
        } else if (e.target.closest('.delete-product-btn')) {
            const productId = e.target.closest('.delete-product-btn').dataset.productId;
            deleteProduct(productId);
        }
    });

    // Product search
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
        productSearch.addEventListener('input', debounce(renderProductsWithSearch, 300));
    }

    // Profile button
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', openProfileModal);
    }
    
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }
    
    // Create account button
    const createAccountBtn = document.getElementById('create-account-btn');
       if (createAccountBtn) {
        createAccountBtn.addEventListener('click', () => {
           if (!canCreateAccounts()) {
               alert('You do not have permission to create accounts. Admin access required.');
              return;
           }
           openAddAccountModal();
       });
   }
    
//     // Add account form
//     const addAccountForm = document.getElementById('add-account-form');
//   if (addAccountForm) {
//     addAccountForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const accountType = document.getElementById('new-account-type').value;
//         const fullName = document.getElementById('new-full-name').value;
//         const emailInput = document.getElementById('new-email');

//         // Add this check to prevent accessing value on null
//         if (emailInput === null) {
//             console.error("Element with ID 'new-email' not found.");
//             return; // Or handle the missing element in another way
//         }

//         console.log(emailInput);
//         const email = emailInput.value.trim();
//         const password = document.getElementById('new-password').value;
//         const confirmPassword = document.getElementById('new-confirm-password').value;

//         if (password !== confirmPassword) {
//             alert('Passwords do not match!');
//             return;
//         }

        
//         try {
//             const newUser = await createUserWithEmailAndPassword(auth, email, password);
//             const userData = {
//                 displayName: capitalizeWords(fullName),
//                 email,
//                 role: accountType,
//                 createdAt: Date.now(),
//                 createdBy: currentUser.uid,  // Add this
//                 active: true  // Add this
//             };
//             await createUserRecord(newUser.user.uid, userData);
//             alert('Account created successfully!');
//             addAccountForm.reset();
//             closeAllModals();
//         } catch (error) {
//             alert(`Failed to create account: ${error.message}`);
//             console.error(error);
//         }
//     });
//   }

    // Due date settings
    const dueDateSettingsBtn = document.getElementById('due-date-settings-btn');
    const dueDateSettingsModal = document.getElementById('due-date-settings-modal');
    if (dueDateSettingsBtn && dueDateSettingsModal) {
        dueDateSettingsBtn.addEventListener('click', () => {
            dueDateSettingsModal.style.display = 'block';
            const form = document.getElementById('due-date-settings-form');
            const inputs = form.querySelectorAll('input');
            const saveButton = form.querySelector('button[type="submit"]');
            
            if (!canEditSettings()) {
                inputs.forEach(input => input.disabled = true);
                if (saveButton) {
                    saveButton.disabled = true;
                    saveButton.textContent = 'You do not have permission to modify settings';
                }
            } else {
                inputs.forEach(input => input.disabled = false);
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = 'Save';
                }
            }
            
            const currentDuration = localStorage.getItem('dueDateDuration');
            const currentInterval = localStorage.getItem('reminderInterval');
            if (currentDuration) {
                document.getElementById('due-date-duration').value = currentDuration;
            }
            if (currentInterval) {
                document.getElementById('reminder-interval').value = currentInterval;
            }
        });
    }

    // Due date settings form
    const dueDateSettingsForm = document.getElementById('due-date-settings-form');
    if (dueDateSettingsForm) {
        dueDateSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!canEditSettings()) {
                alert('You do not have permission to modify these settings.');
                return;
            }
            const duration = document.getElementById('due-date-duration').value;
            const reminderInterval = document.getElementById('reminder-interval').value;
            if (duration && !isNaN(duration) && duration >= 0 && reminderInterval && !isNaN(reminderInterval) && reminderInterval >= 1) {
                try {
                    await saveDueDateSettings(duration, reminderInterval);
                    alert('Settings saved successfully!');
                    closeAllModals();
                } catch (error) {
                    console.error('Error saving settings:', error);
                    alert('Failed to save settings. Please try again.');
                }
            } else {
                alert('Please enter valid numbers.');
            }
        });
    }

    // Products button with permission check
    document.getElementById('products-btn')?.addEventListener('click', () => {
        const productSearch = document.getElementById('product-search');
        if (productSearch) productSearch.value = '';
        renderProductsWithSearch();
        document.getElementById('products-modal').style.display = 'block';
        const addProductBtn = document.getElementById('add-product-inventory-btn');
        if (addProductBtn) {
            addProductBtn.style.display = canManageProducts() ? 'block' : 'none';
        }
    });

    // Add product inventory button with permission check
    document.getElementById('add-product-inventory-btn')?.addEventListener('click', () => {
        if (canManageProducts()) {
            openProductForm('add');
        } else {
            alert('You do not have permission to add products.');
        }
    });

    // Products list event delegation with permission checks
    document.getElementById('products-list')?.addEventListener('click', (e) => {
        if (e.target.closest('.edit-product-btn')) {
            if (!canManageProducts()) {
                alert('You do not have permission to edit products.');
                return;
            }
            const productId = e.target.closest('.edit-product-btn').dataset.productId;
            const product = products.find(p => p.id === productId);
            if (product) openProductForm('edit', product);
        } else if (e.target.closest('.delete-product-btn')) {
            if (!canManageProducts()) {
                alert('You do not have permission to delete products.');
                return;
            }
            const productId = e.target.closest('.delete-product-btn').dataset.productId;
            deleteProduct(productId);
        }
    });

    const userMgmtBtn = document.getElementById('user-management-btn');
   if (userMgmtBtn) {
    userMgmtBtn.addEventListener('click', () => {
        if (!canCreateAccounts()) return;  // Hide functionality for sub_admins
        document.getElementById('user-management-modal').style.display = 'block';
        renderUsers();
    });
    // Hide button if not admin/super
    userMgmtBtn.style.display = canCreateAccounts() ? 'block' : 'none';
   }

   // Add after the line: const userMgmtBtn = document.getElementById('user-management-btn');
 if (userMgmtBtn) {
    userMgmtBtn.addEventListener('click', async () => {
        if (!canCreateAccounts()) return;
        await loadAllUsers(); // Load users before showing modal
        document.getElementById('user-management-modal').style.display = 'block';
        renderUsers();
    });
    userMgmtBtn.style.display = canCreateAccounts() ? 'block' : 'none';
 }


   const usersList = document.getElementById('users-list');
 if (usersList) {
    usersList.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const uid = target.dataset.uid;
        const user = allUsers.find(u => u.uid === uid);
        if (!user) return;
        
        // Check permissions - Admins cannot delete Super Admins
        const canManage = isSuperAdmin() || (isAdmin() && user.role !== USER_ROLES.SUPER_ADMIN);
        
        if (target.classList.contains('toggle-user-btn')) {
            if (!canManage) {
                alert('You cannot manage Super Admin accounts.');
                return;
            }
            
            const newActive = user.active !== false ? false : true;
            const action = newActive ? 'activate' : 'deactivate';
            
            if (!confirm(`Are you sure you want to ${action} ${user.displayName || user.email}?`)) {
                return;
            }
            
            try {
                await update(ref(database, `users/${uid}`), { active: newActive });
                alert(`User ${action}d successfully.`);
                
                await loadAllUsers();
                renderUsers();
            } catch (error) {
                alert(`Failed to ${action} user: ${error.message}`);
                console.error(error);
            }
            
        } else if (target.classList.contains('delete-user-btn')) {
    if (!canManage) {
        alert('You cannot delete Super Admin accounts.');
        return;
    }
    
    console.log('Attempting to delete user:', user);
    console.log('Current user role:', currentUserRole);
    console.log('Target user role:', user.role);
    
    if (!confirm(`⚠️ WARNING: Permanently delete ${user.displayName || user.email}?`)) {
        return;
    }
    
    try {
        console.log('Deleting from auth...');
        await deleteUserFromAuth(uid);
        
        console.log('Deleting from database...');
        await remove(ref(database, `users/${uid}`));
        
        alert('User permanently deleted successfully.');
        
        await loadAllUsers();
        renderUsers();
    } catch (error) {
        console.error('Delete error details:', error);
        alert(`Failed to delete user: ${error.message}`);
    }
 }
    });
 }

 // Add event delegation for delete buttons
 document.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-user-btn')) {
        const button = e.target.closest('.delete-user-btn');
        const uid = button.dataset.uid;
        
        if (!uid) {
            alert('User ID not found.');
            return;
        }
        
        if (!confirm(`Delete user ${button.closest('.user-item').querySelector('.user-name').textContent}? This is permanent!`)) {
            return;
        }
        
        try {
            // Call your existing function
            await deleteUserFromAuth(uid);
            
            // Refresh users list
            loadAllUsers();  // Assuming you have this function to reload users
            alert('User deleted successfully.');
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete user: ' + error.message);
        }
    }
 });

   const userSearch = document.getElementById('user-search');
   if (userSearch) {
      userSearch.addEventListener('input', debounce(renderUsers, 300));
   }

   

    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (!canCheckout()) {
               alert('You do not have permission to checkout products.');
               return;
           }
          document.getElementById('checkout-form-modal').style.display = 'block';
        });
   }

    // Apply capitalization on blur for name inputs
    ['debtor-name', 'product-name', 'new-product-name'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', function() {
                this.value = capitalizeWords(this.value);
            });
        }
    });
});

function attachDebtorSelectionListeners() {
    const debtorEntries = document.querySelectorAll('.debtor-entry');
    debtorEntries.forEach(entry => {
        entry.addEventListener('click', (event) => {
            document.querySelectorAll('.debtor-entry').forEach(d => d.classList.remove('selected'));
            event.currentTarget.classList.add('selected');
            selectedDebtorId = event.currentTarget.getAttribute('data-debtor-id');
        });
    });
}

function handleDebtorActions(e) {
    const target = e.target;
    const debtorItem = target.closest('li');
    if (!debtorItem) return;

    const debtorId = debtorItem.getAttribute('data-debtor-id');
    const debtor = debtors.find(d => d.id === debtorId);

    if (target.classList.contains('toggle-details')) {
        const details = debtorItem.querySelector('.debtor-details');
        const isCurrentlyOpen = details.style.display === 'block';

        document.querySelectorAll('.debtor-details').forEach(detail => {
            detail.style.display = 'none';
        });
        document.querySelectorAll('.toggle-details').forEach(btn => {
            btn.textContent = '▼';
        });

        if (!isCurrentlyOpen) {
            details.style.display = 'block';
            target.textContent = '▲';
            openDebtorId = debtorId;
        } else {
            openDebtorId = null;
        }
    }

    if (target.classList.contains('add-product-btn')) {
        // Remove the permission check here since button visibility already handles it
        selectedDebtorId = debtorId;
        document.getElementById('product-form').reset();

        const dueDateDuration = parseInt(localStorage.getItem('dueDateDuration') || '0', 10);
        const dueDateDisplay = document.getElementById('transaction-due-display');
        const dueDateTimestampInput = document.getElementById('transaction-due-timestamp');

        if (dueDateDuration > 0) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + dueDateDuration);
            const formattedDate = dueDate.toLocaleDateString();
            dueDateDisplay.textContent = formattedDate;
            dueDateTimestampInput.value = dueDate.getTime();
        } else {
            dueDateDisplay.textContent = 'Not Set';
            dueDateTimestampInput.value = '';
        }

        document.getElementById('product-form-modal').style.display = 'block';
    }

    if (target.classList.contains('pay-btn')) {
        // Remove the permission check here since button visibility already handles it
        selectedDebtorId = debtorId;
        refreshPaymentModal(debtorId);
        document.getElementById('payment-form-modal').style.display = 'block';
        document.getElementById('product-selection').style.display = 'block';
        document.getElementById('payment-amount-input').style.display = 'none';
    }

    if (target.classList.contains('edit-btn')) {
        const debtor = debtors.find(d => d.id === debtorId);
        if (debtor) {
            editingDebtorId = debtor.id;
            document.getElementById('debtor-name').value = debtor.name;
            document.getElementById('debtor-contact').value = debtor.contact.replace('+63', '');
            document.querySelector('#debtor-form-modal h2').textContent = 'Edit Debtor';
            document.querySelector('#debtor-form button[type="submit"]').textContent = 'Update';
            document.getElementById('debtor-form-modal').style.display = 'block';
        }
    }

    if (target.classList.contains('payment-history-btn')) {
        selectedDebtorId = debtorId;
        loadPaymentHistory(debtorId);
        document.getElementById('payment-history-modal').style.display = 'block';
    }

    if (target.classList.contains('delete-btn')) {
        if (confirm(`Are you sure you want to delete ${debtor.name}?`)) {
            deleteDebtor(debtorId);
        }
    }

    if (target.classList.contains('print-btn')) {
        openPrintSelectionModal(debtor);
    }
}

function refreshPaymentModal(debtorId) {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor || !debtor.transactions) {
        console.error('Debtor or transactions not found');
        return;
    }

    const productChoices = document.getElementById('payment-product-choices');
    productChoices.innerHTML = '';
    
    debtor.transactions.forEach((transaction, index) => {
        const remaining = transaction.total - (transaction.paid || 0);
        if (remaining > 0) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'product-choice-button';
            button.setAttribute('data-transaction-index', index);
            button.innerHTML = `
                Transaction ${index + 1}<br>
                Ref: ${transaction.referenceNumber || 'N/A'}<br>
                Remaining: ₱${remaining.toFixed(2)}
            `;
            productChoices.appendChild(button);
        }
    });

    const payAllBtn = document.getElementById('pay-all-products');
    if (debtor.totalDebt > 0) {
        payAllBtn.style.display = 'block';
    } else {
        payAllBtn.style.display = 'none';
    }
}

// ========================
// PRODUCT FORM FUNCTIONS
// ========================
function calculateProductTotal(entry) {
    const quantityInput = entry.querySelector('.product-quantity');
    const priceInput = entry.querySelector('.product-price');
    const totalSpan = entry.querySelector('.product-total');
    
    if (quantityInput && priceInput && totalSpan) {
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        
        totalSpan.textContent = `Total: ₱${total.toFixed(2)}`;
    }
}

function calculateGrandTotal() {
    const entries = document.querySelectorAll('#product-list .product-entry');
    let grandTotal = 0;
    
    entries.forEach(entry => {
        const totalSpan = entry.querySelector('.product-total');
        if (totalSpan) {
            const totalText = totalSpan.textContent.replace('Total: ₱', '').replace(',', '');
            const total = parseFloat(totalText) || 0;
            grandTotal += total;
        }
    });
    
    const grandTotalElement = document.getElementById('new-product-total-price');
    if (grandTotalElement) {
        grandTotalElement.textContent = `Grand Total: ₱${grandTotal.toFixed(2)}`;
    }
}

function calculateCheckoutProductTotal(entry) {
    const quantityInput = entry.querySelector('.product-quantity');
    const priceInput = entry.querySelector('.product-price');
    const totalSpan = entry.querySelector('.product-total');
    const quantity = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const total = quantity * price;
    totalSpan.textContent = `Total: ₱${total.toFixed(2)}`;
}

function calculateCheckoutGrandTotal() {
    const entries = document.querySelectorAll('#checkout-product-list .product-entry');
    let grandTotal = 0;
    entries.forEach(entry => {
        const totalText = entry.querySelector('.product-total').textContent.replace('Total: ₱', '').replace(',', '');
        grandTotal += parseFloat(totalText) || 0;
    });
    document.getElementById('checkout-grand-total').textContent = `Grand Total: ₱${grandTotal.toFixed(2)}`;
}

function addProductEntryHandler() {
    const productList = document.getElementById('product-list');
    const newEntry = document.createElement('div');
    newEntry.classList.add('product-entry');
    newEntry.innerHTML = `
        <div class="product-name-wrapper">
            <input type="text" class="product-name" placeholder="Product Name" required>
            <div class="suggestions" style="display: none;"></div>
        </div>
        <input type="number" class="product-quantity" placeholder="Quantity" min="1" required>
        <input type="number" class="product-price" placeholder="Price" min="0" step="0.01" required>
        <span class="product-total">Total: ₱0.00</span>
        <button type="button" class="remove-product-entry" aria-label="Remove this product entry"><i class="fas fa-trash"></i></button>
    `;
    productList.appendChild(newEntry);
}

function handleProductInput(input) {
    const wrapper = input.closest('.product-name-wrapper');
    const suggestionsDiv = wrapper.querySelector('.suggestions');
    const query = input.value.toLowerCase();

    if (query.length < 1) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    const matches = products.filter(product => 
        product.name.toLowerCase().includes(query)
    );

    if (matches.length > 0) {
        suggestionsDiv.innerHTML = matches.map(product => `
            <div class="suggestion-item" data-price="${product.price}">
                ${product.name}
            </div>
        `).join('');
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

function handleProductNameBlur(e) {
    if (e.target.classList.contains('product-name')) {
        const name = e.target.value.trim();
        const product = products.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (product) {
            const priceInput = e.target.closest('.product-entry').querySelector('.product-price');
            if (priceInput) priceInput.value = product.price.toFixed(2);
        }
    }
}

async function handleProductFormSubmit(e) {
    e.preventDefault();

    if (!canManageProducts()) {
        alert('You do not have permission to manage products.');
        return;
    }

    const formMode = e.target.dataset.mode;
    const name = document.getElementById('inventory-product-name').value.trim();
    const price = parseFloat(document.getElementById('inventory-product-price').value);
    const stock = parseInt(document.getElementById('inventory-product-stock').value, 10);

    if (!name || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
        alert('Please enter a valid product name, price, and stock.');
        return;
    }

    try {
        if (formMode === 'add') {
            if (products.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                alert('A product with this name already exists.');
                return;
            }
            await saveProduct({ name, price, stock });
        } else if (formMode === 'edit') {
            const productId = e.target.dataset.productId;
            await updateProduct({ id: productId, name, price, stock });
        }

        const form = document.getElementById('inventory-product-form');
        form.reset();
        form.dataset.mode = 'add';
        delete form.dataset.productId;
        document.getElementById('inventory-product-form-title').textContent = 'Add Product';
        alert('Product saved successfully!');
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Failed to save product. Please try again.');
    }
}


function openProductForm(mode, product = null) {
    if (!canManageProducts()) {
        alert('You do not have permission to manage products.');
        return;
    }
    
    const form = document.getElementById('inventory-product-form');
    const title = document.getElementById('inventory-product-form-title');
    form.dataset.mode = mode;
    
    if (mode === 'add') {
        title.textContent = 'Add Product';
        form.reset();
        delete form.dataset.productId;
    } else if (mode === 'edit' && product) {
        title.textContent = 'Edit Product';
        document.getElementById('inventory-product-name').value = product.name;
        document.getElementById('inventory-product-price').value = product.price;
        document.getElementById('inventory-product-stock').value = product.stock;
        form.dataset.productId = product.id;
    }
    document.getElementById('inventory-product-form-modal').style.display = 'block';
}

// ========================
// PROFILE AND AUTHENTICATION FUNCTIONS
// ========================
function updateProfileInfo() {
    if (!currentUser) return;
    
    const emailSpan = document.getElementById('profile-email');
    const creationDateSpan = document.getElementById('profile-creation-date');
    const roleSpan = document.getElementById('profile-role');
    const emailInput = document.getElementById('profile-email-input');
    const nameInput = document.getElementById('profile-name');
    const superAdminIndicator = document.getElementById('super-admin-indicator');
    const superAdminNotice = document.getElementById('super-admin-notice');
    const createAccountBtn = document.getElementById('create-account-btn');
    
    if (emailSpan && creationDateSpan && emailInput && nameInput) {
        emailSpan.textContent = currentUser.email || 'Not set';
        emailInput.value = currentUser.email || '';
        nameInput.value = currentUser.displayName || '';
        
        // Display user role with special styling for super admin
        if (roleSpan) {
            const roleText = getRoleDisplayName(currentUserRole);
            roleSpan.textContent = roleText;
            
            // Remove existing role classes
            roleSpan.classList.remove('role-super-admin', 'role-admin', 'role-sub-admin');
            
            // Add appropriate role class
            switch (currentUserRole) {
                case USER_ROLES.SUPER_ADMIN:
                    roleSpan.classList.add('role-super-admin');
                    if (superAdminIndicator) {
                        superAdminIndicator.style.display = 'inline-block';
                    }
                    if (superAdminNotice) {
                        superAdminNotice.style.display = 'block';
                    }
                    // Add super admin class to modal content for styling
                    const modalContent = roleSpan.closest('.modal-content');
                    if (modalContent) {
                        modalContent.classList.add('super-admin');
                    }
                    break;
                case USER_ROLES.ADMIN:
                    roleSpan.classList.add('role-admin');
                    break;
                case USER_ROLES.SUB_ADMIN:
                    roleSpan.classList.add('role-sub-admin');
                    break;
            }
        }
        
        // Show/hide create account button based on permissions
        if (createAccountBtn) {
            if (canCreateAccounts()) {
                createAccountBtn.style.display = 'block';
                createAccountBtn.classList.add('super-admin-button');
            } else {
                createAccountBtn.style.display = 'none';
            }
        }
        
        if (currentUser.metadata && currentUser.metadata.creationTime) {
            creationDateSpan.textContent = new Date(currentUser.metadata.creationTime).toLocaleDateString();
        } else {
            creationDateSpan.textContent = 'Unknown';
        }
    }
}

function updateUIForSuperAdmin() {
    if (!isSuperAdmin()) return;
    
    // Add super admin class to body for global styling
    document.body.classList.add('super-admin');
    
    // Update the create account button text for super admin
    const createAccountBtn = document.getElementById('create-account-btn');
    if (createAccountBtn) {
        createAccountBtn.innerHTML = '<i class="fas fa-crown"></i> Create Admin/Sub-Admin Account';
        createAccountBtn.style.display = 'block';
    }
    
    // Add special styling to sidebar for super admin
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.add('super-admin');
    }
    
    console.log('Super Admin UI activated');
}

function openProfileModal() {
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.style.display = 'block';
        updateProfileInfo();
    }
}

async function updateProfile(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('No user logged in');
        return;
    }
    
    const name = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email-input').value.trim();
    const password = document.getElementById('profile-password').value;
    
    try {
        const { getAuth, updateEmail, updatePassword, updateProfile: updateUserProfile } = await import("https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js");
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (email && email !== user.email) {
            await updateEmail(user, email);
        }
        
        if (password) {
            await updatePassword(user, password);
        }
        
        if (name && name !== user.displayName) {
            await updateUserProfile(user, { displayName: name });
        }
        
        alert('Profile updated successfully!');
        loadCurrentUser();
        closeAllModals();
    } catch (error) {
        console.error('Error updating profile:', error);
        let errorMessage = 'Failed to update profile. ';
        switch (error.code) {
            case 'auth/requires-recent-login':
                errorMessage += 'Please log out and log in again.';
                break;
            case 'auth/email-already-in-use':
                errorMessage += 'Email already in use.';
                break;
            case 'auth/weak-password':
                errorMessage += 'Password too weak.';
                break;
            default:
                errorMessage += error.message;
        }
        alert(errorMessage);
    }
}

function openAddAccountModal() {
    if (!canCreateAccounts()) {
        if (isAdmin()) {
            // This should not happen now since admins can create accounts
            alert('There was an error. Please refresh the page.');
        } else {
            alert('You do not have permission to create accounts.');
        }
        return;
    }
    
    document.getElementById('profile-modal').style.display = 'none';
    updateAccountTypeOptions(); // Update options before showing modal
    
    // Show appropriate notice based on role
    const superAdminNotice = document.getElementById('super-admin-create-notice');
    if (superAdminNotice) {
        if (isSuperAdmin()) {
            superAdminNotice.textContent = 'Super Admin Access: You can create Super Admin, Admin and Sub-Admin accounts.';
            superAdminNotice.style.display = 'block';
        } else if (isAdmin()) {
            superAdminNotice.textContent = 'Admin Access: You can create Admin and Sub-Admin accounts.';
            superAdminNotice.style.display = 'block';
        } else {
            superAdminNotice.style.display = 'none';
        }
    }
    
    document.getElementById('add-account-modal').style.display = 'block';
}

function checkPasswordMatch() {
    const password = document.getElementById('new-password');
    const confirmPassword = document.getElementById('new-confirm-password');
    
    if (!password || !confirmPassword) {
        console.error("Password input elements not found");
        return;
    }
    
    const passwordValue = password.value;
    const confirmPasswordValue = confirmPassword.value;
    
    // Remove any existing message
    const existingMessage = document.querySelector('.password-match, .password-mismatch');
    if (existingMessage) existingMessage.remove();
    
    // Only show message if both fields have values
    if (passwordValue && confirmPasswordValue) {
        const messageElement = document.createElement('div');
        messageElement.className = passwordValue === confirmPasswordValue ? 'password-match' : 'password-mismatch';
        messageElement.textContent = passwordValue === confirmPasswordValue ? 'Passwords match!' : 'Passwords do not match!';
        confirmPassword.parentElement.appendChild(messageElement);
    }
}

async function createNewAccount(e) {
    if (e) e.preventDefault(); // Add this safety check
    
    console.log('=== CREATE ACCOUNT DEBUG START ===');
    
    const accountTypeSelect = document.getElementById('new-account-type');
    const fullNameInput = document.getElementById('new-full-name');
    const emailInput = document.getElementById('new-email');
    const passwordInput = document.getElementById('new-password');
    if (passwordInput) {
    passwordInput.addEventListener('input', checkPasswordMatch);
    }
    const confirmPasswordInput = document.getElementById('new-confirm-password');

    console.log('Form elements found:', {
        accountTypeSelect: !!accountTypeSelect,
        fullNameInput: !!fullNameInput,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        confirmPasswordInput: !!confirmPasswordInput
    });

    if (!accountTypeSelect || !fullNameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
        alert('Form elements not found. Please refresh the page.');
        return;
    }

    const accountType = accountTypeSelect.value;
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    console.log('Form values:', { accountType, fullName, email, hasPassword: !!password });

    // Basic validation
    if (!accountType || !fullName || !email || !password || !confirmPassword) {
        alert('Please fill all fields');
        return;
    }
    if (password !== confirmPassword) {
        alert('Passwords don\'t match');
        return;
    }
    if (!canCreateAccounts()) {
        alert('Insufficient permissions');
        return;
    }
    if (!currentUser?.uid) {
        alert('Current user not loaded - please refresh and try again');
        return;
    }

    console.log('Validation passed, sending request...');

    try {
        const requestBody = {
            email: email,
            password: password,
            displayName: capitalizeWords(fullName),
            role: accountType.toLowerCase().replace(' ', '_'),
            createdBy: currentUser.uid
        };
        
        console.log('Request body:', { ...requestBody, password: '[HIDDEN]' });

        const response = await fetch('http://localhost:3000/create-user', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response OK:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(errorText || 'Failed to create user');
        }

        const data = await response.json();
        console.log('Success response:', data);

        alert('Account created successfully!');
        
        const addAccountForm = document.getElementById('add-account-form');
        if (addAccountForm) addAccountForm.reset();
        closeAllModals();
        
        await loadAllUsers();
        if (document.getElementById('user-management-modal').style.display === 'block') {
            renderUsers();
        }
        
        console.log('=== CREATE ACCOUNT DEBUG END (SUCCESS) ===');
        
    } catch (error) {
        console.error('=== CREATE ACCOUNT ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        console.error('=== END ERROR ===');
        
        if (error.message.includes('email-already-in-use')) {
            alert('Email already registered');
        } else if (error.message.includes('Failed to fetch')) {
            alert('Cannot connect to server. Make sure the server is running on port 3000.');
        } else {
            alert('Creation failed: ' + error.message);
        }
    }
}

// Console function to manually grant super admin access (for testing)
window.grantSuperAdmin = async function(email) {
    if (!window.firebase) {
        console.log('Firebase not available');
        return;
    }
    
    try {
        const { database, ref, get, child, query, orderByChild, equalTo } = window.firebase;
        const usersRef = ref(database, 'users');
        const userQuery = query(usersRef, orderByChild('email'), equalTo(email));
        
        const snapshot = await get(userQuery);
        if (snapshot.exists()) {
            snapshot.forEach(async (userSnapshot) => {
                const userId = userSnapshot.key;
                const userRef = ref(database, `users/${userId}`);
                await update(userRef, { role: USER_ROLES.SUPER_ADMIN });
                console.log(`Granted super admin access to: ${email}`);
            });
        } else {
            console.log(`User with email ${email} not found`);
        }
    } catch (error) {
        console.error('Error granting super admin access:', error);
    }
};

// Add initialization check for super admin
document.addEventListener('DOMContentLoaded', function() {
    // Check if current user is super admin after authentication
    setTimeout(() => {
        if (currentUser && currentUser.email === SUPER_ADMIN_EMAIL) {
            console.log('Super Admin detected:', currentUser.email);
            // Force role update
            currentUserRole = USER_ROLES.SUPER_ADMIN;
            updateUIBasedOnRole();
        }
    }, 2000); // Wait 2 seconds for authentication to complete
});


function initializePasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        const input = toggle.previousElementSibling;
        if (input && input.type === 'password') {
            toggle.addEventListener('click', () => {
                input.type = input.type === 'password' ? 'text' : 'password';
                toggle.classList.toggle('fa-eye');
                toggle.classList.toggle('fa-eye-slash');
            });
        }
    });
}

async function logout() {
    try {
        const confirmed = confirm('Are you sure you want to log out?');
        if (!confirmed) return;

        let auth;
        try {
            const { getAuth } = await import("https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js");
            auth = getAuth();
        } catch (error) {
            console.warn('Firebase auth not available:', error);
        }

        if (auth) {
            await auth.signOut();
        }

        localStorage.removeItem('currentUser');
        localStorage.removeItem('debtors');
        
        debtors = [];
        selectedDebtorId = null;
        selectedProductIndex = null;

        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error during logout:', error);
        alert('An error occurred during logout. Please try again.');
    }
}

// ========================
// EVENT LISTENERS AND INITIALIZATION
// ========================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded - initializing dashboard');
    
    // Initialize Firebase
    try {
        await initializeFirebase();
        console.log("Firebase initialized successfully");
        await loadDebtors();
    } catch (error) {
        console.error("Initialization error:", error);
        alert("Warning: Using offline mode. Some features may be limited.");
        
        // Load from localStorage as fallback
        const savedDebtors = localStorage.getItem('debtors');
        if (savedDebtors) {
            debtors = JSON.parse(savedDebtors);
            debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            renderDebtors();
        }
    }
    
    // Initialize sidebar
    initializeSidebar();
    
    // Initialize password toggles
    initializePasswordToggles();
    
    // Load current user and products
    loadCurrentUser();
    await loadProducts();
    
    // Load archived debtors and sent reminders from localStorage
    const savedArchived = localStorage.getItem('archivedDebtors');
    if (savedArchived) archivedDebtors = JSON.parse(savedArchived);
    
    const savedReminders = localStorage.getItem('sentReminders');
    if (savedReminders) sentReminders = JSON.parse(savedReminders);

    // Dashboard button listeners
    const dashboardBtn = document.getElementById('dashboard-btn');
    const dashboardBackBtn = document.getElementById('dashboard-back-btn');
    
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function() {
            openDashboard();
            checkAndSendReminders();
        });
    }
    
    if (dashboardBackBtn) {
        dashboardBackBtn.addEventListener('click', closeDashboard);
    }
    
    // Hamburger menu - Direct event listener with better error handling
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    if (hamburgerMenu) {
        console.log('Hamburger menu found, attaching event listener');
        hamburgerMenu.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Hamburger clicked via direct listener');
            toggleSidebar();
        });
    } else {
        console.error('Hamburger menu element not found in DOM');
    }
    
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Add debtor button
    const addDebtorBtn = document.getElementById('add-debtor-btn');
    if (addDebtorBtn) {
        addDebtorBtn.addEventListener('click', () => {
            // This check should allow all roles
            if (!canManageDebtors()) {
                alert('You do not have permission to manage debtors.');
                return;
            }
            editingDebtorId = null;
            document.querySelector('#debtor-form-modal h2').textContent = 'Add Debtor';
            document.querySelector('#debtor-form button[type="submit"]').textContent = 'Save';
            document.getElementById('debtor-form').reset();
            document.getElementById('debtor-form-modal').style.display = 'block';
        });
    }

    // Modal close buttons
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Debtors list click delegation
    const debtorsList = document.getElementById('debtors-list');
    if (debtorsList) {
        debtorsList.addEventListener('click', handleDebtorActions);
    }

    // Search functionality
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', debounce((e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredDebtors = searchTerm ?
                debtors.filter(debtor => debtor.name.toLowerCase().includes(searchTerm)) :
                debtors;
            renderDebtors(filteredDebtors);
        }, 300));
    }

    // Archive and sent reminders buttons
    document.getElementById('archive-btn')?.addEventListener('click', viewArchive);
    document.getElementById('sent-reminders-btn')?.addEventListener('click', viewSentReminders);
    
    // Products button
    document.getElementById('products-btn')?.addEventListener('click', () => {
        const productSearch = document.getElementById('product-search');
        if (productSearch) productSearch.value = '';
        renderProductsWithSearch();
        document.getElementById('products-modal').style.display = 'block';
        const addProductBtn = document.getElementById('add-product-inventory-btn');
        if (addProductBtn) {
            addProductBtn.style.display = isAdmin() ? 'block' : 'none';
        }
    });

    // Add product inventory button
    document.getElementById('add-product-inventory-btn')?.addEventListener('click', () => {
        openProductForm('add');
    });

    // Product search
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
        productSearch.addEventListener('input', debounce(renderProductsWithSearch, 300));
    }

    // Profile button
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', openProfileModal);
    }
    
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }
    
    // Create account button
    const createAccountBtn = document.getElementById('create-account-btn');
    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', () => {
            if (!canCreateAccounts()) {
                alert('You do not have permission to create accounts. Admin access required.');
                return;
           }
           openAddAccountModal();
       });
    }
    
 // Add account form
  const addAccountForm = document.getElementById('add-account-form');
  if (addAccountForm) {
    // Remove any existing listener first
    addAccountForm.removeEventListener('submit', createNewAccount);
    
    // Add the listener
    addAccountForm.addEventListener('submit', createNewAccount);
    
    // Add password match checking for BOTH password fields
    const passwordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('new-confirm-password');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordMatch);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
  }

    // Due date settings
    const dueDateSettingsBtn = document.getElementById('due-date-settings-btn');
    const dueDateSettingsModal = document.getElementById('due-date-settings-modal');
    if (dueDateSettingsBtn && dueDateSettingsModal) {
        dueDateSettingsBtn.addEventListener('click', () => {
            dueDateSettingsModal.style.display = 'block';
            const form = document.getElementById('due-date-settings-form');
            const inputs = form.querySelectorAll('input');
            const saveButton = form.querySelector('button[type="submit"]');
            
            if (!canEditSettings()) {
                inputs.forEach(input => input.disabled = true);
                if (saveButton) {
                    saveButton.disabled = true;
                    saveButton.textContent = 'You do not have permission to modify settings';
                }
            } else {
                inputs.forEach(input => input.disabled = false);
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = 'Save';
                }
            }
            
            const currentDuration = localStorage.getItem('dueDateDuration');
            const currentInterval = localStorage.getItem('reminderInterval');
            if (currentDuration) {
                document.getElementById('due-date-duration').value = currentDuration;
            }
            if (currentInterval) {
                document.getElementById('reminder-interval').value = currentInterval;
            }
        });
    }

    // Due date settings form
    const dueDateSettingsForm = document.getElementById('due-date-settings-form');
    if (dueDateSettingsForm) {
        dueDateSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!canEditSettings()) {
                alert('You do not have permission to modify these settings.');
                return;
            }
            const duration = document.getElementById('due-date-duration').value;
            const reminderInterval = document.getElementById('reminder-interval').value;
            if (duration && !isNaN(duration) && duration >= 0 && reminderInterval && !isNaN(reminderInterval) && reminderInterval >= 1) {
                try {
                    await saveDueDateSettings(duration, reminderInterval);
                    alert('Settings saved successfully!');
                    closeAllModals();
                } catch (error) {
                    console.error('Error saving settings:', error);
                    alert('Failed to save settings. Please try again.');
                }
            } else {
                alert('Please enter valid numbers.');
            }
        });
    }

    // Products button with permission check
    document.getElementById('products-btn')?.addEventListener('click', () => {
        const productSearch = document.getElementById('product-search');
        if (productSearch) productSearch.value = '';
        renderProductsWithSearch();
        document.getElementById('products-modal').style.display = 'block';
        const addProductBtn = document.getElementById('add-product-inventory-btn');
        if (addProductBtn) {
            addProductBtn.style.display = canManageProducts() ? 'block' : 'none';
        }
    });

    // Add product inventory button with permission check
    document.getElementById('add-product-inventory-btn')?.addEventListener('click', () => {
        if (canManageProducts()) {
            openProductForm('add');
        } else {
            alert('You do not have permission to add products.');
        }
    });

    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
       checkoutBtn.addEventListener('click', () => {
            if (!canCheckout()) {
                alert('You do not have permission to checkout products.');
                return;
            }
           document.getElementById('checkout-form-modal').style.display = 'block';
        });
    }

    // Apply capitalization on blur for name inputs
    ['debtor-name', 'product-name', 'new-product-name'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', function() {
                this.value = capitalizeWords(this.value);
            });
        }
    });
});

// ========================
// FORM EVENT LISTENERS
// ========================

// Debtor form submission
document.addEventListener('DOMContentLoaded', () => {
    const debtorForm = document.getElementById('debtor-form');
    if (debtorForm) {
        debtorForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const debtorNameInput = document.getElementById('debtor-name').value.trim();
            const contactNumber = document.getElementById('debtor-contact').value.trim();

            if (!debtorNameInput || !contactNumber) {
                alert('Please fill in all required fields.');
                return;
            }

            const standardizedName = capitalizeWords(debtorNameInput);

            const nameExists = debtors.some(debtor => debtor.name === standardizedName && debtor.id !== editingDebtorId);
            if (nameExists) {
                alert('A debtor with this name already exists. Please use a different name.');
                return;
            }

            let formattedContact = contactNumber;
            if (contactNumber.startsWith('0')) {
                formattedContact = '+63' + contactNumber.substring(1);
            } else if (!contactNumber.startsWith('+63')) {
                formattedContact = '+63' + contactNumber;
            }

            if (editingDebtorId) {
                const debtor = debtors.find(d => d.id === editingDebtorId);
                if (debtor) {
                    debtor.name = standardizedName;
                    debtor.contact = formattedContact;
                    await updateDebtor(debtor);
                    alert('Debtor updated successfully!');
                }
                editingDebtorId = null;
                document.querySelector('#debtor-form-modal h2').textContent = 'Add Debtor';
                document.querySelector('#debtor-form button[type="submit"]').textContent = 'Save';
            } else {
                const newDebtor = {
                    name: standardizedName,
                    contact: formattedContact,
                    products: [],
                    payments: [],
                    transactions: [],
                    totalDebt: 0,
                    createdAt: Date.now()
                };
                try {
                    await saveDebtor(newDebtor);
                    alert('Debtor added successfully!');
                } catch (error) {
                    console.error("Error saving debtor:", error);
                }
            }

            document.getElementById('debtor-form').reset();
            closeAllModals();
        });
    }
});

// Product form submission
document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-form');
    if (productForm) {
        // Remove any existing listeners first
        const existingForm = productForm.cloneNode(true);
        productForm.parentNode.replaceChild(existingForm, productForm);
        
        // Add the new listener to the fresh form
        document.getElementById('product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log("Transaction form submitted");
            
            if (isSubmitting) {
                console.log("Already submitting, ignoring");
                return false;
            }
            
            isSubmitting = true;
            console.log("Starting transaction submission");

            try {
                const debtor = debtors.find(d => d.id === selectedDebtorId);
                if (!debtor) {
                    throw new Error('No debtor selected');
                }

                const dueDateTimestamp = document.getElementById('transaction-due-timestamp').value;
                const dueDate = dueDateTimestamp ? parseInt(dueDateTimestamp, 10) : null;

                const productEntries = document.querySelectorAll('#product-list .product-entry');
                const productsToAdd = [];
                let transactionTotal = 0;

                // Validate and collect products
                for (const entry of productEntries) {
                    const name = entry.querySelector('.product-name').value.trim();
                    const quantity = parseFloat(entry.querySelector('.product-quantity').value);
                    const price = parseFloat(entry.querySelector('.product-price').value);
                    
                    if (name && !isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
                        const total = quantity * price;
                        productsToAdd.push({ name, quantity, price, total });
                        transactionTotal += total;
                    }
                }

                if (productsToAdd.length === 0) {
                    throw new Error('Please add at least one valid product with positive quantity and price.');
                }

                console.log("Products to add:", productsToAdd);

                // Check stock availability
                for (const productToAdd of productsToAdd) {
                    const inventoryProduct = products.find(p => p.name.toLowerCase() === productToAdd.name.toLowerCase());
                    if (!inventoryProduct) {
                        throw new Error(`Product "${productToAdd.name}" not found in inventory.`);
                    }
                    if (inventoryProduct.stock === undefined) {
                        throw new Error(`Stock information missing for "${productToAdd.name}". Please update the inventory.`);
                    }
                    if (inventoryProduct.stock < productToAdd.quantity) {
                        throw new Error(`Insufficient stock for "${productToAdd.name}". Available: ${inventoryProduct.stock}, Requested: ${productToAdd.quantity}`);
                    }
                }

                // Update stock
                console.log("Updating stock...");
                for (const productToAdd of productsToAdd) {
                    const inventoryProduct = products.find(p => p.name.toLowerCase() === productToAdd.name.toLowerCase());
                    inventoryProduct.stock -= productToAdd.quantity;
    
                  // Direct Firebase update for transaction - bypasses permission check
                if (window.firebase) {
                   const { database, ref, update } = window.firebase;
                    const productRef = ref(database, `products/${inventoryProduct.id}`);
                   await update(productRef, inventoryProduct);
                   } else {
                     // Offline mode - manual update
                   const index = products.findIndex(p => p.id === inventoryProduct.id);
                     if (index !== -1) {
                      products[index] = inventoryProduct;
                       products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
                     }
                   localStorage.setItem('products', JSON.stringify(products));
                       renderProductsWithSearch();
                     }
                  }

                // Create and save transaction
                console.log("Saving transaction...");
                await saveTransaction(debtor, {
                    dueDate: dueDate,
                    total: transactionTotal,
                    products: productsToAdd
                });

                console.log("Transaction saved successfully");

                // IMMEDIATELY close and reset the modal
                completelyResetTransactionForm();
                
                // Show success message after modal is closed
                setTimeout(() => {
                    alert('Transaction added successfully, stock updated, and SMS sent!');
                }, 100);

            } catch (error) {
                console.error('Transaction submission error:', error);
                
                // Show error message
                alert(error.message || 'Failed to add transaction. Please try again.');
                
                // Don't close modal on error so user can fix issues
            } finally {
                isSubmitting = false;
                console.log("Transaction submission completed");
            }
            
            return false;
        });
    }
    
    // Also ensure the cancel button works properly
    const cancelBtn = document.getElementById('cancel-product-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            completelyResetTransactionForm();
        });
    }
});

function completelyResetTransactionForm() {
    console.log("Completely resetting transaction form...");
    
    // Hide the modal first
    const modal = document.getElementById('product-form-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset the form
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.reset();
    }
    
    // Clear all product entries and keep only one empty entry
    const productList = document.getElementById('product-list');
    if (productList) {
        // Remove all existing entries
        productList.innerHTML = '';
        
        // Add one fresh empty entry
        const newEntry = document.createElement('div');
        newEntry.classList.add('product-entry');
        newEntry.innerHTML = `
            <div class="product-name-wrapper">
                <input type="text" class="product-name" placeholder="Product Name" required>
                <div class="suggestions" style="display: none;"></div>
            </div>
            <input type="number" class="product-quantity" placeholder="Quantity" min="1" required>
            <input type="number" class="product-price" placeholder="Price" min="0" step="0.01" required>
            <span class="product-total">Total: ₱0.00</span>
            <button type="button" class="remove-product-entry" aria-label="Remove this product entry"><i class="fas fa-trash"></i></button>
        `;
        productList.appendChild(newEntry);
    }
    
    // Reset grand total
    const grandTotalElement = document.getElementById('new-product-total-price');
    if (grandTotalElement) {
        grandTotalElement.textContent = 'Grand Total: ₱0.00';
    }
    
    // Reset due date display
    const dueDateDisplay = document.getElementById('transaction-due-display');
    const dueDateTimestampInput = document.getElementById('transaction-due-timestamp');
    
    const dueDateDuration = parseInt(localStorage.getItem('dueDateDuration') || '0', 10);
    if (dueDateDuration > 0) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDateDuration);
        const formattedDate = dueDate.toLocaleDateString();
        if (dueDateDisplay) dueDateDisplay.textContent = formattedDate;
        if (dueDateTimestampInput) dueDateTimestampInput.value = dueDate.getTime();
    } else {
        if (dueDateDisplay) dueDateDisplay.textContent = 'Not Set';
        if (dueDateTimestampInput) dueDateTimestampInput.value = '';
    }
    
    // Reset global variables
    selectedDebtorId = null;
    selectedProductIndex = null;
    selectedTransactionIndex = null;
    isSubmitting = false;
    
    console.log("Transaction form completely reset");
}

document.addEventListener('DOMContentLoaded', () => {
    const productModalCloseBtn = document.querySelector('#product-form-modal .close-modal');
    if (productModalCloseBtn) {
        productModalCloseBtn.addEventListener('click', () => {
            completelyResetTransactionForm();
        });
    }
});

// Add this helper function to properly reset the product form modal
function resetProductFormModal() {
    console.log("Resetting product form modal...");
    
    // Reset the form first
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.reset();
        console.log("Form reset completed");
    }
    
    // Clear all product entries except the first one
    const productList = document.getElementById('product-list');
    if (productList) {
        console.log("Clearing product entries...");
        
        // Remove all entries except the first one
        while (productList.children.length > 1) {
            productList.removeChild(productList.lastChild);
        }
        
        // Reset the remaining entry completely
        const remainingEntry = productList.querySelector('.product-entry');
        if (remainingEntry) {
            // Clear all input values
            const inputs = remainingEntry.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
            });
            
            // Reset total display
            const totalSpan = remainingEntry.querySelector('.product-total');
            if (totalSpan) {
                totalSpan.textContent = 'Total: ₱0.00';
            }
            
            // Hide any suggestions
            const suggestions = remainingEntry.querySelector('.suggestions');
            if (suggestions) {
                suggestions.style.display = 'none';
                suggestions.innerHTML = '';
            }
        }
    }
    
    // Reset the grand total
    const grandTotalElement = document.getElementById('new-product-total-price');
    if (grandTotalElement) {
        grandTotalElement.textContent = 'Grand Total: ₱0.00';
    }
    
    // Reset due date display to default
    const dueDateDisplay = document.getElementById('transaction-due-display');
    const dueDateTimestampInput = document.getElementById('transaction-due-timestamp');
    
    const dueDateDuration = parseInt(localStorage.getItem('dueDateDuration') || '0', 10);
    if (dueDateDuration > 0) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDateDuration);
        const formattedDate = dueDate.toLocaleDateString();
        if (dueDateDisplay) dueDateDisplay.textContent = formattedDate;
        if (dueDateTimestampInput) dueDateTimestampInput.value = dueDate.getTime();
    } else {
        if (dueDateDisplay) dueDateDisplay.textContent = 'Not Set';
        if (dueDateTimestampInput) dueDateTimestampInput.value = '';
    }
    
    // Reset global variables
    selectedDebtorId = null;
    selectedProductIndex = null;
    selectedTransactionIndex = null;
    
    console.log("Product form modal reset completed");
}

// Payment form event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Transaction choice handler
    const paymentProductChoices = document.getElementById('payment-product-choices');
    if (paymentProductChoices) {
        paymentProductChoices.addEventListener('click', (e) => {
            if (!e.target.classList.contains('product-choice-button')) return;
            
            selectedTransactionIndex = e.target.getAttribute('data-transaction-index');
            
            const debtor = debtors.find(d => d.id === selectedDebtorId);
            if (!debtor || !debtor.transactions) {
                console.error('Debtor or transactions not found');
                return;
            }

            const transaction = debtor.transactions[selectedTransactionIndex];
            if (!transaction) {
                console.error('Transaction not found');
                return;
            }

            const remaining = (transaction.total - (transaction.paid || 0)).toFixed(2);
            document.getElementById('payment-for').textContent = `Transaction ${parseInt(selectedTransactionIndex) + 1}`;
            document.getElementById('amount-due').textContent = `₱${remaining}`;
            document.getElementById('payment-amount').value = '';

            document.getElementById('product-selection').style.display = 'none';
            document.getElementById('payment-amount-input').style.display = 'block';
        });
    }

    // Pay all handler
    const payAllBtn = document.getElementById('pay-all-products');
    if (payAllBtn) {
        payAllBtn.addEventListener('click', () => {
            selectedTransactionIndex = 'all';
            
            const debtor = debtors.find(d => d.id === selectedDebtorId);
            if (!debtor) {
                console.error('Debtor not found');
                return;
            }

            document.getElementById('payment-for').textContent = 'All Transactions';
            document.getElementById('amount-due').textContent = `₱${debtor.totalDebt.toFixed(2)}`;
            document.getElementById('payment-amount').value = '';

            document.getElementById('product-selection').style.display = 'none';
            document.getElementById('payment-amount-input').style.display = 'block';
        });
    }

    // Confirm payment handler
    const confirmPaymentBtn = document.getElementById('confirm-payment');
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', async () => {
            const amountInput = document.getElementById('payment-amount');
            const amount = parseFloat(amountInput.value);
            const debtor = debtors.find(d => d.id === selectedDebtorId);

            if (!debtor) {
                alert('Debtor not found!');
                return;
            }

            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid payment amount!');
                return;
            }

            try {
                if (selectedTransactionIndex === 'all') {
                    if (amount > debtor.totalDebt) {
                        alert('Payment amount cannot exceed total debt!');
                        return;
                    }
                    await processPayment(debtor, amount, 'All Transactions');
                } else {
                    const transaction = debtor.transactions[selectedTransactionIndex];
                    const remaining = transaction.total - (transaction.paid || 0);
                    if (amount > remaining) {
                        alert('Payment amount cannot exceed the remaining transaction balance!');
                        return;
                    }
                    await processPayment(debtor, amount, `Transaction ${parseInt(selectedTransactionIndex) + 1}`, selectedTransactionIndex);
                }
                alert('Payment processed successfully!');
            } catch (error) {
                console.error('Payment error:', error);
                alert(`Failed to process payment: ${error.message}`);
            } finally {
                closeAllModals();
                amountInput.value = '';
                renderDebtors();
                if (document.getElementById('payment-history-modal').style.display === 'block') {
                    loadPaymentHistory(selectedDebtorId);
                }
                updateDashboard();
            }
        });
    }
});

// Product list event delegation
document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('product-list');
    if (productList) {
        // Input changes
        productList.addEventListener('input', (e) => {
            if (e.target.classList.contains('product-quantity') || e.target.classList.contains('product-price')) {
                const entry = e.target.closest('.product-entry');
                if (entry) {
                    calculateProductTotal(entry);
                    calculateGrandTotal();
                }
            } else if (e.target.classList.contains('product-name')) {
                handleProductInput(e.target);
            }
        });

        // Remove product entries
        productList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-product-entry') || e.target.closest('.remove-product-entry')) {
                const entry = e.target.closest('.product-entry');
                if (entry) {
                    entry.remove();
                    calculateGrandTotal();
                }
            } else if (e.target.classList.contains('suggestion-item')) {
                const wrapper = e.target.closest('.product-name-wrapper');
                const input = wrapper.querySelector('.product-name');
                const priceInput = wrapper.closest('.product-entry').querySelector('.product-price');
                
                input.value = e.target.textContent.trim();
                priceInput.value = e.target.dataset.price;
                
                wrapper.querySelector('.suggestions').style.display = 'none';
                
                calculateProductTotal(wrapper.closest('.product-entry'));
                calculateGrandTotal();
            }
        });

        // Blur handler for product name
        productList.addEventListener('blur', handleProductNameBlur, true);
    }

    // Add product entry button
    const addProductEntryBtn = document.getElementById('add-product-entry');
    if (addProductEntryBtn) {
        addProductEntryBtn.addEventListener('click', addProductEntryHandler);
    }
});

// Inventory product form
document.addEventListener('DOMContentLoaded', () => {
    const inventoryProductForm = document.getElementById('inventory-product-form');
    if (inventoryProductForm) {
        inventoryProductForm.addEventListener('submit', handleProductFormSubmit);
    }
});

// Checkout form event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add checkout product entry
    const addCheckoutProductEntryBtn = document.getElementById('add-checkout-product-entry');
    if (addCheckoutProductEntryBtn) {
        addCheckoutProductEntryBtn.addEventListener('click', () => {
            const productList = document.getElementById('checkout-product-list');
            const newEntry = document.createElement('div');
            newEntry.classList.add('product-entry');
            newEntry.innerHTML = `
                <div class="product-name-wrapper">
                    <input type="text" class="product-name" placeholder="Product Name" required>
                    <div class="suggestions" style="display: none;"></div>
                </div>
                <input type="number" class="product-quantity" placeholder="Quantity" min="1" required>
                <input type="number" class="product-price" placeholder="Price" min="0" step="0.01" required>
                <span class="product-total">Total: ₱0.00</span>
                <button type="button" class="remove-product-entry"><i class="fas fa-trash"></i></button>
            `;
            productList.appendChild(newEntry);
        });
    }

    // Checkout product list event delegation
    const checkoutProductList = document.getElementById('checkout-product-list');
    if (checkoutProductList) {
        checkoutProductList.addEventListener('input', (e) => {
            if (e.target.classList.contains('product-quantity') || e.target.classList.contains('product-price')) {
                const entry = e.target.closest('.product-entry');
                calculateCheckoutProductTotal(entry);
                calculateCheckoutGrandTotal();
            } else if (e.target.classList.contains('product-name')) {
                handleProductInput(e.target);
            }
        });

        checkoutProductList.addEventListener('click', (e) => {
            if (e.target.closest('.remove-product-entry')) {
                const entry = e.target.closest('.product-entry');
                entry.remove();
                calculateCheckoutGrandTotal();
            } else if (e.target.classList.contains('suggestion-item')) {
                const wrapper = e.target.closest('.product-name-wrapper');
                const input = wrapper.querySelector('.product-name');
                const priceInput = wrapper.closest('.product-entry').querySelector('.product-price');
                input.value = e.target.textContent.trim();
                priceInput.value = e.target.dataset.price;
                wrapper.querySelector('.suggestions').style.display = 'none';
                calculateCheckoutProductTotal(wrapper.closest('.product-entry'));
                calculateCheckoutGrandTotal();
            }
        });
    }

    // Checkout form submission
const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productEntries = document.querySelectorAll('#checkout-product-list .product-entry');
        const productsToCheckout = [];
        
        for (const entry of productEntries) {
            const name = entry.querySelector('.product-name').value.trim();
            const quantity = parseFloat(entry.querySelector('.product-quantity').value);
            if (name && !isNaN(quantity) && quantity > 0) {
                productsToCheckout.push({ name, quantity });
            }
        }
        
        if (productsToCheckout.length === 0) {
            alert('Please add at least one valid product with positive quantity.');
            return;
        }
        
        for (const productToCheckout of productsToCheckout) {
            const inventoryProduct = products.find(p => p.name.toLowerCase() === productToCheckout.name.toLowerCase());
            if (!inventoryProduct) {
                alert(`Product "${productToCheckout.name}" not found in inventory.`);
                return;
            }
            if (inventoryProduct.stock === undefined) {
                alert(`Stock information missing for "${productToCheckout.name}". Please update the inventory.`);
                return;
            }
            if (inventoryProduct.stock < productToCheckout.quantity) {
                alert(`Insufficient stock for "${productToCheckout.name}". Available: ${inventoryProduct.stock}, Requested: ${productToCheckout.quantity}`);
                return;
            }
        }
        
        try {
            for (const productToCheckout of productsToCheckout) {
                const inventoryProduct = products.find(p => p.name.toLowerCase() === productToCheckout.name.toLowerCase());
                inventoryProduct.stock -= productToCheckout.quantity;
                
                // Direct Firebase update for checkout - bypasses permission check
                if (window.firebase) {
                    const { database, ref, update } = window.firebase;
                    const productRef = ref(database, `products/${inventoryProduct.id}`);
                    await update(productRef, inventoryProduct);
                } else {
                    // Offline mode - manual update
                    const index = products.findIndex(p => p.id === inventoryProduct.id);
                    if (index !== -1) {
                        products[index] = inventoryProduct;
                        products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
                    }
                    localStorage.setItem('products', JSON.stringify(products));
                    renderProductsWithSearch();
                }
            }
            
            // Reset the form
            document.getElementById('checkout-form').reset();
            const checkoutProductList = document.getElementById('checkout-product-list');
            while (checkoutProductList.children.length > 1) {
                checkoutProductList.removeChild(checkoutProductList.lastChild);
            }
            
            // Reset remaining entry
            const remainingEntry = checkoutProductList.querySelector('.product-entry');
            if (remainingEntry) {
                const totalSpan = remainingEntry.querySelector('.product-total');
                totalSpan.textContent = 'Total: ₱0.00';
            }
            
            document.getElementById('checkout-grand-total').textContent = 'Grand Total: ₱0.00';
            
            alert('Checkout completed successfully and stock updated! Form has been reset for the next checkout.');
            
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Failed to update inventory stock. Checkout aborted.');
            return;
        }
    });
  }

    // Cancel checkout button
    const cancelCheckoutBtn = document.getElementById('cancel-checkout-btn');
    if (cancelCheckoutBtn) {
        cancelCheckoutBtn.addEventListener('click', closeAllModals);
    }
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.product-name-wrapper')) {
        document.querySelectorAll('.suggestions').forEach(div => {
            div.style.display = 'none';
        });
    }
});

// Close sidebar when clicking outside
document.addEventListener('click', (event) => {
    const sidebar = document.querySelector('.sidebar');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    if (sidebar && !sidebar.contains(event.target) && !hamburgerMenu.contains(event.target)) {
        sidebar.classList.remove('active');
    }
});

// Modal background click handlers
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal').forEach(modal => {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

// ========================
// MIGRATION AND DEBUG FUNCTIONS
// ========================
async function migrateDueDates() {
    if (!window.firebase) return;
    
    const { database, ref, get, update } = window.firebase;
    const debtorsRef = ref(database, 'debtors');
    const snapshot = await get(debtorsRef);
    snapshot.forEach(async (childSnapshot) => {
        const debtor = childSnapshot.val();
        const debtorId = childSnapshot.key;
        if (debtor.products) {
            debtor.products = debtor.products.map(product => ({
                ...product,
                dueDate: product.dueDate || null
            }));
            const debtorRef = ref(database, `debtors/${debtorId}`);
            await update(debtorRef, { products: debtor.products });
        }
    });
    console.log("Due date migration complete");
}

// Debug helper functions
window.checkPaymentData = async function(debtorId) {
    console.log("Checking payment data for debtor:", debtorId);
    
    const localDebtor = debtors.find(d => d.id === debtorId);
    console.log("Local debtor data:", localDebtor);
    
    if (window.firebase) {
        const { database, ref, get } = window.firebase;
        const debtorRef = ref(database, `debtors/${debtorId}`);
        
        try {
            const snapshot = await get(debtorRef);
            if (snapshot.exists()) {
                console.log("Firebase debtor data:", snapshot.val());
            } else {
                console.log("No debtor found in Firebase with ID:", debtorId);
            }
        } catch (error) {
            console.error("Error fetching from Firebase:", error);
        }
    } else {
        console.log("Firebase not available");
    }
    
    return "Check completed - see console output";
};

window.fixAllPaymentsData = async function() {
    console.log("Fixing payment data for all debtors...");
    
    if (window.firebase) {
        const { database, ref, get, update } = window.firebase;
        const debtorsRef = ref(database, 'debtors');
        
        try {
            const snapshot = await get(debtorsRef);
            let updateCount = 0;
            
            snapshot.forEach(async (childSnapshot) => {
                const debtorId = childSnapshot.key;
                const debtor = childSnapshot.val();
                
                if (debtor.payments && typeof debtor.payments === 'object' && !Array.isArray(debtor.payments)) {
                    console.log(`Converting payments object to array for debtor ${debtorId}`);
                    const paymentsArray = Object.values(debtor.payments);
                    
                    const debtorRef = ref(database, `debtors/${debtorId}`);
                    await update(debtorRef, { payments: paymentsArray });
                    updateCount++;
                }
            });
            
            console.log(`Fixed payments data for ${updateCount} debtors`);
        } catch (error) {
            console.error("Error fixing payment data:", error);
        }
    } else {
        console.log("Firebase not available");
    }
    
    return "Fix operation completed - see console output";
};

function renderUsers() {
    const searchInput = document.getElementById('user-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    // ADMINS AND SUPER ADMINS SEE ALL USERS
    let usersToShow = allUsers;
    
    // Apply search filter
    const filtered = usersToShow.filter(u => 
        (u.displayName || '').toLowerCase().includes(searchTerm) || 
        (u.email || '').toLowerCase().includes(searchTerm)
    );
    
    // Update stats
    const total = filtered.length;
    const activeCount = filtered.filter(u => u.active !== false).length;
    const deactivatedCount = total - activeCount;
    
    const totalEl = document.getElementById('total-users-count');
    const activeEl = document.getElementById('active-users-count');
    const deactivatedEl = document.getElementById('deactivated-users-count');
    
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = activeCount;
    if (deactivatedEl) deactivatedEl.textContent = deactivatedCount;
    
    // Render user list
    const list = document.getElementById('users-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (filtered.length === 0) {
        list.innerHTML = '<li class="empty-state">No users found</li>';
        return;
    }
    
    filtered.forEach(user => {
        const li = document.createElement('li');
        li.classList.add('user-item');
        if (user.active === false) li.classList.add('deactivated');
        
        // Determine if current user can manage this user
        const canManage = isSuperAdmin() || (isAdmin() && user.role !== USER_ROLES.SUPER_ADMIN);
        
        li.innerHTML = `
            <div class="user-info">
                <span class="user-name">${user.displayName || 'Unnamed'}</span>
                <span class="user-email">${user.email}</span>
                <div class="user-meta">
                    <span class="user-role role-${user.role}">${getRoleDisplayName(user.role)}</span>
                    <span class="user-status ${user.active !== false ? '' : 'deactivated'}">
                        ${user.active !== false ? 'Active' : 'Deactivated'}
                    </span>
                </div>
            </div>
            <div class="user-actions">
                ${canManage ? `
                    <button class="toggle-user-btn ${user.active !== false ? 'deactivate' : 'activate'}" data-uid="${user.uid}">
                        <i class="fas fa-${user.active !== false ? 'ban' : 'check'}"></i> 
                        ${user.active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                ` : ''}
                ${canManage ? `
                    <button class="delete-user-btn danger" data-uid="${user.uid}">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                ` : ''}
            </div>
        `;
        list.appendChild(li);
    });
}

async function deleteUserFromAuth(uid) {
    try {
        console.log('Sending delete request for UID:', uid);
        
        const response = await fetch('http://localhost:3000/delete-user', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid: uid })
        });
        
        console.log('Response status:', response.status);
        console.log('Response OK?', response.ok);
        
        if (!response.ok) {
            // Read as text for non-JSON errors (e.g., 404 HTML)
            const errorText = await response.text();
            console.error('Raw error response:', errorText.substring(0, 200));
            throw new Error(`Server error ${response.status}: ${errorText || 'Unknown'}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!data.success) {
            throw new Error(data.error || data.message || 'Unknown server error');
        }
        
        return true;
    } catch (error) {
        console.error('Delete request failed:', error);
        throw error;
    }
}

window.debugPermissions = function() {
    console.log('=== PERMISSION DEBUG ===');
    console.log('Current User:', currentUser);
    console.log('Current User Role:', currentUserRole);
    console.log('Current User Data:', currentUserData);
    console.log('Can Manage Debtors:', canManageDebtors());
    console.log('Can Make Payments:', canMakePayments());
    console.log('Can Manage Transactions:', canManageTransactions());
    console.log('Can Checkout:', canCheckout());
    console.log('Can Manage Products:', canManageProducts());
    console.log('Can Edit Settings:', canEditSettings());
    console.log('Can Create Accounts:', canCreateAccounts());
    console.log('======================');
};

// ========================
// EXPORT FIREBASE CONFIGURATION
// ========================
export { 
    app, 
    analytics, 
    database, 
    auth, 
    ref, 
    onValue, 
    push, 
    set, 
    update, 
    remove, 
    get 
};