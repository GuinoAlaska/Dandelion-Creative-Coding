var executing = false;

function IDEToggleSketchExecution(){
    if(executing){
        IDEStopSketch();
    }else{
        IDERunSketch();
        //document.getElementById('execute-stop-btn').style.backgroundPosition = '-58px -8px';
    }
}
function IDERunSketch(){
    executing = true;
    let gatheringCode = "";
    for(let file of files){
        gatheringCode+=file.code+"\n";
    }
    const code = gatheringCode;
    reloadAll(code);
    //document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
    CodePaused = false;
    //document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
}
function IDEStopSketch(){
    if (P5Instance) P5Instance.remove();
    Sketch = (p) => {
        p.setup = () => {
            const container = document.getElementById('displayer');
            p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
        };

        p.windowResized = () => {
            const container = document.getElementById('displayer');
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
            p.setup();
        };

        p.draw = () => {
            p.background(config.theme === "light"? 255 : config.theme === "dark"? 0 : 255);
            p.noStroke();
            p.fill(config.theme === "light"? 0 : config.theme === "dark"? 255 : 0);
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
    };

    P5Instance = new p5(Sketch);
    executing=false;
    //document.getElementById('execute-stop-btn').style.backgroundPosition = '-8px -8px';
}
function IDEPauseSketch(CodePaused){
    if (CodePaused) {
        P5Instance.loop();
        CodePaused = false;
        //document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
    } else {
        P5Instance.noLoop();
        CodePaused = true;
        //document.getElementById('pause-btn').style.backgroundPosition = '-208px -8px';
    }
}

const SAVE_KEY = "myData";
let loading=false;

async function loadProject() {
    loading=true;
    try {

        const params = new URLSearchParams(window.location.search);
        const projectID = params.get('id');
        if (projectID) {
            await fetch(`Default/DefaultProjects.json`)
                .then(response => response.json())
                .then(async data => {
                    const project = data.find(p => p.ID === projectID);
                    if (project) {
                        await loadProjectData(project);
                        loading = false;
                        return;
                    } else {
                        console.error("Project not found");
                    }
                })
                .catch(error => {
                    console.error("Error fetching project data:", error);
                });
        }/*else{
            const saved = localStorage.getItem(SAVE_KEY);
            if (saved) {
                const loadedFiles = JSON.parse(saved);
                for(let f of loadedFiles) {
                    let file = {
                        code: "",
                    };

                    if(f.content){
                        file.code = f.content;
                    }

                    if(f.code){
                        file.code = f.code;
                    }

                    files.push(file);
                };
            }else{
                let file = {
                    code: "function setup(){\n  //We already maded a full size canvas for you :3\n}\n\nfunction draw(){\n  background(200);\n}",
                };

                files.push(file);
            }
        }*/
    } catch (e) {
        console.error("Failed to load project:", e);
    }

    loading = false;
}

function loadProjectData(project) {
    if (project.files && Array.isArray(project.files)) {
        for(let f of project.files) {
            let file = {
                code: f.code
            };
            files.push(file);
        };
    }
    document.title = project.name || "Untitled Project";
}

window.addEventListener('load', loadProject);

const config = {
    theme:"light",
}
window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return
    
    if (event.data.cmd === 'theme'){
        config.theme = event.data.data;
        document.documentElement.setAttribute("data-theme", config.theme);
    }
    if (event.data.cmd === 'toggle'){
        IDEToggleSketchExecution();
    }
    if (event.data.cmd === 'reload') {
        reloadSketch(event.data.data);
    }
    if (event.data.cmd === 'stop') {
        IDEStopSketch();
    }
    if (event.data.cmd === 'pause') {
        IDEPauseSketch(event.data.data);
    }
    if (event.data.cmd === 'areYouWebGL?') {
        const result = P5Instance._renderer && P5Instance._renderer.isP3D;
        event.source.postMessage({ cmd: 'hereIsIfImWebGL', data: result }, "*");
    }
    if (event.data.cmd === 'yourQueuePlease') {
        event.source.postMessage({ cmd: 'hereIsMyQueue', data: commandsQueue }, "*");
    }
    if (event.data.cmd === 'evaluate') {
        let result;
        try{
            result = P5Instance.evaluateFromConsole(event.data.code);
            if(result.type === "log"){
                console.log(result.log);
            }else if(result.type === "error"){
                console.error(result.error);
            }
        }catch(e){
            console.error(e);
        }
    }
    if (event.data.cmd === 'hereIsYourLoad') {
        noCloneableItems[event.data.index].item = event.data.data;
    }
});