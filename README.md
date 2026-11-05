# SVG Editor — Lab1 Phase 1

TypeScript 面向对象 SVG 命令行编辑器。支持六种图形、嵌套分组、属性编辑、层叠顺序、撤销重做以及 SVG 保存和读入。

## 快速运行

需要 Node.js 22 或更高版本和 npm。在工程目录运行：

```sh
npm ci
npm test
npm run cli
```

已提供 `package-lock.json` 固定依赖。交互提示符为 `svg>`，输入 `help` 查看命令；按 Ctrl+C 结束。

```text
init
create g scene
create rect r1 10 20 100 50 #4a90d9 in scene
create text t1 20 50 "Hello SVG" in scene
move scene 30 0
undo
redo
save demo.svg
```

生成的 SVG 可直接在浏览器打开。`save`、`read`、`init`、修改尺寸的 `canvas` 会清空历史并禁止撤销，直到下一条成功的编辑命令。`canvas` 查询不影响历史。保存后不带参数的 `save` 会复用路径。

## 脚本回放

PowerShell（Windows）：

```powershell
npm run build
Get-Content -Encoding utf8 examples/flowchart.txt | node dist/src/main.js
```

macOS / Linux：

```sh
npm run build
node dist/src/main.js < examples/flowchart.txt
```

若旧版 Windows PowerShell 的管道出现中文乱码，先执行 `$OutputEncoding = [System.Text.UTF8Encoding]::new()`。流程图输出为 `examples/generated-flowchart.svg`。示例中的最后一次 `undo` 会按题目要求打印错误，这是预期行为。导入自动补 id 可用 `read examples/other.svg` 验证。

## 命令与参数

| 命令 | 语法 |
|---|---|
| 文档 | `init [w] [h]`、`read <file>`、`save [file]`、`canvas [w h]` |
| 创建 | `create <type> <id> <params...> [in <gid>]` |
| 编辑 | `delete <id>`、`move <id> <dx> <dy>`、`scale <id> <factor>`、`set <id> <attr> <value>` |
| 分组 | `group <newGid> <id1> [id2...]`、`ungroup <gid>`、`addto <gid> <id>` |
| 顺序 | `front <id>`、`back <id>` |
| 查看 | `tree [id]`、`show <id>`、`help` |
| 历史 | `undo`、`redo` |

创建参数：`rect x y w h [fill]`；`circle cx cy r [fill]`；`ellipse cx cy rx ry [fill]`；`line x1 y1 x2 y2 [stroke]`；`text x y "内容"`；`g` 无几何参数。

`set` 支持公共 `fill` / `stroke` / `stroke-width`、对应形状的几何属性，以及 text 的 `text`。矩形宽高使用 `width` / `height`。省略颜色就不写该属性，遵循 SVG 默认值。仅整行开头的 `#` 是注释，因此十六进制颜色正常使用。双引号包围带空格的内容或路径，支持 `\"` 与 `\\` 转义。

## 范围与明确约定

- `box` 不属于本阶段；`create box` 返回题目要求的 unknown shape type 错误。
- `group` 以原文档先序顺序保留成员顺序。成员同父时在首个成员位置建立分组；跨父时建立根级分组。题目未明确的跨父放置位置在这里显式约定。
- `ungroup` 禁止解散根级容器；内层容器的孩子按原顺序提升。移动归属后采用新父容器的样式继承，容器被解散后其自身样式消失。
- `front` 放到同级数组尾部（最后绘制、视觉最前）；`back` 放到首部。
- `scale` 按题目规则缩放几何属性，不修改文本字体大小或线宽。导入 SVG 的 `transform` 属于 SVG 渲染语义，支持平移和正数等比缩放，并将相关字体大小、线宽展开到结果。
- SVG 支持上述六种标签、常见文字/描边展示属性、零原点且与画布尺寸相同的 viewBox。图形几何值为有限数值；根宽高可带 px。字体/线宽的变换展开支持数值或 px，不支持百分比、em、CSS 样式表、路径、旋转、非等比缩放、滤镜或完整 SVG 标准。无法表达的结构和属性明确报错，保留原文档。
- `g data-kind="box"` 读入为普通 `g` 并警告。外部 SVG 的缺失 id 先避开全文所有显式 id，再自动生成。
- 撤销反馈采用 `undone:` / `redone:` 加原操作摘要；状态会准确恢复，文字不逐字复刻题目示例。
- 快照撤销为 O(历史长度 × 文档大小)，适合本实验；大文件或深递归文档需另行优化。

## 文档与提交

架构、PlantUML 图、设计模式、依赖约束、过程记录和质量自查见 [doc/README.md](doc/README.md)。GitHub 提交流程及剩余事项见 [doc/SUBMISSION.md](doc/SUBMISSION.md)。

本地代码由 AI 助手实际分步开发并提交，提交者为 `Codex AI Assistant <codex@localhost>`，未伪造学生身份。用户复核或修改代码时可设置自己的 Git 提交信息。
