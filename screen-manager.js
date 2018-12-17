
class ScreenManager extends HTMLElement {
    constructor() {
        super();
        let sm = this;
        this.shadow = this.attachShadow({mode: 'open'});
        this.container = document.createElement("div");
        this.container.id = "container";
        this.container.innerHTML = "<h1>Choose a map</h1>";
        const styles = document.createElement("style");
        styles.textContent = `
            #container {
                background: #eef;
                position: absolute;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 5;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                display: none;
            }
        `;

        this.ul = document.createElement("ul");
        const newmap = document.createElement("form");
        const name = document.createElement("input");
        const go = document.createElement("input");
        go.type = "submit";
        go.value = "Create new map";
        name.placeholder = "map name";
        name.required = true;
        newmap.appendChild(name);
        newmap.appendChild(go);

        this.container.appendChild(this.ul);
        this.container.appendChild(newmap);
        this.shadow.appendChild(this.container);
        this.shadow.appendChild(styles);

        newmap.onsubmit = function(e) {
            e.preventDefault();
            let d = window.localStorage.getItem("pbp-map-data");
            if (!d) d = "{}";
            let jd = {};
            try {
                jd = JSON.parse(d);
            } catch(e) {
                console.log("Failed to load saved data", d, e);
                jd = {};
            }
            let mapid = uuidv4();
            jd[mapid] = {name: name.value || "Unknown"};
            window.localStorage.setItem("pbp-map-data", JSON.stringify(jd));
            location.href = "?" + mapid;
        }

        let delreturn = document.createElement("div");
        let delbutton = document.createElement("button");
        delbutton.textContent = "Delete this map";
        let returnlink = document.createElement("a");
        returnlink.href = "?";
        returnlink.textContent = "or back to list";
        delreturn.appendChild(delbutton);
        delreturn.appendChild(returnlink);
        delbutton.onclick = function(e) {
            e.preventDefault();
            if (!confirm("Really delete this map permanently?")) return;
            sm.toolsElement.removeMap(location.search.substr(1));
            location.href = "?";
        }

        let iv = setInterval(() => {
            if (window.addTools) {
                clearInterval(iv);
                this.toolsElement = window.addTools("Manage maps", [delreturn]);
            }
        }, 50);

        function uuidv4() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }

        let d = window.localStorage.getItem("pbp-map-data");
        if (!d) d = "{}";
        let jd = {};
        try {
            jd = JSON.parse(d);
        } catch(e) {
            console.log("Failed to load saved data", d, e);
            jd = {};
        }
        if (location.search.length < 2 || !jd[location.search.substr(1)]) {
            sm.container.style.display = "flex";
            Object.keys(jd).forEach(function(k) {
                let li = document.createElement("li");
                let a = document.createElement("a");
                a.href = "?" + k;
                a.textContent = jd[k].name || "Unknown";
                li.appendChild(a);
                sm.ul.appendChild(li);
            })
        }
    }
}
window.customElements.define("screen-manager", ScreenManager);
