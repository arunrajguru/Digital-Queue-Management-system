Queue MySQL Project - Ready

1. Import SQL:
   - Open phpMyAdmin -> Import -> choose sql/queue_system.sql -> Go
   - This creates database 'queue_system' and seeds admin & patient users and counters.

2. Install deps and start:
   npm install
   npm start

3. Open in browser: http://localhost:5000
   - Admin: admin@example.com / admin123
   - Patient: patient@example.com / patient123

Notes:
- DB connection: models/index.js uses user 'root' with empty password on localhost.
- To change DB creds, edit models/index.js.
