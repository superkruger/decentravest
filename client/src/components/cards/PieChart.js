
import {isEqual} from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'

import * as am4core from "@amcharts/amcharts4/core"
import * as am4charts from "@amcharts/amcharts4/charts"
import am4themes_animated from "@amcharts/amcharts4/themes/animated"

am4core.useTheme(am4themes_animated);

class PieChart extends Component {

  componentDidMount() {
    this.chartContainer = buildChart(this.props);
  }

  componentWillUnmount() {
    if (this.chartContainer) {
      this.chartContainer.dispose();
    }
  }

  componentDidUpdate(oldProps) {

    if ((oldProps.chartkey === null && this.props.chartkey !== null)
        || ( oldProps.chartkey !== null && this.props.chartkey !== null && JSON.stringify(oldProps.chartkey) !== JSON.stringify(this.props.chartkey))) {
        if (this.chartContainer) {
          this.chartContainer.dispose();
        }
        this.chartContainer = buildChart(this.props);
        return;
    }

    if(!isEqual(oldProps.data, this.props.data)) {
        setChartData(this.chartContainer, this.props.data);
        return;
    }
  }

  render() {
    const {title, data, chartkey} = this.props

    return (
      <div>
        <div className="card shadow mb-4">
          {/* Card Header - Dropdown */}
          <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
            <h6 className="m-0 font-weight-bold text-primary">{title}</h6>
          </div>
          {/* Card Body */}
          <div className="card-body">
            {
              data.length > 0
              ?
                <div id={`${chartkey}-piechartdiv`} style={{ width: "100%", height: "200px" }} />
              :
                <div>No data</div>
            }
          </div>
        </div>
      </div>
    )
  }
}

function buildChart(props) {
    const {chartkey} = props;

    let container = am4core.create(chartkey + "-piechartdiv", am4core.Container);
    container.width = am4core.percent(100);
    container.height = am4core.percent(100);
    container.layout = "vertical";

    createPieChart(container, props);

    return container;
}

function setChartData(container, data) {
    let child = container.children.values[0]
    if (child) {
        child.data = data
        child.invalidateData()
    }
}

function createPieChart(container, props) {
  const {data} = props;

  let chart = container.createChild(am4charts.PieChart);

  chart.data = data;

  // Add and configure Series
  var pieSeries = chart.series.push(new am4charts.PieSeries());
  pieSeries.dataFields.value = "value";
  pieSeries.dataFields.category = "category";
  pieSeries.slices.template.stroke = am4core.color("#fff");
  pieSeries.slices.template.strokeOpacity = 1;

  // This creates initial animation
  pieSeries.hiddenState.properties.opacity = 1;
  pieSeries.hiddenState.properties.endAngle = -90;
  pieSeries.hiddenState.properties.startAngle = -90;

  chart.hiddenState.properties.radius = am4core.percent(0);
}

function mapStateToProps(state, ownProps) {
  return {
    title: ownProps.title,
    data: ownProps.data,
    chartkey: ownProps.chartkey
  }
}

export default connect(mapStateToProps)(PieChart)
