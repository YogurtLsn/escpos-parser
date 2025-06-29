/**
 * ESC/POS 指令定义
 * 支持常见的打印机指令识别和解析
 */

const COMMANDS = {
  // 初始化指令
  INITIALIZE: {
    bytes: [0x1b, 0x40],
    name: 'INITIALIZE',
    description: '初始化打印机',
    parse: () => ({
      type: 'command',
      command: 'INITIALIZE',
      description: '初始化打印机',
    }),
  },

  // 对齐方式设置
  ALIGN: {
    bytes: [0x1b, 0x61],
    name: 'ALIGN',
    description: '设置对齐方式',
    parse: (data, index) => {
      const value = data[index + 2];
      const alignments = { 0: '左对齐', 1: '居中', 2: '右对齐' };
      return {
        type: 'command',
        command: 'ALIGN',
        value: value,
        description: `设置对齐方式: ${alignments[value] || '未知'}`,
      };
    },
  },

  // 打印并进纸
  PRINT_AND_FEED: {
    bytes: [0x1b, 0x64],
    name: 'PRINT_AND_FEED',
    description: '打印并进纸',
    parse: (data, index) => {
      const lines = data[index + 2];
      return {
        type: 'command',
        command: 'PRINT_AND_FEED',
        value: lines,
        description: `打印并进纸 ${lines} 行`,
      };
    },
  },

  // 切纸命令
  CUT_PAPER: {
    bytes: [0x1d, 0x56],
    name: 'CUT_PAPER',
    description: '切纸命令',
    parse: (data, index) => {
      const mode = data[index + 2];
      const modes = { 0: '全切', 1: '半切' };
      return {
        type: 'command',
        command: 'CUT_PAPER',
        value: mode,
        description: `切纸: ${modes[mode] || '未知模式'}`,
      };
    },
  },

  // 字体设置
  FONT_SIZE: {
    bytes: [0x1d, 0x21],
    name: 'FONT_SIZE',
    description: '设置字体大小',
    parse: (data, index) => {
      const size = data[index + 2];
      const width = (size & 0xf0) >> 4;
      const height = size & 0x0f;
      return {
        type: 'command',
        command: 'FONT_SIZE',
        value: size,
        width: width + 1,
        height: height + 1,
        description: `设置字体大小: 宽度${width + 1}x 高度${height + 1}x`,
      };
    },
  },

  // 加粗设置
  BOLD: {
    bytes: [0x1b, 0x45],
    name: 'BOLD',
    description: '设置加粗',
    parse: (data, index) => {
      const enable = data[index + 2];
      return {
        type: 'command',
        command: 'BOLD',
        value: enable,
        description: enable ? '开启加粗' : '关闭加粗',
      };
    },
  },

  // 下划线设置
  UNDERLINE: {
    bytes: [0x1b, 0x2d],
    name: 'UNDERLINE',
    description: '设置下划线',
    parse: (data, index) => {
      const mode = data[index + 2];
      const modes = { 0: '关闭', 1: '1点粗', 2: '2点粗' };
      return {
        type: 'command',
        command: 'UNDERLINE',
        value: mode,
        description: `下划线: ${modes[mode] || '未知'}`,
      };
    },
  },

  // 行间距设置
  LINE_SPACING: {
    bytes: [0x1b, 0x33],
    name: 'LINE_SPACING',
    description: '设置行间距',
    parse: (data, index) => {
      const spacing = data[index + 2];
      return {
        type: 'command',
        command: 'LINE_SPACING',
        value: spacing,
        description: `设置行间距: ${spacing} 点`,
      };
    },
  },

  // 字符间距设置
  CHAR_SPACING: {
    bytes: [0x1b, 0x20],
    name: 'CHAR_SPACING',
    description: '设置字符间距',
    parse: (data, index) => {
      const spacing = data[index + 2];
      return {
        type: 'command',
        command: 'CHAR_SPACING',
        value: spacing,
        description: `设置字符间距: ${spacing} 点`,
      };
    },
  },

  // 加粗模式控制 (0x1d 0x42)
  BOLD_MODE: {
    bytes: [0x1d, 0x42],
    name: 'BOLD_MODE',
    description: '加粗模式控制',
    parse: (data, index) => {
      const enable = data[index + 2];
      return {
        type: 'command',
        command: 'BOLD_MODE',
        value: enable,
        description: enable ? '开启加粗模式' : '关闭加粗模式',
      };
    },
  },
};

/**
 * 根据字节序列查找匹配的指令
 * @param {Buffer} data - 数据缓冲区
 * @param {number} index - 当前索引
 * @returns {Object|null} 匹配的指令对象或null
 */
function findCommand(data, index) {
  for (const [key, command] of Object.entries(COMMANDS)) {
    const bytes = command.bytes;
    let match = true;

    // 检查是否有足够的字节进行匹配
    if (index + bytes.length > data.length) {
      continue;
    }

    // 逐字节比较
    for (let i = 0; i < bytes.length; i++) {
      if (data[index + i] !== bytes[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      return command;
    }
  }

  return null;
}

/**
 * 检查是否为可打印的文本字符
 * @param {number} byte - 字节值
 * @returns {boolean} 是否为可打印字符
 */
function isPrintableChar(byte) {
  // ASCII 可打印字符范围 (32-126) 或中文字符范围 (128-255)
  return (byte >= 32 && byte <= 126) || byte >= 128;
}

/**
 * 检查是否为换行符
 * @param {number} byte - 字节值
 * @returns {boolean} 是否为换行符
 */
function isNewLine(byte) {
  return byte === 0x0a || byte === 0x0d;
}

module.exports = {
  COMMANDS,
  findCommand,
  isPrintableChar,
  isNewLine,
};
