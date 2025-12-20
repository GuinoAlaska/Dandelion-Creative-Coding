function loadProjects(searchTerm, filters, userID, projectId) {
    let projectsData = null;
    fetch('Default/DefaultProjects.json')
        .then(response => response.json())
        .then(data => {
            // Process the project data
            projectsData = data;
        })
        .then(async () => {
            for(let project of projectsData) {
                if(filters) {
                    const tagMatch = filters.length === 0 || project.tags && filters.some(tag => project.tags.includes(tag));
                    if(!tagMatch) continue;
                }
                if(userID) {
                    if(project.UserID !== userID) continue;
                }
                if(projectId) {
                    if(project.ID === projectId) continue;
                }
                if(searchTerm) {
                    const lowerSearchTerm = searchTerm.toLowerCase();
                    const nameMatch = project.name && project.name.toLowerCase().includes(lowerSearchTerm);
                    const tagsMatch = project.tags && project.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
                    let userName = await getUserName(project);
                    const userMatch = userName && userName.toLowerCase().includes(lowerSearchTerm);
                    if(nameMatch || tagsMatch || userMatch) {
                        const projectCard = createProjectCard(project);
                        document.querySelector('.project-grid').appendChild(projectCard);
                    }
                } else {
                    // If no search term is provided, show all projects
                    const projectCard = createProjectCard(project);
                    document.querySelector('.project-grid').appendChild(projectCard);
                }
            }
        })
        .catch(error => {
            console.error('Error loading project data:', error);
        });
}

function createProjectCard(project) {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.innerHTML = `
        <div class="thumbnail-container">
            <a href="projectVisualization/index.html?id=${project.ID}">
                <img class="project-thumbnail" src="${project.thumbnail}">
            </a>
        </div>
        <div class="project-info">
            <div class="project-info-left">
                <a class="project-title" href="projectVisualization/index.html?id=${project.ID}">
                    ${project.name || 'Untitled Project'}
                </a>
                <div class="tags">
                    ${project.tags ? project.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                </div>
            </div>
            <a class="user-link" href="profile/index.html?user=${project.UserID}">
                <img class="user-icon" src="sprites/user-avatar.png" alt="User Icon" 
                    style="width:32px; height:32px; border-radius:50%;">
            </a>
        </div>
    `;

    // After appending to DOM, fetch avatar and update
    getUserAvatar(project).then(avatar => {
        const img = projectCard.querySelector('.user-icon');
        if (img) img.src = avatar;
    });

    return projectCard;
}

async function getUserAvatar(project) {
    try {
        const response = await fetch('Default/DefaultUsers.json');
        const users = await response.json();
        const user = users.find(u => u.ID === project.UserID);
        return user ? user.avatar : 'sprites/user-avatar.png';
    } catch (error) {
        console.error('Error fetching user avatar:', error);
        return 'sprites/user-avatar.png';
    }
}

async function getUserName(project) {
    try {
        const response = await fetch('Default/DefaultUsers.json');
        const users = await response.json();
        const user = users.find(u => u.ID === project.UserID);
        return user ? user.name : 'Unknown User';
    } catch (error) {
        console.error('Error fetching user name:', error);
        return 'Unknown User';
    }
}

window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get('search');
    const filters = params.getAll('filter');
    const userID = params.get('user');
    const projectId = params.get('id');

    loadProjects(searchTerm, filters, userID, projectId);
});