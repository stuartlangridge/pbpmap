function shorten(text, length) {
    let rev = text.split("").reverse().join("");
    let last = rev.length;
    while (rev.length > length) {
        if (/[aeiou]/.test(rev)) { rev = rev.replace(/[aeiou]/, ""); continue; }
        if (/[cfhkmprtwy]/.test(rev)) { rev = rev.replace(/[cfhkmprtwy]/, ""); continue; }
        if (/[bdgjlnqsvxz]/.test(rev)) { rev = rev.replace(/[bdgjlnqsvxz]/, ""); continue; }
        if (/[A-Z]/.test(rev)) { rev = rev.replace(/[A-Z]/, ""); continue; }
        break;
    }
    return rev.split("").reverse().join("");
}
console.assert(shorten("abcdefghij", 4) == "bdgj", "assertion 1");
console.assert(shorten("abcd", 4) == "abcd", "assertion 2");
console.assert(shorten("ABcdEfghiJ", 4) == "ABEJ", "assertion 3");
console.assert(shorten("Exhaustion/Incapacitated/Stunned", 15) == "Exhstn/Ind/Snnd", "assertion 4");

class TokenManager extends HTMLElement {
    constructor() {
        super();

        let tools = document.createElement("div");
        let p = document.createElement("div");
        p.innerHTML = '<a href="https://imgur.com/a/0hFdv">(imgur list)</a>';
        tools.appendChild(p);
        let add_button = document.createElement("button");
        add_button.textContent = "+";
        add_button.style.float = "right";
        p.appendChild(add_button);
        add_button.addEventListener("click", addToken, false);

        let tm = this;

        function serialise() {
            let data = tokens.map(function(t) {
                if (!t.url.validity.valid) return null;
                let ret = {
                    url: t.url.value,
                    name: t.name.value,
                    x: t.x.valueAsNumber,
                    y: t.y.valueAsNumber
                }
                ret.conditions = Array.from(t.flags_list.querySelectorAll("input"))
                    .filter(i => i.checked).map(i => i.parentNode.textContent);
                return ret;
            }).filter(function(t) { return t; })
            if (data.length) {
                tm.toolsElement.save("tokens", data);
            }
            document.dispatchEvent(new Event('request-map-redraw'));
        }

        let masterRidx = 1;
        function addToken(values) {
            let html = `
            <summary>Participant</summary>
            <div style="display: flex;">
                <input type="text" placeholder="Participant name" style="flex: 1 1 auto; width: 40%;">
                <input type="url" placeholder="token image URL" style="flex: 1 1 auto; width: 40%;">
            </div>
            <div style="display: flex;">
                <button style="flex: 1 1 auto;">-</button>
                <input type="number" style="flex: 1 1 auto; width: 20%;">
                <input type="number" style="flex: 1 1 auto; width: 20%;">
                <label style="position: relative; flex: 1 1 auto;">
                    <button style="width: 100%;">Cnd</button>
                    <ul style="display: none; position: absolute; background: white; right: 0; margin: 2px 0 0 0; padding: 0; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 0 6px 0 rgba(0,0,0,0.1); list-style-type: none; white-space: nowrap;">
<li style="padding:0.2em 1em;margin:0"><label title="can't see; attacks at advantage; attacking at disadvantage"><input style="display:inline" type="checkbox">Blinded</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="can't attack charmer; charmer has advantage on interactions"><input style="display:inline" type="checkbox">Charmed</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="can't hear"><input style="display:inline" type="checkbox">Deafened</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="complex rules; look them up"><input style="display:inline" type="checkbox">Exhaustion</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="disadvantage on checks and attacking while it can see the source; can't willingly move closer"><input style="display:inline" type="checkbox">Frightened</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="speed 0"><input style="display:inline" type="checkbox">Grappled</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="double speed; AC+2; dex save at advantage; extra action"><input style="display:inline" type="checkbox">Hasted</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="can't take actions or reactions"><input style="display:inline" type="checkbox">Incapacitated</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="attacks at disadvantage; attacking at advantage"><input style="display:inline" type="checkbox">Invisible</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="incapacitated; fails str/dex saves; attacks at advantage; all melee hits are crits"><input style="display:inline" type="checkbox">Paralyzed</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="incapacitated; speed 0; fails str/dex saves; resistant to all damage; immune to poison and disease"><input style="display:inline" type="checkbox">Petrified</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="attacking and checks at disadvantage"><input style="display:inline" type="checkbox">Poisoned</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="half movement to stand; melee attacks at advantage; ranged attacks at disadvantage; attacking at disadvantage"><input style="display:inline" type="checkbox">Prone</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="speed 0; attacks at advantage; attacking at disadvantage; dex saves at disadvantage"><input style="display:inline" type="checkbox">Restrained</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="incapacitated; fails str/dex saves; attacks at advantage"><input style="display:inline" type="checkbox">Stunned</label></li>
<li style="padding:0.2em 1em;margin:0"><label title="incapacitated; prone; fails str/dex saves; attacks at advantage; melee attacks auto-crit"><input style="display:inline" type="checkbox">Unconscious</label></li>
                    </ul>
                </label>
            </div>
            `;

            let container = document.createElement("details");
            container.innerHTML = html;
            container.style.clear = "both";
            let contents = {
                container: container,
                url: container.querySelectorAll("input")[1],
                name: container.querySelectorAll("input")[0],
                x: container.querySelectorAll("input")[2],
                y: container.querySelectorAll("input")[3],
                flags_button: container.querySelectorAll("button")[1],
                flags_list: container.querySelector("ul"),
                remove: container.querySelectorAll("button")[0],
                summary: container.querySelector("summary"),
                ridx: masterRidx++
            }

            contents.summary.textContent = (values ? values.name : null) || "Participant";
            tools.appendChild(contents.container);
            contents.url.addEventListener("input", serialise, false);
            contents.name.addEventListener("input", function() {
                contents.summary.textContent = contents.name.value;
                serialise();
            }, false);
            contents.x.addEventListener("input", serialise, false);
            contents.y.addEventListener("input", serialise, false);
            contents.remove.addEventListener("click", function() {
                if (tokens.length == 1) { return; }
                if (!confirm("Remove " + contents.name.value + "?")) return;
                contents.container.remove();
                tokens = tokens.filter(function(t) { return t.ridx != contents.ridx; })
                serialise();
            }, false);
            contents.flags_button.addEventListener("click", function() {
                contents.flags_list.style.display = contents.flags_list.style.display == "none" ? "block" : "none";
            });
            contents.flags_list.addEventListener("change", serialise, false);

            if (values && values.url) {
                contents.url.value = values.url;
                contents.name.value = values.name;
                contents.x.value = values.x;
                contents.y.value = values.y;
                if (values.conditions && Array.isArray(values.conditions)) {
                    Array.from(contents.flags_list.querySelectorAll("input")).forEach(i => {
                        if (values.conditions.includes(i.parentNode.textContent)) i.checked = true;
                    })
                }
            }
            tokens.push(contents);
        }

        let tokens = [];

        let iv = setInterval(async () => {
            if (window.addTools) {
                clearInterval(iv);
                this.toolsElement = window.addTools("Participants", [tools]);
                let load_tokens = await this.toolsElement.load("tokens");
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
                    y: t.y.valueAsNumber,
                    conditions: Array.from(t.flags_list.querySelectorAll("input"))
                    .filter(i => i.checked).map(i => i.parentNode.textContent)
                }
            }));
        });
        this.IMAGECACHE = {};
    }


    async renderTokens(ctx, tokensData, overrideGridSettings, mainDone) {
        let tm = this;
        let gx1 = await this.toolsElement.load("grid-x1"),
            gx2 = await this.toolsElement.load("grid-x2"),
            gy = await this.toolsElement.load("grid-y");
        let gridSettings = {
            size: gx2 - gx1,
            xoffset: gx1 % (gx2 - gx1),
            yoffset: gy % (gx2 - gx1)
        };
        if (overrideGridSettings) gridSettings = overrideGridSettings;
        function nextImage(t, done) {
            function loadit(img) {
                let margin = 2;
                let xpos = gridSettings.xoffset + (t.x * gridSettings.size) + margin;
                let ypos = gridSettings.yoffset + (t.y * gridSettings.size) + margin;
                let grab = {size: Math.min(img.naturalWidth, img.naturalHeight)};
                grab.x = Math.floor(img.naturalWidth / 2 - grab.size / 2);
                grab.y = Math.floor(img.naturalHeight / 2 - grab.size / 2);

                let containedSize = gridSettings.size - margin - margin;

                ctx.beginPath();
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
                ctx.shadowColor = "black";
                ctx.arc(xpos + (containedSize / 2) + margin, ypos + (containedSize / 2) + margin, containedSize / 2, 0, Math.PI * 2, true);
                ctx.fillStyle = "black";
                ctx.fill();

                ctx.beginPath();
                ctx.save();
                ctx.beginPath();
                ctx.arc(xpos + (containedSize / 2) + margin, ypos + (containedSize / 2) + margin, containedSize / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(img, grab.x, grab.y, grab.size, grab.size, xpos, ypos, containedSize, containedSize);

                ctx.arc(xpos + (containedSize / 2) + margin, ypos + (containedSize / 2) + margin, containedSize / 2, 0, Math.PI * 2, true);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.restore();

                if (t.conditions.length > 0) {
                    ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
                    ctx.lineWidth = 3;
                    ctx.arc(xpos + (containedSize / 2) + margin, ypos + (containedSize / 2) + margin, containedSize / 2, 0, Math.PI * 2, true);
                    ctx.stroke();
                }

                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
                let fontSize = Math.floor(containedSize / 5);
                let padding = 3;
                fontSize = Math.max(fontSize, 8);
                ctx.font = fontSize + "px sans-serif";
                let metrics = ctx.measureText(t.name);
                ctx.fillStyle = "black";
                let textBoxX = (xpos + containedSize / 2) - (metrics.width / 2) + margin;
                let textBoxY = ypos + containedSize - fontSize;
                ctx.fillRect(textBoxX - padding, textBoxY - padding - padding,
                    metrics.width + padding + padding, fontSize + padding + padding);
                ctx.fillStyle = "white";
                ctx.fillText(t.name, textBoxX, textBoxY + padding + padding);

                if (t.conditions.length > 0) {
                    let condstr = t.conditions.join("/");
                    condstr = shorten(condstr, 15);
                    fontSize -= 3;
                    ctx.font = fontSize + "px sans-serif";
                    metrics = ctx.measureText(condstr);
                    textBoxX = (xpos + containedSize / 2) - (metrics.width / 2) + margin;
                    textBoxY = ypos + 2;
                    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                    ctx.fillRect(textBoxX - padding, textBoxY - padding - padding,
                        metrics.width + padding + padding, fontSize + padding + padding);
                    ctx.fillStyle = "black";
                    ctx.fillText(condstr, textBoxX, textBoxY + padding);
                }

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
