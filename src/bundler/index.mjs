import * as path from 'path';
import * as fs from 'fs';
import * as ast from 'meriyah';

const depthsArray = [];

const depthsGraph = (file) => {

  const fullPath = path.resolve(file);

  // 既に存在しているなら早期リターン
  if(!!depthsArray.find(item => item.name === fullPath)) return

  const fileContents = fs.readFileSync(fullPath,'utf8');

  const source = ast.parse(fileContents);

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

depthsGraph('/Users/mzkmnk/dev/web-bundlers-sample-ts/src/sample-code/date.mjs');