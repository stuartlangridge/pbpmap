
class ExportImage extends HTMLElement {
    constructor() {
        super();
        let shadow = this.attachShadow({mode: 'open'});
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        let btn = document.createElement("button");
        btn.appendChild(document.createTextNode("Export to image"));
        btn.style.width = "100%";
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

        btn.addEventListener("click", async (e) => {
            // load map image
            var img = new Image();
            img.crossOrigin = "Anonymous";
            let that = this;
            img.onload = async function() {
                // calculate size of output canvas
                let tlx = await that.toolsElement.load("export-tlx"),
                    tly = await that.toolsElement.load("export-tly"),
                    brx = await that.toolsElement.load("export-brx"),
                    bry = await that.toolsElement.load("export-bry"),
                    gx1 = await that.toolsElement.load("grid-x1"),
                    gx2 = await that.toolsElement.load("grid-x2"),
                    gy = await that.toolsElement.load("grid-y");
                let square = Math.abs(gx2 - gx1);
                let gridSettingsXOffset = gx1 % square;
                let gridSettingsYOffset = gy % square;

                let widthOfReal = brx - tlx;
                let heightOfReal = bry - tly;

                // create a canvas snippet which is just the export area and render tokens into it
                let mapSectionCanvas = document.createElement("canvas");
                let mapSectionCtx = mapSectionCanvas.getContext("2d");
                mapSectionCanvas.width = widthOfReal;
                mapSectionCanvas.height = heightOfReal;

                // first render the right section of the map into our canvas
                mapSectionCtx.drawImage(img, tlx, tly, widthOfReal, heightOfReal, 0, 0, widthOfReal, heightOfReal);

                // now get the tokens
                let load_tokens = await that.toolsElement.load("tokens");
                if (!Array.isArray(load_tokens)) load_tokens = [];
                let overrideGridSettings = {xoffset: 0, yoffset: 0, size: square, exportingImage: true};

                // and fiddle their positions so they're counted from the top left of
                // our export area, not from the top left of the whole map
                let exportSquaresLeft = (tlx- gridSettingsXOffset) / square;
                let exportSquaresTop = (tly - gridSettingsYOffset) / square;
                let movedTokens = load_tokens.map(function(t) {
                    return {
                        url: t.url,
                        name: t.name,
                        x: t.x - exportSquaresLeft,
                        y: t.y - exportSquaresTop,
                        visible: t.visible === undefined ? true : !!t.visible,
                        conditions: t.conditions || []
                    };
                })

                // render the new tokens into our canvas
                await that.callTokenManagerToRenderTokens(mapSectionCtx, movedTokens, overrideGridSettings);
                
                // and get the effects
                let load_effects = await that.toolsElement.load("effects");
                if (!Array.isArray(load_effects)) load_effects = [];
                // and fiddle their positions so they're counted from the top left of
                // our export area, not from the top left of the whole map
                let movedEffects = load_effects.map(function(t) {
                    return Object.assign(t, {
                        x: t.x - exportSquaresLeft,
                        y: t.y - exportSquaresTop
                    });
                })

                // render the new tokens into our canvas
                await that.callBattlefieldEffectsToRenderEffects(mapSectionCtx, movedEffects, overrideGridSettings);
                
                // now, create a new canvas which has the numbers/letters on it
                let withLettersCanvas = document.createElement("canvas");
                withLettersCanvas.width = mapSectionCanvas.width + square + square;
                withLettersCanvas.height = mapSectionCanvas.height + square + square;
                let withLettersCtx = withLettersCanvas.getContext("2d");
                withLettersCtx.fillStyle = "#004";
                withLettersCtx.fillRect(0, 0, withLettersCanvas.width, withLettersCanvas.height);

                let widthInSquares = Math.floor(widthOfReal / square);
                let heightInSquares = Math.floor(heightOfReal / square);
                withLettersCtx.font = (square/2) + "px sans-serif";
                withLettersCtx.fillStyle = "#ccc";
                for (var i=1; i<widthInSquares+1; i++) {
                    let letter = String.fromCharCode(64 + i);
                    let metrics = withLettersCtx.measureText(letter);
                    withLettersCtx.fillText(letter, i * square + (square / 2) - (metrics.width / 2), square * 0.7);
                    withLettersCtx.fillText(letter, i * square + (square / 2) - (metrics.width / 2), (square * 0.7) + (square * heightInSquares) + square);
                }
                for (i=1; i<heightInSquares+1; i++) {
                    let s = i.toString();
                    let metrics = withLettersCtx.measureText(s);
                    withLettersCtx.fillText(s, square / 2 - metrics.width / 2, i * square + (square * 0.7));
                    withLettersCtx.fillText(s, (square / 2 - metrics.width / 2) + (square * widthInSquares) + square, i * square + (square * 0.7));
                }

                // and render the map canvas with tokens into it
                withLettersCtx.drawImage(mapSectionCanvas, 0, 0, widthOfReal, heightOfReal, square, square, widthOfReal, heightOfReal);

                // make a new scaled canvas to be no bigger than our maximum square
                let maxOutputSize = 1200;
                let oCanvas = document.createElement("canvas");
                let oCtx = oCanvas.getContext("2d");
                if (widthOfReal > heightOfReal) {
                    oCanvas.height = Math.floor(withLettersCanvas.height * maxOutputSize / withLettersCanvas.width);
                    oCanvas.width = maxOutputSize;
                } else {
                    oCanvas.width = Math.floor(withLettersCanvas.width * maxOutputSize / withLettersCanvas.height);
                    oCanvas.height = maxOutputSize;
                }

                // and render our lettered canvas into it
                oCtx.drawImage(withLettersCanvas, 0, 0, withLettersCanvas.width, withLettersCanvas.height, 0, 0, oCanvas.width, oCanvas.height);

                // get an image from our canvas which now has tokens in
                let out = new Image();
                out.src = oCanvas.toDataURL("image/png");

                // show the container, and put the image in it
                container.style.display = "block";
                container.appendChild(out);

            }
            img.src = await this.toolsElement.load("map");

        }, false);

        let iv = setInterval(() => {
            if (window.addTools) {
                clearInterval(iv);
                [this.toolsElement, this.toolDialogSection] = window.addTools("Export to image", [btn], {noHeading:true});
            }
        }, 50);

    }

    async callTokenManagerToRenderTokens(ctx, tokens, overrideGridSettings) {
        return new Promise((resolve, reject) => {
            document.querySelector("token-manager").renderTokens(ctx, tokens, overrideGridSettings, function() {
                resolve();
            });
        })
    }    

    async callBattlefieldEffectsToRenderEffects(ctx, effects, overrideGridSettings) {
        return new Promise((resolve, reject) => {
            // note we call with alpha 1.0 so darkness actually is impenetrable on the export image
            document.querySelector("battlefield-effects").renderEffects(ctx, effects, 1.0, overrideGridSettings, function() {
                resolve();
            });
        })
    }    
}
window.customElements.define("export-image", ExportImage);
