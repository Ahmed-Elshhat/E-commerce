import "./LoadingButton.scss";

function LoadingButton({ width, height }: { width: string; height: string }) {
  return <div className="loading-button" style={{ width, height }}></div>;
}

export default LoadingButton;
