const { CodeLens, EventEmitter } = require('vscode');

const FileParser = require('./parser/file-parser');

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
      this.codelenses.push(new StatusCodeLens(range));
      this.numDescribe += 1;

      this.populateItCodeLenses(tests, document);
    });
  }

  populateItCodeLenses(tests, document) {
    tests.forEach(({ range }) => {
      this.codelenses.push(new ItCodeLens(range, document, this.numIt));
      this.codelenses.push(new ItStatusCodeLens(range, this.numIt));
      this.numIt += 1;
    });
  }

  resolveCodeLens(codeLens) {
    codeLens.resolve();

    return codeLens;
  }

  update(result) {
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
  }

  update() {}

  enable() {
    this.command = this.command || {};
    this.command.title = 'Details';
  }
}

class ItStatusCodeLens extends CodeLens {
  constructor(range, itIndex) {
    super(range);

    this.index = itIndex;
  }

  resolve() {
    this.command = {
      title: 'No results',
    };
  }

  update(result) {
    if (result.getTestResult(this.index).hasFailed()) {
      this.command = { title: 'Failed' };
    } else {
      this.command = { title: 'Success' };
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
  }

  update() {}
}

class StatusCodeLens extends CodeLens {
  resolve() {
    this.command = {
      title: 'No Status',
    };
  }

  update(result) {
    this.command = this.command || {};

    if (result.hasFailure()) {
      this.command.title = 'Failed';
    } else {
      this.command.title = 'Success';
    }
  }
}

module.exports = CodeLensProvider;
