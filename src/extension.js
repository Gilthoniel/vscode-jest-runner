const vscode = require('vscode');

const CodeLensProvider = require('./codelens-provider');
const CommandRunTest = require('./commands/command-test');
const CommandShowDetails = require('./commands/command-show-details');
const JestRunner = require('./jest-runner');
const FileParser = require('./parser/file-parser');

/**
 * Extension context
 * @property {FileSystemWatcher} watcher
 * @property {CodeLensProvider} codeLensProvider
 */
const Extension = {
  watcher: null,
  codeLensProvider: null,

  /**
   * Initialization of the extension
   */
  activate: function(context) {
    /* Commands */
    context.subscriptions.push(vscode.commands.registerCommand(
      'jest-runner.run-test',
      CommandRunTest
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
      'jest-runner.show-details',
      CommandShowDetails
    ));

    /* FileWatcher */
    Extension.watcher = vscode.workspace.createFileSystemWatcher('**/*.test.{js,jsx}', true, false, true);
    FileParser.setFileWatcher(Extension.watcher);

    /* Providers */
    JestRunner.codeLensProvider = new CodeLensProvider();
    JestRunner.output = vscode.window.createOutputChannel('Jest Test Runner');

    Extension.codeLensProvider = vscode.languages.registerCodeLensProvider(
      { language: 'javascript', pattern: '**/*.test.{js,jsx}' },
      JestRunner.codeLensProvider
    );
    context.subscriptions.push(Extension.codeLensProvider);
  },

  /**
   * Dispose the extension resources
   */
  deactivate: () => {
    if (Extension.watcher) {
      Extension.watcher.dispose();
    }

    if (Extension.codeLensProvider) {
      Extension.codeLensProvider.dispose();
    }
  }
}

exports.activate = Extension.activate;

exports.deactivate = Extension.deactivate;
