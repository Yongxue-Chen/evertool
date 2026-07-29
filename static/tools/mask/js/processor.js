/*
 * Ported from Transitional: Alpha Mask Processor
 * https://github.com/aaron6172/TransitionalAlphaMaskProcessor (MIT License)
 * Copyright (c) aaron6172
 */
class ImageProcessor {
    constructor() {
        this.canvas = null; // The preview canvas (editorCanvas)
        this.ctx = null;
        this.originalImage = null; // HTMLImageElement (Source)

        // Preview handling
        this.previewScale = 1; // ratio: preview / source
        this.previewWidth = 0;
        this.previewHeight = 0;
        this.previewOffscreen = document.createElement('canvas'); // Cached resized image
        this.previewCtx = this.previewOffscreen.getContext('2d', { willReadFrequently: true });

        // Source dimensions
        this.width = 0;
        this.height = 0;
    }

    setCanvas(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.width = img.width;
                this.height = img.height;

                // Create low-res preview
                // Max dimension e.g. 800px for smooth 60fps CPU processing
                const MAX_PREVIEW_DIM = 800;
                let scale = 1;
                if (this.width > MAX_PREVIEW_DIM || this.height > MAX_PREVIEW_DIM) {
                    scale = Math.min(MAX_PREVIEW_DIM / this.width, MAX_PREVIEW_DIM / this.height);
                }

                this.previewScale = scale;
                this.previewWidth = Math.floor(this.width * scale);
                this.previewHeight = Math.floor(this.height * scale);

                // Setup Preview Cache
                this.previewOffscreen.width = this.previewWidth;
                this.previewOffscreen.height = this.previewHeight;
                this.previewCtx.drawImage(img, 0, 0, this.previewWidth, this.previewHeight);

                // Set visible canvas size to preview size (CSS handles display size)
                if (this.canvas) {
                    this.canvas.width = this.previewWidth;
                    this.canvas.height = this.previewHeight;
                }

                resolve(img);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Renders the image with the specified kernel parameters using SDF.
     * @param {Object} kernel { x, y, width, height, radius, feather } (In Source Pixels)
     * @param {Boolean} isExport If true, renders full resolution and returns Blob
     */
    async render(kernel, isExport = false) {
        if (!this.originalImage) return null;

        let targetCtx, targetW, targetH, sourceImg, scaleFactor;

        if (isExport) {
            // Setup Full Res Export Canvas
            const cvs = document.createElement('canvas');
            cvs.width = this.width;
            cvs.height = this.height;
            targetCtx = cvs.getContext('2d');
            targetW = this.width;
            targetH = this.height;
            sourceImg = this.originalImage;
            scaleFactor = 1;
        } else {
            // Render to Preview Canvas
            targetCtx = this.ctx;
            targetW = this.previewWidth;
            targetH = this.previewHeight;
            sourceImg = this.previewOffscreen;
            scaleFactor = this.previewScale;
        }

        if (!targetCtx) return;

        // 1. Draw Image
        targetCtx.clearRect(0, 0, targetW, targetH);
        targetCtx.drawImage(sourceImg, 0, 0, targetW, targetH);

        // 2. Get Pixel Data
        const imageData = targetCtx.getImageData(0, 0, targetW, targetH);
        const data = imageData.data;

        // 3. Prepare SDF Parameters (Scale kernel to current target resolution)
        const kx = kernel.x * scaleFactor;
        const ky = kernel.y * scaleFactor;
        const kw = kernel.width * scaleFactor;
        const kh = kernel.height * scaleFactor;
        const kr = kernel.radius * scaleFactor;
        const kf = kernel.feather * scaleFactor;

        // Pre-calculate useful bounds to skip pixels? 
        // For simple usage, iterate all. Optimization: bounding box check.
        // We only need to process pixels that might be transparent.
        // Bounding box: The outer edge of the feather area.
        // x - feather, y - feather, w + 2*feather, ...
        // However, we also need to MASK OUT (alpha=0) everything far outside.
        // So we effectively need to iterate everything unless we fill with transparent first and only draw the content.
        // But we drew the image first. So we must iterate everything OR clip.

        // Optim: If kf (feather) is small, the transition area is small.
        // But the "inside" is Solid, "outside" is Transparent.
        // We need to set alpha=0 for everything outside (d > feather).

        // SDF Setup
        // Center of rect
        const cx = kx + kw / 2;
        const cy = ky + kh / 2;
        // Half extents
        const bx = kw / 2;
        const by = kh / 2;

        const stride = 4;

        for (let y = 0; y < targetH; y++) {
            for (let x = 0; x < targetW; x++) {
                // Point relative to center
                const px = x - cx;
                const py = y - cy;

                // Signed Distance to Rounded Rect
                // d = length(max(abs(p) - b + r, 0)) - r
                const ax = Math.abs(px);
                const ay = Math.abs(py);

                // Vector q = abs(p) - b + r
                const qx = ax - bx + kr;
                const qy = ay - by + kr;

                // dist = length(max(q, 0)) + min(max(q.x, q.y), 0) - r
                // Note: The second term min(..., 0) corresponds to interior distance (negative),
                // but usually sdRoundedRect formula is:
                // float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r ) {
                //     vec2 q = abs(p)-b+r;
                //     return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r;
                // }

                const mx = Math.max(qx, 0);
                const my = Math.max(qy, 0);
                const lengthMaxQ = Math.sqrt(mx * mx + my * my);

                // For interior (when p is inside), max(q,0) is 0 vector.
                // We need the negative part for signed distance inside.
                // But for our opacity mask, we usually treat "inside the solid part" as d <= 0.
                // The standard SDF is 0 at the surface.

                const interior = Math.min(Math.max(qx, qy), 0);
                const dist = interior + lengthMaxQ - kr;

                // Alpha Math
                // We want Solid (alpha 1) when dist <= 0
                // We want Transparent (alpha 0) when dist >= kf
                // Transition 0 < dist < kf

                let alpha = 0;

                if (dist <= 0) {
                    alpha = 1;
                } else if (dist >= kf) {
                    alpha = 0;
                } else {
                    // 0 < dist < kf
                    const t = dist / kf; // 0..1
                    // Cosine kernel: 0.5 * (1 + cos(t * PI))
                    // t=0 => cos(0)=1 => 1
                    // t=1 => cos(PI)=-1 => 0
                    alpha = 0.5 * (1 + Math.cos(t * Math.PI));
                }

                // Apply
                const idx = (y * targetW + x) * stride;
                // Multiply existing alpha or replace? 
                // Usually replace, as we are masking.
                // But if image itself has transparency? Intersection?
                // data[idx + 3] is 0..255
                data[idx + 3] = Math.floor(data[idx + 3] * alpha);
            }
        }

        // 4. Put Data Back
        targetCtx.putImageData(imageData, 0, 0);

        if (isExport) {
            return new Promise((resolve) => {
                targetCtx.canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            });
        }
    }

    // Legacy method for UI drawing, repurposed using path
    pathRoundRect(ctx, x, y, w, h, r) {
        // Safe radius
        r = Math.min(r, Math.min(w, h) / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
