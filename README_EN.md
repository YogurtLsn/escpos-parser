# ESC/POS Parser

English | [中文](README.md)

A comprehensive Node.js-based ESC/POS printer command parser that can convert ESC/POS format binary data or hexadecimal strings into readable formats.

## Features

- 🔍 **Complete Command Parsing**: Supports all common ESC/POS commands
- 📄 **Multiple Input Formats**: Hexadecimal strings, binary files
- 🌍 **Chinese Text Support**: Automatic GBK encoding recognition and conversion
- 🎨 **Formatted Output**: Beautiful text formatting with proper alignment
- 🛠️ **Command Line Tool**: Easy-to-use CLI interface
- 📚 **API Interface**: Programmatic access for integration
- ✅ **Comprehensive Testing**: Full test suite included

## Installation

### Global Installation

```bash
npm install -g print-escpos-parser
```

### Local Installation

```bash
npm install print-escpos-parser
```

## Usage

### Command Line Usage

After installation, you can use the `escpos` command:

```bash
# Parse hexadecimal string and output formatted text
escpos -h "1B401B610148656C6C6F20576F726C640A" --format text

# Parse hexadecimal file and output formatted text
escpos -f data.hex --format text

# Parse hexadecimal string and output JSON format result
escpos -h "1B401B610148656C6C6F20576F726C640A" --format json

# Parse binary file and output formatted text
escpos -f receipt.bin --format text

# Show help information
escpos --help
```

### API Usage

```javascript
const { parseHexString, parseFile } = require('print-escpos-parser');

// Parse hexadecimal string (with or without spaces)
const hexString = "1B401B610148656C6C6F20576F726C640A";
const result = parseHexString(hexString);
console.log(result);

// Parse file
const fileResult = parseFile('receipt.bin');
console.log(fileResult);
```

## Supported Commands

### Text Formatting
- **ESC @** - Initialize printer
- **ESC !** - Select print mode
- **ESC E** - Bold on/off
- **ESC G** - Double-strike on/off
- **ESC -** - Underline on/off

### Text Alignment
- **ESC a** - Justify (left/center/right)

### Line Spacing
- **ESC 2** - Default line spacing
- **ESC 3** - Set line spacing

### Character Encoding
- **ESC t** - Select character code table

### Paper Control
- **LF** - Line feed
- **CR** - Carriage return
- **ESC d** - Print and feed lines
- **GS V** - Cut paper

### And many more...

## Output Examples

### Formatted Text Output

```
                Coffee Shop
----------------------------------------
Espresso                          $5.50
Latte                            $6.00
----------------------------------------
                Total: $11.50

Thank you! Have a great day!
```

### JSON Output

```json
{
  "success": true,
  "items": [
    {
      "type": "command",
      "command": "ESC @",
      "description": "Initialize printer",
      "hex": "1B40"
    },
    {
      "type": "text",
      "content": "Hello World",
      "encoding": "ascii"
    }
  ],
  "report": {
    "totalCommands": 5,
    "textBlocks": 3,
    "hasChineseText": false,
    "paperCuts": 1
  }
}
```

## Command Line Options

```
Options:
  -h, --hex <string>     Parse hexadecimal string directly
  -f, --file <path>      Parse file (supports .hex and .bin files)
  --format <type>        Output format: 'json' or 'text' (default: 'json')
  -o, --output <path>    Save result to file
  -e, --encoding <type>  Force text encoding: 'gbk', 'utf8', 'ascii' (default: auto-detect)
  --help                 Show help information
  --version              Show version number
```

## API Reference

### parseHexString(hexString, options)

Parse a hexadecimal string.

**Parameters:**
- `hexString` (string): Hexadecimal string (with or without spaces)
- `options` (object, optional): Parsing options
  - `encoding` (string): Force encoding ('gbk', 'utf8', 'ascii')
  - `format` (string): Output format ('json', 'text')

**Returns:** Parsing result object

### parseFile(filePath, options)

Parse a file.

**Parameters:**
- `filePath` (string): File path (.hex or .bin file)
- `options` (object, optional): Parsing options (same as parseHexString)

**Returns:** Parsing result object

## Error Handling

The parser includes comprehensive error handling:

```javascript
try {
  const result = parseHexString("invalid-hex");
} catch (error) {
  console.error('Parsing error:', error.message);
}
```

Common error types:
- Invalid hexadecimal format
- File not found
- Unsupported encoding
- Invalid command sequence

## Testing

Run the test suite:

```bash
npm test
```

## Technical Details

### Architecture

- **Modular Design**: Clean separation of parsing logic and formatting
- **Command Recognition**: Comprehensive ESC/POS command database
- **Text Processing**: Advanced text formatting with alignment support
- **Encoding Detection**: Automatic Chinese text detection and GBK conversion

### Performance

- **Fast Parsing**: Optimized for large receipt data
- **Memory Efficient**: Streaming processing for large files
- **Error Recovery**: Graceful handling of malformed data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

- **Email**: lanilee0717@gmail.com
- **GitHub**: [YogurtLsn](https://github.com/YogurtLsn)

## Changelog

### v1.0.0
- Initial release
- Complete ESC/POS command parsing
- Chinese text support
- Command line interface
- API interface
- Comprehensive test suite

## Related Projects

- [escpos](https://www.npmjs.com/package/escpos) - ESC/POS printer driver
- [node-thermal-printer](https://www.npmjs.com/package/node-thermal-printer) - Thermal printer library

## Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/YogurtLsn/escpos-parser/issues) page
2. Create a new issue with detailed information
3. Contact the author via email

---

**Keywords**: escpos, parser, printer, receipt, pos, thermal, gbk, utf8 