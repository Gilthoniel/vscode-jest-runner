const { window } = require('vscode');

const JestRunner = require('../jest-runner');
const StatusIndicator = require('../status-indicator');
const ErrorHandler = require('../error-handler');

module.exports = (args) => {
  if (!args) {
    args = window.activeTextEditor.document.fileName;
  }

  StatusIndicator.running();

  JestRunner.run(args, true)
    .then(
      () => StatusIndicator.update(),
      ErrorHandler.handle
    );
}