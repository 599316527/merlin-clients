const fse = require('fs-extra');
const express = require('express');
const {runner} = require('./collect');
const {getClients, getClientsMtime} = require('./util');

setInterval(runner, 3 * 60 * 1000);
runner();

const app = express();

app.get('/clients', async function (req, res) {
    let clients = await getClients();
    let mtime = (await getClientsMtime()).toUTCString();
    res.type('.json').send(JSON.stringify({
        mtime,
        clients
    }, null, 4));
});

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(process.env.PORT, function () {
    console.log(`App listening on port ${process.env.PORT}!`);
});
