const { window, StatusBarAlignment } = require('vscode');

const JestRunner = require('./jest-runner');
const ErrorHandler = require('./error-handler');

const PREFIX = 'Jest Runner: ';

class StatusIndicator {
  init() {
    if (this.status) {
      return;
    }

    this.status = window.createStatusBarItem(StatusBarAlignment.Left, 0);
    this.status.command = 'jest-runner.run-test';
    this.status.show();
  }

  running() {
    this.init();
    this.status.text = PREFIX + '$(rocket) running...';
    this.status.color = 'white';
  }

  update() {
    this.init();
    const { fileName } = window.activeTextEditor.document;

    if (JestRunner.has(fileName)) {
      JestRunner.has(fileName).then(
        (result) => {
          if (result.hasRuntimeError()) {
            this.status.text = `${PREFIX}Runtime error`;
            this.status.color = 'rgba(230,39,57,1)';
          } else if (result.hasFailure()) {
            this.status.text = `${PREFIX}$(x) ${result.getNumFailure()} fail(s)`;
            this.status.color = 'rgba(230,39,57,1)';
          } else {
            this.status.text = `${PREFIX}$(check) ${result.getNumSuccess()} success(es)`;
            this.status.color = 'rgba(63,176,172,1)';
          }
        },
        ErrorHandler.handle
      );
      return;
    }

    this.status.text = PREFIX + '$(code) standby';
    this.status.color = 'white';
  }

  none() {
    this.init();
    this.status.text = PREFIX + '$(dash) no tests found';
    this.status.color = 'white';
  }
}

module.exports = new StatusIndicator();
