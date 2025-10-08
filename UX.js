// Undo button functionality
document.getElementById('undo-btn').addEventListener('click', () => {
    IDEEditorUndo();
});
document.getElementById('undo').addEventListener('click', () => {
    IDEEditorUndo();
});
function IDEEditorUndo(){
    if (files[currentFile].editor.historySize().undo > 0) {
        files[currentFile].editor.undo();
        document.getElementById('redo-btn').style.backgroundPosition = '-158px -58px';
        if(files[currentFile].editor.historySize().undo <= 0){
            document.getElementById('undo-btn').style.backgroundPosition = '-58px -108px';
        }
    }
}

// Redo button functionality
document.getElementById('redo-btn').addEventListener('click', () => {
    IDEEditorRedo();
});
document.getElementById('redo').addEventListener('click', () => {
    IDEEditorRedo();
});
function IDEEditorRedo(){
    if (files[currentFile].editor.historySize().redo > 0) {
        files[currentFile].editor.redo();
        document.getElementById('undo-btn').style.backgroundPosition = '-108px -58px';
        if(files[currentFile].editor.historySize().redo <= 0){
            document.getElementById('redo-btn').style.backgroundPosition = '-108px -108px';
        }
    }
}

// Enable/Disable hot reload button functionality
document.getElementById('hotReload-btn').addEventListener('click', () => {
    IDEToggleHotReload();
});
document.getElementById('hotReload').addEventListener('click', () => {
    IDEToggleHotReload();
});
function IDEToggleHotReload(){
    if(HotReload){
        HotReload=false;
        document.getElementById('hotReload-btn').style.backgroundPosition = '-258px -58px';
        if(executing){
            document.getElementById('execute-stop-btn').style.backgroundPosition = '-58px -8px';
        }else{
            document.getElementById('execute-stop-btn').style.backgroundPosition = '-8px -8px';
        }
    }else {
        HotReload=true;
        document.getElementById('hotReload-btn').style.backgroundPosition = '-208px -58px';
        document.getElementById('execute-stop-btn').style.backgroundPosition = '-8px -108px';
    }
}

