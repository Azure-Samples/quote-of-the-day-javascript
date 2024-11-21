import React from "react";
import { useState, useEffect, useContext } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { AppContext } from "./AppContext";

function Home() {
  const { featureManager, currentUser } = useContext(AppContext);
  const [liked, setLiked] = useState(false);
  const [variant, setVariant] = useState(undefined);

  useEffect(() => {
    const init = async () => {
      const response = await fetch(
        `/api/variant?userId=${currentUser ?? ""}`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const result = await response.json();
        setVariant(result);
      } else {
        console.error("Failed to get variant.");
      }
      setLiked(false);
    };

    init();
  }, [featureManager, currentUser]);

  const handleClick = async () => {
    if (!liked) {
      try {
        const response = await fetch("/api/logEvent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ TargetingId: currentUser ?? "" }),
        });

        if (response.ok) {
          console.log("Event logged successfully");
        } else {
          console.error("Failed to log event");
        }
      } catch (error) {
        console.error("Error logging event:", error);
      }
    }
    setLiked(!liked);
  };

  return (
    <div className="quote-card">
      { variant ?
        ( 
        <>
          <h2>
            <>{variant.configuration ?? "Quote of the Day"}</>
          </h2>
          <blockquote>
            <p>"You cannot change what you are, only what you do."</p>
            <footer>— Philip Pullman</footer>
          </blockquote>
          <div className="vote-container">
            <button className="heart-button" onClick={handleClick}>
              {liked ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>
        </> 
        ) 
        : <p>Loading</p>       
      }
    </div>
  );
}

export default Home;