/**
 * ESC/POS 解析器核心模块
 * 支持解析二进制数据文件和十六进制字符串
 */

const fs = require('fs');
const iconv = require('iconv-lite');
const { findCommand, isPrintableChar, isNewLine } = require('./commands');

// 常量定义
const DEFAULT_ENCODING = 'utf8';
const DEFAULT_LINE_WIDTH = 48;
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g;
const CJK_CHARS_REGEX = /[\u4e00-\u9fff\uff00-\uffef]/;

// 对齐方式枚举
const ALIGN_TYPE = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
};

/**
 * 解析十六进制字符串
 * @param {string} hexString - 十六进制字符串
 * @param {string} encoding - 文本编码格式，默认 'utf8'
 * @returns {Array} 解析结果数组
 * @throws {Error} 当输入无效时抛出错误
 */
function parseHexString(hexString, encoding = DEFAULT_ENCODING) {
  if (typeof hexString !== 'string') {
    throw new Error('输入必须是字符串类型');
  }

  // 清理十六进制字符串，移除空格、换行符等分隔符
  const cleanHex = hexString.replace(/[\s\n\r\t]/g, '');

  if (cleanHex.length === 0) {
    throw new Error('十六进制字符串不包含有效的十六进制字符');
  }

  if (cleanHex.length % 2 !== 0) {
    throw new Error('十六进制字符串长度必须为偶数');
  }

  try {
    const buffer = Buffer.from(cleanHex, 'hex');
    return parseBuffer(buffer, encoding);
  } catch (error) {
    throw new Error(`解析十六进制字符串失败: ${error.message}`);
  }
}

/**
 * 解析二进制文件
 * @param {string} filePath - 文件路径
 * @param {string} encoding - 文本编码格式，默认 'utf8'
 * @returns {Array} 解析结果数组
 * @throws {Error} 当文件不存在或读取失败时抛出错误
 */
function parseFile(filePath, encoding = DEFAULT_ENCODING) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('文件路径不能为空');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  try {
    const buffer = fs.readFileSync(filePath);
    return parseBuffer(buffer, encoding);
  } catch (error) {
    throw new Error(`读取文件失败: ${error.message}`);
  }
}

/**
 * 解析 Buffer 数据
 * @param {Buffer} buffer - 数据缓冲区
 * @param {string} encoding - 文本编码格式，默认 'utf8'
 * @returns {Array} 解析结果数组
 * @throws {Error} 当输入无效时抛出错误
 */
function parseBuffer(buffer, encoding = DEFAULT_ENCODING) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('输入必须是 Buffer 类型');
  }

  if (buffer.length === 0) {
    return [];
  }

  const result = [];
  let index = 0;

  while (index < buffer.length) {
    const parseResult = parseNextItem(buffer, index, encoding);

    if (parseResult.item) {
      result.push(parseResult.item);
    }

    index = parseResult.nextIndex;
  }

  return result;
}

/**
 * 解析下一个项目（命令或文本）
 * @param {Buffer} buffer - 数据缓冲区
 * @param {number} index - 当前索引
 * @param {string} encoding - 文本编码格式
 * @returns {Object} 包含解析项目和下一个索引的对象
 */
function parseNextItem(buffer, index, encoding) {
  // 尝试匹配ESC/POS指令
  const command = findCommand(buffer, index);

  if (command) {
    return parseCommand(buffer, index, command);
  } else {
    return parseTextData(buffer, index, encoding);
  }
}

/**
 * 解析ESC/POS命令
 * @param {Buffer} buffer - 数据缓冲区
 * @param {number} index - 当前索引
 * @param {Object} command - 命令定义对象
 * @returns {Object} 解析结果
 */