let executing = false;
// Execute/Stop button functionality
document.getElementById('execute-stop-btn').addEventListener('click', () => {
    IDEToggleSketchExecution();
});
document.getElementById('run').addEventListener('click', (event) => {
    if(HotReload){
        IDERunSketch();
    }else {
        if(!executing){
            IDERunSketch();
            document.getElementById('execute-stop-btn').style.backgroundPosition = '-58px -8px';
        }
    }
});
document.getElementById('stop').addEventListener('click', (event) => {
    if(!HotReload){
        if(executing){
            IDEStopSketch();
        }
    }
});
function IDEToggleSketchExecution(){
    if(HotReload){
        IDERunSketch()
    }else {
        if(executing){
            IDEStopSketch();
        }else{
            IDERunSketch();
            document.getElementById('execute-stop-btn').style.backgroundPosition = '-58px -8px';
        }
    }
}
function IDERunSketch(){
    executing = true;
    let gatheringCode = "";
    for(let file of files){
        gatheringCode+=file.editor.getValue()+"\n";
    }
    const code = gatheringCode;
    reloadAll(code);
    document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
    CodePaused = false;
    document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
}
function IDEStopSketch(){
    if (topP5Instance) topP5Instance.remove();
    if (bottomP5Instance) bottomP5Instance.remove();
    topSketch = (p) => {
        p.setup = () => {
            const container = document.getElementById('output-top');
            p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
        };

        p.windowResized = () => {
            const container = document.getElementById('output-top');
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
            p.setup();
        };

        p.draw = () => {
            p.background(0);
            p.noStroke();
            p.fill(255);
            p.translate(p.width/2,p.height/2);
            p.textAlign(p.CENTER,p.CENTER);
            if(p.frameCount<5){
                p.text("",0,0);
            }else
            if(p.frameCount<10){
                p.text("--",0,0);
            }else
            if(p.frameCount<15){
                p.text("----",0,0);
            }else
            if(p.frameCount<20){
                p.text("------",0,0);
            }else
            if(p.frameCount<25){
                p.text("--------",0,0);
            }else
            if(p.frameCount<30){
                p.text("----------",0,0);
            }else
            if(p.frameCount<35){
                p.text("------------",0,0);
            }else
            if(p.frameCount<40){
                p.text("----------------",0,0);
            }else
            if(p.frameCount<45){
                p.text("--------<>--------",0,0);
            }else
            if(p.frameCount<50){
                p.text("--------<<>>--------",0,0);
            }else
            if(p.frameCount<55){
                p.text("--------<<<>>>--------",0,0);
            }else
            if(p.frameCount<60){
                p.text("--------<<<<>>>>--------",0,0);
            }else
            if(p.frameCount<65){
                p.text("--------<<<<  >>>>--------",0,0);
            }else
            if(p.frameCount<70){
                p.text("--------<<<< T  >>>>--------",0,0);
            }else
            if(p.frameCount<75){
                p.text("--------<<<< Th c  >>>>--------",0,0);
            }else
            if(p.frameCount<80){
                p.text("--------<<<< The co i  >>>>--------",0,0);
            }else
            if(p.frameCount<85){
                p.text("--------<<<< The cod is n  >>>>--------",0,0);
            }else
            if(p.frameCount<90){
                p.text("--------<<<< The code is no b  >>>>--------",0,0);
            }else
            if(p.frameCount<95){
                p.text("--------<<<< The code is not be e >>>>--------",0,0);
            }else
            if(p.frameCount<100){
                p.text("--------<<<< The code is not bei ex >>>>--------",0,0);
            }else
            if(p.frameCount<105){
                p.text("--------<<<< The code is not bein exe >>>>--------",0,0);
            }else
            if(p.frameCount<110){
                p.text("--------<<<< The code is not being exec >>>>--------",0,0);
            }else
            if(p.frameCount<115){
                p.text("--------<<<< The code is not being execu >>>>--------",0,0);
            }else
            if(p.frameCount<120){
                p.text("--------<<<< The code is not being execut >>>>--------",0,0);
            }else
            if(p.frameCount<125){
                p.text("--------<<<< The code is not being execute >>>>--------",0,0);
            }else{
                p.text("--------<<<< The code is not being executed >>>>--------",0,0);
            }
        };

        p.evaluateFromConsole = (code) => {
            return {type:"error",error:"Code isn´t running"};
        };
    };

    bottomSketch = (p) => {
        let CameraContainer;

        p.setup = () => {
            const container = document.getElementById('output-bottom');
            CameraContainer = document.getElementById('output-top');
            p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);

            // Track focus state based on canvas focus
            const canvas = p.canvas;
            canvas.addEventListener('mouseenter', () => editorFocused = false);
            canvas.addEventListener('mouseleave', () => editorFocused = true);
        };

        p.windowResized = () => {
            const container = document.getElementById('output-bottom');
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        };

        p.draw = () => {
            const container = document.getElementById('output-bottom');
            editorCamera.x=p.lerp(editorCamera.x,editorCamera.tx,0.1);
            editorCamera.y=p.lerp(editorCamera.y,editorCamera.ty,0.1);
            editorCamera.r=p.lerp(editorCamera.r,editorCamera.tr,0.1);
            editorCamera.z=p.lerp(editorCamera.z,editorCamera.tz,0.1);

            p.background(25);

            // === Guide Overlay ===
            p.push();
            p.translate(p.width / 2, p.height / 2);
            p.scale(editorCamera.z);
            p.rotate(editorCamera.r);
            p.translate(editorCamera.x, editorCamera.y);

            // Draw axes
            p.stroke(255, 0, 0, 100);
            p.strokeWeight(1 / editorCamera.z);
            p.line((-p.width/2)/editorCamera.z-editorCamera.x, 0, (p.width/2)/editorCamera.z-editorCamera.x, 0); // X axis
            p.stroke(0, 255, 0, 100);
            p.line(0, (-p.height/2)/editorCamera.z-editorCamera.y, 0, (p.height/2)/editorCamera.z-editorCamera.y); // Y axis

            // Draw origin crosshair
            p.stroke(255, 255, 255, 200);
            p.strokeWeight(2 / editorCamera.z);
            p.line(-10, 0, 10, 0);
            p.line(0, -10, 0, 10);

            // Optional grid
            if (editorCamera.z > 0.03) {
                p.stroke(255, 255, 255, 10);

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

            p.push();
            p.translate(p.width / 2, p.height / 2);
            p.scale(editorCamera.z);
            p.rotate(editorCamera.r);
            p.translate(editorCamera.x, editorCamera.y);
            p.stroke(200,200,200,150);
            p.strokeWeight(5);
            p.fill(200,200,200,100);
            p.circle(0,0,50);
            p.noFill();
            p.rectMode(p.CENTER);
            p.rect(0,0,CameraContainer.offsetWidth, CameraContainer.offsetHeight)
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
        };

        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;

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
                const zoomFactor = 1.1;
                const scale = (event.delta > 0) ? 1 / zoomFactor : zoomFactor;

                const cx = p.width / 2;
                const cy = p.height / 2;

                // Translate mouse to canvas-centered coords
                const mx = p.mouseX - cx;
                const my = p.mouseY - cy;

                const rotatedX = mx / editorCamera.z;
                const rotatedY = my / editorCamera.z;

                // Update zoom target
                editorCamera.tz *= scale;

                // Adjust tx/ty to zoom toward mouse
                editorCamera.tx -= rotatedX * (1 - 1 / scale);
                editorCamera.ty -= rotatedY * (1 - 1 / scale);
            }
        };
    };

    topP5Instance = new p5(topSketch);
            
    bottomP5Instance = new p5(bottomSketch);
    executing=false;
    document.getElementById('execute-stop-btn').style.backgroundPosition = '-8px -8px';

    for (const id in window) {
        if (typeof window[id] === "number") {
            try {
                clearInterval(window[id]);
            } catch (e) {}
        }
    }
    if (typeof window.__intervals__ === "object" && Array.isArray(window.__intervals__)) {
        window.__intervals__.forEach(clearInterval);
        window.__intervals__ = [];
    }
}

// Record button functionality
/*document.getElementById('record-btn').addEventListener('click', () => {
    console.log('Record action triggered');
    // Add your record logic here
});*/

// Pause button functionality
document.getElementById('pause-btn').addEventListener('click', () => {
    IDEPauseSketch();
});
document.getElementById('pause').addEventListener('click', (event) => {
    IDEPauseSketch();
});
function IDEPauseSketch(){
    if (CodePaused) {
        topP5Instance.loop();
        CodePaused = false;
        document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
    } else {
        topP5Instance.noLoop();
        CodePaused = true;
        document.getElementById('pause-btn').style.backgroundPosition = '-208px -8px';
    }
}

