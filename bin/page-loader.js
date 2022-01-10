import { Command } from 'commander';
import downloadPage from '../src/index.js';
import render from '../src/render.js';

const programm = new Command();

programm
  .version('1.0.0')
  .arguments('<url>')
  .description('tool for download page')
  .option('-o, --output [output]', 'output for download')
  .action((pageUrl, option) => {
    downloadPage(pageUrl, option.output, render);
  })
  .parse();