function parseCommand(buffer, index, command) {
  const parsedCommand = command.parse
    ? command.parse(buffer, index)
    : {
        type: 'command',
        command: command.name,
        description: command.description,
      };

  // 计算下一个索引位置
  let nextIndex = index + command.bytes.length;

  // 如果指令需要参数，跳过参数字节
  if (command.parse && parsedCommand.value !== undefined) {
    nextIndex += 1; // 大多数指令有1个参数字节
  }

  return {
    item: parsedCommand,
    nextIndex: nextIndex,
  };
}

/**
 * 解析文本数据
 * @param {Buffer} buffer - 数据缓冲区
 * @param {number} startIndex - 起始索引
 * @param {string} encoding - 文本编码格式
 * @returns {Object} 文本解析结果
 */
function parseTextData(buffer, startIndex, encoding) {
  const textBytes = [];
  let index = startIndex;

  // 收集连续的文本字节
  while (index < buffer.length) {
    const byte = buffer[index];

    // 检查是否遇到ESC/POS指令
    if (findCommand(buffer, index)) {
      break;
    }

    // 处理换行符
    if (isNewLine(byte)) {
      if (textBytes.length > 0) {
        break; // 遇到换行符，结束当前文本块
      } else {
        // 单独的换行符
        return {
          item: createTextItem('\n', [byte], encoding, '换行符'),
          nextIndex: index + 1,
        };
      }
    }

    // 收集可打印字符
    if (isPrintableChar(byte)) {
      textBytes.push(byte);
    } else if (textBytes.length > 0) {
      // 遇到不可打印字符，结束当前文本块
      break;
    } else {
      // 跳过单个不可打印字符
      index++;
      continue;
    }

    index++;
  }

  // 解码文本
  let item = null;
  if (textBytes.length > 0) {
    const decodedText = decodeText(textBytes, encoding);
    item = createTextItem(
      decodedText,
      textBytes,
      encoding,
      `文本: "${decodedText}"`
    );
  }

  return {
    item: item,
    nextIndex: index,
  };
}

/**
 * 创建文本项目对象
 * @param {string} text - 解码后的文本
 * @param {Array} bytes - 原始字节数组
 * @param {string} encoding - 编码格式
 * @param {string} description - 描述信息
 * @returns {Object} 文本项目对象
 */
function createTextItem(text, bytes, encoding, description) {
  return {
    type: 'text',
    data: text,
    text: text,
    bytes: bytes,
    encoding: encoding,
    description: description,
  };
}

/**
 * 解码文本字节
 * @param {Array} textBytes - 文本字节数组
 * @param {string} encoding - 编码格式
 * @returns {string} 解码后的文本
 */
function decodeText(textBytes, encoding) {
  try {
    const textBuffer = Buffer.from(textBytes);
    return iconv.decode(textBuffer, encoding);
  } catch (error) {
    // 如果指定编码失败，尝试其他编码
    return tryAlternativeEncoding(textBytes, encoding);
  }
}

/**
 * 尝试备用编码
 * @param {Array} textBytes - 文本字节数组
 * @param {string} originalEncoding - 原始编码
 * @returns {string} 解码后的文本
 */
function tryAlternativeEncoding(textBytes, originalEncoding) {
  try {
    const textBuffer = Buffer.from(textBytes);
    const alternativeEncoding = originalEncoding === 'gbk' ? 'utf8' : 'gbk';
    return iconv.decode(textBuffer, alternativeEncoding);
  } catch (e) {
    // 最后的备用方案：使用ASCII
    const maxLength = Math.min(textBytes.length, 50);
    return Buffer.from(textBytes).toString('ascii', 0, maxLength);
  }
}

/**
 * 格式化解析结果为可读文本
 * @param {Array} items - 解析结果数组
 * @param {Object} options - 格式化选项
 * @param {number} options.lineWidth - 行宽，默认48
 * @returns {string} 格式化后的文本
 */
function formatAsText(items, options = {}) {
  if (!Array.isArray(items)) {
    throw new Error('输入必须是数组类型');
  }

  const formatter = new TextFormatter(options);
  return formatter.format(items);
}

