// // Global variables
// let debtors = [];
// let selectedDebtorId = null;
// let selectedProductIndex = null;
// let isLoadingData = false;
// let archivedDebtors = [];
// let sentReminders = [];
// let debtDistributionChart = null;
// let paymentTrendsChart = null;
// let currentUser = null;
// let currentUserData = null; 
// let openDebtorId = null;
// let products = [];
// let isSubmitting = false;
// let editingDebtorId = null;
// const ADMIN_EMAIL = "carbolidofrencejhon@gmail.com";
// const productSearch = document.getElementById('product-search');
// const productsList = document.getElementById('products-list');

// function isAdmin() {
//     return currentUser && currentUser.email === ADMIN_EMAIL;
// }

// document.getElementById('product-form').addEventListener('submit', async (e) => {
//     e.preventDefault();
    
//     if (isSubmitting) {
//         console.log("Already submitting, ignoring additional submission");
//         return;
//     }
//     isSubmitting = true;

//     try {
//         const debtor = debtors.find(d => d.id === selectedDebtorId);
//         if (!debtor) {
//             console.error('No debtor selected');
//             alert('No debtor selected');
//             return;
//         }

//         const dueDateTimestamp = document.getElementById('transaction-due-timestamp').value;
//         const dueDate = dueDateTimestamp ? parseInt(dueDateTimestamp, 10) : null;

//         const productEntries = document.querySelectorAll('.product-entry');
//         const productsToAdd = [];
//         let transactionTotal = 0;

//         for (const entry of productEntries) {
//             const name = entry.querySelector('.product-name').value.trim();
//             const quantity = parseFloat(entry.querySelector('.product-quantity').value);
//             const price = parseFloat(entry.querySelector('.product-price').value);
//             if (name && !isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
//                 const total = quantity * price;
//                 productsToAdd.push({ name, quantity, price, total });
//                 transactionTotal += total;
//             }
//         }

//         if (productsToAdd.length === 0) {
//             alert('Please add at least one valid product with positive quantity and price.');
//             return;
//         }

//         // Check stock availability
//         for (const productToAdd of productsToAdd) {
//             const inventoryProduct = products.find(p => p.name.toLowerCase() === productToAdd.name.toLowerCase());
//             if (!inventoryProduct) {
//                 alert(`Product "${productToAdd.name}" not found in inventory.`);
//                 return;
//             }
//             if (inventoryProduct.stock === undefined) {
//                 alert(`Stock information missing for "${productToAdd.name}". Please update the inventory.`);
//                 return;
//             }
//             if (inventoryProduct.stock < productToAdd.quantity) {
//                 alert(`Insufficient stock for "${productToAdd.name}". Available: ${inventoryProduct.stock}, Requested: ${productToAdd.quantity}`);
//                 return;
//             }
//         }

//         // Update stock
//         for (const productToAdd of productsToAdd) {
//             const inventoryProduct = products.find(p => p.name.toLowerCase() === productToAdd.name.toLowerCase());
//             inventoryProduct.stock -= productToAdd.quantity;
//             await updateProduct(inventoryProduct);
//         }

//         // Create transaction object
//         const referenceNumber = generateReferenceNumber();
//         const transaction = {
//             id: 'transaction_' + Date.now(),
//             referenceNumber: referenceNumber,
//             dateAdded: Date.now(),
//             dueDate: dueDate,
//             total: transactionTotal,
//             paid: 0,
//             products: productsToAdd
//         };

//         // Save transaction and send SMS
//         await saveTransaction(debtor, transaction);

//         // IMPORTANT: Update the debtors array with the modified debtor
//         const debtorIndex = debtors.findIndex(d => d.id === debtor.id);
//         if (debtorIndex !== -1) {
//             debtors[debtorIndex] = debtor;
//         }

//         renderDebtors();
//         document.getElementById('product-form-modal').style.display = 'none';
//         document.getElementById('product-form').reset();
        
//         // Reset form to initial state
//         const productList = document.getElementById('product-list');
//         while (productList.children.length > 1) {
//             productList.removeChild(productList.lastChild);
//         }
        
//         // Update remaining entry
//         const remainingEntry = productList.querySelector('.product-entry');
//         if (remainingEntry) {
//             calculateProductTotal(remainingEntry);
//         }
        
//         calculateGrandTotal();
        
//         alert('Transaction added successfully, stock updated, and SMS sent!');
//     } catch (error) {
//         console.error('Error in form submission:', error);
//         // Revert stock changes on error
//         const productEntries = document.querySelectorAll('.product-entry');
//         const productsToAdd = [];
//         for (const entry of productEntries) {
//             const name = entry.querySelector('.product-name').value.trim();
//             const quantity = parseFloat(entry.querySelector('.product-quantity').value);
//             const price = parseFloat(entry.querySelector('.product-price').value);
//             if (name && !isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
//                 productsToAdd.push({ name, quantity, price });
//             }
//         }
//         for (const productToAdd of productsToAdd) {
//             const inventoryProduct = products.find(p => p.name.toLowerCase() === productToAdd.name.toLowerCase());
//             if (inventoryProduct) {
//                 inventoryProduct.stock += productToAdd.quantity;
//                 await updateProduct(inventoryProduct);
//             }
//         }
//         alert('Failed to add transaction or send SMS: ' + error.message);
//     } finally {
//         isSubmitting = false;
//     }
// });

// document.getElementById('product-form').addEventListener('submit', function(e) {
//     e.preventDefault();

//     // Process the transaction here (e.g., update debtor data)
//     renderDebtors();

//     // Reset the form
//     document.getElementById('product-form').reset();

//     // Remove extra product entries to reset to initial state
//     const productList = document.getElementById('product-list');
//     while (productList.children.length > 1) {
//         productList.removeChild(productList.lastChild);
//     }

//     // Update the remaining product entry's total
//     const remainingEntry = productList.querySelector('.product-entry');
//     if (remainingEntry) {
//         calculateProductTotal(remainingEntry);
//     }

//     // Recalculate the grand total
//     calculateGrandTotal();

//     // Close all modals after resetting
//     closeAllModals();
// });

// // Modify the debtor form submission event listener
// // Add this function at the top of script.js
// function capitalizeWords(str) {
//     return str.replace(/\s+/g, ' ').trim().split(' ').map(word => 
//         word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
//     ).join(' ');
// }

// document.getElementById('debtor-form').addEventListener('submit', async (e) => {
//     e.preventDefault();

//     const debtorNameInput = document.getElementById('debtor-name').value.trim();
//     const contactNumber = document.getElementById('debtor-contact').value.trim();

//     if (!debtorNameInput || !contactNumber) {
//         alert('Please fill in all required fields.');
//         return;
//     }

//     const standardizedName = capitalizeWords(debtorNameInput);

//     // Check for name uniqueness, excluding the current debtor if editing
//     const nameExists = debtors.some(debtor => debtor.name === standardizedName && debtor.id !== editingDebtorId);
//     if (nameExists) {
//         alert('A debtor with this name already exists. Please use a different name.');
//         return;
//     }

//     let formattedContact = contactNumber;
//     if (contactNumber.startsWith('0')) {
//         formattedContact = '+63' + contactNumber.substring(1);
//     } else if (!contactNumber.startsWith('+63')) {
//         formattedContact = '+63' + contactNumber;
//     }

//     if (editingDebtorId) {
//         // Update existing debtor
//         const debtor = debtors.find(d => d.id === editingDebtorId);
//         if (debtor) {
//             debtor.name = standardizedName;
//             debtor.contact = formattedContact;
//             await updateDebtor(debtor);
//             alert('Debtor updated successfully!');
//         }
//         editingDebtorId = null;
//         // Reset modal title and button text
//         document.querySelector('#debtor-form-modal h2').textContent = 'Add Debtor';
//         document.querySelector('#debtor-form button[type="submit"]').textContent = 'Save';
//     } else {
//         // Add new debtor
//         const newDebtor = {
//             name: standardizedName,
//             contact: formattedContact,
//             products: [],
//             payments: [],
//             totalDebt: 0,
//             createdAt: Date.now()
//         };
//         try {
//             console.log("Saving new debtor:", newDebtor);
//             await saveDebtor(newDebtor);
//             console.log("Debtor saved successfully");
//             alert('Debtor added successfully!');
//         } catch (error) {
//             console.error("Error saving debtor:", error);
//         }
//     }

//     document.getElementById('debtor-form').reset();
//     closeAllModals();
// });

// async function updateDebtor(updatedDebtor) {
//     try {
//         if (window.firebase) {
//             const { database, ref, update } = window.firebase;
//             const debtorRef = ref(database, 'debtors/' + updatedDebtor.id);
//             await update(debtorRef, {
//                 name: updatedDebtor.name,
//                 contact: updatedDebtor.contact
//             });
//             console.log("Debtor updated in Firebase");
//         }

//         // Update local array
//         const index = debtors.findIndex(d => d.id === updatedDebtor.id);
//         if (index !== -1) {
//             debtors[index] = { ...debtors[index], name: updatedDebtor.name, contact: updatedDebtor.contact };
//         }

//         localStorage.setItem('debtors', JSON.stringify(debtors));
//         renderDebtors();
//         if (document.getElementById('dashboard').style.display === 'block') {
//             updateDashboard();
//         }
//     } catch (error) {
//         console.error('Error updating debtor:', error);
//         alert('Failed to update debtor. Please try again.');
//     }
// }

// // Initialize application on DOM load
// document.addEventListener('DOMContentLoaded', async function() {
//     console.log('DOM loaded - initializing dashboard');
    
//     // Get elements once
//     const dashboardBtn = document.getElementById('dashboard-btn');
//     const dashboardBackBtn = document.getElementById('dashboard-back-btn');
//     const dashboard = document.getElementById('dashboard');
//     const mainContainer = document.getElementById('main-container');
    
//     // Add dashboard button click handler with automatic reminders
//     if (dashboardBtn) {
//         console.log('Dashboard button found');
//         dashboardBtn.addEventListener('click', function() {
//             console.log('Dashboard button clicked');
//             if (dashboard && mainContainer) {
//                 console.log('Opening dashboard...');
//                 dashboard.style.display = 'block';
//                 mainContainer.style.display = 'none';
//                 checkAndSendReminders(); // Check and send automatic reminders
//                 updateDashboard(); // Update dashboard data
//             } else {
//                 console.error('Dashboard or main container elements not found');
//             }
//         });
//     } else {
//         console.error('Dashboard button not found');
//     }
    
//     // Dashboard back button
//     if (dashboardBackBtn) {
//         dashboardBackBtn.addEventListener('click', function() {
//             if (dashboard && mainContainer) {
//                 dashboard.style.display = 'none';
//                 mainContainer.style.display = 'block';
//             }
//         });
//     }
    
//     // Initialize sidebar
//     const hamburgerMenu = document.querySelector('.hamburger-menu');
//     const sidebar = document.querySelector('.sidebar');
    
//     if (hamburgerMenu && sidebar) {
//         hamburgerMenu.addEventListener('click', function() {
//             sidebar.classList.toggle('active');
//         });
        
//         // Close sidebar when clicking outside
//         document.addEventListener('click', function(event) {
//             if (!sidebar.contains(event.target) && !hamburgerMenu.contains(event.target)) {
//                 sidebar.classList.remove('active');
//             }
//         });
//     }
    
//     // Initialize theme toggle
//     const themeToggle = document.querySelector('.theme-toggle');
//     if (themeToggle) {
//         themeToggle.addEventListener('click', toggleTheme);
//     }
    
//     // Initialize logout button
//     const logoutBtn = document.querySelector('.logout-btn');
//     if (logoutBtn) {
//         logoutBtn.addEventListener('click', logout);
//     }

//     // Add archive and sent reminders button listeners
//     document.getElementById('archive-btn').addEventListener('click', viewArchive);
//     document.getElementById('sent-reminders-btn').addEventListener('click', viewSentReminders);
    
//     // Load archived debtors and sent reminders from localStorage
//     const savedArchived = localStorage.getItem('archivedDebtors');
//     if (savedArchived) archivedDebtors = JSON.parse(savedArchived);
    
//     const savedReminders = localStorage.getItem('sentReminders');
//     if (savedReminders) sentReminders = JSON.parse(savedReminders);

//     // Setup Firebase real-time listener
//     if (window.firebase) {
//         const { database, ref, onValue } = window.firebase;
//         const debtorsRef = ref(database, 'debtors');
//         onValue(debtorsRef, (snapshot) => {
//             console.log("Real-time update triggered: Debtors data changed");
//             debtors = [];
//             snapshot.forEach((childSnapshot) => {
//                 const debtor = childSnapshot.val();
//                 debtor.id = childSnapshot.key;
//                 debtor.payments = debtor.payments && !Array.isArray(debtor.payments) ? Object.values(debtor.payments) : debtor.payments || [];
//                 debtors.push(debtor);
//             });
//             debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
//             renderDebtors();
//             if (document.getElementById('dashboard').style.display === 'block') {
//                 console.log("Dashboard is visible, updating now...");
//                 updateDashboard();
//             }
//             localStorage.setItem('debtors', JSON.stringify(debtors));
//         }, (error) => {
//             console.error("Error in real-time listener:", error);
//         });
//     }

//     // Due date settings modal
//     const dueDateSettingsBtn = document.getElementById('due-date-settings-btn');
//     const dueDateSettingsModal = document.getElementById('due-date-settings-modal');
//     if (dueDateSettingsBtn && dueDateSettingsModal) {
//         dueDateSettingsBtn.addEventListener('click', () => {
//             dueDateSettingsModal.style.display = 'block';
//             const form = document.getElementById('due-date-settings-form');
//             const inputs = form.querySelectorAll('input');
//             const saveButton = form.querySelector('button[type="submit"]');
//             if (!isAdmin()) {
//                 inputs.forEach(input => {
//                     input.disabled = true;
//               });
//               if (saveButton) {
//                 saveButton.disabled = true;
//                    saveButton.textContent = 'Only admin can modify';
//                 }
//             } else {
//                 inputs.forEach(input => {
//                     input.disabled = false;
//                });
//                if (saveButton) {
//                    saveButton.disabled = false;
//                    saveButton.textContent = 'Save';
//                 }
//            }
//            const currentDuration = localStorage.getItem('dueDateDuration');
//            const currentInterval = localStorage.getItem('reminderInterval');
//            if (currentDuration) {
//                document.getElementById('due-date-duration').value = currentDuration;
//             }
//             if (currentInterval) {
//                document.getElementById('reminder-interval').value = currentInterval;
//            }
//         });
//     }