// Line button functionality
/*document.getElementById('line-btn').addEventListener('click', () => {
    console.log('Line action triggered');
    // Add your line logic here
});*/

// Step button functionality
document.getElementById('step-btn').addEventListener('click', () => {
    IDERunSketchStep();
});
document.getElementById('step').addEventListener('click', (event) => {
    IDERunSketchStep();
});
function IDERunSketchStep(){
    topP5Instance.redraw();
}

// Icon selector functionality
/*document.getElementById('icon-selector').addEventListener('change', (event) => {
    console.log(`Icon selected: ${event.target.value}`);
    // Add your icon selection logic here
});*/

// Script name input functionality
document.getElementById('script-name').addEventListener('input', (event) => {
    renameFile(currentFile, event.target.value);
    
    const illegalChars = /[\/\?<>\\:\*\|":]/;
    const endsWithJS = /\.js$/i.test(event.target.value);

    if (illegalChars.test(event.target.value) || !endsWithJS) {
        event.target.classList.add('invalid');
        document.querySelectorAll('#tabs-list .tab')[currentFile].style.setProperty('--tab-active-border-color', '#F05')
    } else {
        event.target.classList.remove('invalid');
    }
});

// Console input functionality
/*document.getElementById('console-input-txt').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const input = event.target.value;
        //try {
            const result = topP5Instance.evaluateFromConsole(input); // Careful with eval, of course 😅
            if(result.type==="log"){
                console.log(result.log);
            }else if(result.type==="error"){
                console.error(result.error);
            }
        //} catch (err) {
        //    console.error('Console input error:', err);
        //}
        event.target.value = '';
    }
});*/

// Cut menu option
document.getElementById('cut').addEventListener('click', () => {
    const selectedText = editor.getSelection();
    if (selectedText) {
        navigator.clipboard.writeText(selectedText).then(() => {
            editor.replaceSelection('');
        }).catch(err => {
            console.error('Clipboard write failed: ', err);
        });
    }
});

// Copy menu option
document.getElementById('copy').addEventListener('click', () => {
    const selectedText = editor.getSelection();
    if (selectedText) {
        navigator.clipboard.writeText(selectedText).catch(err => {
            console.error('Clipboard write failed: ', err);
        });
    }
});

// Paste menu option
document.getElementById('paste').addEventListener('click', () => {
    navigator.clipboard.readText().then(text => {
        editor.replaceSelection(text);
    }).catch(err => {
        console.error('Clipboard read failed: ', err);
    });
});

// Sort menu option
document.getElementById('sort').addEventListener('click', (event) => {
    IDEEditorSort();
});
function IDEEditorSort(){
    const code = editor.getValue();

    try {
        const formatted = prettier.format(code, {
            parser: "babel",
            plugins: prettierPlugins,
            singleQuote: true,
            semi: true
        });

        editor.setValue(formatted);
    } catch (e) {
        console.error("Prettier formatting error:", e);
    }
}

// Search menu option
/*document.getElementById('search').addEventListener('click', () => {

});*/

// Replace menu option
/*document.getElementById('replace').addEventListener('click', (event) => {

});*/

// Keyblinds menu option
document.getElementById('keybinds').addEventListener('click', (event) => {
    const overlay=document.getElementById('keybinds-overlay');
    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);
});
document.getElementById('close-keybinds').addEventListener('click', (event) => {
    const overlay=document.getElementById('keybinds-overlay');
    overlay.classList.remove('visible');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
});

// Documentation menu option
document.getElementById('documentation').addEventListener('click', (event) => {
    window.open('https://p5js.org/reference/', '_blank');
});

// New menu option
/*document.getElementById('new-file').addEventListener('click', (event) => {

})*/

// Open menu option
/*document.getElementById('open-file').addEventListener('click', (event) => {

})*/

