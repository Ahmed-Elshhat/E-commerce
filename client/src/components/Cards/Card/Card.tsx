import "./Card.scss";

type CardProps = {
  product: {
    _id: number;
    imageCover: string;
    description: string;
    price: number;
    quantity: number;
    sold: number;
    priceAfterDiscount: number;
  };
};

function Card({ product }: CardProps) {
  return (
    <div>
      <div className="card">
        <div className="image">
          <img src={product.imageCover} alt="Card 1" />
        </div>
        <div className="content">
          <p className="description">{product.description}</p>
          <p className="price">
            EGP{" "}
            {product.priceAfterDiscount !== undefined
              ? `${product.priceAfterDiscount}`
              : `${product.price}`}
          </p>
          <p className="price-before">
            {product.priceAfterDiscount !== undefined && `EGP ${product.price}`}
          </p>
          <p className="quantity">{product.quantity} items left</p>
          <div
            className="progress"
            style={
              {
                "--progress-width": `${
                  (product.quantity / (product.sold + product.quantity)) * 100
                }%`,
              } as React.CSSProperties
            }
          ></div>
        </div>
      </div>
    </div>
  );
}

export default Card;
