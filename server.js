const express = require('express')
const proxy = require('express-http-proxy');
const path = require('path');
const fs = require('fs');
const app = express()
const port = 3000
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

fs.watchFile(path.join(__dirname, "structure_files/conf.oxdna"), 
        { interval: 507 }, (a, b) => {
    console.log("Emitting file change...")
    io.emit("file_change"); // Tell the client the file has changed
})

io.on('connection', (socket) => {
    console.log("Client connected.");
    // receive a message from the client
    socket.on('message', (msg) => {
      console.log('message: ' + msg);
    });
});

app.get('/api/topology', (req, res) => {
    res.download(path.join(__dirname, "structure_files/topology.top"), "topology.top");
})

app.get('/api/conformation', (req, res) => {
    res.download(path.join(__dirname, "structure_files/conf.oxdna"), "conf.oxdna");
})

app.use('/', proxy('localhost:8080'));

server.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
