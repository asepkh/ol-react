import React from 'react';
import PropTypes from 'prop-types';

import {MouseWheelZoom as olMouseWheelZoom} from 'ol/interaction';

import OLInteraction from './ol-interaction';

export default class MouseWheelZoom extends OLInteraction {
  createInteraction (props) {
    return new olMouseWheelZoom({
      duration: props.duration,
      useAnchor: props.useAnchor
    })
  }
}

MouseWheelZoom.propTypes = Object.assign({}, OLInteraction.propTypes, {
  duration: PropTypes.number,
  useAnchor: PropTypes.bool
})
