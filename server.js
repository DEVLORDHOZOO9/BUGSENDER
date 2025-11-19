const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    console.log('MESSAGE RECEIVED', msg);
});

client.initialize();

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('sendBug', (targetNumber) => {
        console.log('Sending bug to', targetNumber);
        const chatId = targetNumber.substring(1) + "@c.us";
        let count = 0;

        const interval = setInterval(() => {
            const message = "BUG: " + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            client.sendMessage(chatId, message).then(() => {
                count++;
                socket.emit('status', `Bug sent: ${count}`);
            }).catch(err => {
                console.error('Error sending message', err);
                socket.emit('status', 'Error sending bug: ' + err.message);
                clearInterval(interval);
            });

            if (count >= 100) {
                clearInterval(interval);
                socket.emit('status', 'Bug sending complete.');
            }
        }, 100); // Kirim setiap 100ms
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const port = 8080;
server.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
