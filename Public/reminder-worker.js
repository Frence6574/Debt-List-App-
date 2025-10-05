let debtorData = [];
let sentReminders = [];
let reminderIntervalDays = 1;

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data.type === 'UPDATE_DATA') {
        debtorData = event.data.debtors || [];
        sentReminders = event.data.sentReminders || [];
        reminderIntervalDays = parseInt(event.data.reminderInterval || '1', 10);
        console.log('Service worker data updated');
    }
});

// Background sync for reminders
self.addEventListener('sync', (event) => {
    if (event.tag === 'reminder-check') {
        event.waitUntil(checkRemindersInBackground());
    }
});

// Periodic background sync (if supported by browser)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'reminder-periodic') {
        event.waitUntil(checkRemindersInBackground());
    }
});

async function checkRemindersInBackground() {
    console.log('Background reminder check started');
    
    const now = Date.now();
    const reminderIntervalMs = reminderIntervalDays * 24 * 60 * 60 * 1000;
    
    for (const debtor of debtorData) {
        const overdueTransactions = debtor.transactions.filter(t => 
            t.dueDate && t.dueDate < now && (t.total - (t.paid || 0)) > 0
        );
        
        if (overdueTransactions.length > 0) {
            const lastReminder = sentReminders
                .filter(r => r.debtorId === debtor.id && r.status === 'success')
                .sort((a, b) => b.timestamp - a.timestamp)[0];

            if (!lastReminder || (now - lastReminder.timestamp > reminderIntervalMs)) {
                try {
                    await sendReminderFromWorker(debtor, overdueTransactions);
                } catch (error) {
                    console.error('Failed to send reminder in background:', error);
                }
            }
        }
    }
}

async function sendReminderFromWorker(debtor, overdueTransactions) {
    const totalOverdue = overdueTransactions.reduce((sum, t) => sum + (t.total - (t.paid || 0)), 0);
    
    const message = `[K&J Store] Overdue Reminder
Hi ${debtor.name},
You have ${overdueTransactions.length} overdue transaction(s) totaling ₱${totalOverdue.toFixed(2)}.
Your total debt is ₱${debtor.totalDebt.toFixed(2)}.
Please settle this soon. Contact us if needed.`;

    try {
        const response = await fetch('http://localhost:3000/send-reminder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phoneNumber: debtor.contact,
                message: message
            })
        });

        if (response.ok) {
            console.log(`Background reminder sent to ${debtor.name}`);
            
            // Update sent reminders
            const reminder = {
                id: 'reminder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                debtorId: debtor.id,
                debtorName: debtor.name,
                contact: debtor.contact,
                amount: totalOverdue,
                message: message,
                timestamp: Date.now(),
                status: 'success'
            };
            
            sentReminders.unshift(reminder);
        }
    } catch (error) {
        console.error('Background SMS error:', error);
    }
}

// Install and activate service worker
self.addEventListener('install', (event) => {
    console.log('Reminder service worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Reminder service worker activated');
    event.waitUntil(self.clients.claim());
});