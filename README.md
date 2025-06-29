# ESC/POS 解析器

一个基于Node.js的ESC/POS打印机指令全解析工具，可以将ESC/POS格式的二进制数据或十六进制字符串解析为可读的格式。

## 功能特点

- 解析ESC/POS二进制数据文件
- 解析ESC/POS十六进制字符串（支持无空格格式）
- 识别常见ESC/POS指令（如初始化、对齐方式、加粗、切纸等）
- 提取并解码文本内容（支持GBK编码的中文文本）
- 小幅内容格式化显示，模拟实际打印效果
- 支持命令行API工具
- 支持输出JSON格式的解析结果

## 安装

### 全局安装

```bash
npm install -g escpos-parser
```

### 本地安装

```bash
npm install escpos-parser
```

## 使用方法

### 命令行使用

统一命令行工具提供了多种灵活的使用方式：

```bash
# 直接解析16进制字符串
escpos 1B401B610148656C6C6F20576F726C640A

# 从文件读取数据
escpos -f receipt.bin

# 从16进制文件读取，只输出格式化文本
escpos -f receipt.hex --format text

# 使用GBK编码解析并输出到文件
escpos -h "1B401B610148656C6C6F20576F726C640A" -e gbk -o result.json

# 输出JSON格式的解析结果
escpos -h "1B401B610148656C6C6F20576F726C640A" --format json -o result.json

# 只输出格式化后的打印内容
escpos -f receipt.bin --format text

# 显示帮助信息
escpos --help-examples
```

### 通过npm脚本使用

```bash
# 解析16进制字符串
npm run parse 1B401B610148656C6C6F20576F726C640A
```

### API使用

```javascript
const { parseHexString, parseFile } = require('escpos-parser');

// 解析16进制字符串（可带或不带空格）
const hexString = "1B401B610148656C6C6F20576F726C640A";
const result = parseHexString(hexString);
console.log(result);

// 解析文件
const fileResult = parseFile('receipt.bin');
console.log(fileResult);
```

## 解析结果示例

解析结果是一个数组，包含识别的命令和文本内容：

```json
[
  {
    "type": "command",
    "command": "INITIALIZE",
    "description": "初始化打印机"
  },
  {
    "type": "command", 
    "command": "ALIGN",
    "value": 1,
    "description": "设置对齐方式: 居中"
  },
  {
    "type": "text",
    "data": "Hello World",
    "text": "Hello World",
    "bytes": [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100],
    "encoding": "utf8",
    "description": "文本: \"Hello World\""
  }
]
```

## 格式化输出示例

该工具还可以将解析结果格式化为模拟实际打印效果的文本输出：

```
                  Coffee Shop
        123 Main St, City, State
        Tel: (555) 123-4567

        Date: 2024-01-15 14:30:25
        Order #: 20240115001

--------------------------------
Item                    Price
--------------------------------
Espresso                 $3.50
Cappuccino               $4.25
Blueberry Muffin         $2.75
--------------------------------
Subtotal:               $10.50
Tax (8.5%):              $0.89
--------------------------------
Total:                  $11.39

Payment: Credit Card
Card: **** **** **** 1234

Thank you for your visit!
Have a great day!

        Visit us online:
        www.coffeeshop.com

--------------------------------
 【纸张切割处】 
--------------------------------
```

## 支持的ESC/POS命令

目前支持的主要ESC/POS指令：

- ESC @ - 初始化打印机
- ESC E - 加粗模式设置
- ESC a - 对齐方式设置
- ESC d - 打印并进纸
- GS V - 切纸命令

更多命令将在后续版本中添加。

## 许可

MIT

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的ESC/POS指令解析
- 支持中文文本解析（GBK编码）
- 提供命令行工具和API接口 