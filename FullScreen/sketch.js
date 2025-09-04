let P5Instance;
if (P5Instance) P5Instance.remove();

let Sketch = (p) => {};

const SAVE_KEY = "myData";
let files = [
    {
        name:"sketch.js",
        content:"function setup(){\n  //We already maded a full size canvas for you :3\n}\n\nfunction draw(){\n  background(200);\n}",
        state:"saved",
    }
];
try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        const loadedFiles = JSON.parse(saved);
        files = loadedFiles;
    }
} catch (e) {
    console.error("Failed to load project:", e);
}

let customCanvas = false;
function createCanvasHandler(p, container){
    const original = p.createCanvas;
    p.createCanvas = function(...args) {
        original.apply(this, args).parent(container);
        customCanvas = true;
    };
}

function reloadAll(code){
    //check for code safety:
    safeToExecute = scanCode(code);
    if(safeToExecute || allowedToExecute){
        reloadTopSketch(code);
    }
}

function reloadTopSketch(userCode) {
    console.clear();

    // Kill existing sketch
    if (P5Instance) P5Instance.remove();

    // Create a new sketch function dynamically
    Sketch = (p) => {
        let setupFn = () => {};
        let drawFn = () => {};

        //all other non comun functions:
        //{
            let preloadFn = () => {};

            let mousePressedFn = () => {};
            let mouseReleasedFn = () => {};
            let mouseClickedFn = () => {};
            let mouseMovedFn = () => {};
            let mouseDraggedFn = () => {};
            let mouseWheelFn = (event) => {};

            let keyPressedFn = () => {};
            let keyReleasedFn = () => {};
            let keyTypedFn = () => {};

            let touchStartedFn = () => {};
            let touchMovedFn = () => {};
            let touchEndedFn = () => {};

            let windowResizedFn = () => {};
            let deviceMovedFn = () => {};
            let deviceTurnedFn = () => {};
            let deviceShakenFn = () => {};

            let gamepadConnectedFn = (gamepad) => {};
            let gamepadDisconnectedFn = (gamepad) => {};
        //}

        try {
            const wrappedCode = `
                with (p) {
                    ${userCode}
                    if (typeof setup === 'function') setupFn = setup;
                    if (typeof draw === 'function') drawFn = draw;

                    if (typeof preload === 'function') preloadFn = preload;
                    if (typeof remove === 'function') removeFn = remove;

                    if (typeof mousePressed === 'function') mousePressedFn = mousePressed;
                    if (typeof mouseReleased === 'function') mouseReleasedFn = mouseReleased;
                    if (typeof mouseClicked === 'function') mouseClickedFn = mouseClicked;
                    if (typeof mouseMoved === 'function') mouseMovedFn = mouseMoved;
                    if (typeof mouseDragged === 'function') mouseDraggedFn = mouseDragged;
                    if (typeof mouseWheel === 'function') mouseWheelFn = mouseWheel;

                    if (typeof keyPressed === 'function') keyPressedFn = keyPressed;
                    if (typeof keyReleased === 'function') keyReleasedFn = keyReleased;
                    if (typeof keyTyped === 'function') keyTypedFn = keyTyped;

                    if (typeof touchStarted === 'function') touchStartedFn = touchStarted;
                    if (typeof touchMoved === 'function') touchMovedFn = touchMoved;
                    if (typeof touchEnded === 'function') touchEndedFn = touchEnded;

                    if (typeof windowResized === 'function') windowResizedFn = windowResized;
                    if (typeof deviceMoved === 'function') deviceMovedFn = deviceMoved;
                    if (typeof deviceTurned === 'function') deviceTurnedFn = deviceTurned;
                    if (typeof deviceShaken === 'function') deviceShakenFn = deviceShaken;

                    if (typeof gamepadConnected === 'function') gamepadConnectedFn = gamepadConnected;
                    if (typeof gamepadDisconnected === 'function') gamepadDisconnectedFn = gamepadDisconnected;
                }
                //# sourceURL=usercode.js
            `;
            eval(wrappedCode);
        } catch (err) {
            dropError(`Compiler runtime error:`,err);
            p.noLoop();
        }

        p.setup = () => {
            const container = document.getElementById('displayer');
            p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);

            createCanvasHandler(p, container);

            try {
                setupFn();
            } catch (err) {
                dropError(`Sketch setup error:`,err);
                p.noLoop();
            }
        };

        p.windowResized = () => {
            const container = document.getElementById('displayer');
            if(!customCanvas){
                p.resizeCanvas(container.offsetWidth, container.offsetHeight);
            }
        };

        p.draw = () => {
            const container = document.getElementById('displayer');
            try {
                p.push();
                drawFn();
                p.pop();
            } catch (err) {
                dropError(`Sketch runtime error:`,err);
                p.noLoop();
            }
        };

        const hooks = [
            'preload',
            'mousePressed', 'mouseReleased', 'mouseClicked', 'mouseMoved', 'mouseDragged', 'mouseWheel',
            'keyPressed', 'keyReleased', 'keyTyped',
            'touchStarted', 'touchMoved', 'touchEnded',
            'windowResized', 'deviceMoved', 'deviceTurned', 'deviceShaken',
            'gamepadConnected', 'gamepadDisconnected'
        ];

        const fnMap = {
            preloadFn,
            mousePressedFn,
            mouseReleasedFn,
            mouseClickedFn,
            mouseMovedFn,
            mouseDraggedFn,
            mouseWheelFn,
            keyPressedFn,
            keyReleasedFn,
            keyTypedFn,
            touchStartedFn,
            touchMovedFn,
            touchEndedFn,
            windowResizedFn,
            deviceMovedFn,
            deviceTurnedFn,
            deviceShakenFn,
            gamepadConnectedFn,
            gamepadDisconnectedFn
        };

        for (const name of hooks) {
            if(name==="windowResized"){
                if(customCanvas){
                    p[name] = (...args) => {
                        try {
                            const fn = fnMap[`${name}Fn`];
                            if (typeof fn === 'function') fn(...args);
                        } catch (err) {
                            dropError(`Sketch runtime error:`, err);
                            p.noLoop();
                        }
                    };
                }
            }else{
                p[name] = (...args) => {
                    try {
                        const fn = fnMap[`${name}Fn`];
                        if (typeof fn === 'function') fn(...args);
                    } catch (err) {
                        dropError(`Sketch runtime error:`, err);
                        p.noLoop();
                    }
                };
            }
        }
    };

    // Boot it up
    P5Instance = new p5(Sketch);
}

