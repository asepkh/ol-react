import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {MapProvider} from '../src/map-context'
import Select from 'react-select'
import {Container, Row, Col, Button} from 'reactstrap'
import BootstrapTable from 'react-bootstrap-table-next'
import {Map as olMap, View as olView, Collection} from 'ol'
import {bbox as bboxStrategy} from 'ol/loadingstrategy'
import {toStringXY, toStringHDMS} from 'ol/coordinate'
import {click, platformModifierKeyOnly} from 'ol/events/condition'
import {Style, RegularShape, Circle, Text, Fill, Stroke} from 'ol/style'
import {Map, source, Feature, control, interaction, layer} from '../src';
import Popup from 'ol-ext/overlay/Popup'
import {DataLoader} from '../src/source/dataloaders'

import {myGeoServer,workspace, astoria_wm, wgs84} from '../src/constants'
import {toLonLat, fromLonLat, transform} from 'ol/proj'
import {astoria_ll, MINZOOM} from '../src/constants'
const DEFAULT_CENTER = astoria_ll
const DEFAULT_ZOOM = 14;

const taxlotsKey      = 'taxlotkey';
const taxlotsColumns  = [
    {dataField: 'taxlotkey',  text: 'Taxlot Key'},
    {dataField: 'account_id', text: 'Account'},
    {dataField: 'taxlot',     text: 'Taxlot'},
    {dataField: 'owner_line', text: 'Owner'},
    {dataField: 'situs_addr', text: 'Situs Address'},
]
const taxlotPopupField = 'situs_addr';


// CC service only works inside firewall
// Adding a CORS compliant header, which does not seem to have helped.
// https://www.paulleasure.com/ajax-web-design/cors-how-to-set-http-response-header-on-iis-windows-server-2012-r2-to-access-control-allow-origin/
// const taxlots = "https://cc-gis.clatsop.co.clatsop.or.us/arcgis/rest/services/Assessment_and_Taxation/Taxlots_3857/FeatureServer/"
/*
const taxlotsService  = "https://cc-gis.clatsop.co.clatsop.or.us/arcgis/rest/services/Taxlots/FeatureServer"
const taxlotsLabels   = taxlotsService + "/0";
const taxlotsFeaturesUrl = taxlotsService + "/1";
const taxlotsFormat   = 'esrijson';
*/

// To generate this URL, go into GeoServer Layer Preview,
// and in All Formats, select "WFS GeoJSON(JSONP)" then paste here and
// clip off the outputFormat and maxFeatures attributes (maxFeatures=50&outputFormat=text%2Fjavascript
const taxlotsUrl = myGeoServer + '/ows?service=WFS&version=1.0.0&request=GetFeature'
    + '&typeName=' + workspace + '%3Ataxlots'
const taxlotsFormat = 'geojson'

const esriService = "https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/" +
    "Specialty/ESRI_StateCityHighway_USA/MapServer"

let transformfn = (coordinates) => {
    for (let i = 0; i < coordinates.length; i+=2) {
        coordinates[i]   += astoria_wm[0];
        coordinates[i+1] += astoria_wm[1];
    }
    return coordinates
}

const astoriagis = "https://gis.astoria.or.us/cgi-bin/mapserv.exe?SERVICE=WMS&VERSION=1.1.1"
    + "&MAP=%2Fms4w%2Fapps%2Fastoria31_Public%2Fhtdocs%2Fastoria31%2Fmaps%2F.%2Fair_2015.map&LAYERS=air_2015";

const taxlotStyle = new Style({ // pink w black outline
    stroke: new Stroke({color: 'rgba(255, 0, 0, 1.0)', width:1}),
    fill:   new Fill({color: 'rgba(255, 0, 0, .1)'}), // no fill = not selectable
});
const selectedStyle = new Style({ // yellow
    stroke: new Stroke({color: 'rgba(255, 255, 0, 1.0)', width:2}),
    fill:   new Fill({color: 'rgba(255, 255, 0, .001)'}),
});

