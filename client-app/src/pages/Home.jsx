// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { useState, useEffect, useContext } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { trackEvent } from "@microsoft/feature-management-applicationinsights-browser";
import { AppContext } from "./AppContext";

function Home() {
  const { appInsights, appConfig, featureManager, currentUser, lastRefresh } = useContext(AppContext);
  const [liked, setLiked] = useState(false);
  const [variant, setVariant] = useState(undefined);

  const quote = {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  };

  useEffect(() => {
    const init = async () => {  
      const variant = await featureManager?.getVariant("Greeting", { userId: currentUser });
      setVariant(variant);
      setLiked(false);
    };

    init();
  }, [appConfig, featureManager, currentUser, lastRefresh]);

  const handleLike = () => {
    if (!liked) {
      const targetingId = currentUser;
      trackEvent(appInsights, targetingId, { name: "Like" });
    }
    setLiked(!liked);
  };

  return (
    <div className="quote-card">
      { variant ?
        ( 
        <>
          <h2>
            { variant.name === "On" ? 
              ( <>Hi <b>{currentUser ?? "Guest"}</b>, hope this makes your day!</> ) :
              ( <>Quote of the day</> ) }
          </h2>
          <blockquote>
            <p>"You cannot change what you are, only what you do."</p>
            <footer>— Philip Pullman</footer>
          </blockquote>
          <div className="vote-container">
            <button className="heart-button" onClick={handleLike}>
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