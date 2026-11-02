// The engine's control error. In the in-process runtime there is no HTTP
// status line; the status distinguishes a caller fault (4xx) from an engine
// rejection (409) purely by convention. The message is always the thing a
// caller reports.

export class ControlError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ControlError";
    this.status = status;
  }
}