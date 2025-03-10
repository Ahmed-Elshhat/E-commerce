import "./Forbidden.scss";

const Forbidden = () => {
  return (
    <div className="forbidden">
      <div className="stars"></div>
      <div className="twinkling"></div>
      <div className="glitch">
        <h1>403</h1>
        <h2>ACCESS DENIED</h2>
        <p>Oops! You don’t have permission to access this page.</p>
        <a href="/" className="home-btn">
          Go Back
        </a>
      </div>
    </div>
  );
};

export default Forbidden;
