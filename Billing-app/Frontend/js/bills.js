// Bills Page JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Bills page loaded, initializing...');
    
    // Database store names
    const STORES = {
        PRODUCTS: 'products',
        CUSTOMERS: 'customers',
        BILLS: 'bills',
        BILL_ITEMS: 'bill_items',
        SETTINGS: 'settings'
    };
    
    const billsContainer = document.getElementById('billsContainer');
    const searchInput = document.getElementById('searchInput');
    const backBtn = document.getElementById('backBtn');
    const printSelectedBtn = document.getElementById('printSelectedBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const billModal = document.getElementById('billModal');
    const modalBody = document.getElementById('modalBody');
    const closeModalBtnElement = document.getElementById('closeModal');
    const printBillBtn = document.getElementById('printBillBtn');

    let allBills = [];
    let allCustomers = [];
    let allProducts = [];
    let filteredBills = [];
    let selectedBills = new Set();
    let currentBill = null;

    // Initialize database with better error handling
    async function initializeDatabase() {
        try {
            console.log('Step 1: Checking if idb library is available...');
            console.log('idb type:', typeof idb);
            console.log('idb object:', idb);
            
            if (typeof idb === 'undefined') {
                throw new Error('IndexedDB library (idb) is not loaded. Please check your internet connection and refresh the page.');
            }
            
            console.log('Step 2: Checking if billingDB exists...');
            console.log('billingDB type:', typeof billingDB);
            console.log('billingDB object:', billingDB);
            
            if (typeof billingDB === 'undefined') {
                throw new Error('Database wrapper (billingDB) is not loaded. Please refresh the page.');
            }
            
            console.log('Step 3: Initializing database...');
            const db = await billingDB.init();
            console.log('Database object:', db);
            console.log('Database initialized successfully for bills page');
            return true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            console.error('Error stack:', error.stack);
            showError('Database connection failed: ' + error.message);
            return false;
        }
    }

    // Clear database and start fresh
    async function clearDatabase() {
        try {
            console.log('Clearing database...');
            if (typeof billingDB !== 'undefined') {
                await billingDB.clear(STORES.PRODUCTS);
                await billingDB.clear(STORES.CUSTOMERS);
                await billingDB.clear(STORES.BILLS);
                await billingDB.clear(STORES.BILL_ITEMS);
                await billingDB.clear(STORES.SETTINGS);
                console.log('Database cleared successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error clearing database:', error);
            return false;
        }
    }

    // Reset database completely
    async function resetDatabase() {
        try {
            console.log('Resetting database...');
            if (typeof billingDB !== 'undefined') {
                await billingDB.close();
                // Delete the database completely
                await idb.deleteDB('RadhaBillingDB');
                console.log('Database deleted, will be recreated on next init');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error resetting database:', error);
            return false;
        }
    }

    // Initialize the page
    async function initializePage() {
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
            // Show error state
            billsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="empty-title">Database Error</h3>
                    <p class="empty-description">Failed to connect to database. Please check your internet connection and refresh the page.</p>
                    <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
                        <button class="add-btn" onclick="window.location.reload()">
                            <i class="fas fa-refresh"></i>
                            <span>Refresh Page</span>
                        </button>
                        <button class="add-btn" style="background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);" onclick="resetDatabaseAndReload()">
                            <i class="fas fa-trash"></i>
                            <span>Reset Database</span>
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Load bills after successful database initialization
        await loadBills();
    }

    // Global function to reset database and reload
    window.resetDatabaseAndReload = async function() {
        try {
            await resetDatabase();
            window.location.reload();
        } catch (error) {
            console.error('Error resetting database:', error);
            alert('Failed to reset database. Please try refreshing the page.');
        }
    };

    // Load bills from database
    async function loadBills() {
        try {
            console.log('Step 4: Loading bills, customers, and products...');
            
            console.log('Calling billingDB.getAllBills()...');
            const billsPromise = billingDB.getAllBills();
            console.log('Calling billingDB.getAllCustomers()...');
            const customersPromise = billingDB.getAllCustomers();
            console.log('Calling billingDB.getAllProducts()...');
            const productsPromise = billingDB.getAllProducts();
            
            [allBills, allCustomers, allProducts] = await Promise.all([
                billsPromise,
                customersPromise,
                productsPromise
            ]);
            
            console.log(`Step 5: Loaded ${allBills.length} bills, ${allCustomers.length} customers, ${allProducts.length} products`);
            console.log('Bills:', allBills);
            console.log('Customers:', allCustomers);
            console.log('Products:', allProducts);
            
            // If no data exists, create sample data
            if (allBills.length === 0 && allCustomers.length === 0 && allProducts.length === 0) {
                console.log('Step 6: No data found, creating sample data...');
                await createSampleData();
                // Reload data after creating sample data
                console.log('Step 7: Reloading data after creating sample data...');
                [allBills, allCustomers, allProducts] = await Promise.all([
                    billingDB.getAllBills(),
                    billingDB.getAllCustomers(),
                    billingDB.getAllProducts()
                ]);
                console.log(`Step 8: After sample data: ${allBills.length} bills, ${allCustomers.length} customers, ${allProducts.length} products`);
            }
            
            console.log('Step 9: Setting filtered bills and rendering...');
            filteredBills = [...allBills];
            renderBills();
            console.log('Step 10: Bills rendered successfully');
        } catch (error) {
            console.error('Error loading bills:', error);
            console.error('Error stack:', error.stack);
            showError('Failed to load bills: ' + error.message);
            // Show empty state with error
            billsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="empty-title">Loading Error</h3>
                    <p class="empty-description">Failed to load bills from database.</p>
                    <button class="add-btn" onclick="window.location.reload()">
                        <i class="fas fa-refresh"></i>
                        <span>Try Again</span>
                    </button>
                </div>
            `;
        }
    }

    // Create sample data
    async function createSampleData() {
        try {
            // Create sample customers
            const customer1 = await billingDB.addCustomer({
                name: 'John Doe',
                type: 'retailer',
                contact: '9876543210',
                email: 'john@example.com',
                address: '123 Main Street, City'
            });

            const customer2 = await billingDB.addCustomer({
                name: 'Jane Smith',
                type: 'wholesaler',
                contact: '9876543211',
                email: 'jane@example.com',
                address: '456 Business Ave, Town'
            });

            // Create sample products
            const product1 = await billingDB.addProduct({
                name: 'Premium Rice',
                price: 45.00,
                quantity: 100,
                unit: 'kg',
                code: 'RICE001',
                category: 'Grains'
            });

            const product2 = await billingDB.addProduct({
                name: 'Organic Wheat',
                price: 35.00,
                quantity: 150,
                unit: 'kg',
                code: 'WHEAT001',
                category: 'Grains'
            });

            const product3 = await billingDB.addProduct({
                name: 'Pure Honey',
                price: 120.00,
                quantity: 50,
                unit: 'kg',
                code: 'HONEY001',
                category: 'Natural Products'
            });

            // Create sample bills
            const bill1 = await billingDB.addBill({
                customerId: customer1,
                subtotal: 450.00,
                discount: 5,
                discountAmount: 22.50,
                taxAmount: 76.95,
                total: 504.45,
                status: 'completed',
                createdAt: new Date().toISOString()
            });

            const bill2 = await billingDB.addBill({
                customerId: customer2,
                subtotal: 1750.00,
                discount: 10,
                discountAmount: 175.00,
                taxAmount: 283.50,
                total: 1858.50,
                status: 'completed',
                createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            });

            // Add bill items
            await billingDB.addBillItem({
                billId: bill1,
                productId: product1,
                quantity: 10,
                price: 45.00,
                total: 450.00
            });

            await billingDB.addBillItem({
                billId: bill2,
                productId: product2,
                quantity: 50,
                price: 35.00,
                total: 1750.00
            });

            console.log('Sample data created successfully');
        } catch (error) {
            console.error('Error creating sample data:', error);
        }
    }

    // Render bills
    function renderBills() {
        console.log('Step 11: Starting to render bills...');
        console.log('filteredBills length:', filteredBills.length);
        console.log('billsContainer element:', billsContainer);
        
        if (filteredBills.length === 0) {
            console.log('Step 12: No bills to render, showing empty state');
            billsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <h3 class="empty-title">No Bills Found</h3>
                    <p class="empty-description">
                        ${allBills.length === 0 ? 
                            'Start by creating your first bill for a customer.' : 
                            'No bills match your search criteria.'}
                    </p>
                    ${allBills.length === 0 ? 
                        `<button class="add-btn" onclick="window.location.href='new_bill.html'">
                            <i class="fas fa-plus"></i>
                            <span>Create First Bill</span>
                        </button>` : 
                        ''
                    }
                </div>
            `;
            console.log('Step 13: Empty state rendered');
            return;
        }

        console.log('Step 14: Rendering bill cards...');
        billsContainer.innerHTML = filteredBills.map(bill => {
            const customer = allCustomers.find(c => c.id === bill.customerId);
            const customerName = customer ? customer.name : 'Unknown Customer';
            const isSelected = selectedBills.has(bill.id);
            return `
                <div class="bill-card" data-bill-id="${bill.id}">
                    <div class="bill-row-main">
                        <span class="bill-number">#${bill.id.toString().padStart(6, '0')}</span>
                        <span class="bill-date">${formatDate(bill.createdAt)}</span>
                        <span class="bill-customer">${customerName}</span>
                        <span class="bill-status">${bill.status || 'completed'}</span>
                        <div class="bill-actions">
                            <div class="checkbox-wrapper">
                                <input type="checkbox" class="bill-checkbox" id="bill-${bill.id}" ${isSelected ? 'checked' : ''} onchange="toggleBillSelection(${bill.id})">
                            </div>
                            <button class="action-btn view" onclick="viewBill(${bill.id})" title="View Bill">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn print" onclick="printSingleBill(${bill.id})" title="Print Bill">
                                <i class="fas fa-print"></i>
                            </button>
                        </div>
                    </div>
                    <div class="bill-row-secondary">
                        <span class="bill-amount">₹${bill.total ? bill.total.toFixed(2) : '0.00'}</span>
                    </div>
                </div>
            `;
        }).join('');
        console.log(`Step 16: Rendered ${filteredBills.length} bills successfully`);
    }

    // Search functionality
    searchInput.addEventListener('input', function() {
        filterBills();
    });

    // Filter bills
    function filterBills() {
        const searchTerm = searchInput.value.toLowerCase();
        
        filteredBills = allBills.filter(bill => {
            const customer = allCustomers.find(c => c.id === bill.customerId);
            const customerName = customer ? customer.name : '';
            const billNumber = bill.id.toString().padStart(6, '0');
            
            return customerName.toLowerCase().includes(searchTerm) ||
                   billNumber.includes(searchTerm);
        });

        renderBills();
    }

    // Toggle bill selection
    window.toggleBillSelection = function(billId) {
        if (selectedBills.has(billId)) {
            selectedBills.delete(billId);
        } else {
            selectedBills.add(billId);
        }
        
        updatePrintButton();
    };

    // Update print button state
    function updatePrintButton() {
        if (selectedBills.size > 0) {
            printSelectedBtn.classList.add('active');
            printSelectedBtn.querySelector('span').textContent = `Print Selected (${selectedBills.size})`;
        } else {
            printSelectedBtn.classList.remove('active');
            printSelectedBtn.querySelector('span').textContent = 'Print Selected';
        }
    }

    // View bill details
    window.viewBill = async function(billId) {
        try {
            const bill = allBills.find(b => b.id === billId);
            if (!bill) {
                showError('Bill not found.');
                return;
            }

            currentBill = bill;
            const customer = allCustomers.find(c => c.id === bill.customerId);
            const billItems = await billingDB.getBillItems(billId);

            // Populate modal with bill details
            modalBody.innerHTML = `
                <div class="bill-detail-section">
                    <h3 class="section-title">Bill Information</h3>
                    <div class="bill-info-grid">
                        <div class="info-item">
                            <span class="info-label">Bill Number</span>
                            <span class="info-value">#${bill.id.toString().padStart(6, '0')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Customer</span>
                            <span class="info-value">${customer ? customer.name : 'Unknown'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Date</span>
                            <span class="info-value">${formatDate(bill.createdAt)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Status</span>
                            <span class="info-value">${bill.status || 'completed'}</span>
                        </div>
                    </div>
                </div>

                <div class="bill-detail-section">
                    <h3 class="section-title">Bill Items</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price (₹)</th>
                                <th>Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${billItems.map(item => {
                                const product = allProducts.find(p => p.id === item.productId);
                                return `
                                    <tr>
                                        <td>${product ? product.name : 'Unknown Product'}</td>
                                        <td>${item.quantity}</td>
                                        <td>₹${item.price.toFixed(2)}</td>
                                        <td>₹${item.total.toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="bill-detail-section">
                    <h3 class="section-title">Bill Summary</h3>
                    <div class="totals-section">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>₹${bill.subtotal ? bill.subtotal.toFixed(2) : '0.00'}</span>
                        </div>
                        <div class="total-row">
                            <span>Discount (${bill.discount || 0}%):</span>
                            <span>₹${bill.discountAmount ? bill.discountAmount.toFixed(2) : '0.00'}</span>
                        </div>
                        <div class="total-row">
                            <span>Tax (18%):</span>
                            <span>₹${bill.taxAmount ? bill.taxAmount.toFixed(2) : '0.00'}</span>
                        </div>
                        <div class="total-row">
                            <span>Final Total:</span>
                            <span>₹${bill.total ? bill.total.toFixed(2) : '0.00'}</span>
                        </div>
                    </div>
                </div>
            `;

            billModal.style.display = 'block';
        } catch (error) {
            console.error('Error loading bill details:', error);
            showError('Failed to load bill details: ' + error.message);
        }
    };

    // Print single bill
    window.printSingleBill = function(billId) {
        viewBill(billId).then(() => {
            setTimeout(() => {
                window.print();
            }, 500);
        });
    };

    // Print selected bills
    printSelectedBtn.addEventListener('click', function() {
        if (selectedBills.size === 0) {
            showError('Please select bills to print.');
            return;
        }

        // Create a new window for printing multiple bills
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Bills</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .bill { page-break-after: always; margin-bottom: 30px; }
                    .bill:last-child { page-break-after: avoid; }
                    .bill-header { text-align: center; margin-bottom: 20px; }
                    .bill-info { margin-bottom: 20px; }
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .items-table th, .items-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    .totals { text-align: right; }
                    @media print { .bill { page-break-after: always; } }
                </style>
            </head>
            <body>
        `);

        // Generate content for each selected bill
        Promise.all(Array.from(selectedBills).map(async (billId) => {
            const bill = allBills.find(b => b.id === billId);
            const customer = allCustomers.find(c => c.id === bill.customerId);
            const billItems = await billingDB.getBillItems(billId);

            return `
                <div class="bill">
                    <div class="bill-header">
                        <h2>Radha Agency Billing System</h2>
                        <h3>Bill #${bill.id.toString().padStart(6, '0')}</h3>
                    </div>
                    <div class="bill-info">
                        <p><strong>Customer:</strong> ${customer ? customer.name : 'Unknown'}</p>
                        <p><strong>Date:</strong> ${formatDate(bill.createdAt)}</p>
                    </div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price (₹)</th>
                                <th>Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${billItems.map(item => {
                                const product = allProducts.find(p => p.id === item.productId);
                                return `
                                    <tr>
                                        <td>${product ? product.name : 'Unknown Product'}</td>
                                        <td>${item.quantity}</td>
                                        <td>₹${item.price.toFixed(2)}</td>
                                        <td>₹${item.total.toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    <div class="totals">
                        <p><strong>Subtotal:</strong> ₹${bill.subtotal ? bill.subtotal.toFixed(2) : '0.00'}</p>
                        <p><strong>Discount:</strong> ₹${bill.discountAmount ? bill.discountAmount.toFixed(2) : '0.00'}</p>
                        <p><strong>Tax:</strong> ₹${bill.taxAmount ? bill.taxAmount.toFixed(2) : '0.00'}</p>
                        <p><strong>Total:</strong> ₹${bill.total ? bill.total.toFixed(2) : '0.00'}</p>
                    </div>
                </div>
            `;
        })).then(billContents => {
            printWindow.document.write(billContents.join(''));
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        });
    });

    // Close modal
    function closeModal() {
        billModal.style.display = 'none';
        currentBill = null;
    }

    closeModalBtnElement.addEventListener('click', closeModal);

    // Close modal when clicking outside
    billModal.addEventListener('click', function(e) {
        if (e.target === billModal) {
            closeModal();
        }
    });

    // Print bill button
    printBillBtn.addEventListener('click', function() {
        if (currentBill) {
            window.print();
        }
    });

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Navigation
    backBtn.addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });

    // Message functions
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    // Auto-focus on search input
    searchInput.focus();
    
    // Start page initialization
    await initializePage();
    
    console.log('Bills page initialization complete');
}); 