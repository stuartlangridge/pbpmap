
class ToolDialogue extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
        this.container = document.createElement("div");
        this.container.id = "container";
        this.container.innerHTML = "<h1>Tools <span>👻</span></h1>";
        const styles = document.createElement("style");
        styles.textContent = `
            h1 span { float: right; }
            h1, h2 {
                padding: 0;
                font-size: 0.8em;
                text-transform: uppercase;
                background: #E4644B;
                color: white;
                padding: 0.4em;
                margin: 3px 0;
            }
            h1 {
                background: #493F40;
                margin-top: 0;
                margin-bottom: 0;
                text-align: center;
                margin-left: -0.6em;
                margin-right: -0.5em;
            }
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
                background: #493F40;
                color: #FFCFD7;
                box-shadow: -3px 0px 3px rgba(0,0,0,0.8);
                box-sizing: border-box;
                height: 100vh;
                overflow-y: auto;
                overflow-x: hidden;
                user-select: none;
                font-family: Roboto, sans-serif;
                padding: 0 0.5em;
            }
            #container.ghostly {
                opacity: 0.1;
            }
            #container.ghostly * {
                pointer-events: none;
            }
            #container.ghostly h1 {
                pointer-events: auto
            }
            #container > details > summary {
                list-style: none;
                margin-left: -0.5em;
                margin-right: -0.5em;
            }
            #container > details > summary > h2 {
                margin: 0;
                border-top: 1px solid #D5583E;
                position: relative;
            }
            #container > details[open] > summary > h2::before {
                content: "";
                position: absolute;
                bottom: -12px;
                left: 12px;
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 6px 10px;
                border-color: #E4644B transparent transparent transparent;
            }
            #container > details > summary > h2::after {
                content: "»";
                display: block;
                float: right;
                transition: transform 100ms ease-out;
            }
            #container > details[open] > summary > h2::after {
                transform: rotate(90deg);
            }
            #container > details[open] > summary ~ * {
                animation: fadesweep 150ms ease-in-out;
            }
            @keyframes fadesweep {
                0% { opacity: 0; transform: translateX(-10px); }
                100% { opacity: 1; transform: translateX(0); }
            }

            #container > details[open] > summary {
                margin-bottom: 0.5em;
            }
            #container > details[open] > :last-child {
                margin-bottom: 0.5em;
            }

        `;
        this.shadow.appendChild(this.container);
        this.shadow.appendChild(styles);

        this.container.querySelector("h1").onclick = () => {
            this.container.classList.toggle("ghostly");
        }

        this.mapId = "ONE";
        this.remoteStorage = new RemoteStorage({logging: true});
        this.remoteStorage.access.claim("pbpmap", "rw");
        this.remoteStorage.caching.enable('/pbpmap/');
        this.rsclient = this.remoteStorage.scope('/pbpmap/');
        this.rsclient.declareType("mapdata", {}); // no spec for maps

        window.addTools = (ht, tools, openByDefault) => { return this.addTools(ht, tools, openByDefault); }
    }

    addTools(headingText, tools, openByDefault) {
        const accordion = document.createElement("details");
        const summary = document.createElement("summary");
        const heading = document.createElement("h2");
        heading.textContent = headingText;
        summary.appendChild(heading);
        if (openByDefault) accordion.open = true;
        accordion.appendChild(summary);
        this.container.appendChild(accordion);
        if (tools && Array.isArray(tools)) tools.forEach(t => accordion.appendChild(t));
        return [this, accordion];
    }

    getDataSync() {
        let d = window.localStorage.getItem("pbp-map-data");
        if (!d) d = "{}";
        let jd = {};
        try {
            jd = JSON.parse(d);
        } catch(e) {
            console.log("Failed to load saved data", d, e);
            jd = {};
        }
        return jd;
    }
    setDataSync(jd) {
        window.localStorage.setItem("pbp-map-data", JSON.stringify(jd));
    }
    async getMapDataById(mapid) {
        console.log("asked to get map", mapid);
        let thismap = await this.rsclient.getObject("maps/" + mapid);
        console.log("now I have", mapid);
        return thismap || {};
    }
    async getMapData() {
        let mapid = location.search.substr(1);
        return this.getMapDataById(mapid);
    }
    async setMapData(jd) {
        let mapid = location.search.substr(1);
        //console.log("saving", jd, "as", "maps/" + mapid);
        return this.rsclient.storeObject("mapdata", "maps/" + mapid, jd);
    }
    async save(key, value) {
        if (location.search.length < 2) {
            console.log("no screen set, can't save");
            return;
        }
        let mapid = location.search.substr(1);
        let jd = await this.getMapData();
        jd[key] = value;
        return await this.setMapData(jd)
    }
    async load(key) {
        if (location.search.length < 2) {
            console.log("no screen set, can't load");
            return;
        }
        console.log("asked to load", key);
        let jd = await this.getMapData();
        return jd[key];
    }
    async removeMap(mapid) {
        console.log("deleting", mapid);
        return await this.rsclient.remove("maps/" + mapid);
    }
    async isMapId(mapid) {
        let jd = await this.getMapDataById(mapid);
        if (Object.keys(jd).length == 0) { return false; }
        return true;
    }
    async getMaps(mapid) {
        let allMaps = await this.rsclient.getAll("maps/");
        let maps = [];
        for (var k in allMaps) {
            if (!allMaps[k].name) continue;
            allMaps[k].id = k;
            maps.push(allMaps[k]);
        }
        return maps;
    }
    async addMap(mapdata) {
        let mapid = uuidv4();
        await this.rsclient.storeObject("mapdata", "maps/" + mapid, mapdata);
        return mapid;
    }
    doRemoteStorageWidget() {
        const widget = new Widget(this.remoteStorage);
        widget.attach();
    }
}
window.customElements.define("tool-dialogue", ToolDialogue);
