export function selectResumeOrigin(queue, body) {
  if (typeof body.sessionID !== "string" || body.sessionID.trim() === "") {
    return {
      error: {
        code: "resume.not-return",
        message: "the target is not the origin of the input",
      },
    };
  }
  let match = null;
  if (body.dispatchId) {
    const byId = queue.findRetainedOrigin({
      dispatchId: body.dispatchId,
      dispatchingSessionID: body.sessionID,
    });
    if (byId.length === 0) {
      if (
        queue.findStaleOrigin?.({
          node: body.node,
          dispatchingSessionID: body.sessionID,
          dispatchId: body.dispatchId,
        })
      ) {
        return {
          error: {
            code: "handoff.stale",
            message: "the retained origin is already consumed or discarded",
          },
        };
      }
      return {
        error: {
          code: "resume.not-return",
          message: "the target is not the origin of the input",
        },
      };
    }
    if (byId[0].node !== body.node) {
      return {
        error: {
          code: "resume.not-return",
          message: "the target is not the origin of the input",
        },
      };
    }
    match = byId[0];
  } else {
    const matches = queue.findRetainedOrigin({
      node: body.node,
      dispatchingSessionID: body.sessionID,
    });
    if (matches.length === 0) {
      if (
        queue.findStaleOrigin?.({
          node: body.node,
          dispatchingSessionID: body.sessionID,
        })
      ) {
        return {
          error: {
            code: "handoff.stale",
            message: "the retained origin is already consumed or discarded",
          },
        };
      }
      return {
        error: {
          code: "resume.not-return",
          message: "the target is not the origin of the input",
        },
      };
    }
    if (matches.length > 1) {
      return {
        error: {
          code: "handoff.ambiguous",
          message: "more than one retained origin matches",
        },
      };
    }
    match = matches[0];
  }

  const origin = queue.consumeRetainedOrigin(match.dispatchId);
  if (!origin) {
    return {
      error: {
        code: "handoff.stale",
        message: "the retained origin is already consumed or discarded",
      },
    };
  }
  return { origin };
}

export function resumeHistoryEvent(origin) {
  return {
    dispatchId: origin.dispatchId,
    from: "dispatcher",
    to: origin.node,
    label: origin.label,
    at: new Date().toISOString(),
  };
}
