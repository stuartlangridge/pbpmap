
class BattlefieldEffects extends HTMLElement {
    constructor() {
        super();
        let pbtn = document.createElement("p");
        let effect_templates = document.createElement("select");
        let tope = document.createElement("option");
        tope.text = "💥";
        effect_templates.appendChild(tope);
        let btn = document.createElement("button");
        btn.appendChild(document.createTextNode("+"));
        pbtn.appendChild(effect_templates);
        pbtn.appendChild(btn);
        pbtn.id = "pbfe";
        let bfe = this;

        let effects = [];

        bfe.container = document.createElement("div");
        bfe.container.id = "bfe";
        const styles = document.createElement("style");
        const buttonColour = "#E4644B";
        const buttonText = "white";
        styles.textContent = `
        #pbfe {
            text-align: right;
            margin: 0;
        }
        #bfe form { /* a single BFE */
            display: grid;
            grid-gap: 2px;
            margin-top: 2px;
            margin-bottom: 2px;
            grid-template-columns: repeat(6, 1fr);
            width: 100%;
        }
        #bfe form .heading {
            grid-column: 1 / span 6; grid-row: 1;
            color: ${buttonText};
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
            padding: 2px;
        }
        #bfe form .x { grid-column: 1; grid-row: 5; display: none; } /* hide inputs */
        #bfe form .y { grid-column: 1; grid-row: 5; display: none; } /* hide inputs */
        #bfe form .left { grid-column: 1; grid-row: 2 / span 2; }
        #bfe form .up { grid-column: 2; grid-row: 2; }
        #bfe form .down { grid-column: 2; grid-row: 3; }
        #bfe form .right { grid-column: 3; grid-row: 2 / span 2; }
        #bfe form .colour_label { grid-column: 4; grid-row: 2; }
        #bfe form .opacity_label { grid-column: 5; grid-row: 2; }
        #bfe form .shape_label { grid-column: 4; grid-row: 3; }
        #bfe form .size_label { grid-column: 5; grid-row: 3; }
        #bfe form .remove { grid-column: 6; grid-row: 2 / span 2; }

        #bfe form .coords { background: #333; color: white; padding: 0 4px; margin-left: 4px; }
        #bfe form .colour { display: none; } /* hide so label can summon it */
        #bfe form button, #bfe form input, #bfe form label {
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
        #bfe form span[class$='_inner'] {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            display: block;
            pointer-events: none;
            background: ${buttonColour};
        }
        #bfe form select {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
        }
        #bfe form label[data-inner-value]::after {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            content: attr(data-inner-value);
            pointer-events: none;
            font-size: 12px;
        }
        #bfe form span.colour_inner { background-color: black; }
        /* https://github.com/filamentgroup/select-css */
        #bfe form select {
            display: block;
            font-size: 16px; /* required for ios safari to not zoom */
            font-weight: 700;
            color: #444;
            line-height: 1.3;
            padding: .6em 1.4em .5em .8em;
            width: 100%;
            max-width: 100%; /* useful when width is set to anything other than 100% */
            box-sizing: border-box;
            margin: 0;
            border-width: 0;
            -moz-appearance: none;
            -webkit-appearance: none;
            appearance: none;
            background-color: ${buttonColour};
            background-image: linear-gradient(to bottom, ${buttonColour} 0%,${buttonColour} 100%);
        }
        `;
        bfe.container.appendChild(styles);

        btn.addEventListener("click", async (e) => {
            addEffect();
        }, false);

        const EFFECT_TEMPLATES = {
            "darkness, 15ft radius": {
                colour: "#000000", "size": "15ft", opacity: "█", shape: "◯", x: 1, y: 1
            },
            "fog cloud": {
                colour: "#888888", "size": "20ft", opacity: "▓", shape: "◯", x: 1, y: 1
            },
            "cloudkill": {
                colour: "#88ff00", "size": "20ft", opacity: "▒", shape: "◯", x: 1, y: 1
            }
        }
        Object.keys(EFFECT_TEMPLATES).forEach(etn => {
            let opt = document.createElement("option");
            opt.text = etn;
            effect_templates.appendChild(opt);
        })
        effect_templates.addEventListener("change", e => {
            let ne_name = effect_templates.options[effect_templates.selectedIndex].value;
            let ne = EFFECT_TEMPLATES[ne_name];
            addEffect(ne);
            effect_templates.selectedIndex = 0;
        }, false);

        let iv = setInterval(async () => {
            if (window.addTools) {
                clearInterval(iv);
                [this.toolsElement, this.toolDialogSection] = window.addTools("Battlefield effects", [pbtn, bfe.container], {openByDefault: true});
                document.addEventListener("map-redraw", this.toolsElement.queueRedraw("battlefield-effects", actuallyRedraw), false);
                let load_effects = await this.toolsElement.load("effects");
                if (!Array.isArray(load_effects)) load_effects = [];
                if (load_effects.length > 0) {
                    load_effects.forEach(addEffect);
                    document.dispatchEvent(new Event('request-map-redraw'));
                }
            }
        }, 50);

        function actuallyRedraw(e) {
            let ctx = e.detail.ctx;
            if (effects.length > 0) bfe.renderEffects(ctx, effects, 0.9); // reduced opacity in GM view
        };

        function colourToName(col) {
            let r = parseInt(col.slice(1, 3), 16);
            let g = parseInt(col.slice(3, 5), 16);
            let b = parseInt(col.slice(5, 7), 16);
            if (r == 0 && g == 0 && b == 0) return "black";
            if (r == 255 && g == 255 && b == 255) return "white";
            if (r > g && r > b) return "red";
            if (g > r && g > b) return "green";
            if (b > r && b > g) return "blue";
            return "grey";
        }

        async function coordsToGridRef(x, y) {
            let tlx = await bfe.toolsElement.load("export-tlx"),
                tly = await bfe.toolsElement.load("export-tly"),
                brx = await bfe.toolsElement.load("export-brx"),
                bry = await bfe.toolsElement.load("export-bry"),
                gx1 = await bfe.toolsElement.load("grid-x1"),
                gx2 = await bfe.toolsElement.load("grid-x2"),
                gy = await bfe.toolsElement.load("grid-y");
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

        async function serialise() {
            let out = [];
            Array.prototype.slice.call(bfe.container.querySelectorAll("form")).forEach(async d => {
                let item = {
                    x: d.querySelector(".x").valueAsNumber,
                    y: d.querySelector(".y").valueAsNumber,
                    colour: d.querySelector(".colour").value,
                    opacity: d.querySelector(".opacity").options[d.querySelector(".opacity").selectedIndex].value,
                    shape: d.querySelector(".shape").options[d.querySelector(".shape").selectedIndex].value,
                    size: d.querySelector(".size").options[d.querySelector(".size").selectedIndex].value
                }
                out.push(item);
                // update heading for this item
                d.querySelector(".heading").firstChild.nodeValue = colourToName(item.colour) + 
                    " " + item.size + " " + item.shape;
                d.querySelector(".heading output").value = await coordsToGridRef(item.x, item.y);
            });
            effects = out;
            document.dispatchEvent(new Event('request-map-redraw'));
            bfe.toolsElement.save("effects", out);
        }

        async function addEffect(details) {
            // create elements
            let html = {
                heading: document.createElement("h3"),
                x: document.createElement("input"),
                y: document.createElement("input"),
                left: document.createElement("button"),
                right: document.createElement("button"),
                up: document.createElement("button"),
                down: document.createElement("button"),
                colour: document.createElement("input"),
                colour_label: document.createElement("label"),
                colour_inner: document.createElement("span"),
                opacity: document.createElement("select"),
                opacity_label: document.createElement("label"),
                opacity_inner: document.createElement("span"),
                shape: document.createElement("select"),
                shape_label: document.createElement("label"),
                shape_inner: document.createElement("span"),
                size: document.createElement("select"),
                size_label: document.createElement("label"),
                size_inner: document.createElement("span"),
                remove: document.createElement("button"),
                coords: document.createElement("output")
            }
            let form = document.createElement("form");
            Object.keys(html).forEach(k => {
                html[k].className = k;
                if (html[k + "_label"]) {
                    html[k + "_label"].appendChild(html[k])
                } else if (html[k.replace("_inner", "") + "_label"]) {
                    html[k.replace("_inner", "") + "_label"].appendChild(html[k])
                } else {
                    form.appendChild(html[k]);
                }
            })
            html.colour.type = "color";
            html.colour_label.appendChild(html.colour);
            html.x.type = "number";
            html.y.type = "number";

            // contents
            html.coords.textContent = "K7";
            html.heading.textContent = "a battlefield effect";
            html.heading.appendChild(html.coords);
            html.left.textContent = "←";
            html.right.textContent = "→";
            html.up.textContent = "↑";
            html.down.textContent = "↓";
            "◯□".split("").forEach(o => {
                let op = document.createElement("option"); op.text = o; html.shape.appendChild(op); });
            "█▓▒░".split("").forEach(o => {
                let op = document.createElement("option"); op.text = o; html.opacity.appendChild(op); });
            "0ft,5ft,10ft,15ft,20ft,30ft".split(",").forEach(o => {
                let op = document.createElement("option"); op.text = o; html.size.appendChild(op); });
            html.remove.textContent = "×";

            // handlers
            form.onsubmit = () => { return false; }
            bfe.container.appendChild(form);

            function handleDropdown(e) {
                let val = e.target.options[e.target.selectedIndex].value;
                e.target.parentNode.dataset.innerValue = val;
                serialise();
            }
            html.shape.addEventListener("change", handleDropdown, false);
            html.opacity.addEventListener("change", handleDropdown, false);
            html.size.addEventListener("change", handleDropdown, false);
            html.colour.addEventListener("change", e => {
                e.target.parentNode.querySelector("span").style.backgroundColor = e.target.value;
                serialise();
            }, false);

            html.remove.addEventListener("click", () => {
                form.remove();
                serialise();
            }, false);

            let holdingIV, holdingCount;
            html.up.addEventListener("click", () => { 
                html.y.value = Math.max(html.y.valueAsNumber - 1, 1); serialise();
                clearInterval(holdingIV);
            }, false);
            html.down.addEventListener("click", () => { 
                html.y.value = html.y.valueAsNumber + 1; serialise();
                clearInterval(holdingIV);
            }, false);
            html.left.addEventListener("click", () => { 
                html.x.value = Math.max(html.x.valueAsNumber - 1, 1); serialise();
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

            // data
            function setsel(sel, val) {
                for (let i = 0; i < sel.options.length; i++) {
                    if (sel.options[i].value == val) {
                        sel.selectedIndex = i;
                    }
                }
            }
            if (details) {
                html.x.value = details.x;
                html.y.value = details.y;
                html.colour.value = details.colour;
                html.colour_inner.style.backgroundColor = details.colour;
                setsel(html.opacity, details.opacity);
                setsel(html.shape, details.shape);
                setsel(html.size, details.size);
                effects.push(details);
            } else {
                html.x.value = 1;
                html.y.value = 1;
                setTimeout(async () => {
                    let tlx = await bfe.toolsElement.load("export-tlx"),
                        tly = await bfe.toolsElement.load("export-tly"),
                        gx1 = await bfe.toolsElement.load("grid-x1"),
                        gx2 = await bfe.toolsElement.load("grid-x2"),
                        gy = await bfe.toolsElement.load("grid-y");
                    if (tlx && gx2) {
                        let square = Math.abs(gx2 - gx1);
                        let gridSettingsXOffset = gx1 % square;
                        let gridSettingsYOffset = gy % square;
                        let exportSquaresLeft = (tlx - gridSettingsXOffset) / square;
                        let exportSquaresTop = (tly - gridSettingsYOffset) / square;
                        console.log("setting to", exportSquaresLeft, exportSquaresTop)
                        html.x.value = exportSquaresLeft;
                        html.y.value = exportSquaresTop;
                        serialise();
                    } else {
                        // didn't get values for some reason, so do nothing
                    }
                }, 20);
            }

            // initial values for dropdowns
            handleDropdown({target: html.shape});
            handleDropdown({target: html.opacity});
            handleDropdown({target: html.size});
        }

        this.EFFECTS = {
            CIRCLE: (ctx, mainColour, radiusSquares, opacity, cxp, cyp, squareSize, done) => {
                let rg = ctx.createRadialGradient(cxp + squareSize / 2, cyp + squareSize / 2, 0,
                    cxp + squareSize / 2, cyp + squareSize / 2, squareSize * (radiusSquares + 0.5));
                let opacityHex = ((opacity * 256) - 1).toString(16);
                let colour8digits = mainColour + opacityHex;
                rg.addColorStop(0, colour8digits);
                rg.addColorStop(0.9, colour8digits);
                rg.addColorStop(1.0, "rgba(0,0,0,0)");
                ctx.fillStyle = rg;
                ctx.fillRect(cxp - squareSize * radiusSquares, cyp - squareSize * radiusSquares,
                    squareSize * (radiusSquares * 2 + 1), squareSize * (radiusSquares * 2 + 1));
                done();
            },
            SQUARE: (ctx, mainColour, radiusSquares, opacity, cxp, cyp, squareSize, done) => {
                let opacityHex = ((opacity * 256) - 1).toString(16);
                let colour8digits = mainColour + opacityHex;
                ctx.fillStyle = colour8digits;
                ctx.fillRect(cxp - squareSize * radiusSquares, cyp - squareSize * radiusSquares,
                    squareSize * (radiusSquares * 2 + 1), squareSize * (radiusSquares * 2 + 1));
                done();
            }
        }
    }

    async renderEffects(ctx, effects, overallAlpha, overrideGridSettings, done) {
        let bfe = this;
        let efx = [...effects];
        let gx1 = await this.toolsElement.load("grid-x1"),
            gx2 = await this.toolsElement.load("grid-x2"),
            gy = await this.toolsElement.load("grid-y");
        let gridSettings = {
            size: gx2 - gx1,
            xoffset: gx1 % (gx2 - gx1),
            yoffset: gy % (gx2 - gx1)
        };
        if (overrideGridSettings) gridSettings = overrideGridSettings;

        async function doNext() {
            if (efx.length == 0) {
                if (done) done();
                return;
            }
            let ne = efx.shift();
            let cxp = gridSettings.xoffset + (ne.x * gridSettings.size);
            let cyp = gridSettings.yoffset + (ne.y * gridSettings.size);
            if (overallAlpha) { ctx.globalAlpha = overallAlpha; }
            let fn = {"◯": bfe.EFFECTS.CIRCLE , "□": bfe.EFFECTS.SQUARE}[ne.shape];
            let opacity = {"░": 0.25, "▒": 0.5, "▓": 0.75, "█": 1.0}[ne.opacity];
            let size = {"0ft": 0, "5ft": 1, "10ft": 2, "15ft": 3, "20ft": 4, "30ft": 6}[ne.size];
            fn(ctx, ne.colour, size, opacity, cxp, cyp, gridSettings.size, doNext);
            ctx.globalAlpha = 1.0;
        }
        doNext();
    }

}
window.customElements.define("battlefield-effects", BattlefieldEffects);