const Example2 = ({}) => {
    const [theMap, setTheMap] = useState(new olMap({
        view: new olView({ center: fromLonLat(DEFAULT_CENTER), zoom: DEFAULT_ZOOM}),
        //controls: [],
    }));
    const [center, setCenter] = useState(fromLonLat(astoria_ll));
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    const [resolution, setResolution] = useState(0)

    const [taxlotsVisible, setTaxlotsVisible] = useState(false);
    const [selectCount, setSelectCount] = useState(0);
    const [enableModify, setEnableModify] = useState(false) // not implemented yet
    const [rows, setRows] = useState([]) // rows in table
    const view = theMap.getView();

    const [popup, setPopup] = useState(new Popup());
    const [popupPosition, setPopupPosition] = useState([0,0]) // location on screen
    const [popupText, setPopupText] = useState("HERE") // text for popup

    let taxlotLayer = null;

    useEffect(() => {
        theMap.addOverlay(popup);

        const layers = theMap.getLayers();
        layers.forEach(layer => {
            if (layer.get("title") == 'Taxlots')
                taxlotLayer = layer;
        })
    }, []);


// IMPROVEMENT
// https://openlayers.org/en/latest/apidoc/module-ol_interaction_Select-Select.html
// I need to look at this code to support adding AND removing features
// in the current selection set.

   const myCondition = (e) => {
        switch(e.type) {
            case 'click':
                return true;

            case 'pointermove':
                // roll over - just show taxlot popup
                const lonlat = toLonLat(e.coordinate)
                const features = taxlotLayer.getSource().getFeaturesAtCoordinate(e.coordinate)
                if (features.length > 0) {
                    const text = features[0].get(taxlotPopupField)
                    if (text != null && text.length > 0) {
                        popup.show(e.coordinate, text);
                        return false;
                    }
                }
                popup.hide();
                return false; // don't do a selection!

//            case 'platformModifierKeyOnly':
//                return false;
        }
        console.log("mystery", e);
        return false; // pass event along I guess
    }

    const handleMove = (mapEvent) => {
        //setRotation(view.getRotation())
        setZoom(view.getZoom());
        setCenter(view.getCenter());
        const viewres = view.getResolution().toFixed(2)
        setResolution(viewres);

        let maxres = taxlotLayer.get("maxResolution");
        setTaxlotsVisible(maxres >= viewres);

        mapEvent.stopPropagation();
    };

    const copyFeaturesToTable = (features) => {
        const rows = [];
        if (features.getLength()) {
            features.forEach( (feature) => {
                const attributes = {};
                // Copy the data from each feature into a list
                taxlotsColumns.forEach ( (column) => {
                    attributes[column.dataField] = feature.get(column.dataField);
                });
                rows.push(attributes)
            });
        }
        setRows(rows);
    }

    const selectedFeatures = new Collection()
    const onSelectEvent = (e) => {
        console.log("onSelectEvent", e.mapBrowserEvent.coordinate)
        const s = selectedFeatures.getLength();
        setSelectCount(s);
        if (s) {
            popup.show(e.mapBrowserEvent.coordinate, selectedFeatures.item(0).get("taxlot").trim());
        } else {
            popup.hide()
        }
        copyFeaturesToTable(selectedFeatures)
    }

    const coordFormatter = (coord) => {
		return toStringXY(coord, 4);
	}

    return (
        <>
            <h2>Example 2</h2>
                <ul>
                    <li>Image ArcGIS REST: United States map</li>
                    <li>Image WMS: City of Astoria aerial photos</li>
                    <li>Taxlots Feature Server (WFS or ESRI Rest) <b>{taxlotsVisible?"":"Zoom in to see taxlots"}</b></li>
                </ul>
                Controls: MousePosition <br />
                Interactions: Select, SelectDragBox
                <b>{(selectCount>0)? (selectCount + " selected features") :""}</b>
                <br />

                <MapProvider map={theMap}>
                <Container>
                    <Row><Col>
        	        <Map center={astoria_wm} zoom={zoom} onMoveEnd={handleMove}>

                        <layer.Tile title="OpenStreetMap"><source.OSM/></layer.Tile>

                        <layer.Image title="City of Astoria 2015" visible={false}>
                            <source.ImageWMS url={astoriagis}/>
                        </layer.Image>

                        <layer.Vector title="Taxlots" style={taxlotStyle} maxResolution={10}>
                            <source.JSON url={taxlotsUrl} loader={taxlotsFormat}>
                                <interaction.Select features={selectedFeatures} style={selectedStyle} condition={myCondition} selected={onSelectEvent}/>
                                <interaction.SelectDragBox features={selectedFeatures} style={selectedStyle} condition={platformModifierKeyOnly} selected={onSelectEvent}/>
                            </source.JSON>
                        </layer.Vector>

                        <control.MousePosition projection={wgs84} coordinateFormat={coordFormatter}/>
                        <control.Attribution />
                    </Map>
                    </Col><Col>
                    <control.LayerSwitcher show_progress={true} collapsed={false} collapsible={false}/>
                    </Col></Row>
                    <Row><Col>
                        <BootstrapTable bootstrap4 striped condensed
                        keyField={taxlotsKey} columns={taxlotsColumns} data={rows}/>
                    </Col></Row>
                </Container>
                </MapProvider>

            </>
        );
}
export default Example2;
