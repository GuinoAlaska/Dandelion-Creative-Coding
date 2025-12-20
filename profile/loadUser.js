window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const userID = params.get('user');
    loadUserProfile(userID);
});

function loadUserProfile(userID) {
    fetch(`Default/DefaultUsers.json`)
        .then(response => response.json())
        .then(users => {
            const user = users.find(u => u.ID === userID);
            if (user) {
                document.querySelector('.user-name').textContent = user.name;
                document.querySelector('.user-description').textContent = user.description || 'No description available.';
                let contactsHTML = "";
                for(let contact of user.contacts){
                    switch(contact.type){
                        case "reddit":{
                            contactsHTML += `<a href="${contact.link}" target="_blank" rel="noopener noreferrer"><img src="https://cdn.simpleicons.org/reddit/FF4500" style="width:40px; height:40px;"></a>`;
                            break;
                        }
                        case "OpenProcessing":{
                            contactsHTML += `<a href="${contact.link}" target="_blank" rel="noopener noreferrer"><img src="https://openprocessing.org/assets/img/logo/logo_400x400_color.png" style="width:40px; height:40px;"></a>`;
                            break;
                        }
                    }
                }
                document.querySelector('.user-contacts').innerHTML=contactsHTML;
                document.querySelector('.user-avatar').src = user.avatar || 'sprites/user-avatar.png';
            } else {
                console.error('User not found');
            }
        })
        .catch(error => {
            console.error('Error loading user profile:', error);
        });
}