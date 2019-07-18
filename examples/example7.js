import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Map, Feature, Graticule, control, geom, layer, source} from '../src'
import stylefunction from 'ol-mapbox-style/stylefunction'
import {Fill, Icon, Stroke, Style, Text} from 'ol/style'
import {Converter} from 'usng.js'
import {myGeoServer, astoria_wm, usngPrecision, wm, wgs84} from '../src/constants'
import {MapProvider} from '../src/map-context'
import {createMapboxStreetsV6Style} from '../src/mapbox-streets-v6-style'

import {Map as olMap, View as olView} from 'ol'
import {toLonLat, fromLonLat, transform} from 'ol/proj'
import {MINZOOM, MAXZOOM, astoria_ll} from '../src/constants'
const DEFAULT_CENTER = astoria_ll;
const DEFAULT_ZOOM = 12;

const usngConverter = new Converter

const mapbox_key = process.env.MAPBOX_KEY;
const mapboxStreetsUrl = 'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/'
        + '{z}/{x}/{y}.vector.pbf?access_token=' + mapbox_key

const taxlotsLayer = 'clatsop_wm%3Ataxlots'
const taxlotsUrl = myGeoServer + '/gwc/service/tms/1.0.0/'
        + taxlotsLayer
        + '@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf';

const Example7 = ({}) => {
    const [theMap, setTheMap] = useState(new olMap({
            view: new olView({center: fromLonLat(DEFAULT_CENTER), zoom: DEFAULT_ZOOM}),
            loadTilesWhileAnimating:true,loadTilesWhileInteracting:true,
        })
    );

    const handleEvent = (e) => {
        console.log("Map.handleEvent", e)
        //e.stopPropagation(); // this stops draw interaction
    }

    const coordFormatter = (coord) => {
        const zoom = 6;
        const ll = toLonLat(coord)
        return usngConverter.LLtoUSNG(ll[1], ll[0], usngPrecision[zoom]);
    }
    const pointStyle = {
        image: {
            type: 'circle',
            radius: 4,
            fill: { color: [100,100,100, 0.5] },
            stroke: { color: 'green', width: 1 }
        }
    };
    const multipointStyle = {
        image: {
            type: 'circle',
            radius: 4,
            fill: { color: [0,0,255, 0.4] },
            stroke: { color: 'red', width: 1 }
        }
    };
    const lineStyle = {
        stroke: {
            color: [255, 255, 0, 1],
            width: 3
        }
    };
    const polyStyle = {
        stroke: {color: [0, 0, 0, 1], width:4},
        fill: {color: [255, 0, 0, .250]},
    };
    const mb6style = createMapboxStreetsV6Style(Style, Fill, Stroke, Icon, Text);

    return (
        <>
            <h2>Example7</h2>
                <b>{(typeof mapbox_key === 'undefined')? "The mapbox key is undefined!" : ""}</b>

                <h4>Vector tiles</h4>
                    <ul>
                    <li> Graticule </li>
                    <li> Taxlots from geoserver</li>
                    <li> Tile source: Mapbox</li>
                    </ul>

                <MapProvider map={theMap}>
                <Map zoom={DEFAULT_ZOOM} center={astoria_wm} minZoom={MINZOOM} maxZoom={MAXZOOM} onMoveEnd={handleEvent}>
                    <Graticule showLabels={true} maxLines={100} targetSize={50}/>

                    <layer.VectorTile title="Mapbox Vector Tile Streets" style={mb6style} declutter={true}>
                        <source.VectorTile url={mapboxStreetsUrl}/>
                    </layer.VectorTile>

                    <layer.VectorTile title="Taxlots" declutter={true} crossOrigin="anonymous">
                        <source.VectorTile url={taxlotsUrl}/>
                    </layer.VectorTile>

                    <control.MousePosition projection={wgs84} coordinateFormat={coordFormatter}/>
                </Map>
                </MapProvider>
        </>
    );
}
export default Example7;
