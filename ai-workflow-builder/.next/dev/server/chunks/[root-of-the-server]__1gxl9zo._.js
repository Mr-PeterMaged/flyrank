module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/tty [external] (tty, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[project]/src/app/api/inngest/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$inngest$2f$next$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/inngest/next.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$inngest$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/inngest/client.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$inngest$2f$functions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/inngest/functions.ts [app-route] (ecmascript)");
;
;
;
const { GET, POST, PUT } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$inngest$2f$next$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["serve"])({
    client: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$inngest$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["inngest"],
    functions: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$inngest$2f$functions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["functions"]
});
}),
"[project]/src/lib/inngest/client.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "inngest",
    ()=>inngest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$inngest$2f$components$2f$Inngest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/inngest/components/Inngest.js [app-route] (ecmascript)");
;
const inngest = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$inngest$2f$components$2f$Inngest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Inngest"]({
    id: 'ai-workflow-builder'
});
}),
"[project]/src/lib/inngest/functions.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "executeWorkflow",
    ()=>executeWorkflow,
    "functions",
    ()=>functions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$inngest$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/inngest/client.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/llm.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$runs$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/runs-store.ts [app-route] (ecmascript)");
;
;
;
const executeWorkflow = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$inngest$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["inngest"].createFunction({
    id: 'execute-workflow',
    triggers: {
        event: 'workflow/run.requested'
    }
}, async ({ event, step })=>{
    const { nodes, edges, startNodeId, runId } = event.data;
    // Inngest replays this function body from the top every time it resumes
    // after a step, so every side effect here must live inside a step.run —
    // step.run's return value is memoized, but on replay the callback itself
    // does not run again, which is what stops history from being appended
    // twice for the same node.
    await step.run('init-run', ()=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$runs$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createRun"])(runId);
    });
    const nodeMap = new Map(nodes.map((n)=>[
            n.id,
            n
        ]));
    const visited = new Set();
    let currentId = startNodeId;
    try {
        while(currentId){
            // A graph with a cycle would otherwise run forever — stop instead of hanging.
            if (visited.has(currentId)) break;
            visited.add(currentId);
            const node = nodeMap.get(currentId);
            if (!node) break;
            // One Inngest step per node: durable, individually retried, and
            // visible in the dashboard. The progress-store writes live inside
            // the callback so they only fire once, on the real execution.
            const answer = await step.run(`node-${node.id}`, async ()=>{
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$runs$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setCurrentNode"])(runId, node.id);
                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["askYesNo"])(node.data.prompt);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$runs$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appendHistory"])(runId, {
                    nodeId: node.id,
                    label: node.data.label,
                    prompt: node.data.prompt,
                    answer: result
                });
                return result;
            });
            const branch = answer === 'YES' ? 'yes' : 'no';
            const nextEdge = edges.find((e)=>e.source === currentId && e.sourceHandle === branch);
            currentId = nextEdge?.target;
        }
        await step.run('complete-run', ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$runs$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["completeRun"])(runId);
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$runs$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["failRun"])(runId, message);
        throw err; // let Inngest record the run itself as Failed too
    }
    return {
        runId
    };
});
const functions = [
    executeWorkflow
];
}),
"[project]/src/lib/llm.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "askYesNo",
    ()=>askYesNo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/client.mjs [app-route] (ecmascript) <export OpenAI as default>");
;
const client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__["default"]({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: process.env.GEMINI_BASE_URL
});
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
async function askYesNo(prompt) {
    const res = await client.chat.completions.create({
        model: MODEL,
        temperature: 0,
        messages: [
            {
                role: 'system',
                content: 'You answer decision questions with exactly one word: YES or NO. ' + 'Never explain, never add punctuation, never say anything else.'
            },
            {
                role: 'user',
                content: prompt
            }
        ]
    });
    const raw = res.choices[0]?.message?.content?.trim().toUpperCase() ?? '';
    if (raw.startsWith('YES')) return 'YES';
    if (raw.startsWith('NO')) return 'NO';
    throw new Error(`Model returned a non YES/NO answer: "${raw}"`);
}
}),
"[project]/src/lib/runs-store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// A run's progress, kept in memory for the lifetime of the dev server process.
// The Inngest function executes inside this same Next.js process (both run
// through the local Dev Server), so it can write here directly — no second
// HTTP round trip, and the client polls this store's own route, not Inngest's
// internal dev API, which isn't meant for an app to depend on.
__turbopack_context__.s([
    "appendHistory",
    ()=>appendHistory,
    "completeRun",
    ()=>completeRun,
    "createRun",
    ()=>createRun,
    "failRun",
    ()=>failRun,
    "getRun",
    ()=>getRun,
    "setCurrentNode",
    ()=>setCurrentNode
]);
const runs = new Map();
function createRun(runId) {
    const now = new Date().toISOString();
    runs.set(runId, {
        status: 'running',
        history: [],
        currentNodeId: null,
        startedAt: now,
        updatedAt: now
    });
}
function setCurrentNode(runId, nodeId) {
    const run = runs.get(runId);
    if (!run) return;
    run.currentNodeId = nodeId;
    run.updatedAt = new Date().toISOString();
}
function appendHistory(runId, entry) {
    const run = runs.get(runId);
    if (!run) return;
    run.history.push(entry);
    run.updatedAt = new Date().toISOString();
}
function completeRun(runId) {
    const run = runs.get(runId);
    if (!run) return;
    run.status = 'completed';
    run.currentNodeId = null;
    run.updatedAt = new Date().toISOString();
}
function failRun(runId, error) {
    const run = runs.get(runId);
    if (!run) return;
    run.status = 'failed';
    run.error = error;
    run.currentNodeId = null;
    run.updatedAt = new Date().toISOString();
}
function getRun(runId) {
    return runs.get(runId);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1gxl9zo._.js.map