import React from "react";

export default function Pricing({ priceLevel = 0 }) {
  const priceLevelNum = +(priceLevel || 0);

  return !priceLevelNum ? null : (
    <>
      {Array.from({ length: priceLevelNum }, (_, i) => i + 1).map(
        (priceLevel) => (
          <span key={priceLevel}>$</span>
        )
      )}
    </>
  );
}
