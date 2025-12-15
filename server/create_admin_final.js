const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Relative to server folder
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/anonymous_reporting')
    .then(async () => {
        console.log('Connected to DB');
        const salt = await bcrypt.genSalt(10);
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await User.findOneAndDelete({ pseudoName: 'AdminUser' });

        const admin = new User({
            pseudoName: 'AdminUser',
            password: hashedPassword,
            role: 'admin',
            isActive: true
        });
        
        await admin.save();
        console.log('AdminUser created in server dir. Password:', password);
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
