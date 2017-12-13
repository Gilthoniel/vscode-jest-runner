const { spawn } = require('child_process');
const vscode = require('vscode');

const JestParser = require('./parser/jest-parser');
const ErrorHandler = require('./error-handler');

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

    test.then(
      result => this.output.append(result.getTestResult(testIndex).getMessage()),
      ErrorHandler.handle
    );
  }

  triggerUpdate(result, fileName) {
    this._outputHeader(fileName);
    if (result.hasRuntimeError()) {
      this.output.appendLine('Tests end with a runtime error!');
    } else if (result.hasFailure()) {
      this.output.appendLine('Tests end with failures!');
    } else {
      this.output.appendLine('Tests end with success!');
    }

    this.output.appendLine(result.getMessage());

    if (this.codeLensProvider) {
      this.codeLensProvider.update(result);
    }
  }

  run(fileName, nocache = false) {
    this._outputHeader(fileName);
    this.output.appendLine('Running tests ... (might take some time)');

    const workspace = vscode.workspace.workspaceFolders[0].uri.fsPath;

    if (!nocache && this.cache[fileName]) {
      return this.cache[fileName];
    }

    this.cache[fileName] = new Promise((resolve, reject) => {
      const env = Object.assign({}, process.env, { CI: true });
      const proc = spawn('npm', ['test', '--', '--json', fileName], { cwd: workspace, env });
      let isResolved = false;

      proc.stdout.on('data', (data) => {
        const result = JestParser(data.toString());
        if (result) {
          // Can trigger several buffers but only one with the actual json
          this.triggerUpdate(result, fileName);
          resolve(result);
          isResolved = true;
        }
      });

      proc.on('close', () => {
        if (!isResolved) {
          // return code doesn't matter if we don't have results
          reject();
        }
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
