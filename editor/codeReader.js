let isDirty = false;

let HotReload = false;

let CodePaused = false;

/*const editor = CodeMirror.fromTextArea(document.getElementById('code-input'), {
    mode: 'javascript',
    theme: 'dracula',
    lineNumbers: true,
    lineWrapping: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    tabSize: 2,
    indentUnit: 2,
    autofocus: true,
});*/

let userSketch = {
    setup: null,
    draw: null,
};

function mapErrorToEditor(err, userCodeLineOffset = 1) {
    const rawStack = err.stack || '';
    const userLines = rawStack
        .split('\n')
        .filter(line => line.includes('usercode.js'))
        .map(line => {
        const match = line.match(/usercode\.js:(\d+):(\d+)/);
        if (!match) return null;
            const [, lineNum, colNum] = match.map(Number);
            return {
                original: line,
                line: lineNum - userCodeLineOffset -1,
                column: colNum > 1 ? colNum -(lineNum == 1 ? 20:0) : null,
            };
        })
        .filter(Boolean);

    return userLines;
}

function getWordBounds(lineText, column) {
    const start = lineText.slice(0, column).search(/\b\w+$/);
    const endMatch = lineText.slice(column).match(/^\w+\b/);
    const end = endMatch ? column + endMatch[0].length : column + 1;

    return { start, end };
}

let userGlobalScope = {};

let topP5Instance;
let bottomP5Instance;

let commandsQueue = [];
let lastEditorErrorMark = null;

let loads = [];

let customCanvas = null;
function createCanvasHandler(p, container){
    const original = p.createCanvas;
    p.createCanvas = function(...args) {
        original.apply(this, args).parent(container);
        customCanvas = { width: args[0], height: args[1] };
    };
}

let safeToExecute=true;
let allowedToExecute=false;

const ifr=document.getElementById("sketchFrame");
const iframeOrigin = new URL(ifr.src, window.location.href).origin;

async function createScannerWorker() {
    const code = await (await fetch("/editor/scanner.js")).text();
    const blob = new Blob([code], { type: "text/javascript" });
    const blobURL = URL.createObjectURL(blob);
    const worker = new Worker(blobURL, { type: "module" });

    worker.onmessage = (e) => console.log("[main] got:", e.data);
    worker.onerror = (e) =>
        console.error("[main] Worker error:", e.message, e.filename, e.lineno);
    
    return worker;
}


// This version works in non-module scripts too:
/*let scannerWorker
(async ()=>{
    scannerWorker = await createScannerWorker();// = new Worker("scanner.js", { type: "module" });
})();*/
//scannerWorker.postMessage({ test: "ping" });

/*scannerWorker.onmessage = (event) => {
    if(event.data.cmd = "ScanResult") safeToExecute = event.data.result;
};*/

function reloadAll(code){
    customCanvas = null
    //check for code safety:
    //safeToExecute = acornSimulator.safe;//acornScanner(code);
    if(safeToExecute || allowedToExecute){
        reloadTopSketch(code);
        const EditorViewIsHidden = document.getElementById("output-bottom").classList.contains("hidden");
        if (!EditorViewIsHidden) {
            setTimeout(()=>{ifr.contentWindow.postMessage({ cmd: 'areYouWebGL?'}, "*")},100);
        }
    }else{
        /*const overlay=document.getElementById('alert-overlay');
        overlay.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.add('visible');
        }, 10);*/
    }
}

window.addEventListener('message', e => {
    //if (e.origin !== iframeOrigin) return;
    if (e.data.cmd === 'hereIsIfImWebGL') {
        reloadBottomSketch(e.data.data);
    }
    if (e.data.cmd === 'hereIsMyQueue') {
        commandsQueue=e.data.data;
    }
    if (e.data.cmd === 'console.log') {
        let clearArgs = [];
        for(let arg of e.data.args){
            switch(arg.type){
                case "normalArg":
                    clearArgs.push(arg.value);
                    break;
                case "noCloneable":
                    clearArgs.push("<noCloneable Item>");
                    break;
            }
        }
        console.log(...clearArgs);
    }
    if (e.data.cmd === 'console.warn') {
        let clearArgs = [];
        for(let arg of e.data.args){
            switch(arg.type){
                case "normalArg":
                    clearArgs.push(arg.value);
                    break;
                case "noCloneable":
                    clearArgs.push("<noCloneable Item>");
                    break;
            }
        }
        console.warn(...clearArgs);
    }
    if (e.data.cmd === 'console.error') {
        let clearArgs = [];
        for(let arg of e.data.args){
            switch(arg.type){
                case "normalArg":
                    clearArgs.push(arg.value);
                    break;
                case "noCloneable":
                    clearArgs.push("<noCloneable Item>");
                    break;
            }
        }
        console.error(...clearArgs);
    }
    if (e.data.cmd === 'console.clear') {
        console.clear();
    }
    if (e.data.cmd === 'IloadedANoCloneableItem') {
        loads.push({type:e.data.type,args:e.data.data});
    }
    if (e.data.cmd === 'INeedToLoadANoCloneableItem') {
        let args = e.data.data;
        switch(e.data.type){
            case "string":{
                let file = files.filter(f => f.type==="txt").find(f => f.name===args[0])
                if(file){
                    let result = file.editor.getValue();
                    ifr.contentWindow.postMessage({ cmd: 'hereIsYourLoad', index: e.data.index, data: result.split("\n")}, "*")
                    //internalLoads.push(result);
                    if(args[1]) args[1](result);
                }else{
                    if(args[2]) args[2]("404 File not found");
                }
                break;
            }
            case "json":{
                let file = files.filter(f => f.type==="json").find(f => f.name===args[0])
                if(file){
                    let result = file.editor.getValue();
                    ifr.contentWindow.postMessage({ cmd: 'hereIsYourLoad', index: e.data.index, data: JSON.parse(result)}, "*")
                    //internalLoads.push(result);
                    if(args[1]) args[1](result);
                }else{
                    if(args[2]) args[2]("404 File not found");
                }
                break;
            }
        }
        
    }
});

