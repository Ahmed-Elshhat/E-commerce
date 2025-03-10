import Skeleton from "react-loading-skeleton";
import "./CardSkeleton.scss";

type CardSkeletonProps = { countOfCards: number };

function CardSkeleton({ countOfCards }: CardSkeletonProps) {
  return (
    <div className="cards-skeleton">
      {[...Array(countOfCards)].map((_, i) => (
        <div className="card" key={i}>
          <div className="image">
            <Skeleton width={230} height={150} />
          </div>
          <div className="content">
            <p className="description">
              <Skeleton width={200} height={15} style={{ marginTop: "10px" }} />
            </p>
            <p className="price">
              <Skeleton width={70} height={15} style={{ marginTop: "10px" }} />
            </p>
            <p className="price-before">
              <Skeleton width={60} height={15} />
            </p>
            <p className="quantity">
              <Skeleton
                width={50}
                height={15}
                style={{ marginTop: "10px", marginBottom: "10px" }}
              />
            </p>
            <div className="progress">
              <Skeleton width={50} height={10} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CardSkeleton;
