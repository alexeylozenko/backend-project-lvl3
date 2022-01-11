# Page loader
### Hexlet tests and linter status:
[![Actions Status](https://github.com/alexeylozenko/backend-project-lvl3/workflows/hexlet-check/badge.svg)](https://github.com/alexeylozenko/backend-project-lvl3/actions)
[![es-lint](https://github.com/alexeylozenko/backend-project-lvl3/actions/workflows/eslint.yml/badge.svg)](https://github.com/alexeylozenko/backend-project-lvl3/actions/workflows/eslint.yml)
## Description
Tool for downloading web page to your computer with other files(js, images, css e.t.c) download page as doing this the browser.
## Install
### Requirements:
* nodejs lts version >= 14
* npm
* make

``` 
make install 
```

or 

``` 
npm install
```

## Usage
CLI Tool has two arguments **url** (address of the web page which will be downloaded) and **output** (the path where will be saved page)

## API
### arguments:
* `pageUrl` - address of the page, 
* `outputDir` - path for save the web page (default: current working directory),
* `render` - module for displaying the status of the downloading each resource(not optional cli-version use module [Listr](https://github.com/SamVerschueren/listr))

### return: Promise.resolve(filepath);

``` 
import downloadPage from 'page-loader';
 
downloadPage(pageUrl, outputDir, render).then(filepath => )
```

## Example:
[![asciicast](https://asciinema.org/a/461199.svg)](https://asciinema.org/a/461199)