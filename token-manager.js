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
        tools.id = "tm";
        let p = document.createElement("div");
        tools.appendChild(p);
        let add_button = document.createElement("button");
        add_button.textContent = "+";
        add_button.style.float = "right";
        p.appendChild(add_button);
        p.style.overflow = "auto";
        add_button.addEventListener("click", addToken, false);
        let copy_button = document.createElement("select");
        let copy_button_root = document.createElement("option");
        copy_button_root.text = "⎘";
        copy_button.appendChild(copy_button_root);
        copy_button.setAttribute("title", "Copy participants from another map");
        copy_button.style.float = "right";
        copy_button.style.overflow = "hidden";
        copy_button.style.width = "50px";
        copy_button.style.whiteSpace = "nowrap";
        copy_button.style.textOverflow = "ellipsis";
        p.appendChild(copy_button);
        copy_button.addEventListener("change", copyParticipants, false);

        const styles = document.createElement("style");
        const buttonColour = "#E4644B";
        const buttonText = "white";
        styles.textContent = `
        #tm details .container { /* a single character */
            display: grid;
            grid-gap: 2px;
            margin-top: 2px;
            margin-bottom: 2px;
            grid-template-columns: min-content min-content min-content 3fr min-content;
            width: 100%;
        }
        #tm details .heading {
            color: ${buttonText};
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
            padding: 2px;
        }
        #tm details > summary {
            list-style: none;
        }
        #tm details > summary::-webkit-details-marker {
            display: none;
        }
        #tm details > summary > .heading::after {
            content: "»";
            display: block;
            float: right;
            transition: transform 100ms ease-out;
        }
        #tm details[open] > summary > .heading::after {
            transform: rotate(90deg);
        }


        #tm details .coords { background: #333; color: white; padding: 0 4px; margin-left: 4px; }

        #tm details .container .x { grid-column: 1; grid-row: 5; display: none; } /* hide inputs */
        #tm details .container .y { grid-column: 1; grid-row: 5; display: none; } /* hide inputs */
        #tm details .container .image { grid-column: 1; grid-row: 5; display: none; } /* hide inputs */
        #tm details .container .name { grid-column: 1; grid-row: 5; display: none; } /* hide inputs */
        #tm details .container .left { grid-column: 1; grid-row: 1 / span 2; }
        #tm details .container .up { grid-column: 2; grid-row: 1; }
        #tm details .container .down { grid-column: 2; grid-row: 2; }
        #tm details .container .right { grid-column: 3; grid-row: 1 / span 2; }
        #tm details .container .name_summon_container { grid-column: 4; grid-row: 1; }
        #tm details .container .image_summon { grid-column: 4; grid-row: 2; }
        #tm details .container .remove { grid-column: 5; grid-row: 1 / span 2; }
        #tm details .container .image { grid-column: 1; grid-row: 5; display: none; } /* hide inputs */
        #tm details .container .name { grid-column: 1; grid-row: 5; display: none; } /* hide inputs */

        #tm details .container .name_summon_container, #tm details .container .image_summon_container {
            display: flex;
        }
        #tm details .container .name_summon_container .name_summon,
        #tm details .container .image_summon_container .image_summon {
            flex: 1 0;
        }
        #tm details .container .name_summon_container .visible_label,
        #tm details .container .name_summon_container .tint,
        #tm details .container .image_summon_container .clone,
        #tm details .container .image_summon_container .conds_summon {
            flex: 0 1;
            padding: 0 3px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-left: 2px;
            min-width: 22px;
        }
        #tm details .container .name_summon_container .tint { /* try to remove default styling */
            -webkit-appearance: none;
            appearance: none;
            border: 0;
            padding: 0;
        }

        #tm details .container .image_summon_container .conds { display: none; } /* hide input */
        #tm details .container .name_summon_container .visible_label {
            background: transparent;
            opacity: 0.6;
        }
        #tm details .container .name_summon_container .visible:checked + .visible_label {
            background: #E4644B;
            opacity: 1;
        }
        #tm details .container .name_summon_container .visible { display: none }

        #tm details button {
            padding: 0.2em 0.5em;
            border-width: 0;
            background: ${buttonColour};
            color: ${buttonText};
            min-width: 30px;
            min-height: 30px;
            position: relative;
            overflow: hidden;
            box-shadow: none;
        }

        #tm details .container .name_summon {
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 10px;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            text-align: left;
        }
        #tm details .container .image_summon {
            background-size: cover;
            background-position: center 30%;
            font-size: 10px;
        }


        `;
        tools.appendChild(styles);


        let datalist = document.createElement("datalist");
        datalist.setAttribute("id", "imgur-tokens-datalist");
        function populateTokenDatalist() {
            //console.log("tokens list is", window.loadedImgurTokenList);
            window.loadedImgurTokenList.data.forEach(function(img) {
                let opt = document.createElement("option");
                opt.text = img.title;
                opt.value = img.link;
                datalist.appendChild(opt);
            })
        }
        p.appendChild(datalist);
        if (!window.loadedImgurTokenList) {
            window.loadImgurTokenList = function(tokens) {
                window.loadedImgurTokenList = tokens;
                populateTokenDatalist();
            }
            let scr = document.createElement("script");
            scr.src = "https://api.imgur.com/3/album/0hFdv/images?callback=loadImgurTokenList&client_id=a7c79752a12bbaa";
            document.body.appendChild(scr);
        } else {
            populateTokenDatalist();
        }

        let tm = this;

        async function populateCopyButton(copy_button) {
            let maps = await tm.toolsElement.getMaps();
            maps.forEach(m => {
                if (!m.tokens) return;
                let opt = document.createElement("option");
                opt.text = m.name;
                opt.value = m.id;
                opt.title = m.name + "\n(" + m.tokens.map(t => t.name).join(", ") + ")";
                opt.style.overflow = "hidden";
                opt.style.textOverflow = "ellipsis";
                opt.style.width = "100px";
                copy_button.appendChild(opt);
            })
        }
        async function copyParticipants(e) {
            let mid = this.options[this.selectedIndex].value;
            this.selectedIndex = 0;
            let maps = await tm.toolsElement.getMaps();
            let selmap = maps.filter(m => { return m.id == mid; })
            if (selmap.length != 1) { console.log("Unexpectedly got", selmap.length, "maps; bailing"); return; }
            if (!selmap[0].tokens) return;
            selmap[0].tokens.forEach(t => { addToken(t); });
        }

        function serialiseSingleToken(t) {
            if (!t.image.validity.valid) return null;
            let ret = {
                url: t.image.value,
                name: t.name.value,
                x: t.x.valueAsNumber,
                y: t.y.valueAsNumber,
                visible: t.visible.checked,
                conditions: t.conds.value.split(",").filter(s => s.length > 0),
                tint: t.tint.value
            }
            return ret;
        }

        function updateHeadings() {
            tokens.forEach(async t => {
                // update headings for this item
                t.heading.firstChild.nodeValue = t.name.value != "" ? t.name.value : "New creature";
                t.coords.textContent = await coordsToGridRef(t.x.valueAsNumber, t.y.valueAsNumber);
            })
        }

        function serialise() {
            let data = tokens.map(serialiseSingleToken).filter(function(t) { return t; })
            if (data.length) {
                tm.toolsElement.save("tokens", data);
            }
            document.dispatchEvent(new Event('request-map-redraw'));
            updateHeadings();
        }

        async function coordsToGridRef(x, y) {
            let tlx = await tm.toolsElement.load("export-tlx"),
                tly = await tm.toolsElement.load("export-tly"),
                brx = await tm.toolsElement.load("export-brx"),
                bry = await tm.toolsElement.load("export-bry"),
                gx1 = await tm.toolsElement.load("grid-x1"),
                gx2 = await tm.toolsElement.load("grid-x2"),
                gy = await tm.toolsElement.load("grid-y");
            let square = Math.abs(gx2 - gx1);
            let gridSettingsXOffset = gx1 % square;
            let gridSettingsYOffset = gy % square;
            let widthOfReal = brx - tlx;
            let heightOfReal = bry - tly;
            let exportSquaresLeft = (tlx- gridSettingsXOffset) / square;
            let exportSquaresTop = (tly - gridSettingsYOffset) / square;
            let exportSquaresWidth = widthOfReal / square;
            let exportSquaresHeight = heightOfReal / square;
            let coordx = x - exportSquaresLeft + 1;
            let coordy = y - exportSquaresTop + 1;
            let coordtext = String.fromCharCode(64 + coordx) + coordy;
            if (coordx < 1) {
                coordtext = "←";
            } else if (coordy < 1) {
                coordtext = "↑"
            } else if (coordx > exportSquaresWidth) {
                coordtext = "→";
            } else if (coordy > exportSquaresHeight) {
                coordtext = "↓";
            }
            return coordtext;
        }

        function addToken(values) {
            // create elements
            let html = {
                key: Math.random(),
                heading: document.createElement("h3"),
                x: document.createElement("input"),
                y: document.createElement("input"),
                left: document.createElement("button"),
                right: document.createElement("button"),
                up: document.createElement("button"),
                down: document.createElement("button"),
                image: document.createElement("input"),
                name: document.createElement("input"),
                image_summon: document.createElement("button"),
                image_summon_container: document.createElement("div"),
                name_summon: document.createElement("button"),
                name_summon_container: document.createElement("div"),
                remove: document.createElement("button"),
                coords: document.createElement("output"),
                visible: document.createElement("input"),
                visible_label: document.createElement("label"),
                clone: document.createElement("button"),
                conds_summon: document.createElement("button"),
                conds: document.createElement("input"),
                tint: document.createElement("input"),
            }
            let details =  document.createElement("details");
            let summary = document.createElement("summary");
            let details_container =  document.createElement("div");
            details_container.className = "container";
            details.appendChild(summary);
            details.appendChild(details_container);
            Object.keys(html).forEach(k => {
                if (k == "key") return;
                html[k].className = k;
                details_container.appendChild(html[k]);
            })
            html.name_summon_container.appendChild(html.name_summon);
            html.name_summon_container.appendChild(html.visible);
            html.name_summon_container.appendChild(html.visible_label);
            html.name_summon_container.appendChild(html.tint);
            html.image_summon_container.appendChild(html.image_summon);
            html.image_summon_container.appendChild(html.clone);
            html.image_summon_container.appendChild(html.conds);
            html.image_summon_container.appendChild(html.conds_summon);
            summary.appendChild(html.heading);
            html.visible.type = "checkbox";
            html.visible.id = "v" + (Math.floor(Math.random() * 10000));
            html.visible_label.htmlFor = html.visible.id;
            html.x.type = "number";
            html.y.type = "number";
            html.image.type = "url";
            html.tint.type = "color";

            // contents
            html.coords.textContent = "K7";
            html.heading.textContent = "New creature";
            html.heading.appendChild(html.coords);
            html.left.textContent = "←";
            html.right.textContent = "→";
            html.up.textContent = "↑";
            html.down.textContent = "↓";
            html.remove.textContent = "×";
            html.visible_label.textContent = "👻";
            html.visible_label.title = "Hide from exported image";
            html.clone.textContent = "⧉";
            html.clone.title = "Duplicate";
            html.conds_summon.textContent = "🤢";
            html.conds_summon.title = "Conditions";
            html.tint.title = "Tint";

            // handlers
            html.remove.addEventListener("click", () => {
                details.remove();
                tokens = tokens.filter(s => { return s.key != html.key; })
                serialise();
            }, false);

            let holdingIV, holdingCount;
            html.up.addEventListener("click", () => { 
                html.y.value = Math.max(html.y.valueAsNumber - 1, 0); serialise();
                clearInterval(holdingIV);
            }, false);
            html.down.addEventListener("click", () => { 
                html.y.value = html.y.valueAsNumber + 1; serialise();
                clearInterval(holdingIV);
            }, false);
            html.left.addEventListener("click", () => { 
                html.x.value = Math.max(html.x.valueAsNumber - 1, 0); serialise();
                clearInterval(holdingIV);
            }, false);
            html.right.addEventListener("click", () => { 
                html.x.value = html.x.valueAsNumber + 1; serialise();
                clearInterval(holdingIV);
            }, false);
            // hold the mouse down to move fast
            function hold(button, changeElement, amount) {
                holdingCount = 0;
                holdingIV = setInterval(() => {
                    holdingCount += 1;
                    if (holdingCount < 70 && holdingCount % 10 != 0) return;
                    if (holdingCount < 140 && holdingCount % 5 != 0) return;
                    let nv = changeElement.valueAsNumber + amount;
                    if (nv < 1) nv = 1;
                    changeElement.value = nv;
                    serialise();
                }, 20);
            }
            html.up.addEventListener("mousedown", () => { hold(html.up, html.y, -1); }, false);
            html.up.addEventListener("mouseup", () => { clearInterval(holdingIV); }, false);
            html.down.addEventListener("mousedown", () => { hold(html.down, html.y, 1); }, false);
            html.down.addEventListener("mouseup", () => { clearInterval(holdingIV); }, false);
            html.left.addEventListener("mousedown", () => { hold(html.left, html.x, -1); }, false);
            html.left.addEventListener("mouseup", () => { clearInterval(holdingIV); }, false);
            html.right.addEventListener("mousedown", () => { hold(html.right, html.x, 1); }, false);
            html.right.addEventListener("mouseup", () => { clearInterval(holdingIV); }, false);

            html.visible.addEventListener("change", () => { serialise(); }, false);
            html.tint.addEventListener("change", () => { serialise(); }, false);
            html.clone.addEventListener("click", () => {
                let mydetails = serialiseSingleToken(html);
                let allNames = tokens.map(serialiseSingleToken).map(t => t.name);
                mydetails.x += 1;
                let numend = mydetails.name.match(/ ([0-9]+)$/);
                let loops = 1;
                let inc = 1;
                let chosenName;
                while (true) {
                    loops += 1;
                    if (loops > 30) { console.log("too many loops"); break; }
                    let num;
                    if (numend) {
                        num = parseInt(numend[1], 10) + inc;
                        chosenName = mydetails.name.replace(/ ([0-9]+)$/, " " + num);
                    } else {
                        chosenName = mydetails.name + " " + (inc + 1);
                    }
                    if (allNames.includes(chosenName)) {
                        inc += 1
                    } else {
                        mydetails.name = chosenName;
                        break
                    }
                }
                addToken(mydetails);
                serialise();
            }, false);
            html.conds_summon.addEventListener("click", () => {
                let ncond = prompt("Add or remove a condition by name");
                if (ncond != "") {
                    let curconds = html.conds.value.split(",");
                    if (curconds.includes(ncond)) {
                        curconds = curconds.filter(s => s != ncond)
                    } else {
                        curconds.push(ncond)
                    }
                    html.conds.value = curconds.join(",");
                    serialise();
                }
            }, false);

            html.image_summon.addEventListener("click", () => {
                html.image.value = prompt("URL address of token image", html.image.value);
                if (html.image.value == "") {
                    html.image_summon.style.backgroundImage = "none";
                    html.image_summon.textContent = "token image";
                } else {
                    html.image_summon.style.backgroundImage = "url(" + html.image.value + ")";
                    html.image_summon.textContent = "";
                }
                serialise();
            }, false);
            html.name_summon.addEventListener("click", () => {
                html.name.value = prompt("Participant name", html.name.value);
                if (html.name.value == "") {
                    html.name_summon.textContent = "New creature";
                } else {
                    html.name_summon.textContent = html.name.value;
                }
                serialise();
            }, false);

            if (values && values.url) {
                html.image.value = values.url;
                html.name.value = values.name;
                html.heading.firstChild.nodeValue = values.name;
                html.x.value = values.x;
                html.y.value = values.y;
                html.name_summon.textContent = values.name;
                html.image_summon.style.backgroundImage = "url(" + values.url + ")";
                html.image_summon.textContent = "";
                html.visible.checked = values.visible === undefined ? true : values.visible;
                html.conds.value = values.conditions;
                html.tint.value = values.tint || "#ffffff";
            } else {
                html.x.value = 1;
                html.y.value = 1;
                html.name_summon.textContent = "New creature";
                html.image_summon.style.backgroundImage = "none";
                html.image_summon.textContent = "token image";
                html.visible.checked = true;
                html.tint.value = "#ffffff";
            }
            tokens.push(html);
            tools.appendChild(details);
        }

        let masterRidx = 1;

        let tokens = [];

        let iv = setInterval(async () => {
            if (window.addTools) {
                clearInterval(iv);
                [this.toolsElement, this.toolDialogSection] = window.addTools("Participants", [tools], {open:true});
                let load_tokens = await this.toolsElement.load("tokens");
                if (!Array.isArray(load_tokens)) load_tokens = [];
                if (load_tokens.length == 0) {
                    addToken();
                } else {
                    load_tokens.forEach(addToken);
                }
                populateCopyButton(copy_button);
                document.addEventListener("map-redraw", this.toolsElement.queueRedraw("token-manager", actuallyRedraw), false);
                updateHeadings();
            }
        }, 50);

        function actuallyRedraw(e) {
            let ctx = e.detail.ctx;
            if (tokens.length == 0) return;
            //console.log(tokens);
            tm.renderTokens(ctx, tokens.map(serialiseSingleToken).filter(function(t) { return t; }));
        };
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
            if (gridSettings.exportingImage && !t.visible) {
                if (done) done();
                return;
            }
            function loadit(img) {
                //console.log(t);
                if (!t.visible) ctx.globalAlpha = 0.5;
                let margin = 0;
                let xpos = gridSettings.xoffset + (t.x * gridSettings.size) + margin;
                let ypos = gridSettings.yoffset + (t.y * gridSettings.size) + margin;
                let grab = {size: Math.min(img.naturalWidth, img.naturalHeight)};
                grab.x = Math.floor(img.naturalWidth / 2 - grab.size / 2);
                grab.y = Math.floor(img.naturalHeight / 2 - grab.size / 2);

                let containedSize = gridSettings.size - margin - margin;
                if (t.name.indexOf("(large)") > -1) {
                    containedSize = containedSize * 2;
                    ctx.globalAlpha = 0.4;
                }
                let isIcon = false;
                if (t.name.indexOf("(icon)") > -1) {
                    isIcon = true;
                }

                ctx.beginPath();
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
                ctx.shadowColor = "black";
                ctx.arc(xpos + (containedSize / 2) + margin, ypos + (containedSize / 2) + margin, containedSize / 2, 0, Math.PI * 2, true);
                ctx.fillStyle = "black";
                if (!isIcon) ctx.fill();

                ctx.beginPath();
                ctx.save();
                ctx.beginPath();
                ctx.arc(xpos + (containedSize / 2) + margin, ypos + (containedSize / 2) + margin, containedSize / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(img, grab.x, grab.y, grab.size, grab.size, xpos, ypos, containedSize, containedSize);
                if (!t.tint || t.tint.toLowerCase() == "#ffffff") {
                    // we don't actually tint with white: this means don't tint at all
                } else {
                    // tint image
                    const gradient = ctx.createLinearGradient(xpos, ypos, 
                        xpos + containedSize + margin, ypos + containedSize + margin);
                    gradient.addColorStop(0, t.tint + "00");
                    gradient.addColorStop(1, t.tint + "bb");
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(xpos + (containedSize / 2) + margin, ypos + (containedSize / 2) + margin, containedSize / 2, 0, Math.PI * 2, true);
                    ctx.fill()
                    ctx.closePath();
                }
                ctx.arc(xpos + (containedSize / 2) + margin, ypos + (containedSize / 2) + margin, containedSize / 2, 0, Math.PI * 2, true);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                ctx.lineWidth = 4;
                if (!isIcon) ctx.stroke();
                ctx.restore();

                ctx.globalAlpha = 1;
                if (t.conditions.length > 0) {
                    ctx.save();
                    let condstr = t.conditions.join("/");
                    condstr = shorten(condstr, 30);
                    ctx.font = "6px monospace";
                    let fontHeight = ctx.measureText("M").width + 3; // bodge, but ok
                    let cx = xpos + (containedSize / 2) + margin;
                    let cy = ypos + (containedSize / 2) + margin;

                    // draw inner ring for conditions
                    ctx.lineWidth = fontHeight;
                    let r = (containedSize / 2) - (ctx.lineWidth * 0.75);
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
                    ctx.stroke();
                    ctx.closePath();

                    // write conditions on top of ring, letter by letter
                    ctx.fillStyle = "black";
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
                    let totalang = 0;
                    for (let i=0; i<condstr.length; i++) {
                        let ch = condstr.charAt(i);
                        let upto = condstr.substr(0, i);
                        let incl = condstr.substr(0, i + 1);
                        let upto_w = ctx.measureText(upto).width;
                        let incl_w = ctx.measureText(incl).width;
                        let dw = incl_w - upto_w;
                        dw = ctx.measureText(ch).width;
                        // calculate angle that would be dw wide at radius distance
                        let ang = Math.atan(dw / r);
                        if (i === 0) {
                          // try to "centre" the rotated text around 12'o'clock
                          // assume that the total length of text in angle is
                          // text length * this angle, and subtract half that
                          totalang = -(ang * condstr.length) / 2;
                        }
                        ctx.save();
                        ctx.translate(cx, cy);
                        ctx.rotate(totalang);
                        ctx.fillText(ch, -dw/2, -r + (ctx.lineWidth * 0.5) - 1);
                        ctx.restore();
                        totalang += ang;
                    }
                    ctx.save();
                }

                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
                let fontSize = Math.floor(containedSize / 5);
                if (t.name.indexOf("(large)") > -1) { fontSize = Math.floor(fontSize / 2); }
                let padding = 3;
                let nameToWrite = t.name.replace(/ \(large\)/, "");
                fontSize = Math.max(fontSize, 8);
                ctx.font = "bold " + fontSize + "px sans-serif";
                let metrics = ctx.measureText(nameToWrite);
                if (metrics.width > containedSize) {
                    // text is too wide, so feed it to shorten to make it shorter
                    const ratioTooBig = metrics.width / containedSize;
                    const charactersToAimFor = Math.ceil(nameToWrite.length / ratioTooBig);
                    nameToWrite = shorten(nameToWrite, charactersToAimFor);
                    metrics = ctx.measureText(nameToWrite);
                }
                ctx.fillStyle = "black";
                let textBoxX = (xpos + containedSize / 2) - (metrics.width / 2) + margin;
                let textBoxY = ypos + containedSize - fontSize;
                //ctx.fillRect(textBoxX - padding, textBoxY - padding - padding,
                //    metrics.width + padding + padding, fontSize + padding + padding);
                /*
                ctx.shadowColor = "white";
                ctx.shadowOffsetX = 10;
                ctx.shadowOffsetY = 10;
                ctx.shadowBlur = 0;
                */
                ctx.fillStyle = "black";
                ctx.strokeStyle = "white";
                ctx.lineWidth = 4;
                if (!isIcon) ctx.strokeText(nameToWrite, textBoxX, textBoxY + padding + padding);
                if (!isIcon) ctx.fillText(nameToWrite, textBoxX, textBoxY + padding + padding);

                if (!t.visible) ctx.globalAlpha = 1.0;

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
