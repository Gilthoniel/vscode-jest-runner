const { window, OverviewRulerLane, DecorationRangeBehavior } = require('vscode');

const FileParser = require('./parser/file-parser');
const JestRunner = require('./jest-runner');

const FAILURE_DECORATOR = window.createTextEditorDecorationType({
  overviewRulerColor: 'rgba(230,39,57,1)',
  overviewRulerLane: OverviewRulerLane.Center,
  after: {
    margin: '0 0 0 10px',
    color: 'rgba(230,39,57,1)',
    contentText: '« error raised here',
  },
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

const SUCCESS_DECORATOR = window.createTextEditorDecorationType({
  overviewRulerColor: 'rgba(63,176,172,1)',
  overviewRulerLane: OverviewRulerLane.Center,
  after: {
    margin: '0 0 0 10px',
    color: 'rgba(63,176,172,1)',
    contentText: '« success',
  },
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

class TestTextDecorations {
  update() {
    const editor = window.activeTextEditor;
    const { document } = editor;

    const exec = JestRunner.has(document.fileName);
    if (!exec) {
      return;
    }

    exec.then((result) => this.updateWithResult(result, editor));
  }

  updateWithResult(result, editor) {
    const { document } = editor;
    const describes = FileParser.parse(document);

    const reducer = (ranges, describe) => {
      describe.tests.forEach((test) => {
        const testResult = result.getTestResult(test.index);
        if (testResult.hasPassed()) {
          const line = document.lineAt(test.range.start);
          ranges.successes.push(line.range);
        } else {
          const range = this.getFailureRange(testResult, document);
          if (range) {
            ranges.failures.push(range);
          }
        }
      });

      return ranges;
    };

    const ranges = describes.reduce(reducer, { failures: [], successes: [] });

    editor.setDecorations(FAILURE_DECORATOR, ranges.failures);
    editor.setDecorations(SUCCESS_DECORATOR, ranges.successes);
  }

  getFailureRange(result, document) {
    const regex = new RegExp(`${document.fileName}:([0-9]+):[0-9]+`);
    const match = result.getMessage(0).match(regex);

    if (match) {
      return document.lineAt(parseInt(match[1], 10) - 1);
    }

    return null;
  }
}

module.exports = new TestTextDecorations();
