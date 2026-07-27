const LANGUAGE_STORAGE_KEY = 'cf_language';
const SUPPORTED_LANGUAGES = ['th', 'en'];

const translations = {
    th: {
        'language.label': 'เลือกภาษา',
        'language.thai': 'ภาษาไทย',
        'language.english': 'English',

        'common.loading': 'กำลังโหลด...',
        'common.save': 'บันทึก',
        'common.cancel': 'ยกเลิก',
        'common.confirm': 'ตกลง',
        'common.status': 'สถานะ',
        'common.actions': 'จัดการ',
        'common.product': 'สินค้า',
        'common.products': 'สินค้า',
        'common.price': 'ราคา',
        'common.stock': 'สต๊อก',
        'common.sold': 'ขายแล้ว',

        'store.nav.catalog': 'สายพันธุ์',
        'store.nav.profile': 'ข้อมูลร้าน',
        'store.nav.open': 'เริ่มรับออเดอร์ 09:00',
        'store.nav.login': 'เข้าสู่ระบบ',
        'store.nav.logout': 'ออกจากระบบ',
        'store.nav.greeting': 'สวัสดี,',
        'store.cart.open': 'เปิดตะกร้าสินค้า',
        'store.refreshing': 'กำลังอัปเดตข้อมูล...',
        'store.hero.line1': 'เลือกดอกที่ใช่',
        'store.hero.line2': 'ให้ทุกช่วงเวลาของคุณ',
        'store.hero.description': 'ดอกแท้คัดเกรด Sativa, Indica และ Hybrid พร้อมคำแนะนำแบบเป็นกันเอง ส่งด่วนในย่านอ่อนนุช–สุขุมวิทภายในประมาณ 1 ชั่วโมง',
        'store.hero.catalog': 'ดูรายการพร้อมส่ง',
        'store.hero.line': 'คุยกับร้านทาง LINE',
        'store.hero.deliveryTime': 'ส่งด่วนในพื้นที่',
        'store.hero.free': 'ฟรี',
        'store.hero.freeArea': 'ค่าส่งย่านอ่อนนุช',
        'store.hero.adults': 'สำหรับผู้ใหญ่เท่านั้น',
        'store.flow.heading': 'วันนี้อยากได้ฟีลแบบไหน?',
        'store.flow.ready': 'พร้อมส่ง',
        'store.flow.focus': 'สดใส & โฟกัส',
        'store.flow.balance': 'สมดุล & ลื่นไหล',
        'store.flow.relax': 'นิ่ง & ผ่อนคลาย',
        'store.catalog.heading': 'รายการพร้อมส่ง',
        'store.catalog.updating': 'กำลังอัปเดตรายการ...',
        'store.catalog.loading': 'กำลังโหลดรายการพร้อมส่ง...',
        'store.catalog.searchPlaceholder': 'ค้นหาสายพันธุ์ อุปกรณ์ หรือเมนูน้ำ...',
        'store.catalog.searchAria': 'ค้นหาสินค้า',
        'store.category.all': 'ทั้งหมด',
        'store.category.allLabel': 'ทุกหมวดหมู่',
        'store.category.premium': '✦ คัดเกรด',
        'store.category.accessories': 'อุปกรณ์',
        'store.category.drinks': '🧃 เมนูน้ำ',
        'store.catalog.results': '{{count}} รายการ · {{category}}',
        'store.catalog.emptyTitle': 'ยังไม่พบรายการที่ค้นหา',
        'store.catalog.emptyHint': 'ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่อื่น',
        'store.product.sold': 'ขายแล้ว {{count}}+',
        'store.product.lowStock': 'เหลือเพียง {{count}} ชิ้น',
        'store.product.startingAt': 'เริ่มต้น',
        'store.product.addAria': 'เพิ่ม {{name}} ลงตะกร้า',
        'store.product.add': 'เพิ่มลงตะกร้า',
        'store.product.outOfStock': 'สินค้าหมด',
        'store.product.details': 'รายละเอียดสินค้า',
        'store.product.lineOrder': 'ทัก LINE สั่งด่วน',
        'store.product.added': 'เพิ่ม {{name}} ลงในตะกร้าแล้ว!',
        'store.product.renderError': 'เกิดข้อผิดพลาดในการแสดงสินค้า',
        'store.product.noData': 'ไม่พบข้อมูลสินค้า',
        'store.product.loadError': 'โหลดข้อมูลสินค้าล้มเหลว',
        'store.product.updated': 'อัปเดตข้อมูลเรียบร้อย!',
        'store.cart.title': 'ตะกร้าสินค้า',
        'store.cart.empty': 'ยังไม่มีสินค้าในตะกร้า',
        'store.cart.subtotal': 'ยอดรวมสินค้า',
        'store.cart.checkout': 'สั่งซื้อสินค้า',
        'store.checkout.title': 'รายละเอียดการจัดส่ง',
        'store.checkout.paymentMethod': 'วิธีชำระเงิน *',
        'store.checkout.transfer': 'โอนเงิน',
        'store.checkout.noFee': 'ไม่มีค่าธรรมเนียม',
        'store.checkout.cod': 'เก็บเงินปลายทาง',
        'store.checkout.transferDetails': 'ข้อมูลการโอนเงิน',
        'store.checkout.transferHint': 'โปรดโอนเงินไปยังบัญชีนี้',
        'store.checkout.viewQr': 'ดู QR',
        'store.checkout.scanQr': 'สแกน QR Code นี้เพื่อโอนเงิน',
        'store.checkout.loadingPayment': 'กำลังโหลดข้อมูลชำระเงิน...',
        'store.checkout.noPayment': 'ยังไม่มีข้อมูลการชำระเงิน',
        'store.checkout.paymentLoadError': 'โหลดข้อมูลล้มเหลว',
        'store.checkout.formHint': 'ระบุเบอร์โทรและแนบสลิปเพื่อยืนยันออเดอร์',
        'store.checkout.name': 'ชื่อ-นามสกุล ผู้รับ *',
        'store.checkout.namePlaceholder': 'ระบุชื่อผู้รับสินค้า',
        'store.checkout.phone': 'เบอร์โทรศัพท์ *',
        'store.checkout.email': 'อีเมล (สำหรับรับใบยืนยันออเดอร์)',
        'store.checkout.address': 'ที่อยู่จัดส่งโดยละเอียด *',
        'store.checkout.addressPlaceholder': 'บ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์',
        'store.checkout.slip': 'แนบหลักฐานการโอนเงิน *',
        'store.checkout.attachSlip': 'กดเพื่อแนบสลิปโอนเงิน',
        'store.checkout.slipSelected': '✓ เลือกสลิปแล้ว',
        'store.checkout.confirmTransfer': 'ยืนยันและสั่งซื้อ',
        'store.checkout.confirmCod': 'ยืนยันสั่งซื้อ (เก็บเงินปลายทาง)',
        'store.checkout.confirmTransferTotal': 'ยืนยันและสั่งซื้อ ({{total}} ฿)',
        'store.checkout.confirmCodTotal': 'ยืนยันสั่งซื้อ (ยอดรวม {{total}} ฿)',
        'store.checkout.required': 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง',
        'store.checkout.slipRequired': 'กรุณาแนบสลิปโอนเงิน',
        'store.checkout.saving': 'กำลังบันทึกออเดอร์...',
        'store.checkout.error': 'เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง',
        'store.success.title': 'สั่งซื้อสำเร็จ!',
        'store.success.description': 'ระบบกำลังพาคุณไปแจ้งเตือนในแอป LINE เพื่อยืนยันออเดอร์...',
        'store.success.total': 'ยอดโอน:',
        'store.success.line': 'แจ้งชำระเงินใน LINE',
        'store.success.home': 'กลับไปหน้าแรก',
        'store.line.tooltip': 'ทัก LINE สั่งด่วน 💬',
        'store.profile.kicker': 'GOOGLE BUSINESS PROFILE',
        'store.profile.heading': 'ข้อมูลร้านที่ตรวจสอบได้ ก่อนสั่งทุกครั้ง',
        'store.profile.description': 'Cannabis Flower อ่อนนุช ให้บริการส่งด่วนในย่านอ่อนนุช สุขุมวิท สวนหลวง และอุดมสุข ตรวจสอบข้อมูลร้านล่าสุดหรือโทรสอบถามได้จากช่องทางทางการ',
        'store.profile.googleCta': 'ดูโปรไฟล์ร้านบน Google',
        'store.profile.callCta': 'โทร 080 572 0186',
        'store.profile.source': 'ข้อมูลอ้างอิงจาก Google Business Profile ของร้าน',
        'store.profile.serviceLabel': 'ประเภทบริการ',
        'store.profile.serviceValue': 'บริการส่งอาหาร',
        'store.profile.hoursLabel': 'เวลาเริ่มบริการ',
        'store.profile.hoursValue': 'เริ่มรับออเดอร์ 09:00',
        'store.profile.phoneLabel': 'โทรศัพท์',
        'store.profile.areaLabel': 'พื้นที่ให้บริการ',
        'store.profile.areaValue': 'อ่อนนุช · สุขุมวิท · สวนหลวง · อุดมสุข',
        'store.trust.flower': 'ดอกแท้คัดเกรด',
        'store.trust.delivery': 'ส่งด่วน · ส่งฟรี',
        'store.trust.private': 'แพ็กมิดชิด ไร้กลิ่น',

        'age.title': 'ยืนยันอายุ',
        'age.product': 'ผลิตภัณฑ์กัญชา<br>ดอกแท้คัดเกรด พรีโรล และอุปกรณ์',
        'age.requirement': 'จำหน่ายสำหรับผู้ที่มีอายุ <strong style="color: #4ade80;">20 ปีขึ้นไปเท่านั้น</strong><br>งดจำหน่ายแก่สตรีมีครรภ์และสตรีให้นมบุตร',
        'age.confirm': 'ฉันอายุ 20 ปีขึ้นไป — เข้าสู่เว็บไซต์',
        'age.exit': 'ฉันอายุต่ำกว่า 20 ปี — ออก',
        'age.notice': 'การเข้าสู่เว็บไซต์นี้ถือว่าคุณยืนยันว่ามีอายุครบ 20 ปีบริบูรณ์<br>โปรดใช้ผลิตภัณฑ์อย่างมีความรับผิดชอบ',

        'auth.login.title': 'เข้าสู่ระบบ',
        'auth.login.welcome': 'ยินดีต้อนรับกลับสู่ Cannabis Flower อ่อนนุช',
        'auth.brand.tagline': 'DELIVERY · ON NUT · BANGKOK',
        'auth.email': 'อีเมล',
        'auth.password': 'รหัสผ่าน',
        'auth.login.noAccount': 'ยังไม่มีบัญชี?',
        'auth.register.link': 'สมัครสมาชิก',
        'auth.register.title': 'สมัครสมาชิก',
        'auth.register.subtitle': 'สร้างบัญชีเพื่อรับสิทธิพิเศษ',
        'auth.register.brandTagline': 'MEMBER ACCESS · 20+',
        'auth.register.name': 'ชื่อ-นามสกุล',
        'auth.register.namePlaceholder': 'ชื่อของคุณ',
        'auth.register.confirmPassword': 'ยืนยันรหัสผ่าน',
        'auth.register.confirmPlaceholder': 'กรอกรหัสผ่านอีกครั้ง',
        'auth.register.passwordPlaceholder': 'อย่างน้อย 6 ตัวอักษร',
        'auth.register.create': 'สร้างบัญชี',
        'auth.register.hasAccount': 'มีบัญชีอยู่แล้ว?',
        'auth.register.success': 'สมัครสมาชิกสำเร็จ!',
        'auth.register.successDescription': 'ยินดีต้อนรับสู่ครอบครัว Cannabis Flower อ่อนนุช',
        'auth.register.goLogin': 'ไปหน้าเข้าสู่ระบบ',
        'auth.required': 'กรุณากรอกข้อมูลให้ครบถ้วน',
        'auth.passwordMismatch': 'รหัสผ่านไม่ตรงกัน',
        'auth.passwordShort': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
        'auth.genericError': 'เกิดข้อผิดพลาด กรุณาลองใหม่',
        'auth.connectionError': 'การเชื่อมต่อล้มเหลว',
        'auth.checking': 'กำลังตรวจสอบ...',
        'auth.registering': 'กำลังลงทะเบียน...',

        'admin.confirm.title': 'ยืนยันการทำรายการ',
        'admin.confirm.message': 'คุณแน่ใจใช่ไหมที่จะดำเนินการต่อ?',
        'admin.login.heading': 'ควบคุมร้าน',
        'admin.login.headingAccent': 'จากที่เดียว',
        'admin.login.description': 'ติดตามยอดขาย จัดการสินค้า ปรับสต๊อก และช่องทางชำระเงินของ Cannabis Flower อ่อนนุช',
        'admin.login.title': 'เข้าสู่ระบบหลังบ้าน',
        'admin.login.placeholder': 'กรอกรหัสผ่าน',
        'admin.login.submit': 'เข้าสู่ระบบ →',
        'admin.login.error': 'รหัสผ่านไม่ถูกต้อง!',
        'admin.nav.aria': 'เมนูหลังบ้าน',
        'admin.nav.overview': 'ภาพรวม',
        'admin.nav.products': 'สินค้า',
        'admin.nav.bulk': 'ราคา / สต๊อก',
        'admin.nav.store': 'ดูหน้าร้าน ↗',
        'admin.nav.logout': 'ออกจากระบบ',
        'admin.overview.title': 'ภาพรวมร้านวันนี้',
        'admin.overview.description': 'ยอดขาย ออเดอร์ และสินค้าที่ต้องติดตามในหน้าจอเดียว',
        'admin.overview.live': 'ข้อมูลจาก Google Sheets',
        'admin.metric.today': 'ยอดขายวันนี้',
        'admin.metric.month': 'ยอดขายเดือนนี้',
        'admin.metric.week': 'ยอดขายสัปดาห์นี้',
        'admin.metric.average': 'ยอดเฉลี่ยต่อออเดอร์',
        'admin.metric.loading': 'กำลังโหลด...',
        'admin.chart.sales': 'แนวโน้มยอดขาย',
        'admin.chart.top': 'สินค้าขายดี',
        'admin.orders.recent': 'ออเดอร์ล่าสุด',
        'admin.orders.refresh': 'รีเฟรช',
        'admin.orders.date': 'วันที่',
        'admin.orders.customer': 'ลูกค้า (เบอร์โทร)',
        'admin.orders.total': 'ยอดรวม',
        'admin.orders.shipping': 'ค่าส่ง:',
        'admin.orders.print': '🖨️ ปริ้น',
        'admin.orders.slip': '📄 ดูสลิป',
        'admin.orders.receive': '✅ รับยอด',
        'admin.orders.ship': '🚚 จัดส่ง',
        'admin.orders.pending': 'รอดำเนินการ',
        'admin.orders.paid': 'ชำระเงินแล้ว',
        'admin.orders.inTransit': 'อยู่ระหว่างจัดส่ง',
        'admin.orders.transfer': 'โอนเงิน',
        'admin.orders.cod': 'เก็บเงินปลายทาง',
        'admin.products.heading': 'รายการสินค้าทั้งหมด',
        'admin.products.deleteAll': 'ลบสินค้าทั้งหมด',
        'admin.products.add': 'เพิ่มสินค้าใหม่',
        'admin.products.image': 'รูปภาพ',
        'admin.products.name': 'ชื่อสินค้า',
        'admin.products.category': 'หมวดหมู่',
        'admin.products.variants': 'ขนาดที่มี',
        'admin.products.startPrice': 'ราคาเริ่มต้น',
        'admin.products.totalStock': 'สต็อกรวม',
        'admin.products.available': 'มีของ',
        'admin.products.out': 'หมด',
        'admin.bulk.heading': 'ปรับราคา / สต๊อก ทุกรายการ',
        'admin.bulk.saveAll': '💾 บันทึกทั้งหมด',
        'admin.bulk.priceHeading': '⚡ ปรับราคาทุกตัว (บวกส่วนต่างของร้าน)',
        'admin.bulk.stockHeading': '📦 ปรับสต๊อกทุกตัว',
        'admin.bulk.applyAll': 'ปรับทุกตัว',
        'admin.bulk.size': 'ขนาด',
        'admin.promptpay.heading': 'จัดการช่องทาง PromptPay',
        'admin.promptpay.sync': '🔄 ซิงค์ลง Sheets',
        'admin.promptpay.add': 'เพิ่ม PromptPay ใหม่',
        'admin.promptpay.accountName': 'ชื่อบัญชี',
        'admin.promptpay.bank': 'ธนาคาร',
        'admin.promptpay.accountNumber': 'เบอร์บัญชี',
        'admin.promptpay.none': 'ยังไม่มีข้อมูล PromptPay',
        'admin.promptpay.active': '✓ ใช้งาน',
        'admin.promptpay.inactive': '○ ไม่ใช้งาน',
        'admin.form.productName': 'ชื่อสินค้า *',
        'admin.form.category': 'หมวดหมู่ *',
        'admin.form.variants': 'ตัวเลือกขนาด ราคา และสต๊อก *',
        'admin.form.variant': 'รุ่น/ขนาด',
        'admin.form.addVariant': 'เพิ่มตัวเลือกราคา/รุ่น',
        'admin.form.description': 'คำอธิบาย',
        'admin.form.tags': 'แท็ก (คั่นด้วยคอมม่า)',
        'admin.form.image': 'รูปภาพสินค้า',
        'admin.form.saveChanges': 'บันทึกการแก้ไข',
        'admin.form.itemsUnit': 'ชิ้น',
        'admin.toast.loginSuccess': 'เข้าสู่ระบบเรียบร้อย',
        'admin.toast.wrongPassword': 'รหัสผ่านผิด!',
        'admin.dynamic.todayOrders': '{{count}} รายการวันนี้',
        'admin.dynamic.orders': '{{count}} รายการ',
        'admin.dynamic.lifetime': 'รวมทั้งหมด {{total}} ฿',
        'admin.dynamic.loading': 'กำลังโหลด...',
        'admin.dynamic.noProducts': 'ไม่มีสินค้า',
        'admin.dynamic.loadError': 'โหลดข้อมูลล้มเหลว'
    },
    en: {
        'language.label': 'Select language',
        'language.thai': 'Thai',
        'language.english': 'English',

        'common.loading': 'Loading...',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.status': 'Status',
        'common.actions': 'Actions',
        'common.product': 'Product',
        'common.products': 'Products',
        'common.price': 'Price',
        'common.stock': 'Stock',
        'common.sold': 'Sold',

        'store.nav.catalog': 'Strains',
        'store.nav.profile': 'Business profile',
        'store.nav.open': 'Orders from 9:00 AM',
        'store.nav.login': 'Sign in',
        'store.nav.logout': 'Sign out',
        'store.nav.greeting': 'Hello,',
        'store.cart.open': 'Open shopping cart',
        'store.refreshing': 'Refreshing data...',
        'store.hero.line1': 'Find the right flower',
        'store.hero.line2': 'for every moment',
        'store.hero.description': 'Curated Sativa, Indica, and Hybrid flower with friendly guidance. Express delivery across On Nut–Sukhumvit in about one hour.',
        'store.hero.catalog': 'Explore ready-to-deliver',
        'store.hero.line': 'Chat with us on LINE',
        'store.hero.deliveryTime': 'Express local delivery',
        'store.hero.free': 'Free',
        'store.hero.freeArea': 'On Nut delivery',
        'store.hero.adults': 'Adults only',
        'store.flow.heading': 'How do you want to feel today?',
        'store.flow.ready': 'Ready to deliver',
        'store.flow.focus': 'Bright & focused',
        'store.flow.balance': 'Balanced & flowing',
        'store.flow.relax': 'Calm & relaxed',
        'store.catalog.heading': 'Ready to deliver',
        'store.catalog.updating': 'Refreshing catalog...',
        'store.catalog.loading': 'Loading ready-to-deliver items...',
        'store.catalog.searchPlaceholder': 'Search strains, accessories, or drinks...',
        'store.catalog.searchAria': 'Search products',
        'store.category.all': 'All',
        'store.category.allLabel': 'All categories',
        'store.category.premium': '✦ Select',
        'store.category.accessories': 'Accessories',
        'store.category.drinks': '🧃 Drinks',
        'store.catalog.results': '{{count}} items · {{category}}',
        'store.catalog.emptyTitle': 'No matching items yet',
        'store.catalog.emptyHint': 'Try another search or category',
        'store.product.sold': '{{count}}+ sold',
        'store.product.lowStock': 'Only {{count}} left',
        'store.product.startingAt': 'From',
        'store.product.addAria': 'Add {{name}} to cart',
        'store.product.add': 'Add to cart',
        'store.product.outOfStock': 'Out of stock',
        'store.product.details': 'Product details',
        'store.product.lineOrder': 'Order now on LINE',
        'store.product.added': '{{name}} added to your cart!',
        'store.product.renderError': 'Could not display products',
        'store.product.noData': 'No product data found',
        'store.product.loadError': 'Could not load products',
        'store.product.updated': 'Catalog updated!',
        'store.cart.title': 'Your cart',
        'store.cart.empty': 'Your cart is empty',
        'store.cart.subtotal': 'Subtotal',
        'store.cart.checkout': 'Checkout',
        'store.checkout.title': 'Delivery details',
        'store.checkout.paymentMethod': 'Payment method *',
        'store.checkout.transfer': 'Bank transfer',
        'store.checkout.noFee': 'No fee',
        'store.checkout.cod': 'Cash on delivery',
        'store.checkout.transferDetails': 'Transfer details',
        'store.checkout.transferHint': 'Please transfer to this account',
        'store.checkout.viewQr': 'View QR',
        'store.checkout.scanQr': 'Scan this QR code to transfer',
        'store.checkout.loadingPayment': 'Loading payment details...',
        'store.checkout.noPayment': 'No payment details available',
        'store.checkout.paymentLoadError': 'Could not load payment details',
        'store.checkout.formHint': 'Enter your phone number and attach a slip to confirm the order',
        'store.checkout.name': 'Recipient name *',
        'store.checkout.namePlaceholder': 'Enter recipient name',
        'store.checkout.phone': 'Phone number *',
        'store.checkout.email': 'Email (for order confirmation)',
        'store.checkout.address': 'Full delivery address *',
        'store.checkout.addressPlaceholder': 'House number, street, district, province, postal code',
        'store.checkout.slip': 'Attach transfer receipt *',
        'store.checkout.attachSlip': 'Tap to attach transfer receipt',
        'store.checkout.slipSelected': '✓ Receipt selected',
        'store.checkout.confirmTransfer': 'Confirm and place order',
        'store.checkout.confirmCod': 'Place order (cash on delivery)',
        'store.checkout.confirmTransferTotal': 'Confirm and place order (฿{{total}})',
        'store.checkout.confirmCodTotal': 'Place order (total ฿{{total}})',
        'store.checkout.required': 'Please complete all required fields',
        'store.checkout.slipRequired': 'Please attach your transfer receipt',
        'store.checkout.saving': 'Saving your order...',
        'store.checkout.error': 'Could not place the order. Please try again.',
        'store.success.title': 'Order placed!',
        'store.success.description': 'We are opening LINE so you can confirm your order...',
        'store.success.total': 'Transfer total:',
        'store.success.line': 'Confirm payment on LINE',
        'store.success.home': 'Back to home',
        'store.line.tooltip': 'Order now on LINE 💬',
        'store.profile.kicker': 'GOOGLE BUSINESS PROFILE',
        'store.profile.heading': 'Verified store details before you order',
        'store.profile.description': 'Cannabis Flower On Nut provides express local delivery across On Nut, Sukhumvit, Suan Luang, and Udom Suk. Check the latest official details or call us directly.',
        'store.profile.googleCta': 'View our Google profile',
        'store.profile.callCta': 'Call 080 572 0186',
        'store.profile.source': "Information sourced from the store's Google Business Profile",
        'store.profile.serviceLabel': 'Service type',
        'store.profile.serviceValue': 'Food delivery service',
        'store.profile.hoursLabel': 'Service starts',
        'store.profile.hoursValue': 'Orders from 9:00 AM',
        'store.profile.phoneLabel': 'Phone',
        'store.profile.areaLabel': 'Service areas',
        'store.profile.areaValue': 'On Nut · Sukhumvit · Suan Luang · Udom Suk',
        'store.trust.flower': 'Curated real flower',
        'store.trust.delivery': 'Express · Free delivery',
        'store.trust.private': 'Sealed & discreet',

        'age.title': 'Age verification',
        'age.product': 'Cannabis products<br>curated flower, pre-rolls, and accessories',
        'age.requirement': 'Available only to customers aged <strong style="color: #4ade80;">20 or older</strong><br>Not for pregnant or breastfeeding customers.',
        'age.confirm': 'I am 20 or older — enter website',
        'age.exit': 'I am under 20 — leave',
        'age.notice': 'By entering this website, you confirm that you are at least 20 years old.<br>Please consume responsibly.',

        'auth.login.title': 'Sign in',
        'auth.login.welcome': 'Welcome back to Cannabis Flower On Nut',
        'auth.brand.tagline': 'DELIVERY · ON NUT · BANGKOK',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.login.noAccount': 'New here?',
        'auth.register.link': 'Create account',
        'auth.register.title': 'Create account',
        'auth.register.subtitle': 'Join for member benefits',
        'auth.register.brandTagline': 'MEMBER ACCESS · 20+',
        'auth.register.name': 'Full name',
        'auth.register.namePlaceholder': 'Your name',
        'auth.register.confirmPassword': 'Confirm password',
        'auth.register.confirmPlaceholder': 'Enter your password again',
        'auth.register.passwordPlaceholder': 'At least 6 characters',
        'auth.register.create': 'Create account',
        'auth.register.hasAccount': 'Already have an account?',
        'auth.register.success': 'Account created!',
        'auth.register.successDescription': 'Welcome to Cannabis Flower On Nut',
        'auth.register.goLogin': 'Continue to sign in',
        'auth.required': 'Please complete all fields',
        'auth.passwordMismatch': 'Passwords do not match',
        'auth.passwordShort': 'Password must be at least 6 characters',
        'auth.genericError': 'Something went wrong. Please try again.',
        'auth.connectionError': 'Connection failed',
        'auth.checking': 'Checking...',
        'auth.registering': 'Creating account...',

        'admin.confirm.title': 'Confirm action',
        'admin.confirm.message': 'Are you sure you want to continue?',
        'admin.login.heading': 'Run your store',
        'admin.login.headingAccent': 'from one place',
        'admin.login.description': 'Track sales, manage products, update stock, and control payment channels for Cannabis Flower On Nut.',
        'admin.login.title': 'Admin sign in',
        'admin.login.placeholder': 'Enter admin password',
        'admin.login.submit': 'Enter dashboard →',
        'admin.login.error': 'Incorrect password.',
        'admin.nav.aria': 'Admin navigation',
        'admin.nav.overview': 'Overview',
        'admin.nav.products': 'Products',
        'admin.nav.bulk': 'Price / Stock',
        'admin.nav.store': 'View storefront ↗',
        'admin.nav.logout': 'Sign out',
        'admin.overview.title': "Today's store overview",
        'admin.overview.description': 'Sales, orders, and products that need attention in one view.',
        'admin.overview.live': 'Live from Google Sheets',
        'admin.metric.today': "Today's sales",
        'admin.metric.month': 'Sales this month',
        'admin.metric.week': 'Sales this week',
        'admin.metric.average': 'Average order value',
        'admin.metric.loading': 'Loading...',
        'admin.chart.sales': 'Sales trend',
        'admin.chart.top': 'Top products',
        'admin.orders.recent': 'Recent orders',
        'admin.orders.refresh': 'Refresh',
        'admin.orders.date': 'Date',
        'admin.orders.customer': 'Customer (phone)',
        'admin.orders.total': 'Total',
        'admin.orders.shipping': 'Delivery:',
        'admin.orders.print': '🖨️ Print',
        'admin.orders.slip': '📄 View slip',
        'admin.orders.receive': '✅ Mark paid',
        'admin.orders.ship': '🚚 Ship',
        'admin.orders.pending': 'Pending',
        'admin.orders.paid': 'Paid',
        'admin.orders.inTransit': 'In transit',
        'admin.orders.transfer': 'Bank transfer',
        'admin.orders.cod': 'Cash on delivery',
        'admin.products.heading': 'All products',
        'admin.products.deleteAll': 'Delete all products',
        'admin.products.add': 'Add product',
        'admin.products.image': 'Image',
        'admin.products.name': 'Product name',
        'admin.products.category': 'Category',
        'admin.products.variants': 'Variants',
        'admin.products.startPrice': 'Starting price',
        'admin.products.totalStock': 'Total stock',
        'admin.products.available': 'In stock',
        'admin.products.out': 'Out of stock',
        'admin.bulk.heading': 'Bulk price / stock editor',
        'admin.bulk.saveAll': '💾 Save all',
        'admin.bulk.priceHeading': '⚡ Adjust all prices (store margin)',
        'admin.bulk.stockHeading': '📦 Adjust all stock',
        'admin.bulk.applyAll': 'Apply to all',
        'admin.bulk.size': 'Size',
        'admin.promptpay.heading': 'Manage PromptPay accounts',
        'admin.promptpay.sync': '🔄 Sync to Sheets',
        'admin.promptpay.add': 'Add PromptPay',
        'admin.promptpay.accountName': 'Account name',
        'admin.promptpay.bank': 'Bank',
        'admin.promptpay.accountNumber': 'Account number',
        'admin.promptpay.none': 'No PromptPay accounts yet',
        'admin.promptpay.active': '✓ Active',
        'admin.promptpay.inactive': '○ Inactive',
        'admin.form.productName': 'Product name *',
        'admin.form.category': 'Category *',
        'admin.form.variants': 'Size, price, and stock options *',
        'admin.form.variant': 'Variant/Size',
        'admin.form.addVariant': 'Add price/size option',
        'admin.form.description': 'Description',
        'admin.form.tags': 'Tags (comma-separated)',
        'admin.form.image': 'Product image',
        'admin.form.saveChanges': 'Save changes',
        'admin.form.itemsUnit': 'items',
        'admin.toast.loginSuccess': 'Signed in successfully',
        'admin.toast.wrongPassword': 'Incorrect password.',
        'admin.dynamic.todayOrders': '{{count}} orders today',
        'admin.dynamic.orders': '{{count}} orders',
        'admin.dynamic.lifetime': 'Lifetime total ฿{{total}}',
        'admin.dynamic.loading': 'Loading...',
        'admin.dynamic.noProducts': 'No products',
        'admin.dynamic.loadError': 'Could not load data'
    }
};