function dropError(label,err){
    const mapped = mapErrorToEditor(err);
    const first = mapped[0] || { line: "?", column: "?" };

    let errorFileIndex=0;
    if(typeof first.line === 'number'){
        for(let file of files){
            if(first.line>file.editor.getValue().split('\n').length){
                errorFileIndex++;
                first.line-=file.editor.getValue().split('\n').length;
            }else{
                break;
            }
        }
    }else{
        errorFileIndex=0;
    }

    if (first.column && first.column !== 1) {
        console.error(`${label} ${err.toString()}\n at ${files[errorFileIndex].name} on line ${first.line}, column ${first.column}`);
        if (typeof first.line === 'number' && typeof first.column === 'number') {
            const lineText = files[errorFileIndex].editor.getLine(first.line - 1);
            const { start, end } = getWordBounds(lineText, first.column - 1);
            const from = { line: first.line - 1, ch: start };
            const to = { line: first.line - 1, ch: end };

            if (lastEditorErrorMark) lastEditorErrorMark.clear();

            lastEditorErrorMark = files[errorFileIndex].editor.markText(from, to, {
                className: "cm-error-highlight"
            });
        }
    } else {
        console.error(`${label} ${err.toString()}\n at ${files[errorFileIndex].name} on line ${first.line}`);
        if (typeof first.line === 'number' && typeof first.column === 'number') {
            const from = { line: first.line - 1, ch: 0 };s
            const to = { line: first.line - 1, ch: files[errorFileIndex].editor.getLine(first.line - 1).length };

            if (lastEditorErrorMark) lastEditorErrorMark.clear();

            lastEditorErrorMark = files[errorFileIndex].editor.markText(from, to, {
                className: 'cm-error-highlight'
            });
        }
    }

    document.querySelectorAll('#tabs-list .tab')[errorFileIndex].style.setProperty('--tab-active-border-color', '#F05')
}

const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn
};

const consoleOutput = document.getElementById('console-output');

function appendToConsole(type, args) {
    const msg = [...args].map(a => {
        try {
            return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
        } catch (e) {
            return '[unserializable]';
        }
    }).join(' ');

    const line = document.createElement('div');
    line.textContent = msg;
    line.style.padding = '5px';
    line.style.margin = '5px';
    line.style.borderRadius = '5px';

    if (type === 'error') {
        switch(config.theme){
            case 'light':
                line.style.backgroundColor = '#faa';
                line.style.color = '#A00';
                break;
            case 'dark':
                line.style.backgroundColor = '#500';
                line.style.color = '#faa';
                break;
            default:
                line.style.backgroundColor = '#faa';
                line.style.color = '#A00';
        }
    } else if (type === 'warn') {
        switch(config.theme){
            case 'light':
                line.style.backgroundColor = '#ffa';
                line.style.color = '#550';
                break;
            case 'dark':
                line.style.backgroundColor = '#550';
                line.style.color = '#ff5';
                break;
            default:
                line.style.backgroundColor = '#ffa';
                line.style.color = '#550';
        }
    } else {
        switch(config.theme){
            case 'ligth':
                line.style.color = '#222';
                break;
            case 'dark':
                line.style.color = '#AAA';
                break;
            default:
                line.style.color = '#222';
        }
    }

    consoleOutput.appendChild(line);

    // 💡 Ensure auto-scroll happens AFTER DOM update
    setTimeout(() => {
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }, 0);
}

function clearConsole(){
    consoleOutput.innerHTML = '';
}

