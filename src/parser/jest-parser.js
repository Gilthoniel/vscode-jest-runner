
module.exports = (stdout) => {
  try {
    return new JestResults(JSON.parse(stdout));
  } catch(e) {
    return null;
  }
}

class JestResults {
  constructor(result) {
    this.result = result;
    this.tests = result.testResults[0].assertionResults.map(test => new JestTestResult(test))
  }

  hasFailure() {
    return this.getNumFailure() > 0;
  }

  hasRuntimeError() {
    return this.result.numRuntimeErrorTestSuites > 0;
  }

  getNumFailure() {
    return this.result.numFailedTests;
  }

  getNumSuccess() {
    return this.result.numPassedTests;
  }

  getMessage() {
    return this.result.testResults[0].message;
  }

  getTestResult(index = 0) {
    return this.tests[index];
  }

  getTestResults() {
    return this.tests;
  }
}

class JestTestResult {
  constructor(test) {
    this.test = test;
  }

  hasFailed() {
    return this.test.status === 'failed';
  }

  hasPassed() {
    return this.test.status === 'passed';
  }

  getMessage(index = 0) {
    if (!this.hasFailed()) {
      return '';
    }

    return this.test.failureMessages[index];
  }

  getTitle() {
    return this.test.title;
  }
}