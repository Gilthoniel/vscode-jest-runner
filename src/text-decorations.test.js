const vscode = require('vscode');
const { TestTextDecorations } = require('./text-decorations');

const JestRunner = require('./jest-runner');
const FileParser = require('./parser/file-parser');

jest.mock('./jest-runner', () => ({
  has: jest.fn(),
}));

jest.mock('./parser/file-parser', () => ({
  parse: jest.fn(),
}));

describe('text-decorations', () => {
  beforeEach(() => {
    JestRunner.has.mockClear();
  });

  it('should update the decorations', () => {
    expect.assertions(1);

    const hasPassed = jest.fn();
    hasPassed.mockReturnValue(true);
    hasPassed.mockReturnValueOnce(false);

    JestRunner.has.mockReturnValue(Promise.resolve({
      getTestResult: jest.fn(() => ({ hasPassed, getMessage: jest.fn(() => '') }))
    }));
    FileParser.parse.mockReturnValue([
      {
        tests: [{ range: {} }, { range: {} }]
      }
    ]);

    const instance = new TestTextDecorations();
    instance.update().then(() => {
      expect(vscode.window.activeTextEditor.setDecorations).toHaveBeenCalledTimes(2);
    });
  });
});
