
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
                color: rgba(255, 255, 255, 0.9);
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

            #container > details[open] + details, #container .noHeading {
                margin-top: 0.5em;
            }
            #container > details[open] > summary, #container .noHeading {
                margin-bottom: 0.5em;
            }

            button {
                border: 2px solid rgba(255, 255, 255, 0.8);
                background: linear-gradient(to bottom right, transparent 25%, rgba(255, 255, 255, 0.8) 25%, rgba(255, 255, 255, 0.8) 28%, transparent 28%);
                background-color: transparent;
                background-size: 20px 20px;
                background-repeat: no-repeat;
                color: white;
                text-transform: uppercase;
                transition: background-color 150ms ease-in;
                box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.7);
                padding: 2px 8px; /* 2px makes it the same height as selects */
            }
            button:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }

            .input-label {
                position: relative;
                border: 2px solid rgba(255, 255, 255, 0.8);
                height: 28px;
            }
            .input-label::before {
                content: "url";
                text-transform: uppercase;
                align-items: center;
                justify-content: center;
                font-size: 0.8em;
                display: flex;
                position: absolute;
                width: 50px;
                top: 0;
                left: 0;
                height: 100%;
            }
            .input-label input {
                position: absolute;
                top: 0;
                left: 50px;
                right: 0;
                bottom: 0;
                border-width: 0;
                width: calc(100% - 50px);
                padding: 2px 8px;
                font-size: 0.8em;
                height: 100%;
            }

            /* https://github.com/filamentgroup/select-css */
            select {
                max-width: 4em;
                font-size: 16px; /* required for ios safari to not zoom */
                font-weight: 700;
                color: rgba(255, 255, 255, 0.9);
                line-height: 1.3;
                padding: 0;
                box-sizing: border-box;
                margin: 0 0.5em;
                border: 2px solid rgba(255, 255, 255, 0.9);
                -moz-appearance: none;
                -webkit-appearance: none;
                appearance: none;
                background-color: transparent;
                background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22white%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'), linear-gradient(to bottom, transparent 0%, transparent 100%);
                background-repeat: no-repeat, repeat;
                background-position: right .7em top 50%, 0 0;
                background-size: .65em auto, 100%;
                box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
            }

        `;
        this.shadow.appendChild(this.container);
        this.shadow.appendChild(styles);

        this.container.querySelector("h1").onclick = () => {
            this.container.classList.toggle("ghostly");
        }

        this.mapId = "ONE";
        this.remoteStorage = new RemoteStorage();
        this.remoteStorage.access.claim("pbpmap", "rw");
        this.remoteStorage.caching.enable('/pbpmap/');
        this.rsclient = this.remoteStorage.scope('/pbpmap/');
        this.rsclient.declareType("mapdata", {}); // no spec for maps

        this.redrawQueue = {};

        window.addTools = (ht, tools, options) => { return this.addTools(ht, tools, options); }
    }

    addTools(headingText, tools, options) {
        let parent;
        if (options && options.noHeading) {
            parent = document.createElement("div");
            parent.className = "noHeading";
            this.container.appendChild(parent);
        } else {
            const accordion = document.createElement("details");
            const summary = document.createElement("summary");
            const heading = document.createElement("h2");
            heading.textContent = headingText;
            summary.appendChild(heading);
            if (options && options.openByDefault) accordion.open = true;
            accordion.appendChild(summary);
            this.container.appendChild(accordion);
            parent = accordion;
        }
        if (tools && Array.isArray(tools)) tools.forEach(t => parent.appendChild(t));
        return [this, parent];
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

    queueRedraw(owner, handler) {
        this.redrawQueue[owner] = {
            timeout: null,
            eventObject: null
        }
        let that = this;
        return function(e) {
            if (that.redrawQueue[owner].timeout) {
                console.log("event for", owner, "is queued, so storing");
                // we're already queued, so just replace any previous e with this one
                that.redrawQueue[owner].eventObject = e;
                return;
            }
            // we're not queued, so store this e and start the clock
            console.log("queueing event for", owner);
            that.redrawQueue[owner].eventObject = e;
            that.redrawQueue[owner].timeout = setTimeout(function() {
                console.log("executing queued event for", owner);
                handler({detail: Object.assign({}, that.redrawQueue[owner].eventObject.detail)});
                that.redrawQueue[owner].timeout = null;
                that.redrawQueue[owner].eventObject = null;
            }, 200);
        };
    }
}
window.customElements.define("tool-dialogue", ToolDialogue);
