import Card from "./Card/Card";
import "./Cards.scss";

type CardsProps = {
  products: {
    _id: number;
    coverImage: string;
    descriptionAr: string;
    price: number;
    quantity: number;
    sold: number;
    priceAfterDiscount: number;
  }[];
};

function Cards({ products }: CardsProps) {
  return (
    <div className="cards">
      {products.map((product) => (
        <Card key={product._id} product={product} />
      ))}
    </div>
  );
}

export default Cards;
