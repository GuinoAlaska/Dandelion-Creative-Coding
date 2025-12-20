var CodePaused = false;

let P5Instance;

let customCanvas = null;

let safeToExecute=true;

let commandsQueue=[];

let userVariables = [];

const noCloneableItems = [];
class NoCloneableItem{
    constructor(type, item, ...args){
        this.type = type;
        this.item = item;
        const pro = new Proxy(this, {
            get(target, prop) {
                //if(target === this){
                    if (prop in target.item) {
                        return target.item[prop]; // array property or method
                    }
                    //return target.item;
                //}
                return target[prop]; // type, etc.
            },
            set(target, prop, value) {
                if (prop in target.item) {
                    target.item[prop] = value;
                } else {
                    target[prop] = value;
                }
                return true;
            }
        });
        noCloneableItems.push(pro);
        parent.postMessage({ cmd: 'IloadedANoCloneableItem', type, data: args}, "*");

        return pro;
    }
}

function createCanvasHandler(p, container){
    const original = p.createCanvas;
    p.createCanvas = function(...args) {
        original.apply(this, args).parent(container);
        customCanvas = { width: args[0], height: args[1] };
    };
}

function reloadAll(code){
    //check for code safety:
    //safeToExecute = acornSimulator.safe;
    //if(safeToExecute || allowedToExecute){
        reloadSketch(code);
    //}
}

