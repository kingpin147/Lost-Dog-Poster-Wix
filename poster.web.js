import { webMethod, Permissions } from "wix-web-module";
import { mediaManager } from "wix-media-backend";
import { jsPDF } from "jspdf";
import { Buffer } from "buffer";
import axios from "axios";

export const generatePoster = webMethod(Permissions.Anyone, async (formData) => {
  try {
    const data = formData?.formData || formData || {};
    const {
      name = "PET NAME MISSING",
      breed = "Unknown",
      regDetails = "Not provided",
      features = "None specified",
      lastSeenCity = "Unknown",
      lastSeenArea = "Unknown",
      landmark = "Not specified",
      phoneNumber = "000-000-0000",
      imageUrl
    } = data;

    // === Initialize PDF (A5-like size) ===
    const docWidth = 420;
    const docHeight = 595;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [docWidth, docHeight],
      hotfixes: ["px_scaling"]
    });

    // ========== 1) LARGE RED HEADER ===========
    // Increase header height to 100 (instead of 80)
    const headerHeight = 100;
    doc.setFillColor(220, 20, 60); // "Crimson" red
    doc.rect(0, 0, docWidth, headerHeight, "F");

    // Increase the “MISSING!” font size and adjust its Y position
    doc.setFont("helvetica", "bold");
    doc.setFontSize(60);
    doc.setTextColor(255, 255, 255);
    // Positioning "MISSING!" roughly centered vertically in the header:
    doc.text("MISSING!", docWidth / 2, headerHeight / 2 + 15, { align: "center" });

    // ========== 2) PET NAME ===========
    doc.setFontSize(28);
    doc.setTextColor(220, 20, 60);
    doc.text(name.toUpperCase(), 30, 130);

    // ========== 3) IMAGE BOX ==========
    const imgBoxX = 30;
    const imgBoxY = 160;
    const imgBoxW = 160;
    const imgBoxH = 200;

    doc.setLineWidth(2);
    doc.setDrawColor(0, 0, 0);
    doc.rect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, "S");

    const addImagePlaceholder = () => {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("IMAGE NOT AVAILABLE", imgBoxX + 15, imgBoxY + imgBoxH / 2, {
        align: "left"
      });
    };

    // If we have imageUrl, try fetching the image & adding it
    if (imageUrl) {
      try {
        const response = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          headers: { "Content-Type": "image/*" }
        });
        const base64String = Buffer.from(response.data).toString("base64");
        const imgData = `data:image/jpeg;base64,${base64String}`;
        doc.addImage(imgData, "JPEG", imgBoxX + 2, imgBoxY + 2, imgBoxW - 4, imgBoxH - 4);
      } catch (e) {
        console.error("Image fetch failed:", e.message);
        addImagePlaceholder();
      }
    } else {
      addImagePlaceholder();
    }

    // ========== 4) PET INFO ==========
    let infoX = imgBoxX + imgBoxW + 20;
    let infoY = 170;
    const lineHeight = 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);

    const drawInfoLine = (label, value) => {
      const text = `${label}: ${value}`;
      doc.text(text, infoX, infoY);
      infoY += 2;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(infoX, infoY, infoX + 180, infoY);
      infoY += lineHeight - 2;
    };

    // For example, hard-coded "Dog" for Type (adjust as needed)
    drawInfoLine("Type", "Dog");
    drawInfoLine("Breed", breed);
    drawInfoLine("Reg. ", regDetails);

    // Distinctive Features (multi-line)
    const featuresLabel = `Distinctive Features: ${features}`;
    const featuresLines = doc.splitTextToSize(featuresLabel, 180);
    doc.text(featuresLines, infoX, infoY);
    infoY += featuresLines.length * lineHeight;
    doc.line(infoX, infoY - 5, infoX + 180, infoY - 5);
    infoY += 5;

    // ========== 5) LAST SEEN ==========
    doc.setFillColor(220, 20, 60);
    const lastSeenBarHeight = 20;
    doc.rect(infoX, infoY, 180, lastSeenBarHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("LAST SEEN", infoX + 10, infoY + 15);
    infoY += (lastSeenBarHeight + 20); // extra spacing

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);

    drawInfoLine("City", lastSeenCity);
    drawInfoLine("Area", lastSeenArea);

    const landmarkLabel = `Landmark: ${landmark}`;
    const landmarkLines = doc.splitTextToSize(landmarkLabel, 180);
    doc.text(landmarkLines, infoX, infoY);
    infoY += landmarkLines.length * lineHeight;
    doc.line(infoX, infoY - 5, infoX + 180, infoY - 5);
    infoY += 5;

    // ========== 6) FOOTER ==========
    // Increase footer height to 100 to give more room
    const footerHeight = 100;
    const footerY = docHeight - footerHeight;

    doc.setFillColor(220, 20, 60);
    doc.rect(0, footerY, docWidth, footerHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);

    // "CALL WITH ANY INFORMATION" line (positioned in the upper part of the footer)
    doc.setFontSize(16);
    const callText = "CALL WITH ANY INFORMATION";
    const callTextWidth = doc.getTextWidth(callText);
    doc.text(callText, (docWidth / 2) - (callTextWidth / 2), footerY + 35);

    // Phone number line (positioned a bit lower)
    doc.setFontSize(22);
    const cleanPhone = phoneNumber.replace(/\s+/g, " ").trim();
    const phoneWidth = doc.getTextWidth(cleanPhone);
    doc.text(cleanPhone, (docWidth / 2) - (phoneWidth / 2), footerY + 65);

    // Optional small brand note at the very bottom
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      "Created on lostpetsdubai.com", 
      docWidth - 10, 
      docHeight - 10, 
      { align: "right" }
    );

    // ========== 7) UPLOAD & RETURN ==========
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const uploadedFile = await mediaManager.upload(
      "Lost-Dogs",
      pdfBuffer,
      `${name}-poster-${Date.now()}.pdf`,
      {
        mediaOptions: { mimeType: "application/pdf" },
        metadataOptions: { isPrivate: false }
      }
    );

    const downloadUrl = await mediaManager.getDownloadUrl(uploadedFile.fileUrl, 86400);

    return {
      success: true,
      downloadUrl,
      fileUrl: uploadedFile.fileUrl
    };

  } catch (error) {
    console.error("Poster generation failed:", error.message);
    return {
      success: false,
      error: error.message || "Failed to generate poster. Check input data and try again."
    };
  }
});