window.addEventListener('load', () => {
    IDEStopSketch()
});

function removeComments(code) {
    return code
        .replace(/\/\/(?!#).*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
}

function extractStrings(code) {
    const stringRegex = /(['"`])(?:\\[\s\S]|(?!\1)[^\\])*\1/g;
    const matches = [...code.matchAll(stringRegex)].map(m => m[0]);
    return matches;
}

function detectScopeEscape(code) {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let escaped = false;

    for (let i = 0; i < code.length; i++) {
        const char = code[i];

        if (inString) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (char === '\\') {
                escaped = true;
                continue;
            }
            if (char === stringChar) {
                inString = false;
                stringChar = '';
            }
            continue;
        }

        if (char === '"' || char === "'" || char === "`") {
            inString = true;
            stringChar = char;
            continue;
        }

        if (char === '{') {
            depth++;
        } else if (char === '}') {
            depth--;
            if (depth < 0) return true; // ¡Escape detectado!
        }
    }

    return false;
}

function scanCode(userCode, fileIndex) {
    let safe = true;

    let processedCode = userCode;
    let strings = extractStrings(processedCode);
    for (let str of strings) {
        processedCode = processedCode.replaceAll(str, '" "');
    }
    processedCode = removeComments(processedCode);

    // String executors
    if(/\beval\b/.test(processedCode)){
        console.warn("Use of 'eval' detected. Executing strings as code is unsafe.");
        safe = false;
    }
    if(/\bFunction\b/.test(processedCode)){
        console.warn("Use of 'Function' constructor detected. It allows executing arbitrary code.");
        safe = false;
    }
    if(/\bsetTimeout\b/.test(processedCode)){
        console.warn("Use of 'setTimeout' detected. This may execute arbitrary or delayed code.");
        safe = false;
    }
    if(/\bsetInterval\b/.test(processedCode)){
        console.warn("Use of 'setInterval' detected. This may execute arbitrary or repeated code.");
        safe = false;
    }
    if (/\bdocument\b/.test(processedCode)) {
        console.warn("Use of 'document' detected. May inject unsafe scripts or HTML.");
        safe = false;
    }
    if (/\.innerHTML\b/.test(processedCode)) {
        console.warn("Use of '.innerHTML' detected. Can lead to script injection.");
        safe = false;
    }
    if (/\blocation\b/.test(processedCode)) {
        console.warn("Modification of 'location' detected. This may redirect the page.");
        safe = false;
    }

    // Third-party or network-related risks
    if (/\bfetch\b/.test(processedCode)) {
        console.warn("Use of 'fetch' detected. May access external or untrusted data.");
        safe = false;
    }
    if (/\bXMLHttpRequest\b/.test(processedCode)) {
        console.warn("Use of 'XMLHttpRequest' detected. May send or receive data without permission.");
        safe = false;
    }
    if (/\bscript.*src\b/.test(processedCode)) {
        console.warn("Third-party script loading detected. Can inject untrusted code.");
        safe = false;
    }
    if (/\bimport\b/.test(processedCode)) {
        console.warn("Use of 'import' detected. Third-party modules may run untrusted code.");
        safe = false;
    }

    // DOM access
    if (/\bdocument\b/.test(processedCode)) {
        console.warn("Access to 'document' detected. Manipulating the DOM can be unsafe.");
        safe = false;
    }
    if (/\bwindow\b/.test(processedCode)) {
        console.warn("Access to 'window' detected. This can allow bypassing sandbox and executing unsafe code.");
        safe = false;
    }
    if (/\belement\b/.test(processedCode)) {
        console.warn("Use of 'element' detected. Direct DOM manipulation is risky.");
        safe = false;
    }
    if (/\bgetElementById\b/.test(processedCode)) {
        console.warn("Use of 'getElementById' detected. Accessing DOM elements directly.");
        safe = false;
    }
    if (/\bgetElementsByClassName\b/.test(processedCode)) {
        console.warn("Use of 'getElementsByClassName' detected. Accessing DOM elements directly.");
        safe = false;
    }
    if (/\bgetElementsByTagName\b/.test(processedCode)) {
        console.warn("Use of 'getElementsByTagName' detected. Accessing DOM elements directly.");
        safe = false;
    }
    if (/\bquerySelector(All)?\b/.test(processedCode)) {
        console.warn("Use of 'querySelector' or 'querySelectorAll' detected. Accessing DOM elements directly.");
        safe = false;
    }
    if (/\bappendChild\b/.test(processedCode)) {
        console.warn("Use of 'appendChild' detected. Modifying the DOM.");
        safe = false;
    }
    if (/\bremoveChild\b/.test(processedCode)) {
        console.warn("Use of 'removeChild' detected. Modifying the DOM.");
        safe = false;
    }
    if (/\bcreateElement\b/.test(processedCode)) {
        console.warn("Use of 'createElement' detected. Creating new DOM elements.");
        safe = false;
    }
    if (/\binnerHTML\b/.test(processedCode)) {
        console.warn("Use of 'innerHTML' detected. Can lead to script injection.");
        safe = false;
    }
    if (/\btextContent\b/.test(processedCode)) {
        console.warn("Use of 'textContent' detected. Direct DOM content manipulation.");
        safe = false;
    }
    if (/\bsetAttribute\b/.test(processedCode)) {
        console.warn("Use of 'setAttribute' detected. Modifying DOM attributes.");
        safe = false;
    }
    if (/\bremoveAttribute\b/.test(processedCode)) {
        console.warn("Use of 'removeAttribute' detected. Modifying DOM attributes.");
        safe = false;
    }
    if (/\bstyle\b/.test(processedCode)) {
        console.warn("Use of 'style' detected. Changing element styles.");
        safe = false;
    }
    if (/\blocation\b/.test(processedCode)) {
        console.warn("Use of 'location' detected. This can redirect the page.");
        safe = false;
    }
    if (/\bwith\b/.test(processedCode)) {
        console.warn("Use of 'with' detected. using different scope.");
        safe = false;
    }

    // multi-file syntax detection
    if(typeof fileIndex === "number" && !isNaN(fileIndex)){
        // Detect "<File Start, name:"...", size:###>" at the start of a line (no space or anything before)
        if (/^<File Start, name:"[^"]+", size:\d+>/m.test(processedCode)) {
            console.warn("Use of '<File Start, name:\"...\", size:###>' detected. This is an internal syntax meant for multiple files.");
            safe = false;
        }
    }

    // the //# detection
    if (processedCode.includes('//#')) {
        console.warn("Use of '//#' detected. This may indicate a source mapping or directive.");
        safe = false;
    }

    // Wrapper escape check
    if (detectScopeEscape(processedCode)) {
        console.warn("Unbalanced closing braces detected. Code may escape intended execution scope.");
        safe = false;
    }

    if (typeof fileIndex === "number" && !isNaN(fileIndex)) {
        if (safe) {
            if(files[fileIndex].state==="unsafe"){
                files[fileIndex].state==="notSaved";
                document.querySelectorAll('#tabs-list .tab')[fileIndex].style.setProperty('--tab-active-border-color', '#888');
            }
            if(files[fileIndex].state==="savedUnsafe"){
                files[fileIndex].state==="saved";
                document.querySelectorAll('#tabs-list .tab')[fileIndex].style.setProperty('--tab-active-border-color', '#486');
            }
        }else{
            if(files[fileIndex].state==="notSaved"){
                files[fileIndex].state==="unsafe";
                document.querySelectorAll('#tabs-list .tab')[fileIndex].style.setProperty('--tab-active-border-color', '#ff2');
            }
            if(files[fileIndex].state==="saved"){
                files[fileIndex].state==="savedUnsafe";
                document.querySelectorAll('#tabs-list .tab')[fileIndex].style.setProperty('--tab-active-border-color', '#ff2');
            }
        }
    }

    return safe;
}