import React, {useEffect, useState} from "react";

const AnalyticsSummary = props => {
  const [data, setData] = useState({});
  const [items, setItems] = useState([]);

  const getAnalyticsSummaryData= (updates = []) => {
    return updates.reduce(
      (data, update) => {
        return {
          retweets:
            data.retweets +
            (update.statistics ? update.statistics.retweets : 0),
          favorites:
            data.favorites +
            (update.statistics ? update.statistics.favorites : 0),
          clicks:
            data.clicks + (update.statistics ? update.statistics.clicks : 0),
        };
      },
      {
        retweets: 0,
        favorites: 0,
        clicks: 0,
      }
    );
  }

  useEffect(() => {
    setData(getAnalyticsSummaryData(props.updates));
  }, [props]);

  useEffect(() => {
    setItems([
      {
        value: 2,
        name: "Posts",
      },
      {
        value: data.retweets,
        name: "Retweets",
      },
      {
        value: data.favorites,
        name: "Favorites",
      },
      {
        value: data.clicks,
        name: "Clicks",
      },
    ]);
  }, [data]);

    if (!props.updates) {
      return <div className="analytics-summary">Loading...</div>;
    }

    return (
      <div className="analytics-summary">
        {items.map((item, idx) => (
          <div className="analytics-item" key={idx}>
            <div className="analytics-item-value">{item.value}</div>
            <div className="analytics-item-name">{item.name}</div>
          </div>
        ))}
      </div>
    );
  }

export default AnalyticsSummary;
