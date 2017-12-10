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

    this.cache[document.fileName] = ast.program.body
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

    return this.cache[document.fileName];
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
    const ranges = [];
    try {
      this.deepSearch(statement, document, ranges)
    } catch (e) {
      console.log(e);
    }

    return ranges;
  }

  deepSearch(statement, document, ranges) {
    if (!has(statement, 'type') && !Array.isArray(statement)) {
      // limit the search to avoid to be lost in useless objects
      return;
    }

    if (this.isExpectStatement(statement)) {
      const { callee } = statement.expression.callee.object.object || statement.expression.callee.object;
      const range = new Range(
        document.positionAt(callee.start),
        document.positionAt(callee.end)
      );

      ranges.push({ range, statement });
      return;
    }

    Object.keys(statement).forEach((key) => {
      if (statement[key] && typeof statement[key] === 'object') {
        this.deepSearch(statement[key], document, ranges);
      }
    });
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
