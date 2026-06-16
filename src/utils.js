// Utility functions for BlackNight69

// --- CUSTOM UI: TOAST ---
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✨' : '❌';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- GENERIC CATEGORY CLASSIFIER ---
export function classifyItem(name) {
    const n = name.toLowerCase();
    if (["phone", "laptop", "watch", "tech", "gadget"].some(s => n.includes(s))) return "Electronics";
    if (["shirt", "pants", "dress", "bag", "shoe"].some(i => n.includes(i))) return "Fashion";
    if (["chair", "table", "lamp", "sofa", "bed"].some(h => n.includes(h))) return "Home";
    return "Other";
}

// --- IMAGE COMPRESSION ---
export function compressImage(file, maxWidth = 1000, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = e => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' }));
                }, 'image/webp', quality);
            };
        };
        reader.onerror = reject;
    });
}