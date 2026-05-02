import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import html2canvas from "html2canvas";
import { QRCode } from "react-qr-code";
import jsPDF from "jspdf";

// Prefix for image URLs stored as /uploads/partners/filename.jpg
// Set VITE_API_BASE_URL in your .env — e.g. VITE_API_BASE_URL=http://localhost:
const SERVER_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const VoucherCards = () => {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cardsPerPage, setCardsPerPage] = useState(2);
  const [currentPage, setCurrentPage] = useState(1);
  const [downloading, setDownloading] = useState(false);

  // UI-only opacity slider — no re-upload needed, image comes from the voucher
  const [bgOpacity, setBgOpacity] = useState(15);

  const cardsRef = useRef([]);
  const buttonRefs = useRef([]);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cardsRes = await api.get(`/voucher/${id}/cards`);
        const vouchersRes = await api.get(`/vouchers`);
        const currentVoucher = vouchersRes.data.find((v) => v._id === id);
        setCards(cardsRes.data);
        setVoucher(currentVoucher);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to fetch data");
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const totalPages = Math.ceil(cards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayCards = cards.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const formatDiscount = () => {
    if (!voucher) return "";
    return voucher.discountPercentage === "percentage"
      ? `${voucher.discountValue}% OFF`
      : `PKR ${voucher.discountValue} OFF`;
  };

  // Full URL for the partner image (null if none was uploaded)
  const partnerImageUrl = voucher?.partnerImageUrl
    ? `${SERVER_BASE}${voucher.partnerImageUrl}`
    : null;

  // ── Shared html2canvas config ─────────────────────────────────────────────
  const getCanvasOptions = (index) => ({
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    onclone: (clonedDoc) => {
      // If no partner image, force the gradient so the cloned element isn't bare
      if (!partnerImageUrl) {
        const el = clonedDoc.querySelector(`[data-card-index="${index}"]`);
        if (el) {
          el.style.background =
            "linear-gradient(135deg, rgb(254,249,195), rgb(253,230,138))";
        }
      }
    },
  });
  // ─────────────────────────────────────────────────────────────────────────

  const downloadCard = async (index) => {
    const element = cardsRef.current[index];
    const button = buttonRefs.current[index];
    if (!element) return;

    try {
      if (button) button.style.display = "none";
      const canvas = await html2canvas(element, getCanvasOptions(index));
      const link = document.createElement("a");
      link.download = `${displayCards[index].cardNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      if (button) button.style.display = "block";
    } catch (err) {
      console.error("Error downloading card:", err);
      alert(`Failed to download card: ${err.message}`);
      if (button) button.style.display = "block";
    }
  };

  const downloadAllCards = async () => {
    try {
      setDownloading(true);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const cols = 3;
      const rows = Math.ceil(cardsPerPage / cols);
      const margin = 2;
      const gap = 4;
      const cardWidth = (pageWidth - margin * 2) / cols;
      const cardHeight = (pageHeight - margin * 2) / rows;

      for (let i = 0; i < cards.length; i++) {
        const element = cardsRef.current[i];
        const button = buttonRefs.current[i];
        if (!element) continue;

        if (button) button.style.display = "none";
        const canvas = await html2canvas(element, getCanvasOptions(i));
        if (button) button.style.display = "block";

        const imgData = canvas.toDataURL("image/png");
        const positionOnPage = i % cardsPerPage;
        const col = positionOnPage % cols;
        const row = Math.floor(positionOnPage / cols);

        if (i > 0 && positionOnPage === 0) pdf.addPage();

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        const ratio = Math.min(cardWidth / imgWidth, cardHeight / imgHeight);

        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;

        const x =
          margin + col * (cardWidth + gap) + (cardWidth - finalWidth) / 2;
        const y =
          margin + row * (cardHeight + gap) + (cardHeight - finalHeight) / 2;

        pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
      }

      pdf.save(`voucher-cards-${id}.pdf`);
      alert(
        `Successfully downloaded ${cards.length} cards as PDF (${cardsPerPage} cards per page)!`,
      );
    } catch (err) {
      console.error("Error creating PDF:", err);
      alert(`Failed to create PDF: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading cards...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!voucher)
    return <div className="p-6 text-center">Loading voucher details...</div>;

  return (
    <div className="p-6 mb-10">
      {/* Download overlay */}
      {downloading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center shadow-2xl">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Downloading...
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Please wait while we prepare your PDF...
            </p>
          </div>
        </div>
      )}

      <h2 className="text-3xl font-bold mb-6 text-center text-[#1f2937]">
        {voucher.voucherName || "Voucher Cards"}
      </h2>

      {/* Voucher summary */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Partner:</p>
            <p className="font-semibold">{voucher.shopName}</p>
          </div>
          <div>
            <p className="text-gray-600">Branch:</p>
            <p className="font-semibold">
              {voucher.idName} - {voucher.partnerArea}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Discount:</p>
            <p className="font-semibold text-green-600">{formatDiscount()}</p>
          </div>
          <div>
            <p className="text-gray-600">Expires:</p>
            <p className="font-semibold text-red-600">
              {new Date(voucher.expiryDate).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>

        {voucher.discountType === "specific_tests" &&
          voucher.specificTests?.length > 0 && (
            <div className="mt-3">
              <p className="text-gray-600 text-sm">Valid for:</p>
              <p className="font-semibold text-sm">
                {voucher.specificTests.join(", ")}
              </p>
            </div>
          )}
      </div>

      {/* Controls row */}
      <div className="m-1 flex gap-4 items-center flex-wrap">
        <div>
          <label className="mr-2 font-semibold">Cards per PDF page:</label>
          <select
            value={cardsPerPage}
            onChange={(e) => setCardsPerPage(Number(e.target.value))}
            className="flex gap-2 px-1 py-1 border border-gray-300 rounded"
          >
            <option value={2}>2 cards (2)</option>
            <option value={9}>4 cards (3×2)</option>
            <option value={12}>6 cards (4×3)</option>
          </select>
        </div>

        <button
          onClick={downloadAllCards}
          disabled={downloading}
          className="px-1 py-1 bg-[#22c55e] text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#16a34a]"
        >
          {downloading
            ? "Downloading..."
            : `Download All as PDF (${cards.length} cards)`}
        </button>
      </div>

      {/* Cards grid */}
      <main className="  ">
        <div className="grid grid-cols-1 md:grid-cols-4  gap-2 my-2 relative">
          {displayCards.map((card, index) => (
            <div
              key={card.cardNumber}
              ref={(el) => (cardsRef.current[index] = el)}
              data-card-index={index}
              className="relative   w-[30rem] h-[55rem] rounded-xl  flex  flex-col  justify-center"
            >
              <div className="default-img-template">
                {partnerImageUrl && (
                  <img
                    src={partnerImageUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none "
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <div className="card-data relative  p-6 flex flex-col items-center text-center mt-25">
                <div className="QRcode m-3 mt-4">
                  <QRCode value={card.qrCode} size={300} />
                </div>
                <div className="Qrcode-No absolute top-99">
                  <p className="text-[rgb(31,41,55)] font-semibold mb-1 text-md">
                    {card.cardNumber}
                  </p>
                </div>
                <div className="test-expiry  absolute right-[40px] top-30">
                  <p
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: "right top",
                      whiteSpace: "nowrap",
                    }}
                    className="text-lg text-white font-semibold "
                  >
                    Valid until:{" "}
                    {new Date(voucher.expiryDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div
                  className="download-card mt-128
                 absolute"
                >
                  <button
                    ref={(el) => (buttonRefs.current[index] = el)}
                    onClick={() => downloadCard(index)}
                    className="mt-auto py-2 px-4 bg-[rgb(59,130,246)] text-white rounded border-0 cursor-pointer text-sm font-semibold hover:bg-[rgb(37,99,235)]"
                  >
                    Download Card
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Pagination */}
      {cards.length > itemsPerPage && (
        <div className="mt-8 flex justify-between items-center bg-white p-4 rounded shadow">
          <div className="text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, cards.length)} of{" "}
            {cards.length} cards
          </div>
          <div className="flex gap-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="px-4 py-2 bg-gray-100 rounded">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherCards;