// Override native console
console.log = (...args) => {
    appendToConsole('log', args);
    originalConsole.log(...args);
};
console.warn = (...args) => {
    appendToConsole('warn', args);
    originalConsole.warn(...args);
};
console.error = (...args) => {
    appendToConsole('error', args);
    originalConsole.error(...args);

    // Try to extract error position if first argument is an Error
    if (args[0] instanceof Error && args[0].stack) {
        const mapped = mapErrorToEditor(args[0]);
        if (mapped.length > 0) {
            const first = mapped[0];
            originalConsole.error(`(at line ${first.line}, column ${first.column})`);
        }
    }
};

console.clear = () => {
    clearConsole();
}

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

function removeRegexes(code) {
    const regexRegex = /\/(?![/*])(?:\\.|[^\/\\\r\n])+\/[gimsuy]*/g;
    return code.replace(regexRegex, '"___SAFE_REGEX___"');
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

let safe=false;

let sketchCam;

function reloadTopSketch(userCode) {
    ifr.contentWindow.postMessage({ cmd: 'reload', data: userCode }, "*");
    //ifr.contentWindow.reloadSketch(userCode);
    console.clear();

    // Kill existing sketch
    if (topP5Instance) topP5Instance.remove();

    // Create a new sketch function dynamically
    
    /*
    topSketch = (p) => {
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

        let mirrorDisabled = false;
        let isRecordingUserCode = false;
        function mirrorFunction(p, fnName) {
            const originalFn = p[fnName];
            p[fnName] = function(...args) {
                if (mirrorDisabled) {
                    return originalFn.apply(this, args);
                }

                mirrorDisabled = true;
                const result = originalFn.apply(this, args);
                mirrorDisabled = false;
            
                if (isRecordingUserCode) {
                    commandsQueue.push({type:"functionCall", fnName, args });
                }

                return result;
            };
        }

        if (lastEditorErrorMark) {
            lastEditorErrorMark.clear();
            lastEditorErrorMark = null;
        }

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

        let setItUp = false;
        p.setup = () => {
            const container = document.getElementById('output-top');
            p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);

            const originalCtx = p.drawingContext;
            p.drawingContext = new Proxy(originalCtx, {
                set(target, prop, value) {
                    commandsQueue.push({ type: 'variableSet', prop, value });
                    target[prop] = value;
                    return true;
                },
                get(target, prop) {
                    const val = target[prop];
                    if (typeof val === 'function') {
                        return function(...args) {
                            commandsQueue.push({ type: 'variableCall', name: prop, args });
                            return val.apply(target, args);
                        }
                    }
                    return val;
                }
            });
            const p5Fns = [
                // Primitive Drawing
                'point', 'line', 'rect', 'ellipse', 'circle', 'arc', 'bezier',
                'triangle', 'quad', 'beginShape', 'vertex', 'bezierVertex', 'curveVertex', 'endShape',
                'image', 'text',
            
                // Style Configuration
                'fill', 'noFill', 'stroke', 'noStroke', 'strokeWeight', 'strokeCap', 'strokeJoin',
                'colorMode', 'imageMode', 'rectMode', 'ellipseMode', 'angleMode',
                'tint', 'noTint', 'blendMode',
                'textFont', 'textSize', 'textAlign', 'textStyle', 'textLeading',
            
                // Transformations
                'translate', 'rotate', 'scale', 'shearX', 'shearY',
                'applyMatrix', 'resetMatrix', 'push', 'pop',
            
                // Canvas Region / State Control
                'beginClip', 'endClip',
            
                // Pixel Manipulation
                'loadPixels', 'updatePixels', 'get', 'set', 'filter', 'blend',
            
                // Direct Canvas Context Access
                //'drawingContext',

                // WEBGL functions:
                'camera',
                'ambientLight', 'directionalLight', 'pointLight', 'spotLight',
                'ambientMaterial', 'specularMaterial', 'emissiveMaterial', 'shininess',
                'model', 'loadModel', 'normalMaterial',
                'texture', 'textureMode',
                'box', 'sphere', 'cylinder', 'cone', 'torus', 'plane',
                'rotateX', 'rotateY', 'rotateZ',
                'createShader', 'shader', 'resetShader',
                'createFramebuffer', 'framebuffer', 'setUniform',
                'createTexture', 'textureWrap', 'textureFilter',
                'createGraphics',
                'getCamera', 'setCamera',
                'lights', 'noLights',
                'createEasyCam', 'easycam',
                'loadShader', 'loadModel',
                'createBuffer', 'bindBuffer', 'bufferData', 'drawArrays', 'drawElements'
            ];

            p5Fns.forEach(fnName => mirrorFunction(p, fnName));

            createCanvasHandler(p, container);

            p.windowWidth = container.offsetWidth;
            p.windowHeight = container.offsetHeight;

            try {
                setItUp = true;
                commandsQueue = [];
                isRecordingUserCode = true;
                setupFn();
                isRecordingUserCode = false;
                if(isWebGL) sketchCam = p.createCamera();
            } catch (err) {
                dropError(`Sketch setup error:`,err);
                p.noLoop();
            }
        };

        p.windowResized = () => {
            const container = document.getElementById('output-top');
            if(!customCanvas){
                p.resizeCanvas(container.offsetWidth, container.offsetHeight);
            }
        };

        p.draw = () => {
            const container = document.getElementById('output-top');
            try {
                //if(!isWebGL) p.push();
                if(!setItUp){
                    commandsQueue = [];
                }else{
                    setItUp = false;
                }
                isRecordingUserCode = true;
                drawFn();
                isRecordingUserCode = false;
                //if(!isWebGL) p.pop();
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

        p.evaluateFromConsole = (code) => {
            /*try {
                with (p) {
                    return { type: "log", log: eval(code) };
                }
            } catch (err) {
                return { type: "error", error: err.toString() };
            }/
        };
    };
    //*/

    // Boot it up
    //topP5Instance = new p5(topSketch);
}

function reloadBottomSketch(isWebGL) {
    // Kill existing sketch
    if (bottomP5Instance) bottomP5Instance.remove();

    // Create a new sketch function dynamically
    bottomSketch = (p) => {
        let CameraContainer;
        let cam;

        const internalLoads = [];

        p.preload = () => {
            for(let load of loads){
                switch(load.type){
                    case "image":
                        internalLoads.push(p.loadImage(...load.args));
                        break;
                    case "string":{
                        let file = files.filter(f => f.type==="txt").find(f => f.name===load.args[0])
                        if(file){
                            let result = file.editor.getValue().split("\n");
                            internalLoads.push(result);
                            if(load.args[1]) load.args[1](result);
                        }else{
                            if(load.args[2]) load.args[2]("404 File not found");
                        }
                        break;
                    }
                    case "json":{
                        let file = files.filter(f => f.type==="json").find(f => f.name===load.args[0])
                        if(file){
                            let result = file.editor.getValue().split("\n");
                            internalLoads.push(result);
                            if(load.args[1]) load.args[1](result);
                        }else{
                            if(load.args[2]) load.args[2]("404 File not found");
                        }
                        break;
                    }
                }
            }
        }

        p.setup = () => {
            const container = document.getElementById('output-bottom');
            CameraContainer = document.getElementById('output-top');

            if(isWebGL) p.createCanvas(container.offsetWidth, container.offsetHeight, p.WEBGL).parent(container);
            else p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);

            if(isWebGL) cam = p.createCamera();


            p.createCanvas=()=>{};
            p.createCamera=()=>{};

            // Track focus state based on canvas focus
            const canvas = p.canvas;
            canvas.addEventListener('mouseenter', () => editorFocused = false);
            canvas.addEventListener('mouseleave', () => editorFocused = true);
        };

        p.windowResized = () => {
            const container = document.getElementById('output-bottom');
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        };

        let interpol = false;
        let userDrawingContext;
        p.draw = () => {
            ifr.contentWindow.postMessage({ cmd: 'yourQueuePlease'}, "*");
            const ctx = p._renderer.drawingContext;
            function resetAllModes(p) {
                // Geometry & interpretation modes
                p.rectMode(p.CORNER);
                p.ellipseMode(p.CENTER);
                p.imageMode(p.CORNER);
                p.colorMode(p.RGB, 255);
                p.angleMode(p.RADIANS);
                p.textAlign(p.LEFT, p.BASELINE);

                // Basic drawing styles
                p.stroke(0);
                p.fill(255);
                p.strokeWeight(1);
                p.strokeCap(p.ROUND);
                p.strokeJoin(p.MITER);
                p.blendMode(p.BLEND);
                p.noSmooth(false); // reset smoothing if used

                // Reset transform
                p.resetMatrix();
            }
            resetAllModes(p);
            const container = document.getElementById('output-bottom');
            if (p.canvas.parentNode !== container) {
                container.appendChild(p.canvas);
                const canvas = p.canvas;
                canvas.addEventListener('mouseenter', () => editorFocused = false);
                canvas.addEventListener('mouseleave', () => editorFocused = true);
            }
            const originalDrawingContext = p._renderer.drawingContext
            if(isWebGL){
                p.background(config.theme? config.theme==="dark"?25:200:200);

                // Update camera position if editorCamera.eyeX/Y/Z changed
                if (typeof cam !== "undefined" && cam) {
                    cam.setPosition(editorCamera.eyeX || cam.eyeX, editorCamera.eyeY || cam.eyeY, editorCamera.eyeZ || cam.eyeZ);
                    cam.lookAt(editorCamera.centerX || 0, editorCamera.centerY || 0, editorCamera.centerZ || 0);
                }
            
                if (p.mouseX >= 0 && p.mouseY >= 0 && p.mouseX <= p.width && p.mouseY <= p.height) {
                    p.orbitControl();
                    editorCamera.eyeX=cam.eyeX;
                    editorCamera.eyeY=cam.eyeY;
                    editorCamera.eyeZ=cam.eyeZ;
                    editorCamera.centerX=cam.centerX;
                    editorCamera.centerY=cam.centerY;
                    editorCamera.centerZ=cam.centerZ;
                }
                p.push();
                p.stroke(config.theme? config.theme==="dark"?255:0:0,config.theme? config.theme==="dark"?255:0:0,config.theme? config.theme==="dark"?255:0:0,100);
                p.strokeWeight(1);
                p.noFill();
                let pos = cam.eyeX ? {x: cam.eyeX, y: cam.eyeY, z: cam.eyeZ} : {x:0,y:0,z:800};
                for(let i=-100;i<100;i++){
                    p.line(-2e4,0,i*100+p.floor(pos.z/200)*200,2e4,0,i*100+p.floor(pos.z/200)*200);
                    p.line(i*100+p.floor(pos.x/200)*200,0,-2e4,i*100+p.floor(pos.x/200)*200,0,2e4);
                }
                p.stroke(255,0,0,100)
                p.line(-2e4,0,0,2e4,0,0);
                p.stroke(0,0,255,100)
                p.line(0,0,-2e4,0,0,2e4);
                p.stroke(0,255,config.theme? config.theme==="dark"?255:0:0,100)
                p.line(0,-2e4,0,0,2e4,0);
                p.pop();

                p.push();
                p.stroke(config.theme? config.theme==="dark"?255:0:0,config.theme? config.theme==="dark"?255:0:0,config.theme? config.theme==="dark"?255:0:0);
                p.noFill();
                let sketchCamPos = sketchCam.eyeX ? {x: sketchCam.eyeX, y: sketchCam.eyeY, z: sketchCam.eyeZ} : {x:0,y:0,z:800};
                if (topP5Instance && topP5Instance._renderer) {
                    const w = topP5Instance._renderer.width;
                    const h = topP5Instance._renderer.height;
                    // Get camera orientation angles
                    const camX = sketchCam.eyeX || 0;
                    const camY = sketchCam.eyeY || 0;
                    const camZ = sketchCam.eyeZ || 800;
                    const centerX = sketchCam.centerX || 0;
                    const centerY = sketchCam.centerY || 0;
                    const centerZ = sketchCam.centerZ || 0;

                    //Get camera rendering mode
                    const isPerspective = sketchCam.cameraType === "default";

                    // Calculate direction vector
                    const dx = centerX - camX;
                    const dy = centerY - camY;
                    const dz = centerZ - camZ;

                    // Calculate yaw and pitch
                    const yaw = Math.atan2(dx, dz);
                    const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

                    p.translate(sketchCamPos.x,sketchCamPos.y,sketchCamPos.z);
                    p.rotateY(yaw);
                    p.rotateX(-pitch);
                    p.rectMode(p.CENTER);
                    // Calculate min and max render distance planes
                    const camDist = Math.sqrt(
                        Math.pow(sketchCam.centerX - sketchCam.eyeX, 2) +
                        Math.pow(sketchCam.centerY - sketchCam.eyeY, 2) +
                        Math.pow(sketchCam.centerZ - sketchCam.eyeZ, 2)
                    );

                    //console.log(sketchCam.fov);
                    const fov = sketchCam.cameraFOV || Math.PI / 8.5;
                    const aspect = sketchCam.aspectRatio || (topP5Instance._renderer.width / topP5Instance._renderer.height);
                    const near = sketchCam.cameraNear;
                    const far = sketchCam.cameraFar;

                    // Calculate frustum corners in camera space
                    function getFrustumCorners(dist) {
                        const h = isPerspective? (2 * Math.tan(fov / 2) * dist) : topP5Instance._renderer.height;
                        const w = isPerspective? (h * aspect) : topP5Instance._renderer.width;
                        
                        return [
                            [ -w / 2,  h / 2, -dist + 880 - near ], // top-left
                            [  w / 2,  h / 2, -dist + 880 - near ], // top-right
                            [  w / 2, -h / 2, -dist + 880 - near ], // bottom-right
                            [ -w / 2, -h / 2, -dist + 880 - near ]  // bottom-left
                        ];
                    }

                    const nearCorners = getFrustumCorners(near);
                    const farCorners = getFrustumCorners(far);

                    // Draw frustum lines
                    p.stroke(theme? theme==="dark"?255:0:0, theme? theme==="dark"?255:0:0, theme? theme==="dark"?255:0:0,100);
                    p.strokeWeight(2);
                    p.push();
                    p.translate(0, 0, 800); // Camera origin

                    for (let i = 0; i < 4; i++) {
                        // Draw near plane
                        p.beginShape();
                        for (let j = 0; j < 4; j++) {
                            p.vertex(nearCorners[j][0], nearCorners[j][1], -nearCorners[j][2]);
                        }
                        p.endShape(p.CLOSE);

                        // Draw far plane
                        p.beginShape();
                        for (let j = 0; j < 4; j++) {
                            p.vertex(farCorners[j][0], farCorners[j][1], -farCorners[j][2]);
                        }
                        p.endShape(p.CLOSE);
                        // Connect near and far planes
                        p.line(nearCorners[i][0], nearCorners[i][1], -nearCorners[i][2],
                                farCorners[i][0], farCorners[i][1], -farCorners[i][2]);
                    }
                    p.pop();
                }
                p.pop();

                /*if (userDrawingContext) {
                    restoreContext(ctx,userDrawingContext);
                }*/
                //p._renderer.drawingContext = topP5Instance._renderer.drawingContext;
                commandsQueue.forEach(cmd => {
                    let clearArgs = [];
                    /*for(let arg of cmd.args){
                        if(arg.type === "normalArg"){
                            clearArgs.push(arg.value);
                        }else if(arg.type === "noCloneable"){
                            clearArgs.push(loads[arg.index]);
                        }
                    }*/
                    //if(cmd.type === "functionCall") p[cmd.fnName](...clearArgs);
                    if(cmd.type === "functionCall") p[cmd.fnName](...cmd.args);
                });
                //p._renderer.drawingContext = originalDrawingContext;

                if(!editorFocused){
                    // forward vector
                    let fx = editorCamera.centerX - editorCamera.eyeX;
                    let fy = editorCamera.centerY - editorCamera.eyeY;
                    let fz = editorCamera.centerZ - editorCamera.eyeZ;

                    // normalize
                    let len = Math.sqrt(fx*fx + fy*fy + fz*fz);
                    fx /= len; fy /= len; fz /= len;

                    // right vector = cross(forward, up)
                    let up = {x:0, y:1, z:0};
                    let rx = fy*up.z - fz*up.y;
                    let ry = fz*up.x - fx*up.z;
                    let rz = fx*up.y - fy*up.x;
                    let rlen = Math.sqrt(rx*rx + ry*ry + rz*rz);
                    rx /= rlen; ry /= rlen; rz /= rlen;

                    let v = 10; // o 1 si quieres suavizado

                    if(p.keyIsDown(87)){ // W
                        editorCamera.eyeX += fx*v;
                        editorCamera.eyeY += fy*v;
                        editorCamera.eyeZ += fz*v;
                        editorCamera.centerX += fx*v;
                        editorCamera.centerY += fy*v;
                        editorCamera.centerZ += fz*v;
                        interpol = false;
                    }
                    if(p.keyIsDown(83)){ // S
                        editorCamera.eyeX -= fx*v;
                        editorCamera.eyeY -= fy*v;
                        editorCamera.eyeZ -= fz*v;
                        editorCamera.centerX -= fx*v;
                        editorCamera.centerY -= fy*v;
                        editorCamera.centerZ -= fz*v;
                        interpol = false;
                    }
                    if(p.keyIsDown(65)){ // A
                        editorCamera.eyeX -= rx*v;
                        editorCamera.eyeY -= ry*v;
                        editorCamera.eyeZ -= rz*v;
                        editorCamera.centerX -= rx*v;
                        editorCamera.centerY -= ry*v;
                        editorCamera.centerZ -= rz*v;
                        interpol = false;
                    }
                    if(p.keyIsDown(68)){ // D
                        editorCamera.eyeX += rx*v;
                        editorCamera.eyeY += ry*v;
                        editorCamera.eyeZ += rz*v;
                        editorCamera.centerX += rx*v;
                        editorCamera.centerY += ry*v;
                        editorCamera.centerZ += rz*v;
                        interpol = false;
                    }
                    if(p.keyIsDown(81)){ // Q - subir
                        editorCamera.eyeY += v;
                        editorCamera.centerY += v;
                        interpol = false;
                    }
                    if(p.keyIsDown(69)){ // E - bajar
                        editorCamera.eyeY -= v;
                        editorCamera.centerY -= v;
                        interpol = false;
                    }
                    if(p.keyIsDown(82)){ // R - zoom in
                        let fx = editorCamera.centerX - editorCamera.eyeX;
                        let fy = editorCamera.centerY - editorCamera.eyeY;
                        let fz = editorCamera.centerZ - editorCamera.eyeZ;
                        editorCamera.eyeX += fx * 0.1;
                        editorCamera.eyeY += fy * 0.1;
                        editorCamera.eyeZ += fz * 0.1;
                        interpol = false;
                    }
                    if(p.keyIsDown(70)){ // F - zoom out
                        let fx = editorCamera.centerX - editorCamera.eyeX;
                        let fy = editorCamera.centerY - editorCamera.eyeY;
                        let fz = editorCamera.centerZ - editorCamera.eyeZ;
                        editorCamera.eyeX -= fx * 0.1;
                        editorCamera.eyeY -= fy * 0.1;
                        editorCamera.eyeZ -= fz * 0.1;
                        interpol = false;
                    }
                    if(p.keyIsDown(32)){ // Space - reset
                        interpol = true;
                    }
                    if (p.mouseIsPressed) {
                        interpol = false;
                    }
                    if(interpol){
                        const smooth = 0.2;

                        editorCamera.centerX = p.lerp(editorCamera.centerX, sketchCam.centerX, smooth);
                        editorCamera.centerY = p.lerp(editorCamera.centerY, sketchCam.centerY, smooth);
                        editorCamera.centerZ = p.lerp(editorCamera.centerZ, sketchCam.centerZ, smooth);
                        editorCamera.eyeX = p.lerp(editorCamera.eyeX, sketchCam.eyeX, smooth);
                        editorCamera.eyeY = p.lerp(editorCamera.eyeY, sketchCam.eyeY, smooth);
                        editorCamera.eyeZ = p.lerp(editorCamera.eyeZ, sketchCam.eyeZ, smooth);
                        cam.setPosition(editorCamera.eyeX, editorCamera.eyeY, editorCamera.eyeZ);
                    }
                }
            }else{
                editorCamera.x=p.lerp(editorCamera.x,editorCamera.tx,0.1);
                editorCamera.y=p.lerp(editorCamera.y,editorCamera.ty,0.1);
                editorCamera.z=p.lerp(editorCamera.z,editorCamera.tz,0.1);

                p.background(config.theme? config.theme==="dark"?25:200:200);

                // === Guide Overlay ===
                p.push();
                p.translate(p.width / 2, p.height / 2);
                p.scale(editorCamera.z);
                p.translate(editorCamera.x, editorCamera.y);

                // Draw axes
                p.stroke(255, 0, 0, 100);
                p.strokeWeight(1 / editorCamera.z);
                p.line((-p.width/2)/editorCamera.z-editorCamera.x, 0, (p.width/2)/editorCamera.z-editorCamera.x, 0); // X axis
                p.stroke(0, config.theme? config.theme==="dark"?255:0:0, config.theme? config.theme==="dark"?0:255:255, 100);
                p.line(0, (-p.height/2)/editorCamera.z-editorCamera.y, 0, (p.height/2)/editorCamera.z-editorCamera.y); // Y axis

                // Draw origin crosshair
                p.stroke(config.theme? config.theme==="dark"?255:0:0, config.theme? config.theme==="dark"?255:0:0, config.theme? config.theme==="dark"?255:0:0, 200);
                p.strokeWeight(2 / editorCamera.z);
                p.line(-10, 0, 10, 0);
                p.line(0, -10, 0, 10);

                // Optional grid
                if (editorCamera.z > 0.03) {
                    p.stroke(config.theme? config.theme==="dark"?255:0:0, config.theme? config.theme==="dark"?255:0:0, config.theme? config.theme==="dark"?255:0:0, config.theme? config.theme==="dark"?10:100:100);

                    let left = (-p.width / 2) / editorCamera.z - editorCamera.x;
                    let right = (p.width / 2) / editorCamera.z - editorCamera.x;
                    let top = (-p.height / 2) / editorCamera.z - editorCamera.y;
                    let bottom = (p.height / 2) / editorCamera.z - editorCamera.y;

                    let startX = Math.floor(left / 100) * 100;
                    let endX = Math.ceil(right / 100) * 100;
                    let startY = Math.floor(top / 100) * 100;
                    let endY = Math.ceil(bottom / 100) * 100;

                    for (let x = startX; x <= endX; x += 100) {
                        p.line(x, top, x, bottom);
                    }
                    for (let y = startY; y <= endY; y += 100) {
                        p.line(left, y, right, y);
                    }
                }
                p.pop();

                //p.push();
                p.translate(p.width / 2, p.height / 2);
                p.scale(editorCamera.z);
                p.translate(editorCamera.x, editorCamera.y);
                p.translate(-p.width / 2, -p.height / 2);

                if(customCanvas){
                    p.translate((container.offsetWidth - customCanvas.width)/2, (container.offsetHeight - customCanvas.height)/2);
                }else{
                    p.translate(0, (container.offsetHeight - CameraContainer.offsetHeight)/2);
                };

                const trackedProps = [
                    "fillStyle", "strokeStyle", "lineWidth", "lineCap", "lineJoin",
                    "miterLimit", "globalAlpha", "globalCompositeOperation",
                    "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY",
                    "font", "textAlign", "textBaseline",
                    "imageSmoothingEnabled", "imageSmoothingQuality",
                    "filter"
                ];

                function snapshotContext(ctx, props) {
                    const snap = {};
                    for (const p of props) snap[p] = ctx[p];
                    snap.lineDash = ctx.getLineDash();
                    return snap;
                }

                function restoreContext(ctx, snap) {
                    for (const [k, v] of Object.entries(snap)) {
                        if (k === "lineDash") ctx.setLineDash(v);
                        else ctx[k] = v;
                    }
                }

                ctx.save();
                if (userDrawingContext) {
                    restoreContext(ctx,userDrawingContext);
                }
                
                commandsQueue.forEach(cmd => {
                    let clearArgs = [];
                    for(let arg of cmd.args){
                        if(arg.type === "normalArg"){
                            clearArgs.push(arg.value);
                        }else if(arg.type === "noCloneable"){
                            clearArgs.push(internalLoads[arg.index]);
                        }
                    }
                    if(cmd.type === "functionCall") p[cmd.fnName](...clearArgs);

                    //if(cmd.type === "functionCall") p[cmd.fnName](...cmd.args);
                    //if(cmd.type === "variableSet") ctx[cmd.prop] = cmd.value;
                    //if(cmd.type === "variableCall") ctx[cmd.name](...cmd.args);
                });
                userDrawingContext = snapshotContext(ctx, trackedProps);
                ctx.restore()
                //p._renderer.drawingContext = originalDrawingContext;

                p.push();
                resetAllModes(p);
                p.resetMatrix();
                p.translate(p.width / 2, p.height / 2);
                p.scale(editorCamera.z);
                p.translate(editorCamera.x, editorCamera.y);
                p.stroke(config.theme? config.theme==="dark"?200:20:20,config.theme? config.theme==="dark"?200:20:20,config.theme? config.theme==="dark"?200:20:20,150);
                p.strokeWeight(5);
                p.fill(config.theme? config.theme==="dark"?200:20:20,config.theme? config.theme==="dark"?200:20:20,config.theme? config.theme==="dark"?200:20:20,100);
                p.circle(0,0,50);
                p.noFill();
                p.rectMode(p.CENTER);
                if(customCanvas){
                    p.rect(0,0,customCanvas.width, customCanvas.height);
                }else{
                    p.rect(0,0,CameraContainer.offsetWidth, CameraContainer.offsetHeight);
                };
                p.pop();

                if(!editorFocused){
                    if(p.keyIsDown(87)){
                        editorCamera.ty+=10/editorCamera.z;
                    }
                    if(p.keyIsDown(83)){
                        editorCamera.ty-=10/editorCamera.z;
                    }
                    if(p.keyIsDown(65)){
                        editorCamera.tx+=10/editorCamera.z;
                    }
                    if(p.keyIsDown(68)){
                        editorCamera.tx-=10/editorCamera.z;
                    }
                    if(p.keyIsDown(82)){
                        editorCamera.tz*=1.1;
                    }
                    if(p.keyIsDown(70)){
                        editorCamera.tz/=1.1;
                    }
                    if(p.keyIsDown(32)){
                        editorCamera.tx=0;
                        editorCamera.ty=0;
                        editorCamera.tz=1;
                    }
                }
            }
        };

        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;

        if(!isWebGL){
            p.mousePressed = () => {
                if (p.mouseButton === p.LEFT && p.mouseX >= 0 && p.mouseY >= 0 && p.mouseX <= p.width && p.mouseY <= p.height) {
                    isDragging = true;
                    lastMouseX = p.mouseX;
                    lastMouseY = p.mouseY;
                }
            };

            p.mouseReleased = () => {
                isDragging = false;
            };

            p.mouseDragged = () => {
                if (isDragging) {
                    const dx = p.mouseX - lastMouseX;
                    const dy = p.mouseY - lastMouseY;

                    const adjustedX = dx / editorCamera.z;
                    const adjustedY = dy / editorCamera.z;

                    editorCamera.tx += adjustedX;
                    editorCamera.ty += adjustedY;
                    editorCamera.x += adjustedX;
                    editorCamera.y += adjustedY;

                    lastMouseX = p.mouseX;
                    lastMouseY = p.mouseY;
                }
            };

            p.mouseWheel = (event) => {
                if(!editorFocused){
                    //const zoomFactor = 1.1;
                    //const scale = (event.delta > 0) ? 1 / zoomFactor : zoomFactor;

                    const zoomStep = 0.05;
                    const scale = Math.pow(1 + zoomStep, -event.delta / 100);

                    const cx = p.width / 2;
                    const cy = p.height / 2;

                    // Translate mouse to canvas-centered coords
                    const mx = p.mouseX - cx;
                    const my = p.mouseY - cy;

                    // Apply inverse rotation

                    const rotatedX = mx / editorCamera.z;
                    const rotatedY = my / editorCamera.z;

                    // Update zoom target
                    editorCamera.tz *= scale;

                    // Adjust tx/ty to zoom toward mouse
                    editorCamera.tx -= rotatedX * (1 - 1 / scale);
                    editorCamera.ty -= rotatedY * (1 - 1 / scale);
                }
            };
        }else{
            p.mouseDragged = () => {
                if (!(p.mouseX >= 0 && p.mouseY >= 0 && p.mouseX <= p.width && p.mouseY <= p.height)) return false; // stop orbitControl from acting
            }

            p.mouseWheel = (event)=>{
                if (!(p.mouseX >= 0 && p.mouseY >= 0 && p.mouseX <= p.width && p.mouseY <= p.height)) return false; // stop zoom when outside
            }
        }
    };

    // Boot it up
    bottomP5Instance = new p5(bottomSketch);
}