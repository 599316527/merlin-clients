# merlin clients

获取梅林固件上连接的设备列表。

```
REMOTE_HOST=192.168.1.1 PORT=8000 AUTH=xxxxxxx  node app.js

curl http://127.0.0.1:8000/clients
```

`AUTH` 为 用户名密码用冒号连接后的字符串base64编码结果。
