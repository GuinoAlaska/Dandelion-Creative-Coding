const config = {
    theme:"light",
    fontSize:14,
    autoSave:true,
    visibility:{
        tabs:true,
        console:true,
        preview:true,
        sketch:true,
    },
};

const Key = "config";

function loadConfig() {
    try {
        const saved = localStorage.getItem(Key);
        if (!saved) return;

        const { theme = "light", fontSize = 14, autoSave = true, visibility } = JSON.parse(saved);
        Object.assign(config, { theme, fontSize, autoSave, visibility });
    } catch (e) {
        console.error("Invalid config in storage:", e);
    }

    //display changes:
    document.documentElement.setAttribute("data-theme", config.theme);

    
    const lightOption = document.getElementById("lightThemeOption");
    const darkOption = document.getElementById("darkThemeOption");
    if(lightOption){
        if(config.theme==="light"){
            lightOption.classList.add("selected");
        } else {
            lightOption.classList.remove("selected");
        }
    }
    if(darkOption){
        if(config.theme==="dark"){
            darkOption.classList.add("selected");
        } else {
            darkOption.classList.remove("selected");
        }
    }

    document.documentElement.style.fontSize = config.fontSize + "px";

    const autosaveCheck = document.getElementById("autoSave");
    if(autosaveCheck){
        autosaveCheck.checked = config.autoSave;
    }

    
    const tabsPanel = document.getElementById("tabs-panel");
    const consolePanel = document.getElementById("console-panel");
    const outputTop = document.getElementById("output-top");
    const outputBottom = document.getElementById("output-bottom");
    const leftPanel = document.getElementById("left-panel");

    const tabsResizer = document.getElementById("resizer-horizontal-left");
    const topSketchResizer = document.getElementById("resizer-vertical-right");
    const OutputsResizer = document.getElementById("resizer-horizontal-main");
    const ConsoleResizer = document.getElementById("resizer-vertical-left");

    if(tabsPanel && consolePanel && outputTop && outputBottom && leftPanel && tabsResizer && topSketchResizer && OutputsResizer && ConsoleResizer){
        if(config.visibility.tabs){
            tabsPanel.classList.remove("hidden");
            tabsResizer.classList.remove("hidden");
        }else{
            tabsPanel.classList.add("hidden");
            tabsResizer.classList.add("hidden");
        }
        if (!tabsPanel.classList.contains("hidden")) {
            ConsoleResizer.style.left = tabsPanel.offsetWidth + "px";
        }else{
            ConsoleResizer.style.left = 0;
        }

        if(config.visibility.console){
            consolePanel.classList.remove("hidden");
            ConsoleResizer.classList.remove("hidden");
        }else{
            consolePanel.classList.add("hidden");
            ConsoleResizer.classList.add("hidden");
        }

        if(config.visibility.preview){
            outputBottom.classList.remove("hidden");
        }else{
            outputBottom.classList.add("hidden");
        }
        let isHidden = outputBottom.classList.contains("hidden");
        const isTopHidden = outputTop.classList.contains("hidden");
        topSketchResizer.classList.toggle("hidden", isHidden||isTopHidden);
        OutputsResizer.classList.toggle("hidden", isHidden&&isTopHidden);
        if (isHidden) {
            if(!isTopHidden){
                outputTop.style.height = document.getElementById("right-panel").offsetHeight + "px";
                console.warn("correct evaluation");
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

        /*if(config.visibility.sketch){
            isHidden = outputTop.classList.remove("hidden");
        }else{
            isHidden = outputTop.classList.add("hidden");
        }
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
        }*/
    }
}

window.addEventListener('load', () => {
    loadConfig();
});