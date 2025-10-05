document.addEventListener('DOMContentLoaded', () => {
    // Placeholder data; actual data will be passed from the main app
    const date = new Date().toLocaleDateString();
    const refNumber = 'REF-' + Math.floor(Math.random() * 1000000);
    const debtorName = 'John Doe';
    const paymentAmount = '₱500.00';
    const remainingBalance = '₱1000.00';

    document.getElementById('date').textContent = date;
    document.getElementById('ref-number').textContent = refNumber;
    document.getElementById('debtor-name').textContent = debtorName;
    document.getElementById('payment-amount').textContent = paymentAmount;
    document.getElementById('remaining-balance').textContent = remainingBalance;
});