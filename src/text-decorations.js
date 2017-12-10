const { window, OverviewRulerLane, DecorationRangeBehavior } = require('vscode');

const FileParser = require('./parser/file-parser');

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
  constructor(result) {
    this.result = result;
    this.editor = window.activeTextEditor;
  }

  update() {
    const { document } = this.editor;
    const describes = FileParser.parse(document);

    const reducer = (ranges, describe) => {
      describe.tests.forEach((test) => {
        const result = this.result.getTestResult(test.index);
        if (result.hasPassed()) {
          const line = document.lineAt(test.range.start);
          ranges.successes.push(line.range);
        } else {
          const range = this.getFailureRange(result, document);
          if (range) {
            ranges.failures.push(range);
          }
        }
      });

      return ranges;
    };

    const ranges = describes.reduce(reducer, { failures: [], successes: [] });

    this.editor.setDecorations(FAILURE_DECORATOR, ranges.failures);
    this.editor.setDecorations(SUCCESS_DECORATOR, ranges.successes);
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

module.exports = TestTextDecorations;
