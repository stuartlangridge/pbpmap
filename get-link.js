
class GetLink extends HTMLElement {
    constructor() {
        super();
        let gl = this;

        let button = document.createElement("button");
        button.onclick = function() {
            gl.toolsElement.doRemoteStorageWidget();
        }
        button.textContent = "Connect remote storage";
        let a = document.createElement("a");
        a.href = "#";
        a.textContent = "";

        let iv = setInterval(() => {
            if (window.addTools) {
                clearInterval(iv);
                this.toolsElement = window.addTools("Save maps", [button, a]);
            }
        }, 50);
    }
}
window.customElements.define("get-link", GetLink);