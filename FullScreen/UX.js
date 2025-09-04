let executing = false;
// Execute/Stop button functionality
document.getElementById('execute-stop-btn').addEventListener('click', () => {
    IDEToggleSketchExecution();
});
function IDEToggleSketchExecution(){
    if(executing){
        IDEStopSketch();
    }else{
        IDERunSketch();
        document.getElementById('execute-stop-btn').style.backgroundPosition = '-58px -8px';
    }
}
function IDERunSketch(){
    executing = true;
    let gatheringCode = "";
    for(let file of files){
        console.log(file);
        gatheringCode+=file.code+"\n";
    }
    const code = gatheringCode;
    reloadAll(code);
    document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
    CodePaused = false;
    document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
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
    };

    P5Instance = new p5(Sketch);
    executing=false;
    document.getElementById('execute-stop-btn').style.backgroundPosition = '-8px -8px';
}

// Pause button functionality
document.getElementById('pause-btn').addEventListener('click', () => {
    IDEPauseSketch();
});
function IDEPauseSketch(){
    if (CodePaused) {
        P5Instance.loop();
        CodePaused = false;
        document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
    } else {
        P5Instance.noLoop();
        CodePaused = true;
        document.getElementById('pause-btn').style.backgroundPosition = '-208px -8px';
    }
}