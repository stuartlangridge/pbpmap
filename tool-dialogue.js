
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
        this.remoteStorage = new RemoteStorage();
        this.remoteStorage.access.claim("pbpmap", "rw");
        this.remoteStorage.caching.enable('/pbpmap/');
        this.rsclient = this.remoteStorage.scope('/pbpmap/');
        this.rsclient.declareType("mapdata", {}); // no spec for maps

        window.addTools = (ht, tools) => { return this.addTools(ht, tools); }
    }

    addTools(headingText, tools) {
        const heading = document.createElement("h2");
        heading.textContent = headingText;
        this.container.appendChild(heading);
        if (tools && Array.isArray(tools)) tools.forEach(t => this.container.appendChild(t));
        return this;
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
        let thismap = await this.rsclient.getObject("maps/" + mapid);
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
}
window.customElements.define("tool-dialogue", ToolDialogue);
