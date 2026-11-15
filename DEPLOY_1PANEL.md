# 部署 evertool

用 Docker Compose 部署（不再手工 `docker run`，也不通过 1Panel 的“构建镜像”）。

```bash
git clone https://github.com/Yongxue-Chen/evertool.git && cd evertool
cp .env.example .env          # 填入 SECRET_KEY，文件权限设为 600
docker compose up -d --build
curl -fsS http://127.0.0.1:8080/ >/dev/null && echo ok
```

- 容器只监听本机 `127.0.0.1:8080`，对外访问请放在反向代理（Nginx / OpenResty）后面，
  并把代理的读超时设到 300 秒（PDF 转换较慢）。
- 没有设置 `SECRET_KEY` 时应用会拒绝启动。
- 更新：`git pull && docker compose up -d --build`。
- 回滚：更新前先 `docker image tag evertool-app:latest evertool-app:rollback-$(date +%Y%m%d)`，
  需要时把该标签改回 `latest` 再 `docker compose up -d`。
