import * as path from 'path';
import * as fs from 'fs';
import * as ast from 'meriyah';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const depthsArray = [];

const depthsGraph = (file) => {

  const fullPath = path.resolve(file);

  // 既に存在しているなら早期リターン
  if(!!depthsArray.find(item => item.name === fullPath)) return

  const fileContents = fs.readFileSync(fullPath,'utf8');

  const source = ast.parseModule(fileContents,{module:true});

  console.log('[ source ]', source);

  const module = {
    name:fullPath,
    source,
  }

  source.body.map(current => {
    if(current.type === 'ImportDeclaration'){

      depthsGraph(current.source.value);
    }
  });

  depthsArray.push(module);

  return depthsArray;
}

const buildModuleTemplateString = (moduleCode,index) => {
  return `
  /* index/id ${index} */
  (function(module, _ourRequire){
    "use strict";
    ${moduleCode}
  })
  `
};

const buildRuntimeTemplateString = (allModules,indexLocation) => {
  return `
  (function(modules){
    const installedModules = {};
    function _our_require_(moduleId){
      if(installedModules[moduleId]){
        return installedModules[moduleId].exports;
      }
      
      const module = {
        id: moduleId,
        exports: {},
      }
    }
  })
  `
}

const targetPath = path.resolve(__dirname,'./main.mjs');

depthsGraph(targetPath);

console.log('[ depthsArray ]', depthsArray);