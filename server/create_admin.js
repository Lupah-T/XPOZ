const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/anonymous_reporting')
    .then(() => {
        console.log('Connected to DB');

        rl.question('Enter new admin password: ', async (password) => {
            if (!password) {
                console.error('Password cannot be empty');
                process.exit(1);
            }

            try {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                const result = await User.findOneAndDelete({ pseudoName: 'AdminUser' });
                if (result) {
                    console.log('Existing AdminUser removed');
                }

                const admin = new User({
                    pseudoName: 'AdminUser',
                    password: hashedPassword,
                    role: 'admin',
                    isActive: true
                });

                await admin.save();
                console.log('AdminUser created successfully');
            } catch (err) {
                console.error('Error creating admin:', err);
            } finally {
                rl.close();
                mongoose.disconnect();
                process.exit();
            }
        });
    })
    .catch(err => {
        console.error('DB Connection Error:', err);
        process.exit(1);
    });
