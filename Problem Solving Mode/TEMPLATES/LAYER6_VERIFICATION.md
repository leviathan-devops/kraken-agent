# LAYER 6: VERIFICATION & CONFIRMATION - Template

**Purpose:** Confirm the fix actually works in the target environment

---

## Template

```markdown
# LAYER 6: VERIFICATION & CONFIRMATION

## Problem Being Solved
[Brief statement of the problem]

---

## 6.1 Target Environment Execution
[Execute in the actual target environment, not just check syntax]

**Environment:** [What environment you're testing in]
**Execution:** [What you ran to verify]

```bash
[Your verification command]
```

**Result:**
```
[Actual result]
```

---

## 6.2 Behavior Matches Requirement
[Does the behavior now match the original requirement?]

**Original requirement:** [What the user originally asked for]
**Current behavior:** [What actually happens now]

| Requirement | Met? | Evidence |
|-------------|------|----------|
| [Requirement 1] | Yes/No | [Evidence] |
| [Requirement 2] | Yes/No | [Evidence] |

---

## 6.3 Console Errors / Side Effects
[Any errors or unexpected side effects?]

**Console output:** [Any errors?]
**Side effects:** [Any unintended consequences?]

| Check | Result |
|-------|--------|
| Console errors | None / [Errors found] |
| Side effects | None / [Effects found] |

---

## 6.4 Regression Check
[What else might be affected? Check for regressions.]

| Component | Status | Notes |
|-----------|--------|-------|
| [Component 1] | OK / Affected | [Notes] |
| [Component 2] | OK / Affected | [Notes] |

---

## 6.5 Final Assessment
[Summary: Is this problem solved?]

**Status:** Resolved / Partially Resolved / Not Resolved
**Confidence:** High / Medium / Low
**Remaining issues:** [Any issues that remain]

---

## Anti-Derailment Check

- [ ] Executed in TARGET environment (not just syntax check)
- [ ] Behavior matched against ORIGINAL requirement (not assumed)
- [ ] Console errors checked
- [ ] Regression check performed
- [ ] Confidence level stated
```

---

## Structural Requirements

| Field | Requirement | Enforces |
|-------|-------------|----------|
| Target Environment Execution | Actual execution in real environment | Prevents syntax-only verification |
| Behavior Matches Requirement | Explicit check against original ask | Prevents assuming success |
| Console Errors | Error output checked | Prevents silent failures |
| Regression Check | What else might be affected | Prevents introducing new bugs |
| Final Assessment | Status + confidence + remaining issues | Clear conclusion |

---

## Example

```markdown
## 6.1 Target Environment Execution
**Environment:** Mattermost server (port 9080) with bridge service (port 5000)
**Execution:** Triggered slash command in Mattermost channel, checked bridge logs

```bash
# Posted message "/opencode help" in Mattermost channel
curl -X POST "http://localhost:9080/api/v4/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"channel_id": "qpe4m5rmwpbtimpznw7i6mqcnr", "message": "/opencode help"}'

# Check bridge logs for POST request
docker logs opencode-bridge --tail 20
```

**Result:**
```
172.18.0.5 - - [12/Apr/2026:14:32:15 +0000] "POST /execute HTTP/1.1" 200 -
```

## 6.2 Behavior Matches Requirement
**Original requirement:** Slash command /opencode triggers bridge service
**Current behavior:** HTTP POST received at bridge /execute endpoint

| Requirement | Met? | Evidence |
|-------------|------|----------|
| Slash command executes | Yes | Bridge logs show POST to /execute |
| Response returned | Yes | HTTP 200 in logs |
| Proper formatting | Yes | JSON response with response_type: "in_channel" |

## 6.3 Console Errors / Side Effects
**Console output:** No errors in Mattermost or bridge logs
**Side effects:** None observed

## 6.4 Regression Check
| Component | Status | Notes |
|-----------|--------|-------|
| Mattermost server | OK | No errors |
| Other slash commands | OK | Not affected |
| Bridge service | OK | Still responding |

## 6.5 Final Assessment
**Status:** Resolved
**Confidence:** High
**Remaining issues:** None
```