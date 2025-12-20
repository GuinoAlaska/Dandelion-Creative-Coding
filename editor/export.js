const exportTabs = document.querySelectorAll('.export-tab');
const exportTabContents = document.querySelectorAll('.export-tab-content');

exportTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const selectedTab = tab.getAttribute('data-tab');

        // Update active tab button
        exportTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show the selected tab content
        exportTabContents.forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`export-tab-${selectedTab}`).classList.remove('hidden');
    });
});

exportTabs.forEach(t => t.classList.remove('active'));
exportTabs[0].classList.add('active');
exportTabContents.forEach(content => {
    content.classList.add('hidden');
});
document.getElementById(`export-tab-${exportTabs[0].getAttribute('data-tab')}`).classList.remove('hidden');

const overlay = document.getElementById('export-overlay');
const exportBtn = document.getElementById('start-export');
const cancelBtn = document.getElementById('cancel-export');

function showExportPanel() {
    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);
}

function hideExportPanel() {
    overlay.classList.remove('visible');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
}

// Hook into your File > Export logic
document.getElementById('export-file').addEventListener('click', showExportPanel);

cancelBtn.addEventListener('click', hideExportPanel);

exportBtn.addEventListener('click', () => {
    const activeTab = document.querySelector('.export-tab.active').getAttribute('data-tab');

    if (activeTab === 'video') {
        const exportBtn = document.getElementById('start-export');
        const cancelBtn = document.getElementById('cancel-export');
        const buttonsWrapper = document.querySelector('#export-panel .buttons');
        const inputs = document.querySelectorAll('#export-panel input, #export-panel select, #export-panel button');

        const width = parseInt(document.getElementById('export-width').value);
        const height = parseInt(document.getElementById('export-height').value);
        const fps = parseInt(document.getElementById('export-fps').value);
        const duration = parseFloat(document.getElementById('export-duration').value);
        const format = document.getElementById('export-format').value;
        const userCode = editor.getValue();
        const name = document.getElementById('export-name').value;

        // Disable everything
        inputs.forEach(el => el.disabled = true);

        // Hide the cancel button visually and from layout
        cancelBtn.style.display = 'none';
        buttonsWrapper.classList.add('exporting');

        // Style export button into a progress bar
        exportBtn.classList.add('exporting');
        exportBtn.innerHTML = '<span>Exporting... Please don´t close this tab.</span>';

        // Trigger progress bar animation
        setTimeout(() => {
            exportBtn.style.setProperty('--progress', '100%');
            exportBtn.style.setProperty('transition', `width ${duration}s linear`);
            exportBtn.style.setProperty('width', '100%');

            // Animate the ::after pseudo
            exportBtn.style.setProperty('--after-width', '100%');

            // Fallback (force progress)
            exportBtn.style.setProperty('--duration', `${duration}s`);
        }, 1500);

        exportTopSketchAsVideoWrapped({
            name,
            width,
            height,
            fps,
            duration,
            format,
            userCode,
            onDone: () => restoreExportPanel(),
            onError: () => restoreExportPanel(true)
        });
    }else if (activeTab === 'html') {

        let gatheringCode = "";
        let i=0;
        let safe=true;
        for(let file of files){
            const illegalChars = /[\/\?<>\\:\*\|":]/;
            const endsWithJS = /\.js$/i.test(file.name);

            if (illegalChars.test(file.name) || !endsWithJS) {
                safe=false;
            }

            gatheringCode+=file.editor.getValue()+"\n";
            if(!acornScanner(file.editor.getValue(),i)){
                safe=false;
            }
            i++;
        }
        if(!acornScanner(gatheringCode)){
            safe=false;
        }

        

        if(safe){
            const projectName = document.getElementById('html-export-name').value.trim() || "mySketch";

            let haveCreateCanvas = false;
            let haveSetupFn = false;
            let haveSketchFile = false;
            let haveWindowResizedFn = false;

            for(let file of files){
                if(file.type === "js"){
                    //check if there is a file named sketch.js
                    if(file.name === "sketch.js"){
                        haveSketchFile = true;
                    }

                    const dummyP5 = new p5((p) => {
                        //monkeyPatch the createCanvas function for detection
                        let patching=false;
                        const originalCreateCanvasFn = p.createCanvas;
                        p.createCanvas = function(...args) {
                            if(patching){
                                haveCreateCanvas = true;
                                return originalCreateCanvasFn.apply(this, args);
                            }else{
                                return originalCreateCanvasFn.apply(this, args);
                            }
                        };

                        try{
                            const wrappedCode = `
                                with(p){
                                    patching=true;
                                    ${file.editor.getValue()}
                                    patching=false;
                                    if (typeof setup === 'function') haveSetupFn = true;
                                    if (typeof windowResized === 'function') haveWindowResizedFn = true;
                                }
                            `
                            eval(wrappedCode);
                        }catch (err) {
                            console.error("Export error:", err.toString());
                        }
                    }, document.createElement('div'));
                }
            }

            let finalSketchesJS = [];
            for(let file of files){
                if(file.type === "js"){
                    if(haveCreateCanvas){
                        //no need to change anything, just export all files as they are
                        finalSketchesJS.push(file.editor.getValue().trim());
                    }else{
                        if(haveSetupFn&&haveWindowResizedFn){
                            //we know a file have a setup function and a windowResize function, we need to see if this file contains the setup:
                            let thisHaveSetupFn = false;
                            let setupFn = ()=>{};
                            const wrappedCode = `
                                ${file.editor.getValue()}
                                if (typeof setup === 'function'){
                                    setupFn = setup;
                                    thisHaveSetupFn = true;
                                };
                            `
                            eval(wrappedCode);
                            
                            if(thisHaveSetupFn){
                                //if true then we export this file embedding the createCanvas
                                const cleanedUserCode = removeFunctionByName(file.editor.getValue(), 'setup');
                                const fnString = setupFn.toString();
                                const bodyMatch = fnString.match(/{([\s\S]*)}$/);
                                const userSetupCode = bodyMatch ? bodyMatch[1].trim() : '';

                                finalSketchesJS.push(`
    function setup() {
        createCanvas(windowWidth, windowHeight);
        const DandelionOriginal2026A13p5Fns = [
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

        DandelionOriginal2026A13p5Fns.forEach(fnName => DandelionOriginal2026A13mirrorFunction(fnName));
        ${userSetupCode ? '    ' + userSetupCode.replace(/\n/g, '\n    ') : ''}
    }
        
    ${cleanedUserCode}
                                `.trim());

                                haveCreateCanvas = true;
                            }else{
                                //its ok, the setup must be on another file, we export this file as usual.
                                finalSketchesJS.push(file.editor.getValue().trim());
                            }
                        }else if(haveSetupFn){
                            //windowResize is missing, so we need to check everything.
                            let thisHaveSetupFn = false;
                            let setupFn = ()=>{};
                            const wrappedCode = `
                                ${file.editor.getValue()}
                                if (typeof setup === 'function'){
                                    setupFn = setup;
                                    thisHaveSetupFn = true;
                                };
                            `
                            eval(wrappedCode);

                            if(file.name==="sketch.js"){
                                if(thisHaveSetupFn){
                                    //we can export this file embedding the createCanvas and a windowResized.

                                    const cleanedUserCode = removeFunctionByName(file.editor.getValue(), 'setup');
                                    const fnString = setupFn.toString();
                                    const bodyMatch = fnString.match(/{([\s\S]*)}$/);
                                    const userSetupCode = bodyMatch ? bodyMatch[1].trim() : '';

                                    finalSketchesJS.push(`
    function setup() {
        createCanvas(windowWidth, windowHeight);
        const DandelionOriginal2026A13p5Fns = [
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

        DandelionOriginal2026A13p5Fns.forEach(fnName => DandelionOriginal2026A13mirrorFunction(fnName));
        ${userSetupCode ? '    ' + userSetupCode.replace(/\n/g, '\n    ') : ''}
    }

    function windowResized() {
        resizeCanvas(windowWidth, windowHeight);
    }
        
    ${cleanedUserCode}
                                    `.trim());

                                    haveCreateCanvas = true;
                                    haveWindowResizedFn = true;
                                }else{
                                    //its ok, setup must be on another file, however, we need to embed the windowResized.
                                    const cleanedUserCode = file.editor.getValue();

                                    finalSketchesJS.push(`
    function windowResized() {
        resizeCanvas(windowWidth, windowHeight);
    }
        
    ${cleanedUserCode}
                                    `.trim());
                                    haveWindowResizedFn = true;
                                }
                            }else{
                                //its ok, sketch could be later on. Is it the setup in here?
                                if(thisHaveSetupFn){
                                    //we export this file embedding the createCanvas.
                                    const cleanedUserCode = removeFunctionByName(file.editor.getValue(), 'setup');
                                    const fnString = setupFn.toString();
                                    const bodyMatch = fnString.match(/{([\s\S]*)}$/);
                                    const userSetupCode = bodyMatch ? bodyMatch[1].trim() : '';

                                    finalSketchesJS.push(`
    function setup() {
        createCanvas(windowWidth, windowHeight);
        const DandelionOriginal2026A13p5Fns = [
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

        DandelionOriginal2026A13p5Fns.forEach(fnName => DandelionOriginal2026A13mirrorFunction(fnName));
        ${userSetupCode ? '    ' + userSetupCode.replace(/\n/g, '\n    ') : ''}
    }
        
    ${cleanedUserCode}
                                    `.trim());

                                    haveCreateCanvas = true;
                                }else{
                                    //its ok, setup must be on another file. We export this file as it is.
                                    finalSketchesJS.push(file.editor.getValue().trim());
                                }
                            }
                        }else if(haveWindowResizedFn){
                            //setup is missing, which is interesting, we need to embed this.
                            if(file.name==="sketch.js"){
                                //we export this file, embedding the setup with the createCanvas
                                const cleanedUserCode = file.editor.getValue();

                                finalSketchesJS.push(`
    function setup() {
        createCanvas(windowWidth, windowHeight);
        const DandelionOriginal2026A13p5Fns = [
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

        DandelionOriginal2026A13p5Fns.forEach(fnName => DandelionOriginal2026A13mirrorFunction(fnName));
    }
        
    ${cleanedUserCode}
                                `.trim());

                                haveSetupFn = true;
                                haveCreateCanvas = true;
                            }else{
                                //its ok, sketch could be later on. we export this file as it is.
                                finalSketchesJS.push(file.editor.getValue().trim());
                            }
                        }else{
                            //Interesting, both are missing, we need to embed them both:
                            if(file.name==="sketch.js"){
                                //we export this file, embedding the setup with the createCanvas and the windowResized
                                const cleanedUserCode = file.editor.getValue();

                                finalSketchesJS.push(`
    function setup() {
        createCanvas(windowWidth, windowHeight);
        const DandelionOriginal2026A13p5Fns = [
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

        DandelionOriginal2026A13p5Fns.forEach(fnName => DandelionOriginal2026A13mirrorFunction(fnName));
    }

    function windowResized() {
        resizeCanvas(windowWidth, windowHeight);
    }
        
    ${cleanedUserCode}
                                `.trim());
                                haveSetupFn = true;
                                haveCreateCanvas = true;
                                haveWindowResizedFn = true;
                            }else{
                                //its ok, sketch could be later on. we export this file as it is.
                                finalSketchesJS.push(file.editor.getValue().trim());
                            }
                        }
                    }
                }else{
                    finalSketchesJS.push(file.editor.getValue().trim());
                }
            }
            //There is the case in where sketch.js is the one missing, as well as setup and or windowResized, so:
            

            finalSketchesJS.unshift(`
let DandelionOriginal2026A13gizmosMode = false;
function DandelionOriginal2026A13mirrorFunction(fnName) {
    const originalFn = window[fnName];
    window[fnName] = function(...args) {
        let result;
        if(!DandelionOriginal2026A13gizmosMode){
            result = originalFn.apply(this, args);
        }
        return result;
    };
}

beginGizmos = ()=>{DandelionOriginal2026A13gizmosMode = true};
endGizmos = ()=>{DandelionOriginal2026A13gizmosMode = false};
                `.trim());
            
            if(!haveSetupFn){
                if(!haveWindowResizedFn){
                    //we create a sketch.js with the default setup and windowResized functions.
                    finalSketchesJS.unshift(`
function setup() {
    createCanvas(windowWidth, windowHeight);
    const DandelionOriginal2026A13p5Fns = [
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

    DandelionOriginal2026A13p5Fns.forEach(fnName => DandelionOriginal2026A13mirrorFunction(fnName));
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
                    `.trim());
                }else{
                    //we create the sketch.js with just the setup function.
                    finalSketchesJS.unshift(`
function setup() {
    createCanvas(windowWidth, windowHeight);
    const DandelionOriginal2026A13p5Fns = [
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

    DandelionOriginal2026A13p5Fns.forEach(fnName => DandelionOriginal2026A13mirrorFunction(fnName));
}
                    `.trim());
                }
            }

            const styleCSS = `
html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
}
canvas {
    display: block;
}
            `.trim();
        
            const indexHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${projectName}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>${haveSketchFile ? '\n' : '\n    <script src="sketch.js"></script>'}
    <script src="DandelionOriginals2026A13.js"></script>
${files.map(file => `    <script src="${file.name}"></script>`).join('\n')}
</body>
</html>
            `.trim();
        
            // Generate ZIP
            const zip = new JSZip();
            zip.file("index.html", indexHTML);
            zip.file("style.css", styleCSS);
            if(!haveSketchFile){
                zip.file("sketch.js", finalSketchesJS[0]);
                zip.file("DandelionOriginals2026A13.js", finalSketchesJS[1]);
                for(let i in finalSketchesJS){
                    if(i>1){
                        let sk = finalSketchesJS[i]
                        zip.file(`${files[i-2].name}`, sk);
                    }
                }
            }else{
                zip.file("DandelionOriginals2026A13.js", finalSketchesJS[0]);
                for(let i in finalSketchesJS){
                    if(i>0){
                        let sk = finalSketchesJS[i]
                        zip.file(`${files[i-1].name}`, sk);
                    }
                }
            }
        
            zip.generateAsync({ type: "blob" }).then(content => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(content);
                a.download = `${projectName}.zip`;
                a.click();
                URL.revokeObjectURL(a.href);
                hideExportPanel();
            });
        } else {
            alert("Export failed: Your code contains unsafe or invalid content and cannot be exported.");
        }
    }
});

function removeFunctionByName(code, functionName) {
    const funcRegex = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*{`, 'm');
    const match = funcRegex.exec(code);
    if (!match) return code; // no such function, return code unchanged

    const startIdx = match.index;
    let braceIdx = match.index + match[0].length - 1; // position of the first '{'
    let braceCount = 1;

    for (let i = braceIdx + 1; i < code.length; i++) {
        const char = code[i];
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;

        if (braceCount === 0) {
            // Remove from startIdx to i+1 (to include closing '}')
            const newCode = code.slice(0, startIdx) + code.slice(i + 1);
            return newCode;
        }
    }

    // If we get here → unbalanced braces; fail gracefully
    console.warn(`Unbalanced braces in function ${functionName} removal.`);
    return code;
}

function restoreExportPanel(isError = false) {
    const exportBtn = document.getElementById('start-export');
    const cancelBtn = document.getElementById('cancel-export');
    const buttonsWrapper = document.querySelector('#export-panel .buttons');
    const inputs = document.querySelectorAll('#export-panel input, #export-panel select, #export-panel button');

    exportBtn.classList.remove('exporting');
    exportBtn.removeAttribute('style');
    exportBtn.innerHTML = 'Export';
    buttonsWrapper.classList.remove('exporting');

    cancelBtn.style.display = 'inline-block';
    inputs.forEach(el => el.disabled = false);

    if (isError) {
        exportBtn.textContent = 'Failed 😢';
        setTimeout(() => {
            exportBtn.textContent = 'Export';
        }, 1500);
    }
}

function exportTopSketchAsVideoWrapped({ name, width, height, fps, duration, format = 'webm', userCode, onDone, onError }) {
    // Create hidden container for export
    const exportContainer = document.createElement('div');
    exportContainer.style.position = 'absolute';
    exportContainer.style.left = '-9999px';
    document.body.appendChild(exportContainer);

    let recorder = null;
    let chunks = [];
    let hasError = false;

    const exportSketch = (p) => {
        let setupFn = () => {};
        let drawFn = () => {};

        try {
            const wrappedCode = `
                with (p) {
                    ${userCode}
                    if (typeof setup === 'function') setupFn = setup;
                    if (typeof draw === 'function') drawFn = draw;
                }
            `;
            eval(wrappedCode);
        } catch (err) {
            console.error("Export sketch compile error:", err.toString());
            hasError = true;
            return;
        }

        p.setup = () => {
            try {
                p.createCanvas(width, height).parent(exportContainer);
                setupFn();

                // Start recording once setup completes
                const stream = p.canvas.captureStream(fps);
                recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };
                recorder.onstop = () => {
                    if (!hasError) {
                        // Blob download
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${name}.${format}`;
                        a.click();
                        URL.revokeObjectURL(url);
                        onDone?.();
                    } else {
                        onError?.();
                    }
            
                    p.remove();
                    document.body.removeChild(exportContainer);
                };

                recorder.start();
                setTimeout(() => {
                    recorder.stop();
                }, duration * 1000);
                
            } catch (err) {
                console.error("Export sketch setup error:", err.toString());
                hasError = true;
                if (recorder && recorder.state === "recording") recorder.stop();
                p.noLoop();
            }
        };

        p.draw = () => {
            try {
                drawFn();
            } catch (err) {
                console.error("Export sketch runtime error:", err.toString());
                hasError = true;
                if (recorder && recorder.state === "recording") recorder.stop();
                p.noLoop();
            }
        };
    };

    new p5(exportSketch, exportContainer);
}