//     // Due date settings form submission
//     const dueDateSettingsForm = document.getElementById('due-date-settings-form');
//     if (dueDateSettingsForm) {
//         dueDateSettingsForm.addEventListener('submit', (e) => {
//             e.preventDefault();
//             if (!isAdmin()) {
//                 alert('Only admin can modify these settings.');
//                 return;
//             }
//             const duration = document.getElementById('due-date-duration').value;
//             const reminderInterval = document.getElementById('reminder-interval').value;
//             if (duration && !isNaN(duration) && duration >= 0 && reminderInterval && !isNaN(reminderInterval) && reminderInterval >= 1) {
//                 localStorage.setItem('dueDateDuration', duration);
//                 localStorage.setItem('reminderInterval', reminderInterval);
//                 alert('Settings saved successfully!');
//                 closeAllModals();
//             } else {
//                 alert('Please enter valid numbers.');
//             }
//         });
//     }


//     if (dueDateSettingsForm) {
//         dueDateSettingsForm.addEventListener('submit', (e) => {
//             e.preventDefault();
//             const duration = document.getElementById('due-date-duration').value;
//             const reminderInterval = document.getElementById('reminder-interval').value;
//             if (duration && !isNaN(duration) && duration >= 0 && reminderInterval && !isNaN(reminderInterval) && reminderInterval >= 1) {
//                 localStorage.setItem('dueDateDuration', duration);
//                 localStorage.setItem('reminderInterval', reminderInterval);
//                 alert('Settings saved successfully!');
//                 closeAllModals();
//             } else {
//                 alert('Please enter valid numbers.');
//             }
//         });
//     }

//     function capitalizeWords(str) {
//         return str.replace(/\s+/g, ' ').trim().split(' ').map(word => 
//             word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
//         ).join(' ');
//     }

//     // Apply capitalization on blur for name inputs
//     ['debtor-name', 'product-name', 'new-product-name'].forEach(id => {
//         const input = document.getElementById(id);
//         if (input) {
//             input.addEventListener('blur', function() {
//                 this.value = capitalizeWords(this.value);
//             });
//         }
//     });

//     await loadProducts();

//     document.getElementById('products-btn')?.addEventListener('click', () => {
//         const productSearch = document.getElementById('product-search');
//         if (productSearch) productSearch.value = '';
//         renderProductsWithSearch();
//         document.getElementById('products-modal').style.display = 'block';
//         const addProductBtn = document.getElementById('add-product-inventory-btn');
//         if (addProductBtn) {
//             addProductBtn.style.display = isAdmin() ? 'block' : 'none';
//         }
//     });

//     document.getElementById('add-product-inventory-btn')?.addEventListener('click', () => {
//         openProductForm('add');
//     });

//     document.getElementById('products-list')?.addEventListener('click', (e) => {
//         if (e.target.closest('.edit-product-btn')) {
//             const productId = e.target.closest('.edit-product-btn').dataset.productId;
//             const product = products.find(p => p.id === productId);
//             if (product) openProductForm('edit', product);
//         }
//     });

//     document.getElementById('products-list').addEventListener('click', (e) => {
//         console.log('Click detected on #products-list:', e.target);
//         if (e.target.closest('.delete-product-btn')) {
//             const button = e.target.closest('.delete-product-btn');
//             const productId = button.dataset.productId;
//             console.log('Delete button clicked, productId:', productId);
//             deleteProduct(productId);
//         }
//     });

//     document.getElementById('product-list')?.addEventListener('blur', handleProductNameBlur, true);

//     const inventoryProductForm = document.getElementById('inventory-product-form');
//     if (inventoryProductForm) {
//         inventoryProductForm.addEventListener('submit', handleProductFormSubmit);
//     }

//     console.log('DOM loaded - initializing application'); {
//         try {
//             const firebase = getFirebaseInstance();
//             if (!firebase) {
//                 throw new Error("Could not initialize Firebase");
//             }
//             console.log("Firebase initialized successfully");
            
//             initializeUIElements();
//             initializeSidebar();
//             loadDebtorsAndUpdateDashboard();
//         } catch (error) {
//             console.error("Initialization error:", error);
//             alert("Warning: Using offline mode. Some features may be limited.");
//             tryLoadFromLocalStorage();
//         }
//     }
    
//     if (dashboardBtn) {
//         dashboardBtn.addEventListener('click', function() {
//             if (dashboard && mainContainer) {
//                 dashboard.style.display = 'block';
//                 mainContainer.style.display = 'none';
//                 loadDebtorsAndUpdateDashboard();
//             }
//         });
//     }

//     const addDebtorBtn = document.getElementById('add-debtor-btn');
//     if (addDebtorBtn) {
//         addDebtorBtn.addEventListener('click', function() {
//             document.getElementById('debtor-form-modal').style.display = 'block';
//         });
//     }


//     if (dashboardBtn) {
//         dashboardBtn.addEventListener('click', function() {
//             document.getElementById('dashboard').style.display = 'block';
//             document.getElementById('main-container').style.display = 'none';
//             updateDashboard();
//         });
//     } else {
//         console.error('Element #dashboard-btn not found');
//     }

//     if (dashboardBackBtn) {
//         dashboardBackBtn.addEventListener('click', function() {
//             document.getElementById('dashboard').style.display = 'none';
//             document.getElementById('main-container').style.display = 'block';
//         });
//     } else {
//         console.error('Element #dashboard-back-btn not found');
//     }

//     if (addDebtorBtn) {
//         addDebtorBtn.addEventListener('click', function() {
//             document.getElementById('debtor-form-modal').style.display = 'block';
//         });
//     } else {
//         console.error('Element #add-debtor-btn not found');
//     }

//     const payAllBtn = document.getElementById('pay-all-products');
//     if (payAllBtn) {
//         payAllBtn.addEventListener('click', /* your handler */);
//     } else {
//         console.error('Element #pay-all-products not found');
//     }

//     const confirmPaymentBtn = document.getElementById('confirm-payment');
//     if (confirmPaymentBtn) {
//         confirmPaymentBtn.addEventListener('click', /* your handler */);
//     } else {
//         console.error('Element #confirm-payment not found');
//     }

//     // Ensure the button exists before adding the event listener
//     if (profileBtn) {
//         profileBtn.addEventListener('click', openProfileModal);
//         console.log('Event listener attached to profile button');
//     } else {
//         console.error('Profile button not found in the DOM');
//     }
    
//     const profileForm = document.getElementById('profile-form');
//     if (profileForm) {
//         profileForm.addEventListener('submit', updateProfile);
//     }
    
//     const createAccountBtn = document.getElementById('create-account-btn');
//     if (createAccountBtn) {
//         createAccountBtn.addEventListener('click', openAddAccountModal);
//     }
    
//     const addAccountForm = document.getElementById('add-account-form');
//     if (addAccountForm) {
//         addAccountForm.addEventListener('submit', createNewAccount);
        
//         const confirmPasswordInput = document.getElementById('new-account-confirm-password');
//         if (confirmPasswordInput) {
//             confirmPasswordInput.addEventListener('input', checkPasswordMatch);
//         }
//     }

//     const profileBtn = document.getElementById('profile-btn');
//     if (profileBtn) {
//          profileBtn.addEventListener('click', (e) => {
//              console.log('Profile button clicked!');
//              openProfileModal();
//         });
//         console.log('Profile button event listener attached');
//     } else {
//         console.error('Profile button not found!');
//     }

//     await loadProducts();
//     const productSearch = document.getElementById('product-search');
//     if (productSearch) {
//         productSearch.addEventListener('input', debounce(renderProductsWithSearch, 300));
//     }
    
//     loadCurrentUser();
//     initializePasswordToggles();
//     loadDebtorsAndUpdateDashboard();
//     await loadProducts();
// });

// document.addEventListener('DOMContentLoaded', function() {
//     const profileBtn = document.getElementById('profile-btn');
//     if (profileBtn) profileBtn.addEventListener('click', openProfileModal);
    
//     const profileForm = document.getElementById('profile-form');
//     if (profileForm) profileForm.addEventListener('submit', updateProfile);
    
//     const createAccountBtn = document.getElementById('create-account-btn');
//     if (createAccountBtn) createAccountBtn.addEventListener('click', openAddAccountModal);
    
//     const addAccountForm = document.getElementById('add-account-form');
//     if (addAccountForm) {
//         addAccountForm.addEventListener('submit', createNewAccount);
//         const confirmPasswordInput = document.getElementById('new-account-confirm-password');
//         if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', checkPasswordMatch);
//     }
    
//     initializePasswordToggles();
//     loadCurrentUser();
// });

// document.addEventListener('DOMContentLoaded', function() {
//     productSearch.addEventListener('input', debounce(renderProductsWithSearch, 300));
//     // Other initialization code, like loading products and setting up button listeners, goes here
// });

// // Function to check and send automatic reminders
// function checkAndSendReminders() {
//     const now = Date.now();
//     const reminderIntervalDays = parseInt(localStorage.getItem('reminderInterval') || '1', 10);
//     const reminderIntervalMs = reminderIntervalDays * 24 * 60 * 60 * 1000;

//     debtors.forEach(debtor => {
//         const overdueTransactions = debtor.transactions.filter(t => 
//             t.dueDate && t.dueDate < now && (t.total - (t.paid || 0)) > 0
//         );
//         if (overdueTransactions.length > 0) {
//             const lastReminder = sentReminders
//                 .filter(r => r.debtorId === debtor.id)
//                 .sort((a, b) => b.timestamp - a.timestamp)[0];

//             if (!lastReminder || (now - lastReminder.timestamp > reminderIntervalMs)) {
//                 remindDebtor(debtor, true); // Automatic reminder
//             }
//         }
//     });
// }

// // Updated renderDebtors function to show overdue transaction count
// function renderDebtors(debtorsList = debtors) {
//     const debtorsListElement = document.getElementById('debtors-list');
//     const emptyState = document.getElementById('empty-state');
//     if (!debtorsListElement) return;

//     debtorsListElement.innerHTML = '';
//     if (!debtorsList || debtorsList.length === 0) {
//         if (emptyState) emptyState.style.display = 'block';
//         return;
//     }
//     if (emptyState) emptyState.style.display = 'none';

//     const currentDate = new Date().getTime();
    
//     debtorsList.forEach(debtor => {
//         // Calculate overdue transactions count and amount
//         let overdueCount = 0;
//         let overdueAmount = 0;
        
//         if (debtor.transactions && debtor.transactions.length > 0) {
//             debtor.transactions.forEach(transaction => {
//                 if (transaction.dueDate && transaction.dueDate < currentDate) {
//                     const remainingBalance = transaction.total - (transaction.paid || 0);
//                     if (remainingBalance > 0) {
//                         overdueCount++;
//                         overdueAmount += remainingBalance;
//                     }
//                 }
//             });
//         }

//         // Create overdue indicator
//         const overdueIndicator = overdueCount > 0 
//             ? `<span class="overdue-indicator" title="₱${overdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Overdue">${overdueCount} Overdue</span>`
//             : '';

//         const li = document.createElement('li');
//         li.setAttribute('data-debtor-id', debtor.id);
//         li.classList.add('debtor-entry');
//         li.innerHTML = `
//             <div class="debtor-header">
//                 <span>
//                     ${debtor.name} - ₱${(debtor.totalDebt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     ${overdueIndicator}
//                 </span>
//                 <button class="toggle-details">▼</button>
//             </div>
//             <div class="debtor-details" style="display: none;">
//                 <div>Contact: ${debtor.contact}</div>
//                 <h3>Transactions:</h3>
//                 <ul>
//                     ${debtor.transactions ? debtor.transactions.map((transaction, index) => {
//                         const isOverdue = transaction.dueDate && transaction.dueDate < currentDate && (transaction.total - (transaction.paid || 0)) > 0;
//                         return `
//                             <li class="${isOverdue ? 'overdue' : ''}">
//                                 <div class="transaction-header">
//                                     <div class="columns-container">
//                                         <div class="left-column">
//                                              <span>Transaction ${index + 1}</span>
//                                              <span>Ref: ${transaction.referenceNumber || 'N/A'}</span>
//                                              <span>₱${transaction.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//                                         </div>
//                                         <div class="right-column">
//                                             <span>Date Added: ${new Date(transaction.dateAdded).toLocaleDateString()}</span>
//                                             <span>Due: ${transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'Not Set'}</span>
//                                             <span>Remaining: ₱${(transaction.total - (transaction.paid || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
//                                         </div>
//                                     </div>
//                                     <button class="toggle-transaction-details">▼</button>
//                                 </div>
//                                 <div class="transaction-details" style="display: none;">
//                                     <ul>
//                                         ${transaction.products.map(product => `
//                                             <li>
//                                                 ${product.name} - ${product.quantity}x ₱${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ₱${product.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                             </li>
//                                         `).join('')}
//                                     </ul>
//                                 </div>
//                             </li>
//                         `;
//                     }).join('') : '<li>No transactions</li>'}
//                 </ul>
//                 <div class="action-buttons">
//                     <button class="add-product-btn">Add Transaction</button>
//                     <button class="pay-btn">Make Payment</button>
//                     <button class="payment-history-btn">Payment History</button>
//                     <button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
//                     <button class="delete-btn">Delete</button>
//                     <button class="print-btn">Print Record</button>
//                 </div>
//             </div>
//         `;
//         debtorsListElement.appendChild(li);
//     });

//     // Restore open debtor details if applicable
//     if (openDebtorId) {
//         const debtorItem = document.querySelector(`li[data-debtor-id="${openDebtorId}"]`);
//         if (debtorItem) {
//             const details = debtorItem.querySelector('.debtor-details');
//             const toggleBtn = debtorItem.querySelector('.toggle-details');
//             if (details && toggleBtn) {
//                 details.style.display = 'block';
//                 toggleBtn.textContent = '▲';
//             }
//         }
//     }

//     // Attach event listeners for transaction details toggle
//     document.querySelectorAll('.toggle-transaction-details').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             const details = e.target.parentElement.nextElementSibling;
//             const isOpen = details.style.display === 'block';
//             details.style.display = isOpen ? 'none' : 'block';
//             e.target.textContent = isOpen ? '▼' : '▲';
//         });
//     });

//     // Attach event listeners for print buttons
//     document.querySelectorAll('.print-btn').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             e.stopPropagation();
//             const debtorId = e.target.closest('li').getAttribute('data-debtor-id');
//             const debtor = debtors.find(d => d.id === debtorId);
//             openPrintSelectionModal(debtor);
//         });
//     });

//     attachDebtorSelectionListeners();
// }

