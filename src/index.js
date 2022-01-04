import cheerio from 'cheerio';
import path from 'path';
import fs from 'fs/promises';
import debug from 'debug';
import axios from './lib/AxiosAdapter';

const loggerHttp = debug('page-loader:http');
const loggerError = debug('page-loader:error');
const loggerInfo = debug('page-loader:info');
const loggerFs = debug('page-loader:fs');

const checkAccessDir = (dirpath) => {
  loggerFs(`check access dir ${dirpath} %s`);
  return fs.access(dirpath).then(() => {
    loggerFs(`access directory ${dirpath} %s`);
  })
    .catch((error) => {
      loggerError(`access dir error ${dirpath}`);
      throw error;
    });
};

const createResourceDir = (dirname) => fs.mkdir(dirname)
  .then(() => {
    loggerFs(`created resource directory ${dirname} %s`);
  })
  .catch(() => {
    loggerError(`errro create resource directory ${dirname}`);
    throw new Error('EEXIST: directory is alredy exist');
  });

export const urlToFilename = (pageUrl) => {
  const { hostname, pathname } = new URL(pageUrl);
  const filepath = path.parse(`${hostname}${pathname}`);
  if (filepath.dir !== '') {
    return (filepath.ext === '')
      ? `${filepath.dir}/${filepath.name}`.replace(/\W/g, '-').concat('.html')
      : `${filepath.dir}/${filepath.name}`.replace(/\W/g, '-').concat(filepath.ext);
  }
  return `${filepath.name}`.replace(/\W/g, '-').concat(`${filepath.ext}`);
};

const writeFile = (filepath, data, options = { encoding: 'utf-8' }) => {
  loggerFs(`writting to file ${filepath} %s`);
  return fs.writeFile(filepath, data, options)
    .then(() => {
      loggerFs(`writed to file ${filepath} %s`);
    })
    .catch((error) => {
      loggerError(`error write to file ${filepath}`);
      throw new Error(`${error.code}`);
    });
};

const tasks = [];

const downloadPage = (url) => {
  loggerHttp(`downloading from ${url} %s`);
  return axios.get(url).then((response) => {
    loggerHttp(`downloaded page from ${url} %s`);
    return response;
  })
    .catch((error) => {
      loggerError(`not found url ${url}`);
      throw error;
    });
};

const downloadTextResource = (url, filepath) => {
  loggerHttp(`downloading resource from ${url} %s`);
  return axios.get(url)
    .then((response) => {
      loggerHttp(`downloaded resource from ${url} %s`);
      return writeFile(filepath, response.data);
    })
    .catch((error) => {
      loggerError(`error download resource from ${url}`);
      throw error;
    });
};

const downloadBinaryResource = (url, filepath) => {
  loggerHttp(`download resource from ${url}`);
  return axios.get(url, { responseType: 'stream' })
    .then((response) => {
      loggerHttp(`downloaded resource from ${url} %s`);
      return writeFile(filepath, response.data, { encoding: 'binary' });
    })
    .catch((error) => {
      loggerError(`error download resource from ${url}`);
      throw error;
    });
};

const resourcesType = {
  link: { attrName: 'href', download: downloadTextResource },
  img: { attrName: 'src', download: downloadBinaryResource },
  script: { attrName: 'src', download: downloadTextResource },
};

const downloadResources = (data, outputDir, render) => {
  const { resources } = data;
  const promises = resources.map(({ url, download }) => {
    const filepath = path.join(outputDir, urlToFilename(url));
    const promise = download(url, filepath);
    tasks.push({ title: url, task: () => promise });
    return promise;
  });
  render(tasks);
  return Promise.all(promises).then(() => data.html);
};

const isLocalResource = (url) => (!url.startsWith('http:') || !url.startsWith('https:'));

const processTag = ($dom, tagName, resourceDirname, pageUrl) => {
  const { hostname } = new URL(pageUrl);
  const resources = [];
  const { attrName } = resourcesType[tagName];
  const selector = `${tagName}[${attrName}]`;
  $dom(selector).each((index, element) => {
    let link = $dom(element).attr(attrName);
    if (isLocalResource(link)) {
      link = new URL(link, pageUrl);
    }
    if (link.hostname !== null && link.hostname === hostname) {
      resources.push({ ...resourcesType[tagName], url: link.href });
      const fileName = urlToFilename(link.href);
      const localResourceLink = path.join(resourceDirname, fileName);
      $dom(element).attr(attrName, localResourceLink);
    }
  });
  return resources;
};

const searchLocalResources = (html, resourceDirname, pageUrl) => {
  const $dom = cheerio.load(html);
  const tags = Object.keys(resourcesType);
  loggerInfo('searching link of the local resources');
  const resources = tags
    .reduce((acc, tag) => [...acc, ...processTag($dom, tag, resourceDirname, pageUrl)], []);
  loggerInfo('Received local links of the local resources');
  return { html: $dom.html(), resources };
};

export default (pageUrl, outputDir, render = () => {}) => {
  const fileName = urlToFilename(pageUrl);
  const pageName = fileName.concat('.html');
  const resourceDirname = fileName.concat('_file');
  const resourceDirpath = path.resolve(outputDir, resourceDirname);

  return checkAccessDir(outputDir)
    .then(() => createResourceDir(resourceDirpath))
    .then(() => downloadPage(pageUrl))
    .then((response) => searchLocalResources(response.data, resourceDirname, pageUrl))
    .then((data) => downloadResources(data, resourceDirpath, render))
    .then((data) => {
      const filepath = path.join(outputDir, pageName);
      return writeFile(filepath, data, { encoding: 'utf-8' }).then(() => filepath);
    });
};
