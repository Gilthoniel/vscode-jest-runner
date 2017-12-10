const { exec } = require('child_process');
const vscode = require('vscode');

const TestTextDecorations = require('./text-decorations');
const JestParser = require('./parser/jest-parser');

class JestRunner {
  constructor() {
    this.cache = {};
    this.codeLensProvider = null;
    this.output = null;
  }

  setWatcher(watcher) {
    watcher.onDidChange((event) => {
      delete this.cache[event.path];
    });
  }

  has(fileName) {
    return this.cache[fileName];
  }

  showDetails(fileName, testIndex) {
    this._outputHeader(fileName);

    const test = this.has(fileName);
    if (!test) {
      this.output.appendLine('No results found.');
      return;
    }

    test.then(result => this.output.append(result.getTestResult(testIndex).getMessage()));
  }

  run(filename, nocache = false) {
    this.output.appendLine('Running tests ...');
    const workspace = vscode.workspace.workspaceFolders[0].uri.fsPath;

    if (!nocache && this.cache[filename]) {
      return this.cache[filename];
    }

    this.cache[filename] = new Promise((resolve, reject) => {
      exec(`CI=true npm test -- --json ${filename}`, { cwd: workspace }, (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }

        const result = JestParser(stdout);

        this.output.show(true);
        this._outputHeader(filename);
        this.output.appendLine('Click on each individual test for the details of the result.');

        new TestTextDecorations(result).update();

        if (this.codeLensProvider) {
          this.codeLensProvider.update(result);
        }
    
        resolve(result);
      });
    });

    return this.cache[filename];
  }

  _outputHeader(fileName) {
    this.output.clear();
    this.output.appendLine(fileName);
    this.output.appendLine('');
  }
}

module.exports = new JestRunner();