// // Function to open the print selection modal
// function openPrintSelectionModal(debtor) {
//     const modal = document.getElementById('print-selection-modal');
//     const selectionList = document.getElementById('transaction-selection-list');
//     selectionList.innerHTML = '';

//     if (debtor.transactions && debtor.transactions.length > 0) {
//         debtor.transactions.forEach((transaction, index) => {
//             const div = document.createElement('div');
//             div.innerHTML = `
//                 <label>
//                     <input type="checkbox" value="${index}">
//                     Transaction ${index + 1} - ₱${transaction.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                 </label>
//             `;
//             selectionList.appendChild(div);
//         });
//     } else {
//         selectionList.innerHTML = '<p>No transactions to select</p>';
//     }

//     modal.style.display = 'block';

//     // Add event listeners for buttons
//     document.getElementById('print-selected-btn').onclick = () => {
//         const checkedBoxes = selectionList.querySelectorAll('input[type="checkbox"]:checked');
//         const selectedIndices = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
//         const selectedTransactions = selectedIndices.map(index => debtor.transactions[index]);
//         printDebtorRecord(debtor, selectedTransactions);
//         closeAllModals();
//     };

//     document.getElementById('print-all-btn').onclick = () => {
//         printDebtorRecord(debtor);
//         closeAllModals();
//     };

//     document.querySelector('#print-selection-modal .cancel-btn').onclick = closeAllModals;
// }

// function initializeSidebar() {
//     const hamburgerMenu = document.querySelector('.hamburger-menu');
//     const sidebar = document.querySelector('.sidebar');

//     if (hamburgerMenu && sidebar) {
//         hamburgerMenu.addEventListener('click', function() {
//             sidebar.classList.toggle('active');
//         });

//         document.addEventListener('click', function(event) {
//             if (!sidebar.contains(event.target) && !hamburgerMenu.contains(event.target)) {
//                 sidebar.classList.remove('active');
//             }
//         });
//     }
// }

// document.addEventListener('DOMContentLoaded', async () => {
//     const hamburgerMenu = document.querySelector('.hamburger-menu');
//     if (hamburgerMenu) {
//         hamburgerMenu.addEventListener('click', toggleSidebar);
//     }
    
//     document.addEventListener('click', (event) => {
//         const sidebar = document.querySelector('.sidebar');
//         const hamburgerMenu = document.querySelector('.hamburger-menu');
//         if (sidebar && !sidebar.contains(event.target) && !hamburgerMenu.contains(event.target)) {
//             sidebar.classList.remove('active');
//         }
//     });
    
//     initializeSidebar();
    
//     const archiveBtn = document.querySelector('button[onclick="viewArchive()"]');
//     if (archiveBtn) {
//         archiveBtn.addEventListener('click', viewArchive);
//     }

//     const sentRemindersBtn = document.querySelector('button[onclick="viewSentReminders()"]');
//     if (sentRemindersBtn) {
//         sentRemindersBtn.addEventListener('click', viewSentReminders);
//     }
// });

// // Function to refresh payment modal data
// function refreshPaymentModal(debtorId) {
//     // Always get fresh debtor data
//     const debtor = debtors.find(d => d.id === debtorId);
//     if (!debtor || !debtor.transactions) {
//         console.error('Debtor or transactions not found');
//         return;
//     }

//     const productChoices = document.getElementById('payment-product-choices');
//     productChoices.innerHTML = '';
    
//     // Generate fresh transaction buttons
//     debtor.transactions.forEach((transaction, index) => {
//         const remaining = transaction.total - (transaction.paid || 0);
//         if (remaining > 0) {
//             const button = document.createElement('button');
//             button.type = 'button';
//             button.className = 'product-choice-button';
//             button.setAttribute('data-transaction-index', index);
//             button.innerHTML = `
//                 Transaction ${index + 1}<br>
//                 Ref: ${transaction.referenceNumber || 'N/A'}<br>
//                 Remaining: ₱${remaining.toFixed(2)}
//             `;
//             productChoices.appendChild(button);
//         }
//     });

//     // Show/hide pay all button based on total debt
//     const payAllBtn = document.getElementById('pay-all-products');
//     if (debtor.totalDebt > 0) {
//         payAllBtn.style.display = 'block';
//     } else {
//         payAllBtn.style.display = 'none';
//     }
// }

// // Updated pay button click handler
// document.addEventListener('click', (e) => {
//     if (e.target.classList.contains('pay-btn')) {
//         const debtorId = e.target.closest('li').getAttribute('data-debtor-id');
//         selectedDebtorId = debtorId;
        
//         // Refresh the modal with fresh data
//         refreshPaymentModal(debtorId);
        
//         // Show the payment modal
//         document.getElementById('payment-modal').style.display = 'block';
//         document.getElementById('product-selection').style.display = 'block';
//         document.getElementById('payment-amount-input').style.display = 'none';
//     }
// });

// // Updated transaction choice handler
// document.getElementById('payment-product-choices').addEventListener('click', (e) => {
//     if (!e.target.classList.contains('product-choice-button')) return;
    
//     selectedTransactionIndex = e.target.getAttribute('data-transaction-index');
    
//     // Get fresh debtor data
//     const debtor = debtors.find(d => d.id === selectedDebtorId);
//     if (!debtor || !debtor.transactions) {
//         console.error('Debtor or transactions not found');
//         return;
//     }

//     const transaction = debtor.transactions[selectedTransactionIndex];
//     if (!transaction) {
//         console.error('Transaction not found');
//         return;
//     }

//     const remaining = (transaction.total - (transaction.paid || 0)).toFixed(2);
//     document.getElementById('payment-for').textContent = `Transaction ${parseInt(selectedTransactionIndex) + 1}`;
//     document.getElementById('amount-due').textContent = `₱${remaining}`;
//     document.getElementById('payment-amount').value = '';

//     document.getElementById('product-selection').style.display = 'none';
//     document.getElementById('payment-amount-input').style.display = 'block';
// });

// // Updated pay all handler
// document.getElementById('pay-all-products').addEventListener('click', () => {
//     selectedTransactionIndex = 'all';
    
//     // Get fresh debtor data
//     const debtor = debtors.find(d => d.id === selectedDebtorId);
//     if (!debtor) {
//         console.error('Debtor not found');
//         return;
//     }

//     document.getElementById('payment-for').textContent = 'All Transactions';
//     document.getElementById('amount-due').textContent = `₱${debtor.totalDebt.toFixed(2)}`;
//     document.getElementById('payment-amount').value = '';

//     document.getElementById('product-selection').style.display = 'none';
//     document.getElementById('payment-amount-input').style.display = 'block';
// });

// document.getElementById('confirm-payment').addEventListener('click', async () => {
//     const amountInput = document.getElementById('payment-amount');
//     const amount = parseFloat(amountInput.value);
//     const debtor = debtors.find(d => d.id === selectedDebtorId);

//     if (!debtor) {
//         alert('Debtor not found!');
//         return;
//     }

//     if (isNaN(amount) || amount <= 0) {
//         alert('Please enter a valid payment amount!');
//         return;
//     }

//     try {
//         if (selectedTransactionIndex === 'all') {
//             if (amount > debtor.totalDebt) {
//                 alert('Payment amount cannot exceed total debt!');
//                 return;
//             }
//             await processPayment(debtor, amount, 'All Transactions');
//         } else {
//             const transaction = debtor.transactions[selectedTransactionIndex];
//             const remaining = transaction.total - (transaction.paid || 0);
//             if (amount > remaining) {
//                 alert('Payment amount cannot exceed the remaining transaction balance!');
//                 return;
//             }
//             await processPayment(debtor, amount, `Transaction ${parseInt(selectedTransactionIndex) + 1}`, selectedTransactionIndex);
//         }
//         alert('Payment processed successfully!');
//     } catch (error) {
//         console.error('Payment error:', error);
//         alert(`Failed to process payment: ${error.message}`);
//     } finally {
//         // Ensure modal closes and state resets regardless of success or failure
//         closeAllModals();
//         amountInput.value = '';
//         renderDebtors();
//         if (document.getElementById('payment-history-modal').style.display === 'block') {
//             loadPaymentHistory(selectedDebtorId);
//         }
//         updateDashboard();
//     }
// });

// function toggleSidebar() {
//     console.log('Toggling sidebar');
//     const sidebar = document.querySelector('.sidebar');
//     if (sidebar) {
//         sidebar.classList.toggle('active');
//         console.log('Sidebar toggled:', sidebar.classList.contains('active'));
//     } else {
//         console.error('Sidebar element not found');
//     }
// }

// function closeAllModals() {
//     selectedDebtorId = null;
//     selectedProductIndex = null; // Note: should be selectedTransactionIndex in your code

//     document.querySelectorAll('.modal').forEach(modal => {
//         modal.style.display = 'none';
//     });

//     const paymentAmount = document.getElementById('payment-amount');
//     if (paymentAmount) paymentAmount.value = '';

//     // Reset modal sections to initial state
//     const productSelection = document.getElementById('product-selection');
//     const paymentAmountInput = document.getElementById('payment-amount-input');
//     if (productSelection) productSelection.style.display = 'none';
//     if (paymentAmountInput) paymentAmountInput.style.display = 'none';

//     // Clear product choices to ensure fresh generation
//     const productChoices = document.getElementById('payment-product-choices');
//     if (productChoices) productChoices.innerHTML = '';
// }

// document.querySelectorAll('.close-modal').forEach(closeBtn => {
//     closeBtn.addEventListener('click', () => {
//         selectedDebtorId = null;
//         selectedProductIndex = null;
//     });
// });

// function attachDebtorSelectionListeners() {
//     const debtorEntries = document.querySelectorAll('.debtor-entry');
//     debtorEntries.forEach(entry => {
//         entry.addEventListener('click', (event) => {
//             document.querySelectorAll('.debtor-entry').forEach(d => d.classList.remove('selected'));
//             event.currentTarget.classList.add('selected');
//             selectedDebtorId = event.currentTarget.getAttribute('data-debtor-id');
//         });
//     });
// }

// function getFirebaseInstance() {
//     if (window.firebaseInstance) {
//         return window.firebaseInstance;
//     }
    
//     if (typeof firebase === 'undefined') {
//         console.warn('Firebase SDK not loaded - using localStorage fallback');
//         return createLocalStorageInstance();
//     }

//     if (!firebase.apps || !Array.isArray(firebase.apps)) {
//         console.warn('Firebase apps not initialized - using localStorage fallback');
//         return createLocalStorageInstance();
//     }

//     try {
//         const app = firebase.apps[0];
//         if (!app) {
//             console.warn('No Firebase app available - using localStorage fallback');
//             return createLocalStorageInstance();
//         }

//         const db = app.database();
//         if (!db) {
//             throw new Error('Could not initialize Firebase database');
//         }

//         window.firebaseInstance = {
//             database: db,
//             ref: (path) => db.ref(path),
//             get: (ref) => ref.once('value'),
//             set: (ref, data) => ref.set(data),
//             update: (ref, data) => ref.update(data),
//             push: (ref, data) => ref.push(data),
//             remove: (ref) => ref.remove()
//         };
        
//         return window.firebaseInstance;
//     } catch (error) {
//         console.error('Error initializing Firebase:', error);
//         return createLocalStorageInstance();
//     }
// }

// function createLocalStorageInstance() {
//     return {
//         database: null,
//         ref: (path) => ({ path }),
//         get: async (ref) => {
//             try {
//                 const data = localStorage.getItem(`debt_tracker_${ref.path}`);
//                 return {
//                     exists: () => data !== null,
//                     val: () => data ? JSON.parse(data) : null,
//                     forEach: (callback) => {
//                         if (!data) return;
//                         const items = JSON.parse(data);
//                         Object.keys(items || {}).forEach(key => {
//                             callback({
//                                 key,
//                                 val: () => items[key],
//                                 exists: () => true
//                             });
//                         });
//                     }
//                 };
//             } catch (error) {
//                 console.error("Local storage error:", error);
//                 return { exists: () => false, val: () => null, forEach: () => {} };
//             }
//         },
//         set: (ref, data) => {
//             try {
//                 localStorage.setItem(`debt_tracker_${ref.path}`, JSON.stringify(data));
//                 return Promise.resolve();
//             } catch (error) {
//                 console.error("Local storage error:", error);
//                 return Promise.reject(error);
//             }
//         },
//         update: (ref, data) => {
//             try {
//                 const existingData = localStorage.getItem(`debt_tracker_${ref.path}`);
//                 const parsedData = existingData ? JSON.parse(existingData) : {};
//                 const updatedData = { ...parsedData, ...data };
//                 localStorage.setItem(`debt_tracker_${ref.path}`, JSON.stringify(updatedData));
//                 return Promise.resolve();
//             } catch (error) {
//                 console.error("Local storage error:", error);
//                 return Promise.reject(error);
//             }
//         },
//         push: (ref, data) => {
//             try {
//                 const existingData = localStorage.getItem(`debt_tracker_${ref.path}`);
//                 const parsedData = existingData ? JSON.parse(existingData) : {};
//                 const newKey = 'key_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
//                 parsedData[newKey] = data;
//                 localStorage.setItem(`debt_tracker_${ref.path}`, JSON.stringify(parsedData));
//                 return { key: newKey };
//             } catch (error) {
//                 console.error("Local storage error:", error);
//                 return { key: null };
//             }
//         },
//         remove: (ref) => {
//             try {
//                 localStorage.removeItem(`debt_tracker_${ref.path}`);
//                 return Promise.resolve();
//             } catch (error) {
//                 console.error("Local storage error:", error);
//                 return Promise.reject(error);
//             }
//         }
//     };
// }

// async function loadDebtorsAndUpdateDashboard() {
//     if (isLoadingData) {
//         console.log("Already loading data, skipping...");
//         return;
//     }
    
//     isLoadingData = true;
//     try {
//         const firebase = getFirebaseInstance();
//         if (!firebase) {
//             throw new Error("Could not get Firebase instance");
//         }

//         const debtorsRef = firebase.ref('debtors');
//         const snapshot = await firebase.get(debtorsRef);
        
//         let loadedDebtors = [];

//         if (snapshot && snapshot.exists()) {
//             snapshot.forEach((childSnapshot) => {
//                 const debtor = childSnapshot.val();
//                 if (debtor) {
//                     debtor.id = childSnapshot.key;
//                     loadedDebtors.push(debtor);
//                 }
//             });
//             console.log(`Loaded ${loadedDebtors.length} debtors`);
            
//             if (loadedDebtors.length > 0) {
//                 debtors = loadedDebtors;
//                 localStorage.setItem('debtors', JSON.stringify(debtors));
//             }
//         } else {
//             console.log("No debtors found in database");
//             tryLoadFromLocalStorage();
//         }

