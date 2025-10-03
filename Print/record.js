document.addEventListener('DOMContentLoaded', () => {
    // Placeholder data; actual data will be passed from the main app
    const date = new Date().toLocaleDateString();
    const refNumber = 'REF-' + Math.floor(Math.random() * 1000000);
    const debtorName = 'John Doe';
    const debtorContact = '+639123456789';
    const totalDebt = '₱1500.00';
    const products = [
        { name: 'Product A', quantity: 2, price: 100, total: 200 },
        { name: 'Product B', quantity: 1, price: 300, total: 300 }
    ];
    const payments = [
        { date: '2023-01-01', amount: 500 },
        { date: '2023-01-15', amount: 300 }
    ];

    document.getElementById('date').textContent = date;
    document.getElementById('ref-number').textContent = refNumber;
    document.getElementById('debtor-name').textContent = debtorName;
    document.getElementById('debtor-contact').textContent = debtorContact;
    document.getElementById('total-debt').textContent = totalDebt;

    const productsList = document.getElementById('products-list');
    products.forEach(product => {
        const li = document.createElement('li');
        li.textContent = `${product.name} - ${product.quantity}x ₱${product.price} = ₱${product.total}`;
        productsList.appendChild(li);
    });

    const paymentHistory = document.getElementById('payment-history');
    payments.forEach(payment => {
        const li = document.createElement('li');
        li.textContent = `${payment.date} - ₱${payment.amount}`;
        paymentHistory.appendChild(li);
    });
});