let fullscreen = false;

function loadProject(projectId) {
    fetch('Default/DefaultProjects.json')
        .then(response => response.json())
        .then(data => {
            const project = data.find(proj => proj.ID === projectId);
            if (project) {
                document.getElementById('project-title').textContent = project.name || 'Untitled Project';
                document.getElementsByClassName('description')[0].innerHTML = `<h1>Description:</h1> ${project.description || 'No description available.'}`;
                document.getElementsByClassName('instructions')[0].innerHTML = `<h1>Instructions:</h1> ${project.instructions || 'No instructions available.'}`;
                document.getElementById('publicationDate').textContent = `Published on: ${project.publicationDate || 'Unknown Date'}`;
            }
            document.getElementById('sketch').src = 'FullScreen/index.html?id='+projectId || 'FullScreen/index.html';
        })
        .then(()=>{
            document.getElementById("sketch").contentWindow.postMessage({ cmd: 'theme', data: config.theme }, "*");
            //console.log(config.theme);
        });
}

function loadUser(projectId) {
    fetch('Default/DefaultUsers.json')
        .then(response => response.json())
        .then(userData => {
            fetch('Default/DefaultProjects.json')
                .then(response => response.json())
                .then(data => {
                    const project = data.find(proj => proj.ID === projectId);
                    if (project) {
                        const user = userData.find(user => user.ID === project.UserID);
                        if (user) {
                            document.getElementsByClassName('profile')[0].innerHTML = `Maded by: ${user.name || 'Unknown User'} <img src="${user.avatar || 'sprites/user-avatar.png'}" width="45" height="45">`;
                            document.getElementsByClassName('profile')[0].href = `profile/index.html?user=${user.ID}`;
                        }
                    }
                });
        });
}

let projectID;
document.getElementById('source-btn').addEventListener('click', () => {
    window.location.href = `editor/index.html?id=${projectID}`;
});

document.getElementById('fullScreen-btn').addEventListener('click', () => {
    toggleFullscreen();
});

let executing = false;
document.getElementById('execute-stop-btn').addEventListener('click', () => {
    const iframe = document.getElementById('sketch');
    if(executing){
        document.getElementById('execute-stop-btn').style.backgroundPosition = '-8px -8px';
    }else{
        document.getElementById('execute-stop-btn').style.backgroundPosition = '-58px -8px';
    }
    executing = !executing;
    paused = false;
    iframe.contentWindow.postMessage({ cmd: 'toggle'}, "*");
});

let paused = false;
document.getElementById('pause-btn').addEventListener('click', () => {
    const iframe = document.getElementById('sketch');
    iframe.contentWindow.postMessage({ cmd: 'pause', data: paused}, "*");
    paused = !paused;
    if(paused){
        document.getElementById('pause-btn').style.backgroundPosition = '-208px -8px';
    }else{
        document.getElementById('pause-btn').style.backgroundPosition = '-158px -108px';
    }
});

function toggleFullscreen() {
    const container = document.getElementById('interaction');
    if (!fullscreen) {
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.zIndex = "9999";
        document.getElementById('iframe-container').style["aspect-ratio"] = "";
        document.getElementById('iframe-container').style["height"] = "calc(100% - 40px)";
    } else {
        container.style.position = "relative";
        container.style.width = "100%";
        container.style.height = "";
        container.style.zIndex = "1";
        document.getElementById('iframe-container').style["aspect-ratio"] = "2 / 1";
        document.getElementById('iframe-container').style["height"] = "";
    }
    fullscreen = !fullscreen;
}

window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    projectID = params.get('id');

    if (projectID) {
        loadProject(projectID);
        loadUser(projectID);
    }

    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(navigator.userAgent);
    window.isMobile = isMobile;
    if(isMobile){
        const project_container = document.getElementById("project-container");
        const interaction = document.getElementById("interaction");
        const project_info = document.getElementById("project-info");
        const bottom = document.getElementById("bottom");
        const comments_section = document.getElementById("comments-section");
        const other_proyects = document.getElementById("other-proyects");
        const publicationDate = document.getElementById("publicationDate");
        const metric_wrapper = document.getElementsByClassName("metric-wrapper")[0];
        const right_ads = document.getElementById("rightAds-div");
        //const metrics = document.getElementById("metrics");

        project_container.style.marginTop="20px";
        project_container.style.marginLeft="0px";
        project_container.style.flexDirection="column";
        project_container.style.gap="none";
        interaction.style.flex = "none";
        interaction.style.width = "100%";
        interaction.style.border = "none";
        project_info.style.border = "none";
        project_info.style.width = "100%"
        bottom.style.flexDirection = "column";
        bottom.style.marginLeft = "0px";
        comments_section.style.display = "none";
        other_proyects.style.width = "100%";
        publicationDate.style.display="none";
        metric_wrapper.style.display = "none";
        if(right_ads)right_ads.style.display = "none";
        //metrics.style.gap = "none";
    }
});