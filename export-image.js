
class ExportImage extends HTMLElement {
    constructor() {
        super();
        let shadow = this.attachShadow({mode: 'open'});
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        let btn = document.createElement("button");
        btn.appendChild(document.createTextNode("Export to image"));
        let ei = this;

        let container = document.createElement("div");
        let close = document.createElement("button");
        close.appendChild(document.createTextNode("×"));
        container.appendChild(close);
        shadow.appendChild(container);

        const styles = document.createElement("style");
        styles.textContent = `
            div {
                background: white;
                box-shadow: 3px 3px 3px rgba(0,0,0,0.8);
                border: 1px solid #ccc;
                box-sizing: border-box;
                padding: 5px;
                position: absolute;
                left: 20vw;
                width: 60vw;
                top: 20vh;
                height: 60vh;
                z-index: 2;
                display: none;
                NOoverflow: hidden;
            }
            img {
                width: 100%;
                margin-top: 50px;
                max-height: 90%;
                object-fit: contain;
            }
            button {
                background: transparent;
                border: 2px solid black;
                color: black;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                position: absolute;
                right: 5px;
                top: 5px;
                font-size: 30px;
            }
        `;
        shadow.appendChild(styles);
        close.addEventListener("click", (e) => {
            container.style.display = "none";
            container.querySelector("img").remove();
        })

        btn.addEventListener("click", (e) => {
            // load map image
            var img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = this.toolsElement.load("map");
            let that = this;
            img.onload = function() {

                // calculate size of output canvas
                let tlx = that.toolsElement.load("export-tlx"),
                    tly = that.toolsElement.load("export-tly"),
                    brx = that.toolsElement.load("export-brx"),
                    bry = that.toolsElement.load("export-bry"),
                    gx1 = that.toolsElement.load("grid-x1"),
                    gx2 = that.toolsElement.load("grid-x2"),
                    gy = that.toolsElement.load("grid-y");
                let square = gx2 - gx1;

                let source = {w: (brx-tlx) + square, h: (bry-tly) + square, x:tlx, y:tly};
                let required = {w: 600, h: 600};
                let dest = {w: source.w, h: source.h, square: square};
                if (dest.w > required.w) {
                    dest.h *= required.w / dest.w;
                    dest.square *= required.w / dest.w;
                    dest.w = required.w;
                }
                if (dest.h > required.h) {
                    dest.w *= required.h / dest.h;
                    dest.square *= required.h / dest.h;
                    dest.h = required.h;
                }
                canvas.width = dest.w;
                canvas.height = dest.h;
                ctx.fillStyle = "#004";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // draw letters into canvas
                ctx.font = (dest.square/2) + "px sans-serif";
                ctx.fillStyle = "#ccc";
                let xsquares = Math.floor(dest.w / dest.square);
                for (var i=1; i<xsquares; i++) {
                    let letter = String.fromCharCode(64 + i);
                    let metrics = ctx.measureText(letter);
                    ctx.fillText(letter, i * dest.square + (dest.square / 2) - (metrics.width / 2), dest.square * 0.7);
                }
                let ysquares = Math.floor(dest.h / dest.square);
                for (i=1; i<ysquares; i++) {
                    let s = i.toString();
                    let metrics = ctx.measureText(s);
                    ctx.fillText(s, dest.square / 2 - metrics.width / 2, i * dest.square + (dest.square * 0.7));
                }

                // draw map into canvas
                ctx.drawImage(img, source.x, source.y, source.w, source.h, dest.square, dest.square, dest.w, dest.h);

                // draw tokens into canvas
                let load_tokens = that.toolsElement.load("tokens");
                if (!Array.isArray(load_tokens)) load_tokens = [];
                if (load_tokens.length > 0) {
                    let overrideGridSettings = {
                        xoffset: 0, yoffset: 0, size: dest.square
                    }
                    let dx = Math.floor(source.x / square);
                    let dy = Math.floor(source.y / square);
                    let tokens = load_tokens.map(function(t) {
                        return {
                            url: t.url,
                            name: t.name,
                            x: t.x + 1 - dx,
                            y: t.y + 1 - dy
                        }
                    })
                    container.style.display = "block";
                    let out = new Image();
                    out.src = "ajax-loader.gif";
                    container.appendChild(out);
                    document.querySelector("token-manager").renderTokens(ctx, tokens, overrideGridSettings, function() {
                        out.src = canvas.toDataURL("image/png");
                    });
                }
            }

        }, false);

        let iv = setInterval(() => {
            if (window.addTools) {
                clearInterval(iv);
                this.toolsElement = window.addTools("Export to image", [btn]);
            }
        }, 50);

    }
}
window.customElements.define("export-image", ExportImage);
