
class ToolDialogue extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
        this.container = document.createElement("div");
        this.container.id = "container";
        this.container.innerHTML = "<h1>Tools</h1>";
        const styles = document.createElement("style");
        styles.textContent = `
            h1, h2 {
                padding: 0;
                font-size: 0.8em;
                text-transform: uppercase;
                background: #666;
                color: white;
                padding: 0.4em;
                margin: 3px 0;
            }
            h1 { background: #333; margin-top: 0; }
            input[type="url"], input[type="text"], label {
                width: 100%;
                box-sizing: border-box;
                display: block;
            }
            input[type="checkbox"] { display: none; }
            label[data-for="checkbox"]::after { float: right; content: "❌"; }
            input:checked + label[data-for="checkbox"]::after { content: "✅"; }
            input[type="radio"] { float: right; }
            #container {
                background: white;
                box-shadow: 3px 3px 3px rgba(0,0,0,0.8);
                border: 1px solid #ccc;
                box-sizing: border-box;
                padding: 3px;
                max-height: 80vh;
                overflow-y: auto;
                overflow-x: hidden;
            }
        `;
        this.shadow.appendChild(this.container);
        this.shadow.appendChild(styles);

        this.mapId = "ONE";

        window.addTools = (ht, tools) => { return this.addTools(ht, tools); }
    }

    addTools(headingText, tools) {
        const heading = document.createElement("h2");
        heading.textContent = headingText;
        this.container.appendChild(heading);
        if (tools && Array.isArray(tools)) tools.forEach(t => this.container.appendChild(t));
        return this;
    }

    save(key, value) {
        if (location.search.length < 2) {
            console.log("no screen set, can't save");
            return;
        }
        let mapid = location.search.substr(1);
        let d = window.localStorage.getItem("pbp-map-data");
        if (!d) d = "{}";
        let jd = {};
        try {
            jd = JSON.parse(d);
        } catch(e) {
            console.log("Failed to load saved data", d, e);
            jd = {};
        }
        if (!jd[mapid]) {
            console.log("no valid mapid");
            return;
        }
        jd[mapid][key] = value;
        window.localStorage.setItem("pbp-map-data", JSON.stringify(jd));
    }
    load(key) {
        if (location.search.length < 2) {
            console.log("no screen set, can't load");
            return;
        }
        let mapid = location.search.substr(1);
        let d = window.localStorage.getItem("pbp-map-data");
        if (!d) d = "{}";
        let jd = {};
        try {
            jd = JSON.parse(d);
        } catch(e) {
            console.log("Failed to load saved data", d, e);
            jd = {};
        }
        return jd[mapid][key];
    }
    removeMap(mapid) {
        let d = window.localStorage.getItem("pbp-map-data");
        if (!d) d = "{}";
        let jd = {};
        try {
            jd = JSON.parse(d);
        } catch(e) {
            console.log("Failed to load saved data", d, e);
            jd = {};
        }
        console.log("deleting", mapid, "from", jd);
        if (!jd[mapid]) {
            console.log("no valid mapid");
            return;
        }
        delete jd[mapid];
        window.localStorage.setItem("pbp-map-data", JSON.stringify(jd));
    }
}
window.customElements.define("tool-dialogue", ToolDialogue);
