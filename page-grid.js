
class PageGrid extends HTMLElement {
    constructor() {
        super();
        this.editing = false;
        let pg = this;

        let shadow = this.attachShadow({mode: 'open'});
        let cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = "cb";
        let lbl = document.createElement("label");
        lbl.htmlFor = "cb";
        lbl.dataset.for = "checkbox";
        lbl.textContent = "Edit grid";

        let cb_show = document.createElement("input");
        cb_show.type = "checkbox";
        cb_show.id = "cb_show";
        let lbl_show = document.createElement("label");
        lbl_show.htmlFor = "cb_show";
        lbl_show.dataset.for = "checkbox";
        lbl_show.textContent = "Show grid in export";

        let pair = document.createElement("div");
        shadow.appendChild(pair);
        pair.appendChild(cb);
        pair.appendChild(lbl);
        pair.appendChild(cb_show);
        pair.appendChild(lbl_show);

        async function kp(e) {
            if ([37,38,39,40].indexOf(e.which) == -1) return;
            let x1 = await pg.toolsElement.load("grid-x1") || 100;
            let x2 = await pg.toolsElement.load("grid-x2") || 180;
            let y = await pg.toolsElement.load("grid-y") || 120;
            let step = 1;
            if (e.shiftKey) step *= 10;
            if (e.ctrlKey) step *= 10;
            if (gridStartRadio.checked) {
                if (e.which == 37) { x1 -= step; x2 -= step }
                else if (e.which == 38) { y -= step }
                else if (e.which == 39) { x1 += step; x2 += step }
                else if (e.which == 40) { y += step }
            } else {
                if (e.which == 37) { x2 -= step }
                else if (e.which == 38) { x2 += step }
                else if (e.which == 39) { x2 += step }
                else if (e.which == 40) { x2 -= step }
            }
            await pg.toolsElement.save("grid-x1", x1);
            await pg.toolsElement.save("grid-x2", x2);
            await pg.toolsElement.save("grid-y", y);
            document.dispatchEvent(new Event('request-map-redraw'));
        }

        cb.addEventListener("change", (e) => {
            pg.editing = cb.checked;
            if (cb.checked) {
                gridStart.style.display = "block";
                gridWidth.style.display = "block";
                document.addEventListener("keydown", kp, false);
            } else {
                gridStart.style.display = "none";
                gridWidth.style.display = "none";
                document.removeEventListener("keydown", kp, false);
            }
            document.dispatchEvent(new Event('request-map-redraw'));
        }, false);

        cb_show.addEventListener("change", async (e) => {
            await pg.toolsElement.save("grid-show-on-export", cb_show.checked);
        }, false);

        let gridStartLabel = document.createElement("label");
        gridStartLabel.textContent = "Set grid start";
        let gridStartRadio = document.createElement("input");
        gridStartRadio.type = "radio";
        gridStartRadio.name = "grid";
        gridStartRadio.id = "grid-start";
        gridStartLabel.htmlFor = "grid-start";
        let gridStart = document.createElement("div");
        let instructions = document.createElement("div");
        instructions.textContent = "(use arrow keys)";
        gridStart.appendChild(instructions);
        gridStart.appendChild(gridStartRadio);
        gridStartRadio.checked = true;
        gridStart.appendChild(gridStartLabel);
        gridStart.style.display = "none";
        gridStartRadio.onfocus = function() { gridStartRadio.blur(); }

        let gridWidthLabel = document.createElement("label");
        gridWidthLabel.textContent = "Set grid width";
        let gridWidthRadio = document.createElement("input");
        gridWidthRadio.type = "radio";
        gridWidthRadio.name = "grid";
        gridWidthRadio.id = "grid-width";
        gridWidthLabel.htmlFor = "grid-width";
        let gridWidth = document.createElement("div");
        gridWidth.appendChild(gridWidthRadio);
        gridWidth.appendChild(gridWidthLabel);
        gridWidth.style.display = "none";
        gridWidthRadio.onfocus = function() { gridWidthRadio.blur(); }

        let iv = setInterval(async () => {
            if (window.addTools) {
                clearInterval(iv);
                [this.toolsElement, this.toolDialogSection] = window.addTools("Map grid", [pair, gridStart, gridWidth]); 
                let showgrid = await this.toolsElement.load("grid-show-on-export")
                cb_show.checked = !!showgrid;
            } else {
                console.log("waiting in page grid");
            }
        }, 50);

        document.addEventListener("map-redraw", async function(e) {
            if (!pg.editing) return;
            let ctx = e.detail.ctx;
            let x1 = await pg.toolsElement.load("grid-x1") || 100;
            let x2 = await pg.toolsElement.load("grid-x2") || 180;
            let y = await pg.toolsElement.load("grid-y") || 120;
            let diff = Math.abs(x2 - x1);
            ctx.fillStyle = "#f06";
            ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
            ctx.shadowBlur = 1;
            ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
            ctx.fillRect(x1, 0, 1, ctx.canvas.height);
            ctx.fillRect(x2, 0, 1, ctx.canvas.height);
            ctx.fillRect(0, y, ctx.canvas.width, 1);
            ctx.fillRect(0, y + diff, ctx.canvas.width, 1);
            ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
            for (var xd=x1-diff; xd >= 0; xd-=diff) {
                ctx.fillRect(xd, 0, 1, ctx.canvas.height);
            }
            for (xd=x1+diff+diff; xd <= ctx.canvas.width; xd+=diff) {
                ctx.fillRect(xd, 0, 1, ctx.canvas.height);
            }
            for (var yd=y-diff; yd >= 0; yd-=diff) {
                ctx.fillRect(0, yd, ctx.canvas.width, 1);
            }
            for (yd=y+diff+diff; yd <= ctx.canvas.height; yd+=diff) {
                ctx.fillRect(0, yd, ctx.canvas.width, 1);
            }
          })
    }
}
window.customElements.define("page-grid", PageGrid);
