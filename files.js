let files = [];

let currentFile = 0;

const editorChangeFunction = (instance) => {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    if (undoBtn) {
        undoBtn.style.backgroundPosition = instance.historySize()?.undo > 0 ? '-108px -58px' : '-58px -108px';
    }
    if (redoBtn) {
        redoBtn.style.backgroundPosition = instance.historySize()?.redo > 0 ? '-158px -58px' : '-108px -108px';
    }

    updateFile(currentFile);

    clearConsole();
    let gatheringCode = "";
    let i=0;
    for(let file of files){
        gatheringCode+=file.editor.getValue()+"\n";
        //acornScanner(file.editor.getValue(),i);
        i++;
    }
    acornScanner(gatheringCode);

    if(HotReload){
        executing = true;
        let gatheringCode = "";
        for(let file of files){
            gatheringCode+=file.editor.getValue()+"\n";
        }
        const code = gatheringCode;
        reloadAll(code);
        document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
        CodePaused = false;
    }
    

    if (window.isMobile) {
        document.getElementById('mobile-project-status').innerHTML = "Project not saved";
        document.getElementById('mobile-project-status').style.color = '#F5A';
    } else {
        document.getElementById('project-status').innerHTML = "Project not saved";
        document.getElementById('project-status').style.color = '#F5A';
    }
}

function newFile() {
    const index = files.length;
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

    files.push({
        name: `sketch${index}.js`,
        state: "notSaved",
        editor: editor
    });

    switchToFile(index);
}

function switchToFile(index) {
    if (index === currentFile) return;

    // 1. Save old editor content (if needed)
    if (currentFile !== null && files[currentFile]) {
        //files[currentFile].content = files[currentFile].editor.getValue();
        files[currentFile].editor.getWrapperElement().style.display = 'none';
    }

    // 2. Load new editor
    currentFile = index;
    const file = files[currentFile];

    file.editor.getWrapperElement().style.display = '';
    file.editor.refresh(); // Ensure layout is correct
    file.editor.focus();
}

function delateFile(index){
    if(index===currentFile) {
        if(currentFile===0) {
            openFile(currentFile+1);
        }else{
            openFile(currentFile-1);
        }
    }
    files.splice(index, 1);
    document.getElementById('project-status').innerHTML = "Project not saved";
    document.getElementById('project-status').style.color = '#F5A';
}

function openFile(index){
    switchToFile(index);
    //files[currentFile].folds=getFoldedLines(editor) || [];
    currentFile = index;
    document.getElementById('script-name').value = files[index].name;

    /*editor.operation(() => {
        editor.setValue(files[index].content);
        restoreFolds(editor, files[currentFile].folds);
    });*/

    if(files[currentFile].editor.historySize().undo <= 0){
        document.getElementById('undo-btn').style.backgroundPosition = '-58px -108px';
    }
    if(files[currentFile].editor.historySize().redo <= 0){
        document.getElementById('redo-btn').style.backgroundPosition = '-108px -108px';
    }
}

function renameFile(index,name){
    if(files[index].name !== name){
        files[index].name = name;
        files[index].state = "notSaved";
        document.querySelectorAll('#tabs-list .tab')[index].querySelector('.tab-name').innerHTML = name;
        const tab = document.querySelectorAll('#tabs-list .tab')[currentFile];
        tab.style.setProperty('--tab-active-border-color', '#888');
        document.getElementById('project-status').innerHTML = "Project not saved";
        document.getElementById('project-status').style.color = '#F5A';
    }
}

function updateFile(index){
    if(!loading){
        files[index].state = "notSaved";
        const tab = document.querySelectorAll('#tabs-list .tab')[currentFile];
        tab.style.setProperty('--tab-active-border-color', '#888');

        for(let i in files){
            let tab = document.querySelectorAll('#tabs-list .tab')[i];
            file=files[i];
            if(file.state==="notSaved"){
                tab.style.setProperty('--tab-active-border-color', '#888');
            }
            if(file.state==="saved"){
                tab.style.setProperty('--tab-active-border-color', '#486');
            }
            if(file.state==="unsafe"||file.state==="savedUnsafe"){
                tab.style.setProperty('--tab-active-border-color', '#ff2');
            }
        }
    }
}

function getFoldedLines(cm) {
    let folds = [];

    cm.getAllMarks().forEach(mark => {
        if (mark.__isFold || mark.type === "fold") {
            const pos = mark.find();
            if (pos) {
                folds.push(pos.from.line);
            }
        }
    });
    folds=[...new Set(folds)].sort((a, b) => a - b);
    return folds; // Remove duplicates, just in case
}

function restoreFolds(cm, folds) {
    folds.sort((a, b) => b - a);
    folds.forEach(line => {
        cm.foldCode(CodeMirror.Pos(line, 0));
    });
}


const tabsList = document.getElementById('tabs-list');
let draggedIndex = null;
let placeholder = null;
let draggedTab = null;

function renderTabs() {
    tabsList.innerHTML = '';
    files.forEach((file, i) => {
        const li = document.createElement('li');
        li.classList.add('tab');
        if (i === currentFile) li.classList.add('active');
        li.setAttribute('data-tab-id', i);
        li.style.position = 'relative'; // reset positioning when rendered
        li.style.top = '0px';
        li.style.opacity = '1';
        li.style.zIndex = 'auto';

        const span = document.createElement('span');
        span.classList.add('tab-name');
        span.textContent = file.name;

        li.appendChild(span);
        tabsList.appendChild(li);
    });

    enableDragForTabs();
    enableTouchForTabs();
}

