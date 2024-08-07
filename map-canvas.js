class MapCanvas extends HTMLElement {
    constructor() {
        super();

        let mc = this;
        const shadow = this.attachShadow({mode: 'open'});
        const container = document.createElement("main");
        this.container = container;
        container.className = "waiting";
        const canvas = document.createElement("canvas");
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        container.appendChild(canvas);
        shadow.appendChild(container);
        shadow.appendChild(makeMobileButtons());
        const that = this;

        this.redrawEvent = new CustomEvent('map-redraw', { detail: { ctx: this.ctx }});
        document.addEventListener("request-map-redraw", (e) => {
            let that = this;
            requestAnimationFrame(function() {
                that.redraw.call(that);
            }); // debounces
        }, false);

        const styles = document.createElement("style");
        styles.textContent = `
            main {
                position: absolute;
                top: 0;
                left: 0;
                width: 75vw; /* excludes 25vw which is the width of the tool dialogue */
                height: 100vh;
                align-items: center;
                overflow: hidden;
            }
            main::before {
                position: absolute;
                top: 40%;
                left: 0;
                width: 100%;
                height: 100%;
                text-align: center;
                z-index: -1;
            }
            main.waiting::before { content: "waiting for map URL"; }
            main.loading::before { content: "loading map"; }
            main.error::before { content: "error loading map"; }
            div.buttons {
                position: absolute;
                top: 0;
                left: 0;
                display: none;
                opacity: 0.6;
                width: 100vw;
                user-select: none;
            }
            div.buttons button {
                height: 50px;
                flex: 1 1 auto;
                font-size: 15px;
                touch-action: manipulation;
            }
            @media (max-width: 750px) {
                div.buttons {
                    display: flex;
                }
                main {
                    width: 100vw; /* don't exclude tool dialogue */
                    height: 50vh; /* exclude tool dialogue */
                }
            }
        `;
        shadow.appendChild(styles);

        this.mapURL = "";
        this.mapImage = new Image();
        this.mapImage.crossOrigin = "Anonymous";
        this.mapImage.onload = () => {
            if (this.toolsElement) this.toolsElement.save("map", this.mapURL);
            this.canvas.width = this.mapImage.naturalWidth;
            this.canvas.height = this.mapImage.naturalHeight;
            lastX = this.canvas.width/2, lastY = this.canvas.height/2;
            that.ctx.scale(this.container.offsetWidth / this.canvas.width, this.container.offsetWidth / this.canvas.width);
            this.redraw();
        }
        this.mapImage.onerror = () => {
            container.className = "error";
        }

        const setInput = (e) => {
            clearTimeout(debounceTimer);
            if (addInput.validity.valid) {
                debounceTimer = setTimeout(() => {
                    this.mapURL = addInput.value;
                    container.className = "loading";
                    this.mapImage.src = addInput.value;
                }, 100);
            }
        };
        const addInput = document.createElement("input");
        let debounceTimer;
        addInput.type = "url";
        addInput.required = true;
        addInput.placeholder = "map URL";
        addInput.addEventListener("input", setInput, false);
        let addInputLabel = document.createElement("label");
        addInputLabel.className = "input-label";
        addInputLabel.appendChild(addInput);

        let iv = setInterval(async function() {
            if (window.addTools) {
                clearInterval(iv);
                [mc.toolsElement, mc.toolDialogSection] = window.addTools("Add a map", [addInputLabel]); 
                let map = await mc.toolsElement.load("map");
                if (map) {
                    addInput.value = map; setInput();
                } else {
                    mc.toolDialogSection.open = true;
                }
            } else {
                console.log("waiting in map canvas");
            }
        }, 50);

        function trackTransforms(ctx) {
            let svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
            let xform = svg.createSVGMatrix();
            ctx.getTransform = function(){ return xform; };
            let savedTransforms = [];
            let save = ctx.save;
            ctx.save = function() { savedTransforms.push(xform.translate(0,0)); return save.call(ctx); };
            let restore = ctx.restore;
            ctx.restore = function() { xform = savedTransforms.pop(); return restore.call(ctx); };
            let scale = ctx.scale;
            ctx.scale = function(sx,sy) { xform = xform.scaleNonUniform(sx,sy); return scale.call(ctx,sx,sy); };
            let rotate = ctx.rotate;
            ctx.rotate = function(radians) {
                xform = xform.rotate(radians*180/Math.PI); return rotate.call(ctx,radians); };
            let translate = ctx.translate;
            ctx.translate = function(dx,dy) { xform = xform.translate(dx,dy); return translate.call(ctx,dx,dy); };
            let transform = ctx.transform;
            ctx.transform = function(a,b,c,d,e,f) {
                let m2 = svg.createSVGMatrix();
                m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
                xform = xform.multiply(m2);
                return transform.call(ctx,a,b,c,d,e,f);
            };
            let setTransform = ctx.setTransform;
            ctx.setTransform = function(a,b,c,d,e,f) {
                xform.a = a; xform.b = b; xform.c = c;
                xform.d = d; xform.e = e; xform.f = f;
                return setTransform.call(ctx,a,b,c,d,e,f);
            };
            let pt  = svg.createSVGPoint();
            ctx.transformedPoint = function(x,y) {
                pt.x=x; pt.y=y; return pt.matrixTransform(xform.inverse());
            }
        }

        let handleScroll = function(evt) {
            let delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
            if (delta) zoom(delta);
            return evt.preventDefault() && false;
        };
        let zoom = function(clicks) {
            let pt = that.ctx.transformedPoint(lastX,lastY);
            var factor = Math.pow(scaleFactor,clicks);
            that.ctx.translate(pt.x,pt.y);
            that.ctx.scale(factor, factor);
            that.ctx.translate(-pt.x,-pt.y);
            that.redraw();
        }
        let lastX = canvas.width/2, lastY = canvas.height/2;
        let scaleFactor = 1.1;
        let dragStart,dragged;

        function makeMobileButtons() {
            // movement and zoom buttons for mobile
            // this should be done with touch events, but we go basic
            function moveCanvas(x, y) {
                that.ctx.translate(x, y);
                document.dispatchEvent(new Event('request-map-redraw'));
            }
            function zoomAroundCentre(z) {
                lastX = shadow.querySelector("main").offsetWidth / 2;
                lastY = shadow.querySelector("main").offsetHeight / 2;
                zoom(z);
            }

            const cont = document.createElement("div");
            cont.className = "buttons";
            const zoomIn = document.createElement("button");
            const zoomOut = document.createElement("button");
            const up = document.createElement("button");
            const down = document.createElement("button");
            const left = document.createElement("button");
            const right = document.createElement("button");
            zoomIn.onclick = () => { zoomAroundCentre(4); }
            zoomOut.onclick = () => { zoomAroundCentre(-4); }
            up.onclick = e => { moveCanvas(0, 30); }
            down.onclick = e => { moveCanvas(0, -30); }
            left.onclick = e => { moveCanvas(30, 0); }
            right.onclick = e => { moveCanvas(-30, 0); }
            up.append("⬆");
            down.append("⬇");
            left.append("⬅");
            right.append("➡");
            zoomIn.append("+");
            zoomOut.append("-");
            cont.append(up);
            cont.append(down);
            cont.append(left);
            cont.append(right);
            cont.append(zoomIn);
            cont.append(zoomOut);
            return cont;
        }

        canvas.addEventListener('mousedown',function(evt) {
            if (evt.buttons != 4) return; // middle mouse only
            lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
            lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
            lastX *= canvas.width / canvas.offsetWidth;
            lastY *= canvas.height / canvas.offsetHeight;
            dragStart = that.ctx.transformedPoint(lastX,lastY);
        });

        canvas.addEventListener('mousemove',function(evt) {
            lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
            lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
            lastX *= canvas.width / canvas.offsetWidth;
            lastY *= canvas.height / canvas.offsetHeight;
            if (dragStart){
                var pt = that.ctx.transformedPoint(lastX,lastY);
                that.ctx.translate(pt.x-dragStart.x,pt.y-dragStart.y);
                document.dispatchEvent(new Event('request-map-redraw'));
            }
        }, false);

        canvas.addEventListener('mouseup',function(evt){
            dragStart = null;
        }, false);

        canvas.addEventListener('DOMMouseScroll', handleScroll, false);
        canvas.addEventListener('mousewheel', handleScroll, false);

        trackTransforms(this.ctx);
    }

    redraw() {
        this.container.className = "";
        var p1 = this.ctx.transformedPoint(0,0);
        var p2 = this.ctx.transformedPoint(this.canvas.width, this.canvas.height);
        this.ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);

        this.ctx.save();
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.restore();

        this.ctx.drawImage(this.mapImage, 0, 0);

        // and tell everyone else they can redraw
        document.dispatchEvent(this.redrawEvent);
    }
}

window.customElements.define("map-canvas", MapCanvas);
