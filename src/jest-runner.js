const { exec } = require('child_process');
const vscode = require('vscode');

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

  run(fileName, nocache = false) {
    this._outputHeader(fileName);
    this.output.appendLine('Running tests ... (might take some time)');

    const workspace = vscode.workspace.workspaceFolders[0].uri.fsPath;

    if (!nocache && this.cache[fileName]) {
      return this.cache[fileName];
    }

    this.cache[fileName] = new Promise((resolve, reject) => {
      exec(`CI=true npm test -- --json ${fileName}`, { cwd: workspace }, (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }

        const result = JestParser(stdout);

        this._outputHeader(fileName);
        if (result.hasFailure()) {
          this.output.appendLine('Tests end with failures!');
        } else {
          this.output.appendLine('Tests end with success!');
        }

        if (this.codeLensProvider) {
          this.codeLensProvider.update(result);
        }
    
        resolve(result);
      });
    });

    return this.cache[fileName];
  }

  _outputHeader(fileName) {
    this.output.clear();
    this.output.show(true);
    this.output.appendLine(fileName);
    this.output.appendLine('');
  }
}

module.exports = new JestRunner();
