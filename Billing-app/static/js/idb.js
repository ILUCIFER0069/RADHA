// IndexedDB wrapper using idb library
// This file includes the idb library from CDN and provides a clean API for database operations

// Import idb library from CDN
importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js');

// Database configuration
const DB_NAME = 'RadhaBillingDB';
const DB_VERSION = 1;

// Store names
const STORES = {
    PRODUCTS: 'products',
    CUSTOMERS: 'customers',
    BILLS: 'bills',
    BILL_ITEMS: 'bill_items',
    SETTINGS: 'settings'
};

// Database schema
const DB_SCHEMA = {
    [STORES.PRODUCTS]: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'name', keyPath: 'name' },
            { name: 'code', keyPath: 'code' },
            { name: 'category', keyPath: 'category' }
        ]
    },
    [STORES.CUSTOMERS]: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'name', keyPath: 'name' },
            { name: 'type', keyPath: 'type' },
            { name: 'contact', keyPath: 'contact' }
        ]
    },
    [STORES.BILLS]: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'customerId', keyPath: 'customerId' },
            { name: 'date', keyPath: 'date' },
            { name: 'status', keyPath: 'status' }
        ]
    },
    [STORES.BILL_ITEMS]: {
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'billId', keyPath: 'billId' },
            { name: 'productId', keyPath: 'productId' }
        ]
    },
    [STORES.SETTINGS]: {
        keyPath: 'key',
        indexes: []
    }
};

