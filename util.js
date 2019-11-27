const path = require('path');
const fse = require('fs-extra');

const dataDir = path.join(__dirname, 'data');
const clientsFilePath = path.join(dataDir, 'clients.json');

exports.getCookieFilePath = function () {
    return path.join(dataDir, 'cookie');
}

exports.getClients = async function () {
    let clients;
    try {
        clients = await fse.readJSON(clientsFilePath);
    }
    catch (err) {
        console.log('读取本地设备列表失败');
        return {};
    }
    return clients;
};

exports.saveClients = async function (clients) {
    let oldClients = await exports.getClients();
    clients = {
        ...oldClients,
        ...clients
    };

    await fse.ensureFile(clientsFilePath);
    await fse.writeJSON(clientsFilePath, clients);
}

exports.getClientsMtime = async function () {
    let stat = await fse.stat(clientsFilePath);
    return stat.mtime;
};