/**
 * 文本格式化器类
 */
class TextFormatter {
  constructor(options = {}) {
    this.lines = [];
    this.currentLine = '';
    this.currentAlign = ALIGN_TYPE.LEFT;
    this.isBold = false;
    this.hasUnderline = false;
    this.lineWidth = options.lineWidth || DEFAULT_LINE_WIDTH;
  }

  /**
   * 格式化项目数组
   * @param {Array} items - 项目数组
   * @returns {string} 格式化后的文本
   */
  format(items) {
    for (const item of items) {
      this.processItem(item);
    }

    // 处理最后一行
    this.finalizeLine();

    return this.lines.join('\n');
  }

  /**
   * 处理单个项目
   * @param {Object} item - 项目对象
   */
  processItem(item) {
    if (item.type === 'text') {
      this.processTextItem(item);
    } else if (item.type === 'command') {
      this.processCommandItem(item);
    }
  }

  /**
   * 处理文本项目
   * @param {Object} item - 文本项目
   */
  processTextItem(item) {
    if (!item.text) return;

    // 检查是否为纯换行符
    if (item.text === '\n' || item.text.charCodeAt(0) === 0x0a) {
      // 换行符只是结束当前行，不添加空行
      if (this.currentLine.length > 0) {
        this.addFormattedLine(this.currentLine);
        this.currentLine = '';
      }
      return;
    }

    // 清理文本内容，移除控制字符但保留空格
    let cleanText = item.text
      .replace(CONTROL_CHARS_REGEX, '')
      .replace(/!/g, '');

    // 如果清理后没有内容，直接返回
    if (cleanText.length === 0) {
      return;
    }

    // 普通文本，直接添加到当前行
    this.currentLine += cleanText;
  }

  /**
   * 处理命令项目
   * @param {Object} item - 命令项目
   */
  processCommandItem(item) {
    switch (item.command) {
      case 'ALIGN':
        this.currentAlign = item.value || ALIGN_TYPE.LEFT;
        break;

      case 'BOLD':
      case 'BOLD_MODE':
        this.isBold = item.value > 0;
        break;

      case 'UNDERLINE':
        this.hasUnderline = item.value > 0;
        break;

      case 'PRINT_AND_FEED':
      case 'LINE_FEED':
        // 完成当前行
        if (this.currentLine.length > 0) {
          this.addFormattedLine(this.currentLine);
          this.currentLine = '';
        }
        // 根据进纸行数添加空行，但只在多行进纸时添加
        const feedLines = item.value || 1;
        if (feedLines > 1) {
          for (let i = 1; i < feedLines; i++) {
            this.lines.push('');
          }
        }
        // 如果上一行是分隔线，添加一个空行提高可读性
        if (
          this.lines.length > 0 &&
          this.lines[this.lines.length - 1].includes('---')
        ) {
          this.lines.push('');
        }
        break;

      case 'CUT_PAPER':
        this.processCutPaperCommand();
        break;

      case 'INITIALIZE':
        this.processInitializeCommand();
        break;

      case 'FONT_SIZE':
        // 字体大小变化，暂时不做特殊处理
        break;

      default:
        // 其他命令不影响文本输出
        break;
    }
  }

  /**
   * 处理切纸命令
   */
  processCutPaperCommand() {
    if (this.currentLine.length > 0) {
      this.addFormattedLine(this.currentLine);
      this.currentLine = '';
    }

    // 添加多个空行
    for (let i = 0; i < 6; i++) {
      this.lines.push('');
    }

    // 添加切纸分隔线
    this.lines.push('-'.repeat(this.lineWidth));
    this.lines.push(' 【纸张切割处】 ');
    this.lines.push('-'.repeat(this.lineWidth));
  }

  /**
   * 处理初始化命令
   */
  processInitializeCommand() {
    if (this.currentLine.length > 0) {
      this.addFormattedLine(this.currentLine);
    }

    this.resetFormat();
  }

