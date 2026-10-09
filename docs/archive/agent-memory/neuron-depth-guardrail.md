---
name: neuron-depth-guardrail
description: "Teach each topic deep enough to understand it completely, then stop; no exhaustive branching (e.g. every possible attack)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 068b3ecb-aafd-492c-89fa-15d7ea8a3cc2
  modified: 2026-10-04T14:18:21.766Z
---

Guardrail set by her husband (senior engineer, set up the project) on 2026-10-04: do not go too deep into things that are not that important for her level. Go deep enough that she understands the thing completely, then stop. Do not branch into unnecessary side topics. Not the opposite either: he explicitly said not to go shallow.

His example: she does not need to work through every possible way an attacker can attack her app. The Master Thread is expected to judge which level of complexity is good enough.

**Why:** Neuron is her first big project. It has to be finished so she feels the accomplishment. Two or three further projects are planned after it for other complex topics (microservices, events, message brokers), so this one cannot absorb unlimited depth. He is happy with her learning and unhappy with the pace.

**How to apply:** For each topic, cover the main mechanism, the one or two realistic failure cases, and the trade-off behind the decision. Then decide and move on. Name remaining edge cases in one line as "exists, not needed now" instead of teaching them. My interpretation: the Day 15 credential-storage threat analysis (eleven storage mechanisms, patient-attacker scenarios) is the kind of depth he means. See [[neuron-teaching-mode]], [[neuron-learner-profile]].
