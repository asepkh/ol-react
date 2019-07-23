// demo: http://viglino.github.io/ol-ext/examples/control/map.switcher.switcher.html
import React, {useState, useContext, useEffect} from 'react'
import PropTypes from 'prop-types'
import {MapContext} from '../map-context'
import olextLayerSwitcher from 'ol-ext/control/LayerSwitcher'
import 'ol-ext/control/LayerSwitcher.css'

const LayerSwitcher = (props) => {
    const map = useContext(MapContext)
    const [switcher, setSwitcher] = useState(new olextLayerSwitcher(props));
    useEffect(() => {
        map.addControl(switcher);
        return () => {
            map.removeControl(switcher);
        }
    }, []);

    const setTarget = element => {
        switcher.setTarget(element);
    }

    return (
        <div ref={setTarget} className="ol-layerswitcher"></div>
    );
}
LayerSwitcher.propsTypes = {
    extent: PropTypes.bool,
    setHeader: PropTypes.func,
    show_progress: PropTypes.bool,
};
export default LayerSwitcher;