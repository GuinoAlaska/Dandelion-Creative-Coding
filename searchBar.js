const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('SearchBtn');

if(searchInput){
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // prevents form submission/reload
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                window.location = `index.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });
}

if(searchBtn){
    searchBtn.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            window.location = `index.html?search=${encodeURIComponent(searchTerm)}`;
        }
    });
}