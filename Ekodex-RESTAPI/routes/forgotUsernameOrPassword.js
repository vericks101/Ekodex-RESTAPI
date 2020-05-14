const crypto = require('crypto');
const User = require('../models/User');
const router = require('express').Router();
const nodemailer = require('nodemailer');

require('dotenv').config();

router.post('/', (req, res) => {
    // If email exists, send reset link else send back an error response.
    User.findOne({ 
        email: req.body.email 
    }).then(async (user) => {
        if (user === null) {
            res.status(403).send('email not in db.');
        } else {
            const token = crypto.randomBytes(20).toString('hex');

            // Set reset timeout to an hour from now.
            var dt = new Date();
            dt.setHours(dt.getHours() + 1);
            user.resetPasswordExpires = dt;
            user.resetPasswordToken = token;
            await user.save();

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: `${process.env.EMAIL_ADDRESS}`,
                    pass: `${process.env.EMAIL_PASSWORD}`,
                },
            });

            const mailOptions = {
                from: 'noreplyekodex@gmail.com',
                to: `${user.email}`,
                subject: 'Link to Reset Password',
                text:
                    'You are receiving this because you (or someone else) have requested the username and or reset of the password for your account.\n\n'
                    + 'Your username is: ' + `${user.username}` + '\n\n'
                    + 'Please click on the following link, or paste this into your browser to complete the process:\n\n'
                    + `http://localhost:3000/reset/${token}\n\n`
                    + 'Please take note that this link will expire after some time.\n\n'
                    + 'If you did not request this, please ignore this email and your password will remain unchanged.\n',
            };

            transporter.sendMail(mailOptions, (err, response) => {
                if (err) {
                    res.status(400).send(err);
                } else {
                    res.status(200).json('recovery email sent.');
                }
            });
        }
    });
});

module.exports = router;