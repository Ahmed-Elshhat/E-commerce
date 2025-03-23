import { useState } from "react";
import "./CopyButton.scss";
import { FaCheck } from "react-icons/fa";
import { GoCopy } from "react-icons/go";
import { useTranslation } from "react-i18next";

function CopyButton({ couponId }: { couponId: string }) {
  const [copied, setCopied] = useState({
    status: false,
    id: "",
  });

  const { t } = useTranslation();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ status: true, id: text });
      setTimeout(() => setCopied({ status: false, id: text }), 1000);
    } catch (err) {
      console.error("فشل النسخ:", err);
    }
  };

  return (
    <button
      onClick={() => copyToClipboard(couponId)}
      className={`copy-btn ${
        copied.status && copied.id === couponId ? "copied" : ""
      }`}
      title={`ID: ${couponId}`}
    >
      {copied.status && copied.id === couponId
        ? t("dashboard.copiedButton")
        : t("dashboard.copyButton")}
      {copied.status && copied.id === couponId ? <FaCheck /> : <GoCopy />}
    </button>
  );
}

export default CopyButton;
