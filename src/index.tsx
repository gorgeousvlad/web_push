import * as React from "react";
import * as ReactDOM from "react-dom";

import { Subscription } from './components/subscription/';

ReactDOM.render(
  <div className='container'>
    <Subscription/>
  </div>,
  document.getElementById('app-container'),
);
