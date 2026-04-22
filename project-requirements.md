Here's the rubric condensed into talking points for your standup. Since the conversation is about AI in Production, I've organized it around what they need to know:

---

**What the capstone is scored on (5 categories):**

**1. Technical Depth (20%)**
- Pick a real, well-scoped problem — not vague, not trivial
- Have a clear architecture with modular design and justified trade-offs
- Prompt engineering should be deliberate — few-shot, chain-of-thought, structured outputs. Not generic prompts
- Orchestration matters — multi-step flows, error handling, retries, not just a single API call

**2. Engineering Practices (20%)**
- Clean, modular, documented code — obvious AI-generated code with no cleanup will score a zero
- Proper logging (structured, not print statements) and error handling
- Tests — unit and integration. No tests = zero on that criterion
- Observability — track latency, success/failure rates, token usage. Not just "it works on my machine"

**3. Production Readiness (15%)**
- The solution must be feasible and deployable — not just a notebook
- Have an evaluation strategy — how do you know it works? Metrics, test scenarios, not just vibes
- Actually deploy it — HuggingFace, Streamlit Cloud, Vercel, Docker. Running locally via manual steps scores lowest

**4. Presentation (15%)**
- Build a real UI — not raw terminal or API calls
- Demo must work live — rehearse it, show real-world use cases
- Communicate clearly — explain your decisions, justify your trade-offs

**5. Peer Review Quality (30%)**
- They will review each other's work and be scored on the quality of their feedback
- Generic feedback like "good job" scores a 1. AI-generated slop scores a zero
- Feedback must be specific, technically sound, constructive, and cover all major areas
- This is the single biggest category — it rewards engineers who can think critically about others' work

---

**Key things to listen for during standup that deserve a nod:**

If someone mentions deploying their project, building a proper evaluation framework, adding logging/observability, writing tests, building a UI, or thinking about their peer review approach — those are all directly tied to high scores. Encourage them to keep going in those directions.

The biggest pitfall to warn against: building something that only runs in a notebook with no tests, no deployment, and no evaluation plan. That'll score low across three categories.