
class TokenManager extends HTMLElement {
    constructor() {
        super();

        let tools = document.createElement("div");
        let p = document.createElement("div");
        p.innerHTML = '<a href="https://imgur.com/a/0hFdv">(imgur list)</a>';
        tools.appendChild(p);
        let tm = this;

        function serialise() {
            let data = tokens.map(function(t) {
                if (!t.url.validity.valid) return null;
                return {
                    url: t.url.value,
                    name: t.name.value,
                    x: t.x.valueAsNumber,
                    y: t.y.valueAsNumber
                }
            }).filter(function(t) { return t; })
            if (data.length) {
                tm.toolsElement.save("tokens", data);
            }
            document.dispatchEvent(new Event('request-map-redraw'));
        }

        let masterRidx = 1;
        function addToken(values) {
            let contents = {
                url: document.createElement("input"),
                name: document.createElement("input"),
                x: document.createElement("input"),
                y: document.createElement("input"),
                add: document.createElement("button"),
                remove: document.createElement("button"),
                container: document.createElement("div"),
                sub_container: document.createElement("div"),
                ridx: masterRidx++
            }
            contents.url.type = "url";
            contents.url.placeholder = "token image URL";
            contents.name.type = "text";
            contents.name.placeholder = "Participant name";
            contents.x.type = "number";
            contents.y.type = "number";
            contents.x.value = 1;
            contents.y.value = 1;
            contents.container.appendChild(contents.url);
            contents.container.appendChild(contents.name);
            contents.container.appendChild(contents.sub_container);
            contents.sub_container.appendChild(contents.remove);
            contents.sub_container.appendChild(contents.x);
            contents.sub_container.appendChild(contents.y);
            contents.sub_container.appendChild(contents.add);
            contents.add.textContent = "+";
            contents.remove.textContent = "-";
            contents.container.className = "token";
            contents.sub_container.style.display = "flex";
            contents.x.style.flex = "1 1 auto";
            contents.y.style.flex = "1 1 auto";
            contents.add.style.flex = "1 1 auto";
            contents.remove.style.flex = "1 1 auto";
            contents.x.style.width = "20%";
            contents.y.style.width = "20%";
            tools.appendChild(contents.container);
            contents.url.addEventListener("input", serialise, false);
            contents.name.addEventListener("input", serialise, false);
            contents.x.addEventListener("input", serialise, false);
            contents.y.addEventListener("input", serialise, false);
            contents.add.addEventListener("click", addToken, false);
            contents.remove.addEventListener("click", function() {
                if (tokens.length == 1) { return; }
                if (!confirm("Remove " + contents.name.value + "?")) return;
                contents.container.remove();
                tokens = tokens.filter(function(t) { return t.ridx != contents.ridx; })
                serialise();
            }, false);
            if (values && values.url) {
                contents.url.value = values.url;
                contents.name.value = values.name;
                contents.x.value = values.x;
                contents.y.value = values.y;
            }
            tokens.push(contents);
        }

        let tokens = [];

        let iv = setInterval(() => {
            if (window.addTools) {
                clearInterval(iv);
                this.toolsElement = window.addTools("Participants", [tools]);
                let load_tokens = this.toolsElement.load("tokens");
                if (!Array.isArray(load_tokens)) load_tokens = [];
                if (load_tokens.length == 0) {
                    addToken();
                } else {
                    load_tokens.forEach(addToken);
                }
            }
        }, 50);

        document.addEventListener("map-redraw", function(e) {
            let ctx = e.detail.ctx;
            if (tokens.length == 0) return;
            tm.renderTokens(ctx, tokens.map(t => {
                return {
                    url: t.url.value,
                    name: t.name.value,
                    x: t.x.valueAsNumber,
                    y: t.y.valueAsNumber
                }
            }));
        });
        this.IMAGECACHE = {};
    }


    renderTokens(ctx, tokensData, overrideGridSettings, mainDone) {
        let tm = this;
        let gx1 = this.toolsElement.load("grid-x1"),
            gx2 = this.toolsElement.load("grid-x2"),
            gy = this.toolsElement.load("grid-y");
        let gridSettings = {
            size: gx2 - gx1,
            xoffset: gx1 % (gx2 - gx1),
            yoffset: gy % (gx2 - gx1)
        };
        if (overrideGridSettings) gridSettings = overrideGridSettings;
        function nextImage(t, done) {
            function loadit(img) {
                let xpos = gridSettings.xoffset + (t.x * gridSettings.size);
                let ypos = gridSettings.xoffset + (t.y * gridSettings.size);
                let grab = {size: Math.min(img.naturalWidth, img.naturalHeight)};
                grab.x = Math.floor(img.naturalWidth / 2 - grab.size / 2);
                grab.y = Math.floor(img.naturalHeight / 2 - grab.size / 2);

                ctx.beginPath();
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
                ctx.shadowColor = "black";
                ctx.arc(xpos + (gridSettings.size / 2), ypos + (gridSettings.size / 2), gridSettings.size / 2, 0, Math.PI * 2, true);
                ctx.fillStyle = "black";
                ctx.fill();

                ctx.beginPath();
                ctx.save();
                ctx.beginPath();
                ctx.arc(xpos + (gridSettings.size / 2), ypos + (gridSettings.size / 2), gridSettings.size / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(img, grab.x, grab.y, grab.size, grab.size, xpos, ypos, gridSettings.size, gridSettings.size);

                ctx.arc(xpos + (gridSettings.size / 2), ypos + (gridSettings.size / 2), gridSettings.size / 2, 0, Math.PI * 2, true);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.restore();

                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
                let fontSize = Math.floor(gridSettings.size / 5);
                let padding = 3;
                ctx.font = fontSize + "px sans-serif";
                let metrics = ctx.measureText(t.name);
                ctx.fillStyle = "black";
                let textBoxX = (xpos + gridSettings.size / 2) - (metrics.width / 2);
                let textBoxY = ypos + gridSettings.size - fontSize;
                ctx.fillRect(textBoxX - padding, textBoxY - padding - padding,
                    metrics.width + padding + padding, fontSize + padding + padding);
                ctx.fillStyle = "white";
                ctx.fillText(t.name, textBoxX, textBoxY + padding + padding);
                if (done) done();
            }
            var img;
            if (tm.IMAGECACHE[t.url]) {
                img = tm.IMAGECACHE[t.url];
                loadit(img);
            } else {
                img = new Image();
                img.src = t.url;
                img.crossOrigin = "Anonymous";
                img.onload = function() {
                    tm.IMAGECACHE[t.url] = img;
                    loadit(img);
                }
            }
        }
        function doNext() {
            let next = tokensData.shift();
            if (next) {
                nextImage(next, doNext);
            } else {
                if (mainDone) mainDone();
            }
        }
        doNext();
    }
}
window.customElements.define("token-manager", TokenManager);
