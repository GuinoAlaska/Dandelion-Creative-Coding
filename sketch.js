/*
            < < < < Author: Jonadab Moiseyev Olvera Marichal > > > >
    > Date Created: 15/04/2025
    > Last Updated: 03/09/2025
    > Project Description: This is a fully independent project — an IDE built entirely solo, designed to run p5.js code in a custom way.

    ┌──────────────── - - <<<<<<<< Copyright Notice: >>>>>>>> - - ────────────────┐
    │       The following elements are protected:
    > - The exact content of the following files: `index.html`, `styles.css`, `sketch.js`, `codeReader.js`, `UX.js`, `icons.png`, `tab-icons.png`, and any other files located in the same project directory.  
    > - Any reproduction or derivative work that includes more than 15% of this project's original code or visual assets.  
    > - The implementation and system logic behind the secondary sketch panel used for p5.js development (e.g., `bottomSketch`, `bottomP5Instance`). Variable names are not protected; however, the underlying interaction logic and rendering flow are.
    │
    └─── - - < < < All rights reserved. > > > - - ────>\\\\\

    ┌──────────────── - - <<<<<<<< Notes: >>>>>>>> - - ────────────────┐
    > - This IDE is developed specifically for running and previewing p5.js code.  
    > - p5.js is an open-source JavaScript library maintained by the Processing Foundation: https://p5js.org  
    > - The hot reload mechanism is custom-built and not derived from any external template.  
    > - Portions of the codebase were written with the assistance of GitHub Copilot and/or ChatGPT.
    └────────────────────────────────────────────────────────────────────────────>\\\\\

    ┌──────────────── - - <<<<<<<< Security Disclaimer:  >>>>>>>> - - ────────────────┐
    > - This IDE includes automated code scanning features intended to detect potentially unsafe or malicious code. However, these mechanisms are not guaranteed to be comprehensive or foolproof. Users should be aware that running custom code may still pose security risks, and the developers do not guarantee complete protection against all vulnerabilities.
    > - The environment is intentionally open to allow users to experiment freely, including the ability to break or disrupt the frontend interface. Use at your own risk.
    └────────────────────────────────────────────────────────────────────────────>\\\\\

    Estimated Development Cost: ~$350,000 USD
*/

let editorCamera={
    x:0,
    y:0,
    z:1,
    tx:0,
    ty:0,
    tz:1,
}

if (topP5Instance) topP5Instance.remove();
if (bottomP5Instance) bottomP5Instance.remove();

let editorFocused = true;

window.addEventListener('load', () => {
    IDEStopSketch();
    enableDragForTabs()
});