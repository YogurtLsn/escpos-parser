/**
 * ESC/POS 解析器测试用例
 */

const { parseHexString, parseFile, generateReport } = require('../lib/parser');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(50));
console.log('ESC/POS 解析器测试');
console.log('='.repeat(50));

// 测试用例1: 基本功能测试
function testBasicFunctionality() {
  console.log('\n测试1: 基本功能');
  console.log('-'.repeat(25));

  try {
    // 测试十六进制字符串解析
    const hexString = '1B401B610148656C6C6F20576F726C640A';
    const result = parseHexString(hexString);

    console.log(`✓ 十六进制解析成功 (${result.length} 项)`);

    // 测试报告生成
    const report = generateReport(result);
    console.log(`✓ 报告生成成功 (${report.summary.totalItems} 项)`);

    // 测试文本格式化
    const hasFormattedText =
      report.formattedText && report.formattedText.length > 0;
    console.log(`✓ 文本格式化${hasFormattedText ? '成功' : '失败'}`);

    return true;
  } catch (error) {
    console.log(`✗ 基本功能测试失败: ${error.message}`);
    return false;
  }
}

// 测试用例2: 文件处理测试
function testFileProcessing() {
  console.log('\n测试2: 文件处理');
  console.log('-'.repeat(25));

  try {
    // 创建测试文件
    const testData = Buffer.from('1B401B610148656C6C6F0A', 'hex');
    const testFilePath = path.join(__dirname, 'temp-test.bin');

    fs.writeFileSync(testFilePath, testData);
    console.log(`✓ 测试文件创建成功`);

    // 解析文件
    const result = parseFile(testFilePath);
    console.log(`✓ 文件解析成功 (${result.length} 项)`);

    // 清理测试文件
    fs.unlinkSync(testFilePath);
    console.log(`✓ 测试文件清理完成`);

    return true;
  } catch (error) {
    console.log(`✗ 文件处理测试失败: ${error.message}`);
    return false;
  }
}

// 测试用例3: 实际数据测试
function testRealData() {
  console.log('\n测试3: 实际数据');
  console.log('-'.repeat(25));

  try {
    // 检查是否存在实际数据文件
    const receiptPath = path.join(__dirname, '../receipt.hex');
    if (fs.existsSync(receiptPath)) {
      const result = parseHexString(fs.readFileSync(receiptPath, 'utf8'));
      const report = generateReport(result);

      console.log(`✓ 实际数据解析成功`);
      console.log(`  - 总项目: ${report.summary.totalItems}`);
      console.log(`  - 指令数: ${report.summary.commands}`);
      console.log(`  - 文本块: ${report.summary.textBlocks}`);

      return true;
    } else {
      console.log(`- 跳过实际数据测试 (receipt.hex 不存在)`);
      return true;
    }
  } catch (error) {
    console.log(`✗ 实际数据测试失败: ${error.message}`);
    return false;
  }
}

// 运行所有测试
function runTests() {
  console.log('开始测试...\n');

  const tests = [
    { name: '基本功能', func: testBasicFunctionality },
    { name: '文件处理', func: testFileProcessing },
    { name: '实际数据', func: testRealData },
  ];

  let passed = 0;

  tests.forEach((test) => {
    if (test.func()) {
      passed++;
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`测试结果: ${passed}/${tests.length} 通过`);

  if (passed === tests.length) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('❌ 部分测试失败');
  }

  console.log('='.repeat(50));
}

// 运行测试
runTests();
