const querystring = require('querystring');
const fse = require('fs-extra');
const fetch = require('node-fetch');

const {getCookieFilePath, saveClients} = require('./util');

exports.runner = runner;

async function runner() {
    let clients = await getClientList();
    clients = clients.reduce(function (ret, [key, ...val]) {
        ret[key] = val;
        return ret;
    }, {});

    console.log('保存设备列表中');
    await saveClients(clients);
    console.log('保存设备列表成功');
}

async function getClientList() {
    let cookie = await getCookie();

    if (!cookie) {
        console.log('没有cookie，登录中');
        cookie = await login();
        await saveCookie(cookie);
    }

    console.log('获取设备列表中');
    let response = await fetch(getRequestURL('clients'), {
        method: 'GET',
        headers: {
            referer: getRequestURL('index'),
            cookie
        }
    });
    let content = await response.text();
    if (content.includes("top.location.href='/Main_Login.asp'")) {
        console.log('获取设备列表失败，登录失效');
        clearCookie();
        return;
    }

    let clients = getArray(content, 'wlListInfo_2g').concat(getArray(content, 'wlListInfo_5g'));
    return clients;
}

async function getCookie() {
    let content;
    try {
        content = await fse.readFile(getCookieFilePath(), 'utf8');
    }
    catch (err) {
        console.log('读取 cookie 失败');
        return null;
    }
    return content;
}

async function saveCookie(content) {
    let file = getCookieFilePath();
    await fse.ensureFile(file);
    fse.writeFile(file, content);
}

async function clearCookie() {
    await saveCookie('');
}

async function login() {
    let body = querystring.encode({
        group_id: '',
        action_mode: '',
        action_script: '',
        action_wait: 5,
        current_page: 'Main_Login.asp',
        next_page: 'index.asp',
        login_authorization: process.env.AUTH
    });

    let response = await fetch(getRequestURL('login'), {
        method: 'POST',
        headers: {
            referer: getRequestURL('Main_Login.asp'),
            'content-type': 'application/x-www-form-urlencoded'
        },
        body
    });
    if (!response.ok) {
        throw new Error('登录失败');
    }

    let cookie = response.headers.get('Set-Cookie');
    cookie = cookie.split(';').filter(str => str.includes('=')).join(';');
    return cookie;
}

function getRequestURL(key) {
    let url = `http://${process.env.REMOTE_HOST}/`;

    switch (key) {
        case 'login':
            return url + 'login.cgi';
        case 'clients':
            return url + 'update_clients.asp';
        case 'index':
            return url + 'index.asp';
        default:
            return url + key;
    }
}

function getArray(content, key) {
    let i = content.indexOf(key);
    if (i < 0) {
        return [];
    }

    i += key.length;
    let left = content.indexOf('[', i);
    if (left < 0 || left - i > 9) {
        return [];
    }

    let right;
    let count = 0;
    i = left;
    while (i < content.length) {
        if (content[i] === '[') {
            count++;
        }
        if (content[i] === ']') {
            count--;
        }

        if (count === 0) {
            right = i + 1;
            break;
        }

        i++;
    }

    if (!right) {
        return [];
    }

    return JSON.parse(content.substring(left, right));
}