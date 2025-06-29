#!/usr/bin/env node

/**
 * ESC/POS 解析器命令行工具
 * 支持多种灵活的使用方式
 */

const { program } = require('commander');
const { parseHexString, parseFile, generateReport } = require('../lib/parser');
const fs = require('fs');
const path = require('path');

// 从package.json中读取版本号
const packageJson = require(path.join(__dirname, '../package.json'));

program
  .name('escpos')
  .description('ESC/POS 打印机指令解析工具')
  .version(packageJson.version);

// 直接解析16进制字符串
program
  .argument('[hexString]', '16进制字符串（可选）')
  .option('-f, --file <path>', '从文件读取数据')
  .option('-h, --hex <hexString>', '指定16进制字符串')
  .option('-e, --encoding <encoding>', '指定文本编码', 'gbk')
  .option('-o, --output <file>', '输出到文件')
  .option(
    '--format <type>',
    '输出格式: text(纯文本), json(JSON格式), 默认为详细格式',
    'detailed'
  )
  .option('--help-examples', '显示使用示例')
  .action((hexString, options) => {
    // 显示使用示例
    if (options.helpExamples) {
      showExamples();
      return;
    }

    let result;

    try {
      if (options.file) {
        // 从文件解析
        if (options.format !== 'text') {
          console.log(`正在解析文件: ${options.file}`);
        }

        // 检查文件扩展名，如果是 .hex 文件，作为十六进制字符串处理
        if (options.file.toLowerCase().endsWith('.hex')) {
          const hexContent = fs.readFileSync(options.file, 'utf8');
          result = parseHexString(hexContent, options.encoding);
        } else {
          // 作为二进制文件处理
          result = parseFile(options.file, options.encoding);
        }
      } else if (options.hex || hexString) {
        // 从十六进制字符串解析
        const hex = options.hex || hexString;
        if (options.format !== 'text') {
          console.log(
            `正在解析16进制字符串: ${hex.substring(0, 50)}${
              hex.length > 50 ? '...' : ''
            }`
          );
        }
        result = parseHexString(hex, options.encoding);
      } else {
        console.error('错误: 请指定要解析的数据源');
        console.log('使用 --help-examples 查看使用示例');
        process.exit(1);
      }

      // 生成报告
      const report = generateReport(result);
      let output;

      // 根据选项输出结果
      if (options.format === 'text') {
        output = report.formattedText;
      } else if (options.format === 'json') {
        output = JSON.stringify(report, null, 2);
      } else {
        // 默认格式：显示详细解析结果
        const lines = [];
        lines.push('='.repeat(60));
        lines.push('ESC/POS 解析结果');
        lines.push('='.repeat(60));
        lines.push(`总项目数: ${report.summary.totalItems}`);
        lines.push(`指令数量: ${report.summary.commands}`);
        lines.push(`文本块数: ${report.summary.textBlocks}`);
        lines.push(`文本字节: ${report.summary.totalBytes}`);
        lines.push('');
        lines.push('详细解析结果:');
        lines.push('-'.repeat(40));

        report.items.forEach((item, index) => {
          if (item.type === 'command') {
            lines.push(`${index + 1}. ${item.description}`);
            if (item.value !== undefined) {
              lines.push(`  值: ${item.value}`);
            }
          } else if (item.type === 'text') {
            lines.push(`${index + 1}. 文本: "${item.text}"`);
            lines.push(
              `  字节: ${item.bytes
                .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
                .join(' ')}`
            );
          }
        });

        lines.push('');
        lines.push(report.formattedText);
        output = lines.join('\n');
      }

      // 输出结果
      if (options.output) {
        try {
          fs.writeFileSync(options.output, output, 'utf8');
          console.log(`结果已保存到: ${options.output}`);
        } catch (error) {
          console.error(`保存文件失败: ${error.message}`);
          process.exit(1);
        }
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error(`解析错误: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * 显示使用示例
 */
function showExamples() {
  console.log(`
ESC/POS 解析器使用示例:

## 命令行使用

# 直接解析16进制字符串
escpos 1B401B610148656C6C6F20576F726C640A

# 从文件读取数据
escpos -f receipt.bin

# 从16进制文件读取，并格式化输出
escpos -f receipt.hex --format text

# 使用GBK编码解析并输出到文件
escpos -h "1B401B610148656C6C6F20576F726C640A" -e gbk -o result.json

# 指定16进制字符串，保存结果到文件
escpos -h "1B401B610148656C6C6F20576F726C640A" -o result.json --format json

# 只输出格式化后的打印内容
escpos -f receipt.bin --format text

## 通过npm脚本使用

# 解析16进制字符串
npm run parse 1B401B610148656C6C6F20576F726C640A

## API使用

\`\`\`javascript
const { parseHexString, parseFile } = require('escpos-parser');

// 解析16进制字符串（可带或不带空格）
const hexString = "1B401B610148656C6C6F20576F726C640A";
const result = parseHexString(hexString);
console.log(result);

// 解析文件
const fileResult = parseFile('receipt.bin');
console.log(fileResult);
\`\`\`

更多命令选项请使用 --help 查看。
`);
}

// 解析命令行参数
program.parse();
