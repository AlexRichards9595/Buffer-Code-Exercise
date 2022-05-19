import React, { Component } from "react";
import Update from "./Update";
import actions from "../actions";

class UpdateList extends Component {
  render() {
    if (!this.props.updates || !this.props.updates.length) {
      return <p>You have no updates</p>;
    }
    return (
      <div className="update-list">
        {this.props.updates.map((update, idx) => (
          <Update {...update} key={idx} />
        ))}
        <button onClick={() => this.props.dispatch({ type: actions.LOAD_UPDATES })}>Load More</button>
      </div>
    );
    return;
  }
}

export default UpdateList;