// Select tab
document.getElementById('tabs-list').addEventListener('click', function(event) {
    const tab = event.target.closest('.tab');
    if (!tab) return;

    document.querySelectorAll('#tabs-list .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const index = Array.from(tab.parentNode.children).indexOf(tab);
    openFile(index);
});

// tab options
document.getElementById('tabs-list').addEventListener('contextmenu', function(event) {
    const tab = event.target.closest('.tab');
    if (!tab) return;

    event.preventDefault();

    // Remove any existing context menu
    const existingMenu = document.getElementById('tab-context-menu');
    if (existingMenu) existingMenu.remove();

    // Create context menu
    const menu = document.createElement('div');
    menu.id = 'tab-context-menu';
    menu.style.position = 'absolute';
    menu.style.top = `${event.clientY}px`;
    menu.style.left = `${event.clientX}px`;
    menu.style.background = '#900';
    menu.style.color = '#fff';
    menu.style.padding = '6px 16px';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    menu.style.zIndex = 1000;
    menu.style.cursor = 'pointer';
    menu.textContent = 'Delete Tab';

    menu.addEventListener('click', () => {
        const index = Array.from(tab.parentNode.children).indexOf(tab);
        if (files.length > 1) {
            delateFile(index);
            tab.remove();
            menu.remove();
            
            document.querySelectorAll('#tabs-list .tab').forEach(t => t.classList.remove('active'));
            const tabs = document.querySelectorAll('#tabs-list .tab');
            if (tabs.length > 0) {
                const newActiveIndex = Math.max(0, index - 1);
                tabs[newActiveIndex].classList.add('active');
            }
        }
    });

    document.body.appendChild(menu);

    const removeMenu = (e) => {
        if (e.target !== menu) {
            menu.remove();
            document.removeEventListener('mousedown', removeMenu);
        }
    };
    setTimeout(() => {
        document.addEventListener('mousedown', removeMenu);
    }, 0);
});

// New tab
document.querySelector('#tabs-panel .add-tab').addEventListener('click', function () {
    // Create a new file object
    newFile();

    // Create a new tab element
    const tab = document.createElement('li');

    tab.className = 'tab';
    tab.style.backgroundImage = "url('sprites/tab-icons.png')";
    tab.style.backgroundPosition = '-5px -0px';
    tab.setAttribute('data-tab-id', files.length - 1);

    const tabName = document.createElement('span');
    tabName.className = 'tab-name';
    tabName.textContent = files[files.length - 1].name;
    tab.appendChild(tabName);

    tab.addEventListener('mousedown', onMouseDown);
    // Add touch support for tab selection (mobile)
    tab.addEventListener('touchstart', onTouchStart);

    tab.style.setProperty('--tab-active-border-color', '#888');
    tabsList.appendChild(tab);

    // Remove 'active' from all tabs and set new tab as active
    document.querySelectorAll('#tabs-list .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Open the new file in the editor
    if (typeof openFile === 'function') {
        openFile(files.length - 1);
    }
});

// Save menu option
document.getElementById('save-file').addEventListener('click', (event) => {
    saveProject(); //-------------------------------------------------------------------------<<<<<<<< CHANGE >>>>>>>>
});

// Toggle panels visibility
document.addEventListener("DOMContentLoaded", function () {
    const tabsPanel = document.getElementById("tabs-panel");
    const consolePanel = document.getElementById("console-panel");
    const outputTop = document.getElementById("output-top");
    const outputBottom = document.getElementById("output-bottom");
    const leftPanel = document.getElementById("left-panel");

    const tabsResizer = document.getElementById("resizer-horizontal-left");
    const topSketchResizer = document.getElementById("resizer-vertical-right");
    const OutputsResizer = document.getElementById("resizer-horizontal-main");
    const ConsoleResizer = document.getElementById("resizer-vertical-left");

    document.getElementById("toggle-tabs").addEventListener("click", () => {
        tabsPanel.classList.toggle("hidden");
        tabsResizer.classList.toggle("hidden");
        // Scale ConsoleResizer width to match tabsPanel
        if (!tabsPanel.classList.contains("hidden")) {
            ConsoleResizer.style.left = tabsPanel.offsetWidth + "px";
        }else{
            ConsoleResizer.style.left = 0;
        }
    });

    document.getElementById("toggle-console").addEventListener("click", () => {
        consolePanel.classList.toggle("hidden");
        ConsoleResizer.classList.toggle("hidden");
    });

    document.getElementById("toggle-editorView").addEventListener("click", () => {
        const isHidden = outputBottom.classList.toggle("hidden");
        const isTopHidden = outputTop.classList.contains("hidden");
        topSketchResizer.classList.toggle("hidden", isHidden||isTopHidden);
        OutputsResizer.classList.toggle("hidden", isHidden&&isTopHidden);
        if (isHidden) {
            if(!isTopHidden){
                outputTop.style.height = document.getElementById("right-panel").offsetHeight + "px";
            }else{
                leftPanel.style.width = document.getElementById("container").offsetWidth + "px";
                leftPanel.style.maxWidth = "100%";
            }
        } else {
            if(isTopHidden){
                const half = OutputsResizer.offsetLeft;
                leftPanel.style.width = half + "px";
                leftPanel.style.maxWidth = "80%";
                outputBottom.style.height = document.getElementById("right-panel").offsetHeight + "px";
            }else{
                const half = topSketchResizer.offsetTop;
                outputTop.style.height = half + "px";
                outputBottom.style.height = `calc(100% - ${half + topSketchResizer.offsetHeight}px)`;
            }
        }
        if (topP5Instance?.windowResized) {
            topP5Instance.windowResized();
        }
        if (bottomP5Instance?.windowResized) {
            bottomP5Instance.windowResized();
        }
    });

    document.getElementById("toggle-sketch").addEventListener("click", () => {
        const isHidden = outputTop.classList.toggle("hidden");
        const isBottomHidden = outputBottom.classList.contains("hidden");
        topSketchResizer.classList.toggle("hidden", isHidden||isBottomHidden);
        OutputsResizer.classList.toggle("hidden", isHidden&&isBottomHidden);
        if (isHidden) {
            if(!isBottomHidden){
                outputBottom.style.height = document.getElementById("right-panel").offsetHeight + "px";
            }else{
                leftPanel.style.width = document.getElementById("container").offsetWidth + "px";
                leftPanel.style.maxWidth = "100%";
            }
        } else {
            if(isBottomHidden){
                const half = OutputsResizer.offsetLeft;
                leftPanel.style.width = half + "px";
                leftPanel.style.maxWidth = "80%";
                outputTop.style.height = document.getElementById("right-panel").offsetHeight + "px";
            }else{
                const half = topSketchResizer.offsetTop;
                outputTop.style.height = half + "px";
                outputBottom.style.height = `calc(100% - ${half + topSketchResizer.offsetHeight}px)`;
            }
        }
        if (topP5Instance?.windowResized) {
            topP5Instance.windowResized();
        }
        if (bottomP5Instance?.windowResized) {
            bottomP5Instance.windowResized();
        }
    })
});

// Set the first tab as active
document.addEventListener("DOMContentLoaded", function() {
    const tabs = document.querySelectorAll('#tabs-list .tab'); // Select all tabs

    // Ensure the first tab is active on page load
    if (tabs.length > 0) {
        tabs[0].classList.add('active'); // Add 'active' class to the first tab
    }

    // Add event listener to each tab to switch active class when clicked
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove 'active' class from all tabs
            tabs.forEach(t => t.classList.remove('active'));

            // Add 'active' class to clicked tab
            tab.classList.add('active');
        });
    });
});


