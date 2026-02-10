import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import html2canvas from "html2canvas";
import { QRCode } from "react-qr-code";
import jsPDF from "jspdf";

const VoucherCards = () => {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cardsPerPage, setCardsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsRef = useRef([]);
  const buttonRefs = useRef([]);

  const itemsPerPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cards
        const cardsRes = await api.get(`/voucher/${id}/cards`);

        // Fetch all vouchers to get the voucher details
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

  // Pagination logic
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

  const downloadCard = async (index) => {
    const element = cardsRef.current[index];
    const button = buttonRefs.current[index];
    if (!element) return;

    try {
      if (button) button.style.display = "none";

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector(
            `[data-card-index="${index}"]`,
          );
          if (clonedElement) {
            clonedElement.style.background =
              "linear-gradient(135deg, rgb(254, 249, 195), rgb(253, 230, 138))";
          }
        },
      });

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
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      let cols, rows;
      if (cardsPerPage === 6) {
        cols = 2;
        rows = 3;
      } else if (cardsPerPage === 8) {
        cols = 2;
        rows = 4;
      } else {
        cols = 2;
        rows = 3;
      }

      const cardWidth = (pageWidth - 20) / cols;
      const cardHeight = (pageHeight - 20) / rows;
      const margin = 10;

      for (let i = 0; i < cards.length; i++) {
        const element = cardsRef.current[i];
        const button = buttonRefs.current[i];

        if (!element) continue;

        if (button) button.style.display = "none";

        const canvas = await html2canvas(element, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector(
              `[data-card-index="${i}"]`,
            );
            if (clonedElement) {
              clonedElement.style.background =
                "linear-gradient(135deg, rgb(254, 249, 195), rgb(253, 230, 138))";
            }
          },
        });

        if (button) button.style.display = "block";

        const imgData = canvas.toDataURL("image/png");
        const positionOnPage = i % cardsPerPage;
        const col = positionOnPage % cols;
        const row = Math.floor(positionOnPage / cols);

        if (i > 0 && positionOnPage === 0) {
          pdf.addPage();
        }

        const x = margin + col * cardWidth;
        const y = margin + row * cardHeight;

        pdf.addImage(imgData, "PNG", x, y, cardWidth - 2, cardHeight - 2);
      }

      pdf.save(`voucher-cards-${id}.pdf`);
      alert(
        `Successfully downloaded ${cards.length} cards as PDF (${cardsPerPage} cards per page)!`,
      );
    } catch (err) {
      console.error("Error creating PDF:", err);
      alert(`Failed to create PDF: ${err.message}`);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading cards...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!voucher)
    return <div className="p-6 text-center">Loading voucher details...</div>;

  return (
    <div className="p-6 mb-10">
      <h2
        className="text-3xl font-bold mb-6 text-center"
        style={{ color: "#1f2937" }}
      >
        Voucher Cards
      </h2>

      {/* Voucher Summary */}
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
            <p className="font-semibold text-green-600">
              {voucher.discountPercentage}%
            </p>
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

      <div className="mb-6 flex gap-4 items-center">
        <div>
          <label className="mr-2 font-semibold">Cards per PDF page:</label>
          <select
            value={cardsPerPage}
            onChange={(e) => setCardsPerPage(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            <option value={6}>6 cards (2x3)</option>
            <option value={8}>8 cards (2x4)</option>
          </select>
        </div>

        <button
          onClick={downloadAllCards}
          className="px-6 py-3 rounded transition"
          style={{ backgroundColor: "#22c55e", color: "#ffffff" }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#16a34a")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#22c55e")}
        >
          Download All as PDF ({cards.length} cards)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayCards.map((card, index) => (
          <div
            key={card.cardNumber}
            ref={(el) => (cardsRef.current[index] = el)}
            data-card-index={index}
            style={{
              width: "100%",
              maxWidth: "25rem",
              background:
                "linear-gradient(135deg, rgb(254, 249, 195), rgb(253, 230, 138))",
              border: "2px solid rgb(250, 204, 21)",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* Logo */}
            <img
              src="/imgs/Logo.jpg"
              alt="Baitusslam Logo"
              style={{ width: "80px", height: "80px", marginBottom: "12px" }}
              crossOrigin="anonymous"
            />

            {/* Title */}
            <h1
              style={{
                fontSize: "2.25rem",
                fontWeight: "bold",
                color: "rgb(113, 63, 18)",
                marginBottom: "4px",
              }}
            >
              Baitusslam
            </h1>

            {/* Subtitle */}
            <p
              style={{
                color: "rgb(55, 65, 81)",
                fontStyle: "italic",
                marginBottom: "12px",
                fontSize: "0.875rem",
              }}
            >
              Es Ramzan apki sehat ka Zamin
            </p>

            {/* Partner Name */}
            <p
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                marginBottom: "4px",
                color: "rgb(17, 24, 39)",
              }}
            >
              {card.shopName}
            </p>

            {/* Branch Info */}
            <p
              style={{
                fontSize: "0.75rem",
                color: "rgb(75, 85, 99)",
                marginBottom: "8px",
              }}
            >
              {voucher.idName} - {voucher.partnerArea}
            </p>

            {/* Discount Box */}
            <div
              style={{
                backgroundColor: "rgb(220, 252, 231)",
                padding: "10px 20px",
                borderRadius: "0.5rem",
                marginBottom: "12px",
                border: "2px solid rgb(34, 197, 94)",
                width: "100%",
              }}
            >
              <p
                style={{
                  fontSize: "1.75rem",
                  fontWeight: "bold",
                  color: "rgb(22, 163, 74)",
                  marginBottom: "2px",
                }}
              >
                {voucher.discountPercentage}% OFF
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "rgb(55, 65, 81)",
                }}
              >
                {voucher.discountType === "all_tests"
                  ? "On All Tests"
                  : "On Specific Tests"}
              </p>
            </div>

            {/* Specific Tests (if applicable) */}
            {voucher.discountType === "specific_tests" &&
              voucher.specificTests?.length > 0 && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "8px",
                    backgroundColor: "rgb(254, 252, 232)",
                    borderRadius: "0.375rem",
                    width: "100%",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      color: "rgb(113, 63, 18)",
                      marginBottom: "4px",
                    }}
                  >
                    Valid for:
                  </p>
                  <p
                    style={{
                      fontSize: "0.65rem",
                      color: "rgb(55, 65, 81)",
                      lineHeight: "1.3",
                    }}
                  >
                    {voucher.specificTests.join(", ")}
                  </p>
                </div>
              )}

            {/* Expiry Date */}
            <p
              style={{
                fontSize: "0.75rem",
                color: "rgb(185, 28, 28)",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Valid until:{" "}
              {new Date(voucher.expiryDate).toLocaleDateString("en-GB")}
            </p>

            {/* Main Message */}
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "rgb(22, 163, 74)",
                marginBottom: "8px",
                lineHeight: "1.3",
              }}
            >
              Apki Dawa <br /> Ghareeb ki Madad
            </p>

            {/* Zakat Message */}
            <p
              style={{
                color: "rgb(55, 65, 81)",
                fontSize: "0.75rem",
                marginBottom: "16px",
              }}
            >
              Apki zakat/khairat ka behatreen masraf
            </p>

            {/* QR Code */}
            <div style={{ marginBottom: "12px" }}>
              <QRCode value={card.qrCode} size={120} />
            </div>

            {/* Card Number */}
            <p
              style={{
                color: "rgb(31, 41, 55)",
                fontWeight: "600",
                marginBottom: "4px",
                fontSize: "0.75rem",
              }}
            >
              {card.cardNumber}
            </p>

            {/* Download Button */}
            <button
              ref={(el) => (buttonRefs.current[index] = el)}
              onClick={() => downloadCard(index)}
              style={{
                marginTop: "auto",
                padding: "0.5rem 1rem",
                backgroundColor: "rgb(59, 130, 246)",
                color: "rgb(255, 255, 255)",
                borderRadius: "0.25rem",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "rgb(37, 99, 235)")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "rgb(59, 130, 246)")
              }
            >
              Download Card
            </button>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
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
