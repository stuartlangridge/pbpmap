
class BattlefieldEffects extends HTMLElement {
    constructor() {
        super();
        let btn = document.createElement("button");
        btn.appendChild(document.createTextNode("+"));
        let bfe = this;

        let effects = []; //[{name: "15ft darkness", x: 8, y: 3}, {name: "15ft darkness", x: 11, y: 13}];

        bfe.container = document.createElement("div");

        btn.addEventListener("click", async (e) => {
            addEffect();
        }, false);

        let iv = setInterval(async () => {
            if (window.addTools) {
                clearInterval(iv);
                this.toolsElement = window.addTools("Battlefield effects", [btn, bfe.container]);
                let load_effects = await this.toolsElement.load("effects");
                if (!Array.isArray(load_effects)) load_effects = [];
                console.log("loaded effects", load_effects);
                if (load_effects.length > 0) {
                    load_effects.forEach(addEffect);
                }
            }
        }, 50);

        document.addEventListener("map-redraw", function(e) {
            let ctx = e.detail.ctx;
            if (effects.length > 0) bfe.renderEffects(ctx, effects, 0.6);
        });

        async function serialise() {
            let out = [];
            Array.prototype.slice.call(bfe.container.querySelectorAll("div")).forEach(d => {
                let details = {};
                let nums = d.querySelectorAll("input[type=number]");
                let sel = d.querySelector("select");
                details.name = sel.options[sel.selectedIndex].value;
                details.x = nums[0].valueAsNumber;
                details.y = nums[1].valueAsNumber;
                if (!isNaN(details.x) && !isNaN(details.y)) {
                    out.push(details);
                }
            })
            effects = out;
            document.dispatchEvent(new Event('request-map-redraw'));
            bfe.toolsElement.save("effects", out);
        }

        async function addEffect(details) {
            let remove = document.createElement("button");
            remove.textContent = "-";
            remove.style.borderWidth = "0";
            let sel = document.createElement("select");
            Object.keys(bfe.EFFECTS).forEach(e => {
                if (e.indexOf(" ") > -1) {
                    let opt = document.createElement("option");
                    opt.text = e;
                    sel.appendChild(opt);
                }
            })
            let x = document.createElement("input");
            x.type = "number";
            x.required = "required";
            let y = document.createElement("input");
            y.type = "number";
            y.required = "required";
            let row = document.createElement("div");
            row.style.display = "grid";
            row.style.gridTemplateColumns = "minmax(0, 1fr) minmax(0, 3fr) minmax(0, 2fr) minmax(0, 2fr)";
            row.appendChild(remove);
            row.appendChild(sel);
            row.appendChild(x);
            row.appendChild(y);
            // if details is filled in, populate, otherwise a blank row
            if (details) {
                x.value = details.x;
                y.value = details.y;
                for (let i = 0; i < sel.options.length; i++) {
                    if (sel.options[i].value == details.name) {
                        sel.selectedIndex = i;
                    }
                }
                effects.push(details);
            }
            bfe.container.appendChild(row);

            sel.addEventListener("change", serialise, false);
            x.addEventListener("input", serialise, false);
            y.addEventListener("input", serialise, false);
            remove.addEventListener("click", () => {
                row.remove();
                serialise();
            }, false);
        }

        this.EFFECTS = {
            "15ft darkness": (ctx, cxp, cyp, squareSize, done) => {
                this.EFFECTS.CIRCLE("black", 3, ctx, cxp, cyp, squareSize, done)
            },
            "20ft red fog": (ctx, cxp, cyp, squareSize, done) => {
                this.EFFECTS.CIRCLE("rgba(255, 0, 0, 0.5)", 4, ctx, cxp, cyp, squareSize, done)
            },
            CIRCLE: (mainColour, radiusSquares, ctx, cxp, cyp, squareSize, done) => {
                let rg = ctx.createRadialGradient(cxp + squareSize / 2, cyp + squareSize / 2, 0,
                    cxp + squareSize / 2, cyp + squareSize / 2, squareSize * (radiusSquares + 0.5));
                rg.addColorStop(0, mainColour);
                rg.addColorStop(0.9, mainColour);
                rg.addColorStop(1.0, "rgba(0,0,0,0)");
                ctx.fillStyle = rg;
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
            bfe.EFFECTS[ne.name](ctx, cxp, cyp, gridSettings.size, doNext);
            ctx.globalAlpha = 1.0;
        }
        doNext();
    }

}
window.customElements.define("battlefield-effects", BattlefieldEffects);