//         if (typeof updateDashboard === 'function') updateDashboard();
//         if (typeof renderDebtors === 'function') renderDebtors();
        
//     } catch (error) {
//         console.error("Error loading debtors:", error);
//         tryLoadFromLocalStorage();
//     } finally {
//         isLoadingData = false;
//     }
// }

// async function loadProducts() {
//     try {
//         if (window.firebase) {
//             const { database, ref, onValue } = window.firebase;
//             const productsRef = ref(database, 'products');
//             onValue(productsRef, (snapshot) => {
//                 products = [];
//                 snapshot.forEach((childSnapshot) => {
//                     const product = childSnapshot.val();
//                     product.id = childSnapshot.key;
//                     products.push(product);
//                 });
//                 // Sort products by stock ascending
//                 products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
//                 localStorage.setItem('products', JSON.stringify(products));
//                 if (document.getElementById('products-modal').style.display === 'block') {
//                     renderProductsWithSearch();
//                 }
//             });
//         } else {
//             const savedProducts = localStorage.getItem('products');
//             if (savedProducts) {
//                 try {
//                     products = JSON.parse(savedProducts);
//                     if (!Array.isArray(products)) {
//                         products = [];
//                     } else {
//                         // Sort products by stock ascending
//                         products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
//                     }
//                 } catch (error) {
//                     console.error('Error parsing products from local storage:', error);
//                     products = [];
//                 }
//             } else {
//                 products = [];
//             }
//             if (document.getElementById('products-modal').style.display === 'block') {
//                 renderProductsWithSearch();
//             }
//         }
//     } catch (error) {
//         console.error("Error loading products:", error);
//         products = [];
//     }
// }

// function renderProducts(productsToRender = products, isSearch = false) {
//     if (!productsList) return;
//     if (productsToRender.length === 0) {
//         productsList.innerHTML = isSearch ? '<li>No products found</li>' : '<li>No products in inventory</li>';
//     } else {
//         productsList.innerHTML = productsToRender.map(product => `
//             <li>
//                 <span class="${product.stock <= 5 ? 'low-stock' : ''}">
//                     ${product.name} - ₱${product.price.toFixed(2)} - Stock: ${product.stock || 0}
//                 </span>
//                 ${isAdmin() ? `
//                     <button class="edit-product-btn" data-product-id="${product.id}">
//                         <i class="fas fa-edit"></i> Edit
//                     </button>
//                     <button class="delete-product-btn" data-product-id="${product.id}">
//                         <i class="fas fa-trash"></i> Delete
//                     </button>
//                 ` : ''}
//             </li>
//         `).join('');
//     }
// }

// function renderProductsWithSearch() {
//     const searchTerm = document.getElementById('product-search').value.trim().toLowerCase();
//     const filteredProducts = products.filter(product => 
//         product.name && typeof product.name === 'string' && product.name.toLowerCase().includes(searchTerm)
//     );
//     renderProducts(filteredProducts, searchTerm !== '');
// }

// function debounce(func, wait) {
//     let timeout;
//     return function executedFunction(...args) {
//         const later = () => {
//             clearTimeout(timeout);
//             func(...args);
//         };
//         clearTimeout(timeout);
//         timeout = setTimeout(later, wait);
//     };
// }

// async function handleProductFormSubmit(e) {
//     e.preventDefault();

//     if (!isAdmin()) {
//         alert('Only admin can add or edit products.');
//         return;
//     }

//     const formMode = e.target.dataset.mode;
//     const name = document.getElementById('inventory-product-name').value.trim();
//     const price = parseFloat(document.getElementById('inventory-product-price').value);
//     const stock = parseInt(document.getElementById('inventory-product-stock').value, 10);

//     if (!name || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
//         alert('Please enter a valid product name, price, and stock.');
//         return;
//     }

//     try {
//         if (formMode === 'add') {
//             if (products.some(p => p.name.toLowerCase() === name.toLowerCase())) {
//                 alert('A product with this name already exists.');
//                 return;
//             }
//             await saveProduct({ name, price, stock });
//         } else if (formMode === 'edit') {
//             const productId = e.target.dataset.productId;
//             await updateProduct({ id: productId, name, price, stock });
//         }

//         const form = document.getElementById('inventory-product-form');
//         form.reset();
//         form.dataset.mode = 'add';
//         delete form.dataset.productId;
//         document.getElementById('inventory-product-form-title').textContent = 'Add Product';
//         alert('Product saved successfully!');
//     } catch (error) {
//         console.error('Error saving product:', error);
//         alert('Failed to save product. Please try again.');
//     }
// }

// function handleProductNameBlur(e) {
//     if (e.target.classList.contains('product-name')) {
//         const name = e.target.value.trim();
//         const product = products.find(p => p.name.toLowerCase() === name.toLowerCase());
//         if (product) {
//             const priceInput = e.target.closest('.product-entry').querySelector('.product-price');
//             if (priceInput) priceInput.value = product.price.toFixed(2);
//         }
//     }
// }

// function tryLoadFromLocalStorage() {
//     try {
//         const savedDebtors = localStorage.getItem('debtors');
//         if (savedDebtors) {
//             if (!debtors || debtors.length === 0) {
//                 debtors = JSON.parse(savedDebtors);
//                 console.log("Loaded debtors from localStorage");
//             }
//         }
//     } catch (error) {
//         console.error("Error loading from localStorage:", error);
//     }
    
//     if (typeof renderDebtors === 'function') {
//         updateDashboard();
//         renderDebtors();
//     } else {
//         console.error('renderDebtors is not available');
//     }
// }

// function initializeUIElements() {
//     const dashboardBtn = document.getElementById('dashboard-btn');
//     const dashboardBackBtn = document.getElementById('dashboard-back-btn');
//     const dashboard = document.getElementById('dashboard');
//     const mainContainer = document.getElementById('main-container');
    
//     if (dashboardBtn && dashboard && mainContainer) {
//         dashboardBtn.addEventListener('click', function() {
//             dashboard.style.display = 'block';
//             mainContainer.style.display = 'none';
//             loadDebtorsAndUpdateDashboard();
//         });
//     }
// }

// function updateDashboard() {
//     console.log("Updating dashboard with", debtors.length, "debtors");

//     const totals = debtors.reduce((acc, debtor) => {
//         acc.totalDebt += (debtor.totalDebt || 0);
//         if (debtor.payments && Array.isArray(debtor.payments)) {
//             acc.totalPayments += debtor.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
//         }
//         return acc;
//     }, { totalDebt: 0, totalPayments: 0 });

//     updateElement('total-debt', `₱${totals.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
//     updateElement('total-debtors', debtors.length);
//     updateElement('total-payments', `₱${totals.totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

//     updateRecentTransactions();
//     updateTopDebtors();

//     if (document.getElementById('dashboard').style.display !== 'none') {
//         updateDashboardCharts();
//     }
// }

// function updateDashboardCharts() {
//     const topDebtors = [...debtors]
//         .sort((a, b) => (b.totalDebt || 0) - (a.totalDebt || 0))
//         .slice(0, 5);
//     const debtLabels = topDebtors.map(d => `${d.name} (₱${d.totalDebt.toFixed(2)})`);
//     const debtData = topDebtors.map(d => d.totalDebt);

//     if (debtDistributionChart) {
//         debtDistributionChart.data.labels = debtLabels;
//         debtDistributionChart.data.datasets[0].data = debtData;
//         debtDistributionChart.update();
//     } else {
//         const ctx = document.getElementById('debt-distribution-chart').getContext('2d');
//         debtDistributionChart = new Chart(ctx, {
//             type: 'pie',
//             data: {
//                 labels: debtLabels,
//                 datasets: [{
//                     data: debtData,
//                     backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
//                 }]
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: { legend: { position: 'right' }, title: { display: true, text: 'Top 5 Debtors' } }
//             }
//         });
//     }

//     const paymentsByMonth = {};
//     debtors.forEach(debtor => {
//         if (debtor.payments && Array.isArray(debtor.payments)) {
//             debtor.payments.forEach(payment => {
//                 const date = new Date(payment.timestamp);
//                 const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
//                 paymentsByMonth[monthYear] = (paymentsByMonth[monthYear] || 0) + (payment.amount || 0);
//             });
//         }
//     });
//     const months = Object.keys(paymentsByMonth).sort((a, b) => {
//         const [ma, ya] = a.split('/').map(Number);
//         const [mb, yb] = b.split('/').map(Number);
//         return ya - yb || ma - mb;
//     });
//     const paymentValues = months.map(month => paymentsByMonth[month]);

//     if (paymentTrendsChart) {
//         paymentTrendsChart.data.labels = months;
//         paymentTrendsChart.data.datasets[0].data = paymentValues;
//         paymentTrendsChart.update();
//     } else {
//         const ctx = document.getElementById('payment-trends-chart').getContext('2d');
//         paymentTrendsChart = new Chart(ctx, {
//             type: 'line',
//             data: {
//                 labels: months,
//                 datasets: [{
//                     label: 'Payments Received',
//                     data: paymentValues,
//                     borderColor: '#36A2EB',
//                     backgroundColor: 'rgba(54, 162, 235, 0.1)',
//                     fill: true
//                 }]
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 scales: { y: { beginAtZero: true, ticks: { callback: v => `₱${v.toFixed(2)}` } } },
//                 plugins: { title: { display: true, text: 'Monthly Payment' } }
//             }
//         });
//     }
// }

// function updateElement(elementId, value) {
//     const element = document.getElementById(elementId);
//     if (element) {
//         element.textContent = value;
//     }
// }

// function updateRecentTransactions() {
//     const recentTransactionsList = document.getElementById('recent-transactions-list');
//     if (!recentTransactionsList) return;

//     // Get payment transactions
//     const paymentTransactions = debtors.flatMap(debtor => 
//         (debtor.payments || []).map(payment => ({
//             type: 'Payment',
//             debtorName: debtor.name,
//             amount: payment.amount,
//             timestamp: payment.timestamp
//         }))
//     );

//     // Get reminder transactions from sentReminders
//     const reminderTransactions = sentReminders.map(reminder => ({
//         type: 'Reminder',
//         debtorName: reminder.debtorName,
//         timestamp: reminder.timestamp
//     }));

//     // Combine and sort by timestamp descending
//     const allTransactions = [...paymentTransactions, ...reminderTransactions]
//         .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

//     // Get top 5
//     const recentTransactions = allTransactions.slice(0, 5);

//     recentTransactionsList.innerHTML = recentTransactions.length ?
//         recentTransactions.map(transaction => `
//             <li>
//                 <div class="transaction-item">
//                     <span>${transaction.type}: ${transaction.debtorName}</span>
//                     ${transaction.amount ? `<span>₱${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>` : ''}
//                     <span>${new Date(transaction.timestamp || Date.now()).toLocaleDateString()}</span>
//                 </div>
//             </li>
//         `).join('') :
//         '<li>No recent transactions</li>';
// }

// function updateTopDebtors() {
//     const topDebtorsList = document.getElementById('top-debtors-list');
//     if (!topDebtorsList) return;

//     const currentDate = new Date().getTime();

//     const debtorsWithOverdue = debtors
//         .map(debtor => {
//             const overdueAmount = (debtor.transactions || []).reduce((sum, transaction) => {
//                 const remainingBalance = transaction.total - (transaction.paid || 0);
//                 if (transaction.dueDate && transaction.dueDate < currentDate && remainingBalance > 0) {
//                     return sum + remainingBalance;
//                 }
//                 return sum;
//             }, 0);
//             return { name: debtor.name, overdueAmount };
//         })
//         .filter(debtor => debtor.overdueAmount > 0)
//         .sort((a, b) => b.overdueAmount - a.overdueAmount)
//         .slice(0, 5);

//     topDebtorsList.innerHTML = debtorsWithOverdue.length ?
//         debtorsWithOverdue.map(debtor => `
//             <li>
//                 <div class="debtor-item">
//                     <span>${debtor.name} - ₱${debtor.overdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} overdue</span>
//                 </div>
//             </li>
//         `).join('') :
//         '<li>No debtors with overdue amounts</li>';
// }

// async function deleteDebtor(debtorId) {
//     const debtorIndex = debtors.findIndex(d => d.id === debtorId);
//     if (debtorIndex === -1) return;

//     const debtor = debtors[debtorIndex];
//     if (confirm) {
//         try {
//             const debtorCopy = JSON.parse(JSON.stringify(debtor));
//             debtorCopy.archivedAt = Date.now();
//             archivedDebtors.push(debtorCopy);
//             localStorage.setItem('archivedDebtors', JSON.stringify(archivedDebtors));

//             if (window.firebase) {
//                 const { database, ref, remove } = window.firebase;
//                 const debtorRef = ref(database, `debtors/${debtorId}`);
//                 await remove(debtorRef);
//             }

//             debtors.splice(debtorIndex, 1);
//             localStorage.setItem('debtors', JSON.stringify(debtors));
//             renderDebtors();
//             updateDashboard();
//         } catch (error) {
//             console.error("Error deleting debtor:", error);
//         }
//     }
// }

// function createCharts(debtCanvas, paymentsCanvas) {
//     const topDebtors = debtors.sort((a, b) => b.totalDebt - a.totalDebt).slice(0, 5);
//     new Chart(debtCanvas.getContext('2d'), {
//         type: 'pie',
//         data: {
//             labels: topDebtors.map(d => d.name),
//             datasets: [{ data: topDebtors.map(d => d.totalDebt), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }]
//         },
//         options: { responsive: true, maintainAspectRatio: false }
//     });

//     const paymentsByMonth = debtors.reduce((acc, d) => {
//         if (d.payments) {
//             d.payments.forEach(p => {
//                 const month = new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
//                 acc[month] = (acc[month] || 0) + p.amount;
//             });
//         }
//         return acc;
//     }, {});
//     new Chart(paymentsCanvas.getContext('2d'), {
//         type: 'line',
//         data: {
//             labels: Object.keys(paymentsByMonth),
//             datasets: [{ label: 'Payments', data: Object.values(paymentsByMonth), borderColor: '#36A2EB', fill: false }]
//         },
//         options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
//     });
// }

// function createDebtDistributionChart() {
//     const canvas = document.getElementById('debt-distribution-chart');
//     if (!canvas) return;

//     if (debtDistributionChart) {
//         debtDistributionChart.destroy();
//         debtDistributionChart = null;
//     }

//     const ctx = canvas.getContext('2d');
    
//     const topDebtors = [...debtors]
//         .sort((a, b) => (b.totalDebt || 0) - (a.totalDebt || 0))
//         .slice(0, 5);

