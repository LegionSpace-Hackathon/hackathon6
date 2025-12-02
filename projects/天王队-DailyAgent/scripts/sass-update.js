// 使用 Node.js 的 fs 和 path 模块
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要处理的文件路径
const filesToProcess = [
  'src/pages/Developer/pages/member/index.scss',
  'src/pages/Developer/components/emptyPage/index.scss',
];

// 处理每个文件
filesToProcess.forEach((filePath) => {
  const fullPath = path.join(path.resolve(__dirname, '..'), filePath);

  try {
    // 读取文件内容
    const data = fs.readFileSync(fullPath, 'utf8');

    // 替换 darken() 函数
    // 将 darken(#color, percentage%) 替换为 color.adjust(#color, $lightness: -percentage%)
    const updatedContent = data.replace(
      /darken\((#[a-fA-F0-9]+),\s*(\d+)%\)/g,
      'color.adjust($1, $lightness: -$2%)'
    );

    // 在文件顶部添加 @use "sass:color";
    const finalContent =
      '@use "sass:color";\n' +
      (updatedContent.includes('@use "sass:color"') ? updatedContent : updatedContent);

    // 写回文件
    fs.writeFileSync(fullPath, finalContent, 'utf8');
    console.log(`成功更新文件: ${filePath}`);
  } catch (err) {
    console.error(`处理文件失败: ${filePath}`, err);
  }
});
