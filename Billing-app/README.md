# Radha Agency Billing System

A comprehensive billing and inventory management system built with HTML, CSS, and JavaScript.

## Features

- **User Authentication**: Secure login system
- **Dashboard**: Overview with quick stats and navigation
- **Product Management**: Add and manage products
- **Customer Management**: Add and manage customers
- **Billing System**: Create bills with automatic calculations
- **Progressive Web App**: Works offline with service worker
- **Responsive Design**: Mobile-friendly interface

## How to Run

### Method 1: Using a Local Server (Recommended)

1. **Using Python** (if Python is installed):
   ```bash
   cd Billing-app
   python -m http.server 8000
   ```
   Then open: http://localhost:8000

2. **Using Node.js** (if Node.js is installed):
   ```bash
   cd Billing-app
   npx http-server -p 8000
   ```
   Then open: http://localhost:8000

3. **Using Live Server** (VS Code extension):
   - Install the "Live Server" extension in VS Code
   - Right-click on `index.html` and select "Open with Live Server"

### Method 2: Direct File Opening

You can also open the files directly in your browser:
- Open `Billing-app/index.html` in your browser
- Or directly open `Billing-app/Frontend/login.html`

## Login Credentials

- **Username**: admin
- **Password**: 123

## File Structure

```
Billing-app/
├── index.html                 # Entry point (redirects to login)
├── Frontend/
│   ├── login.html            # Login page
│   ├── dashboard.html        # Main dashboard
│   ├── add_product.html      # Add product form
│   ├── add_customer.html     # Add customer form
│   └── billing.html          # Billing interface
├── static/
│   ├── manifest.json         # PWA manifest
│   └── js/
│       └── service-worker.js # Service worker for offline functionality
└── README.md                 # This file
```

## Troubleshooting

### Common Issues and Solutions

1. **"Service Worker registration failed" error**
   - This is normal if you're opening files directly without a server
   - Use a local server (Method 1 above) to avoid this error

2. **"Manifest not found" error**
   - Make sure you're running from a web server, not opening files directly
   - The manifest requires HTTPS or localhost

3. **"CORS error" or "Mixed content" error**
   - Use a local server instead of opening files directly
   - Modern browsers block certain features when opening files directly

4. **Font Awesome icons not loading**
   - Check your internet connection
   - The icons are loaded from CDN

5. **Page not loading properly**
   - Clear your browser cache
   - Try opening in an incognito/private window
   - Check browser console for specific error messages

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Full support

## Features in Detail

### Dashboard
- Quick stats overview
- Navigation cards to different sections
- Responsive design for all screen sizes

### Product Management
- Add new products with validation
- Product categories and units
- Character counters and real-time validation

### Customer Management
- Add customers with contact information
- Customer type selection (Retailer/Wholesaler)
- Address and email validation

### Billing System
- Product selection with auto-pricing
- Quantity and total calculations
- Discount and tax calculations
- Bill generation and clearing

### Progressive Web App Features
- Offline functionality
- Installable on mobile devices
- Background sync (when backend is implemented)
- Push notifications (when backend is implemented)

## Development Notes

- The app is currently frontend-only
- All data is stored in browser memory (not persistent)
- Service worker provides offline caching
- No backend API is currently implemented
- Form validations are client-side only

## Future Enhancements

- Backend API integration
- Database storage
- User authentication with real backend
- Report generation
- Invoice printing
- Data export/import
- Multi-user support
- Advanced analytics

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Ensure you're using a local server
3. Try clearing browser cache
4. Check that all files are in the correct directory structure 