// Database class
class BillingDatabase {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    // Initialize database
    async init() {
        try {
            this.db = await idb.openDB(DB_NAME, DB_VERSION, {
                upgrade: (db, oldVersion, newVersion) => {
                    console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
                    
                    // Create stores
                    Object.keys(DB_SCHEMA).forEach(storeName => {
                        if (!db.objectStoreNames.contains(storeName)) {
                            const store = db.createObjectStore(storeName, DB_SCHEMA[storeName]);
                            
                            // Create indexes
                            if (DB_SCHEMA[storeName].indexes) {
                                DB_SCHEMA[storeName].indexes.forEach(index => {
                                    store.createIndex(index.name, index.keyPath);
                                });
                            }
                        }
                    });
                },
                blocked: () => {
                    console.log('Database blocked');
                },
                blocking: () => {
                    console.log('Database blocking');
                },
                terminated: () => {
                    console.log('Database terminated');
                }
            });
            
            this.isInitialized = true;
            console.log('Database initialized successfully');
            return this.db;
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    // Get database instance
    async getDB() {
        if (!this.isInitialized) {
            await this.init();
        }
        return this.db;
    }

    // Generic CRUD operations
    async add(storeName, data) {
        const db = await this.getDB();
        return await db.add(storeName, data);
    }

    async get(storeName, key) {
        const db = await this.getDB();
        return await db.get(storeName, key);
    }

    async getAll(storeName) {
        const db = await this.getDB();
        return await db.getAll(storeName);
    }

    async put(storeName, data) {
        const db = await this.getDB();
        return await db.put(storeName, data);
    }

    async delete(storeName, key) {
        const db = await this.getDB();
        return await db.delete(storeName, key);
    }

    async clear(storeName) {
        const db = await this.getDB();
        return await db.clear(storeName);
    }

    // Product operations
    async addProduct(product) {
        const productData = {
            ...product,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return await this.add(STORES.PRODUCTS, productData);
    }

    async getProduct(id) {
        return await this.get(STORES.PRODUCTS, id);
    }

    async getAllProducts() {
        return await this.getAll(STORES.PRODUCTS);
    }

    async updateProduct(id, product) {
        const existingProduct = await this.getProduct(id);
        if (!existingProduct) {
            throw new Error('Product not found');
        }
        
        const updatedProduct = {
            ...existingProduct,
            ...product,
            updatedAt: new Date().toISOString()
        };
        return await this.put(STORES.PRODUCTS, updatedProduct);
    }

    async deleteProduct(id) {
        return await this.delete(STORES.PRODUCTS, id);
    }

    async searchProducts(query) {
        const db = await this.getDB();
        const products = await db.getAll(STORES.PRODUCTS);
        return products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            (product.code && product.code.toLowerCase().includes(query.toLowerCase()))
        );
    }

    // Customer operations
    async addCustomer(customer) {
        const customerData = {
            ...customer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return await this.add(STORES.CUSTOMERS, customerData);
    }

    async getCustomer(id) {
        return await this.get(STORES.CUSTOMERS, id);
    }

    async getAllCustomers() {
        return await this.getAll(STORES.CUSTOMERS);
    }

    async updateCustomer(id, customer) {
        const existingCustomer = await this.getCustomer(id);
        if (!existingCustomer) {
            throw new Error('Customer not found');
        }
        
        const updatedCustomer = {
            ...existingCustomer,
            ...customer,
            updatedAt: new Date().toISOString()
        };
        return await this.put(STORES.CUSTOMERS, updatedCustomer);
    }

    async deleteCustomer(id) {
        return await this.delete(STORES.CUSTOMERS, id);
    }

    async searchCustomers(query) {
        const db = await this.getDB();
        const customers = await db.getAll(STORES.CUSTOMERS);
        return customers.filter(customer => 
            customer.name.toLowerCase().includes(query.toLowerCase()) ||
            (customer.contact && customer.contact.includes(query))
        );
    }

    // Bill operations
    async addBill(bill) {
        const billData = {
            ...bill,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: bill.status || 'pending'
        };
        return await this.add(STORES.BILLS, billData);
    }

    async getBill(id) {
        return await this.get(STORES.BILLS, id);
    }

    async getAllBills() {
        return await this.getAll(STORES.BILLS);
    }

    async updateBill(id, bill) {
        const existingBill = await this.getBill(id);
        if (!existingBill) {
            throw new Error('Bill not found');
        }
        
        const updatedBill = {
            ...existingBill,
            ...bill,
            updatedAt: new Date().toISOString()
        };
        return await this.put(STORES.BILLS, updatedBill);
    }

    async deleteBill(id) {
        // Delete bill items first
        await this.deleteBillItems(id);
        return await this.delete(STORES.BILLS, id);
    }

    async getBillsByCustomer(customerId) {
        const db = await this.getDB();
        const tx = db.transaction(STORES.BILLS, 'readonly');
        const store = tx.objectStore(STORES.BILLS);
        const index = store.index('customerId');
        return await index.getAll(customerId);
    }

    // Bill items operations
    async addBillItem(billItem) {
        const billItemData = {
            ...billItem,
            createdAt: new Date().toISOString()
        };
        return await this.add(STORES.BILL_ITEMS, billItemData);
    }

    async getBillItems(billId) {
        const db = await this.getDB();
        const tx = db.transaction(STORES.BILL_ITEMS, 'readonly');
        const store = tx.objectStore(STORES.BILL_ITEMS);
        const index = store.index('billId');
        return await index.getAll(billId);
    }

    async deleteBillItems(billId) {
        const db = await this.getDB();
        const tx = db.transaction(STORES.BILL_ITEMS, 'readwrite');
        const store = tx.objectStore(STORES.BILL_ITEMS);
        const index = store.index('billId');
        const keys = await index.getAllKeys(billId);
        
        for (const key of keys) {
            await store.delete(key);
        }
    }

    // Settings operations
    async getSetting(key) {
        const setting = await this.get(STORES.SETTINGS, key);
        return setting ? setting.value : null;
    }

    async setSetting(key, value) {
        const setting = {
            key,
            value,
            updatedAt: new Date().toISOString()
        };
        return await this.put(STORES.SETTINGS, setting);
    }

    // Utility methods
    async getDatabaseInfo() {
        const db = await this.getDB();
        const info = {
            name: db.name,
            version: db.version,
            stores: []
        };

        for (const storeName of db.objectStoreNames) {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const count = await store.count();
            info.stores.push({
                name: storeName,
                count
            });
        }

        return info;
    }

    async exportData() {
        const data = {
            products: await this.getAllProducts(),
            customers: await this.getAllCustomers(),
            bills: await this.getAllBills(),
            settings: await this.getAll(STORES.SETTINGS),
            exportDate: new Date().toISOString()
        };
        return data;
    }

    async importData(data) {
        const db = await this.getDB();
        
        // Clear existing data
        await this.clear(STORES.PRODUCTS);
        await this.clear(STORES.CUSTOMERS);
        await this.clear(STORES.BILLS);
        await this.clear(STORES.BILL_ITEMS);
        await this.clear(STORES.SETTINGS);

        // Import new data
        if (data.products) {
            for (const product of data.products) {
                await this.addProduct(product);
            }
        }

        if (data.customers) {
            for (const customer of data.customers) {
                await this.addCustomer(customer);
            }
        }

        if (data.bills) {
            for (const bill of data.bills) {
                await this.addBill(bill);
            }
        }

        if (data.settings) {
            for (const setting of data.settings) {
                await this.setSetting(setting.key, setting.value);
            }
        }
    }

    // Close database
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
        }
    }
}

// Create global instance
const billingDB = new BillingDatabase();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { billingDB, STORES };
} else {
    // For browser usage
    window.billingDB = billingDB;
    window.DB_STORES = STORES;
} 