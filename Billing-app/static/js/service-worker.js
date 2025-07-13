// Service Worker for Radha Agency Billing System
// Version: 1.0.0

const CACHE_NAME = 'radha-billing-v1.0.0';
const STATIC_CACHE = 'radha-billing-static-v1.0.0';
const DYNAMIC_CACHE = 'radha-billing-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    '../Frontend/login.html',
    '../Frontend/dashboard.html',
    '../Frontend/new_bill.html',
    '../Frontend/products.html',
    '../Frontend/customers.html',
    '../Frontend/reports.html',
    '../Frontend/add_product.html',
    '../Frontend/add_customer.html',
    '../Frontend/billing.html',
    '../static/manifest.json',
    '../static/icons/icon-pack/web/favicon-16x16.png',
    '../static/icons/icon-pack/web/favicon-32x32.png',
    '../static/icons/icon-pack/web/android-chrome-192x192.png',
    '../static/icons/icon-pack/web/android-chrome-512x512.png',
    '../static/icons/icon-pack/web/apple-touch-icon.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.ttf'
];

// API endpoints to cache
const API_CACHE = [
    '/api/products',
    '/api/customers',
    '/api/bills'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticFile(request)) {
        event.respondWith(cacheFirst(request));
    } else if (isApiRequest(request)) {
        event.respondWith(networkFirst(request));
    } else {
        event.respondWith(networkFirst(request));
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync-bill') {
        event.waitUntil(syncBills());
    } else if (event.tag === 'background-sync-product') {
        event.waitUntil(syncProducts());
    } else if (event.tag === 'background-sync-customer') {
        event.waitUntil(syncCustomers());
    }
});

// Push notification handler
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from Distributor Billing App',
        icon: '../static/icons/icon-pack/web/android-chrome-192x192.png',
        badge: '../static/icons/icon-pack/web/favicon-32x32.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Dashboard',
                icon: '../static/icons/icon-pack/web/android-chrome-192x192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '../static/icons/icon-pack/web/favicon-32x32.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Distributor Billing App', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('../Frontend/dashboard.html')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open dashboard
        event.waitUntil(
            clients.openWindow('../Frontend/dashboard.html')
        );
    }
});

// Helper functions
function isStaticFile(request) {
    const url = new URL(request.url);
    return STATIC_FILES.some(file => url.pathname.includes(file.split('/').pop()));
}

function isApiRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/');
}

// Cache First Strategy - for static files
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Cache first error:', error);
        return new Response('Offline content not available', { status: 503 });
    }
}

// Network First Strategy - for API requests
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache');
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return caches.match('../Frontend/login.html');
        }
        
        return new Response('Network error', { status: 503 });
    }
}

// Background sync functions
async function syncBills() {
    console.log('Service Worker: Syncing bills...');
    try {
        // Get pending bills from IndexedDB
        const pendingBills = await getPendingBills();
        
        for (const bill of pendingBills) {
            try {
                const response = await fetch('/api/bills', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bill)
                });
                
                if (response.ok) {
                    await removePendingBill(bill.id);
                    console.log('Service Worker: Bill synced successfully:', bill.id);
                }
            } catch (error) {
                console.error('Service Worker: Error syncing bill:', error);
            }
        }
    } catch (error) {
        console.error('Service Worker: Error in syncBills:', error);
    }
}

async function syncProducts() {
    console.log('Service Worker: Syncing products...');
    try {
        const pendingProducts = await getPendingProducts();
        
        for (const product of pendingProducts) {
            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(product)
                });
                
                if (response.ok) {
                    await removePendingProduct(product.id);
                    console.log('Service Worker: Product synced successfully:', product.id);
                }
            } catch (error) {
                console.error('Service Worker: Error syncing product:', error);
            }
        }
    } catch (error) {
        console.error('Service Worker: Error in syncProducts:', error);
    }
}

async function syncCustomers() {
    console.log('Service Worker: Syncing customers...');
    try {
        const pendingCustomers = await getPendingCustomers();
        
        for (const customer of pendingCustomers) {
            try {
                const response = await fetch('/api/customers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(customer)
                });
                
                if (response.ok) {
                    await removePendingCustomer(customer.id);
                    console.log('Service Worker: Customer synced successfully:', customer.id);
                }
            } catch (error) {
                console.error('Service Worker: Error syncing customer:', error);
            }
        }
    } catch (error) {
        console.error('Service Worker: Error in syncCustomers:', error);
    }
}

// IndexedDB helper functions (placeholder implementations)
async function getPendingBills() {
    // Implementation would use IndexedDB to get pending bills
    return [];
}

async function removePendingBill(id) {
    // Implementation would remove bill from IndexedDB
    console.log('Service Worker: Removed pending bill:', id);
}

async function getPendingProducts() {
    // Implementation would use IndexedDB to get pending products
    return [];
}

async function removePendingProduct(id) {
    // Implementation would remove product from IndexedDB
    console.log('Service Worker: Removed pending product:', id);
}

async function getPendingCustomers() {
    // Implementation would use IndexedDB to get pending customers
    return [];
}

async function removePendingCustomer(id) {
    // Implementation would remove customer from IndexedDB
    console.log('Service Worker: Removed pending customer:', id);
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Error handler
self.addEventListener('error', (event) => {
    console.error('Service Worker: Error:', event.error);
});

// Unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled rejection:', event.reason);
}); 