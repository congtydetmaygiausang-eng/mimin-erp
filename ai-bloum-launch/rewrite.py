"""Rewrite landing page copy: simpler, modern, refined, easy-to-read Vietnamese.
Style direction: Apple/Notion/Linear minimal — short, direct, confident.
Preserves all CSS, structure, IDs, classes. Only changes visible text content.
"""
import re
from pathlib import Path

FILE = Path(r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\ai-bloum-launch\index.html")
src = FILE.read_text(encoding="utf-8")

# ============================================================
# HERO
# ============================================================
src = src.replace(
    '<span>Tổng tin · 19.08.2026 · MIMIN × POLOMIMIN</span>',
    '<span>TỔNG TIN · 19.08.2026</span>'
)

src = src.replace(
    """      <h1 class="hero__title">
        Khi chủ xưởng may<br />
        <em>mất ngủ vì hàng tồn</em>
      </h1>

      <p class="hero__sub">
        70% chủ xưởng đang gồng gánh 7 nỗi lo cùng lúc — giá cao bán không được,
        hàng ế chất kho, nợ không trả được, không biết tìm xưởng ở đâu.
        MIMIN thấu hiểu — và giải quyết.
      </p>""",
    """      <h1 class="hero__title">
        AI cho<br />
        <em>chủ xưởng may.</em>
      </h1>

      <p class="hero__sub">
        AI Bloum — trợ lý 24/7. Chọn vải, đặt nhuộm, theo dõi đơn.
        Nói tiếng Việt, như nhắn Zalo.
      </p>"""
)

src = src.replace(
    """      <div class="hero__ctas">
        <a href="#solution" class="btn btn--primary">
          Xem AI Bloum giải quyết
          <span class="btn__arrow">→</span>
        </a>
        <a href="#cta" class="btn btn--ghost">
          Đặt lịch demo 1-1
        </a>
      </div>""",
    """      <div class="hero__ctas">
        <a href="#solution" class="btn btn--primary">
          Xem cách dùng
          <span class="btn__arrow">→</span>
        </a>
        <a href="#cta" class="btn btn--ghost">
          Dùng thử miễn phí
        </a>
      </div>"""
)

# Ticker — simpler set
src = src.replace(
    """      <div class="ticker__item">POLOMIMIN</div>
      <div class="ticker__item">MIMIN ERP</div>
      <div class="ticker__item">AI BLOUM</div>
      <div class="ticker__item">GIAU SANG TEXTILE</div>
      <div class="ticker__item">12+ NĂM KINH NGHIỆM</div>
      <div class="ticker__item">100+ XƯỞNG TIN DÙNG</div>
      <div class="ticker__item">POLOMIMIN</div>
      <div class="ticker__item">MIMIN ERP</div>
      <div class="ticker__item">AI BLOUM</div>
      <div class="ticker__item">GIAU SANG TEXTILE</div>
      <div class="ticker__item">12+ NĂM KINH NGHIỆM</div>
      <div class="ticker__item">100+ XƯỞNG TIN DÙNG</div>""",
    """      <div class="ticker__item">POLOMIMIN</div>
      <div class="ticker__item">MIMIN ERP</div>
      <div class="ticker__item">AI BLOUM</div>
      <div class="ticker__item">12+ NĂM</div>
      <div class="ticker__item">100+ XƯỞNG</div>
      <div class="ticker__item">24/7</div>
      <div class="ticker__item">POLOMIMIN</div>
      <div class="ticker__item">MIMIN ERP</div>
      <div class="ticker__item">AI BLOUM</div>
      <div class="ticker__item">12+ NĂM</div>
      <div class="ticker__item">100+ XƯỞNG</div>
      <div class="ticker__item">24/7</div>"""
)

# ============================================================
# PAIN SECTION
# ============================================================
src = src.replace(
    """      <div class="reveal">
        <span class="section__eyebrow">① Thực trạng ngành may</span>
        <h2 class="section__title pain__title">
          7 nỗi lo<br />
          <em>không bao giờ ngủ</em><br />
          của chủ xưởng
        </h2>
      </div>
      <p class="pain__intro reveal reveal--delay-2">
        Mỗi sáng thức dậy, bạn mở mắt ra đã thấy một đống vấn đề chồng chất.
        Chúng tôi đã nghe đủ — từ Bình Dương đến Bắc Ninh — và biết bạn
        không cô đơn.
      </p>""",
    """      <div class="reveal">
        <span class="section__eyebrow">① Vấn đề thường gặp</span>
        <h2 class="section__title pain__title">
          Bảy điều<br />
          <em>chủ xưởng hay gặp.</em>
        </h2>
      </div>
      <p class="pain__intro reveal reveal--delay-2">
        Không phải lỗi của bạn. Vì chưa có công cụ đúng.
      </p>"""
)

# 7 pain cards — simplify labels and texts, remove quotes for cleaner look
src = src.replace(
    """      <article class="pain__card reveal">
        <span class="pain__card-number">01</span>
        <span class="pain__card-label">Giá cả</span>
        <p class="pain__card-text">Hàng giá cao quá — bán không được.</p>
        <p class="pain__card-quote">"Tiền xưởng nào giá cũng cao hết"</p>
      </article>

      <article class="pain__card reveal reveal--delay-1">
        <span class="pain__card-number">02</span>
        <span class="pain__card-label">Bán không được</span>
        <p class="pain__card-text">Cao quá nên hàng ế, đại lý không lấy.</p>
        <p class="pain__card-quote">"Trả lời tin nhắn mỏi tay mà đơn vẫn 0"</p>
      </article>

      <article class="pain__card reveal reveal--delay-2">
        <span class="pain__card-number">03</span>
        <span class="pain__card-label">Hàng ế</span>
        <p class="pain__card-text">Kho chất đầy — không biết xoay sở thế nào.</p>
        <p class="pain__card-quote">"Vốn nằm trong kho, không quay được"</p>
      </article>

      <article class="pain__card reveal reveal--delay-3">
        <span class="pain__card-number">04</span>
        <span class="pain__card-label">Không có tiền</span>
        <p class="pain__card-text">Nợ lời khách, nợ lương công nhân, nợ nhà cung cấp.</p>
        <p class="pain__card-quote">"Không có tiền trả cho người này người kia"</p>
      </article>

      <article class="pain__card reveal">
        <span class="pain__card-number">05</span>
        <span class="pain__card-label">Tìm xưởng</span>
        <p class="pain__card-text">Đặt hàng thì không biết tìm ở đâu cho uy tín.</p>
        <p class="pain__card-quote">"Mở Google ra 1000 kết quả — không biết tin ai"</p>
      </article>

      <article class="pain__card reveal reveal--delay-1">
        <span class="pain__card-number">06</span>
        <span class="pain__card-label">Kinh nghiệm</span>
        <p class="pain__card-text">Mới vào nghề, mọi thứ đều lạ — chới với.</p>
        <p class="pain__card-quote">"Hỏi ai cũng ngại, tự làm thì sai"</p>
      </article>

      <article class="pain__card reveal reveal--delay-2">
        <span class="pain__card-number">07</span>
        <span class="pain__card-label">Sản phẩm không đẹp</span>
        <p class="pain__card-text">
          Mẫu mã không cạnh tranh, khách cứ chê — bạn không biết sửa chỗ nào.
        </p>
        <p class="pain__card-quote">"Mình biết sản phẩm xấu, nhưng không biết sửa sao"</p>
      </article>""",
    """      <article class="pain__card reveal">
        <span class="pain__card-number">01</span>
        <span class="pain__card-label">Giá</span>
        <p class="pain__card-text">Hàng giá cao. Bán khó.</p>
      </article>

      <article class="pain__card reveal reveal--delay-1">
        <span class="pain__card-number">02</span>
        <span class="pain__card-label">Đơn ế</span>
        <p class="pain__card-text">Khách không hỏi. Đơn về 0.</p>
      </article>

      <article class="pain__card reveal reveal--delay-2">
        <span class="pain__card-number">03</span>
        <span class="pain__card-label">Hàng tồn</span>
        <p class="pain__card-text">Kho đầy. Vốn kẹt.</p>
      </article>

      <article class="pain__card reveal reveal--delay-3">
        <span class="pain__card-number">04</span>
        <span class="pain__card-label">Tiền</span>
        <p class="pain__card-text">Dòng tiền khó. Nợ chồng nợ.</p>
      </article>

      <article class="pain__card reveal">
        <span class="pain__card-number">05</span>
        <span class="pain__card-label">Tìm xưởng</span>
        <p class="pain__card-text">Không biết NCC nào uy tín.</p>
      </article>

      <article class="pain__card reveal reveal--delay-1">
        <span class="pain__card-number">06</span>
        <span class="pain__card-label">Kinh nghiệm</span>
        <p class="pain__card-text">Mới vào nghề. Chưa rõ quy trình.</p>
      </article>

      <article class="pain__card reveal reveal--delay-2">
        <span class="pain__card-number">07</span>
        <span class="pain__card-label">SP chưa đẹp</span>
        <p class="pain__card-text">
          Mẫu mã chưa cạnh tranh.
        </p>
      </article>"""
)

# ============================================================
# PIVOT
# ============================================================
src = src.replace(
    """    <div class="pivot__badge reveal">
      <span class="pivot__badge-dot"></span>
      <span>MỚI · BETA RA MẮT 2026</span>
    </div>
    <h2 class="pivot__title reveal reveal--delay-1">
      MIMIN ra mắt<br />
      <em>AI Bloum</em> — trợ lý sản xuất 24/7
    </h2>
    <p class="pivot__sub reveal reveal--delay-2">
      Một AI biết ngành dệt may, giúp bạn chọn sợi, đặt nhuộm, cắt may —
      chỉ với vài cú chạm. Nói chuyện bằng tiếng Việt như nhắn Zalo.
    </p>""",
    """    <div class="pivot__badge reveal">
      <span class="pivot__badge-dot"></span>
      <span>MỚI · 2026</span>
    </div>
    <h2 class="pivot__title reveal reveal--delay-1">
      <em>AI Bloum.</em><br />
      Trợ lý sản xuất 24/7.
    </h2>
    <p class="pivot__sub reveal reveal--delay-2">
      Một AI biết ngành may. Nói tiếng Việt, như nhắn Zalo.
    </p>"""
)

# ============================================================
# FEATURE 1: CHỌN SỢI
# ============================================================
src = src.replace(
    """          <span class="feature__eyebrow">
            <span class="feature__eyebrow-num">01</span>
            <span>Chọn sợi thông minh</span>
          </span>
          <h3 class="feature__title">
            AI so sánh 10+ nhà cung cấp<br />
            <em>trong 5 giây</em>
          </h3>
          <p class="feature__body">
            Bạn chỉ cần nói: <strong>"Cotton 65/35, pique 2 chiều, 1.000 áo, deadline 3 tuần."</strong>
            AI Bloum thu thập giá, lead time, chất lượng từ 10+ NCC uy tín
            (Tân Thành, Phúc An, Việt Hưng, Đại Hà…) và đề xuất nhà cung cấp
            tốt nhất theo tiêu chí của bạn.
          </p>
          <ul class="feature__list">
            <li>So sánh giá theo thời gian thực</li>
            <li>Đánh giá chất lượng từ khách hàng cũ</li>
            <li>Cảnh báo NCC giao chậm, hàng lỗi</li>
            <li>Đàm phán tự động theo ngân sách</li>
          </ul>""",
    """          <span class="feature__eyebrow">
            <span class="feature__eyebrow-num">01</span>
            <span>Chọn sợi</span>
          </span>
          <h3 class="feature__title">
            So sánh 10+ NCC<br />
            <em>trong 5 giây.</em>
          </h3>
          <p class="feature__body">
            Bạn nói yêu cầu. AI tìm nhà cung cấp phù hợp nhất.
            Giá, lead time, chất lượng — có hết.
          </p>
          <ul class="feature__list">
            <li>So sánh giá real-time</li>
            <li>Đánh giá từ khách hàng cũ</li>
            <li>Cảnh báo NCC giao chậm</li>
            <li>Đề xuất theo ngân sách</li>
          </ul>"""
)

src = src.replace(
    """            <div class="feature__stat-label">giờ tiết kiệm<br />mỗi đơn hàng</div>""",
    """            <div class="feature__stat-label">tiết kiệm<br />mỗi đơn</div>"""
)

src = src.replace(
    '        <span class="feature__media-tag">📊 Chọn sợi · AI Blooum</span>',
    '        <span class="feature__media-tag">📊 Chọn sợi · AI Bloum</span>'
)

# ============================================================
# FEATURE 2: ĐẶT LỆNH NHUỘM
# ============================================================
src = src.replace(
    """          <span class="feature__eyebrow">
            <span class="feature__eyebrow-num">02</span>
            <span>Đặt lệnh nhuộm 1 chạm</span>
          </span>
          <h3 class="feature__title">
            Xong trước khi<br />
            <em>pha trà xong</em>
          </h3>
          <p class="feature__body">
            Upload ảnh mẫu màu hoặc chọn từ catalog. AI Bloum tự chọn xưởng nhuộm
            tối ưu (An Phát, Nhuộm Bình Dương…), báo giá tức thì, đặt cọc 30%
            tự động. Bạn chỉ cần xác nhận.
          </p>
          <ul class="feature__list">
            <li>3 báo giá từ 3 xưởng cùng lúc</li>
            <li>Màu nhuộm chuẩn OE 100, ISO 9001</li>
            <li>Đặt cọc 30% an toàn — ký quỹ 6 tháng</li>
            <li>Theo dõi realtime đến khi giao hàng</li>
          </ul>""",
    """          <span class="feature__eyebrow">
            <span class="feature__eyebrow-num">02</span>
            <span>Đặt nhuộm</span>
          </span>
          <h3 class="feature__title">
            Xong<br />
            <em>trong 90 giây.</em>
          </h3>
          <p class="feature__body">
            Chọn màu. AI báo giá. Đặt cọc 30%. Xong.
          </p>
          <ul class="feature__list">
            <li>3 báo giá cùng lúc</li>
            <li>Chuẩn OE 100, ISO 9001</li>
            <li>Đặt cọc 30% — ký quỹ 6 tháng</li>
            <li>Theo dõi đến khi giao</li>
          </ul>"""
)

src = src.replace(
    """            <div class="feature__stat-label">đặt lệnh<br />hoàn chỉnh</div>""",
    """            <div class="feature__stat-label">đặt lệnh<br />hoàn tất</div>"""
)

src = src.replace(
    """            <div class="feature__stat-label">phí phạt<br />khi giao chậm</div>""",
    """            <div class="feature__stat-label">phí phạt<br />giao chậm</div>"""
)

src = src.replace(
    '        <span class="feature__media-tag">🎨 Đặt lệnh nhuộm · AI Blooum</span>',
    '        <span class="feature__media-tag">🎨 Đặt nhuộm · AI Bloum</span>'
)

# ============================================================
# STATS STRIP
# ============================================================
src = src.replace(
    """        <p class="stat__label">năm kinh nghiệm<br />dệt may Việt Nam</p>""",
    """        <p class="stat__label">năm kinh nghiệm</p>"""
)

src = src.replace(
    """        <p class="stat__label">xưởng may đã<br />tin dùng MIMIN</p>""",
    """        <p class="stat__label">xưởng tin dùng</p>"""
)

src = src.replace(
    """        <p class="stat__label">giảm chi phí<br />tìm nhà cung cấp</p>""",
    """        <p class="stat__label">giảm chi phí NCC</p>"""
)

src = src.replace(
    """        <p class="stat__label">ngày rút ngắn<br />mỗi đơn hàng</p>""",
    """        <p class="stat__label">ngày rút ngắn / đơn</p>"""
)

# ============================================================
# STEPS
# ============================================================
src = src.replace(
    """        <span class="section__eyebrow" style="text-align:center; display:block;">② Quy trình</span>
        <h2 class="section__title" style="text-align:center; margin: 0 auto 16px;">
          3 bước — đơn giản như <em>nhắn Zalo</em>
        </h2>
        <p class="section__sub" style="text-align:center; margin: 0 auto 60px;">
          Không cần học phần mềm. Không cần đọc hướng dẫn. Cứ nói tiếng Việt như bạn đang nói.
        </p>""",
    """        <span class="section__eyebrow" style="text-align:center; display:block;">② Quy trình</span>
        <h2 class="section__title" style="text-align:center; margin: 0 auto 16px;">
          Ba bước — <em>như nhắn Zalo.</em>
        </h2>
        <p class="section__sub" style="text-align:center; margin: 0 auto 60px;">
          Không cần học. Cứ nói tiếng Việt.
        </p>"""
)

src = src.replace(
    """        <h4 class="step__title">Nhập yêu cầu</h4>
        <p class="step__body">
          Mô tả nhu cầu bằng tiếng Việt tự nhiên: chất vải, số lượng, deadline.
          Có thể kèm ảnh mẫu.
        </p>""",
    """        <h4 class="step__title">Nhập yêu cầu</h4>
        <p class="step__body">
          Mô tả nhu cầu bằng tiếng Việt. Có thể kèm ảnh.
        </p>"""
)

src = src.replace(
    """        <h4 class="step__title">AI đề xuất</h4>
        <p class="step__body">
          AI Bloum tìm nhà cung cấp tối ưu, báo giá, so sánh 3 phương án
          — kèm đánh giá chất lượng.
        </p>""",
    """        <h4 class="step__title">AI đề xuất</h4>
        <p class="step__body">
          Tìm NCC, so sánh, báo giá.
        </p>"""
)

src = src.replace(
    """        <h4 class="step__title">Xác nhận & sản xuất</h4>
        <p class="step__body">
          Một chạm duyệt. MIMIN ERP tự động theo dõi từ cắt → may → ủi → đóng gói → giao hàng.
        </p>""",
    """        <h4 class="step__title">Xác nhận</h4>
        <p class="step__body">
          Một chạm. Theo dõi đến khi giao.
        </p>"""
)

# ============================================================
# FINAL CTA
# ============================================================
src = src.replace(
    """    <h2 class="cta__title reveal">
      Sẵn sàng để chủ xưởng của bạn<br />
      <em>ngủ ngon hơn?</em>
    </h2>
    <p class="cta__sub reveal reveal--delay-1">
      Dùng thử AI Bloum miễn phí 30 ngày. Không cần cài đặt. Không cần thẻ tín dụng.
      Chỉ cần bạn dám thử 1 lần.
    </p>
    <div class="cta__buttons reveal reveal--delay-2">
      <a href="mailto:sang@mimin.vn?subject=Đăng ký dùng thử AI Bloum" class="btn btn--primary">
        Dùng thử AI Bloum miễn phí
        <span class="btn__arrow">→</span>
      </a>
      <a href="tel:0774480916" class="btn btn--ghost">
        📞 Gọi tư vấn 0774.480.916
      </a>
    </div>""",
    """    <h2 class="cta__title reveal">
      Bắt đầu<br />
      <em>ngay hôm nay.</em>
    </h2>
    <p class="cta__sub reveal reveal--delay-1">
      Dùng thử miễn phí 30 ngày. Không cần thẻ.
    </p>
    <div class="cta__buttons reveal reveal--delay-2">
      <a href="mailto:sang@mimin.vn?subject=Đăng ký dùng thử AI Bloum" class="btn btn--primary">
        Dùng thử miễn phí
        <span class="btn__arrow">→</span>
      </a>
      <a href="tel:0774480916" class="btn btn--ghost">
        Gọi 0774.480.916
      </a>
    </div>"""
)

# ============================================================
# FOOTER
# ============================================================
src = src.replace(
    """    <p>12/39 Đường Xuân Thới Thượng 58C, Ấp 7, Xã Bà Điểm, TP.HCM</p>""",
    """    <p>12/39 Xuân Thới Thượng 58C, Bà Điểm, TP.HCM</p>"""
)

# Meta description — also simpler
src = src.replace(
    '<meta name="description" content="AI Bloum — AI agent của MIMIN ERP giúp chủ xưởng may chọn sợi, đặt nhuộm, cắt may chỉ với vài cú chạm. Giải pháp toàn diện cho doanh nghiệp dệt may Việt Nam." />',
    '<meta name="description" content="AI Bloum — trợ lý 24/7 cho chủ xưởng may. Chọn vải, đặt nhuộm, theo dõi đơn. Nói tiếng Việt." />'
)

src = src.replace(
    '<meta property="og:description" content="Khi chủ xưởng may mất ngủ vì hàng tồn — MIMIN ra mắt AI Bloum, AI agent biết ngành dệt may, giải quyết 7 nỗi lo chỉ trong vài cú chạm." />',
    '<meta property="og:description" content="AI cho chủ xưởng may. Trợ lý 24/7. Nói tiếng Việt, như nhắn Zalo." />'
)

# Save
FILE.write_text(src, encoding="utf-8")
print(f"Rewritten. New size: {len(src)} bytes")
print(f"Lines: {src.count(chr(10)) + 1}")
