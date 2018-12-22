class MapCanvas extends HTMLElement {
    constructor() {
        super();

        let mc = this;
        const shadow = this.attachShadow({mode: 'open'});
        const container = document.createElement("div");
        this.container = container;
        container.className = "waiting";
        const canvas = document.createElement("canvas");
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        container.appendChild(canvas);
        shadow.appendChild(container);
        const that = this;

        this.redrawEvent = new CustomEvent('map-redraw', { detail: { ctx: this.ctx }});
        document.addEventListener("request-map-redraw", (e) => { this.redraw(); }, false);

        const styles = document.createElement("style");
        styles.textContent = `
            div {
                position: absolute;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                align-items: center;
            }
            div::before {
                position: absolute;
                top: 40%;
                left: 0;
                width: 100%;
                height: 100%;
                text-align: center;
                z-index: -1;
            }
            div.waiting::before { content: "waiting for map URL"; }
            div.loading::before { content: "loading map"; }
            div.error::before { content: "error loading map"; }
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

        let iv = setInterval(async function() {
            if (window.addTools) {
                clearInterval(iv);
                mc.toolsElement = window.addTools("Add a map", [addInput]); 
                let map = await mc.toolsElement.load("map");
                if (map) { addInput.value = map; setInput(); }
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
