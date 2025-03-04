import { RedirectPageProps } from "../../Types/app";
import "./RedirectPage.scss";
import { useNavigate } from "react-router-dom";

export default function RedirectPage({
  message,
  dir,
  pageName,
}: RedirectPageProps) {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate(dir, { replace: true });
  };

  return (
    <div className="redirect-container">
      <h1>{message}</h1>
      <button onClick={handleRedirect} className="redirect-button">
        Go To {pageName} Page
      </button>
    </div>
  );
}
