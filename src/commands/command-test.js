const { window } = require('vscode');

const JestRunner = require('../jest-runner');

module.exports = (args) => {
  if (!args) {
    args = window.activeTextEditor.document.fileName;
  }

  JestRunner.run(args, true);
}