function reloadSketch(userCode) {
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

        let mirrorDisabled = false;
        let isRecordingUserCode = false;
        let gizmosMode = false;
        function mirrorFunction(p, fnName) {
            const originalFn = p[fnName];
            p[fnName] = function(...args) {
                if (mirrorDisabled) {
                    return originalFn.apply(this, args);
                }

                let result;
                if(!gizmosMode){
                    mirrorDisabled = true;
                    let cleanArgs = [];
                    for(let arg of args){
                        if(arg instanceof NoCloneableItem){
                            cleanArgs.push(arg.item);
                        }else{
                            cleanArgs.push(arg);
                        }
                    }
                    result = originalFn.apply(this, cleanArgs);
                    mirrorDisabled = false;
                }
            
                if (isRecordingUserCode) {
                    let cleanArgs = [];
                    for(let arg of args){
                        if(arg instanceof NoCloneableItem){
                            cleanArgs.push({type:"noCloneable", index: noCloneableItems.indexOf(arg)});
                        }else{
                            cleanArgs.push({type:"normalArg", value: arg})
                        }
                    }
                    commandsQueue.push({type:"functionCall", fnName, args:cleanArgs });
                }

                return result;
            };
        }

        userVariables = [];
        let ast;
        try{
            ast = acorn.parse(userCode, { ecmaVersion: 'latest', sourceType: 'module', locations: true })
        }catch(e){
            console.error(e.toString());
        }
        function declare(dec,kind){
            switch(dec.type){
                case 'Identifier':
                    userVariables.push({
                        kind,
                        name:dec.name,
                    })
                    break;
                case 'ArrayPattern':
                    for(let declaration of dec.elements){
                        declare(declaration,kind);
                    }
                    break;
                case 'ObjectPattern':
                    for(let declaration of dec.properties){
                        declare(declaration,kind);
                    }
                    break;
            }
        }
        for(let element of ast.body){
            switch(element.type){
                case 'VariableDeclaration':
                    for(let declaration of element.declarations){
                        declare(declaration.id,element.kind);
                    }
                    break;
                case 'FunctionDeclaration':
                    declare(element.id,"function");
                    break;
                case 'ClassDeclaration':
                    declare(element.id,"class");
                    break;
            }
        }

        try {
            const wrappedCode = `
                with (p) {
                    ${userCode}

                    let beginGizmos = ()=>{gizmosMode=true; push();}
                    let endGizmos = ()=>{pop(); gizmosMode=false;}

                    for(let v of userVariables){
                        eval(\`
                            Object.defineProperty(userVariables.find(x => x.name === "$\{v.name}"), 'value', {
                                get() { return $\{v.name}; },
                                set($\{v.name==='x'?'y':'x'}) { $\{v.name} = $\{v.name==='x'?'y':'x'}; }
                            });
                        \`)
                    }

                    let originalLoadImage = loadImage;
                    loadImage = function (...args){
                        let img = originalLoadImage.apply(this, args);
                        return new NoCloneableItem("image", img, ...args);
                    };

                    let originalLoadStrings = loadStrings;
                    loadStrings = function (...args){
                        parent.postMessage({ cmd: 'INeedToLoadANoCloneableItem', type:"string", index: noCloneableItems.length, data: args}, "*");
                        originalLoadStrings.apply(this,["/FullScreen/dontCry.txt"]);
                        return new NoCloneableItem("string", [""], ...args);
                    };

                    let originalLoadJSON = loadJSON;
                    loadJSON = function (...args){
                        parent.postMessage({ cmd: 'INeedToLoadANoCloneableItem', type:"json", index: noCloneableItems.length, data: args}, "*");
                        originalLoadJSON.apply(this,["/FullScreen/dontCry.json"]);
                        return new NoCloneableItem("json", {}, ...args);
                    };

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
            console.error(`Compiler runtime error:`,err);
            p.noLoop();
        }

        let setItUp = false;
        p.setup = () => {
            const container = document.getElementById('displayer');
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
                'loadShader',
                'createBuffer', 'bindBuffer', 'bufferData', 'drawArrays', 'drawElements',
            ];

            p5Fns.forEach(fnName => mirrorFunction(p, fnName));

            createCanvasHandler(p, container);

            p.windowWidth = container.offsetWidth;
            p.windowHeight = container.offsetHeight;

            try {
                commandsQueue = [];
                isRecordingUserCode = true;
                setupFn();
                isRecordingUserCode = false;
                const isWebGL = p._renderer && p._renderer.isP3D;
                if(isWebGL) sketchCam = p.createCamera();
            } catch (err) {
                console.error(`Sketch setup error:`,err.toString());
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
            const isWebGL = p._renderer && p._renderer.isP3D;
            try {
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
                console.error(`Sketch runtime error:`,err.toString());
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
                            console.error(`Sketch runtime error:`, err.toString());
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
                        console.error(`Sketch runtime error:`, err.toString());
                        p.noLoop();
                    }
                };
            }
        }

        function createScopeFromVariables(vars) {
            return new Proxy({}, {
                has(_, prop) {
                    // Pretend every variable name exists if userVariables contains it
                    return vars.some(v => v.name === prop);
                },
                get(_, prop) {
                    const v = vars.find(v => v.name === prop);
                    return v ? v.value : undefined;
                },
                set(_, prop, val) {
                    const v = vars.find(v => v.name === prop);
                    if (v) {
                        v.value = val;  // updates via setter
                        return true;
                    }
                    // fall back: maybe user declared a new variable via console
                    vars.push({
                        kind: "let",
                        name: prop,
                        get value() { return val; },
                        set value(x) { val = x; }
                    });
                    return true;
                }
            });
        }

        p.evaluateFromConsole = (code) => {
            try {
                const scope = createScopeFromVariables(userVariables);
                let result = eval(`with (p) { with (scope) { ${code} } }`)
                return { type: "log", log: result===undefined? "undefined" : result.toString() };
            } catch (err) {
                return { type: "error", error: err.toString() };
            }
        };

    };

    // Boot it up
    P5Instance = new p5(Sketch);
}

const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn
};

function clearConsole(){
    window.parent.postMessage({ cmd: 'console.clear' }, "*");
}

// Override native console
console.log = (...args) => {
    let cleanArgs = [];
    for(let arg of args){
        if(arg instanceof NoCloneableItem){
            switch(arg.type){
                case "string":
                    cleanArgs.push({type:"normalArg", value: arg.item});
                    break;
                default:
                    cleanArgs.push({type:"noCloneable", index: noCloneableItems.indexOf(arg)});
                    break;
            }
        }else{
            cleanArgs.push({type:"normalArg", value: arg})
        }
    }
    window.parent.postMessage({ cmd: 'console.log', args:cleanArgs }, "*");
    //appendToConsole('log', args);
    //originalConsole.log(...args);
};

console.warn = (...args) => {
    let cleanArgs = [];
    for(let arg of args){
        if(arg instanceof NoCloneableItem){
            cleanArgs.push({type:"noCloneable", index: noCloneableItems.indexOf(arg)});
        }else{
            cleanArgs.push({type:"normalArg", value: arg})
        }
    }
    window.parent.postMessage({ cmd: 'console.warn', args:cleanArgs }, "*");
    //appendToConsole('warn', args);
    //originalConsole.warn(...args);
};

console.error = (...args) => {
    let cleanArgs = [];
    for(let arg of args){
        if(arg instanceof NoCloneableItem){
            cleanArgs.push({type:"noCloneable", index: noCloneableItems.indexOf(arg)});
        }else{
            cleanArgs.push({type:"normalArg", value: arg})
        }
    }
    window.parent.postMessage({ cmd: 'console.error', args:cleanArgs }, "*");
    //appendToConsole('error', args);
    //originalConsole.error(...args);
};

console.clear = () => {
    clearConsole();
}