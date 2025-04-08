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
        i: moduleId,
        exports: {},
      }
    }
    
    modules[moduleId].call({},
      module,
      _our_require_
    )
    
    const exports = module.exports;
    
    installedModules[moduleId] = exports;
    
    return _our_require_(${indexLocation});
  })
  ([${allModules}]);
  `
}

const getImport = (item, allDeps) => {

  const importFunctionName = item.specifiers[0].imported.name;

  const fileImported = item.value.source;

  const fullFile = path.resolve(fileImported);

  const itemId = allDeps.findIndex(item => item.name === fullFile);

  return {
    type: "VariableDeclaration",
    kind: "const",
    declarations: [
      {
        type: "VariableDeclarator",
        init: {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: "_ourRequire"
          },
          arguments: [
            {
              type: "Literal",
              value: itemId
            }
          ]
        },
        id: {
          type: "Identifier",
          name: importFunctionName
        }
      }
    ]
  }
}

const getExport = item => {
  const moduleName = item.specifiers[0].exported.name;

  return {
    type: "ExpressionStatement",
    expression: {
      type: "AssignmentExpression",
      left: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "module" },
        computed: false,
        property: { type: "Identifier", name: "exports" }
      },
      operator: "=",
      right: { type: "Identifier", name: moduleName }
    }
  }
}

const targetPath = path.resolve(__dirname,'./main.mjs');

depthsGraph(targetPath);

console.log('[ depthsArray ]', depthsArray);