let currentLanguage = null;
let initialized = false;
let observer = null;
const textNodeKeys = new WeakMap();
const attributeKeys = new WeakMap();

function normalizeLanguage(language) {
    return SUPPORTED_LANGUAGES.includes(language) ? language : 'th';
}

function buildLiteralIndex() {
    return new Map(Object.entries(translations.th)
        .filter(([, value]) => typeof value === 'string' && !value.includes('{{') && !value.includes('<'))
        .map(([key, value]) => [value, key]));
}

const literalIndex = buildLiteralIndex();

export function getLanguage() {
    if (currentLanguage) return currentLanguage;
    try {
        currentLanguage = normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
    } catch {
        currentLanguage = 'th';
    }
    return currentLanguage;
}

export function t(key, variables = {}) {
    const language = getLanguage();
    const value = translations[language]?.[key] ?? translations.th[key] ?? key;
    return Object.entries(variables).reduce(
        (result, [name, replacement]) => result.replaceAll(`{{${name}}}`, String(replacement)),
        value
    );
}

function rememberAttributeKey(element, attribute, key) {
    const stored = attributeKeys.get(element) || {};
    stored[attribute] = key;
    attributeKeys.set(element, stored);
}

function translateAttribute(element, attribute, explicitKey = '') {
    const stored = attributeKeys.get(element) || {};
    const currentValue = element.getAttribute(attribute);
    const key = explicitKey || stored[attribute] || literalIndex.get(currentValue);
    if (!key) return;
    rememberAttributeKey(element, attribute, key);
    const translated = t(key);
    if (currentValue !== translated) element.setAttribute(attribute, translated);
}

