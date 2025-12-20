window.addEventListener("load", () => {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(navigator.userAgent);
    window.isMobile = isMobile;
    if(isMobile){
        //document.getElementById("leftAds-div").style.display = "none";
        //document.getElementById("rightAds-div").style.display = "none";
    }
});