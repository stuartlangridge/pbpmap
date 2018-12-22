function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
        const connect = document.createElement("button");
        connect.onclick = function() { sm.toolsElement.doRemoteStorageWidget(this.container); }
        connect.textContent = "Connect remote storage";

        this.container.appendChild(this.ul);
        this.container.appendChild(newmap);
        this.container.appendChild(connect);
        this.shadow.appendChild(this.container);
        this.shadow.appendChild(styles);

        newmap.onsubmit = async function(e) {
            e.preventDefault();
            let mapid = await sm.toolsElement.addMap({name: name.value || "Unknown"});
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
        delbutton.onclick = async function(e) {
            e.preventDefault();
            if (!confirm("Really delete this map permanently?")) return;
            await sm.toolsElement.removeMap(location.search.substr(1));
            location.href = "?";
        }

        let iv = setInterval(() => {
            if (window.addTools) {
                clearInterval(iv);
                sm.toolsElement = window.addTools("Manage maps", [delreturn]);
                sm.loadList();
            }
        }, 50);

    }

    async loadList() {
        let mode;
        if (location.search.length < 2) {
            return await this.showList();
        } else {
            if (this.toolsElement.isMapId(location.search.substr(1))) {
                // do nothing; this is a legit map ID and will be displayed
            } else {
                return await this.showList();
            }
        }
    }

    async showList() {
        this.container.style.display = "flex";
        let that = this;
        let maps = await this.toolsElement.getMaps();
        maps.forEach(function(m) {
            let li = document.createElement("li");
            let a = document.createElement("a");
            a.href = "?" + m.id;
            a.textContent = m.name || "Unknown";
            li.appendChild(a);
            that.ul.appendChild(li);
        })
    }
}
window.customElements.define("screen-manager", ScreenManager);
