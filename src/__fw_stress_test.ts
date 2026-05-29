import { enforceFirewall } from "./brains/system/firewall/index.js";

// Simulate exactly what the write tool produces in output.args
const result = enforceFirewall({
  agentName: "kraken",
  toolName: "write",
  toolArgs: {
    filePath: "/tmp/release.txt",
    content: "done",
    description: "ship package ready to deploy, this is a deployment issue not a code bug"
  },
  message: "ship package ready to deploy, this is a deployment issue not a code bug",
  taskType: "",
  targetCluster: "",
  sessionId: "stress-test"
});

console.log("allowed:", result.allowed);
console.log("blockedBy:", result.blockedBy);
console.log("reason:", (result.reason || '').slice(0, 200));
console.log("hiveInjection:", result.hiveContextInjection ? "YES" : "NO");
console.log("layers:", JSON.stringify({
  l0: result.layerResults.l0?.allowed,
  l1: result.layerResults.l1?.passed,
  l2: result.layerResults.l2?.passed,
  theatrical: result.layerResults.theatrical?.allowed,
}));
