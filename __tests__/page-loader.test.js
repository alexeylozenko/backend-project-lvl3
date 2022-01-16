import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import url from 'url';
import nock from 'nock';
import downloadPage, { urlToFilename } from '../src';
import render from '../src/render.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '__fixtures__', filename);

const testHostName = 'https://host.loc';

const resources = [
  {
    url: '/assets/application.css',
    filepath: getFixturePath('application.css'),
    contentType: 'text/html',
  },
  {
    url: '/assets/professions/nodejs.png',
    filepath: getFixturePath('nodejs.png'),
    contentType: 'image/png',
  },
  {
    url: '/',
    filepath: getFixturePath('index.html'),
    contentType: 'text/html',
  },
  {
    url: '/courses',
    filepath: getFixturePath('index.html'),
    contentType: 'text/html',
  },
];

let testDir;

beforeEach(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  resources.forEach((resource) => {
    const { url, contentType, filepath } = resource;
    nock(testHostName)
      .get(url)
      .replyWithFile(200, filepath, { 'Content-Type': contentType });
  });
});

test('downloadPage', async () => {
  const filepath = await downloadPage(testHostName, testDir, render);
  const filename = urlToFilename(testHostName).concat('.html');
  const expectedFilepath = path.join(testDir, filename);
  expect(filepath).toBe(expectedFilepath);

  const pageContent = await fs.readFile(filepath, 'utf-8');
  const expectedContent = await fs.readFile(getFixturePath('expected-index.html'), 'utf-8');
  expect(pageContent.toString()).toBe(expectedContent.toString());
});

test('downloadPage invalid dir error', async () => {
  const invalidPath = path.join('/tmp', 'unknown');
  expect(downloadPage(testHostName, invalidPath))
    .rejects
    .toThrowErrorMatchingSnapshot();
});

test('downloadPage exist error', async () => {
  await downloadPage(testHostName, testDir);
  await expect(downloadPage(testHostName, testDir))
    .rejects
    .toThrowErrorMatchingSnapshot();
});

test('downloadPage not found host', async () => {
  const host = 'http://test.host';
  const pathname = '/wrongpath';
  nock(host)
    .get(pathname)
    .reply(404);
  await expect(downloadPage(`${host}${pathname}`, testDir))
    .rejects
    .toThrowErrorMatchingSnapshot();
});

test('downloadPage url invalid', async () => {
  const invalidUrl = 'testhost.loc';
  expect(() => {
    downloadPage(invalidUrl, testDir);
  }).toThrowErrorMatchingSnapshot();
});

test('test listr module', () => {
  const tasks = [
    { title: 'test task', task: () => 'test task'}
  ]
  render(tasks);
  render(tasks, true);
  expect(true).toBe(true);
})

afterEach(async () => {
  await fs.rmdir(testDir, { recursive: true });
});
