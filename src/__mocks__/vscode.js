
module.exports = {
  window: {
    activeTextEditor: {
      document: {
        getText: jest.fn(() => ''),

        lineAt: jest.fn(() => ({})),
      },

      setDecorations: jest.fn(),
    },

    onDidChangeActiveTextEditor: jest.fn(),

    createTextEditorDecorationType: jest.fn(() => {}),

    createOutputChannel: jest.fn(() => new OutputChannel()),

    createStatusBarItem: jest.fn(() => new StatusBarItem())
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

  StatusBarAlignment: {},
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

class StatusBarItem {
  constructor() {
    this.show = jest.fn();
  }
}
