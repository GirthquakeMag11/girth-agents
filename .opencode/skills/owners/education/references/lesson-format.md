# Lesson format

A **lesson** is one self-contained HTML file in `lessons/`, numbered
`NNNN-<slug>.html` in sequence. It teaches one tightly-scoped thing, tied to
the mission, inside the learner's zone of proximal development.

What makes one:

- **Short, and completable quickly.** Working memory is small; stay within
  it, and end with a single tangible win the learner can build on.
- **Tied to the mission.** The skill a lesson teaches follows from
  `MISSION.md`, and the knowledge inside is only what that skill needs.
- **In the zone.** Challenging "just enough" — computed from the learning
  records and the mission, not from a syllabus.
- **Knowledge first, then practice.** Teach the knowledge, then get the
  learner practising through an interactive loop with feedback that is as
  tight as possible — ideally automatic.
- **Quizzes behave.** Answers are written to the same length, correct
  position varied, no formatting or ordering clues.
- **Beautiful and restrained.** The learner returns to these later; clean
  typography and layout that prints well. Build from `assets/`; reused
  components before new ones, a shared stylesheet first.
- **Linked.** HTML anchors between lessons and reference documents.
- **Sourced.** Each lesson recommends one primary, high-trust resource from
  `RESOURCES.md` to read or watch.
- **Open-ended.** Each lesson reminds the learner they can ask the agent
  follow-up questions.

When the lesson is written, open it for the learner if a command can.