// Mobile burger menu toggle
document.getElementById('mobile-burger-btn').onclick = function() {
    var menu = document.getElementById('mobile-dropdown-menu');
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
};
// Hide menu when clicking outside
document.addEventListener('click', function(e) {
    var btn = document.getElementById('mobile-burger-btn');
    var menu = document.getElementById('mobile-dropdown-menu');
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// Alert Cancel/Continue execution
const alertOverlay = document.getElementById('alert-overlay');
const alertCancelBtn = document.getElementById('alert-cancel');
const alertContinueBtn = document.getElementById('alert-continue');

alertCancelBtn.addEventListener('click', () => {
    HotReload=false;
    document.getElementById('hotReload-btn').style.backgroundPosition = '-258px -58px';
    IDEStopSketch();

    alertOverlay.classList.remove('visible');
    setTimeout(() => {
        alertOverlay.classList.add('hidden');
    }, 300);
});

alertContinueBtn.addEventListener('click', () => {
    reloadTopSketch(editor.getValue());
    reloadBottomSketch();
    alertOverlay.classList.remove('visible');
    setTimeout(() => {
        alertOverlay.classList.add('hidden');
    }, 300);
});

// Mobile help
document.getElementById('mobile-help-btn').addEventListener('click', () => {
    const overlay = document.getElementById('mobile-help-overlay');
    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);
});

document.getElementById('mobile-docs-btn').addEventListener('click', () => {
    window.open('https://p5js.org/reference/', '_blank');
});

document.getElementById('mobile-keybinds-btn').addEventListener('click', () => {
    {
        const overlay = document.getElementById('keybinds-overlay');
        overlay.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.add('visible');
        }, 10);
    }
    {
        const overlay = document.getElementById('mobile-help-overlay');
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300);
    }
});

document.getElementById('mobile-about-btn').addEventListener('click', () => {
    window.open('about/about.html', '_blank');
});

document.getElementById('mobile-help-close-btn').addEventListener('click', () => {
    const overlay = document.getElementById('mobile-help-overlay');
    overlay.classList.remove('visible');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
});

document.getElementById('save-file-mobile').addEventListener('click', () => {
    saveProject();
});

document.getElementById('undo-mobile').addEventListener('click', () => {
    IDEEditorUndo();
});

document.getElementById('redo-mobile').addEventListener('click', () => {
    IDEEditorRedo();
});

document.getElementById('cut-mobile').addEventListener('click', () => {
    const selectedText = editor.getSelection();
    if (selectedText) {
        navigator.clipboard.writeText(selectedText).then(() => {
            editor.replaceSelection('');
        }).catch(err => {
            console.error('Clipboard write failed: ', err);
        });
    }
});

document.getElementById('copy-mobile').addEventListener('click', () => {
    const selectedText = editor.getSelection();
    if (selectedText) {
        navigator.clipboard.writeText(selectedText).catch(err => {
            console.error('Clipboard write failed: ', err);
        });
    }
});

document.getElementById('paste-mobile').addEventListener('click', () => {
    navigator.clipboard.readText().then(text => {
        editor.replaceSelection(text);
    }).catch(err => {
        console.error('Clipboard read failed: ', err);
    });
});

document.getElementById('sort-mobile').addEventListener('click', () => {
    IDEEditorSort();
});

document.getElementById('run-mobile').addEventListener('click', () => {
    IDERunSketch();
});

document.getElementById('stop-mobile').addEventListener('click', () => {
    IDEStopSketch();
});

document.getElementById('toggle-tabs-mobile').addEventListener('click', () => {
    document.getElementById('tabs-panel').classList.toggle('hidden');
    document.getElementById('resizer-horizontal-left').classList.toggle('hidden');
});

document.getElementById('toggle-console-mobile').addEventListener('click', () => {
    document.getElementById('console-panel').classList.toggle('hidden');
    document.getElementById('resizer-vertical-left').classList.toggle('hidden');
});

// Keybind handler
document.addEventListener('keydown', function (event) {
    // Prevent default behavior for handled shortcuts
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

    // Save: Ctrl+S
    if (ctrlKey && !event.altKey && event.key === 's') {
        event.preventDefault();
        saveProject() //-------------------------------------------------------------------------<<<<<<<< CHANGE >>>>>>>>
    }

    // Sort: Ctrl+Shift+F
    if (ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        IDEEditorSort();
    }

    // Run/Stop: Ctrl+R
    if (ctrlKey && event.key === 'r') {
        event.preventDefault();
        IDEToggleSketchExecution();
    }

    // Pause: Ctrl+P
    if (ctrlKey && event.key === 'p') {
        event.preventDefault();
        IDEPauseSketch();
    }

    // Step: Ctrl+Shift+S (example, you can change this)
    if (ctrlKey && event.altKey && event.key === 's') {
        event.preventDefault();
        event.stopPropagation();
        IDERunSketchStep();
    }
});


