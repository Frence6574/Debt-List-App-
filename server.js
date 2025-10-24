require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch').default;
const cors = require('cors');
const admin = require('firebase-admin');  // Move require here

// Initialize Firebase Admin FIRST
try {
    admin.initializeApp({
        credential: admin.credential.cert(require('./serviceAccountKey.json')),
        databaseURL: "https://test-debt-63eb7-default-rtdb.firebaseio.com"  // Add this line
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from Public directory
app.use(express.static('Public'));

// New Transaction SMS Endpoint
app.post('/send-new-transaction-sms', async (req, res) => {
    const { phoneNumber, debtorName, transaction } = req.body;

    if (!phoneNumber || !debtorName || !transaction) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    const { referenceNumber, dateAdded, dueDate, transactionTotal, products, totalDebt } = transaction;

    const productList = products.map((product, index) => 
        `${index + 1}. ${product.name}: ${product.quantity} x ₱${product.price.toFixed(2)} = ₱${(product.quantity * product.price).toFixed(2)}`
    ).join('\n');

    const message = `[K&J Store] New Transaction Added
Hi ${debtorName},
A new transaction has been added to your debt record:
Transaction Reference: ${referenceNumber}
Date Added: ${new Date(dateAdded).toLocaleDateString('en-PH')}
Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString('en-PH') : 'Not Set'}
Total Transaction Amount: ₱${transactionTotal.toFixed(2)}
Products:
${productList}
Your total debt is now ₱${totalDebt.toFixed(2)}.
Please contact us if you have any questions.`;

    try {
        const response = await fetch('https://api.semaphore.co/api/v4/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                apikey: process.env.SEMAPHORE_API_KEY,
                number: phoneNumber,
                message: message,
                sendername: 'KJSTORE'
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'SMS sending failed');
        res.json({ success: true, message: 'SMS sent successfully' });
    } catch (error) {
        console.error('Error sending new transaction SMS:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reminder SMS Endpoint
app.post('/send-reminder', async (req, res) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
        console.error('Missing parameters:', req.body);
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        const response = await fetch('https://api.semaphore.co/api/v4/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                apikey: process.env.SEMAPHORE_API_KEY,
                number: phoneNumber,
                message: message,
                sendername: 'KJSTORE'
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'SMS sending failed');
        res.json({ success: true, message: 'Reminder sent successfully' });
    } catch (error) {
        console.error('Error sending reminder SMS:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// New Payment Receipt SMS Endpoint
app.post('/send-payment-receipt', async (req, res) => {
    const { phoneNumber, debtorName, amount, remainingBalance } = req.body;

    if (!phoneNumber || !debtorName || !amount || remainingBalance === undefined) {
        console.error('Missing parameters:', req.body);
        return res.status(400).json({ error: "Missing required parameters" });
    }

    console.log('Processing SMS for:', { phoneNumber, debtorName, amount, remainingBalance });

    const message = `[K&J Store] Payment Received
Hi ${debtorName},
We have received your payment of ₱${amount.toFixed(2)}.
Your remaining balance is ₱${remainingBalance.toFixed(2)}.
Thank you!`;

    try {
        const response = await fetch('https://api.semaphore.co/api/v4/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                apikey: process.env.SEMAPHORE_API_KEY,
                number: phoneNumber,
                message: message,
                sendername: 'KJSTORE'
            })
        });

        const data = await response.json();
        console.log('Semaphore response:', data);
        if (!response.ok) throw new Error(data.message || 'SMS sending failed');
        res.json({ success: true, message: 'SMS sent successfully' });
    } catch (error) {
        console.error('SMS Send Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ADD THIS NEW ENDPOINT: User Deletion
app.post('/delete-user', async (req, res) => {
    try {
        const { uid } = req.body;
        
        console.log('Attempting to delete user with UID:', uid);
        
        if (!uid) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Delete user from Firebase Authentication
        await admin.auth().deleteUser(uid);
        
        console.log('User deleted successfully from authentication');
        res.json({ success: true, message: 'User deleted from authentication' });
    } catch (error) {
        console.error('Full error object:', JSON.stringify(error, null, 2));
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        res.status(500).json({ 
            error: error.message,
            code: error.code 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Add this new endpoint after your existing endpoints

app.post('/create-user', async (req, res) => {
    try {
        const { email, password, displayName, role, createdBy } = req.body;
        
        console.log('Creating user:', { email, role });
        
        if (!email || !password || !displayName || !role || !createdBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Create user in Firebase Auth using Admin SDK (won't affect current session)
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: displayName
        });
        
        console.log('User created in Auth with UID:', userRecord.uid);
        
        // Create user record in database
        const userData = {
            email: email,
            displayName: displayName,
            role: role,
            createdAt: admin.database.ServerValue.TIMESTAMP,
            createdBy: createdBy,
            active: true
        };
        
        await admin.database().ref(`users/${userRecord.uid}`).set(userData);
        
        console.log('User record created in database');
        
        res.json({ 
            success: true, 
            uid: userRecord.uid,
            message: 'User created successfully' 
        });
        
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ 
            error: error.message,
            code: error.code 
        });
    }
});