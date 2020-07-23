
class ExportArea extends HTMLElement {
    constructor() {
        super();

        let ea = this;
        this.editing = false;

        let shadow = this.attachShadow({mode: 'open'});
        let cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = "set-export-area";
        let lbl = document.createElement("label");
        lbl.htmlFor = "set-export-area";
        lbl.dataset.for = "checkbox";
        lbl.textContent = "Set export area";
        let pair = document.createElement("div");
        shadow.appendChild(pair);
        pair.appendChild(cb);
        pair.appendChild(lbl);
        ea.canvas = null;
        ea.ctx = null;

        cb.addEventListener("change", async (e) => {
            ea.editing = cb.checked;
            if (cb.checked) {
                ea.canvas.addEventListener('mousedown', md, false);
                await calculateTlbr();
            } else {
                ea.canvas.removeEventListener('mousedown', md, false);
            }
            document.dispatchEvent(new Event('request-map-redraw'));
        }, false);

        let iv = setInterval(() => {
            if (window.addTools) {
                clearInterval(iv);
                this.toolsElement = window.addTools("Export area", [pair]); 
            }
        }, 50);

        let tlbr = [null, null];
        document.addEventListener("map-redraw", async function(e) {
            let ctx = e.detail.ctx;
            ea.canvas = ctx.canvas;
            ea.ctx = ctx;
            if (ea.editing) {
                // draw the box while editing it
                if (tlbr[0]) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                    ctx.fillRect(tlbr[0].x + gridSettings.xoffset, tlbr[0].y + gridSettings.yoffset, tlbr[1].x - tlbr[0].x, tlbr[1].y - tlbr[0].y);
                }
            } else {
                // drop the box corners to show where the export area is
                if (!tlbr[0]) {
                    await calculateTlbr();
                }
                ctx.strokeStyle = "rgba(255, 255, 255, 1.0)";
                ctx.lineWidth = 2;
                ctx.strokeRect(tlbr[0].x + gridSettings.xoffset, tlbr[0].y + gridSettings.yoffset, tlbr[1].x - tlbr[0].x, tlbr[1].y - tlbr[0].y);
                ctx.strokeStyle = "rgba(0, 255, 0, 0.7)";
                ctx.lineWidth = 1;
                ctx.strokeRect(tlbr[0].x + gridSettings.xoffset, tlbr[0].y + gridSettings.yoffset, tlbr[1].x - tlbr[0].x, tlbr[1].y - tlbr[0].y);
            }
        });

        function squaresFromPoints(p1, p2) {
            // work out the squares that this is in, and then return the tl and br of the rectangle
            var tlx = Math.min(p1.x, p2.x),
                tly = Math.min(p1.y, p2.y),
                brx = Math.max(p1.x, p2.x),
                bry = Math.max(p1.y, p2.y);
            var tlxs = Math.floor((tlx - gridSettings.xoffset) / gridSettings.size) * gridSettings.size,
                tlys = Math.floor((tly - gridSettings.yoffset) / gridSettings.size) * gridSettings.size,
                brxs = (Math.floor((brx - gridSettings.xoffset) / gridSettings.size) + 1) * gridSettings.size,
                brys = (Math.floor((bry - gridSettings.yoffset) / gridSettings.size) + 1) * gridSettings.size;
            return [{x:tlxs, y:tlys}, {x:brxs, y:brys}];
        }

        let startDrag, gridSettings = {xoffset:0, yoffset:0};
        function mm(e) {
            let x = e.offsetX || (e.pageX - ea.canvas.offsetLeft);
            let y = e.offsetY || (e.pageY - ea.canvas.offsetTop);
            let pt = ea.ctx.transformedPoint(x, y);
            tlbr = squaresFromPoints(startDrag, pt);
            document.dispatchEvent(new Event('request-map-redraw'));
        }
        async function mu(e) {
            ea.canvas.removeEventListener('mousemove', mm, false);
            ea.canvas.removeEventListener('mouseup', mu, false);
            let x = e.offsetX || (e.pageX - ea.canvas.offsetLeft);
            let y = e.offsetY || (e.pageY - ea.canvas.offsetTop);
            let pt = ea.ctx.transformedPoint(x, y);
            tlbr = squaresFromPoints(startDrag, pt);
            document.dispatchEvent(new Event('request-map-redraw'));
            await ea.toolsElement.save("export-tlx", tlbr[0].x + gridSettings.xoffset);
            await ea.toolsElement.save("export-tly", tlbr[0].y + gridSettings.yoffset);
            await ea.toolsElement.save("export-brx", tlbr[1].x + gridSettings.xoffset);
            await ea.toolsElement.save("export-bry", tlbr[1].y + gridSettings.yoffset);
        }
        async function md(e) {
            ea.canvas.addEventListener('mousemove', mm, false);
            ea.canvas.addEventListener('mouseup', mu, false);
            let x = e.offsetX || (e.pageX - ea.canvas.offsetLeft);
            let y = e.offsetY || (e.pageY - ea.canvas.offsetTop);
            let pt = ea.ctx.transformedPoint(x, y);
            startDrag = pt;
            let gx1 = await ea.toolsElement.load("grid-x1"),
                gx2 = await ea.toolsElement.load("grid-x2"),
                gy = await ea.toolsElement.load("grid-y");
            gridSettings = {
                size: Math.abs(gx2 - gx1)
            };
            gridSettings.xoffset = gx1 % gridSettings.size;
            gridSettings.yoffset = gy % gridSettings.size;
            tlbr = squaresFromPoints(pt, pt);
            document.dispatchEvent(new Event('request-map-redraw'));
        }
        async function calculateTlbr() {
            let tlx = await ea.toolsElement.load("export-tlx");
            let tly = await ea.toolsElement.load("export-tly");
            let brx = await ea.toolsElement.load("export-brx");
            let bry = await ea.toolsElement.load("export-bry");
            tlbr = [null, null];
            if (tlx !== undefined) {
                tlbr = [{x:tlx, y:tly}, {x:brx, y:bry}];
            }
        }
    }
}
window.customElements.define("export-area", ExportArea);
