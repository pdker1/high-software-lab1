# 提交说明

## 交付内容与提交目标

项目包含源码、自动测试、示例、架构文档、真实分步 Git 历史及最终 `final` 标签。提交仓库为 [pdker1/high-software-lab1](https://github.com/pdker1/high-software-lab1)，用户已将其设为公开。用下方远端校验命令核对 main 和 final；课程截止时间尚未提供，不能据此判断是否按时提交。

## 上传 GitHub

1. 目标仓库已经创建，原始本地工程的 origin 已指向该地址。
2. 如果从 bundle 恢复到新目录，先添加远程；已有 origin 时跳过第一条命令：

```sh
git remote add origin https://github.com/pdker1/high-software-lab1.git
git push --atomic -u origin main refs/tags/final
```

3. 若提示登录，通过本机 Git 凭据管理器或浏览器完成授权，不把密码、Token、验证码粘贴到聊天或写进仓库。
4. 检查网页中多条提交、`doc/README.md` 和 `final` 标签是否存在。远端校验：

```sh
git ls-remote origin refs/heads/main refs/tags/final 'refs/tags/final^{}'
git rev-parse HEAD
git rev-parse 'final^{}'
```

带注释标签的 `final` 有独立标签对象，`final^{}` 才是它指向的提交，应与最终 HEAD 一致。

## 使用打包交付文件

原始本地工程已有 `.git`，直接在该目录运行上述命令即可。

ZIP 包含源码以及 `svg-editor.bundle` 历史备份。若换电脑或仅使用 ZIP，请先解压，在解压目录执行：

```sh
git clone svg-editor.bundle svg-editor-with-history
cd svg-editor-with-history
git remote remove origin
npm ci
npm test
```

这会恢复提交与 `final` 标签，再按上一节添加 GitHub 远程。不要只在 GitHub 网页上传源码，否则会丢失作业要求的开发历史。

## 学生复核

- 阅读架构文档并亲自运行示例，理解 Command、Composite 和快照撤销。
- 如实补充本人实际做过的复核，不把 AI 自查冒充自己的发现。
- 确认课程截止时间，并在截止前完成远端分支和标签推送。
- 如还要修改，先提交修改并重新测试；本地 `final` 尚未发布时才可将其更新到真正的最终提交。不要无故覆盖已经提交给老师的标签。
