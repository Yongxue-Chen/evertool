/*
 * Ported from Transitional: Alpha Mask Processor
 * https://github.com/aaron6172/TransitionalAlphaMaskProcessor (MIT License)
 * Copyright (c) aaron6172
 */
class FileHandler {
    constructor() {
    }

    /**
     * Handles the drop event to extract file handles.
     * @param {DragEvent} event 
     * @returns {Promise<{file: File, handle: FileSystemFileHandle|null}>}
     */
    async handleDrop(event) {
        event.preventDefault();

        try {
            const items = [...event.dataTransfer.items];
            const item = items[0];

            if (!item) return null;

            if (item.kind !== 'file') return null;

            let handle = null;
            let file = null;

            // Try to get FileSystemHandle (Modern API)
            if (item.getAsFileSystemHandle) {
                const h = await item.getAsFileSystemHandle();
                if (h.kind === 'file') {
                    handle = h;
                    file = await handle.getFile();
                }
            }
            // Fallback for older interface (though we target modern browsers for this app)
            // or if getAsFileSystemHandle returns null (some security contexts)
            else if (item.webkitGetAsEntry) {
                const entry = item.webkitGetAsEntry();
                if (entry.isFile) {
                    // entry doesn't give a "writeable" handle usually in the same way modern API does for "save changes back"
                    // but we only need it for "startIn" in saveAs, which requires a FileSystemHandle.
                    // Converting entry to handle is not direct.
                    // We'll rely on item.getAsFileSystemHandle() which is standard now.
                    file = item.getAsFile();
                }
            } else {
                file = item.getAsFile();
            }

            if (!file && !handle) {
                // Last ditch
                file = item.getAsFile();
            }

            if (file && file.type === 'image/png') {
                return { file, handle };
            } else {
                console.warn('Dropped file is not a PNG or could not be read.');
                return { file: null, handle: null, error: 'Only PNG images are supported.' };
            }

        } catch (err) {
            console.error('Error handling drop:', err);
            return null;
        }
    }

    /**
     * Saves the blob to a file using the File System Access API or fallback.
     * @param {Blob} blob 
     * @param {string} suggestedName 
     * @param {FileSystemFileHandle} sourceHandle Optional handle to use for 'startIn'
     */
    async saveFile(blob, suggestedName, sourceHandle = null) {
        try {
            if (window.showSaveFilePicker) {
                const options = {
                    suggestedName: suggestedName,
                    types: [{
                        description: 'PNG Image',
                        accept: { 'image/png': ['.png'] },
                    }],
                };

                // Try to set startIn to the directory of the sourceHandle
                // Note: startIn accepts a handle. If we pass the file handle, browsers usually resolving to the parent dir.
                if (sourceHandle) {
                    options.startIn = sourceHandle;
                }

                const handle = await window.showSaveFilePicker(options);
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return true;
            } else {
                // Fallback for non-supported browsers (Firefox currently)
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = suggestedName;
                a.click();
                URL.revokeObjectURL(url);
                return true;
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                // User cancelled
                return false;
            }
            console.error('Save failed:', err);
            throw err;
        }
    }
}