function createPlaceholder() {
    const ph = document.createElement('li');
    ph.classList.add('tab-placeholder');
    ph.style.height = '40px'; // same height as tabs
    ph.style.border = '2px dashed #888';
    ph.style.margin = '5px 0';
    return ph;
}

function startDrag(e) {
    draggedIndex = [...tabsList.children].indexOf(draggedTab);

    placeholder = createPlaceholder();
    tabsList.insertBefore(placeholder, draggedTab.nextSibling);

    const rect = draggedTab.getBoundingClientRect();
    const parentRect = tabsList.getBoundingClientRect();

    draggedTab.style.position = 'absolute';
    draggedTab.style.width = rect.width + 'px';
    draggedTab.style.left = (rect.left - parentRect.left) + 'px';
    draggedTab.style.top = (rect.top - parentRect.top) + 'px';
    draggedTab.style.zIndex = '1000';
    draggedTab.style.opacity = '0.7';

    draggedTab.ondragstart = () => false;
}

function dragMove(e) {
    if (!draggedTab) return;
    const parentRect = tabsList.getBoundingClientRect();

    let y = e.clientY - parentRect.top - 20; // center of dragged tab (half height = 20px)
    draggedTab.style.top = y + 'px';

    // Detect tab under the cursor to move the placeholder
    const tabs = [...tabsList.querySelectorAll('.tab:not(.tab-placeholder)')];
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (tab === draggedTab) continue;

        const rect = tab.getBoundingClientRect();
        if (e.clientY > rect.top && e.clientY < rect.bottom) {
            if (i < draggedIndex) {
                tabsList.insertBefore(placeholder, tab);
            } else {
                tabsList.insertBefore(placeholder, tab.nextSibling);
            }
            break;
        }
    }
}

function finishDrag(e) {
    if (!draggedTab) return;

    // Insert dragged tab at placeholder's position
    tabsList.insertBefore(draggedTab, placeholder);
    draggedTab.style.position = 'relative';
    draggedTab.style.top = '0';
    draggedTab.style.left = '0';
    draggedTab.style.zIndex = 'auto';
    draggedTab.style.opacity = '1';

    // Remove placeholder
    tabsList.removeChild(placeholder);
    placeholder = null;

    // Rebuild files array according to new order
    const newFilesOrder = [];
    const newTabs = tabsList.querySelectorAll('.tab');
    newTabs.forEach(tab => {
        const idx = parseInt(tab.getAttribute('data-tab-id'));
        newFilesOrder.push(files[idx]);
    });

    files = newFilesOrder;

    // Reassign data-tab-id on tabs to reflect new order
    newTabs.forEach((tab, i) => {
        tab.setAttribute('data-tab-id', i);
    });

    // Update currentFile index based on previously active tab
    currentFile = [...newTabs].findIndex(tab => tab.classList.contains('active'));
    if(currentFile === -1) currentFile = 0;

    openFile(currentFile);
    renderTabs();

    draggedTab = null;
    draggedIndex = null;

    document.getElementById('project-status').innerHTML = "Project not saved";
    document.getElementById('project-status').style.color = '#F5A';
}

let isDragging = false;
let startX = 0;
let startY = 0;

function onMouseDown(e) {
    if (!(e.target.classList.contains('tab') || e.target.classList.contains('tab-name'))) return;

    startX = e.clientX;
    startY = e.clientY;
    isDragging = false;

    draggedTab = e.target.closest('.tab');
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    if (!isDragging && Math.sqrt(dx*dx + dy*dy) > 5) {
        // Start drag
        isDragging = true;
        startDrag(e);  // your existing drag start logic, e.g., create placeholder, fix dragged tab style
    }
    
    if (isDragging) {
        // Update dragged tab position and placeholder
        dragMove(e);
    }
}

function onMouseUp(e) {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    if (isDragging) {
        finishDrag(e);
    }
}

function enableDragForTabs() {
    const tabs = document.querySelectorAll('#tabs-list .tab');
    tabs.forEach(tab => {
        tab.addEventListener('mousedown', onMouseDown);
    });
}

function onTouchStart(e) {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isDragging = false;

    draggedTab = e.target.closest('.tab');
    if (!draggedTab) return;

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
}

function onTouchMove(e) {
    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (!isDragging && Math.sqrt(dx*dx + dy*dy) > 5) {
        isDragging = true;
        startDrag(touch);
    }
    if (isDragging) {
        dragMove(touch);
    }
}

function onTouchEnd(e) {
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);

    if (isDragging) {
        finishDrag(e.changedTouches[0]);
    }
}

function enableTouchForTabs() {
    const tabs = document.querySelectorAll('#tabs-list .tab');
    tabs.forEach(tab => {
        tab.addEventListener('touchstart', onTouchStart, { passive: false });
    });
}

// Enable both mouse and touch drag for tabs after the page loads
window.addEventListener("load", () => {
    enableDragForTabs();
    enableTouchForTabs();
});