//resizers:
const MainResizer = document.getElementById("resizer-horizontal-main");
const TabsResizer = document.getElementById("resizer-horizontal-left");
const OutputsResizer = document.getElementById("resizer-vertical-right");
const ConsoleResizer = document.getElementById("resizer-vertical-left");

const leftPanel = document.getElementById("left-panel");
const tabsPanel = document.getElementById("tabs-panel");
const topSketchPanel = document.getElementById("output-top");
const consolePanel = document.getElementById("console-panel");

let isResizing = false;
let resizingIndex = "";

MainResizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    resizingIndex = "Main"
    document.body.style.cursor = "col-resize";
});

TabsResizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    resizingIndex = "Tabs"
    document.body.style.cursor = "col-resize";
})

OutputsResizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    resizingIndex = "Outputs"
    document.body.style.cursor = "row-resize";
})

ConsoleResizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    resizingIndex = "Console"
    document.body.style.cursor = "row-resize";
})

document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    if (resizingIndex === "Main"){
        const containerOffsetLeft = document.getElementById("container").offsetLeft;
        const rawNewWidth = e.clientX - containerOffsetLeft;
        const minWidth = 500;
        const maxWidth = window.innerWidth * 0.8;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, rawNewWidth));
        leftPanel.style.width = `${newWidth}px`;
        MainResizer.style.left = `${newWidth}px`;

        topP5Instance.windowResized();
        bottomP5Instance.windowResized();
    }else if (resizingIndex === "Tabs"){
        const containerOffsetLeft = document.getElementById("left-workflow-panel").offsetLeft;
        const rawNewWidth = e.clientX - containerOffsetLeft;
        const minWidth = 50;
        const maxWidth = document.getElementById("left-workflow-panel").offsetWidth -300;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, rawNewWidth));
        tabsPanel.style.width = `${newWidth}px`;
        TabsResizer.style.left = `${newWidth}px`;
        ConsoleResizer.style.left = `${newWidth}px`
        topP5Instance.windowResized();
        bottomP5Instance.windowResized();
    }else if (resizingIndex === "Outputs"){
        const containerOffsetTop = document.getElementById("right-panel").offsetTop;
        const rawNewHeight = e.clientY - containerOffsetTop;
        const minHeight = 100;
        const maxHeight = document.getElementById("right-panel").offsetHeight -100;
        const newHeight = Math.min(maxHeight, Math.max(minHeight, rawNewHeight));
        topSketchPanel.style.height = `${newHeight}px`;
        OutputsResizer.style.top = `${newHeight}px`;

        topP5Instance.windowResized();
        bottomP5Instance.windowResized();
    }else if (resizingIndex === "Console"){
        const containerOffsetTop = document.getElementById("left-codeAndConsole-panel").offsetTop;
        const rawNewHeight = e.clientY - containerOffsetTop - 40;
        const minHeight = 100;
        const maxHeight = document.getElementById("left-codeAndConsole-panel").offsetHeight -100;
        const newHeight = Math.min(maxHeight, Math.max(minHeight, rawNewHeight));
        consolePanel.style.height = (document.getElementById("left-codeAndConsole-panel").offsetHeight - newHeight) + `px`;
        ConsoleResizer.style.bottom = (document.getElementById("left-codeAndConsole-panel").offsetHeight - newHeight) + `px`;
    }
});

document.addEventListener("mouseup", () => {
    if (isResizing) {
        isResizing = false;
        document.body.style.cursor = "default";
    }
});

// Touch support for resizers (mobile)
function addResizerTouchSupport(resizer, direction) {
    resizer.addEventListener("touchstart", (e) => {
        isResizing = true;
        resizingIndex = direction;
        document.body.style.cursor = direction === "Outputs" || direction === "Console" ? "row-resize" : "col-resize";
        e.preventDefault();
    }, { passive: false });
}

addResizerTouchSupport(MainResizer, "Main");
addResizerTouchSupport(TabsResizer, "Tabs");
addResizerTouchSupport(OutputsResizer, "Outputs");
addResizerTouchSupport(ConsoleResizer, "Console");

