import "./Loading.scss";

function Loading({ transparent }: { transparent: boolean }) {
  return (
    <div
      className="loading-container"
      style={{
        backgroundColor: transparent
          ? "rgba(244, 244, 244, 50%)"
          : "rgba(244, 244, 244)",
      }}
    >
      <div className="spinner"></div>
      <p className="loading-text">Loading...</p>
    </div>
  );
}

export default Loading;
