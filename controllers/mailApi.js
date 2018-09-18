const path = require('path'),
    nodeMailer = require('nodemailer'),
    fs = require('fs'),
    ejs = require('ejs');

exports.sendSupportEmail = (user, support_object) => {
    let to_email = 'aisrani@kalhatti.com, deepaj@kalhatti.com', //'support@drivewealth.com',
        subject = 'Drivewealth Support',
        to_name = 'Drivewealth';
    if (support_object.type == 'KH') {
        // to_email = 'ofsajan@gmail.com';
        to_email = 'support@kalhatti.com';
        subject = 'Kalhatti Support';
        to_name = 'Kalhatti';
    }
    let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'support@kalhatti.com',
            pass: 'K0lS0pp0rt#123'
        }
    });

    return new Promise((resolve, reject) => {
        let template = fs.readFileSync('./public/mail/support.ejs', {
            encoding: 'utf-8'
        });
        console.log(user.email_id);
        let name = user.email_id.split('@')[0];
        if (user.first_name != null && user.last_name != null) {
            name = `${user.first_name} ${user.last_name}`;
        }
        let mailOptions = {
            from: `${name} <${user.email_id}>`, // sender address
            to: `${to_email}`, // list of receivers
            subject: subject, // Subject line
            text: support_object.message, // plain text body
            replyTo: `${user.email_id}`,
            sender: `${user.email_id}`,
            html: ejs.render(template, {
                message: support_object.message,
                title: subject
            }) //`<p>${support_object.message}</p>` // html body
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                reject(error);
            }
            console.log('info ', info);
            resolve(info);
        });
    });
};