document.addEventListener("touchmove", (e) => {
    if (!isResizing) return;
    const touch = e.touches[0];
    if (!touch) return;
    if (resizingIndex === "Main") {
        const containerOffsetLeft = document.getElementById("container").offsetLeft;
        const rawNewWidth = touch.clientX - containerOffsetLeft;
        const minWidth = 500;
        const maxWidth = window.innerWidth * 0.8;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, rawNewWidth));
        leftPanel.style.width = `${newWidth}px`;
        MainResizer.style.left = `${newWidth}px`;
        topP5Instance.windowResized();
        bottomP5Instance.windowResized();
    } else if (resizingIndex === "Tabs") {
        const containerOffsetLeft = document.getElementById("left-workflow-panel").offsetLeft;
        const rawNewWidth = touch.clientX - containerOffsetLeft;
        const minWidth = 50;
        let maxWidth=document.getElementById("left-workflow-panel").offsetWidth;
        if (!isMobile) {
            maxWidth = document.getElementById("left-workflow-panel").offsetWidth - 300;
        }
        const newWidth = Math.min(maxWidth, Math.max(minWidth, rawNewWidth));
        tabsPanel.style.width = `${newWidth}px`;
        TabsResizer.style.left = `${newWidth}px`;
        ConsoleResizer.style.left = `${newWidth}px`;

        

        topP5Instance.windowResized();
        bottomP5Instance.windowResized();
    } else if (resizingIndex === "Outputs") {
        const containerOffsetTop = document.getElementById("right-panel").offsetTop;
        const rawNewHeight = touch.clientY - containerOffsetTop;
        const minHeight = 100;
        const maxHeight = document.getElementById("right-panel").offsetHeight - 100;
        const newHeight = Math.min(maxHeight, Math.max(minHeight, rawNewHeight));
        topSketchPanel.style.height = `${newHeight}px`;
        OutputsResizer.style.top = `${newHeight}px`;
        topP5Instance.windowResized();
        bottomP5Instance.windowResized();
    } else if (resizingIndex === "Console") {
        const containerOffsetTop = document.getElementById("left-codeAndConsole-panel").offsetTop;
        const rawNewHeight = touch.clientY - containerOffsetTop - 40;
        const minHeight = 100;
        const maxHeight = document.getElementById("left-codeAndConsole-panel").offsetHeight - 100;
        const newHeight = Math.min(maxHeight, Math.max(minHeight, rawNewHeight));
        consolePanel.style.height = (document.getElementById("left-codeAndConsole-panel").offsetHeight - newHeight) + `px`;
        ConsoleResizer.style.bottom = (document.getElementById("left-codeAndConsole-panel").offsetHeight - newHeight) + `px`;
    }
    e.preventDefault();
}, { passive: false });

document.addEventListener("touchend", () => {
    if (isResizing) {
        isResizing = false;
        document.body.style.cursor = "default";
    }
});

// Set scales.
window.addEventListener("load", () => {
    document.getElementById("mobileLefter").style.display = "none";

    const leftPanel = document.getElementById("left-panel");
    const containerWidth = document.getElementById("container").offsetWidth;
    leftPanel.style.width = containerWidth / 2 + "px";
    MainResizer.style.left = containerWidth / 2 + "px";

    const topSketchPanel = document.getElementById("output-top");
    const rigthHeight = document.getElementById("right-panel").offsetHeight;
    topSketchPanel.style.height = rigthHeight / 2 + "px";
    OutputsResizer.style.top = rigthHeight / 2 + "px";

    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(navigator.userAgent);
    window.isMobile = isMobile;
    if(isMobile){
        document.getElementById("right-panel").style.display = "none";
        document.getElementById("resizer-horizontal-main").style.display = "none";
        document.getElementById("left-panel").style.width = "100vw";
        document.getElementById("left-panel").style.height = "calc(100dvh - 40px)";
        document.getElementById("left-panel").style.maxWidth = "100vw";
        document.getElementById("left-panel").style.minWidth = "0px";
        document.getElementById("hotReload-btn").style.display = "none";
        document.getElementById("hotReload").style.display = "none";
        document.getElementById("pause-btn").style.display = "none";
        document.getElementById("step-btn").style.display = "none";
        document.getElementById("toggle-editorView").style.display = "none";
        document.getElementById("toggle-sketch").style.display = "none";
        document.body.style.overflow = "hidden";
        document.getElementById("container").style.overflow = "hidden";

        document.getElementById("desktop-menu-bar").classList.add("hidden");
        document.getElementById("mobile-menu-bar").classList.remove("hidden");

        const playStopBtn = document.getElementById('execute-stop-btn');

        playStopBtn.addEventListener('touchend', (e) => {
            if (executing) {
                document.getElementById("left-panel").style.display = "";
                document.getElementById("right-panel").style.display = "none";
                document.getElementById("pause-btn").style.display = "none";
                document.getElementById("step-btn").style.display = "none";
                document.getElementById("mobileLefter").style.display = "none";
                document.getElementById("left-panel").style.width = "100vw";
                document.getElementById("left-panel").style.maxWidth = "100vw";
                document.getElementById("left-panel").style.minWidth = "0px";
                document.getElementById("left-panel").insertBefore(
                    document.getElementById("runner-panel"),
                    document.getElementById("left-panel").firstChild
                );
                document.getElementById("left-codeAndConsole-panel").appendChild(document.getElementById("console-panel"));
                document.getElementById('undo-btn').style.display = "";
                document.getElementById('redo-btn').style.display = "";
                document.getElementById('script-name').style.display = "";
                document.getElementById('runner-panel').style.alignItems = "center";

                IDEStopSketch();
                playStopBtn.style.backgroundPosition = '-8px -8px';
            } else {
                document.getElementById("output-bottom").classList.add("hidden");
                document.getElementById("left-panel").style.display = "none";
                document.getElementById("mobileLefter").style.display = "";
                document.getElementById("right-panel").style.display = "";
                document.getElementById("right-panel").insertBefore(
                    document.getElementById("runner-panel"),
                    document.getElementById("right-panel").firstChild
                );
                document.getElementById("right-panel").appendChild(document.getElementById("console-panel"));
                document.getElementById('undo-btn').style.display = "none";
                document.getElementById('redo-btn').style.display = "none";
                document.getElementById('script-name').style.display = "none";
                document.getElementById('pause-btn').style.display = "";
                document.getElementById('step-btn').style.display = "";
                document.getElementById('runner-panel').style.alignItems = "flex-end";


                document.getElementById("right-panel").style.height = "calc(100dvh - 40px)";
                let h = document.getElementById("right-panel").offsetHeight;
                document.getElementById("output-top").style.height = `calc(${h}px - ${document.getElementById("runner-panel").offsetHeight}px)`;

                document.getElementById("resizer-vertical-right").style.display = "none";

                setTimeout(() => {
                    IDERunSketch();
                }, 100);

                playStopBtn.style.backgroundPosition = '-58px -8px';
            }
            e.stopPropagation();
            e.preventDefault();
        });
    }
});


