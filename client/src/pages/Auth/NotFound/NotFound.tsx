import "./NotFound.scss";

const NotFound = () => {
  return (
    <div className="not-found">
      <div className="stars"></div>
      <div className="twinkling"></div>
      <div className="glitch">
        <h1>404</h1>
        <h2>PAGE NOT FOUND</h2>
        <p>Oops! Looks like you’re lost in space...</p>
        <a href="/" className="home-btn">Take Me Home</a>
      </div>
    </div>
  );
};

export default NotFound;
