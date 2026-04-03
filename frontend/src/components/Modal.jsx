import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ children, onClose }) {
  useEffect(() => {
    window.setModalOpen(true);
    return () => window.setModalOpen(false);
  }, []);

  const mountNode = document.getElementById("modal-root");
  if (!mountNode) {
    console.warn("Modal: modal-root not found in DOM");
    return null;
  }

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 32,
        background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    mountNode
  );
}

export function DrawerModal({ children, onClose }) {
  useEffect(() => {
    window.setModalOpen(true);
    return () => window.setModalOpen(false);
  }, []);

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ height: "100%" }}>
        {children}
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}
