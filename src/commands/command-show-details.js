const JestRunner = require('../jest-runner');

module.exports = (...args) => {
  JestRunner.showDetails(...args);
}