let isOverwrite = false;
window.addEventListener("keydown", (e) => {
    if (e.key === "Insert") {
        isOverwrite = !isOverwrite;
        files.forEach(f => {
            const wrapper = f.editor.getWrapperElement();
            if (isOverwrite) {
                wrapper.classList.add("cm-overwrite-mode");
            } else {
                wrapper.classList.remove("cm-overwrite-mode");
            }
        });
    }
});


//                  ----<<<<<<<< WARNING >>>>>>>>----
//----<<<< The following code needs to be replaced by a safer vertion >>>>----

const SAVE_KEY = "myData";

function saveProject() {
    document.querySelectorAll('#tabs-list .tab').forEach(tab => {
        tab.style.setProperty('--tab-active-border-color', '#486');
    });

    let dummy=[];

    files.forEach(file => {
        file.state = "saved";

        dummy.push({
            name:file.name,
            code:file.editor.getValue(),
            folds:getFoldedLines(file.editor),
        })
    });
    localStorage.setItem(SAVE_KEY, JSON.stringify(dummy));

    if (window.isMobile) {
        document.getElementById('mobile-project-status').innerHTML = "Project saved";
        document.getElementById('mobile-project-status').style.color = '#888';
    } else {
        document.getElementById('project-status').innerHTML = "Project saved";
        document.getElementById('project-status').style.color = '#888';
    }
}

let loading=false;

function loadProject() {
    loading=true;
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
            const loadedFiles = JSON.parse(saved);
            for(let f of loadedFiles) {
                const textarea = document.getElementById('code-input');

                const editor = CodeMirror.fromTextArea(textarea, {
                    mode: 'javascript',
                    theme: 'dracula',
                    lineNumbers: true,
                    lineWrapping: true,
                    foldGutter: true,
                    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                    tabSize: 2,
                    indentUnit: 2,
                    autofocus: true,
                });

                editor.on('change', editorChangeFunction);
                
                let file = {
                    name: f.name,
                    state: "saved",
                    editor: editor,
                };

                if(f.content){
                    const cm = file.editor;

                    cm.operation(() => {
                        cm.setValue(f.content);
                        cm.clearHistory();
                    });
                }

                if(f.code){
                    const cm = file.editor;

                    cm.operation(() => {
                        cm.setValue(f.code);
                        cm.clearHistory();
                    });
                }

                if(f.folds){
                    const cm = file.editor;
                    restoreFolds(cm, f.folds);
                }
                
                file.state = "saved";

                files.push(file);
            };
        }else{
            const textarea = document.getElementById('code-input');

            const editor = CodeMirror.fromTextArea(textarea, {
                mode: 'javascript',
                theme: 'dracula',
                lineNumbers: true,
                lineWrapping: true,
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                tabSize: 2,
                indentUnit: 2,
                autofocus: true,
            });

            editor.on('change', editorChangeFunction);
            
            let file = {
                name: "sketch.js",
                state: "saved",
                editor: editor,
            };

            const cm = file.editor;

            cm.operation(() => {
                cm.setValue("function setup(){\n  //We already maded a full size canvas for you :3\n}\n\nfunction draw(){\n  background(200);\n}");
                cm.clearHistory();
            });

            files.push(file);
        }
        // Remove existing tabs
        const tabsList = document.getElementById('tabs-list');
        tabsList.innerHTML = '';

        files.forEach((file, idx) => {
            const tab = document.createElement('li');
            tab.className = 'tab';
            tab.style.backgroundImage = "url('sprites/tab-icons.png')";
            tab.style.backgroundPosition = '-5px -0px';
            tab.setAttribute('data-tab-id', idx);

            const tabName = document.createElement('span');
            tabName.className = 'tab-name';
            tabName.textContent = file.name;
            tab.appendChild(tabName);

            tab.style.setProperty('--tab-active-border-color', '#486');
            tabsList.appendChild(tab);

            // Set active class to the first tab
            if (idx === 0) {
                tab.classList.add('active');
            }

            file.editor.getWrapperElement().style.display = 'none';
        });
        currentFile=-1;
    } catch (e) {
        console.error("Failed to load project:", e);
    }
    openFile(0);
    
    if (window.isMobile) {
        document.getElementById('mobile-project-status').innerHTML = "Project saved";
        document.getElementById('mobile-project-status').style.color = '#888';
    } else {
        document.getElementById('project-status').innerHTML = "Project saved";
        document.getElementById('project-status').style.color = '#888';
    }
    document.querySelectorAll('#tabs-list .tab').forEach(tab => {
        tab.style.setProperty('--tab-active-border-color', '#486');
    });
    loading = false;
    clearConsole();
    let gatheringCode = "";
    let i=0;
    for(let file of files){
        gatheringCode+=file.editor.getValue()+"\n";
        //acornScanner(file.editor.getValue(),i);
        i++;
    }
    acornScanner(gatheringCode);
}

// Optional: auto-load on page start
window.addEventListener('load', loadProject);