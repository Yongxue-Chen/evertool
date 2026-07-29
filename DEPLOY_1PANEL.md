# 如何使用 1Panel 和 GitHub 部署 evertool 到云服务器

本文档将指导你如何将 evertool 项目通过 1Panel 面板和 GitHub 部署到你的云服务器上。

## 前置准备

1.  **云服务器**：一台已经安装了 Linux 系统（如 Ubuntu, CentOS, Debian）的云服务器。
2.  **1Panel 面板**：服务器上已经安装并运行了 [1Panel](https://1panel.cn/)。
3.  **GitHub 仓库**：你的项目代码已经推送到了 GitHub 仓库（即本项目）。

## 步骤一：确保 Dockerfile 存在

本项目根目录下已经包含了一个 `Dockerfile`，用于构建 Docker 镜像。

## 步骤二：在服务器上下载代码

由于 1Panel 的“构建镜像”功能可能仅支持本地文件，我们需要先通过终端将代码下载到服务器。

1.  登录 **1Panel 面板**。
2.  点击左侧菜单的 **主机** -> **终端**。
3.  如果有连接密码请输入，进入命令行界面。
4.  **安装 Git** (如果未安装)：
    *   Debian/Ubuntu: `apt update && apt install -y git`
    *   CentOS/RedHat: `yum install -y git`
5.  **克隆代码**：
    *   创建一个目录存放代码，例如 `/opt/evertool`：
        ```bash
        mkdir -p /opt/evertool
        cd /opt/evertool
        ```
    *   使用带 Token 的 URL 克隆（因为是私有仓库）：
        ```bash
        # 格式：git clone https://<Token>@github.com/<用户名>/<仓库名>.git .
        # 注意最后有个空格和点，表示克隆到当前目录
        git clone https://<你的Token>@github.com/Yongxue-Chen/evertool.git .
        ```

## 步骤三：在 1Panel 中构建镜像

1.  在左侧菜单栏点击 **容器** -> **镜像**。
2.  点击顶部的 **构建镜像** 按钮。
3.  进行如下配置：
    *   **名称**：`evertool-app`。
    *   **Dockerfile**：选择 **路径选择** -> 找到并选中 `/opt/evertool/Dockerfile` 这个文件。
    *   **上下文**：如果需要填写，通常会自动填充或者手动填 `/opt/evertool` (即代码根目录)。如果不显示上下文选项，则只需选中 Dockerfile 即可。
    *   **点击确认** 开始构建。

## 步骤四：创建并运行容器

1.  在 **容器** 菜单下，点击 **容器** 列表。
2.  点击 **创建容器** 按钮。
3.  进行如下配置：
    *   **名称**：`evertool-container`。
    *   **镜像**：选择刚才构建好的 `evertool-app`。
    *   **端口**：点击“添加”，主机端口填写 `8080`，容器端口填写 `8080`。
    *   **重启策略**：`Always`。
4.  点击 **确认** 创建并启动容器。

## 步骤五：访问应用

防火墙放行 8080 端口后，访问 `http://服务器IP:8080`。

## 如何更新应用（当代码有变动时）

1.  **更新代码**：
    *   进入 **主机** -> **终端**。
    *   进入代码目录：`cd /opt/evertool`。
    *   拉取更新：`git pull`。
2.  **重新构建镜像**：
    *   **容器** -> **镜像** -> **构建镜像**。
    *   名称输入 `evertool-app` (保持一致)，路径选择 `/opt/evertool/dockerfile`。
    *   确认构建。
3.  **重构容器**：
    *   **容器** -> **容器** -> 找到 `evertool-container` -> **更多** -> **重构**。

## 常见问题

*   **构建失败**：检查构建路径是否正确，确保目录下有 Dockerfile。
*   **无法访问**：请务必检查云服务商的安全组设置，放行 8080 端口。
*   **关于 python:3.10-slim 镜像**：
    *   这是构建你的应用所必须的“基础镜像”。
    *   虽然 1Panel 可能显示它“未使用”（因为它是被你的应用镜像引用的底层），但**不建议删除**。
    *   如果你删除了，下次构建镜像时系统会再次自动下载它，浪费时间。保留它可以加快后续的构建速度。
*   **提示 Missing Poppler**：
    *   即使你在服务器宿主机上安装了 poppler，容器内也无法读取。
    *   **解决方案**：我们已经更新了 `Dockerfile`，请你**拉取最新代码**并**重新构建镜像**，新的镜像会自动安装 poppler。

---
祝部署顺利！
