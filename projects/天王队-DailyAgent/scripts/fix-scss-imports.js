#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import * as replaceInFile from 'replace-in-file';

console.log('Starting SCSS imports migration to use @aliases...');

// 查找所有的SCSS文件
const scssFiles = await glob('src/**/*.scss');
const scssModuleFiles = await glob('src/**/*.module.scss');
const allScssFiles = [...scssFiles, ...scssModuleFiles];

console.log(`Found ${allScssFiles.length} SCSS files to process`);

// 替换模式：将'../theme/scss/_forward'样式的路径替换为'@/theme/scss/_forward'
const replaceOptions = {
  files: allScssFiles,
  from: [
    /@use\s+['"]\.\.\/theme\/scss\/_forward['"](\s+as\s+\*)?;/g,
    /@use\s+['"]\.\.\/\.\.\/theme\/scss\/_forward['"](\s+as\s+\*)?;/g,
    /@use\s+['"]\.\.\/\.\.\/\.\.\/theme\/scss\/_forward['"](\s+as\s+\*)?;/g,
    /@use\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/theme\/scss\/_forward['"](\s+as\s+\*)?;/g,
    /@import\s+['"]\.\.\/theme\/scss\/_forward['"];/g,
    /@import\s+['"]\.\.\/\.\.\/theme\/scss\/_forward['"];/g,
    /@import\s+['"]\.\.\/\.\.\/\.\.\/theme\/scss\/_forward['"];/g,
    /@import\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/theme\/scss\/_forward['"];/g,
  ],
  to: [
    '@use "@/theme/scss/_forward" as *;',
    '@use "@/theme/scss/_forward" as *;',
    '@use "@/theme/scss/_forward" as *;',
    '@use "@/theme/scss/_forward" as *;',
    '@import "@/theme/scss/_forward";',
    '@import "@/theme/scss/_forward";',
    '@import "@/theme/scss/_forward";',
    '@import "@/theme/scss/_forward";',
  ],
  countMatches: true,
};

// 执行替换
try {
  const results = await replaceInFile.replace(replaceOptions);
  console.log('SCSS imports migration completed successfully!');
  let totalChanges = 0;
  let changedFiles = 0;
  
  results.forEach(result => {
    if (result.hasChanged) {
      changedFiles++;
      totalChanges += result.numReplacements;
      console.log(`Modified: ${result.file} (${result.numReplacements} replacements)`);
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`- ${changedFiles} files modified`);
  console.log(`- ${totalChanges} import statements updated`);
  console.log(`- ${allScssFiles.length - changedFiles} files unchanged (no matching imports found)`);
} catch (error) {
  console.error('Error occurred during migration:', error);
  process.exit(1);
} 