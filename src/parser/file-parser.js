const { Range } = require('vscode');
const babylon = require('babylon');
const has = require('has');

class FileParser {
  constructor() {
    this.cache = {};
  }

  setFileWatcher(watcher) {
    watcher.onDidChange((event) => {
      // reset the cache for the modified file as the AST has probably changed
      delete this.cache[event.path];
    });
  }

  clear(key) {
    delete this.cache[key];
  }

  parse(document) {
    if (has(this.cache, document.fileName)) {
      return this.cache[document.fileName];
    }

    const ast = babylon.parse(document.getText(), {
      sourceType: 'module',

      plugins: [
        "jsx",
        "objectRestSpread",
        "classProperties",
        "exportExtensions",
      ]
    });

    const describes = ast.program.body
      .filter(this.isDescribeStatement)
      .map((statement) => {
        const { callee, arguments: args } = statement.expression;
        const range = new Range(
          document.positionAt(callee.start),
          document.positionAt(callee.end)
        );

        return {
          range,
          statement,
          tests: this.parseDescribeStatement(args[1].body, document),
        }
      });
    
    // populate test indices
    let index = 0;
    describes.forEach(describe => describe.tests.forEach((test) => {
      test.index = index;
      index += 1;

      return test;
    }));

    this.cache[document.fileName] = describes;
    return describes;
  }

  parseDescribeStatement(statement, document) {
    return statement.body
      .filter(this.isItStatement)
      .map((statement) => {
        const { callee, arguments: args } = statement.expression;
        const range = new Range(
          document.positionAt(callee.start),
          document.positionAt(callee.end)
        );

        return {
          range,
          statement,
          expects: this.parseItStatement(args[1].body, document),
        };
      });
  }

  parseItStatement(statement, document) {
    return this.deepSearch(statement, document);
  }

  deepSearch(statement, document) {
    if (!has(statement, 'type') && !Array.isArray(statement)) {
      // limit the search to avoid to be lost in useless objects
      return [];
    }

    if (this.isExpectStatement(statement)) {
      const { callee } = statement.expression.callee.object.object || statement.expression.callee.object;
      const range = new Range(
        document.positionAt(callee.start),
        document.positionAt(callee.end)
      );

      return [{ range, statement }];
    }

    return Object.keys(statement).reduce((array, key) => {
      if (statement[key] && typeof statement[key] === 'object') {
        return array.concat(this.deepSearch(statement[key], document));
      }

      return array;
    }, []);
  }

  isDescribeStatement(statement) {
    return (
      statement.type === "ExpressionStatement"
      && statement.expression.type === "CallExpression"
      && statement.expression.callee.name === "describe"
    );
  }

  isItStatement(statement) {
    return (
      statement.type === 'ExpressionStatement'
      && statement.expression.type === 'CallExpression'
      && statement.expression.callee.name === 'it'
    );
  }

  isExpectStatement(statement) {
    return (
      statement.type === 'ExpressionStatement'
      && statement.expression.type === 'CallExpression'
      && statement.expression.callee.type === 'MemberExpression'
      && ((
        statement.expression.callee.object.type === 'CallExpression'
        && statement.expression.callee.object.callee.name === 'expect'
      ) || (
        statement.expression.callee.object.type === 'MemberExpression'
        && statement.expression.callee.object.object.type === 'CallExpression'
        && statement.expression.callee.object.object.callee.name === 'expect'
      ))
    );
  }
}

module.exports = new FileParser();
