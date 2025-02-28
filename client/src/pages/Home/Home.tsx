import { Link } from "react-router-dom";
import "./Home.scss";

function Home() {
  return (
    <div>
      <h1>لا إله إلا الله</h1>
      <div className="home-links">
        <Link to="/login">Login</Link>
        <Link to="/forgot-password">Forgot Password</Link>
        <Link to="/verify-reset-code">Verify Reset Code</Link>
        <Link to="/reset-password">Reset Password</Link>
      </div>
    </div>
  );
}

export default Home;
