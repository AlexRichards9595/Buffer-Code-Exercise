import Api from "./Api";
import actions from "./actions";

window.Api = Api;

class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.onChangeCallbacks = [];
  }

  getState(key) {
    if (key) {
      return this.state[key];
    }
    return this.state;
  }

  setState(key, value) {
    this.state[key] = value;
    this.emitChange();
  }

  onChange(callback) {
    this.onChangeCallbacks.push(callback);
  }

  emitChange() {
    this.onChangeCallbacks.forEach((callback) => {
      callback();
    });
  }

  handleError(err) {
    console.error(err);
  }

  dispatch(action) {
    switch (action.type) {
      case actions.LOAD_UPDATES:
        const loaded = this.getState("updates") ? this.getState("updates").length : 0;
        Api.get("getUpdates", {loaded})
          .then((updates) => {
            this.getState("updates") ?
              this.setState("updates", this.getState("updates").concat(updates)) :
              this.setState("updates", updates)
          })
          .catch(this.handleError);
        break;
      case actions.LOAD_ANALYTICS:
        Api.get("getAnalyticsTimeseries")
          .then((timeseries) => {
            this.setState("analyticsTimeseries", timeseries);
          })
          .catch(this.handleError);
        break;
    }
  }
}

export default Store;