//     const debtLabels = topDebtors.map(d => `${d.name} (₱${d.totalDebt.toFixed(2)})`);
//     const debtData = topDebtors.map(d => d.totalDebt);

//     debtDistributionChart = new Chart(ctx, {
//         type: 'pie',
//         data: {
//             labels: debtLabels,
//             datasets: [{
//                 data: debtData,
//                 backgroundColor: [
//                     '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
//                 ]
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     position: 'right',
//                     labels: {
//                         boxWidth: 20,
//                         padding: 15,
//                         font: {
//                             size: 12
//                         }
//                     }
//                 },
//                 title: {
//                     display: true,
//                     text: 'Top 5 Debtors by Total Debt',
//                     font: {
//                         size: 16
//                     }
//                 }
//             }
//         }
//     });
// }

// function createPaymentTrendsChart() {
//     const canvas = document.getElementById('payment-trends-chart');
//     if (!canvas) return;

//     if (paymentTrendsChart) {
//         paymentTrendsChart.destroy();
//         paymentTrendsChart = null;
//     }

//     const ctx = canvas.getContext('2d');
//     const paymentsByMonth = {};

//     debtors.forEach(debtor => {
//         if (debtor.payments && Array.isArray(debtor.payments)) {
//             debtor.payments.forEach(payment => {
//                 const date = new Date(payment.timestamp);
//                 const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
//                 paymentsByMonth[monthYear] = (paymentsByMonth[monthYear] || 0) + (payment.amount || 0);
//             });
//         }
//     });

//     const months = Object.keys(paymentsByMonth).sort((a, b) => {
//         const [monthA, yearA] = a.split('/').map(Number);
//         const [monthB, yearB] = b.split('/').map(Number);
//         return yearA - yearB || monthA - monthB;
//     });

//     const paymentValues = months.map(month => paymentsByMonth[month]);

