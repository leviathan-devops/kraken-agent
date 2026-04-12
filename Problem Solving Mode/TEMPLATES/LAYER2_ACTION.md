# LAYER 2: ACTION WITH PREDICTION - Template

**Purpose:** Specify exactly what action you'll take and what output you expect

---

## Template

```markdown
# LAYER 2: ACTION WITH PREDICTION

## Problem Being Solved
[Brief statement of the problem]

---

## 2.1 Exact Command / Action
[What exact action will you take? Be specific - exact command, exact API call, exact steps.]

```bash
[Your exact command here]
```

Or:
```
[Your exact API call / action steps]
```

---

## 2.2 Expected Output
[What output do you EXPECT to see? Document this BEFORE executing. Be specific.]

**Expected output:**
```
[What you expect to see - exact format, exact values]
```

---

## 2.3 Environment State
[What is the current environment state? Document versions, config, state.]

| Component | State |
|-----------|-------|
| [Component 1] | [Version/State] |
| [Component 2] | [Version/State] |
| [Component 3] | [Version/State] |

---

## 2.4 Observation to Make
[What specific observation will you make? Not "test it" - what exact thing will you look for?]

**What I'll observe:** [Specific thing to look for in the output]

---

## Anti-Derailment Check

- [ ] Command is EXACT, not vague
- [ ] Expected output is DOCUMENTED before execution
- [ ] Environment state is CAPTURED
- [ ] Observation is SPECIFIC (not "check if it works")
```

---

## Structural Requirements

| Field | Requirement | Enforces |
|-------|-------------|----------|
| Exact Command | Precise command or API call | Prevents vague "test it" |
| Expected Output | Documented before execution | Prevents after-the-fact rationalization |
| Environment State | Versions, config, current state | Provides context for interpretation |
| Specific Observation | What exactly to look for | Prevents generic "check output" |

---

## Example

```markdown
## 2.1 Exact Command / Action
```bash
docker exec mattermost-postgres psql -U mmuser -d mattermost -c "INSERT INTO commands (id, token, createat, updateat, deleteat, creatorid, teamid, trigger, method, username, iconurl, autocomplete, autocompletedesc, autocompletehint, displayname, description, url, pluginid) VALUES ('$(uuidgen | tr -d '-')', '$(openssl rand -hex 26)', EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0, 'w1bw6eksc7g89fooaxuo61fprh', '', 'opencode', 'P', 'opencode', '', true, 'Interact with OpenCode AI assistant', '<help | chat | code> [query]', 'OpenCode AI Assistant', 'AI-powered coding assistant', 'http://opencode-bridge:5000/execute', NULL);"
```

## 2.2 Expected Output
**Expected output:**
```
INSERT 0 1
```
(or similar success message from PostgreSQL)

## 2.3 Environment State
| Component | State |
|-----------|-------|
| Mattermost | Port 9080, version 10.x |
| PostgreSQL | mattermost database, mmuser |
| Bridge | Port 5000, /execute endpoint |

## 2.4 Observation to Make
**What I'll observe:** Command creation succeeds with "INSERT 0 1" message, then verify command exists in database.
```