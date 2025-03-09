import "./Card.scss";

function Card() {
  return (
    <div>
      <div className="card">
        <div className="image">
          <img
            src="https://www.wearegecko.co.uk/media/50316/mountain-3.jpg"
            alt="Card 1"
          />
        </div>
        <div className="content">
          <p className="description">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nulla,
            iusto?
          </p>
          <p className="price">EGP 329.00</p>
          <p className="price-before">EGP 799.00</p>
          <p className="quantity">28 items left</p>
          <div className="progress"></div>
        </div>
      </div>
    </div>
  );
}

export default Card;
