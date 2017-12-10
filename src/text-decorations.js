const { window, OverviewRulerLane, DecorationRangeBehavior } = require('vscode');

const FileParser = require('./parser/file-parser');

const FAILURE_DECORATOR = window.createTextEditorDecorationType({
  overviewRulerColor: 'rgba(230,39,57,1)',
  overviewRulerLane: OverviewRulerLane.Center,
  after: {
    margin: '0 0 0 10px',
    color: 'rgba(230,39,57,1)',
    contentText: '« assertion failed',
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
    const failureLines = this.getFailureLines();

    const failures = [];
    const successes = [];
    describes.forEach((describe) => describe.tests.forEach((test) => {
      for (let i = 0; i < test.expects.length; i += 1) {
        const expect = test.expects[i];
        const line = document.lineAt(expect.range.start);
        if (failureLines.includes(line.lineNumber)) {
          failures.push(line.range);
          return; // next expect have not been run
        } else {
          successes.push(line.range);
        }
      }
    }));

    this.editor.setDecorations(FAILURE_DECORATOR, failures);
    this.editor.setDecorations(SUCCESS_DECORATOR, successes);
  }

  getFailureLines() {
    const { document } = this.editor;

    return this.result.getTestResults()
      .filter(test => test.hasFailed())
      .map(test => {
        const regex = new RegExp(`${document.fileName}:([0-9]+):[0-9]+`);
        const match = test.getMessage(0).match(regex);
    
        if (match) {
          const line = document.lineAt(parseInt(match[1], 10) - 1);
    
          return line.lineNumber;
        }
    
        return -1;
      });
  }
}

module.exports = TestTextDecorations;
