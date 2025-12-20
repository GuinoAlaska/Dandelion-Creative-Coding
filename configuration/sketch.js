const lightOption = document.getElementById("lightThemeOption");
const darkOption = document.getElementById("darkThemeOption");
const autosaveCheck = document.getElementById("autoSave");
const fontSizeInput = document.getElementById("fontSize");

const saveChangesBtn = document.getElementById("SaveChanges");
const resetChangesBtn = document.getElementById("ResetChanges");
const resetDefaultChangesBtn = document.getElementById("ResetDefaultChanges");

let isDirty;

lightOption.addEventListener("click", (e) => {
    setTheme("light");
    darkOption.classList.remove("selected");
    lightOption.classList.add("selected");
    isDirty = !savedConfig || savedConfig.theme !== config.theme || savedConfig.autoSave !== config.autoSave || savedConfig.fontSize !== config.fontSize;
});

darkOption.addEventListener("click", (e) => {
    setTheme("dark");
    lightOption.classList.remove("selected");
    darkOption.classList.add("selected");
    isDirty = !savedConfig || savedConfig.theme !== config.theme || savedConfig.autoSave !== config.autoSave || savedConfig.fontSize !== config.fontSize;
});

autosaveCheck.addEventListener("change", function() {
    if (this.checked) {
        config.autoSave=true;
    } else {
        config.autoSave=false;
    }
    isDirty = !savedConfig || savedConfig.theme !== config.theme || savedConfig.autoSave !== config.autoSave || savedConfig.fontSize !== config.fontSize;
});

fontSizeInput.addEventListener("change", function() {
    console.log(this.value);
    config.fontSize = this.value;
    document.documentElement.style.fontSize = this.value + "px";
    isDirty = !savedConfig || savedConfig.theme !== config.theme || savedConfig.autoSave !== config.autoSave || savedConfig.fontSize !== config.fontSize;
});



saveChangesBtn.addEventListener("click", (e)=>{
    saveConfig();
    isDirty = !savedConfig || savedConfig.theme !== config.theme || savedConfig.autoSave !== config.autoSave || savedConfig.fontSize !== config.fontSize;
});

resetChangesBtn.addEventListener("click", (e)=>{
    loadConfig();
    isDirty = !savedConfig || savedConfig.theme !== config.theme || savedConfig.autoSave !== config.autoSave || savedConfig.fontSize !== config.fontSize;
});

resetDefaultChangesBtn.addEventListener("click", (e)=>{
    const theme = "light", autoSave = true;
    Object.assign(config, { theme, autoSave });

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

    const autosaveCheck = document.getElementById("autoSave");
    if(autosaveCheck){
        autosaveCheck.checked = config.autoSave;
    }
    isDirty = !savedConfig || savedConfig.theme !== config.theme || savedConfig.autoSave !== config.autoSave || savedConfig.fontSize !== config.fontSize;
});


const ConfigKey = "config";
function saveConfig(){
    let toSave = {
        theme: config.theme,
        fontSize: config.fontSize,
        autoSave: config.autoSave,
        visibility: config.visibility,
    }
    localStorage.setItem(ConfigKey, JSON.stringify(toSave))
    savedConfig = {...toSave};
}

let savedConfig;
try {
    const stored = localStorage.getItem(ConfigKey);
    savedConfig = stored ? JSON.parse(stored) : null;
} catch (e) {
    console.error("Invalid config in storage:", e);
    savedConfig = null;
}


window.addEventListener('beforeunload', (event) => {
    if (isDirty) {
        // Most browsers ignore the custom message now
        event.preventDefault(); // Chrome requires this
        event.returnValue = ''; // Some browsers still check this
    }
});