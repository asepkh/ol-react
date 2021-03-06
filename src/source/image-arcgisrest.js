import React, {useState, useContext, useEffect} from 'react';  // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'
import {ImageArcGISRest as olImageArcGISRest} from 'ol/source'
import {LayerContext} from '../layer-context'

const ImageArcGISRest = (props) => {
    const layer = useContext(LayerContext);
    const [source] = useState(new olImageArcGISRest(props));

    useEffect(() => {
        layer.setSource(source);
    }, []);

    return null; // Nothing needs to be rendered here.
}
ImageArcGISRest.propTypes =  {
    url: PropTypes.string,
    attributions: PropTypes.oneOfType([PropTypes.string, PropTypes.func,
        PropTypes.arrayOf(PropTypes.string)]),
    crossOrigin: PropTypes.string, // null | '' | "anonymous" |
    params: PropTypes.string,
    projection: PropTypes.string,
    resolutions: PropTypes.arrayOf(PropTypes.number),
};
export default ImageArcGISRest;
