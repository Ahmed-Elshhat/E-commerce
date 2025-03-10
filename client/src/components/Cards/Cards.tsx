import Card from "./Card/Card";
import "./Cards.scss";

type CardsProps = {
  products: {
    id: number;
  }[];
};

function Cards({ products }: CardsProps) {
  return (
    <div className="cards">
      {products.map((product) => (
        <Card key={product.id} product={product} />
      ))}
    </div>
  );
}

export default Cards;