function translateTextNode(node) {
    const raw = node.nodeValue || '';
    const trimmed = raw.trim();
    if (!trimmed) return;
    const key = textNodeKeys.get(node) || literalIndex.get(trimmed);
    if (!key) return;
    textNodeKeys.set(node, key);
    const prefix = raw.slice(0, raw.indexOf(trimmed));
    const suffix = raw.slice(raw.indexOf(trimmed) + trimmed.length);
    const translated = `${prefix}${t(key)}${suffix}`;
    if (node.nodeValue !== translated) node.nodeValue = translated;
}

function translateExplicitElement(element) {
    const textKey = element.dataset.i18n;
    const htmlKey = element.dataset.i18nHtml;
    if (textKey) element.textContent = t(textKey);
    if (htmlKey) element.innerHTML = t(htmlKey);
    translateAttribute(element, 'placeholder', element.dataset.i18nPlaceholder);
    translateAttribute(element, 'aria-label', element.dataset.i18nAria);
    translateAttribute(element, 'title', element.dataset.i18nTitle);
}

function updateLanguageButtons(root = document) {
    root.querySelectorAll?.('[data-language-option]').forEach((button) => {
        const isActive = button.dataset.languageOption === getLanguage();
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

export function applyTranslations(root = document) {
    if (!root) return;
    const rootElement = root.nodeType === Node.ELEMENT_NODE ? root : null;
    if (rootElement) translateExplicitElement(rootElement);
    root.querySelectorAll?.('[data-i18n], [data-i18n-html], [data-i18n-placeholder], [data-i18n-aria], [data-i18n-title]')
        .forEach(translateExplicitElement);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
        const parentTag = node.parentElement?.tagName;
        if (!['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parentTag)) translateTextNode(node);
        node = walker.nextNode();
    }

    const elements = [];
    if (rootElement) elements.push(rootElement);
    root.querySelectorAll?.('[placeholder], [aria-label], [title]').forEach((element) => elements.push(element));
    elements.forEach((element) => {
        translateAttribute(element, 'placeholder');
        translateAttribute(element, 'aria-label');
        translateAttribute(element, 'title');
    });
    updateLanguageButtons(root.nodeType === Node.DOCUMENT_NODE ? root : document);
}

export function setLanguage(language) {
    const nextLanguage = normalizeLanguage(language);
    currentLanguage = nextLanguage;
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
        // Browser privacy mode can block storage; the current page still switches language.
    }
    document.documentElement.lang = nextLanguage;
    applyTranslations(document);
    document.dispatchEvent(new CustomEvent('cf:languagechange', { detail: { language: nextLanguage } }));
}

export function initI18n() {
    if (initialized) {
        applyTranslations(document);
        return;
    }
    initialized = true;
    document.documentElement.lang = getLanguage();

    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-language-option]');
        if (button) setLanguage(button.dataset.languageOption);
    });

    observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData') {
                translateTextNode(mutation.target);
                return;
            }
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
                if (node.nodeType === Node.ELEMENT_NODE) applyTranslations(node);
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    applyTranslations(document);
}
