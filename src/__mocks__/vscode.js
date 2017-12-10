
module.exports = {
  window: {
    activeTextEditor: {
      document: {
        getText: jest.fn(() => ''),

        lineAt: jest.fn(() => ({})),
      },

      setDecorations: jest.fn(),
    },

    createTextEditorDecorationType: jest.fn(() => {}),

    createOutputChannel: jest.fn(() => new OutputChannel()),
  },

  workspace: {
    createFileSystemWatcher: jest.fn(() => new FileSystemWatcher()),
  },

  languages: {
    registerCodeLensProvider: jest.fn(() => new CodeLensProvider()),
  },

  commands: {
    registerCommand: jest.fn(() => new Command())
  },

  CodeLens: class {

  },

  EventEmitter: class {

  },

  OverviewRulerLane: {},

  DecorationRangeBehavior: {},
};

class FileSystemWatcher {
  constructor() {
    this.onDidChange = jest.fn();
    this.dispose = jest.fn();
  }
}

class OutputChannel {

}

class Command {

}

class CodeLensProvider {
  constructor() {
    this.dispose = jest.fn();
  }
}
