export function computeRemainingSeconds(startedAt, timeLimitMinutes, now = Date.now()) {
  if (!timeLimitMinutes || timeLimitMinutes <= 0) return null;
  const deadline = startedAt + timeLimitMinutes * 60 * 1000;
  return Math.max(0, Math.floor((deadline - now) / 1000));
}

export function savedAnswersToMap(savedAnswers = []) {
  const map = {};
  for (const entry of savedAnswers) {
    map[entry.questionId] = entry.selectedOptionId;
  }
  return map;
}

export function answersToPayload(answers, questions) {
  return questions.map((q) => ({
    questionId: q._id,
    selectedOptionId: answers[q._id] ?? "",
  }));
}
