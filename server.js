const express = require('express');
const path = require('path');
const cors = require('cors');
const { sequelize, Counter, User } = require('./models');
const createQueueRoutes = require('./routes/queue');
const authRoutes = require('./routes/auth');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); // Import nodemailer

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SERVICES = ['general', 'billing'];
const AVG_SERVICE_MINUTES = 5;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// --- Email Transporter Setup (for Gmail) ---
// This uses Nodemailer to connect to Gmail's SMTP server.
// IMPORTANT: You must use an App Password from your Google Account settings,
// not your regular Gmail password.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your_email@gmail.com', // Replace with your Gmail address
        pass: 'your_app_password'     // Replace with your generated App Password
    }
});

// --- Function to send the email notification ---
async function sendTurnNotification(email, tokenNumber) {
    const mailOptions = {
        from: 'your_email@gmail.com', // Your email address
        to: email,
        subject: 'Your Turn is Coming Up!',
        text: `Hello, your token number ${tokenNumber} is next in line. Please proceed to the counter. Thank you for your patience.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email notification sent to ${email} for token ${tokenNumber}.`);
    } catch (error) {
        console.error(`❌ Error sending email to ${email}:`, error);
    }
}

sequelize.sync().then(async () => {
    console.log('✅ MySQL DB synced');

    for (const svc of SERVICES) {
        await Counter.findOrCreate({
            where: { service: svc },
            defaults: { lastNumber: 0, nowServing: 0 }
        });
    }

    const admin = await User.findOne({ where: { email: 'admin@example.com' } });
    if (!admin) {
        const hash = await bcrypt.hash('admin123', 10);
        await User.create({
            name: 'Admin',
            email: 'admin@example.com',
            mobile: '9999999999',
            passwordHash: hash,
            role: 'admin'
        });
        console.log('✅ Default admin created (admin@example.com / admin123)');
    }

    const patient = await User.findOne({ where: { email: 'patient@example.com' } });
    if (!patient) {
        const hash = await bcrypt.hash('patient123', 10);
        await User.create({
            name: 'Patient One',
            email: 'patient@example.com',
            mobile: '8888888888',
            passwordHash: hash,
            role: 'patient'
        });
  // ... (other code)

sequelize.sync({ force: true }).then(async () => {
  console.log('✅ MySQL DB synced');
  // ... (rest of the sync block)
}).catch(err => {
  console.error('❌ DB sync error', err);
});

// ... (other code)

// --- Pass the email function to the queue routes ---
app.use('/api/auth', authRoutes);
app.use('/api/queue', createQueueRoutes(SERVICES, AVG_SERVICE_MINUTES, sendTurnNotification));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));