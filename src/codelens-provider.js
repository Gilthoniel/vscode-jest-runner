const { CodeLens, EventEmitter } = require('vscode');

const FileParser = require('./parser/file-parser');
const JestRunner = require('./jest-runner');
const TestTextDecorations = require('./text-decorations');
const ErrorHandler = require('./error-handler');

const STATUS_NONE = 'None';
const STATUS_FAIL = 'Fail';
const STATUS_SUCCESS = 'Success';

class CodeLensProvider {
  constructor() {
    this._emitter = new EventEmitter();

    this.clear();
  }

  onDidChangeCodeLenses() {
    return this._emitter.event;
  }

  provideCodeLenses(document) {
    FileParser.clear(document.fileName);
    const describes = FileParser.parse(document);
    
    this.clear();

    this.populateDescribeCodeLenses(describes, document);
    
    return this.codelenses;
  }

  populateDescribeCodeLenses(describes, document) {
    describes.forEach(({ range, tests }) => {
      this.codelenses.push(new DescribeCodeLens(range, document));
      this.codelenses.push(new StatusCodeLens(range, document));
      this.numDescribe += 1;

      this.populateItCodeLenses(tests, document);
    });
  }

  populateItCodeLenses(tests, document) {
    tests.forEach(({ range }) => {
      this.codelenses.push(new ItCodeLens(range, document, this.numIt));
      this.codelenses.push(new ItStatusCodeLens(range, document, this.numIt));
      this.numIt += 1;
    });
  }

  resolveCodeLens(codeLens) {
    TestTextDecorations.update();

    return codeLens.resolve();
  }

  update(result) {
    TestTextDecorations.update();

    this.codelenses.forEach(lens => lens.update(result));

    this._emitter.fire();
  }

  dispose() {
    this._emitter.dispose();
  }

  clear() {
    this.codelenses = [];
    this.numDescribe = 0;
    this.numIt = 0;
  }
}

class ItCodeLens extends CodeLens {
  constructor(range, document, itIndex) {
    super(range);

    this.document = document;
    this.testIndex = itIndex;
  }

  resolve() {
    this.command = {
      command: 'jest-runner.show-details',
      arguments: [this.document.fileName, this.testIndex],
      title: 'Details',
    };

    return this;
  }

  update() {}

  enable() {
    this.command = this.command || {};
    this.command.title = 'Details';
  }
}

class ItStatusCodeLens extends CodeLens {
  constructor(range, document, itIndex) {
    super(range);

    this.document = document;
    this.index = itIndex;
  }

  resolve() {
    const exec = JestRunner.has(this.document.fileName);

    if (exec) {
      return exec.then(
        this.updateFromResult.bind(this),
        ErrorHandler.handle
      );
    }

    this.command = { title: STATUS_NONE };
    return this;
  }

  update(result) {
    this.updateFromResult(result);
  }

  updateFromResult(result) {
    if (result.hasRuntimeError() || result.getTestResult(this.index).hasFailed()) {
      this.command = { title: STATUS_FAIL };
    } else {
      this.command = { title: STATUS_SUCCESS };
    }
  }
}

class DescribeCodeLens extends CodeLens {
  constructor(range, document) {
    super(range);

    this.document = document;
  }

  resolve() {
    this.command = {
      command: 'jest-runner.run-test',
      arguments: [this.document.fileName],
      title: 'Run tests',
    };

    return this;
  }

  update() {}
}

class StatusCodeLens extends CodeLens {
  constructor(range, document) {
    super(range);

    this.document = document;
  }

  resolve() {
    const exec = JestRunner.has(this.document.fileName);

    if (exec) {
      return exec.then(
        this.updateFromResult.bind(this),
        ErrorHandler.handle
      );
    }

    // Test has not been run yet
    this.command = { title: STATUS_NONE };
    return this;
  }

  update(result) {
    this.updateFromResult(result);
  }

  updateFromResult(result) {
    this.command = this.command || {};

    if (result.hasRuntimeError() || result.hasFailure()) {
      this.command.title = STATUS_FAIL;
    } else {
      this.command.title = STATUS_SUCCESS;
    }

    return this;
  }
}

module.exports = CodeLensProvider;
