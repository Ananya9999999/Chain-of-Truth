(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/location-analysis.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LocationAnalysis",
    ()=>LocationAnalysis
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/activity.mjs [app-client] (ecmascript) <export default as Activity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$compass$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Compass$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/compass.mjs [app-client] (ecmascript) <export default as Compass>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crosshair$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crosshair$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/crosshair.mjs [app-client] (ecmascript) <export default as Crosshair>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.mjs [app-client] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.mjs [app-client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$navigation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Navigation$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/navigation.mjs [app-client] (ecmascript) <export default as Navigation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$radar$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Radar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/radar.mjs [app-client] (ecmascript) <export default as Radar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$radio$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Radio$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/radio.mjs [app-client] (ecmascript) <export default as Radio>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scan$2d$line$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ScanLine$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/scan-line.mjs [app-client] (ecmascript) <export default as ScanLine>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$satellite$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Satellite$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/satellite.mjs [app-client] (ecmascript) <export default as Satellite>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$signal$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Signal$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/signal.mjs [app-client] (ecmascript) <export default as Signal>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/target.mjs [app-client] (ecmascript) <export default as Target>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zap.mjs [app-client] (ecmascript) <export default as Zap>");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mock-data.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
function priorityColor(priority) {
    if (priority >= 75) return 'var(--danger)';
    if (priority >= 55) return 'var(--warning)';
    return 'var(--primary)';
}
function AnimatedScore({ value }) {
    _s();
    const [score, setScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnimatedScore.useEffect": ()=>{
            let current = 0;
            const timer = setInterval({
                "AnimatedScore.useEffect.timer": ()=>{
                    current += Math.max(1, Math.ceil(value / 25));
                    if (current >= value) {
                        current = value;
                        clearInterval(timer);
                    }
                    setScore(current);
                }
            }["AnimatedScore.useEffect.timer"], 35);
            return ({
                "AnimatedScore.useEffect": ()=>clearInterval(timer)
            })["AnimatedScore.useEffect"];
        }
    }["AnimatedScore.useEffect"], [
        value
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: score
    }, void 0, false, {
        fileName: "[project]/components/location-analysis.tsx",
        lineNumber: 49,
        columnNumber: 10
    }, this);
}
_s(AnimatedScore, "6LqkIJiaorzg0taiAgz78FTgEiM=");
_c = AnimatedScore;
const particles = [
    [
        12,
        22
    ],
    [
        24,
        71
    ],
    [
        37,
        16
    ],
    [
        58,
        82
    ],
    [
        69,
        27
    ],
    [
        81,
        63
    ],
    [
        91,
        38
    ],
    [
        47,
        58
    ]
];
function LocationAnalysis() {
    _s1();
    const [selected, setSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchLocations"][0]);
    const [telemetry, setTelemetry] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(97);
    const [scanCount, setScanCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1284);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LocationAnalysis.useEffect": ()=>{
            const timer = setInterval({
                "LocationAnalysis.useEffect.timer": ()=>{
                    setTelemetry({
                        "LocationAnalysis.useEffect.timer": (value)=>{
                            const next = value + (Math.random() > 0.5 ? 1 : -1);
                            return Math.max(94, Math.min(99, next));
                        }
                    }["LocationAnalysis.useEffect.timer"]);
                    setScanCount({
                        "LocationAnalysis.useEffect.timer": (value)=>value + Math.floor(Math.random() * 4) + 1
                    }["LocationAnalysis.useEffect.timer"]);
                }
            }["LocationAnalysis.useEffect.timer"], 1800);
            return ({
                "LocationAnalysis.useEffect": ()=>clearInterval(timer)
            })["LocationAnalysis.useEffect"];
        }
    }["LocationAnalysis.useEffect"], []);
    const selectedColor = priorityColor(selected.priority);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: "751aeed8be0d956d",
                children: "@keyframes locationReveal{0%{opacity:0;filter:blur(5px);transform:translateY(16px)}to{opacity:1;filter:blur();transform:translateY(0)}}@keyframes radarSweep{0%{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes radarPulse{0%{opacity:.65;transform:scale(.55)}to{opacity:0;transform:scale(2.5)}}@keyframes markerPulse{0%,to{transform:translate(-50%,-50%)scale(.9)}50%{transform:translate(-50%,-50%)scale(1.08)}}@keyframes scannerHorizontal{0%{opacity:0;transform:translate(-120%)}20%{opacity:.8}80%{opacity:.25}to{opacity:0;transform:translate(500%)}}@keyframes scannerVertical{0%{opacity:0;transform:translateY(-120%)}20%{opacity:.7}80%{opacity:.2}to{opacity:0;transform:translateY(500%)}}@keyframes particle{0%,to{opacity:.12;transform:scale(.6)}50%{opacity:.95;transform:scale(1.5)}}@keyframes routeFlow{0%{stroke-dashoffset:120px}to{stroke-dashoffset:0}}@keyframes scoreGlow{0%,to{text-shadow:0 0 #0000}50%{text-shadow:0 0 18px}}@keyframes signalPulse{0%,to{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}@keyframes dataFlow{0%{transform:translate(-120%)}to{transform:translate(420%)}}@keyframes targetLock{0%,to{transform:rotate(0)scale(1)}50%{transform:rotate(90deg)scale(1.05)}to{transform:rotate(180deg)scale(1)}}@keyframes telemetryBlink{0%,to{opacity:.45}50%{opacity:1}}.location-page.jsx-751aeed8be0d956d{animation:.7s cubic-bezier(.22,1,.36,1) locationReveal}.radar-sweep.jsx-751aeed8be0d956d{transform-origin:50%;animation:5s linear infinite radarSweep}.radar-pulse.jsx-751aeed8be0d956d{animation:2.5s ease-out infinite radarPulse}.marker-pulse.jsx-751aeed8be0d956d{animation:2s ease-in-out infinite markerPulse}.horizontal-scan.jsx-751aeed8be0d956d{animation:3.5s ease-in-out infinite scannerHorizontal}.vertical-scan.jsx-751aeed8be0d956d{animation:5s ease-in-out infinite scannerVertical}.location-particle.jsx-751aeed8be0d956d{animation:2.4s ease-in-out infinite particle}.location-route.jsx-751aeed8be0d956d{stroke-dasharray:5 4;animation:3s linear infinite routeFlow}.score-glow.jsx-751aeed8be0d956d{animation:2.8s ease-in-out infinite scoreGlow}.signal-pulse.jsx-751aeed8be0d956d{animation:1.8s ease-in-out infinite signalPulse}.data-flow.jsx-751aeed8be0d956d{animation:2.8s linear infinite dataFlow}.target-lock.jsx-751aeed8be0d956d{animation:7s linear infinite targetLock}.telemetry-blink.jsx-751aeed8be0d956d{animation:1.8s ease-in-out infinite telemetryBlink}.location-button.jsx-751aeed8be0d956d{transition:transform .22s cubic-bezier(.22,1,.36,1),filter .22s}.location-button.jsx-751aeed8be0d956d:hover{filter:brightness(1.2);transform:translate(-50%,-50%)scale(1.15)}.ranking-button.jsx-751aeed8be0d956d{transition:transform .22s,border-color .22s,background-color .22s,box-shadow .22s}.ranking-button.jsx-751aeed8be0d956d:hover{transform:translate(4px)}@media (prefers-reduced-motion:reduce){.location-page.jsx-751aeed8be0d956d,.radar-sweep.jsx-751aeed8be0d956d,.radar-pulse.jsx-751aeed8be0d956d,.marker-pulse.jsx-751aeed8be0d956d,.horizontal-scan.jsx-751aeed8be0d956d,.vertical-scan.jsx-751aeed8be0d956d,.location-particle.jsx-751aeed8be0d956d,.location-route.jsx-751aeed8be0d956d,.score-glow.jsx-751aeed8be0d956d,.signal-pulse.jsx-751aeed8be0d956d,.data-flow.jsx-751aeed8be0d956d,.target-lock.jsx-751aeed8be0d956d,.telemetry-blink.jsx-751aeed8be0d956d{animation:none}}"
            }, void 0, false, void 0, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-751aeed8be0d956d" + " " + "location-page",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                    className: "overflow-hidden border-border/70 bg-card/55 shadow-xl backdrop-blur-xl",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                            className: "border-b border-border/60 pb-3.5",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-751aeed8be0d956d" + " " + "flex flex-wrap items-center justify-between gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-751aeed8be0d956d",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-751aeed8be0d956d" + " " + "flex flex-wrap items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "relative flex size-7 items-center justify-center rounded-lg border border-primary/25 bg-primary/10",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$radar$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Radar$3e$__["Radar"], {
                                                                        className: "size-3.5 text-primary"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 374,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "jsx-751aeed8be0d956d" + " " + "signal-pulse absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 376,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 372,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                                children: "Geospatial Search Priority"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 380,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 370,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "inline-flex items-center gap-1 rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-primary",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zap$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Zap$3e$__["Zap"], {
                                                                className: "size-2.5"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 388,
                                                                columnNumber: 21
                                                            }, this),
                                                            "HEURISTIC ENGINE"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 386,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/location-analysis.tsx",
                                                lineNumber: 368,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "jsx-751aeed8be0d956d" + " " + "mt-1 font-mono text-[10.5px] text-muted-foreground",
                                                children: "Multi-factor spatial scoring · Explainable rule-based decomposition"
                                            }, void 0, false, {
                                                fileName: "[project]/components/location-analysis.tsx",
                                                lineNumber: 396,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/location-analysis.tsx",
                                        lineNumber: 366,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-1.5 rounded border border-success/25 bg-success/10 px-2 py-1 font-mono text-[9px] font-semibold text-success",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "signal-pulse size-1.5 rounded-full bg-success"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 407,
                                                        columnNumber: 19
                                                    }, this),
                                                    "RADAR ACTIVE"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/location-analysis.tsx",
                                                lineNumber: 405,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "jsx-751aeed8be0d956d" + " " + "hidden rounded border border-border/70 bg-secondary/70 px-2 py-1 font-mono text-[9px] font-semibold text-muted-foreground sm:block",
                                                children: "DETERMINISTIC"
                                            }, void 0, false, {
                                                fileName: "[project]/components/location-analysis.tsx",
                                                lineNumber: 413,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/location-analysis.tsx",
                                        lineNumber: 403,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/location-analysis.tsx",
                                lineNumber: 364,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/location-analysis.tsx",
                            lineNumber: 362,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                            className: "pt-4",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-751aeed8be0d956d" + " " + "grid gap-4 lg:grid-cols-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-751aeed8be0d956d" + " " + "lg:col-span-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    background: 'radial-gradient(circle at 50% 50%, oklch(0.18 0.03 230 / 0.7), transparent 38%), radial-gradient(circle at 20% 15%, oklch(0.20 0.02 230 / 0.5), transparent 52%), radial-gradient(circle at 85% 80%, oklch(0.17 0.03 190 / 0.4), transparent 48%), var(--card)'
                                                },
                                                className: "jsx-751aeed8be0d956d" + " " + "group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-primary/15 shadow-2xl transition-all duration-500 hover:border-primary/30",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        "aria-hidden": "true",
                                                        className: "jsx-751aeed8be0d956d" + " " + "absolute inset-0 h-full w-full opacity-45",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                                                                className: "jsx-751aeed8be0d956d",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pattern", {
                                                                        id: "tactical-grid-final",
                                                                        width: "32",
                                                                        height: "32",
                                                                        patternUnits: "userSpaceOnUse",
                                                                        className: "jsx-751aeed8be0d956d",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                            d: "M 32 0 L 0 0 0 32",
                                                                            fill: "none",
                                                                            stroke: "currentColor",
                                                                            strokeOpacity: "0.18",
                                                                            strokeWidth: "0.8",
                                                                            className: "jsx-751aeed8be0d956d"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/components/location-analysis.tsx",
                                                                            lineNumber: 458,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 452,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("radialGradient", {
                                                                        id: "centerGlowFinal",
                                                                        className: "jsx-751aeed8be0d956d",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                                                                offset: "0%",
                                                                                stopColor: "var(--primary)",
                                                                                stopOpacity: "0.18",
                                                                                className: "jsx-751aeed8be0d956d"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                                lineNumber: 469,
                                                                                columnNumber: 25
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                                                                offset: "100%",
                                                                                stopColor: "var(--primary)",
                                                                                stopOpacity: "0",
                                                                                className: "jsx-751aeed8be0d956d"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                                lineNumber: 475,
                                                                                columnNumber: 25
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 467,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 450,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                                width: "100%",
                                                                height: "100%",
                                                                fill: "url(#tactical-grid-final)",
                                                                className: "jsx-751aeed8be0d956d"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 485,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                cx: "50%",
                                                                cy: "50%",
                                                                r: "44%",
                                                                fill: "url(#centerGlowFinal)",
                                                                className: "jsx-751aeed8be0d956d"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 491,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                x1: "50%",
                                                                y1: "0",
                                                                x2: "50%",
                                                                y2: "100%",
                                                                stroke: "currentColor",
                                                                strokeOpacity: "0.14",
                                                                strokeDasharray: "4 5",
                                                                className: "jsx-751aeed8be0d956d"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 498,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                x1: "0",
                                                                y1: "50%",
                                                                x2: "100%",
                                                                y2: "50%",
                                                                stroke: "currentColor",
                                                                strokeOpacity: "0.14",
                                                                strokeDasharray: "4 5",
                                                                className: "jsx-751aeed8be0d956d"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 508,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 446,
                                                        columnNumber: 19
                                                    }, this),
                                                    particles.map(([x, y], index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                left: `${x}%`,
                                                                top: `${y}%`,
                                                                animationDelay: `${index * 0.4}s`,
                                                                boxShadow: '0 0 6px var(--primary), 0 0 14px color-mix(in oklch, var(--primary) 45%, transparent)'
                                                            },
                                                            className: "jsx-751aeed8be0d956d" + " " + "location-particle absolute z-[3] size-1 rounded-full bg-primary"
                                                        }, index, false, {
                                                            fileName: "[project]/components/location-analysis.tsx",
                                                            lineNumber: 525,
                                                            columnNumber: 21
                                                        }, this)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "absolute left-1/2 top-1/2 aspect-square w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "absolute inset-[12%] rounded-full border border-primary/10"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 545,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "absolute inset-[25%] rounded-full border border-primary/10"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 547,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "absolute inset-[38%] rounded-full border border-primary/10"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 549,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "absolute inset-[49%] rounded-full bg-primary/10"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 551,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "radar-pulse absolute inset-[43%] rounded-full border border-primary/45"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 556,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "radar-sweep absolute left-1/2 top-1/2 h-1/2 w-px origin-bottom bg-gradient-to-t from-primary/90 to-transparent shadow-[0_0_10px_var(--primary)]"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 561,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "radar-sweep absolute left-1/2 top-1/2 h-1/2 w-1/2 origin-bottom -translate-y-full bg-gradient-to-t from-primary/20 to-transparent"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 563,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 543,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        "aria-hidden": "true",
                                                        className: "jsx-751aeed8be0d956d" + " " + "pointer-events-none absolute inset-0 z-[4] h-full w-full",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                                                                className: "jsx-751aeed8be0d956d",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                                                                    id: "route-gradient-final",
                                                                    x1: "0%",
                                                                    y1: "0%",
                                                                    x2: "100%",
                                                                    y2: "100%",
                                                                    className: "jsx-751aeed8be0d956d",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                                                            offset: "0%",
                                                                            stopColor: "var(--primary)",
                                                                            stopOpacity: "0",
                                                                            className: "jsx-751aeed8be0d956d"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/components/location-analysis.tsx",
                                                                            lineNumber: 586,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                                                            offset: "55%",
                                                                            stopColor: "var(--primary)",
                                                                            stopOpacity: "0.75",
                                                                            className: "jsx-751aeed8be0d956d"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/components/location-analysis.tsx",
                                                                            lineNumber: 592,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                                                            offset: "100%",
                                                                            stopColor: selectedColor,
                                                                            stopOpacity: "0.95",
                                                                            className: "jsx-751aeed8be0d956d"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/components/location-analysis.tsx",
                                                                            lineNumber: 598,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 579,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 577,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                d: `M 50 50
                          C 43 45, 37 40, 31 34
                          C 26 29, 23 24, ${selected.x} ${selected.y}`,
                                                                fill: "none",
                                                                stroke: "url(#route-gradient-final)",
                                                                strokeWidth: "0.7",
                                                                strokeDasharray: "5 4",
                                                                pathLength: "120",
                                                                className: "jsx-751aeed8be0d956d" + " " + "location-route"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 607,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                cx: "50",
                                                                cy: "50",
                                                                r: "0.9",
                                                                fill: "var(--primary)",
                                                                className: "jsx-751aeed8be0d956d"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 619,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 572,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "pointer-events-none absolute left-0 top-[44%] h-px w-full overflow-hidden",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-751aeed8be0d956d" + " " + "horizontal-scan h-full w-1/4 bg-primary/50 blur-[1px] shadow-[0_0_8px_var(--primary)]"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/location-analysis.tsx",
                                                            lineNumber: 635,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 633,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "pointer-events-none absolute left-[50%] top-0 h-full w-px overflow-hidden",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-751aeed8be0d956d" + " " + "vertical-scan h-1/4 w-full bg-primary/30"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/location-analysis.tsx",
                                                            lineNumber: 642,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 640,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-751aeed8be0d956d" + " " + "relative flex size-12 items-center justify-center",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "jsx-751aeed8be0d956d" + " " + "absolute inset-0 rounded-full border border-primary/20"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 655,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "jsx-751aeed8be0d956d" + " " + "target-lock absolute inset-1 rounded-full border border-dashed border-primary/30"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 657,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crosshair$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crosshair$3e$__["Crosshair"], {
                                                                    className: "relative size-6 text-primary/55"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 659,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "jsx-751aeed8be0d956d" + " " + "signal-pulse absolute size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 661,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/location-analysis.tsx",
                                                            lineNumber: 653,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 651,
                                                        columnNumber: 19
                                                    }, this),
                                                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchLocations"].map((location)=>{
                                                        const color = priorityColor(location.priority);
                                                        const isSelected = selected.id === location.id;
                                                        const size = 18 + location.priority / 100 * 38;
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>setSelected(location),
                                                            "aria-label": `${location.name}, priority ${location.priority}`,
                                                            style: {
                                                                left: `${location.x}%`,
                                                                top: `${location.y}%`
                                                            },
                                                            className: "jsx-751aeed8be0d956d" + " " + ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('location-button absolute z-10 cursor-pointer -translate-x-1/2 -translate-y-1/2 focus:outline-none', isSelected && 'z-30') || ""),
                                                            children: [
                                                                isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            style: {
                                                                                width: size * 1.8,
                                                                                height: size * 1.8,
                                                                                borderColor: color,
                                                                                transform: 'translate(-50%, -50%)'
                                                                            },
                                                                            className: "jsx-751aeed8be0d956d" + " " + "radar-pulse absolute left-1/2 top-1/2 rounded-full border"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/components/location-analysis.tsx",
                                                                            lineNumber: 699,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            style: {
                                                                                width: size * 2.7,
                                                                                height: size * 2.7,
                                                                                borderColor: color,
                                                                                animationDelay: '0.8s',
                                                                                transform: 'translate(-50%, -50%)'
                                                                            },
                                                                            className: "jsx-751aeed8be0d956d" + " " + "radar-pulse absolute left-1/2 top-1/2 rounded-full border"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/components/location-analysis.tsx",
                                                                            lineNumber: 709,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 698,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        width: size * 2,
                                                                        height: size * 2,
                                                                        background: color,
                                                                        opacity: isSelected ? 0.35 : 0.12,
                                                                        transform: 'translate(-50%, -50%)'
                                                                    },
                                                                    className: "jsx-751aeed8be0d956d" + " " + "absolute left-1/2 top-1/2 rounded-full blur-xl"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 725,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        width: size,
                                                                        height: size,
                                                                        borderColor: color,
                                                                        background: `color-mix(in oklch, ${color} 16%, transparent)`,
                                                                        boxShadow: isSelected ? `0 0 0 3px color-mix(in oklch, ${color} 25%, transparent), 0 0 30px color-mix(in oklch, ${color} 35%, transparent)` : `0 0 15px color-mix(in oklch, ${color} 15%, transparent)`
                                                                    },
                                                                    className: "jsx-751aeed8be0d956d" + " " + "marker-pulse relative flex items-center justify-center rounded-full border",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                                                        className: "size-3.5",
                                                                        style: {
                                                                            color
                                                                        },
                                                                        strokeWidth: 2.5
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 753,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 739,
                                                                    columnNumber: 25
                                                                }, this),
                                                                isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        color,
                                                                        borderColor: `color-mix(in oklch, ${color} 30%, transparent)`
                                                                    },
                                                                    className: "jsx-751aeed8be0d956d" + " " + "absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded border bg-background/90 px-2 py-1 font-mono text-[7px] font-bold tracking-wider backdrop-blur-md",
                                                                    children: [
                                                                        "TARGET LOCK · ",
                                                                        location.id
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 765,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, location.id, true, {
                                                            fileName: "[project]/components/location-analysis.tsx",
                                                            lineNumber: 681,
                                                            columnNumber: 23
                                                        }, this);
                                                    }),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "absolute left-2 top-2 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1.5 font-mono text-[8px] text-muted-foreground backdrop-blur-xl",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-1.5",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$compass$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Compass$3e$__["Compass"], {
                                                                    className: "size-3 text-primary"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 790,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "jsx-751aeed8be0d956d",
                                                                    children: "GRID SECTOR N4"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 792,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "jsx-751aeed8be0d956d" + " " + "text-primary",
                                                                    children: "•"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 794,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "jsx-751aeed8be0d956d" + " " + "text-success",
                                                                    children: "LIVE"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 796,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/location-analysis.tsx",
                                                            lineNumber: 788,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 786,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "absolute right-2 top-2 rounded-lg border border-success/20 bg-background/80 px-2.5 py-1.5 font-mono text-[8px] text-success backdrop-blur-xl",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-1.5",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$signal$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Signal$3e$__["Signal"], {
                                                                    className: "size-3"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 807,
                                                                    columnNumber: 23
                                                                }, this),
                                                                "SIGNAL LOCKED"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/location-analysis.tsx",
                                                            lineNumber: 805,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 803,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-2 py-1.5 font-mono text-[7px] text-muted-foreground backdrop-blur-xl",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scan$2d$line$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ScanLine$3e$__["ScanLine"], {
                                                                className: "size-2.5 text-primary"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 820,
                                                                columnNumber: 21
                                                            }, this),
                                                            "SCANNING SPATIAL FIELD"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 818,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "absolute bottom-2 right-2 rounded-lg border border-primary/20 bg-background/80 px-2 py-1.5 font-mono text-[7px] text-primary backdrop-blur-xl",
                                                        children: [
                                                            "TARGET: ",
                                                            selected.id
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 829,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-primary/25"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 840,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-primary/25"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 842,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-primary/25"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 844,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-primary/25"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 846,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/location-analysis.tsx",
                                                lineNumber: 434,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-751aeed8be0d956d" + " " + "mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Telemetry, {
                                                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$satellite$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Satellite$3e$__["Satellite"],
                                                        label: "SATELLITES",
                                                        value: "08"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 857,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Telemetry, {
                                                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$signal$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Signal$3e$__["Signal"],
                                                        label: "SIGNAL",
                                                        value: `${telemetry}%`,
                                                        live: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 863,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Telemetry, {
                                                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scan$2d$line$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ScanLine$3e$__["ScanLine"],
                                                        label: "SCANS",
                                                        value: scanCount.toString()
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 870,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Telemetry, {
                                                        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$radio$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Radio$3e$__["Radio"],
                                                        label: "LINK",
                                                        value: "SECURE",
                                                        success: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 876,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/location-analysis.tsx",
                                                lineNumber: 855,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-751aeed8be0d956d" + " " + "mt-2.5 flex flex-wrap items-center gap-4 text-[9px] font-mono text-muted-foreground select-none",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-1.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "size-2 rounded-full bg-danger"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 891,
                                                                columnNumber: 21
                                                            }, this),
                                                            "High (75+)"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 890,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-1.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "size-2 rounded-full bg-warning"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 896,
                                                                columnNumber: 21
                                                            }, this),
                                                            "Medium (55–74)"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 895,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-1.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "size-2 rounded-full bg-primary"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 901,
                                                                columnNumber: 21
                                                            }, this),
                                                            "Low (<55)"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 900,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "ml-auto flex items-center gap-1.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "signal-pulse size-1.5 rounded-full bg-success"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 907,
                                                                columnNumber: 21
                                                            }, this),
                                                            "LIVE SENSOR FEED"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 905,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/location-analysis.tsx",
                                                lineNumber: 888,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/location-analysis.tsx",
                                        lineNumber: 432,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-751aeed8be0d956d" + " " + "space-y-2.5 lg:col-span-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-751aeed8be0d956d" + " " + "space-y-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "mb-2 flex items-center justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-1.5",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"], {
                                                                        className: "size-3 text-primary"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 932,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "jsx-751aeed8be0d956d" + " " + "font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground",
                                                                        children: "Priority Matrix"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 934,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 930,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "font-mono text-[8px] uppercase text-primary",
                                                                children: [
                                                                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchLocations"].length,
                                                                    " TARGETS"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 940,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 928,
                                                        columnNumber: 19
                                                    }, this),
                                                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchLocations"].map((location, index)=>{
                                                        const isSelected = selected.id === location.id;
                                                        const color = priorityColor(location.priority);
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>setSelected(location),
                                                            className: "jsx-751aeed8be0d956d" + " " + ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('ranking-button flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left shadow-sm', isSelected ? 'border-primary/40 bg-primary/[0.08] shadow-lg shadow-primary/[0.04]' : 'border-border/60 bg-card/40 hover:border-primary/20 hover:bg-card/70') || ""),
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "jsx-751aeed8be0d956d" + " " + "w-4 font-mono text-[8px] text-muted-foreground/60",
                                                                    children: String(index + 1).padStart(2, '0')
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 967,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        color
                                                                    },
                                                                    className: "jsx-751aeed8be0d956d" + " " + "w-8 font-mono text-xs font-black",
                                                                    children: location.priority
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 971,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "jsx-751aeed8be0d956d" + " " + "flex-1 truncate text-xs font-semibold text-foreground",
                                                                    children: location.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 978,
                                                                    columnNumber: 25
                                                                }, this),
                                                                isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$target$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Target$3e$__["Target"], {
                                                                    className: "size-3 text-primary"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 983,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, location.id, true, {
                                                            fileName: "[project]/components/location-analysis.tsx",
                                                            lineNumber: 956,
                                                            columnNumber: 23
                                                        }, this);
                                                    })
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/location-analysis.tsx",
                                                lineNumber: 926,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-751aeed8be0d956d" + " " + "relative overflow-hidden rounded-xl border border-border/70 bg-secondary/35 p-3.5 shadow-lg",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "pointer-events-none absolute left-0 top-0 h-px w-full overflow-hidden",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-751aeed8be0d956d" + " " + "data-flow h-full w-1/4 bg-primary/70 shadow-[0_0_8px_var(--primary)]"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/location-analysis.tsx",
                                                            lineNumber: 1003,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 1001,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "flex items-center justify-between border-b border-border/50 pb-2.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "flex min-w-0 items-center gap-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-751aeed8be0d956d" + " " + "flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$navigation$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Navigation$3e$__["Navigation"], {
                                                                            className: "size-3.5 text-primary"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/components/location-analysis.tsx",
                                                                            lineNumber: 1014,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 1012,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-751aeed8be0d956d" + " " + "min-w-0",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: "jsx-751aeed8be0d956d" + " " + "truncate text-xs font-bold text-foreground",
                                                                                children: selected.name
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                                lineNumber: 1020,
                                                                                columnNumber: 25
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: "jsx-751aeed8be0d956d" + " " + "font-mono text-[7px] uppercase tracking-wider text-muted-foreground",
                                                                                children: "TARGET IDENTIFIED"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                                lineNumber: 1024,
                                                                                columnNumber: 25
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 1018,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1010,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    color: selectedColor,
                                                                    borderColor: `color-mix(in oklch, ${selectedColor} 35%, transparent)`,
                                                                    background: `color-mix(in oklch, ${selectedColor} 9%, transparent)`
                                                                },
                                                                className: "jsx-751aeed8be0d956d" + " " + "score-glow shrink-0 rounded-lg border px-2 py-1 font-mono text-sm font-black",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AnimatedScore, {
                                                                    value: selected.priority
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/location-analysis.tsx",
                                                                    lineNumber: 1043,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1033,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 1008,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "mt-2 flex items-center justify-between rounded-md border border-border/40 bg-background/25 px-2 py-1.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-wider text-muted-foreground",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        style: {
                                                                            background: selectedColor
                                                                        },
                                                                        className: "jsx-751aeed8be0d956d" + " " + "signal-pulse size-1.5 rounded-full"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 1055,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    "TARGET SIGNAL"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1053,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                style: {
                                                                    color: selectedColor
                                                                },
                                                                className: "jsx-751aeed8be0d956d" + " " + "font-mono text-[8px] font-bold",
                                                                children: selected.priority >= 75 ? 'CRITICAL' : selected.priority >= 55 ? 'ELEVATED' : 'NORMAL'
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1064,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 1051,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "mt-2.5 flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
                                                                className: "mt-0.5 size-3 shrink-0 text-primary"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1082,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-751aeed8be0d956d",
                                                                children: "Deterministic heuristic decomposition: evidence recency, location reliability and corroborating evidence points."
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1084,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 1080,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "mt-3 space-y-2.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FactorBar, {
                                                                label: "Evidence Recency",
                                                                value: selected.factors.recency
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1097,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FactorBar, {
                                                                label: "Location Reliability",
                                                                value: selected.factors.reliability
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1102,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FactorBar, {
                                                                label: "Corroborating Evidence Points",
                                                                value: selected.factors.points * 20,
                                                                display: `${selected.factors.points} pts`
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1107,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 1095,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "mt-3 grid grid-cols-2 gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "rounded-lg border border-border/50 bg-background/25 px-2.5 py-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-751aeed8be0d956d" + " " + "font-mono text-[7px] uppercase tracking-wider text-muted-foreground",
                                                                        children: "X POSITION"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 1122,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-751aeed8be0d956d" + " " + "mt-0.5 font-mono text-[10px] font-bold text-primary",
                                                                        children: [
                                                                            selected.x.toFixed(1),
                                                                            "%"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 1126,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1120,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "rounded-lg border border-border/50 bg-background/25 px-2.5 py-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-751aeed8be0d956d" + " " + "font-mono text-[7px] uppercase tracking-wider text-muted-foreground",
                                                                        children: "Y POSITION"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 1135,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-751aeed8be0d956d" + " " + "mt-0.5 font-mono text-[10px] font-bold text-primary",
                                                                        children: [
                                                                            selected.y.toFixed(1),
                                                                            "%"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 1139,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1133,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 1118,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-751aeed8be0d956d" + " " + "mt-3 flex items-center justify-between border-t border-border/50 pt-2.5",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-wider text-muted-foreground",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$crosshair$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Crosshair$3e$__["Crosshair"], {
                                                                        className: "size-2.5 text-primary"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/components/location-analysis.tsx",
                                                                        lineNumber: 1154,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    "TARGET LOCKED"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1152,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-751aeed8be0d956d" + " " + "font-mono text-[7px] text-muted-foreground/50",
                                                                children: [
                                                                    "GEO-",
                                                                    selected.id
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/components/location-analysis.tsx",
                                                                lineNumber: 1160,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/location-analysis.tsx",
                                                        lineNumber: 1150,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/location-analysis.tsx",
                                                lineNumber: 997,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/location-analysis.tsx",
                                        lineNumber: 922,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/location-analysis.tsx",
                                lineNumber: 426,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/location-analysis.tsx",
                            lineNumber: 424,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/location-analysis.tsx",
                    lineNumber: 356,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/location-analysis.tsx",
                lineNumber: 355,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/location-analysis.tsx",
        lineNumber: 87,
        columnNumber: 5
    }, this);
}
_s1(LocationAnalysis, "Z4zD+z+XnPWwG+JgKXp5hArPq2k=");
_c1 = LocationAnalysis;
/* ========================================================= */ /* FACTOR BAR */ /* ========================================================= */ function FactorBar({ label, value, display }) {
    const safeValue = Math.min(value, 100);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between text-[10px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-medium text-muted-foreground",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/components/location-analysis.tsx",
                        lineNumber: 1200,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-mono text-[9px] font-bold text-foreground",
                        children: display ?? `${value}%`
                    }, void 0, false, {
                        fileName: "[project]/components/location-analysis.tsx",
                        lineNumber: 1204,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/location-analysis.tsx",
                lineNumber: 1198,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-1.5 h-1.5 overflow-hidden rounded-full border border-border/40 bg-secondary",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative h-full rounded-full bg-primary/80 transition-all duration-700 ease-out",
                    style: {
                        width: `${safeValue}%`
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-y-0 right-0 w-8 bg-white/30 blur-[2px]"
                    }, void 0, false, {
                        fileName: "[project]/components/location-analysis.tsx",
                        lineNumber: 1219,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/location-analysis.tsx",
                    lineNumber: 1212,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/location-analysis.tsx",
                lineNumber: 1210,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/location-analysis.tsx",
        lineNumber: 1196,
        columnNumber: 5
    }, this);
}
_c2 = FactorBar;
/* ========================================================= */ /* TELEMETRY */ /* ========================================================= */ function Telemetry({ icon: Icon, label, value, live, success }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-lg border border-border/50 bg-background/25 px-2 py-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('size-2.5', success ? 'text-success' : live ? 'text-primary' : 'text-muted-foreground')
                    }, void 0, false, {
                        fileName: "[project]/components/location-analysis.tsx",
                        lineNumber: 1252,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-mono text-[6.5px] font-bold uppercase tracking-wider text-muted-foreground",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/components/location-analysis.tsx",
                        lineNumber: 1263,
                        columnNumber: 9
                    }, this),
                    live && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "telemetry-blink ml-auto size-1 rounded-full bg-success"
                    }, void 0, false, {
                        fileName: "[project]/components/location-analysis.tsx",
                        lineNumber: 1268,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/location-analysis.tsx",
                lineNumber: 1250,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-0.5 font-mono text-[9px] font-black text-foreground",
                children: value
            }, void 0, false, {
                fileName: "[project]/components/location-analysis.tsx",
                lineNumber: 1273,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/location-analysis.tsx",
        lineNumber: 1248,
        columnNumber: 5
    }, this);
}
_c3 = Telemetry;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "AnimatedScore");
__turbopack_context__.k.register(_c1, "LocationAnalysis");
__turbopack_context__.k.register(_c2, "FactorBar");
__turbopack_context__.k.register(_c3, "Telemetry");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=components_location-analysis_tsx_0gbtgps._.js.map