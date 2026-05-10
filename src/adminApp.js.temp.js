function addVariant(size = "", price = "", stock = "20", sold = "0") {
    const container = document.getElementById('variantContainer');
    const isAccessories = document.getElementById('pCategory').value === "Accessories";
    const unit = isAccessories ? "ชิ้น" : "กรัม";
    const placeholder = isAccessories ? "เช่น บ้อง, ไฟแช็ค" : "เช่น 1g, 3g";

    const row = document.createElement('div');
    row.className = "variant-row flex items-center gap-2 animate-in fade-in slide-in-from-top-1 bg-slate-50 p-3 rounded-2xl border border-slate-100";
    row.innerHTML = `
        <div class="w-20">
            <label class="text-[10px] text-slate-400 font-bold uppercase">รุ่น/ขนาด</label>
            <input type="text" value="${size}" placeholder="${placeholder}" class="v-size w-full border rounded-lg px-2 py-1.5 mt-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none">
        </div>
        <div class="w-16">
            <label class="text-[10px] text-slate-400 font-bold uppercase">ราคา</label>
            <input type="number" value="${price}" placeholder="฿" class="v-price w-full border rounded-lg px-2 py-1.5 mt-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none">
        </div>
        <div class="w-16">
            <label class="text-[10px] text-slate-400 font-bold uppercase">คลัง (${unit})</label>
            <input type="number" value="${stock}" class="v-stock w-full border rounded-lg px-2 py-1.5 mt-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none">
        </div>
        <div class="w-16">
            <label class="text-[10px] text-slate-400 font-bold uppercase">ขายแล้ว</label>
            <input type="number" value="${sold}" class="v-sold w-full border rounded-lg px-2 py-1.5 mt-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none">
        </div>
        <button type="button" onclick="removeVariant(this)" class="mt-4 p-1 text-red-300 hover:text-red-500 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
    `;
    container.appendChild(row);
}

function removeVariant(btn) {
    const rows = document.querySelectorAll('.variant-row');
    if (rows.length > 1) {
        btn.closest('.variant-row').remove();
    } else {
        showToast("ต้องมีอย่างน้อย 1 ตัวเลือกครับ", "warning");
    }
}