  /**
   * 重置格式设置
   */
  resetFormat() {
    this.currentLine = '';
    this.currentAlign = ALIGN_TYPE.LEFT;
    this.isBold = false;
    this.hasUnderline = false;
  }

  /**
   * 添加格式化的行
   * @param {string} text - 文本内容
   */
  addFormattedLine(text) {
    const formattedLine = this.formatLine(text);
    this.lines.push(formattedLine);
  }

  /**
   * 格式化单行文本
   * @param {string} text - 原始文本
   * @returns {string} 格式化后的文本
   */
  formatLine(text) {
    let formattedText = text;

    // 添加样式效果
    formattedText = this.applyTextStyles(formattedText);

    // 应用对齐效果
    return this.applyAlignment(text, formattedText);
  }

  /**
   * 应用文本样式
   * @param {string} text - 文本
   * @returns {string} 应用样式后的文本
   */
  applyTextStyles(text) {
    let styledText = text;

    if (this.isBold) {
      styledText = `【${styledText}】`;
    }

    if (this.hasUnderline) {
      styledText = `_${styledText}_`;
    }

    return styledText;
  }

  /**
   * 应用对齐效果
   * @param {string} originalText - 原始文本
   * @param {string} styledText - 应用样式后的文本
   * @returns {string} 最终格式化的文本
   */
  applyAlignment(originalText, styledText) {
    // 如果文本已经包含空格对齐，直接返回
    if (originalText.startsWith(' ')) {
      return styledText;
    }

    const textWidth = this.getTextWidth(styledText);

    switch (this.currentAlign) {
      case ALIGN_TYPE.CENTER:
        const centerPadding = Math.max(
          0,
          Math.floor((this.lineWidth - textWidth) / 2)
        );
        return ' '.repeat(centerPadding) + styledText;

      case ALIGN_TYPE.RIGHT:
        const rightPadding = Math.max(0, this.lineWidth - textWidth);
        return ' '.repeat(rightPadding) + styledText;

      case ALIGN_TYPE.LEFT:
      default:
        return styledText;
    }
  }

  /**
   * 计算文本显示宽度
   * @param {string} text - 文本
   * @returns {number} 显示宽度
   */
  getTextWidth(text) {
    let width = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      // 中文字符、全角字符等占2个宽度
      width += CJK_CHARS_REGEX.test(char) ? 2 : 1;
    }
    return width;
  }

  /**
   * 完成最后一行的处理
   */
  finalizeLine() {
    if (this.currentLine.length > 0) {
      this.addFormattedLine(this.currentLine);
    }
  }
}

/**
 * 生成详细的解析报告
 * @param {Array} parseResult - 解析结果数组
 * @returns {Object} 详细报告对象
 */
function generateReport(parseResult) {
  if (!Array.isArray(parseResult)) {
    throw new Error('输入必须是数组类型');
  }

  const summary = generateSummary(parseResult);

  return {
    summary: summary,
    items: parseResult,
    formattedText: formatAsText(parseResult),
  };
}

/**
 * 生成摘要信息
 * @param {Array} parseResult - 解析结果数组
 * @returns {Object} 摘要对象
 */
function generateSummary(parseResult) {
  const summary = {
    totalItems: parseResult.length,
    commands: 0,
    textBlocks: 0,
    totalBytes: 0,
  };

  for (const item of parseResult) {
    if (item.type === 'command') {
      summary.commands++;
    } else if (item.type === 'text') {
      summary.textBlocks++;
      summary.totalBytes += item.bytes ? item.bytes.length : 0;
    }
  }

  return summary;
}

// 导出模块
module.exports = {
  parseHexString,
  parseFile,
  parseBuffer,
  formatAsText,
  generateReport,

  // 导出常量供测试使用
  ALIGN_TYPE,
  DEFAULT_ENCODING,
  DEFAULT_LINE_WIDTH,
};