//     paymentTrendsChart = new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: months,
//             datasets: [{
//                 label: 'Payments Received',
//                 data: paymentValues,
//                 borderColor: '#36A2EB',
//                 backgroundColor: 'rgba(54, 162, 235, 0.1)',
//                 borderWidth: 2,
//                 fill: true,
//                 tension: 0.4
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 title: {
//                     display: true,
//                     text: 'Monthly Payment'
//                 }
//             },
//             scales: {
//                 y: {
//                     beginAtZero: true,
//                     ticks: {
//                         callback: function(value) {
//                             return '₱' + value.toFixed(2);
//                         }
//                     }
//                 }
//             }
//         }
//     });
// }

// function closeDashboard() {
//     if (debtDistributionChart) {
//         debtDistributionChart.destroy();
//         debtDistributionChart = null;
//     }
//     if (paymentTrendsChart) {
//         paymentTrendsChart.destroy();
//         paymentTrendsChart = null;
//     }
    
//     document.getElementById('dashboard').style.display = 'none';
//     document.getElementById('main-container').style.display = 'block';
// }

// function initializePaymentTrendsChart() {
//     const canvas = document.getElementById('payment-trends-chart');
//     if (!canvas) return;

//     const ctx = canvas.getContext('2d');
    
//     const paymentsByMonth = {};
//     debtors.forEach(debtor => {
//         if (debtor.payments && Array.isArray(debtor.payments)) {
//             debtor.payments.forEach(payment => {
//                 const date = new Date(payment.timestamp);
//                 const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
//                 paymentsByMonth[monthYear] = (paymentsByMonth[monthYear] || 0) + (payment.amount || 0);
//             });
//         }
//     });

//     const months = Object.keys(paymentsByMonth).sort((a, b) => {
//         const [monthA, yearA] = a.split('/').map(Number);
//         const [monthB, yearB] = b.split('/').map(Number);
//         return yearA - yearB || monthA - monthB;
//     });

//     const paymentValues = months.map(month => paymentsByMonth[month]);

//     if (window.paymentTrendsChart) {
//         window.paymentTrendsChart.destroy();
//     }

//     window.paymentTrendsChart = new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: months,
//             datasets: [{
//                 label: 'Payments Received',
//                 data: paymentValues,
//                 borderColor: '#36A2EB',
//                 backgroundColor: 'rgba(54, 162, 235, 0.1)',
//                 borderWidth: 2,
//                 fill: true,
//                 tension: 0.4
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 title: {
//                     display: true,
//                     text: 'Monthly Payment'
//                 }
//             },
//             scales: {
//                 y: {
//                     beginAtZero: true,
//                     ticks: {
//                         callback: function(value) {
//                             return '₱' + value.toFixed(2);
//                         }
//                     }
//                 }
//             }
//         }
//     });
// }

// // Function to view archived debtors
// function viewArchive() {
//     const archiveList = document.getElementById('archive-list');
//     archiveList.innerHTML = '';
//     const savedArchived = localStorage.getItem('archivedDebtors');
//     if (savedArchived) archivedDebtors = JSON.parse(savedArchived);

//     if (archivedDebtors.length === 0) {
//         archiveList.innerHTML = '<li class="empty-state">No archived debtors</li>';
//     } else {
//         // Sort archived debtors by archivedAt in descending order
//         const sortedArchived = [...archivedDebtors].sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
//         sortedArchived.forEach((debtor) => {
//             const li = document.createElement('li');
//             li.innerHTML = `
//                 <div class="archived-debtor">
//                     <div class="debtor-header">
//                         <strong>${debtor.name}</strong>
//                         <div class="button-group">
//                             <button class="restore-btn" data-debtor-id="${debtor.id}">
//                                 <i class="fas fa-undo"></i> Restore
//                             </button>
//                             <button class="delete-permanent-btn" data-debtor-id="${debtor.id}">
//                                 <i class="fas fa-trash"></i> Delete Permanently
//                             </button>
//                         </div>
//                     </div>
//                     <div>Contact: ${debtor.contact}</div>
//                     <div>Total Debt: ₱${(debtor.totalDebt || 0).toFixed(2)}</div>
//                     <div>Archived on: ${new Date(debtor.archivedAt).toLocaleString()}</div>
//                 </div>
//             `;
//             archiveList.appendChild(li);
//         });
//     }

//     // Attach event listeners using debtor id
//     document.querySelectorAll('.restore-btn').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             e.stopPropagation();
//             const debtorId = btn.getAttribute('data-debtor-id');
//             restoreDebtor(debtorId);
//         });
//     });

//     document.querySelectorAll('.delete-permanent-btn').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             e.stopPropagation();
//             const debtorId = btn.getAttribute('data-debtor-id');
//             deletePermanently(debtorId);
//         });
//     });

//     document.getElementById('archive-modal').style.display = 'block';
// }

// // Function to permanently delete a debtor using debtor id
// function deletePermanently(debtorId) {
//     const index = archivedDebtors.findIndex(d => d.id === debtorId);
//     if (index === -1) {
//         alert('Debtor not found');
//         return;
//     }
//     const debtor = archivedDebtors[index];
//     if (confirm(`Are you sure you want to permanently delete ${debtor.name}?`)) {
//         archivedDebtors.splice(index, 1);
//         localStorage.setItem('archivedDebtors', JSON.stringify(archivedDebtors));
//         viewArchive();
//         alert(`${debtor.name} has been permanently deleted`);
//     }
// }

// function viewSentReminders() {
//     const remindersList = document.getElementById('sent-reminders-list');
//     remindersList.innerHTML = '';
    
//     const savedReminders = localStorage.getItem('sentReminders');
//     if (savedReminders) sentReminders = JSON.parse(savedReminders);
    
//     // Ensure each reminder has an ID
//     sentReminders.forEach(reminder => {
//         if (!reminder.id) {
//             reminder.id = 'reminder_' + reminder.timestamp + '_' + Math.random().toString(36).substr(2, 9);
//         }
//     });
    
//     if (sentReminders.length === 0) {
//         remindersList.innerHTML = '<li class="empty-state">No sent reminders</li>';
//     } else {
//         sentReminders.forEach((reminder, index) => {
//             const li = document.createElement('li');
//             li.innerHTML = `
//                 <div class="reminder-item">
//                     <div class="reminder-header">
//                         <strong>To: ${reminder.debtorName}</strong>
//                         <span class="reminder-status ${reminder.status}">
//                             ${reminder.status.toUpperCase()}
//                         </span>
//                     </div>
//                     <div>Contact: ${reminder.contact}</div>
//                     <div>Amount: ₱${reminder.amount.toFixed(2)}</div>
//                     <div>Sent: ${new Date(reminder.timestamp).toLocaleString()}</div>
//                     <div class="reminder-message">${reminder.message}</div>
//                     ${reminder.status === 'failure' ? 
//                         `<div class="reminder-error">Error: ${reminder.error || 'Unknown error'}</div>` : ''}
//                     <button class="delete-reminder-btn" data-id="${reminder.id}">
//                         <i class="fas fa-trash"></i> Delete
//                     </button>
//                 </div>
//             `;
//             remindersList.appendChild(li);
//         });
        
//         // Attach event listeners to delete buttons
//         document.querySelectorAll('.delete-reminder-btn').forEach(btn => {
//             btn.addEventListener('click', (e) => {
//                 const id = e.target.closest('.delete-reminder-btn').getAttribute('data-id');
//                 deleteReminder(id);
//             });
//         });
//     }
    
//     document.getElementById('sent-reminders-modal').style.display = 'block';
// }

// function deleteReminder(id) {
//     const index = sentReminders.findIndex(r => r.id === id);
//     if (index === -1) {
//         alert('Reminder not found');
//         return;
//     }
//     if (confirm('Are you sure you want to delete this reminder?')) {
//         sentReminders.splice(index, 1);
//         localStorage.setItem('sentReminders', JSON.stringify(sentReminders));
//         viewSentReminders(); // Refresh the list
//     }
// }

// // Updated remindDebtor function
// async function remindDebtor(debtor, automatic = false) {
//     const currentDate = new Date().getTime();
//     const overdueTransactions = debtor.transactions.filter(t => 
//         t.dueDate && t.dueDate < currentDate && (t.total - (t.paid || 0)) > 0
//     );
    
//     if (overdueTransactions.length === 0) {
//         if (!automatic) alert('No overdue transactions to remind about!');
//         return;
//     }

//     const totalOverdue = overdueTransactions.reduce((sum, t) => sum + (t.total - (t.paid || 0)), 0);
    
//     // Build detailed transaction list with products
//     const transactionDetails = overdueTransactions.map(t => {
//         const productsList = t.products.map(product => 
//             `  • ${product.name} (${product.quantity}x ₱${product.price.toFixed(2)} = ₱${product.total.toFixed(2)})`
//         ).join('\n');
        
//         return `- Ref: ${t.referenceNumber}
//   Due: ${new Date(t.dueDate).toLocaleDateString('en-PH')}
//   Remaining: ₱${(t.total - (t.paid || 0)).toFixed(2)}
//   Products:
// ${productsList}`;
//     }).join('\n\n');

//     const message = `[K&J Store] Overdue Reminder
// Hi ${debtor.name},
// You have ${overdueTransactions.length} overdue transaction(s) totaling ₱${totalOverdue.toFixed(2)}:

// ${transactionDetails}

// Your total debt is ₱${debtor.totalDebt.toFixed(2)}.
// Please settle this soon. Contact us if needed.`;

//     const reminder = {
//         id: 'reminder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
//         debtorId: debtor.id,
//         debtorName: debtor.name,
//         contact: debtor.contact,
//         amount: totalOverdue,
//         message: message,
//         timestamp: Date.now(),
//         status: 'pending'
//     };

//     try {
//         await sendReminderSMS(debtor.contact, message);
//         reminder.status = 'success';
//         if (!automatic) alert('Reminder sent successfully!');
//     } catch (error) {
//         console.error('Error sending reminder:', error);
//         reminder.status = 'failure';
//         reminder.error = error.message;
//         if (!automatic) alert('Failed to send reminder: ' + error.message);
//     } finally {
//         sentReminders.unshift(reminder);
//         localStorage.setItem('sentReminders', JSON.stringify(sentReminders));
//     }
// }

// async function logout() {
//     try {
//         const confirmed = confirm('Are you sure you want to log out?');
//         if (!confirmed) return;

//         let auth;
//         try {
//             const { getAuth } = await import("https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js");
//             auth = getAuth();
//         } catch (error) {
//             console.warn('Firebase auth not available:', error);
//         }

//         if (auth) {
//             await auth.signOut();
//         }

//         localStorage.removeItem('currentUser');
//         localStorage.removeItem('debtors');
        
//         debtors = [];
//         selectedDebtorId = null;
//         selectedProductIndex = null;

//         window.location.href = 'index.html';
//     } catch (error) {
//         console.error('Error during logout:', error);
//         alert('An error occurred during logout. Please try again.');
//     }
// }

// async function saveDebtor(newDebtor) {
//     console.log("saveDebtor called with:", newDebtor);

//     if (!newDebtor.id) {
//         newDebtor.id = 'debtor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
//     }

//     // Ensure payments is initialized
//     newDebtor.payments = newDebtor.payments || [];

//     if (window.firebase) {
//         const { database, ref, push, set } = window.firebase;
//         const debtorsRef = ref(database, 'debtors');
//         const newDebtorRef = push(debtorsRef);
//         const firebaseId = newDebtorRef.key;
//         newDebtor.id = firebaseId;
//         await set(newDebtorRef, newDebtor);
//         console.log("Saved to Firebase with ID:", firebaseId);

//         debtors.push(newDebtor);
//         debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
//         renderDebtors();
//     } else {
//         debtors.push(newDebtor);
//         localStorage.setItem('debtors', JSON.stringify(debtors));
//         console.log("Saved to localStorage with ID:", newDebtor.id);
//         renderDebtors();
//     }
// }

// async function addProductToDebtor(debtor, product) {
//     const dueDate = document.getElementById('new-product-due').value;
//     product.dueDate = dueDate ? new Date(dueDate).getTime() : null;
//     product = {
//         ...product,
//         dueDate: dueDate ? new Date(dueDate).getTime() : null
//     };

//     if (!debtor || !debtor.id) {
//         throw new Error('Invalid debtor');
//     }

//     try {
//         const dueDate = document.getElementById('new-product-due').value;
//         product = {
//             ...product,
//             dueDate: dueDate ? new Date(dueDate).getTime() : null
//         };

//         debtor.products = debtor.products || [];
//         debtor.products.push(product);
//         debtor.totalDebt = (debtor.totalDebt || 0) + product.total;

//         if (window.firebase) {
//             const { database, ref, update } = window.firebase;
//             const debtorRef = ref(database, `debtors/${debtor.id}`);
//             await update(debtorRef, {
//                 products: debtor.products,
//                 totalDebt: debtor.totalDebt
//             });
//         }
//         localStorage.setItem('debtors', JSON.stringify(debtors));
//         renderDebtors();
//         updateDashboard();
//         return true;
//     } catch (error) {
//         console.error('Error adding product:', error);
//         throw error;
//     }
// }

// async function sendReminders() {
//     if (confirm('Send reminders to all debtors with overdue transactions?')) {
//         const debtorsToRemind = debtors.filter(debtor => hasOverdueTransactions(debtor));
//         let successCount = 0;
//         alert(`Sending reminders to ${debtorsToRemind.length} debtors...`);
//         for (const debtor of debtorsToRemind) {
//             try {
//                 const overdueTransactions = getOverdueTransactions(debtor);
//                 const totalOverdue = calculateTotalOverdue(overdueTransactions);
//                 const message = constructReminderMessage(debtor, overdueTransactions, totalOverdue);
                
//                 // Assuming sendSMS is defined elsewhere in your code
//                 await sendSMS(debtor.contact, message);
//                 successCount++;
//             } catch (error) {
//                 console.error(`Failed to send reminder to ${debtor.name}:`, error);
//             }
//         }
//         alert(`Successfully sent ${successCount} out of ${debtorsToRemind.length} reminders.`);
//     }
// }

// // Function to restore a debtor using debtor id
// async function restoreDebtor(debtorId) {
//     const index = archivedDebtors.findIndex(d => d.id === debtorId);
//     if (index === -1) return;
//     const debtorToRestore = archivedDebtors[index];
//     if (confirm(`Are you sure you want to restore ${debtorToRestore.name}?`)) {
//         try {
//             delete debtorToRestore.archivedAt;
//             debtorToRestore.createdAt = Date.now(); // Update createdAt to current time

//             if (window.firebase) {
//                 const { database, ref, push, set } = window.firebase;
//                 const debtorsRef = ref(database, 'debtors');
//                 const newDebtorRef = push(debtorsRef);
//                 const newId = newDebtorRef.key;
//                 debtorToRestore.id = newId;
//                 await set(newDebtorRef, debtorToRestore);
//             }

//             debtors.push(debtorToRestore);
//             debtors.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Sort array to place newest at top
//             archivedDebtors.splice(index, 1);

//             localStorage.setItem('archivedDebtors', JSON.stringify(archivedDebtors));
//             localStorage.setItem('debtors', JSON.stringify(debtors));
//             renderDebtors();
//             document.getElementById('archive-modal').style.display = 'none';
//             alert(`${debtorToRestore.name} has been restored`);
//         } catch (error) {
//             console.error("Error restoring debtor:", error);
//             alert("Failed to restore debtor. Please try again.");
//         }
//     }
// }

// async function migrateDueDates() {
//     const { database, ref, get, update } = window.firebase;
//     const debtorsRef = ref(database, 'debtors');
//     const snapshot = await get(debtorsRef);
//     snapshot.forEach(async (childSnapshot) => {
//         const debtor = childSnapshot.val();
//         const debtorId = childSnapshot.key;
//         if (debtor.products) {
//             debtor.products = debtor.products.map(product => ({
//                 ...product,
//                 dueDate: product.dueDate || null
//             }));
//             const debtorRef = ref(database, `debtors/${debtorId}`);
//             await update(debtorRef, { products: debtor.products });
//         }
//     });
//     console.log("Due date migration complete");
// }

// async function loadDebtors(forceRefresh = false) {
//     if (isLoadingData && !forceRefresh) return;
//     isLoadingData = true;

//     try {
//         if (window.firebase) {
//             const { database, ref, get } = window.firebase;
//             const debtorsRef = ref(database, 'debtors');
//             const snapshot = await get(debtorsRef);
            
//             debtors = [];
//             snapshot.forEach((childSnapshot) => {
//                 const debtor = childSnapshot.val();
//                 debtor.id = childSnapshot.key;
                
//                 if (debtor.products && Array.isArray(debtor.products)) {
//                     debtor.products.forEach(product => {
//                         if (product.dueDate) {
//                             product.dueDate = Number(product.dueDate);
//                         }
//                     });
//                 } else {
//                     debtor.products = [];
//                 }
                
//                 debtors.push(debtor);
//             });

//             localStorage.setItem('debtors', JSON.stringify(debtors));
//         } else {
//             const savedDebtors = localStorage.getItem('debtors');
//             if (savedDebtors) {
//                 debtors = JSON.parse(savedDebtors);
//             }
//         }
//     } catch (error) {
//         console.error("Error loading debtors:", error);
//         const savedDebtors = localStorage.getItem('debtors');
//         if (savedDebtors) {
//             debtors = JSON.parse(savedDebtors);
//         }
//     } finally {
//         isLoadingData = false;
//         renderDebtors();
//     }
// }

// async function loadCurrentUser() {
//     try {
//         const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js");
//         const auth = getAuth();
        
//         onAuthStateChanged(auth, (user) => {
//             if (user) {
//                 currentUser = user;
//                 updateProfileInfo();
//                 const createAccountBtn = document.getElementById('create-account-btn');
//                 if (createAccountBtn) {
//                     createAccountBtn.style.display = user.email === ADMIN_EMAIL ? 'block' : 'none';
//                 }
//             } else {
//                 currentUser = null;
//                 console.log("No user signed in");
//             }
//         });
//     } catch (error) {
//         console.error("Error loading user:", error);
//     }
// }

// // Function to update profile information in the modal
// function updateProfileInfo() {
//     if (!currentUser) return;
    
//     const emailSpan = document.getElementById('profile-email');
//     const creationDateSpan = document.getElementById('profile-creation-date');
//     const emailInput = document.getElementById('profile-email-input');
//     const nameInput = document.getElementById('profile-name');
    
//     if (emailSpan && creationDateSpan && emailInput && nameInput) {
//         emailSpan.textContent = currentUser.email || 'Not set';
//         emailInput.value = currentUser.email || '';
//         nameInput.value = currentUser.displayName || '';
        
//         if (currentUser.metadata && currentUser.metadata.creationTime) {
//             creationDateSpan.textContent = new Date(currentUser.metadata.creationTime).toLocaleDateString();
//         } else {
//             creationDateSpan.textContent = 'Unknown';
//         }
//     }
// }

// // Function to open the profile modal
// function openProfileModal() {
//     const profileModal = document.getElementById('profile-modal');
//     if (profileModal) {
//         profileModal.style.display = 'block';
//         updateProfileInfo();
//     }
// }

// async function updateProfile(e) {
//     e.preventDefault();
    
//     if (!currentUser) {
//         alert('No user logged in');
//         return;
//     }
    
//     const name = document.getElementById('profile-name').value.trim();
//     const email = document.getElementById('profile-email-input').value.trim();
//     const password = document.getElementById('profile-password').value;
    
//     try {
//         const { getAuth, updateEmail, updatePassword, updateProfile: updateUserProfile } = await import("https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js");
//         const auth = getAuth();
//         const user = auth.currentUser;
        
//         if (email && email !== user.email) {
//             await updateEmail(user, email);
//         }
        
//         if (password) {
//             await updatePassword(user, password);
//         }
        
//         if (name && name !== user.displayName) {
//             await updateUserProfile(user, { displayName: name });
//         }
        
//         alert('Profile updated successfully!');
//         loadCurrentUser();
//         closeAllModals();
//     } catch (error) {
//         console.error('Error updating profile:', error);
//         let errorMessage = 'Failed to update profile. ';
//         switch (error.code) {
//             case 'auth/requires-recent-login':
//                 errorMessage += 'Please log out and log in again.';
//                 break;
//             case 'auth/email-already-in-use':
//                 errorMessage += 'Email already in use.';
//                 break;
//             case 'auth/weak-password':
//                 errorMessage += 'Password too weak.';
//                 break;
//             default:
//                 errorMessage += error.message;
//         }
//         alert(errorMessage);
//     }
// }

// function openAddAccountModal() {
//     if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
//         alert('Only admin can create new accounts');
//         return;
//     }
//     document.getElementById('profile-modal').style.display = 'none';
//     document.getElementById('add-account-modal').style.display = 'block';
// }

// function checkPasswordMatch() {
//     const password = document.getElementById('new-account-password').value;
//     const confirmPassword = document.getElementById('new-account-confirm-password').value;
//     const messageElement = document.createElement('div');
    
//     const existingMessage = document.querySelector('.password-match, .password-mismatch');
//     if (existingMessage) existingMessage.remove();
    
//     if (password && confirmPassword) {
//         messageElement.className = password === confirmPassword ? 'password-match' : 'password-mismatch';
//         messageElement.textContent = password === confirmPassword ? 'Passwords match!' : 'Passwords do not match!';
//         document.getElementById('new-account-confirm-password').after(messageElement);
//     }
// }

// async function createNewAccount(e) {
//     e.preventDefault();
    
//     if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
//         alert('Only admin can create new accounts');
//         return;
//     }
    
//     const name = document.getElementById('new-account-name').value.trim();
//     const email = document.getElementById('new-account-email').value.trim();
//     const password = document.getElementById('new-account-password').value;
//     const confirmPassword = document.getElementById('new-account-confirm-password').value;
    
//     if (!name || !email || !password) {
//         alert('Please fill in all fields');
//         return;
//     }
    
//     if (password !== confirmPassword) {
//         alert('Passwords do not match');
//         return;
//     }
    
//     try {
//         const { getAuth, createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js");
//         const auth = getAuth();
        
//         const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//         const { updateProfile } = await import("https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js");
//         await updateProfile(userCredential.user, { displayName: name });
        
//         alert('Account created successfully!');
//         document.getElementById('add-account-form').reset();
//         closeAllModals();
//     } catch (error) {
//         console.error('Error creating account:', error);
//         let errorMessage = 'Failed to create account. ';
//         switch (error.code) {
//             case 'auth/email-already-in-use':
//                 errorMessage += 'Email already in use.';
//                 break;
//             case 'auth/invalid-email':
//                 errorMessage += 'Invalid email.';
//                 break;
//             case 'auth/weak-password':
//                 errorMessage += 'Password too weak (minimum 6 characters).';
//                 break;
//             default:
//                 errorMessage += error.message;
//         }
//         alert(errorMessage);
//     }
// }

// // Process Payment Function
// async function processPayment(debtor, amount, transactionName, transactionIndex = null) {
//     if (!debtor || !debtor.id) {
//         throw new Error('Invalid debtor data');
//     }

//     try {
//         const timestamp = Date.now();
//         const date = new Date(timestamp);
//         const randomComponent = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//         const reference = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}-${randomComponent}`;

//         let transactionId = 'all';
//         let transaction = null;
//         let paymentHistory = [];
//         let paymentDistribution = []; // New array to track distribution

//         debtor.payments = debtor.payments || [];

//         if (transactionIndex !== null) {
//             transaction = debtor.transactions[transactionIndex];
//             transactionId = transaction.id;
//             paymentHistory = debtor.payments.filter(p => p.transactionId === transactionId);
//         } else {
//             paymentHistory = debtor.payments;
//         }

//         const payment = {
//             amount: amount,
//             transaction: transactionName,
//             transactionId: transactionId,
//             timestamp: timestamp,
//             reference: reference
//         };

//         debtor.payments.push(payment);

//         if (transactionIndex === null) {
//             let remainingAmount = amount;
//             for (let i = 0; i < debtor.transactions.length && remainingAmount > 0; i++) {
//                 const trans = debtor.transactions[i];
//                 const unpaid = trans.total - (trans.paid || 0);
//                 if (unpaid > 0) {
//                     const paymentToApply = Math.min(remainingAmount, unpaid);
//                     trans.paid = (trans.paid || 0) + paymentToApply;
//                     remainingAmount -= paymentToApply;
//                     paymentDistribution.push({ transaction: trans, amountApplied: paymentToApply });
//                 }
//             }
//             debtor.totalDebt -= amount;
//             if (debtor.totalDebt < 0) debtor.totalDebt = 0;
//         } else {
//             transaction.paid = (transaction.paid || 0) + amount;
//             debtor.totalDebt -= amount;
//             if (debtor.totalDebt < 0) debtor.totalDebt = 0;
//         }

//         if (window.firebase) {
//             const { database, ref, update } = window.firebase;
//             const debtorRef = ref(database, `debtors/${debtor.id}`);
//             await update(debtorRef, {
//                 totalDebt: debtor.totalDebt,
//                 transactions: debtor.transactions,
//                 payments: debtor.payments
//             });
//         } else {
//             debtors = debtors.map(d => d.id === debtor.id ? debtor : d);
//             localStorage.setItem('debtors', JSON.stringify(debtors));
//         }

//         // Pass paymentDistribution when calling printReceipt for "Pay All"
//         printReceipt(debtor, amount, debtor.totalDebt, reference, transaction, paymentHistory, paymentDistribution);

//         await sendPaymentReceiptSMS(debtor.contact, debtor.name, amount, debtor.totalDebt);

//         return true;
//     } catch (error) {
//         console.error('Payment Processing Error:', error);
//         throw error;
//     }
// }

// // Print Receipt Function
// function printReceipt(debtor, paymentAmount, remainingBalance, reference, transaction = null, paymentHistory = [], paymentDistribution = null) {
//     const printWindow = window.open('receipt.html', '_blank');
//     printWindow.onload = function() {
//         const printDoc = printWindow.document;
//         const receiptBody = printDoc.querySelector('.receipt');

//         // General receipt information
//         printDoc.getElementById('debtor-name').textContent = debtor.name;
//         printDoc.getElementById('payment-amount').textContent = `₱${paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//         printDoc.getElementById('remaining-balance').textContent = `₱${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//         printDoc.getElementById('date').textContent = new Date().toLocaleString();
//         printDoc.getElementById('ref-number').textContent = reference;
//         printDoc.getElementById('pos-id').textContent = currentUser && currentUser.displayName ? currentUser.displayName : 'Unknown';

//         if (transaction) {
//             // Single transaction case
//             const previousPaid = transaction.paid - paymentAmount; // Amount paid before this payment
//             const previousRemaining = transaction.total - previousPaid; // Remaining before this payment

//             // Transaction Details Section
//             const transactionDetails = printDoc.createElement('div');
//             transactionDetails.innerHTML = `
//                 <h3>Transaction Details</h3>
//                 <p><strong>Transaction ID:</strong> ${transaction.id}</p>
//                 <p><strong>Reference Number:</strong> ${transaction.referenceNumber || 'N/A'}</p>
//                 <p><strong>Date Added:</strong> ${new Date(transaction.dateAdded).toLocaleString()}</p>
//                 <p><strong>Due Date:</strong> ${transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'Not Set'}</p>
//                 <p><strong>Transaction Total:</strong> ₱${transaction.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 <h4>Before This Payment</h4>
//                 <p><strong>Previously Paid:</strong> ₱${previousPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 <p><strong>Previous Remaining Balance:</strong> ₱${previousRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 <h4>This Payment</h4>
//                 <p><strong>Current Payment:</strong> ₱${paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 <h4>After This Payment</h4>
//                 <p><strong>Total Paid to Date:</strong> ₱${transaction.paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 <p><strong>Remaining Balance:</strong> ₱${(transaction.total - transaction.paid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                 <h5>Products Purchased</h5>
//                 <ul>
//                     ${transaction.products.map(product => `
//                         <li>${product.name} - ${product.quantity}x ₱${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ₱${product.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
//                     `).join('')}
//                 </ul>
//             `;
//             receiptBody.appendChild(transactionDetails);

//             // Payment History Section
//             const paymentHistorySection = printDoc.createElement('div');
//             paymentHistorySection.innerHTML = `
//                 <h3>Payment History for This Transaction</h3>
//                 <ul>
//                     ${paymentHistory.map(payment => `
//                         <li>${new Date(payment.timestamp).toLocaleString()} - ₱${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Ref: ${payment.reference})</li>
//                     `).join('')}
//                     <li>${new Date().toLocaleString()} - ₱${paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Ref: ${reference})</li>
//                 </ul>
//             `;
//             receiptBody.appendChild(paymentHistorySection);
//         } else if (paymentDistribution) {
//             // "Pay All Products" case
//             const distributionSection = printDoc.createElement('div');
//             distributionSection.innerHTML = '<h3>Payment Applied To:</h3>';
//             paymentDistribution.forEach(dist => {
//                 const trans = dist.transaction;
//                 const amountApplied = dist.amountApplied;
//                 const remainingForTransaction = trans.total - trans.paid;
//                 const status = remainingForTransaction <= 0 ? ' (Fully Paid)' : '';
//                 distributionSection.innerHTML += `
//                     <div>
//                         <h4>Transaction: ${trans.id}${status}</h4>
//                         <p><strong>Reference Number:</strong> ${trans.referenceNumber || 'N/A'}</p>
//                         <p><strong>Date Added:</strong> ${new Date(trans.dateAdded).toLocaleString()}</p>
//                         <p><strong>Due Date:</strong> ${trans.dueDate ? new Date(trans.dueDate).toLocaleDateString() : 'Not Set'}</p>
//                         <p><strong>Transaction Total:</strong> ₱${trans.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                         <p><strong>Amount Applied:</strong> ₱${amountApplied.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                         <p><strong>Total Paid:</strong> ₱${trans.paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                         <p><strong>Remaining:</strong> ₱${remainingForTransaction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                         <h5>Products</h5>
//                         <ul>
//                             ${trans.products.map(product => `
//                                 <li>${product.name} - ${product.quantity}x ₱${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ₱${product.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
//                             `).join('')}
//                         </ul>
//                     </div>
//                 `;
//             });
//             receiptBody.appendChild(distributionSection);

//             // Current Payment Section
//             const paymentSection = printDoc.createElement('div');
//             paymentSection.innerHTML = `
//                 <h3>This Payment</h3>
//                 <ul>
//                     <li>${new Date().toLocaleString()} - ₱${paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Ref: ${reference})</li>
//                 </ul>
//             `;
//             receiptBody.appendChild(paymentSection);
//         }

//         printWindow.print();
//     };
// }

// function displayPaymentItem(payment, index, listElement) {
//     if (!payment) return;
    
//     const li = document.createElement('li');
//     li.innerHTML = `
//         <div class="payment-item">
//             <span>Reference: ${payment.reference || 'N/A'}</span>
//             <span>Payment For: ${payment.transaction || 'Unknown'}</span>
//             <span>Amount: ₱${payment.amount ? payment.amount.toFixed(2) : '0.00'}</span>
//             <span>Date: ${payment.timestamp ? new Date(payment.timestamp).toLocaleString() : 'Unknown'}</span>
//         </div>
//     `;
//     listElement.appendChild(li);
// }

// // Print Debtor Record Function
// function printDebtorRecord(debtor, transactionsToPrint = null) {
//     if (!transactionsToPrint) {
//         transactionsToPrint = debtor.transactions;
//     }

//     const printWindow = window.open('record.html', '_blank');
//     printWindow.onload = function() {
//         const printDoc = printWindow.document;

//         printDoc.getElementById('debtor-name').textContent = debtor.name;
//         printDoc.getElementById('debtor-contact').textContent = debtor.contact;
//         printDoc.getElementById('total-debt').textContent = `₱${debtor.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//         printDoc.getElementById('date').textContent = new Date().toLocaleDateString();
//         printDoc.getElementById('ref-number').textContent = 'REF-' + Math.floor(Math.random() * 1000000);
//         printDoc.getElementById('pos-id').textContent = currentUser && currentUser.displayName ? currentUser.displayName : 'Unknown';

//         const transactionsList = printDoc.getElementById('transactions-list');
//         if (transactionsToPrint && transactionsToPrint.length > 0) {
//             transactionsToPrint.forEach((transaction, index) => {
//                 const remaining = transaction.total - (transaction.paid || 0);
//                 const remainingText = remaining > 0 
//                     ? `₱${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
//                     : 'Fully Paid';

//                 const transactionDiv = printDoc.createElement('div');
//                 transactionDiv.innerHTML = `
//                     <h4>Transaction ${index + 1}</h4>
//                     <p>Date Added: ${new Date(transaction.dateAdded).toLocaleDateString()}</p>
//                     <p>Due Date: ${transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'Not Set'}</p>
//                     <p><strong>Total:</strong> ₱${transaction.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                     <p><strong>Paid:</strong> ₱${(transaction.paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
//                     <p><strong>Remaining:</strong> ${remainingText}</p>
//                     <h5>Products</h5>
//                     <ul>
//                         ${transaction.products.map(product => `
//                             <li>${product.name} - ${product.quantity}x ₱${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ₱${product.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
//                         `).join('')}
//                     </ul>
//                     <h5>Payments for this Transaction</h5>
//                     <ul>
//                         ${debtor.payments.filter(p => p.transactionId === transaction.id).map(payment => `
//                             <li>${new Date(payment.timestamp).toLocaleDateString()} - ₱${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Ref: ${payment.reference})</li>
//                         `).join('') || '<li>No payments for this transaction</li>'}
//                     </ul>
//                 `;
//                 transactionsList.appendChild(transactionDiv);
//             });
//         } else {
//             transactionsList.innerHTML = '<p>No transactions to print</p>';
//         }

//         const generalPayments = printDoc.getElementById('general-payments');
//         const allPayments = debtor.payments.filter(p => p.transactionId === 'all');
//         if (allPayments.length > 0) {
//             allPayments.forEach(payment => {
//                 const li = printDoc.createElement('li');
//                 li.textContent = `${new Date(payment.timestamp).toLocaleDateString()} - ₱${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Ref: ${payment.reference})`;
//                 generalPayments.appendChild(li);
//             });
//         } else {
//             generalPayments.innerHTML = '<li>No general payments</li>';
//         }

//         printWindow.print();
//     };
// }

// function initializePasswordToggles() {
//     document.querySelectorAll('.toggle-password').forEach(toggle => {
//         const input = toggle.previousElementSibling;
//         if (input && input.type === 'password') {
//             toggle.addEventListener('click', () => {
//                 input.type = input.type === 'password' ? 'text' : 'password';
//                 toggle.classList.toggle('fa-eye');
//                 toggle.classList.toggle('fa-eye-slash');
//             });
//         }
//     });
// }

// function addProductEntryHandler() {
//     const productList = document.getElementById('product-list');
//     const newEntry = document.createElement('div');
//     newEntry.classList.add('product-entry');
//     newEntry.innerHTML = `
//         <div class="product-name-wrapper">
//             <input type="text" class="product-name" placeholder="Product Name" required>
//             <div class="suggestions" style="display: none;"></div>
//         </div>
//         <input type="number" class="product-quantity" placeholder="Quantity" min="1" required>
//         <input type="number" class="product-price" placeholder="Price" min="0" step="0.01" required>
//         <span class="product-total">Total: ₱0.00</span>
//         <button type="button" class="remove-product-entry" aria-label="Remove this product entry"><i class="fas fa-trash"></i></button>
//     `;
//     productList.appendChild(newEntry);
//     console.log('Product entry added'); // Debug log to confirm single execution
// }

// // Ensure the event listener is attached only once
// const addButton = document.getElementById('add-product-entry');
// if (addButton) {
//     // Remove any existing listeners to prevent duplicates
//     addButton.removeEventListener('click', addProductEntryHandler);
//     addButton.addEventListener('click', addProductEntryHandler);
//     console.log('Event listener attached to Add Product button'); // Debug log to confirm attachment
// } else {
//     console.error('Button with ID "add-product-entry" not found');
// }

// // Function to calculate total for a single product entry
// function calculateProductTotal(entry) {
//     const quantityInput = entry.querySelector('.product-quantity');
//     const priceInput = entry.querySelector('.product-price');
//     const totalSpan = entry.querySelector('.product-total');
    
//     const quantity = parseFloat(quantityInput.value) || 0;
//     const price = parseFloat(priceInput.value) || 0;
//     const total = quantity * price;
    
//     totalSpan.textContent = `Total: ₱${total.toFixed(2)}`;
// }

// // Function to calculate grand total for all product entries
// function calculateGrandTotal() {
//     const entries = document.querySelectorAll('.product-entry');
//     let grandTotal = 0;
//     entries.forEach(entry => {
//         const totalSpan = entry.querySelector('.product-total');
//         const totalText = totalSpan.textContent.replace('Total: ₱', '').replace(',', '');
//         const total = parseFloat(totalText) || 0;
//         grandTotal += total;
//     });
//     document.getElementById('new-product-total-price').textContent = `Grand Total: ₱${grandTotal.toFixed(2)}`;
// }

// // Event delegation for input changes in product-list
// const productList = document.getElementById('product-list');
// productList.addEventListener('input', (e) => {
//     if (e.target.classList.contains('product-quantity') || e.target.classList.contains('product-price')) {
//         const entry = e.target.closest('.product-entry');
//         if (entry) {
//             calculateProductTotal(entry);
//             calculateGrandTotal();
//         }
//     }
// });

// // Event delegation for removing product entries
// productList.addEventListener('click', (e) => {
//     if (e.target.classList.contains('remove-product-entry') || e.target.closest('.remove-product-entry')) {
//         const entry = e.target.closest('.product-entry');
//         if (entry) {
//             entry.remove();
//             calculateGrandTotal(); // Update the grand total after removal
//         }
//     }
// });

// // Load Payment History
// async function loadPaymentHistory(debtorId) {
//     const paymentHistoryList = document.getElementById('payment-history-list');
//     paymentHistoryList.innerHTML = '<li>Loading payment history...</li>';
    
//     try {
//         const debtor = debtors.find(d => d.id === debtorId);
//         if (!debtor) {
//             paymentHistoryList.innerHTML = '<li>Debtor not found.</li>';
//             return;
//         }
        
//         let payments = debtor.payments || [];
        
//         if (window.firebase) {
//             const { database, ref, get } = window.firebase;
//             const debtorRef = ref(database, `debtors/${debtorId}`);
//             const snapshot = await get(debtorRef);
//             if (snapshot.exists()) {
//                 const firebaseDebtor = snapshot.val();
//                 if (firebaseDebtor.payments) {
//                     if (typeof firebaseDebtor.payments === 'object' && !Array.isArray(firebaseDebtor.payments)) {
//                         payments = Object.values(firebaseDebtor.payments);
//                     } else {
//                         payments = firebaseDebtor.payments;
//                     }
//                     debtor.payments = payments;
//                     const index = debtors.findIndex(d => d.id === debtorId);
//                     if (index !== -1) debtors[index] = debtor;
//                     localStorage.setItem('debtors', JSON.stringify(debtors));
//                 }
//             }
//         }
        
//         paymentHistoryList.innerHTML = '';
        
//         if (payments && payments.length > 0) {
//             payments.sort((a, b) => b.timestamp - a.timestamp);
//             payments.forEach((payment, index) => {
//                 displayPaymentItem(payment, index, paymentHistoryList);
//             });
//         } else {
//             paymentHistoryList.innerHTML = '<li>No payment history found.</li>';
//         }
//     } catch (error) {
//         console.error("Error loading payment history:", error);
//         paymentHistoryList.innerHTML = '<li>Error loading payment history: ' + error.message + '</li>';
//     }
// }

// function openProductForm(mode, product = null) {
//     const form = document.getElementById('inventory-product-form');
//     const title = document.getElementById('inventory-product-form-title');
//     form.dataset.mode = mode;
//     if (mode === 'add') {
//         title.textContent = 'Add Product';
//         form.reset();
//         delete form.dataset.productId;
//     } else if (mode === 'edit' && product) {
//         title.textContent = 'Edit Product';
//         document.getElementById('inventory-product-name').value = product.name;
//         document.getElementById('inventory-product-price').value = product.price;
//         document.getElementById('inventory-product-stock').value = product.stock;
//         form.dataset.productId = product.id;
//     }
//     document.getElementById('inventory-product-form-modal').style.display = 'block';
// }

// // Add or update the saveProduct function if not already present
// function capitalizeFirstLetter(string) {
//     if (!string) return '';
//     return string.charAt(0).toUpperCase() + string.slice(1);
// }

// async function saveProduct(product) {
//     try {
//         product.name = capitalizeFirstLetter(product.name.trim());
        
//         let firebaseId = null;
//         if (window.firebase) {
//             const { database, ref, push, set } = window.firebase;
//             const productsRef = ref(database, 'products');
//             const newProductRef = push(productsRef);
//             firebaseId = newProductRef.key;
//             product.id = firebaseId;
//             await set(newProductRef, product);
//         } else {
//             product.id = 'product_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
//         }
//         products.push(product);
//         products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
//         localStorage.setItem('products', JSON.stringify(products));
//         renderProductsWithSearch();
//     } catch (error) {
//         console.error('Error saving product:', error);
//         throw error;
//     }
// }
// // Add or update the updateProduct function if not already present
// async function updateProduct(product) {
//     try {
//         const index = products.findIndex(p => p.id === product.id);
//         if (index !== -1) {
//             products[index] = product;
//             // Sort products by stock ascending
//             products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
//         }
//         if (window.firebase) {
//             const { database, ref, update } = window.firebase;
//             const productRef = ref(database, `products/${product.id}`);
//             await update(productRef, product);
//         }
//         localStorage.setItem('products', JSON.stringify(products));
//         renderProductsWithSearch();
//     } catch (error) {
//         console.error('Error updating product:', error);
//         throw error;
//     }
// }

// async function deleteProduct(productId) {
//     const productIndex = products.findIndex(p => p.id === productId);
//     if (productIndex === -1) {
//         alert('Product not found');
//         return;
//     }
//     const product = products[productIndex];
//     if (!confirm(`Are you sure you want to delete ${product.name}?`)) {
//         return;
//     }
//     try {
//         if (window.firebase) {
//             const { database, ref, remove } = window.firebase;
//             const productRef = ref(database, `products/${productId}`);
//             await remove(productRef);
//         }
//         products.splice(productIndex, 1);
//         localStorage.setItem('products', JSON.stringify(products));
//         renderProductsWithSearch(); // Render with current search term
//         alert('Product deleted successfully');
//     } catch (error) {
//         console.error('Error deleting product:', error);
//         alert('Failed to delete product: ' + error.message);
//     }
// }

// // Function to handle product input and show suggestions
// function handleProductInput(input) {
//     const wrapper = input.closest('.product-name-wrapper');
//     const suggestionsDiv = wrapper.querySelector('.suggestions');
//     const query = input.value.toLowerCase();

//     if (query.length < 1) {
//         suggestionsDiv.style.display = 'none';
//         return;
//     }

//     const matches = products.filter(product => 
//         product.name.toLowerCase().includes(query)
//     );

//     if (matches.length > 0) {
//         suggestionsDiv.innerHTML = matches.map(product => `
//             <div class="suggestion-item" data-price="${product.price}">
//                 ${product.name}
//             </div>
//         `).join('');
//         suggestionsDiv.style.display = 'block';
//     } else {
//         suggestionsDiv.style.display = 'none';
//     }
// }

// // Modify the product form initialization
// document.getElementById('product-list').addEventListener('input', (e) => {
//     if (e.target.classList.contains('product-name')) {
//         handleProductInput(e.target);
//     }
// });

// document.getElementById('product-list').addEventListener('click', (e) => {
//     if (e.target.classList.contains('suggestion-item')) {
//         const wrapper = e.target.closest('.product-name-wrapper');
//         const input = wrapper.querySelector('.product-name');
//         const priceInput = wrapper.closest('.product-entry').querySelector('.product-price');
        
//         input.value = e.target.textContent.trim();
//         priceInput.value = e.target.dataset.price;
        
//         wrapper.querySelector('.suggestions').style.display = 'none';
        
//         // Calculate totals
//         calculateProductTotal(wrapper.closest('.product-entry'));
//         calculateGrandTotal();
//     }
// });

// // Hide suggestions when clicking outside
// document.addEventListener('click', (e) => {
//     if (!e.target.closest('.product-name-wrapper')) {
//         document.querySelectorAll('.suggestions').forEach(div => {
//             div.style.display = 'none';
//         });
//     }
// });

// // Update product entry creation to include suggestions div
// function addProductEntryHandler() {
//     const productList = document.getElementById('product-list');
//     const newEntry = document.createElement('div');
//     newEntry.classList.add('product-entry');
//     newEntry.innerHTML = `
//         <div class="product-name-wrapper">
//             <input type="text" class="product-name" placeholder="Product Name" required>
//             <div class="suggestions" style="display: none;"></div>
//         </div>
//         <input type="number" class="product-quantity" placeholder="Quantity" min="1" required>
//         <input type="number" class="product-price" placeholder="Price" min="0" step="0.01" required>
//         <span class="product-total">Total: ₱0.00</span>
//         <button type="button" class="remove-product-entry" aria-label="Remove this product entry"><i class="fas fa-trash"></i></button>
//     `;
//     productList.appendChild(newEntry);
//     console.log('Product entry added'); // Debug log to confirm single execution
// }


// // Open checkout modal
// document.getElementById('checkout-btn').addEventListener('click', () => {
//     document.getElementById('checkout-form-modal').style.display = 'block';
// });

// // Close checkout modal
// document.getElementById('cancel-checkout-btn').addEventListener('click', closeAllModals);
// document.querySelector('#checkout-form-modal .close-modal').addEventListener('click', closeAllModals);

// // Add new product entry
// document.getElementById('add-checkout-product-entry').addEventListener('click', () => {
//     const productList = document.getElementById('checkout-product-list');
//     const newEntry = document.createElement('div');
//     newEntry.classList.add('product-entry');
//     newEntry.innerHTML = `
//         <div class="product-name-wrapper">
//             <input type="text" class="product-name" placeholder="Product Name" required>
//             <div class="suggestions" style="display: none;"></div>
//         </div>
//         <input type="number" class="product-quantity" placeholder="Quantity" min="1" required>
//         <input type="number" class="product-price" placeholder="Price" min="0" step="0.01" required>
//         <span class="product-total">Total: ₱0.00</span>
//         <button type="button" class="remove-product-entry"><i class="fas fa-trash"></i></button>
//     `;
//     productList.appendChild(newEntry);
// });

// // Calculate product total
// function calculateCheckoutProductTotal(entry) {
//     const quantityInput = entry.querySelector('.product-quantity');
//     const priceInput = entry.querySelector('.product-price');
//     const totalSpan = entry.querySelector('.product-total');
//     const quantity = parseFloat(quantityInput.value) || 0;
//     const price = parseFloat(priceInput.value) || 0;
//     const total = quantity * price;
//     totalSpan.textContent = `Total: ₱${total.toFixed(2)}`;
// }

// // Calculate grand total
// function calculateCheckoutGrandTotal() {
//     const entries = document.querySelectorAll('#checkout-product-list .product-entry');
//     let grandTotal = 0;
//     entries.forEach(entry => {
//         const totalText = entry.querySelector('.product-total').textContent.replace('Total: ₱', '').replace(',', '');
//         grandTotal += parseFloat(totalText) || 0;
//     });
//     document.getElementById('checkout-grand-total').textContent = `Grand Total: ₱${grandTotal.toFixed(2)}`;
// }

// // Handle input changes and removals
// document.getElementById('checkout-product-list').addEventListener('input', (e) => {
//     if (e.target.classList.contains('product-quantity') || e.target.classList.contains('product-price')) {
//         const entry = e.target.closest('.product-entry');
//         calculateCheckoutProductTotal(entry);
//         calculateCheckoutGrandTotal();
//     } else if (e.target.classList.contains('product-name')) {
//         handleProductInput(e.target);
//     }
// });

// document.getElementById('checkout-product-list').addEventListener('click', (e) => {
//     if (e.target.closest('.remove-product-entry')) {
//         const entry = e.target.closest('.product-entry');
//         entry.remove();
//         calculateCheckoutGrandTotal();
//     } else if (e.target.classList.contains('suggestion-item')) {
//         const wrapper = e.target.closest('.product-name-wrapper');
//         const input = wrapper.querySelector('.product-name');
//         const priceInput = wrapper.closest('.product-entry').querySelector('.product-price');
//         input.value = e.target.textContent.trim();
//         priceInput.value = e.target.dataset.price;
//         wrapper.querySelector('.suggestions').style.display = 'none';
//         calculateCheckoutProductTotal(wrapper.closest('.product-entry'));
//         calculateCheckoutGrandTotal();
//     }
// });

// // Handle checkout form submission
// document.getElementById('checkout-form').addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const productEntries = document.querySelectorAll('#checkout-product-list .product-entry');
//     const productsToCheckout = [];
    
//     for (const entry of productEntries) {
//         const name = entry.querySelector('.product-name').value.trim();
//         const quantity = parseFloat(entry.querySelector('.product-quantity').value);
//         if (name && !isNaN(quantity) && quantity > 0) {
//             productsToCheckout.push({ name, quantity });
//         }
//     }
    
//     if (productsToCheckout.length === 0) {
//         alert('Please add at least one valid product with positive quantity.');
//         return;
//     }
    
//     for (const productToCheckout of productsToCheckout) {
//         const inventoryProduct = products.find(p => p.name.toLowerCase() === productToCheckout.name.toLowerCase());
//         if (!inventoryProduct) {
//             alert(`Product "${productToCheckout.name}" not found in inventory.`);
//             return;
//         }
//         if (inventoryProduct.stock === undefined) {
//             alert(`Stock information missing for "${productToCheckout.name}". Please update the inventory.`);
//             return;
//         }
//         if (inventoryProduct.stock < productToCheckout.quantity) {
//             alert(`Insufficient stock for "${productToCheckout.name}". Available: ${inventoryProduct.stock}, Requested: ${productToCheckout.quantity}`);
//             return;
//         }
//     }
    
//     try {
//         for (const productToCheckout of productsToCheckout) {
//             const inventoryProduct = products.find(p => p.name.toLowerCase() === productToCheckout.name.toLowerCase());
//             inventoryProduct.stock -= productToCheckout.quantity;
//             await updateProduct(inventoryProduct);
//         }
        
//         // Reset the form
//         document.getElementById('checkout-form').reset();
//         const checkoutProductList = document.getElementById('checkout-product-list');
//         while (checkoutProductList.children.length > 1) {
//             checkoutProductList.removeChild(checkoutProductList.lastChild);
//         }
        
//         // Reset all product totals and grand total
//         const remainingEntry = checkoutProductList.querySelector('.product-entry');
//         if (remainingEntry) {
//             const totalSpan = remainingEntry.querySelector('.product-total');
//             totalSpan.textContent = 'Total: ₱0.00';
//         }
        
//         document.getElementById('checkout-grand-total').textContent = 'Grand Total: ₱0.00';
        
//         alert('Checkout completed successfully and stock updated! Form has been reset for the next checkout.');
        
//     } catch (error) {
//         console.error('Error updating stock:', error);
//         alert('Failed to update inventory stock. Checkout aborted.');
//         return;
//     }
// });

// // Assuming handleProductInput exists; if not, add it
// function handleProductInput(input) {
//     const wrapper = input.closest('.product-name-wrapper');
//     const suggestionsDiv = wrapper.querySelector('.suggestions');
//     const query = input.value.toLowerCase();
//     if (query.length < 1) {
//         suggestionsDiv.style.display = 'none';
//         return;
//     }
//     const matches = products.filter(product => product.name.toLowerCase().includes(query));
//     if (matches.length > 0) {
//         suggestionsDiv.innerHTML = matches.map(product => `
//             <div class="suggestion-item" data-price="${product.price}">${product.name}</div>
//         `).join('');
//         suggestionsDiv.style.display = 'block';
//     } else {
//         suggestionsDiv.style.display = 'none';
//     }
// }

// // Client-side (script.js)
// function generateReferenceNumber() {
//     const date = new Date();
//     const dateString = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
//     const timeString = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
//     const randomComponent = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//     return `TXN${dateString}${timeString}-${randomComponent}`;
// }

// // Updated saveTransaction function
// async function saveTransaction(debtor, transactionData) {
//     const referenceNumber = generateReferenceNumber();
//     const transaction = {
//         id: 'transaction_' + Date.now(),
//         referenceNumber: referenceNumber,
//         dateAdded: Date.now(),
//         dueDate: transactionData.dueDate,
//         total: transactionData.total,
//         paid: 0,
//         products: transactionData.products
//     };

//     // Initialize transactions array if it doesn't exist
//     debtor.transactions = debtor.transactions || [];
//     debtor.transactions.push(transaction);
//     debtor.totalDebt = (debtor.totalDebt || 0) + transaction.total;

//     try {
//         // Save to Firebase if available
//         if (window.firebase) {
//             const { database, ref, update } = window.firebase;
//             const debtorRef = ref(database, `debtors/${debtor.id}`);
//             await update(debtorRef, { 
//                 transactions: debtor.transactions, 
//                 totalDebt: debtor.totalDebt 
//             });
//         }

//         // CRITICAL: Update the global debtors array
//         const debtorIndex = debtors.findIndex(d => d.id === debtor.id);
//         if (debtorIndex !== -1) {
//             debtors[debtorIndex] = { ...debtor }; // Create a fresh copy
//         }

//         // Save to localStorage as backup
//         localStorage.setItem('debtors', JSON.stringify(debtors));

//         // Send SMS notification
//         await sendNewTransactionSMS(debtor.contact, debtor.name, {
//             referenceNumber: transaction.referenceNumber,
//             dateAdded: transaction.dateAdded,
//             dueDate: transaction.dueDate,
//             transactionTotal: transaction.total,
//             products: transaction.products,
//             totalDebt: debtor.totalDebt
//         });

//         return transaction; // Return the created transaction
//     } catch (error) {
//         console.error('Error saving transaction or sending SMS:', error);
//         throw error;
//     }
// }

// async function sendNewTransactionSMS(phoneNumber, debtorName, transaction) {
//     try {
//         const response = await fetch('http://localhost:3000/send-new-transaction-sms', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ phoneNumber, debtorName, transaction })
//         });
//         const data = await response.json();
//         if (!response.ok) throw new Error(data.error || 'Failed to send SMS');
//         console.log('New transaction SMS sent successfully:', data);
//     } catch (error) {
//         console.error('Error sending new transaction SMS:', error);
//         throw error;
//     }
// }

// // Function to send reminder SMS
// async function sendReminderSMS(phoneNumber, message) {
//     try {
//         const response = await fetch('http://localhost:3000/send-reminder', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ phoneNumber, message })
//         });
//         const data = await response.json();
//         if (!response.ok) throw new Error(data.error || 'Failed to send SMS');
//         console.log('Reminder SMS sent successfully:', data);
//     } catch (error) {
//         console.error('Error sending reminder SMS:', error);
//         throw error;
//     }
// }

// // Function to send payment receipt SMS
// async function sendPaymentReceiptSMS(phoneNumber, debtorName, amount, remainingBalance) {
//     try {
//         console.log('Attempting to send SMS with:', { phoneNumber, debtorName, amount, remainingBalance });
//         const response = await window.fetch('http://localhost:3000/send-payment-receipt', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ phoneNumber, debtorName, amount, remainingBalance })
//         });
//         const data = await response.json();
//         if (!response.ok) throw new Error(data.error || 'Unknown error');
//         console.log('SMS sent:', data);
//         return data;
//     } catch (error) {
//         console.error('SMS Error:', error.message);
//         throw error;
//     }
// }

// // Ensure this function exists in your script.js
// function generateReferenceNumber() {
//     const date = new Date();
//     const dateString = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
//     const timeString = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;
//     const randomComponent = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//     return `TXN-${dateString}-${timeString}-${randomComponent}`;
// }