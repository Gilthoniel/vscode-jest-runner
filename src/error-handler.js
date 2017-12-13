
class ErrorHandler {
  handle(e) {
    this.output.appendLine(e.message);
  }
}

module.exports = ErrorHandler;
