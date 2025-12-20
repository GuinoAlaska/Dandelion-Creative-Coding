// Mobile burger menu toggle
document.getElementById('mobile-burger-btn').onclick = function() {
    var menu = document.getElementById('mobile-dropdown-menu');
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
};

const create_mobile = document.getElementById('create-mobile');
const explore_mobile = document.getElementById('explore-mobile');

if(create_mobile) create_mobile.onclick = function() {
    window.location.href = '/editor/index.html';
}

if(explore_mobile) explore_mobile.onclick = function() {
    window.location.href = '/index.html';
}

// Hide menu when clicking outside
document.addEventListener('click', function(e) {
    var btn = document.getElementById('mobile-burger-btn');
    var menu = document.getElementById('mobile-dropdown-menu');
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

// Mobile help
document.getElementById('mobile-help-btn').addEventListener('click', () => {
    window.open('/about/index.html', '_blank');
});

window.addEventListener("load", () => {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(navigator.userAgent);
    window.isMobile = isMobile;
    if(isMobile){
        document.getElementById("desktop-menu-bar").classList.add("hidden");
        document.getElementById("mobile-menu-bar").classList.remove("hidden");
    }
});