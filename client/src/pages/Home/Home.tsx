import { Link } from "react-router-dom";
import "./Home.scss";
import Skeleton from "react-loading-skeleton";
function Home() {
  return (
    <div className="Home">
      <h1>لا إله إلا الله</h1>
      <Skeleton circle width={50} height={50} />
      <Skeleton width={50} height={50} />
      <Skeleton width="100%" height={20} />
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
