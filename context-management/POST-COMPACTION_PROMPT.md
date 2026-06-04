# POST-COMPACTION RECOVERY PROMPT (Auto-Updated)

**Last Snapshot:** 2026-06-04T08:15:44.175Z

## You just woke up from compaction.

### Last Known State
- **Last Completed Task:** Final lifecycle test
- **Current Gate:** VERIFY
- **Active Tasks:** 0
- **Completed Tasks:** 1

### Recovery Sequence
1. Read COMPACTION_SURVIVAL.md first
2. Read BUILD_STATE.md for build metrics
3. Read TASK_QUEUE.md for remaining backlog
4. Rebuild: `bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin`
5. Redeploy: `docker cp dist/index.js <container>:/root/.config/opencode/plugins/kraken-agent/dist/index.js`
6. Re-verify: `docker exec <container> bun run /tmp/test.mjs`
