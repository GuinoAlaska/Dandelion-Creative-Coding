let widthRect = 45;
let seedScale = 10;
let amount = 200;
let escapingAmount = 200;

let dseeds = [];
class Dseed {
    constructor(x, y, r, s) {
        this.x = x;
        this.y = y;
        this.vx = random(1,2);
        this.r = r;
        this.s = s;
        this.sw = random(0.5, 2);
        this.on = true;
        dseeds.push(this);
    }
    draw() {
        if (this.on) {
            stroke(255);
            strokeWeight(this.sw);
            line(0, 0, this.x+10*abs(sin(frameCount/100*this.r)), this.y+10*sin(this.x/100));
            if(random(0,1000)<1){
                let ns=new Dseed(this.x+10*sin(frameCount/100*this.r),this.y,this.r,this.s);
                ns.on=false;
            }
        }else{
            this.x+=this.vx;
        }
        push();
        noStroke();
        fill(255);
        translate(this.x+10*abs(sin(frameCount/100*this.r)), this.y+10*sin(this.x/100));
        if(this.x+10*abs(sin(frameCount/100*this.r))>2*width){
            dseeds.splice(dseeds.indexOf(this),1)
        }
        rotate(this.r);
        scale(this.s);
        rect(
            -((widthRect / 100) * seedScale) / 2,
            0,
            (widthRect / 100) * seedScale,
            seedScale
        );
        rotate((2 * PI) / 5);
        rect(
            -((widthRect / 100) * seedScale) / 2,
            0,
            (widthRect / 100) * seedScale,
            seedScale
        );
        rotate((2 * PI) / 5);
        rect(
            -((widthRect / 100) * seedScale) / 2,
            0,
            (widthRect / 100) * seedScale,
            seedScale
        );
        rotate((2 * PI) / 5);
        rect(
            -((widthRect / 100) * seedScale) / 2,
            0,
            (widthRect / 100) * seedScale,
            seedScale
        );
        rotate((2 * PI) / 5);
        rect(
            -((widthRect / 100) * seedScale) / 2,
            0,
            (widthRect / 100) * seedScale,
            seedScale
        );
        pop();
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    randomSeed(29);

    for (let i = 0; i < amount; i++) {
        let r = random(0, 2 * PI);
        let ra = random(0, 100);
        let x = sin(r) * ra;
        let y = cos(r) * ra;
        new Dseed(x, y, random(0, 2 * PI), random(0.2, 1.1));
    }

    for (let i = 0; i < escapingAmount; i++) {
        let x = pow(10, random(3));
        if (x > 100) {
            let ns = new Dseed(x, 0, random(0, 2 * PI), random(0.2, 1.1));
            ns.y = random(-100, 100) + sin(ns.x / 100) * 20;
            ns.on = false;
        }
    }
}

function draw() {
    background(0);
    translate(100, height / 2);

    let x = 0;
    let y = 0;

    scale(0.7);
    //translate(-200, -60);
    stroke(255);
    strokeWeight(5);
    noFill();
    curve(-100, 0, 0, 0, -50, 200, -300, 200);
    for (let ds of dseeds) {
        ds.draw();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}