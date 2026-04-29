===========================================
DERIVPRO - PROFESSIONAL TRADING PLATFORM
===========================================

COMPLETE SETUP INSTRUCTIONS
===========================================

1. UPDATE YOUR APP ID
   - Open config.js
   - Replace the APP_ID with your Deriv App ID
   - Save the file

2. GET YOUR API TOKEN
   - Log into your Deriv account
   - Go to Settings → API Token
   - Generate a new token
   - Copy the token (starts with 'deriv-...')

3. DEPLOY THE FILES
   - Upload all 10 files to your web server
   - Or run locally using a web server:
     - Python: python -m http.server 8000
     - VS Code: Use Live Server extension
     - XAMPP: Put in htdocs folder

4. ACCESS THE PLATFORM
   - Open index.html in your browser
   - Click "Get Started"
   - Enter your Deriv API token
   - Select Demo or Real account
   - Click "Connect to Deriv"

5. START TRADING
   - Navigate through Dashboard, Trading, Portfolio
   - Select a trading symbol
   - Choose CALL or PUT
   - Enter amount and duration
   - Click Execute Trade

FEATURES
===========================================

✓ Professional UI with dark theme
✓ Secure API token storage (localStorage)
✓ Real-time price feeds via WebSocket
✓ One-click trade execution
✓ Portfolio tracking
✓ Trade history
✓ Responsive design for mobile
✓ Settings persistence
✓ Auto-reconnect on disconnect

FILE STRUCTURE
===========================================

index.html      - Landing page
login.html      - Authentication page
dashboard.html  - Main trading interface
style.css       - Global styles
dashboard.css   - Dashboard styles
config.js       - App configuration (YOUR APP ID HERE)
auth.js         - Authentication logic
trading.js      - Core trading engine
script.js       - Dashboard controller
README.txt      - This file

TROUBLESHOOTING
===========================================

Q: Connection fails?
A: Check your API token and App ID. Use demo account first.

Q: Trades not executing?
A: Ensure you have sufficient balance in your Deriv account.

Q: WebSocket disconnects?
A: The app auto-reconnects. Check your internet connection.

Q: Blank screen?
A: Open browser console (F12) to see errors.

SECURITY NOTES
===========================================

- API tokens are stored in browser localStorage only
- Never share your API token with anyone
- Use demo account for testing
- Regenerate API token if compromised
- Keep your App ID private for production

SUPPORT
===========================================

For Deriv API documentation:
https://developers.deriv.com

For issues with this platform:
Check browser console for error messages

===========================================
