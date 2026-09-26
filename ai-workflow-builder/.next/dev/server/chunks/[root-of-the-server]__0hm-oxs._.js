module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

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
"[project]/src/app/api/workflows/run/[runId]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$runs$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/runs-store.ts [app-route] (ecmascript)");
;
;
async function GET(_req, { params }) {
    const { runId } = await params;
    const run = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$runs$2d$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getRun"])(runId);
    if (!run) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Run not found'
        }, {
            status: 404
        });
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(run);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__0hm-oxs._.js.map