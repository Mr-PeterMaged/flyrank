module.exports = [
"[externals]/node:async_hooks [external] (node:async_hooks, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[externals]_node_async_hooks_1gjz99j._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/node:async_hooks [external] (node:async_hooks, cjs)");
    });
});
}),
"[project]/node_modules/ulid/dist/index.esm.js [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[root-of-the-server]__05gd8sf._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/ulid/dist/index.esm.js [app-route] (ecmascript)");
    });
});
}),
];