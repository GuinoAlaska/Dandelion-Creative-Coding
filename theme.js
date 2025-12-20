function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    Object.assign(config, { theme, autoSave });
}