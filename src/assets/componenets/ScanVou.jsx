import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../../utils/api";
import { useAuth } from "../context/AuthContext";

const ScanVou = () => {
  const { user } = useAuth();
  const [cardData, setCardData] = useState(null);
  const [error, setError] = useState("");
  const [lastScanned, setLastScanned] = useState("");
  const [applying, setApplying] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    if (showManualEntry) return;

    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: 250,
      aspectRatio: 1.0,
    });

    scanner.render(handleScan);
    return () => {
      scanner.clear().catch((err) => console.log(err));
    };
  }, [showManualEntry]);

  const handleScan = async (qrCode) => {
    if (qrCode === lastScanned) return;
    setLastScanned(qrCode);

    try {
      const response = await api.get(`/card/${qrCode}`);
      setCardData(response.data);
      setError("");
    } catch (err) {
      setError("Card not found");
      setCardData(null);
    }
  };

  const handleManualCheck = async () => {
    if (!manualCode.trim()) {
      setError("Please enter a card number");
      return;
    }

    try {
      setError("");
      const response = await api.get(`/card/${manualCode.trim()}`);
      setCardData(response.data);
      setManualCode("");
    } catch (err) {
      setError("Card not found or invalid");
      setCardData(null);
    }
  };

  const applyDiscount = async () => {
    if (cardData.card.status !== "active") {
      alert("⚠️ This card is not active!");
      return;
    }

    const confirmApply = window.confirm(
      `Apply ${cardData.voucher.discountPercentage}% discount?\n\nThis will mark the card as used.`,
    );

    if (!confirmApply) return;

    setApplying(true);
    try {
      await api.post("/use-card", {
        cardNumber: cardData.card.cardNumber,
        usedBy: user?.name || "Unknown",
      });

      const response = await api.get(`/card/${cardData.card.cardNumber}`);
      setCardData(response.data);

      alert("✅ Discount applied successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply discount");
    } finally {
      setApplying(false);
    }
  };

  const scanAgain = () => {
    setCardData(null);
    setError("");
    setLastScanned("");
    setManualCode("");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Camera */}
      <div className="w-1/2 p-6 bg-white flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Scanner</h2>
          <button
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="px-4 py-2 bg-gray-600 text-white  hover:bg-gray-700 text-lg font-bold rounded-2xl "
          >
            {showManualEntry ? "Camera" : "Enter Number"}
          </button>
        </div>

        {showManualEntry ? (
          <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-300">
            <h3 className="font-bold text-xl mb-4">Enter Card Number</h3>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualCheck()}
              placeholder="Card number..."
              className="w-full px-4 py-3 border rounded mb-3 text-lg"
            />
            <button
              onClick={handleManualCheck}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            >
              Check Card
            </button>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
            <div id="qr-reader"></div>
          </div>
        )}
      </div>

      {/* Right: Details */}
      <div className="w-1/2 p-6 bg-gray-100 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">📄 Card Details</h2>

        {applying && (
          <div className="bg-blue-100 text-blue-700 p-4 rounded mb-4 animate-pulse">
            ⏳ Applying discount...
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {!cardData && !error && (
          <p className="text-center text-gray-500 mt-20">
            👆 Scan QR code or enter card number
          </p>
        )}

        {cardData && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold">
                {cardData.voucher.shopName}
              </h3>
              <p className="text-6xl font-bold mt-3">
                {cardData.voucher.discountPercentage}%
              </p>
              <p className="text-sm mt-2 opacity-90">DISCOUNT</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-2">Card Status:</p>
              <span
                className={`inline-block px-6 py-2 rounded-full font-bold text-lg ${
                  cardData.card.status === "active"
                    ? "bg-green-500 text-white"
                    : cardData.card.status === "used"
                      ? "bg-gray-500 text-white"
                      : "bg-red-500 text-white"
                }`}
              >
                {cardData.card.status === "active" && "✓ ACTIVE"}
                {cardData.card.status === "used" && "✓ USED"}
                {cardData.card.status === "expired" && "⌛ EXPIRED"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg shadow space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600 font-medium">Card Number:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {cardData.card.cardNumber}
                </span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600 font-medium">
                  Applicable To:
                </span>
                <span className="text-sm">
                  {cardData.voucher.discountType === "all_tests"
                    ? "All Tests"
                    : cardData.voucher.specificTests.join(", ")}
                </span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600 font-medium">Expires On:</span>
                <span className="text-sm">
                  {new Date(cardData.voucher.expiryDate).toLocaleDateString()}
                </span>
              </div>

              {cardData.card.usedBy && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">Used By:</span>
                  <span className="text-sm">{cardData.card.usedBy}</span>
                </div>
              )}

              {cardData.card.usedAt && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600 font-medium">Used At:</span>
                  <span className="text-sm">
                    {new Date(cardData.card.usedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {cardData.card.status === "active" && (
              <button
                onClick={applyDiscount}
                disabled={applying}
                className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg shadow-lg disabled:bg-gray-400"
              >
                {applying ? "⏳ Applying..." : "Redeem Discount"}
              </button>
            )}

            {cardData.card.status === "used" && (
              <div className="bg-gray-100 border-2 border-gray-400 text-gray-700 p-4 rounded-lg font-semibold text-center">
                ✓ Already Redeemed
              </div>
            )}

            {cardData.card.status === "expired" && (
              <div className="bg-red-100 border-2 border-red-500 text-red-800 p-4 rounded-lg font-semibold text-center">
                This card has expired
              </div>
            )}

            <button
              onClick={scanAgain}
              className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg"
            >
              Check Another Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanVou;
