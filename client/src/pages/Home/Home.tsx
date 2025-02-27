import { Link } from "react-router-dom";
import "./Home.scss";

function Home() {
  return (
    <div>
      <h1>لا إله إلا الله</h1>
      <Link to="/login">Login</Link>
    </div>
  );
}

export default Home;
