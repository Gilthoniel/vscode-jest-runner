const { window, OverviewRulerLane, DecorationRangeBehavior } = require('vscode');

const FileParser = require('./parser/file-parser');
const JestRunner = require('./jest-runner');
const ErrorHandler = require('./error-handler');

const FAILURE_DECORATOR = window.createTextEditorDecorationType({
  overviewRulerColor: 'rgba(230,39,57,1)',
  overviewRulerLane: OverviewRulerLane.Center,
  after: {
    margin: '0 0 0 10px',
    color: 'rgba(230,39,57,1)',
    contentText: '« Error raised here',
  },
  isWholeLine: true,
  backgroundColor: 'rgba(255,0,0,0.1)',
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

const RUNTIME_ERROR_DECORATOR = window.createTextEditorDecorationType({
  overviewRulerColor: 'rgba(230,39,57,1)',
  overviewRulerLane: OverviewRulerLane.Center,
  after: {
    margin: '0 0 0 10px',
    color: 'rgba(230,39,57,1)',
    contentText: '« Runtime error',
  },
  isWholeLine: true,
  backgroundColor: 'rgba(255,0,0,0.1)',
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

const SUCCESS_DECORATOR = window.createTextEditorDecorationType({
  overviewRulerColor: 'rgba(63,176,172,1)',
  overviewRulerLane: OverviewRulerLane.Center,
  after: {
    margin: '0 0 0 10px',
    color: 'rgba(63,176,172,1)',
    contentText: '« Success',
  },
  isWholeLine: true,
  backgroundColor: 'rgba(0,255,0,0.1)',
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

/**
 * Update the active document with the results of the test
 */
class TestTextDecorations {
  /**
   * Get the active document and search for the result of the tests
   * but doesn't run if not found
   */
  update() {
    const editor = window.activeTextEditor;
    const { document } = editor;

    const exec = JestRunner.has(document.fileName);
    if (!exec) {
      return;
    }

    return exec.then(
      (result) => this.updateWithResult(result, editor),
      ErrorHandler.handle
    );
  }

  /**
   * Iterate over the describes to generate the decorations
   * @param {JestTestResult} result 
   * @param {TextEditor} editor 
   */
  updateWithResult(result, editor) {
    const { document } = editor;
    const describes = FileParser.parse(document);

    const reducer = (ranges, describe) => {
      if (result.hasRuntimeError()) {
        ranges.runtimes.push(describe.range);
        return ranges;
      }

      describe.tests.forEach((test) => {
        const testResult = result.getTestResult(test.index);
        
        if (testResult.hasPassed()) {
          // If the test has passed, we only add a decoration after the it
          const line = document.lineAt(test.range.start);
          ranges.successes.push(line.range);
        } else {
          // Else we search for the error line
          const range = this.getFailureRange(testResult, document);
          if (range) {
            ranges.failures.push(range);
          }
        }
      });

      return ranges;
    };

    const ranges = describes.reduce(reducer, { failures: [], runtimes: [], successes: [] });

    editor.setDecorations(FAILURE_DECORATOR, ranges.failures);
    editor.setDecorations(RUNTIME_ERROR_DECORATOR, ranges.runtimes);
    editor.setDecorations(SUCCESS_DECORATOR, ranges.successes);
  }

  /**
   * Get the line of the error or return null
   * @param {JestTestResult} result 
   * @param {TextDocument} document 
   */
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

module.exports.TestTextDecorations = TestTextDecorations;
